import express from "express";
import { supabase } from "../db/supabase.js";
import { requireAuth, requireClubAdmin, requireSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/clubs — list all clubs
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .order("name");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/clubs/:id — club detail + upcoming events
router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("clubs")
    .select("*, events(*, rsvps(count))")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(404).json({ error: "Club not found" });
  res.json(data);
});

// POST /api/clubs — create club (super admin only, or self-register flow)
router.post("/", requireAuth, async (req, res) => {
  const { name, description, category, instagram, email } = req.body;
  const { data, error } = await supabase
    .from("clubs")
    .insert({ name, description, category, instagram, email, verified: false })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });

  // Make creator an admin of the new club
  await supabase.from("club_admins").insert({ user_id: req.user.id, club_id: data.id });
  // Upgrade their role
  await supabase.from("profiles").update({ role: "club_admin" }).eq("id", req.user.id);

  res.status(201).json(data);
});

// GET /api/clubs/:id/events — all events for this club
router.get("/:id/events", async (req, res) => {
  const { data, error } = await supabase
    .from("events")
    .select("*, rsvps(count)")
    .eq("club_id", req.params.id)
    .eq("is_published", true)
    .order("event_date");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/clubs/admin/my-club — club admin's own club data + all events (incl. unpublished)
router.get("/admin/my-club", requireClubAdmin, async (req, res) => {
  const { data: adminRecord } = await supabase
    .from("club_admins")
    .select("club_id")
    .eq("user_id", req.user.id)
    .single();

  if (!adminRecord) return res.status(404).json({ error: "No club linked to this account" });

  const { data, error } = await supabase
    .from("clubs")
    .select("*, events(*)")
    .eq("id", adminRecord.club_id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/clubs/eating — eating club status for today
router.get("/eating/status", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("eating_clubs")
    .select("*, eating_club_status!left(is_open, hours, guest_policy, notes, upvotes)")
    .eq("eating_club_status.status_date", today)
    .order("prospect_order");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/clubs/eating/:clubId/status — submit tonight's status
router.post("/eating/:clubId/status", requireAuth, async (req, res) => {
  const { is_open, hours, guest_policy, notes } = req.body;
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("eating_club_status")
    .upsert({
      club_id: req.params.clubId,
      status_date: today,
      is_open, hours, guest_policy, notes,
      submitted_by: req.user.id,
      upvotes: 0,
    }, { onConflict: "club_id,status_date" })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
