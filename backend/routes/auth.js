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
    email_confirm: false, // Supabase will send confirmation email
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

  res.status(201).json({ message: "Registration successful — check your email to confirm" });
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
