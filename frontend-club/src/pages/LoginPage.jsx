import { useState } from "react";
import { clubApi } from "../api";

export default function LoginPage({ onLogin }) {
  const [mode, setMode]   = useState("login");
  const [form, setForm]   = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy]   = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
          return setError("This portal is for club admins only.");
        localStorage.setItem("club_token", session.access_token);
        const club = await clubApi.myClub().catch(() => null);
        onLogin(profile, club);
      } else {
        await clubApi.register({ email: form.email, password: form.password, name: form.name, role: "club_admin" });
        setSuccess("Check your Princeton email to confirm your account, then sign in.");
        setMode("login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "#0D0D0D",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 28,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🐯</div>
          <div style={{ fontFamily: "Georgia,serif", color: "#FDFBF7", fontSize: 26, fontWeight: 400, letterSpacing: "0.02em" }}>
            The Move
          </div>
          <div style={{ color: "#C9A84C", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", marginTop: 5 }}>
            Club Portal · Princeton
          </div>
          <div style={{ width: 28, height: 0.5, background: "#C9A84C", margin: "12px auto 0", opacity: 0.5 }} />
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
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

          {error   && <p style={{ fontSize: 11, color: "#CC8888", textAlign: "center", letterSpacing: "0.02em" }}>{error}</p>}
          {success && <p style={{ fontSize: 11, color: "#5CA05C", textAlign: "center", letterSpacing: "0.02em" }}>{success}</p>}

          <button type="submit" disabled={busy} style={btnStyle}>
            {busy ? "…" : mode === "login" ? "Enter portal" : "Create account"}
          </button>

          <p style={{ textAlign: "center", fontSize: 10, color: "#9A9488", letterSpacing: "0.03em" }}>
            {mode === "login" ? "New club admin? " : "Already registered? "}
            <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}
              style={{ background: "none", border: "none", color: "#C9A84C", cursor: "pointer", fontSize: 10 }}>
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

const lblStyle = { display: "block", fontSize: 8, color: "#9A9488", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 };
const inpStyle = { width: "100%", background: "#1A1A1A", border: "0.5px solid #2A2A2A", borderRadius: 8, padding: "10px 13px", fontSize: 13, color: "#FDFBF7", outline: "none", fontFamily: "inherit" };
const btnStyle = { width: "100%", background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 8, padding: 13, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", marginTop: 6 };
