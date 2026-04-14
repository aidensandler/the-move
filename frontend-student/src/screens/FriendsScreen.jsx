import { useState, useEffect } from "react";
import { api } from "../api";
import { LoadingState } from "./AllEventsScreen";

export default function FriendsScreen() {
  const [friends, setFriends]   = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([api.friends(), api.friendsActivity()])
      .then(([f, a]) => { setFriends(f ?? []); setActivity(a ?? []); })
      .finally(() => setLoading(false));
  }, []);

  async function toggleFollow(friend) {
    const { following } = await api.toggleFollow(friend.id);
    setFriends((prev) => prev.map((f) => f.id === friend.id ? { ...f, _following: following } : f));
  }

  if (loading) return <LoadingState />;

  return (
    <>
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
            You're not following anyone yet.
          </p>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} style={{ background: "var(--cream,#FDFBF7)", borderRadius: 10, border: "0.5px solid var(--mist,#E8E4D8)", padding: "9px 11px", display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1A1A1A", border: "0.5px solid rgba(201,168,76,0.3)", color: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                {(friend.name ?? friend.email ?? "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: "var(--ink,#0D0D0D)" }}>{friend.name ?? friend.email}</div>
                <div style={{ fontSize: 9, color: "var(--ash,#9A9488)", marginTop: 1, letterSpacing: "0.03em" }}>{friend.email}</div>
              </div>
              <button
                onClick={() => toggleFollow(friend)}
                style={{ fontSize: 8, padding: "4px 9px", borderRadius: 20, border: "0.5px solid #C9A84C", color: friend._following === false ? "#C9A84C" : "var(--ink,#0D0D0D)", background: friend._following === false ? "transparent" : "#C9A84C", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}
              >
                {friend._following === false ? "Follow" : "Following"}
              </button>
            </div>
          ))
        )}
      </div>
    </>
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
