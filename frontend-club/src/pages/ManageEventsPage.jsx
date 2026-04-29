import { useState, useEffect } from "react";
import { clubApi } from "../api";

export default function ManageEventsPage({ club, onEdit }) {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);

  function load() {
    setLoading(true);
    clubApi.myClub()
      .then((d) => setEvents((d.events ?? []).sort((a, b) => b.event_date.localeCompare(a.event_date))))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function deleteEvent(ev) {
    if (!window.confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    setDeleting(ev.id);
    try {
      await clubApi.deleteEvent(ev.id);
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally {
      setDeleting(null);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, gap: 10 }}>
        <h1 style={{ fontSize: 22, fontFamily: "Georgia,serif", fontWeight: 400 }}>Manage events</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={load}
            disabled={loading}
            style={{
              background: "transparent", border: "0.5px solid rgba(201,168,76,0.4)",
              color: "#C9A84C", padding: "7px 12px", borderRadius: 7, fontSize: 10,
              letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
            }}
            title="Refresh"
          >
            {loading ? "…" : "↻ Refresh"}
          </button>
          <button className="btn-primary" onClick={() => onEdit(null)}>✦ Post new flyer</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: 20, fontSize: 11, color: "#9A9488", letterSpacing: "0.04em" }}>Loading…</p>
        ) : events.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#9A9488", letterSpacing: "0.04em", marginBottom: 14 }}>No events posted yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Venue</th>
                <th>RSVPs</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const isPast = ev.event_date < today;
                return (
                  <tr key={ev.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{ev.banner_emoji ?? "◈"}</span>
                        <span style={{ fontFamily: "Georgia,serif", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.title}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "#9A9488", whiteSpace: "nowrap" }}>{fmtDate(ev.event_date)}</td>
                    <td style={{ color: "#9A9488", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.venue ?? "—"}
                    </td>
                    <td>{ev.rsvps?.[0]?.count ?? 0}</td>
                    <td>
                      <span className={`badge ${isPast ? "badge-past" : ev.is_published ? "badge-published" : "badge-draft"}`}>
                        {isPast ? "Past" : ev.is_published ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {!isPast && (
                          <button className="btn-secondary" style={{ padding: "5px 10px", fontSize: 10 }} onClick={() => onEdit(ev)}>
                            Edit
                          </button>
                        )}
                        <button className="btn-danger" style={{ padding: "5px 10px", fontSize: 10 }}
                          disabled={deleting === ev.id} onClick={() => deleteEvent(ev)}>
                          {deleting === ev.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function fmtDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
