import { useEffect, useState } from "react";
import { clubApi } from "../api";

export default function AdminApplicationsPage({ club }) {
  const [tab, setTab]         = useState("pending"); // pending | approved | rejected
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState(null);
  const [error, setError]     = useState("");
  const [toast, setToast]     = useState("");

  async function load(status = tab) {
    setLoading(true); setError("");
    try {
      const data = await clubApi.listApplications(status);
      setApps(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(tab); /* eslint-disable-next-line */ }, [tab]);

  async function decide(id, action) {
    setBusyId(id); setError(""); setToast("");
    try {
      if (action === "approve") {
        await clubApi.approveApplication(id);
        setToast("Approved — they're now a club admin.");
      } else {
        await clubApi.rejectApplication(id);
        setToast("Application rejected.");
      }
      // Optimistically remove from current list
      setApps((cur) => cur.filter((a) => a.id !== id));
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
          Club admins
        </div>
        <h1 style={{ fontFamily: "Georgia,serif", color: "#FDFBF7", fontSize: 28, fontWeight: 400, margin: 0 }}>
          Admin applications
        </h1>
        <p style={{ color: "#9A9488", fontSize: 12, marginTop: 6, letterSpacing: "0.02em" }}>
          Review students who've requested to be added as an admin of {club?.name || "your club"}.
        </p>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "0.5px solid rgba(201,168,76,0.15)" }}>
        {["pending", "approved", "rejected"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 14px", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
              color: tab === t ? "#C9A84C" : "#9A9488",
              borderBottom: tab === t ? "1.5px solid #C9A84C" : "1.5px solid transparent",
              marginBottom: -0.5,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <div style={errStyle}>{error}</div>}
      {toast && <div style={okStyle}>{toast}</div>}

      {loading ? (
        <div style={{ color: "#9A9488", fontSize: 12, padding: 32, textAlign: "center" }}>Loading…</div>
      ) : apps.length === 0 ? (
        <div style={{
          background: "#1A1A1A", border: "0.5px dashed rgba(201,168,76,0.2)",
          borderRadius: 12, padding: 36, textAlign: "center", color: "#9A9488", fontSize: 12,
        }}>
          No {tab} applications.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {apps.map((a) => (
            <article key={a.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={avatarStyle}>
                      {a.profiles?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div style={{ fontFamily: "Georgia,serif", color: "#FDFBF7", fontSize: 15 }}>
                        {a.profiles?.name || "Unknown applicant"}
                      </div>
                      <div style={{ color: "#9A9488", fontSize: 11, letterSpacing: "0.02em" }}>
                        {a.profiles?.email}
                        {a.profiles?.class_year ? ` · Class of ${a.profiles.class_year}` : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ color: "#9A9488", fontSize: 10, letterSpacing: "0.05em", marginBottom: 8 }}>
                    Applied to <span style={{ color: "#C9A84C" }}>{a.clubs?.name || "—"}</span>
                    {" · "}
                    {new Date(a.created_at).toLocaleDateString()}
                  </div>

                  {a.message && (
                    <blockquote style={{
                      margin: 0, padding: "10px 14px",
                      background: "#0D0D0D", borderLeft: "2px solid #C9A84C",
                      borderRadius: 4, color: "#E8E4D8", fontSize: 12, lineHeight: 1.5,
                      fontStyle: "italic",
                    }}>
                      "{a.message}"
                    </blockquote>
                  )}
                </div>

                {tab === "pending" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 110 }}>
                    <button
                      onClick={() => decide(a.id, "approve")}
                      disabled={busyId === a.id}
                      style={approveBtn}
                    >
                      {busyId === a.id ? "…" : "Approve"}
                    </button>
                    <button
                      onClick={() => decide(a.id, "reject")}
                      disabled={busyId === a.id}
                      style={rejectBtn}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {tab !== "pending" && (
                  <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: tab === "approved" ? "#5CA05C" : "#CC8888" }}>
                    {tab}
                  </div>
                )}
              </div>
            </article>
          ))}
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
  width: 36, height: 36, borderRadius: 8,
  background: "#2A2A2A", border: "0.5px solid rgba(201,168,76,0.3)",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#C9A84C", fontFamily: "Georgia,serif", fontSize: 16,
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
