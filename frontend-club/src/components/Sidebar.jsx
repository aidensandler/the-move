const NAV = [
  { id: "dashboard",    icon: "◫", label: "Dashboard" },
  { id: "post",         icon: "✦", label: "Post a flyer" },
  { id: "events",       icon: "◈", label: "Manage events" },
  { id: "profile",      icon: "◎", label: "Club profile" },
  { id: "applications", icon: "✉", label: "Admin applications" },
];

export default function Sidebar({ active, onChange, club, user, onLogout, open = false, onClose }) {
  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      {/* Wordmark */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "0.5px solid rgba(201,168,76,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16 }}>🐯</span>
          <div>
            <div style={{ fontFamily: "var(--serif,'Playfair Display',Georgia,serif)", color: "#FDFBF7", fontSize: 14, fontWeight: 400 }}>
              The Move
            </div>
            <div style={{ color: "#C9A84C", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 1 }}>
              Club Portal
            </div>
          </div>
        </div>
      </div>

      {/* Club identity */}
      <div style={{ padding: "14px 16px", borderBottom: "0.5px solid rgba(201,168,76,0.12)" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 7,
          background: "#2A2A2A", border: "0.5px solid rgba(201,168,76,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Georgia,serif", fontSize: 14, color: "#C9A84C",
          marginBottom: 8,
        }}>
          {club?.name?.[0] ?? "?"}
        </div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: "#FDFBF7", marginBottom: 2 }}>
          {club?.name ?? "Your Club"}
        </div>
        <div style={{ fontSize: 9, color: club?.verified ? "#4A9A4A" : "#9A9488", letterSpacing: "0.04em" }}>
          {club?.verified ? "✓ Verified" : "⏳ Pending verification"}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px" }}>
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => { onChange(item.id); onClose && onClose(); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", borderRadius: 7, border: "none",
              background: active === item.id ? "rgba(201,168,76,0.1)" : "transparent",
              color: active === item.id ? "#C9A84C" : "#9A9488",
              fontSize: 11, cursor: "pointer", textAlign: "left",
              letterSpacing: "0.04em", marginBottom: 1,
              fontFamily: "var(--sans,-apple-system,sans-serif)",
            }}
          >
            <span style={{ fontSize: 13 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: "12px 16px", borderTop: "0.5px solid rgba(201,168,76,0.12)" }}>
        <div style={{ fontSize: 10, color: "#9A9488", marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user?.email}
        </div>
        <button onClick={onLogout} style={{
          fontSize: 9, color: "#9A9488", background: "none", border: "0.5px solid rgba(201,168,76,0.2)",
          cursor: "pointer", padding: "4px 10px", borderRadius: 20,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
