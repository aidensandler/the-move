import { useState, useEffect } from "react";
import EventCard from "../components/EventCard";
import { api } from "../api";
import { LoadingState } from "./AllEventsScreen";

export default function ForYouScreen({ onTicket }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.recommendations()
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div style={{ padding: "11px 12px 9px", background: "var(--cream,#FDFBF7)", borderBottom: "0.5px solid var(--mist,#E8E4D8)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#C9A84C" }}>✦</span>
        <span style={{ fontSize: 9, color: "var(--ash,#9A9488)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Curated for you
        </span>
      </div>

      <div className="section-label">Tonight's picks</div>

      <div className="feed">
        {loading && <LoadingState />}
        {error   && <p style={{ fontSize: 11, color: "#8B2020", textAlign: "center", padding: 20 }}>{error}</p>}
        {!loading && !error && events.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 16px" }}>
            <div style={{ fontSize: 22, color: "#C9A84C", marginBottom: 10 }}>✦</div>
            <p style={{ fontFamily: "Georgia,serif", fontSize: 14, color: "#0D0D0D", marginBottom: 6 }}>Your picks will appear here</p>
            <p style={{ fontSize: 10, color: "#9A9488", letterSpacing: "0.04em" }}>
              RSVP to a few events and we'll start curating.
            </p>
          </div>
        )}
        {events.map((ev) => (
          <EventCard key={ev.id} event={ev} onTicket={onTicket} showAiReason aiReason={ev._reason} />
        ))}
      </div>
    </>
  );
}
