import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { LoadingState } from "./AllEventsScreen";

export default function FriendsScreen() {
  const [friends, setFriends]   = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Find-friends state
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const debounceRef = useRef();

  useEffect(() => {
    Promise.all([api.friends(), api.friendsActivity()])
      .then(([f, a]) => { setFriends(f ?? []); setActivity(a ?? []); })
      .finally(() => setLoading(false));
  }, []);

  // Debounced search — runs whenever the box is open and query changes.
  useEffect(() => {
    if (!searchOpen) return;
    clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const rows = await api.searchUsers(query);
        setResults(rows ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchOpen]);

  async function toggleFollow(user) {
    const { following } = await api.toggleFollow(user.id);
    // Update both lists
    setResults((prev) => prev.map((u) => u.id === user.id ? { ...u, _following: following } : u));
    setFriends((prev) => {
      if (following) {
        if (prev.some((f) => f.id === user.id)) return prev;
        return [...prev, { ...user, _following: true }];
      }
      return prev.filter((f) => f.id !== user.id);
    });
  }

  if (loading) return <LoadingState />;

  return (
    <>
      {/* ── Find friends ─────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 6px" }}>
        <div className="section-label" style={{ padding: 0 }}>Find friends</div>
        <button
          onClick={() => { setSearchOpen((v) => !v); if (!searchOpen) setQuery(""); }}
          style={{
            fontSize: 9, padding: "4px 10px", borderRadius: 20,
            border: "0.5px solid rgba(201,168,76,0.4)",
            background: searchOpen ? "#C9A84C" : "transparent",
            color: searchOpen ? "var(--ink,#0D0D0D)" : "#C9A84C",
            cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase",
          }}
        >
          {searchOpen ? "Done" : "+ Add"}
        </button>
      </div>

      {searchOpen && (
        <div style={{ padding: "0 4px 10px" }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              width: "100%", background: "var(--cream,#FDFBF7)",
              border: "0.5px solid var(--mist,#E8E4D8)", borderRadius: 10,
              padding: "9px 12px", fontSize: 12, color: "var(--ink,#0D0D0D)",
              outline: "none", fontFamily: "inherit",
            }}
          />
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {searching && results.length === 0 ? (
              <p style={{ fontSize: 10, color: "var(--ash,#9A9488)", letterSpacing: "0.04em", padding: "6px 0" }}>
                Searching…
              </p>
            ) : results.length === 0 ? (
              <p style={{ fontSize: 10, color: "var(--ash,#9A9488)", letterSpacing: "0.04em", padding: "6px 0" }}>
                {query ? "No matches." : "No suggestions yet."}
              </p>
            ) : (
              results.map((u) => (
                <PersonRow key={u.id} person={u} onToggle={() => toggleFollow(u)} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Recent activity ─────────────────────── */}
      <div className="section-label">Recent activity</div>

      <div style={{ padding: "0 12px" }}>
        {activity.length === 0 ? (
          <p style={{ fontSize: 10, color: "var(--ash,#9A9488)", padding: "12px 0", letterSpacing: "0.04em" }}>
            Follow friends to see their activity here.
          </p>
        ) : (
          activity.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: i < activity.length - 1 ? "0.5px solid var(--mist,#E8E4D8)" : "none" }}>
              <div style={{ width: 1, background: "#C9A84C", opacity: 0.4, flexShrink: 0, alignSelf: "stretch" }} />
              <div>
                <div style={{ fontSize: 11, color: "var(--ink3,#2A2A2A)", lineHeight: 1.5 }}>
                  <strong>{item.profiles?.name ?? "Someone"}</strong> is attending{" "}
                  <strong>{item.events?.title ?? "an event"}</strong>
                </div>
                <div style={{ fontSize: 9, color: "var(--ash,#9A9488)", marginTop: 2, letterSpacing: "0.03em" }}>
                  {item.events?.venue} · {fmtRelative(item.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ height: "0.5px", background: "var(--mist,#E8E4D8)", margin: "6px 0 0" }} />
      <div className="section-label">Following</div>

      <div className="feed" style={{ paddingTop: 4 }}>
        {friends.length === 0 ? (
          <p style={{ fontSize: 10, color: "var(--ash,#9A9488)", letterSpacing: "0.04em" }}>
            You're not following anyone yet. Tap <strong>+ Add</strong> to find friends.
          </p>
        ) : (
          friends.map((friend) => (
            <PersonRow
              key={friend.id}
              person={{ ...friend, _following: friend._following !== false }}
              onToggle={() => toggleFollow(friend)}
            />
          ))
        )}
      </div>
    </>
  );
}

// Shared row — used in both the search results and the Following list.
function PersonRow({ person, onToggle }) {
  const following = person._following !== false; // default true if not specified
  return (
    <div style={{ background: "var(--cream,#FDFBF7)", borderRadius: 10, border: "0.5px solid var(--mist,#E8E4D8)", padding: "9px 11px", display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1A1A1A", border: "0.5px solid rgba(201,168,76,0.3)", color: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
        {(person.name ?? person.email ?? "?")[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: "var(--ink,#0D0D0D)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {person.name ?? person.email}
          {person.class_year ? <span style={{ color: "var(--ash,#9A9488)", fontSize: 10, marginLeft: 6 }}>’{String(person.class_year).slice(-2)}</span> : null}
        </div>
        <div style={{ fontSize: 9, color: "var(--ash,#9A9488)", marginTop: 1, letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {person.email}
        </div>
      </div>
      <button
        onClick={onToggle}
        style={{
          fontSize: 8, padding: "4px 9px", borderRadius: 20,
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

function fmtRelative(iso) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
