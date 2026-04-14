const TABS = [
  { id: "all",     icon: "⌂", label: "All" },
  { id: "foryou",  icon: "✦", label: "For You" },
  { id: "street",  icon: "🕯", label: "Street" },
  { id: "friends", icon: "◎", label: "Friends" },
  { id: "tickets", icon: "◈", label: "Tickets" },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      display: "flex",
      background: "#1A1A1A",
      borderTop: "0.5px solid rgba(201,168,76,0.18)",
      zIndex: 200,
    }}>
      {TABS.map((tab) => {
        const on = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            flex: 1, padding: "8px 0 10px", border: "none", background: "transparent",
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            borderTop: `1.5px solid ${on ? "#C9A84C" : "transparent"}`,
            color: on ? "#C9A84C" : "#9A9488",
            fontSize: 9, letterSpacing: "0.07em", textTransform: "uppercase",
          }}>
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
