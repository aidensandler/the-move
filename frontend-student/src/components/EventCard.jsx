import { useState, useEffect } from "react";
import { api } from "../api";

const BANNER_COLORS = {
  street:   "#1A0A2E",
  sports:   "#0D1A0D",
  arts:     "#1A0A1A",
  academic: "#0D1A18",
  social:   "#0D0D1A",
  food:     "#1A1000",
  other:    "#111111",
};

export default function EventCard({ event, onTicket, showAiReason, aiReason }) {
  const [going, setGoing] = useState(event._userRsvped ?? false);
  const [count, setCount] = useState(event.rsvps?.[0]?.count ?? 0);
  const [busy, setBusy]   = useState(false);
  const isStreet = event.category === "street";
  const bannerBg = event.banner_bg ?? BANNER_COLORS[event.category] ?? "#111";

  // Keep the button in sync if the parent re-fetches RSVP state
  // (e.g. user navigates away and comes back to the feed).
  useEffect(() => {
    setGoing(event._userRsvped ?? false);
  }, [event.id, event._userRsvped]);

  async function handleRsvp() {
    if (busy) return;
    setBusy(true);
    try {
      const { rsvped } = await api.toggleRsvp(event.id);
      setGoing(rsvped);
      setCount((c) => rsvped ? c + 1 : Math.max(0, c - 1));
    } catch { /* silent */ }
    finally { setBusy(false); }
  }

  const dateLabel = fmtDate(event.event_date);

  return (
    <div className={`card ${isStreet ? "street-card" : ""}`}>
      {/* Banner — dark bg with white overlay text, always readable */}
      <div style={{ height: 88, background: bannerBg, position: "relative", overflow: "hidden", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 10px 8px" }}>
        {event.banner_url ? (
          <img src={event.banner_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
        ) : (
          <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-58%)", fontSize: 30, lineHeight: 1 }}>
            {event.banner_emoji ?? "◈"}
          </span>
        )}
        {/* Tag bottom-left — white text, always visible on dark bg */}
        <span style={{ fontFamily: "sans-serif", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", fontWeight: 400, position: "relative", zIndex: 1 }}>
          <BannerTag event={event} />
        </span>
        {/* Date bottom-right */}
        <span style={{ fontFamily: "sans-serif", fontSize: 8, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", position: "relative", zIndex: 1 }}>
          {isStreet && event.is_open ? "● Open now" : dateLabel}
        </span>
      </div>

      <div className="card-body">
        <div className="card-meta">
          <EventBadge event={event} />
          <span style={{ fontSize: 9, color: isStreet && event.is_open ? "#4A9A4A" : "var(--ash,#9A9488)", fontWeight: isStreet && event.is_open ? 500 : 400 }}>
            {isStreet && event.is_open ? "● Open" : dateLabel}
          </span>
        </div>

        <div className="card-title">{event.title}</div>

        <div className="card-sub">
          {event.venue      && <span>{event.venue}</span>}
          {event.start_time && <><span className="gold-sep">·</span><span>{fmtTime(event.start_time)}</span></>}
          {event.guest_policy && <><span className="gold-sep">·</span><span>{event.guest_policy}</span></>}
          {event.ticket_price === 0 && <><span className="gold-sep">·</span><span style={{ color: "#4A9A4A" }}>Complimentary</span></>}
        </div>

        {showAiReason && aiReason && (
          <div className="ai-reason">✦ {aiReason}</div>
        )}

        <div className="card-footer">
          <span className="going-count">{count} attending</span>
          <div className="btn-row">
            <button
              className={`btn-rsvp ${going ? "going" : ""} ${isStreet && !going ? "street" : ""}`}
              onClick={handleRsvp} disabled={busy}
            >
              {going ? "Attending ✓" : isStreet ? "Attend" : "Reserve"}
            </button>
            {event.ticket_price != null && (
              <button
                className={`btn-ticket ${event.ticket_price === 0 ? "free" : ""}`}
                onClick={() => onTicket?.(event)}
              >
                {event.ticket_price === 0 ? "Free" : `$${Number(event.ticket_price).toFixed(0)}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BannerTag({ event }) {
  if (event.category === "street")   return "✦ The Street";
  if (event.source === "auto" && event.category === "sports") return "Athletics";
  if (event.source === "auto")       return "Princeton Events";
  return event.clubs?.name ?? "Club Event";
}

function EventBadge({ event }) {
  if (event.category === "street")   return <span className="badge badge-street">✦ The Street</span>;
  if (event.source === "auto" && event.category === "sports") return <span className="badge badge-sports">Athletics</span>;
  if (event.source === "auto")       return <span className="badge badge-auto">Auto-synced</span>;
  return <span className="badge badge-club">{event.clubs?.name ?? "Club Event"}</span>;
}

function fmtDate(d) {
  if (!d) return "";
  const date  = new Date(d + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const diff  = Math.round((date - today) / 86400000);
  if (diff === 0) return "Tonight";
  if (diff === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}
