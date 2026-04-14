import { useState, useEffect } from "react";
import { clubApi } from "../api";

export default function DashboardPage({ club, onNavigate }) {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clubApi.myClub()
      .then((d) => setEvents(d.events ?? []))
      .finally(() => setLoading(false));
  }, []);

  const today    = new Date().toISOString().split("T")[0];
  const upcoming = events.filter((e) => e.event_date >= today);
  const past     = events.filter((e) => e.event_date < today);
  const totalRsvps = events.reduce((s, e) => s + (e.rsvps?.[0]?.count ?? 0), 0);

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1A1A1A", border: "0.5px solid rgba(201,168,76,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif", fontSize: 15, color: "#C9A84C" }}>
            {club.name?.[0]}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontFamily: "Georgia,serif", fontWeight: 400, color: "#0D0D0D" }}>{club.name}</h1>
            <p style={{ fontSize: 10, color: "#9A9488", letterSpacing: "0.05em", marginTop: 2 }}>
              {club.verified ? "✓ Verified ·" : "⏳ Pending ·"} {club.category}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics">
        <div className="metric-card">
          <div className="metric-num">{upcoming.length}</div>
          <div className="metric-label">Upcoming</div>
        </div>
        <div className="metric-card">
          <div className="metric-num">{totalRsvps}</div>
          <div className="metric-label">Total RSVPs</div>
        </div>
        <div className="metric-card">
          <div className="metric-num">{past.length}</div>
          <div className="metric-label">Past events</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 style={{ fontSize: 14, marginBottom: 14 }}>Quick actions</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => onNavigate("post")}>✦ Post a flyer</button>
          <button className="btn-secondary" onClick={() => onNavigate("events")}>◈ Manage events</button>
          <button className="btn-secondary" onClick={() => onNavigate("profile")}>◎ Edit profile</button>
        </div>
      </div>

      {/* Recent events */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--mist,#E8E4D8)" }}>
          <h2 style={{ fontSize: 14 }}>Recent &amp; upcoming events</h2>
        </div>
        {loading ? (
          <p style={{ padding: 20, fontSize: 11, color: "#9A9488", letterSpacing: "0.04em" }}>Loading…</p>
        ) : events.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#9A9488", letterSpacing: "0.04em", marginBottom: 14 }}>No events yet.</p>
            <button className="btn-primary" onClick={() => onNavigate("post")}>✦ Post your first flyer</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>RSVPs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...upcoming, ...past].slice(0, 8).map((ev) => (
                <tr key={ev.id}>
                  <td style={{ fontFamily: "Georgia,serif", fontWeight: 400 }}>{ev.title}</td>
                  <td style={{ color: "#9A9488" }}>{fmtDate(ev.event_date)}</td>
                  <td>{ev.rsvps?.[0]?.count ?? 0}</td>
                  <td>
                    <span className={`badge ${ev.event_date < today ? "badge-past" : ev.is_published ? "badge-published" : "badge-draft"}`}>
                      {ev.event_date < today ? "Past" : ev.is_published ? "Live" : "Draft"}
                    </span>
                  </td>
                </tr>
              ))}
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
