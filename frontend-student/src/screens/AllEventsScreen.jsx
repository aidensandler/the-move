import { useState, useEffect, useMemo, useRef } from "react";
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
  const [active, setActive]     = useState(CHIPS[0]);
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  // Search
  const [query, setQuery]       = useState("");
  const [people, setPeople]     = useState([]);
  const [peopleBusy, setPeopleBusy] = useState(false);
  const peopleDebounce = useRef();

  // RSVP state — IDs of events the current user is attending. Keeps the
  // Reserve button lit when the user navigates away and returns.
  const [rsvpedIds, setRsvpedIds] = useState(new Set());

  // Initial event fetch + RSVP-id fetch
  useEffect(() => {
    setLoading(true); setError("");
    const params = {};
    if (active.category) params.category = active.category;
    api.events(params)
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [active]);

  useEffect(() => {
    api.myRsvpIds().then((ids) => setRsvpedIds(new Set(ids ?? []))).catch(() => {});
  }, []);

  // People search — debounced. Only fires when the user has typed something.
  useEffect(() => {
    clearTimeout(peopleDebounce.current);
    if (query.trim().length < 2) { setPeople([]); return; }
    setPeopleBusy(true);
    peopleDebounce.current = setTimeout(async () => {
      try {
        const rows = await api.searchUsers(query.trim());
        setPeople(rows ?? []);
      } catch { setPeople([]); }
      finally { setPeopleBusy(false); }
    }, 240);
    return () => clearTimeout(peopleDebounce.current);
  }, [query]);

  // Client-side event filter — title / venue / club / description.
  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => {
      const hay = [e.title, e.venue, e.description, e.clubs?.name].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [events, query]);

  async function follow(person) {
    try {
      const { following } = await api.toggleFollow(person.id);
      setPeople((prev) => prev.map((p) => p.id === person.id ? { ...p, _following: following } : p));
    } catch { /* silent */ }
  }

  // Inject the RSVP flag into each event before rendering.
  const enriched = useMemo(
    () => filteredEvents.map((e) => ({ ...e, _userRsvped: rsvpedIds.has(e.id) })),
    [filteredEvents, rsvpedIds]
  );

  return (
    <>
      {/* Search */}
      <div style={{ padding: "10px 12px", background: "var(--cream,#FDFBF7)", borderBottom: "0.5px solid var(--mist,#E8E4D8)" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", background: "var(--smoke,#F7F5F0)", border: "0.5px solid var(--mist,#E8E4D8)", borderRadius: 20, padding: "7px 13px", fontSize: 11, color: "var(--ink,#0D0D0D)", outline: "none", letterSpacing: "0.02em", fontFamily: "inherit" }}
          placeholder="Search events, clubs, or people…"
        />
      </div>

      {/* People results — only when the user has typed something */}
      {query.trim().length >= 2 && (
        <div style={{ padding: "8px 12px 4px", background: "var(--cream,#FDFBF7)", borderBottom: "0.5px solid var(--mist,#E8E4D8)" }}>
          <div className="section-label" style={{ padding: "0 0 6px" }}>People</div>
          {peopleBusy && people.length === 0 ? (
            <p style={{ fontSize: 10, color: "var(--ash,#9A9488)", padding: "4px 0", letterSpacing: "0.04em" }}>Searching…</p>
          ) : people.length === 0 ? (
            <p style={{ fontSize: 10, color: "var(--ash,#9A9488)", padding: "4px 0", letterSpacing: "0.04em" }}>No matching people.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {people.slice(0, 5).map((p) => (
                <PersonRow key={p.id} person={p} onToggle={() => follow(p)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chip filters — hide while the user is searching to keep the focus on results */}
      {!query && (
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
      )}

      <div className="feed">
        {loading && <LoadingState />}
        {error   && <p style={{ fontSize: 11, color: "#8B2020", textAlign: "center", padding: 20 }}>{error}</p>}
        {!loading && !error && enriched.length === 0 && (
          query ? <NoMatches query={query} /> : <EmptyState />
        )}
        {enriched.map((ev) => <EventCard key={ev.id} event={ev} onTicket={onTicket} />)}
      </div>
    </>
  );
}

function PersonRow({ person, onToggle }) {
  const following = person._following !== false ? person._following : false;
  return (
    <div style={{ background: "var(--smoke,#F7F5F0)", borderRadius: 8, border: "0.5px solid var(--mist,#E8E4D8)", padding: "7px 9px", display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1A1A1A", border: "0.5px solid rgba(201,168,76,0.3)", color: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 500, flexShrink: 0 }}>
        {(person.name ?? person.email ?? "?")[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 11, color: "var(--ink,#0D0D0D)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {person.name ?? person.email}
          {person.class_year ? <span style={{ color: "var(--ash,#9A9488)", fontSize: 9, marginLeft: 5 }}>’{String(person.class_year).slice(-2)}</span> : null}
        </div>
        <div style={{ fontSize: 8, color: "var(--ash,#9A9488)", letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {person.email}
        </div>
      </div>
      <button
        onClick={onToggle}
        style={{
          fontSize: 8, padding: "3px 8px", borderRadius: 20,
          border: "0.5px solid #C9A84C",
          color: following ? "var(--ink,#0D0D0D)" : "#C9A84C",
          background: following ? "#C9A84C" : "transparent",
          cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0,
        }}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

function NoMatches({ query }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 20px" }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>◌</div>
      <p style={{ fontSize: 11, color: "#9A9488", letterSpacing: "0.04em" }}>
        No events match "<span style={{ color: "#C9A84C" }}>{query}</span>"
      </p>
    </div>
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
