import { useState, useEffect } from "react";
import EventCard from "../components/EventCard";
import { api } from "../api";
import { LoadingState } from "./AllEventsScreen";

export default function TheStreetScreen() {
  const [clubs, setClubs]   = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.eatingStatus(), api.events({ category: "street" })])
      .then(([c, e]) => { setClubs(c ?? []); setEvents(e ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const openCount = clubs.filter((c) => c.eating_club_status?.[0]?.is_open).length;

  return (
    <>
      {/* Hero */}
      <div style={{ margin: "10px 12px 0", background: "#1A0A2E", borderRadius: 14, padding: "16px 14px", display: "flex", alignItems: "center", gap: 12, border: "0.5px solid rgba(201,168,76,0.25)" }}>
        <span style={{ fontSize: 26 }}>🕯</span>
        <div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 15, color: "#FDFBF7", marginBottom: 2 }}>The Street</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>
            Eating clubs &amp; evenings on Prospect Ave
          </div>
          <span style={{ display: "inline-block", marginTop: 7, fontSize: 8, background: "#C9A84C", color: "#0D0D0D", padding: "2px 9px", borderRadius: 20, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>
            {loading ? "…" : `${openCount} open tonight`}
          </span>
        </div>
      </div>

      <div className="section-label">Tonight's status</div>

      {loading ? <LoadingState /> : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, padding: "0 12px" }}>
          {clubs.map((club) => {
            const status = club.eating_club_status?.[0];
            const isOpen = status?.is_open ?? false;
            return (
              <div key={club.id} style={{ background: "var(--cream,#FDFBF7)", borderRadius: 10, border: isOpen ? "0.5px solid rgba(201,168,76,0.35)" : "0.5px solid var(--mist,#E8E4D8)", padding: 10 }}>
                <div style={{ fontSize: 16, marginBottom: 5 }}>{club.icon ?? "🏛"}</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 11, color: "var(--ink,#0D0D0D)", marginBottom: 3 }}>{club.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: isOpen ? "#4A9A4A" : "#444", flexShrink: 0 }} />
                  <span style={{ fontSize: 8, color: isOpen ? "#4A9A4A" : "var(--ash,#9A9488)", letterSpacing: "0.03em" }}>
                    {isOpen ? (status?.guest_policy ?? "Open") : "Closed tonight"}
                  </span>
                </div>
                <div style={{ fontSize: 8, color: "var(--ash,#9A9488)", marginTop: 2, letterSpacing: "0.02em" }}>
                  {isOpen ? (status?.hours ?? "") : "Check back tomorrow"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="section-label">Upcoming on the street</div>
      <div className="feed" style={{ paddingTop: 4 }}>
        {!loading && events.length === 0 && (
          <p style={{ fontSize: 10, color: "var(--ash,#9A9488)", textAlign: "center", padding: "16px 0", letterSpacing: "0.04em" }}>
            No upcoming street events yet.
          </p>
        )}
        {events.map((ev) => <EventCard key={ev.id} event={ev} />)}
      </div>
    </>
  );
}
