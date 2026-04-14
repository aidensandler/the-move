import { useAuth } from "../context/AuthContext";

export default function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header style={{
      background: "var(--ink,#0D0D0D)",
      padding: "13px 16px 10px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100,
      borderBottom: "0.5px solid rgba(201,168,76,0.2)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ fontSize: 18 }}>🐯</span>
        <div>
          <div style={{ fontFamily: "var(--serif,'Playfair Display',Georgia,serif)", color: "#FDFBF7", fontSize: 16, fontWeight: 400, letterSpacing: "0.02em" }}>
            The Move
          </div>
          <div style={{ color: "#C9A84C", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 300, marginTop: 1 }}>
            Princeton
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "rgba(201,168,76,0.7)", letterSpacing: "0.03em" }}>
          {user?.name?.split(" ")[0] ?? user?.email?.split("@")[0]}
        </span>
        <button onClick={logout} style={{
          background: "transparent", border: "0.5px solid rgba(201,168,76,0.3)",
          color: "#9A9488", fontSize: 9, padding: "4px 10px", borderRadius: 20,
          cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          Sign out
        </button>
      </div>
    </header>
  );
}
