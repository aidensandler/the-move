import { useState } from "react";
import { apiFetch } from "../api";

export default function ClubProfilePage({ club, onUpdated }) {
  const [form, setForm] = useState({
    name:        club.name ?? "",
    description: club.description ?? "",
    category:    club.category ?? "general",
    instagram:   club.instagram ?? "",
    email:       club.email ?? "",
  });
  const [busy, setBusy]       = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    setBusy(true);
    try {
      const updated = await apiFetch(`/api/clubs/${club.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      onUpdated(updated);
      setSuccess("Club profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontFamily: "Georgia,serif", fontWeight: 400 }}>Club profile</h1>
        <p style={{ fontSize: 11, color: "#9A9488", marginTop: 4, letterSpacing: "0.03em" }}>
          This information is shown to students on The Move.
        </p>
      </div>

      <div className="card">
        {/* Club identity header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "0.5px solid var(--mist,#E8E4D8)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 9, background: "#1A1A1A", border: "0.5px solid rgba(201,168,76,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif", fontSize: 18, color: "#C9A84C" }}>
            {club.name?.[0]}
          </div>
          <div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 14 }}>{club.name}</div>
            <div style={{ fontSize: 10, color: club.verified ? "#4A9A4A" : "#9A9488", marginTop: 2, letterSpacing: "0.04em" }}>
              {club.verified ? "✓ Verified on The Move" : "⏳ Pending verification"}
            </div>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Club name</label>
            <input type="text" value={form.name} onChange={set("name")} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={set("description")} rows={4} style={{ resize: "vertical" }} placeholder="Tell students about your club…" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Instagram</label>
              <input type="text" value={form.instagram} onChange={set("instagram")} placeholder="@yourclub" />
            </div>
            <div className="form-group">
              <label>Contact email</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="club@princeton.edu" />
            </div>
          </div>

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 14, marginBottom: 8 }}>Verification status</h2>
        <p style={{ fontSize: 12, color: "#9A9488", lineHeight: 1.7, letterSpacing: "0.02em" }}>
          {club.verified
            ? "Your club is verified. Events appear with a verified mark on The Move."
            : "Your club is awaiting verification from a Move admin — typically 1–2 business days. Verified clubs are shown more prominently to students."}
        </p>
      </div>
    </>
  );
}
