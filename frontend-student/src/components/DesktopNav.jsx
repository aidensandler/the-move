import { useAuth } from "../context/AuthContext";
import { TABS } from "./BottomNav";

// Sidebar rail shown on desktop (≥900px). Hidden on mobile via CSS.
export default function DesktopNav({ active, onChange }) {
  const { user, logout } = useAuth();

  return (
    <aside className="desktop-nav">
      {/* Wordmark */}
      <div style={{ padding: "22px 18px 18px", borderBottom: "0.5px solid rgba(201,168,76,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>🐯</span>
          <div>
            <div style={{
              fontFamily: "var(--serif,'Playfair Display',Georgia,serif)",
              color: "#FDFBF7", fontSize: 18, fontWeight: 400, letterSpacing: "0.02em",
            }}>
              The Move
            </div>
            <div style={{
              color: "#C9A84C", fontSize: 8, letterSpacing: "0.22em",
              textTransform: "uppercase", marginTop: 2,
            }}>
              Princeton
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {TABS.map((tab) => {
          const on = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 8, border: "none",
                background: on ? "rgba(201,168,76,0.1)" : "transparent",
                color: on ? "#C9A84C" : "#9A9488",
                fontSize: 12, cursor: "pointer", textAlign: "left",
                letterSpacing: "0.04em",
                fontFamily: "var(--sans,-apple-system,sans-serif)",
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: "14px 18px", borderTop: "0.5px solid rgba(201,168,76,0.12)" }}>
        <div style={{
          fontSize: 11, color: "#C9A84C", letterSpacing: "0.02em",
          fontFamily: "var(--serif,'Playfair Display',Georgia,serif)",
          marginBottom: 2,
        }}>
          {user?.name?.split(" ")[0] ?? "Friend"}
        </div>
        <div style={{
          fontSize: 10, color: "#9A9488",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 9,
        }}>
          {user?.email}
        </div>
        <button onClick={logout} style={{
          fontSize: 9, color: "#9A9488", background: "none",
          border: "0.5px solid rgba(201,168,76,0.25)", cursor: "pointer",
          padding: "5px 12px", borderRadius: 20,
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
