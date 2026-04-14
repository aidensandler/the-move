import { useState } from "react";
import { clubApi } from "../api";

const CATEGORIES = ["arts", "academic", "sports", "social", "cultural", "political", "religious", "service", "eating_club", "other"];

export default function SetupClubPage({ user, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", category: "arts", instagram: "", email: "" });
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Club name is required.");
    setBusy(true);
    try {
      const club = await clubApi.createClub(form);
      onCreated(club);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🐯</div>
          <div style={{ fontFamily: "Georgia,serif", color: "#FDFBF7", fontSize: 22, marginBottom: 5 }}>
            Welcome, {user?.name?.split(" ")[0] ?? "there"}
          </div>
          <div style={{ fontSize: 10, color: "#9A9488", letterSpacing: "0.06em" }}>
            Let's set up your club on The Move
          </div>
        </div>

        <div style={{ background: "#1A1A1A", borderRadius: 12, border: "0.5px solid rgba(201,168,76,0.15)", padding: 24 }}>
          <form onSubmit={submit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={lblStyle}>Club name *</label>
              <input type="text" placeholder="e.g. Princeton Symphony Orchestra" value={form.name} onChange={set("name")} required style={inpStyle} />
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={lblStyle}>Category</label>
              <select value={form.category} onChange={set("category")} style={inpStyle}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace("_", " ")}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={lblStyle}>Description</label>
              <textarea
                placeholder="Tell students what your club is about…"
                value={form.description} onChange={set("description")}
                rows={3} style={{ ...inpStyle, resize: "vertical", height: 80 }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lblStyle}>Instagram</label>
                <input type="text" placeholder="@yourclub" value={form.instagram} onChange={set("instagram")} style={inpStyle} />
              </div>
              <div>
                <label style={lblStyle}>Contact email</label>
                <input type="email" placeholder="club@princeton.edu" value={form.email} onChange={set("email")} style={inpStyle} />
              </div>
            </div>

            {error && <div style={{ fontSize: 11, color: "#CC8888", marginBottom: 12, letterSpacing: "0.02em" }}>{error}</div>}

            <button type="submit" disabled={busy} style={{ width: "100%", background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 8, padding: 12, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              {busy ? "Creating…" : "Create club profile ✦"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 10, color: "#9A9488", marginTop: 14, letterSpacing: "0.03em" }}>
          A Move admin will verify your club within 1–2 business days.
        </p>
      </div>
    </div>
  );
}

const lblStyle = { display: "block", fontSize: 8, color: "#9A9488", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 };
const inpStyle = { width: "100%", background: "#0D0D0D", border: "0.5px solid #2A2A2A", borderRadius: 7, padding: "9px 12px", fontSize: 13, color: "#FDFBF7", outline: "none", fontFamily: "inherit" };
