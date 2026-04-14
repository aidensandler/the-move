import express from "express";
import { supabase } from "../db/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// ── RSVPs ─────────────────────────────────────

// POST /api/social/rsvp/:eventId — toggle RSVP
router.post("/rsvp/:eventId", requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  const { data: existing } = await supabase
    .from("rsvps")
    .select("*")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .single();

  if (existing) {
    await supabase.from("rsvps").delete().eq("user_id", userId).eq("event_id", eventId);
    return res.json({ rsvped: false });
  } else {
    await supabase.from("rsvps").insert({ user_id: userId, event_id: eventId });
    return res.json({ rsvped: true });
  }
});

// GET /api/social/my-rsvps — events the current user RSVPed to
router.get("/my-rsvps", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("rsvps")
    .select("event_id, events(*)")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map((r) => r.events));
});

// ── Tickets ───────────────────────────────────

// POST /api/social/tickets — purchase a ticket (stub — wire Stripe before going live)
router.post("/tickets", requireAuth, async (req, res) => {
  const { event_id, quantity = 1, tier_name = "General", amount_paid } = req.body;

  // TODO: charge via Stripe before inserting the ticket record
  // const paymentIntent = await stripe.paymentIntents.create({ amount: amount_paid * 100, currency: "usd" });

  const qr_code = uuidv4(); // unique token for check-in scanning

  const { data, error } = await supabase.from("tickets").insert({
    user_id: req.user.id,
    event_id,
    quantity,
    tier_name,
    amount_paid,
    qr_code,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /api/social/tickets — user's tickets
router.get("/tickets", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, events(*)")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Friends / Follows ─────────────────────────

// POST /api/social/follow/:userId — toggle follow
router.post("/follow/:userId", requireAuth, async (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.userId;

  if (followerId === followingId) return res.status(400).json({ error: "Cannot follow yourself" });

  const { data: existing } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();

  if (existing) {
    await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
    return res.json({ following: false });
  } else {
    await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
    return res.json({ following: true });
  }
});

// GET /api/social/friends-activity — RSVPs from people I follow
router.get("/friends-activity", requireAuth, async (req, res) => {
  // Get people I follow
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", req.user.id);

  if (!follows?.length) return res.json([]);

  const followingIds = follows.map((f) => f.following_id);

  // Get their recent RSVPs with event + profile info
  const { data, error } = await supabase
    .from("rsvps")
    .select("created_at, profiles(id, name, avatar_url), events(id, title, category, event_date, start_time, venue)")
    .in("user_id", followingIds)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/social/friends — list users I follow with their profiles
router.get("/friends", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id, profiles!follows_following_id_fkey(id, name, email, avatar_url)")
    .eq("follower_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map((f) => f.profiles));
});

// GET /api/social/recommendations — simple scoring-based For You events
router.get("/recommendations", requireAuth, async (req, res) => {
  const userId = req.user.id;

  // 1. Get user's past RSVP categories
  const { data: myRsvps } = await supabase
    .from("rsvps")
    .select("events(category)")
    .eq("user_id", userId);

  const categoryCounts = {};
  myRsvps?.forEach(({ events: e }) => {
    if (e?.category) categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // 2. Get friend event IDs
  const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
  const friendIds = follows?.map((f) => f.following_id) ?? [];
  let friendEventIds = [];
  if (friendIds.length) {
    const { data: friendRsvps } = await supabase.from("rsvps").select("event_id").in("user_id", friendIds);
    friendEventIds = [...new Set(friendRsvps?.map((r) => r.event_id) ?? [])];
  }

  // 3. Get upcoming events not already RSVPed by this user
  const { data: myRsvpIds } = await supabase.from("rsvps").select("event_id").eq("user_id", userId);
  const alreadyRsvped = new Set(myRsvpIds?.map((r) => r.event_id) ?? []);

  const { data: upcoming } = await supabase
    .from("events")
    .select("*, rsvps(count)")
    .eq("is_published", true)
    .gte("event_date", new Date().toISOString().split("T")[0])
    .order("event_date")
    .limit(50);

  // 4. Score each event
  const scored = (upcoming ?? [])
    .filter((e) => !alreadyRsvped.has(e.id))
    .map((event) => {
      let score = 0;
      const friendGoing = friendEventIds.includes(event.id);
      if (friendGoing) score += 40;
      if (topCategory && event.category === topCategory) score += 30;
      score += Math.min((event.rsvps?.[0]?.count ?? 0) / 5, 20); // popularity up to 20pts
      const daysAway = (new Date(event.event_date) - new Date()) / 86400000;
      if (daysAway < 3) score += 10; // recency boost

      let reason = null;
      if (friendGoing) reason = `${friendIds.length > 1 ? "Friends" : "A friend"} ${friendIds.length > 1 ? "are" : "is"} going`;
      else if (topCategory && event.category === topCategory) reason = `Matches your ${topCategory} interests`;
      else if (daysAway < 2) reason = "Happening soon";

      return { ...event, _score: score, _reason: reason };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 10);

  res.json(scored);
});

export default router;
