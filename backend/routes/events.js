import express from "express";
import multer from "multer";
import { supabase } from "../db/supabase.js";
import { requireAuth, requireClubAdmin } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/events — fetch all published events (with RSVP counts)
router.get("/", async (req, res) => {
  const { category, source, date_from, date_to, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from("events")
    .select(`
      *,
      clubs ( id, name, logo_url, verified ),
      rsvps ( count )
    `)
    .eq("is_published", true)
    .order("event_date", { ascending: true })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (category) query = query.eq("category", category);
  if (source)   query = query.eq("source", source);
  if (date_from) query = query.gte("event_date", date_from);
  if (date_to)   query = query.lte("event_date", date_to);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/events/:id
router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("events")
    .select("*, clubs(*), rsvps(count)")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "Event not found" });
  res.json(data);
});

// POST /api/events — club admin creates an event with optional flyer image
router.post("/", requireClubAdmin, upload.single("flyer"), async (req, res) => {
  const {
    title, description, category, venue,
    event_date, start_time, end_time,
    banner_emoji, banner_bg, ticket_price,
    ticket_url, guest_policy, capacity, club_id,
  } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({ error: "title and event_date are required" });
  }

  // Upload flyer image to Supabase Storage if provided
  let banner_url = null;
  if (req.file) {
    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("flyers")
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) return res.status(500).json({ error: "Flyer upload failed: " + uploadError.message });

    const { data: urlData } = supabase.storage.from("flyers").getPublicUrl(fileName);
    banner_url = urlData.publicUrl;
  }

  const { data, error } = await supabase.from("events").insert({
    title, description, category, venue,
    event_date, start_time, end_time,
    banner_url, banner_emoji, banner_bg,
    ticket_price: ticket_price ? Number(ticket_price) : null,
    ticket_url, guest_policy,
    capacity: capacity ? Number(capacity) : null,
    club_id: club_id || null,
    source: "club",
    created_by: req.user.id,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/events/:id — update event (creator or super_admin)
router.patch("/:id", requireClubAdmin, upload.single("flyer"), async (req, res) => {
  const updates = { ...req.body, updated_at: new Date().toISOString() };

  if (req.file) {
    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s/g, "_")}`;
    await supabase.storage.from("flyers").upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
    const { data: urlData } = supabase.storage.from("flyers").getPublicUrl(fileName);
    updates.banner_url = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", req.params.id)
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/events/:id
router.delete("/:id", requireClubAdmin, async (req, res) => {
  const { error } = await supabase.from("events").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
