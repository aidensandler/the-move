import { supabaseAnon } from "../db/supabase.js";

// Attaches req.user if a valid Bearer token is present
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });

  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Invalid token" });

  req.user = data.user;
  next();
}

// Checks that the user is a club_admin or super_admin
export async function requireClubAdmin(req, res, next) {
  await requireAuth(req, res, async () => {
    const { data: profile } = await supabaseAnon
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (!profile || !["club_admin", "super_admin"].includes(profile.role)) {
      return res.status(403).json({ error: "Club admin access required" });
    }
    next();
  });
}

export async function requireSuperAdmin(req, res, next) {
  await requireAuth(req, res, async () => {
    const { data: profile } = await supabaseAnon
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return res.status(403).json({ error: "Super admin access required" });
    }
    next();
  });
}
