import { useEffect, useState } from "react";
import { clubApi } from "../api";

export default function PendingClubsPage() {
  const [clubs, setClubs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState(null);
  const [error, setError]     = useState("");
  const [toast, setToast]     = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      setClubs(await clubApi.pendingClubs());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function decide(club, action) {
    if (action === "reject" &&
        !window.confirm(`Reject and delete "${club.name}"? This cannot be undone.`)) return;

    setBusyId(club.id); setError(""); setToast("");
    try {
      if (action === "approve") {
        await clubApi.verifyClub(club.id);
        setToast(`${club.name} approved — now visible across The Move.`);
      } else {
        await clubApi.rejectClub(club.id);
        setToast(`${club.name} rejected and removed.`);
      }
      setClubs((cur) => cur.filter((c) => c.id !== club.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(""), 3000);
    }
  }

  return (
    <div style={{ padding: "32px 36px", maxWidth: 880 }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ color: "#C9A84C", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 }}>
          Super-admin
        </div>
        <h1 style={{ fontFamily: "Georgia,serif", color: "#FDFBF7", fontSize: 28, fontWeight: 400, margin: 0 }}>
          Pending club verifications
        </h1>
        <p style={{ color: "#9A9488", fontSize: 12, marginTop: 6, letterSpacing: "0.02em" }}>
          New clubs created on The Move. Approve to mark them as verified — that's
          when they show up to students.
        </p>
      </header>

      {error && <div style={errStyle}>{error}</div>}
      {toast && <div style={okStyle}>{toast}</div>}

      {loading ? (
        <div style={{ color: "#9A9488", fontSize: 12, padding: 32, textAlign: "center" }}>Loading…</div>
      ) : clubs.length === 0 ? (
        <div style={{
          background: "#1A1A1A", border: "0.5px dashed rgba(201,168,76,0.2)",
          borderRadius: 12, padding: 36, textAlign: "center", color: "#9A9488", fontSize: 12,
        }}>
          No clubs awaiting verification. You're all caught up.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clubs.map((c) => {
            const creator = c.club_admins?.[0]?.profiles;
            return (
              <article key={c.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={avatarStyle}>{c.name?.[0] ?? "?"}</div>
                      <div>
                        <div style={{ fontFamily: "Georgia,serif", color: "#FDFBF7", fontSize: 17 }}>
                          {c.name}
                        </div>
                        <div style={{ color: "#9A9488", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
                          {(c.category ?? "general").replace("_", " ")}
                          {" · "}
                          Created {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {c.description && (
                      <p style={{ color: "#E8E4D8", fontSize: 12, lineHeight: 1.55, margin: "6px 0 8px" }}>
                        {c.description}
                      </p>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 11, color: "#9A9488" }}>
                      {c.email     && <span>✉ {c.email}</span>}
                      {c.instagram && <span>◎ @{c.instagram.replace(/^@/, "")}</span>}
                    </div>

                    {creator && (
                      <div style={{
                        marginTop: 10, paddingTop: 10,
                        borderTop: "0.5px solid rgba(201,168,76,0.12)",
                        fontSize: 11, color: "#9A9488", letterSpacing: "0.03em",
                      }}>
                        Submitted by{" "}
                        <span style={{ color: "#C9A84C" }}>{creator.name || creator.email}</span>
                        {creator.class_year ? ` · Class of ${creator.class_year}` : ""}
                        {" · "}
                        <span style={{ color: "#C9A84C" }}>{creator.email}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 110 }}>
                    <button
                      onClick={() => decide(c, "approve")}
                      disabled={busyId === c.id}
                      style={approveBtn}
                    >
                      {busyId === c.id ? "…" : "Verify"}
                    </button>
                    <button
                      onClick={() => decide(c, "reject")}
                      disabled={busyId === c.id}
                      style={rejectBtn}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: "#1A1A1A",
  border: "0.5px solid rgba(201,168,76,0.15)",
  borderRadius: 12, padding: 18,
};
const avatarStyle = {
  width: 38, height: 38, borderRadius: 8,
  background: "#2A2A2A", border: "0.5px solid rgba(201,168,76,0.3)",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#C9A84C", fontFamily: "Georgia,serif", fontSize: 17,
};
const approveBtn = {
  background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 7,
  padding: "9px 12px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
  cursor: "pointer", fontWeight: 600,
};
const rejectBtn = {
  background: "transparent", color: "#CC8888", border: "0.5px solid rgba(204,136,136,0.4)",
  borderRadius: 7, padding: "8px 12px", fontSize: 10, letterSpacing: "0.1em",
  textTransform: "uppercase", cursor: "pointer",
};
const errStyle = {
  background: "rgba(204,136,136,0.08)", border: "0.5px solid rgba(204,136,136,0.3)",
  color: "#CC8888", padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 14,
};
const okStyle = {
  background: "rgba(92,160,92,0.08)", border: "0.5px solid rgba(92,160,92,0.3)",
  color: "#5CA05C", padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 14,
};
