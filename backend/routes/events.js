import express from "express";
import multer from "multer";
import { supabase } from "../db/supabase.js";
import { requireAuth, requireClubAdmin } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Build a Supabase-Storage-safe object key from an uploaded file.
// multer hands us latin1-decoded filenames, so a macOS screenshot like
// "Screenshot_…7.47.14 PM.png" (with a U+202F narrow no-break space)
// arrives as raw bytes that Storage rejects as "Invalid key". We strip
// everything except [A-Za-z0-9._-], collapse runs of underscores, and
// prepend a timestamp for uniqueness.
function buildStorageKey(originalname) {
  const safe = (originalname || "upload")
    .normalize("NFKD")                   // decompose accents → ascii base + mark
    .replace(/[^a-zA-Z0-9._-]+/g, "_")   // anything else → _
    .replace(/_+/g, "_")                 // collapse runs
    .replace(/^_+|_+$/g, "")             // trim edges
    .slice(-80) || "upload";             // cap length, fallback if empty
  return `${Date.now()}-${safe}`;
}

// GET /api/events — fetch published events (with RSVP counts).
// By default returns only upcoming events (event_date >= today). Pass
// `?include_past=1` to opt back into past events.
router.get("/", async (req, res) => {
  const {
    category, source, date_from, date_to,
    include_past, limit = 50, offset = 0,
  } = req.query;

  const today = new Date().toISOString().split("T")[0];

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
  if (date_from) {
    query = query.gte("event_date", date_from);
  } else if (!include_past) {
    query = query.gte("event_date", today);
  }
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
    is_published,
  } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({ error: "title and event_date are required" });
  }

  // FormData sends booleans as "true" / "false" strings. Treat anything
  // explicit as a draft only if it's literally false-y; otherwise publish.
  const publish =
    is_published === undefined ? true :
    !(is_published === "false" || is_published === false);

  // Upload flyer image to Supabase Storage if provided
  let banner_url = null;
  if (req.file) {
    const fileName = buildStorageKey(req.file.originalname);
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
    is_published: publish,
    created_by: req.user.id,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/events/:id — update event (creator or super_admin)
router.patch("/:id", requireClubAdmin, upload.single("flyer"), async (req, res) => {
  const updates = { ...req.body, updated_at: new Date().toISOString() };

  if (req.file) {
    const fileName = buildStorageKey(req.file.originalname);
    const { error: uploadError } = await supabase.storage
      .from("flyers")
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
    if (uploadError) return res.status(500).json({ error: "Flyer upload failed: " + uploadError.message });
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
