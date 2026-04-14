import { useState, useEffect, useRef } from "react";
import { clubApi } from "../api";

const CATEGORIES = ["arts", "academic", "sports", "street", "social", "food", "other"];
const EMOJIS     = ["🎭","🎶","🏀","🏈","⚾","🎓","🌍","🎨","🎸","🤖","🏃","🪩","🍕","🎉","🏛","🎤","📚","⚽","🎻","🎺"];

const BANNER_PRESETS = [
  { label: "Midnight",  color: "#0D0D0D" },
  { label: "Ink",       color: "#1A0A2E" },
  { label: "Forest",    color: "#0D1A0D" },
  { label: "Plum",      color: "#1A0A1A" },
  { label: "Deep teal", color: "#0D1A18" },
  { label: "Navy",      color: "#0D0D1A" },
];

export default function PostFlyerPage({ club, editEvent, onSaved, onCancel }) {
  const isEdit = !!editEvent;
  const [form, setForm] = useState({
    title: "", description: "", category: "arts",
    venue: "", event_date: "", start_time: "", end_time: "",
    banner_emoji: "🎭", banner_bg: "#1A0A1A",
    ticket_price: "", guest_policy: "", capacity: "",
    is_published: true,
  });
  const [flyerFile, setFlyerFile]     = useState(null);
  const [flyerPreview, setFlyerPreview] = useState(null);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef();

  useEffect(() => {
    if (editEvent) {
      setForm({
        title:        editEvent.title ?? "",
        description:  editEvent.description ?? "",
        category:     editEvent.category ?? "arts",
        venue:        editEvent.venue ?? "",
        event_date:   editEvent.event_date ?? "",
        start_time:   editEvent.start_time ?? "",
        end_time:     editEvent.end_time ?? "",
        banner_emoji: editEvent.banner_emoji ?? "🎭",
        banner_bg:    editEvent.banner_bg ?? "#1A0A1A",
        ticket_price: editEvent.ticket_price ?? "",
        guest_policy: editEvent.guest_policy ?? "",
        capacity:     editEvent.capacity ?? "",
        is_published: editEvent.is_published ?? true,
      });
      if (editEvent.banner_url) setFlyerPreview(editEvent.banner_url);
    }
  }, [editEvent]);

  const set = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  function pickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFlyerFile(file);
    setFlyerPreview(URL.createObjectURL(file));
  }

  async function submit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.title.trim() || !form.event_date) return setError("Title and date are required.");
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
      fd.append("club_id", club.id);
      if (flyerFile) fd.append("flyer", flyerFile);
      if (isEdit) {
        await clubApi.updateEvent(editEvent.id, fd);
        setSuccess("Event updated successfully.");
      } else {
        await clubApi.createEvent(fd);
        setSuccess("Your flyer is now live on The Move.");
        setForm({ title:"", description:"", category:"arts", venue:"", event_date:"", start_time:"", end_time:"", banner_emoji:"🎭", banner_bg:"#1A0A1A", ticket_price:"", guest_policy:"", capacity:"", is_published:true });
        setFlyerFile(null); setFlyerPreview(null);
      }
      setTimeout(onSaved, 1400);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontFamily: "Georgia,serif", fontWeight: 400 }}>
          {isEdit ? "Edit event" : "Post a flyer"}
        </h1>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>

      <form onSubmit={submit}>
        {/* Flyer image upload */}
        <div className="card">
          <h2 style={{ fontSize: 14, marginBottom: 14 }}>Flyer image</h2>
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border: "0.5px dashed var(--mist,#E8E4D8)", borderRadius: 10,
              padding: 28, textAlign: "center", cursor: "pointer",
              background: flyerPreview ? "transparent" : "var(--smoke,#F7F5F0)",
              minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
              position: "relative",
            }}
          >
            {flyerPreview ? (
              <img src={flyerPreview} alt="Preview" style={{ maxHeight: 220, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} />
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 8, color: "#9A9488" }}>🖼</div>
                <div style={{ fontSize: 12, color: "#9A9488", letterSpacing: "0.04em" }}>Upload your flyer</div>
                <div style={{ fontSize: 10, color: "#E8E4D8", marginTop: 4 }}>PNG or JPG, up to 5 MB</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} style={{ display: "none" }} />
          {flyerPreview && (
            <button type="button" onClick={() => { setFlyerFile(null); setFlyerPreview(null); }}
              style={{ marginTop: 8, fontSize: 11, color: "#9A9488", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.03em" }}>
              Remove image
            </button>
          )}
        </div>

        {/* Emoji + banner color (shown when no image) */}
        {!flyerPreview && (
          <div className="card">
            <h2 style={{ fontSize: 14, marginBottom: 12 }}>Banner (if no image)</h2>

            <div className="form-group">
              <label>Emoji</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {EMOJIS.map((em) => (
                  <button key={em} type="button" onClick={() => setForm((f) => ({ ...f, banner_emoji: em }))}
                    style={{ width: 34, height: 34, fontSize: 18, border: "none", borderRadius: 7, cursor: "pointer", background: form.banner_emoji === em ? "#1A1A1A" : "var(--smoke,#F7F5F0)", outline: form.banner_emoji === em ? "1.5px solid #C9A84C" : "none" }}>
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Banner color</label>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {BANNER_PRESETS.map((p) => (
                  <button key={p.color} type="button" onClick={() => setForm((f) => ({ ...f, banner_bg: p.color }))}
                    style={{ width: 32, height: 32, borderRadius: 7, background: p.color, cursor: "pointer", border: form.banner_bg === p.color ? "2px solid #C9A84C" : "0.5px solid rgba(255,255,255,0.1)" }}
                    title={p.label} />
                ))}
                {/* Custom color */}
                <label style={{ width: 32, height: 32, position: "relative", cursor: "pointer", display: "block", margin: 0 }} title="Custom">
                  <div style={{ width: "100%", height: "100%", borderRadius: 7, background: form.banner_bg, border: "0.5px solid var(--mist,#E8E4D8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#9A9488" }}>+</div>
                  <input type="color" value={form.banner_bg} onChange={set("banner_bg")} style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", top: 0, left: 0, cursor: "pointer" }} />
                </label>
              </div>
              {/* Preview */}
              <div style={{ marginTop: 10, width: 80, height: 50, borderRadius: 8, background: form.banner_bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                {form.banner_emoji}
              </div>
            </div>
          </div>
        )}

        {/* Event details */}
        <div className="card">
          <h2 style={{ fontSize: 14, marginBottom: 14 }}>Event details</h2>

          <div className="form-group">
            <label>Event title *</label>
            <input type="text" placeholder="e.g. Spring Concert 2026" value={form.title} onChange={set("title")} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea placeholder="Tell students what to expect…" value={form.description} onChange={set("description")} rows={3} style={{ resize: "vertical" }} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Venue</label>
              <input type="text" placeholder="e.g. Richardson Auditorium" value={form.venue} onChange={set("venue")} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={form.event_date} onChange={set("event_date")} required />
            </div>
            <div className="form-group">
              <label>Start time</label>
              <input type="time" value={form.start_time} onChange={set("start_time")} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>End time</label>
              <input type="time" value={form.end_time} onChange={set("end_time")} />
            </div>
            <div className="form-group">
              <label>Capacity (optional)</label>
              <input type="number" placeholder="Unlimited" value={form.capacity} onChange={set("capacity")} min={1} />
            </div>
          </div>
        </div>

        {/* Ticketing */}
        <div className="card">
          <h2 style={{ fontSize: 14, marginBottom: 14 }}>Ticketing</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Ticket price ($) — leave blank if free</label>
              <input type="number" placeholder="0.00" value={form.ticket_price} onChange={set("ticket_price")} min={0} step={0.01} />
            </div>
            <div className="form-group">
              <label>Guest policy (eating club events)</label>
              <input type="text" placeholder="e.g. Members + guests" value={form.guest_policy} onChange={set("guest_policy")} />
            </div>
          </div>
        </div>

        {/* Publish toggle */}
        <div className="card">
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", margin: 0, fontSize: 13, textTransform: "none", letterSpacing: "normal", color: "var(--ink,#0D0D0D)" }}>
            <input type="checkbox" checked={form.is_published} onChange={set("is_published")} style={{ width: 16, height: 16, accentColor: "#C9A84C" }} />
            Publish immediately
          </label>
          <p style={{ fontSize: 11, color: "#9A9488", marginTop: 6, marginLeft: 28, letterSpacing: "0.02em" }}>
            Uncheck to save as a draft and publish later.
          </p>
        </div>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Post flyer ✦"}
          </button>
        </div>
      </form>
    </>
  );
}
