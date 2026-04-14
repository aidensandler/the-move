import { useState, useEffect } from "react";
import EventCard from "../components/EventCard";
import { api } from "../api";

const CHIPS = [
  { label: "All",           category: null },
  { label: "Sports",        category: "sports" },
  { label: "Arts",          category: "arts" },
  { label: "Academic",      category: "academic" },
  { label: "✦ The Street",  category: "street" },
  { label: "Free Food",     category: "food" },
];

export default function AllEventsScreen({ onTicket }) {
  const [active, setActive] = useState(CHIPS[0]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    const params = {};
    if (active.category) params.category = active.category;
    api.events(params)
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [active]);

  return (
    <>
      {/* Search */}
      <div style={{ padding: "10px 12px", background: "var(--cream,#FDFBF7)", borderBottom: "0.5px solid var(--mist,#E8E4D8)" }}>
        <input
          style={{ width: "100%", background: "var(--smoke,#F7F5F0)", border: "0.5px solid var(--mist,#E8E4D8)", borderRadius: 20, padding: "7px 13px", fontSize: 10, color: "var(--ink,#0D0D0D)", outline: "none", letterSpacing: "0.03em" }}
          placeholder="Search events, clubs, eating clubs…"
          readOnly
        />
      </div>

      {/* Chip filters */}
      <div style={{ display: "flex", gap: 5, padding: "9px 12px", overflowX: "auto", background: "var(--cream,#FDFBF7)", borderBottom: "0.5px solid var(--mist,#E8E4D8)", scrollbarWidth: "none" }}>
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            className={`chip ${chip.label === active.label ? "active" : ""} ${chip.label.includes("Street") ? "street" : ""}`}
            onClick={() => setActive(chip)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="feed">
        {loading && <LoadingState />}
        {error   && <p style={{ fontSize: 11, color: "#8B2020", textAlign: "center", padding: 20 }}>{error}</p>}
        {!loading && !error && events.length === 0 && <EmptyState />}
        {events.map((ev) => <EventCard key={ev.id} event={ev} onTicket={onTicket} />)}
      </div>
    </>
  );
}

export function LoadingState() {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 20, color: "#C9A84C", marginBottom: 8 }}>✦</div>
      <p style={{ fontSize: 10, color: "#9A9488", letterSpacing: "0.08em", textTransform: "uppercase" }}>Loading…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>◈</div>
      <p style={{ fontSize: 10, color: "#9A9488", letterSpacing: "0.06em" }}>Nothing here yet</p>
    </div>
  );
}
