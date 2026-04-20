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

// ══════════════════════════════════════════════
// Club admin applications
// ══════════════════════════════════════════════

// Helper: which clubs is this user an admin of? (returns array of club_ids)
async function adminClubIds(userId) {
  const { data } = await supabase
    .from("club_admins")
    .select("club_id")
    .eq("user_id", userId);
  return (data || []).map((r) => r.club_id);
}

async function isSuperAdmin(userId) {
  const { data } = await supabase
    .from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "super_admin";
}

// POST /api/clubs/admin/apply — logged-in user applies to be admin of a club
// Body: { club_id, message }
router.post("/admin/apply", requireAuth, async (req, res) => {
  const { club_id, message } = req.body;
  if (!club_id) return res.status(400).json({ error: "club_id is required" });

  // Already an admin of that club?
  const { data: existingAdmin } = await supabase
    .from("club_admins")
    .select("user_id")
    .eq("user_id", req.user.id)
    .eq("club_id", club_id)
    .maybeSingle();
  if (existingAdmin) {
    return res.status(409).json({ error: "You're already an admin of this club" });
  }

  // Already has a pending application?
  const { data: existingApp } = await supabase
    .from("club_admin_applications")
    .select("id")
    .eq("user_id", req.user.id)
    .eq("club_id", club_id)
    .eq("status", "pending")
    .maybeSingle();
  if (existingApp) {
    return res.status(409).json({ error: "You already have a pending application for this club" });
  }

  const { data, error } = await supabase
    .from("club_admin_applications")
    .insert({
      user_id: req.user.id,
      club_id,
      message: message || null,
      status: "pending",
    })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /api/clubs/admin/applications/mine — what I've applied to
router.get("/admin/applications/mine", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("club_admin_applications")
    .select("*, clubs(id, name, logo_url)")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/clubs/admin/applications — applications I'm allowed to review
// Query: ?status=pending|approved|rejected (default: pending)
router.get("/admin/applications", requireClubAdmin, async (req, res) => {
  const status = req.params.status || req.query.status || "pending";
  const superAdmin = await isSuperAdmin(req.user.id);

  let query = supabase
    .from("club_admin_applications")
    .select("*, clubs(id, name, logo_url), profiles!club_admin_applications_user_id_fkey(id, name, email, class_year, avatar_url)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (!superAdmin) {
    const clubIds = await adminClubIds(req.user.id);
    if (clubIds.length === 0) return res.json([]);
    query = query.in("club_id", clubIds);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/clubs/admin/applications/:id/approve
router.post("/admin/applications/:id/approve", requireClubAdmin, async (req, res) => {
  const { data: app, error: fetchErr } = await supabase
    .from("club_admin_applications")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (fetchErr || !app) return res.status(404).json({ error: "Application not found" });
  if (app.status !== "pending") {
    return res.status(409).json({ error: `Application already ${app.status}` });
  }

  // Permission check: super_admin OR existing admin of that club
  const superAdmin = await isSuperAdmin(req.user.id);
  if (!superAdmin) {
    const { data: meAdmin } = await supabase
      .from("club_admins")
      .select("user_id")
      .eq("user_id", req.user.id)
      .eq("club_id", app.club_id)
      .maybeSingle();
    if (!meAdmin) return res.status(403).json({ error: "You can only approve applications for clubs you admin" });
  }

  // 1. Add to club_admins (idempotent — ignore conflict)
  await supabase
    .from("club_admins")
    .upsert({ user_id: app.user_id, club_id: app.club_id }, { onConflict: "user_id,club_id" });

  // 2. Upgrade profile role to club_admin (if not already higher)
  const { data: applicantProfile } = await supabase
    .from("profiles").select("role").eq("id", app.user_id).single();
  if (applicantProfile?.role === "student") {
    await supabase.from("profiles")
      .update({ role: "club_admin" })
      .eq("id", app.user_id);
  }

  // 3. Mark application approved
  const { data: updated, error: updErr } = await supabase
    .from("club_admin_applications")
    .update({
      status: "approved",
      reviewed_by: req.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", app.id)
    .select().single();
  if (updErr) return res.status(500).json({ error: updErr.message });

  res.json(updated);
});

// POST /api/clubs/admin/applications/:id/reject
router.post("/admin/applications/:id/reject", requireClubAdmin, async (req, res) => {
  const { data: app, error: fetchErr } = await supabase
    .from("club_admin_applications")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (fetchErr || !app) return res.status(404).json({ error: "Application not found" });
  if (app.status !== "pending") {
    return res.status(409).json({ error: `Application already ${app.status}` });
  }

  const superAdmin = await isSuperAdmin(req.user.id);
  if (!superAdmin) {
    const { data: meAdmin } = await supabase
      .from("club_admins")
      .select("user_id")
      .eq("user_id", req.user.id)
      .eq("club_id", app.club_id)
      .maybeSingle();
    if (!meAdmin) return res.status(403).json({ error: "You can only reject applications for clubs you admin" });
  }

  const { data: updated, error: updErr } = await supabase
    .from("club_admin_applications")
    .update({
      status: "rejected",
      reviewed_by: req.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", app.id)
    .select().single();
  if (updErr) return res.status(500).json({ error: updErr.message });

  res.json(updated);
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
