import { useEffect, useState } from "react";
import { clubApi } from "../api";

export default function LoginPage({ onLogin }) {
  // mode: 'login' | 'register' | 'apply'
  const [mode, setMode]   = useState("login");
  const [form, setForm]   = useState({
    email: "", password: "", name: "",
    club_id: "", message: "",
  });
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy]   = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Lazy-load club list when entering "apply" mode
  useEffect(() => {
    if (mode === "apply" && clubs.length === 0) {
      clubApi.listClubs().then(setClubs).catch(() => {});
    }
  }, [mode, clubs.length]);

  function switchMode(next) {
    setError(""); setSuccess("");
    setMode(next);
  }

  async function submit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.email.endsWith("@princeton.edu"))
      return setError("Only @princeton.edu email addresses are permitted.");
    setBusy(true);
    try {
      if (mode === "login") {
        const { session, profile } = await clubApi.login(form.email, form.password);
        if (!["club_admin", "super_admin"].includes(profile.role))
          return setError("This portal is for club admins only. If you've applied, your application is still being reviewed.");
        localStorage.setItem("club_token", session.access_token);
        const club = await clubApi.myClub().catch(() => null);
        onLogin(profile, club);
      } else if (mode === "register") {
        await clubApi.register({ email: form.email, password: form.password, name: form.name, role: "club_admin" });
        setSuccess("Account created — you can sign in now.");
        setMode("login");
      } else if (mode === "apply") {
        if (!form.club_id) return setError("Please choose the club you'd like to join.");
        const { message } = await clubApi.applyAsAdmin({
          email: form.email,
          password: form.password,
          name: form.name,
          club_id: form.club_id,
          message: form.message,
        });
        setSuccess(message || "Application submitted. You'll be notified once an admin reviews it.");
        setMode("login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const headline =
    mode === "login"    ? "Sign in" :
    mode === "register" ? "Start a new club" :
                          "Apply to join a club";

  const cta =
    mode === "login"    ? "Enter portal" :
    mode === "register" ? "Create account" :
                          "Submit application";

  return (
    <div style={{
      minHeight: "100dvh", background: "#0D0D0D",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 28,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🐯</div>
          <div style={{ fontFamily: "Georgia,serif", color: "#FDFBF7", fontSize: 26, fontWeight: 400, letterSpacing: "0.02em" }}>
            The Move
          </div>
          <div style={{ color: "#C9A84C", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", marginTop: 5 }}>
            Club Portal · Princeton
          </div>
          <div style={{ width: 28, height: 0.5, background: "#C9A84C", margin: "12px auto 0", opacity: 0.5 }} />
          <div style={{ color: "#9A9488", fontSize: 11, marginTop: 14, letterSpacing: "0.02em" }}>
            {headline}
          </div>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(mode === "register" || mode === "apply") && (
            <div>
              <label style={lblStyle}>Full name</label>
              <input type="text" value={form.name} onChange={set("name")} placeholder="Jane Smith" required style={inpStyle} />
            </div>
          )}
          <div>
            <label style={lblStyle}>Princeton email</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="netid@princeton.edu" required style={inpStyle} />
          </div>
          <div>
            <label style={lblStyle}>Password</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required style={inpStyle} />
          </div>

          {mode === "apply" && (
            <>
              <div>
                <label style={lblStyle}>Club you want to join</label>
                <select value={form.club_id} onChange={set("club_id")} required style={inpStyle}>
                  <option value="">— Select a club —</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.verified ? " ✓" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lblStyle}>Why should they add you? (optional)</label>
                <textarea
                  value={form.message} onChange={set("message")}
                  placeholder="e.g. I'm the new social chair for next year."
                  rows={3}
                  style={{ ...inpStyle, resize: "vertical", height: 70, fontFamily: "inherit" }}
                />
              </div>
            </>
          )}

          {error   && <p style={{ fontSize: 11, color: "#CC8888", textAlign: "center", letterSpacing: "0.02em" }}>{error}</p>}
          {success && <p style={{ fontSize: 11, color: "#5CA05C", textAlign: "center", letterSpacing: "0.02em" }}>{success}</p>}

          <button type="submit" disabled={busy} style={btnStyle}>
            {busy ? "…" : cta}
          </button>

          {/* Mode switcher */}
          <div style={{ textAlign: "center", marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
            {mode !== "login" && (
              <button type="button" onClick={() => switchMode("login")} style={linkBtnStyle}>
                ← Back to sign in
              </button>
            )}
            {mode !== "register" && (
              <button type="button" onClick={() => switchMode("register")} style={linkBtnStyle}>
                Starting a new club? Create an admin account
              </button>
            )}
            {mode !== "apply" && (
              <button type="button" onClick={() => switchMode("apply")} style={linkBtnStyle}>
                Joining an existing club? Apply to be added as admin
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const lblStyle = { display: "block", fontSize: 8, color: "#9A9488", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 };
const inpStyle = { width: "100%", background: "#1A1A1A", border: "0.5px solid #2A2A2A", borderRadius: 8, padding: "10px 13px", fontSize: 13, color: "#FDFBF7", outline: "none", fontFamily: "inherit" };
const btnStyle = { width: "100%", background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 8, padding: 13, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", marginTop: 6 };
const linkBtnStyle = { background: "none", border: "none", color: "#C9A84C", cursor: "pointer", fontSize: 10, letterSpacing: "0.03em", padding: 2 };
