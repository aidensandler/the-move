import express from "express";
import { supabase } from "../db/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/register
// Body: { email, password, name, class_year }
// Only allows @princeton.edu emails
router.post("/register", async (req, res) => {
  const { email, password, name, class_year, role } = req.body;

  if (!email.endsWith("@princeton.edu")) {
    return res.status(400).json({ error: "Only @princeton.edu email addresses are allowed" });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email, password,
    email_confirm: true, // auto-confirm — users can sign in immediately
    user_metadata: { name, class_year },
  });

  if (error) return res.status(400).json({ error: error.message });

  // Create profile row
  await supabase.from("profiles").insert({
    id: data.user.id,
    email,
    name,
    class_year: class_year ? Number(class_year) : null,
    role: role === "club_admin" ? "club_admin" : "student",
  });

  res.status(201).json({ message: "Account created — you can sign in now." });
});

// POST /api/auth/apply-admin
// Body: { email, password, name, class_year, club_id, message }
// Register a new user (role='student') AND submit a club admin application
// in one atomic flow — used by the "Apply to an existing club" link on the
// club portal login screen.
router.post("/apply-admin", async (req, res) => {
  const { email, password, name, class_year, club_id, message } = req.body;

  if (!email || !email.endsWith("@princeton.edu")) {
    return res.status(400).json({ error: "Only @princeton.edu email addresses are allowed" });
  }
  if (!club_id) {
    return res.status(400).json({ error: "Please choose the club you want to join" });
  }

  // Does that club exist?
  const { data: club } = await supabase
    .from("clubs").select("id, name").eq("id", club_id).maybeSingle();
  if (!club) return res.status(404).json({ error: "Club not found" });

  // Create the auth user (or reuse existing one if the email is already registered)
  let userId;
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email, password,
    email_confirm: true, // auto-confirm — no email verification required
    user_metadata: { name, class_year },
  });

  if (createErr) {
    // If already registered, try to find the existing profile and attach the
    // application to that user instead (so repeat applications still work).
    const { data: existing } = await supabase
      .from("profiles").select("id").eq("email", email).maybeSingle();
    if (!existing) return res.status(400).json({ error: createErr.message });
    userId = existing.id;
  } else {
    userId = created.user.id;
    await supabase.from("profiles").insert({
      id: userId,
      email,
      name,
      class_year: class_year ? Number(class_year) : null,
      role: "student",
    });
  }

  // Already an admin of that club?
  const { data: existingAdmin } = await supabase
    .from("club_admins")
    .select("user_id")
    .eq("user_id", userId)
    .eq("club_id", club_id)
    .maybeSingle();
  if (existingAdmin) {
    return res.status(409).json({ error: "You're already an admin of this club — just sign in." });
  }

  // Reject if there's already a pending application for this user+club
  const { data: existingApp } = await supabase
    .from("club_admin_applications")
    .select("id")
    .eq("user_id", userId)
    .eq("club_id", club_id)
    .eq("status", "pending")
    .maybeSingle();
  if (existingApp) {
    return res.status(409).json({ error: "You already have a pending application for this club" });
  }

  const { data: app, error: appErr } = await supabase
    .from("club_admin_applications")
    .insert({ user_id: userId, club_id, message: message || null, status: "pending" })
    .select().single();
  if (appErr) return res.status(500).json({ error: appErr.message });

  res.status(201).json({
    message: `Application submitted to ${club.name}. You'll be notified once an existing admin reviews your request.`,
    application: app,
  });
});

// POST /api/auth/login
// Returns a Supabase session (access_token, refresh_token)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });

  // Fetch profile to include role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  res.json({ session: data.session, profile });
});

// GET /api/auth/me — get current user's profile
router.get("/me", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, club_admins(club_id, clubs(*))")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(404).json({ error: "Profile not found" });
  res.json(data);
});

// PATCH /api/auth/me — update profile
router.patch("/me", requireAuth, async (req, res) => {
  const { name, class_year, avatar_url } = req.body;
  const { data, error } = await supabase
    .from("profiles")
    .update({ name, class_year, avatar_url })
    .eq("id", req.user.id)
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
