import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode]     = useState("login");
  const [form, setForm]     = useState({ email: "", password: "", name: "", class_year: "" });
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy]     = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.email.endsWith("@princeton.edu"))
      return setError("Only @princeton.edu email addresses are permitted.");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register({ email: form.email, password: form.password, name: form.name, class_year: form.class_year });
        setSuccess("Account created — you can sign in now.");
        setMode("login");
      }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0D0D0D", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
      {/* Wordmark */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🐯</div>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", color: "#FDFBF7", fontSize: 28, fontWeight: 400, letterSpacing: "0.02em" }}>
          The Move
        </div>
        <div style={{ color: "#C9A84C", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", marginTop: 5 }}>
          Princeton
        </div>
        <div style={{ width: 32, height: 0.5, background: "#C9A84C", margin: "12px auto 0", opacity: 0.5 }} />
      </div>

      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
        {mode === "register" && (
          <>
            <div>
              <label style={labelStyle}>Full name</label>
              <input value={form.name} onChange={set("name")} placeholder="Jane Smith" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Class year</label>
              <input value={form.class_year} onChange={set("class_year")} placeholder="2027" style={inputStyle} />
            </div>
          </>
        )}
        <div>
          <label style={labelStyle}>Princeton email</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="netid@princeton.edu" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required style={inputStyle} />
        </div>

        {error   && <p style={{ fontSize: 11, color: "#CC6666", textAlign: "center", letterSpacing: "0.02em" }}>{error}</p>}
        {success && <p style={{ fontSize: 11, color: "#4A9A4A", textAlign: "center", letterSpacing: "0.02em" }}>{success}</p>}

        <button type="submit" disabled={busy} style={btnStyle}>
          {busy ? "…" : mode === "login" ? "Enter" : "Create account"}
        </button>

        <p style={{ textAlign: "center", fontSize: 10, color: "#9A9488", marginTop: 4, letterSpacing: "0.03em" }}>
          {mode === "login" ? "New to The Move? " : "Already have an account? "}
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{ background: "none", border: "none", color: "#C9A84C", cursor: "pointer", fontSize: 10, letterSpacing: "0.03em" }}>
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 8, color: "#9A9488", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 };
const inputStyle  = { width: "100%", background: "#1A1A1A", border: "0.5px solid #2A2A2A", borderRadius: 8, padding: "10px 13px", fontSize: 13, color: "#FDFBF7", outline: "none", fontFamily: "inherit" };
const btnStyle    = { width: "100%", background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 8, padding: 13, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", marginTop: 6 };
