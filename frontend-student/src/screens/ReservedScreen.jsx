import { useState, useEffect } from "react";
import { api } from "../api";
import { LoadingState } from "./AllEventsScreen";

// Events the user has RSVP'd to (free signups). Tickets (paid) live in TicketsScreen.
export default function ReservedScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myRsvps().then((rows) => setEvents(rows ?? [])).finally(() => setLoading(false));
  }, []);

  async function cancel(eventId) {
    if (!confirm("Cancel your reservation for this event?")) return;
    await api.toggleRsvp(eventId); // toggle off
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  const today    = new Date().toISOString().split("T")[0];
  const upcoming = events.filter((e) => (e?.event_date ?? "") >= today);
  const past     = events.filter((e) => (e?.event_date ?? "") <  today);

  if (loading) return <LoadingState />;

  return (
    <>
      <div className="section-label">Reserved · Upcoming</div>
      <div className="feed" style={{ paddingTop: 4 }}>
        {upcoming.length === 0 ? (
          <p style={{ fontSize: 10, color: "var(--ash,#9A9488)", letterSpacing: "0.04em" }}>
            You haven't reserved any upcoming events yet.
          </p>
        ) : (
          upcoming.map((ev) => <ReservedRow key={ev.id} event={ev} onCancel={() => cancel(ev.id)} />)
        )}
      </div>

      {past.length > 0 && (
        <>
          <div style={{ height: "0.5px", background: "var(--mist,#E8E4D8)", margin: "8px 0 0" }} />
          <div className="section-label">Past</div>
          <div className="feed" style={{ paddingTop: 4, opacity: 0.5 }}>
            {past.map((ev) => <ReservedRow key={ev.id} event={ev} />)}
          </div>
        </>
      )}
    </>
  );
}

function ReservedRow({ event, onCancel }) {
  const BANNER_COLORS = { sports:"#0D1A0D", arts:"#1A0A1A", academic:"#0D1A18", street:"#1A0A2E", other:"#111" };
  const bg = event?.banner_bg ?? BANNER_COLORS[event?.category] ?? "#1A1A1A";

  return (
    <div style={{ background: "var(--cream,#FDFBF7)", borderRadius: 10, border: "0.5px solid var(--mist,#E8E4D8)", padding: 11, display: "flex", gap: 11, alignItems: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        {event?.banner_emoji ?? "✓"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: "var(--ink,#0D0D0D)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event?.title ?? "Event"}
        </div>
        <div style={{ fontSize: 9, color: "var(--ash,#9A9488)", marginTop: 2, letterSpacing: "0.02em" }}>
          {fmtDate(event?.event_date)} · {event?.venue ?? ""}
        </div>
        <div style={{ fontSize: 9, color: "#4A7C4A", marginTop: 2, letterSpacing: "0.02em" }}>
          Reserved ✓
        </div>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            fontSize: 8, padding: "4px 9px", borderRadius: 20,
            border: "0.5px solid rgba(154,148,136,0.4)", background: "transparent",
            color: "var(--ash,#9A9488)", cursor: "pointer",
            letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0,
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
