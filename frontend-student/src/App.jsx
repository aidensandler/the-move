import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";
import AllEventsScreen from "./screens/AllEventsScreen";
import ForYouScreen from "./screens/ForYouScreen";
import TheStreetScreen from "./screens/TheStreetScreen";
import FriendsScreen from "./screens/FriendsScreen";
import TicketsScreen from "./screens/TicketsScreen";
import TicketModal from "./components/TicketModal";
import "./index.css";

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab]   = useState("all");
  const [ticketEvent, setTicketEvent] = useState(null);

  if (loading) {
    return (
      <div style={{ minHeight:"100dvh", background:"#0D0D0D", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
        <span style={{ fontSize:36 }}>🐯</span>
        <div style={{ color:"#C9A84C", fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase" }}>The Move</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const screens = {
    all:     <AllEventsScreen onTicket={setTicketEvent} />,
    foryou:  <ForYouScreen onTicket={setTicketEvent} />,
    street:  <TheStreetScreen />,
    friends: <FriendsScreen />,
    tickets: <TicketsScreen />,
  };

  return (
    <div className="app-shell">
      <TopBar />
      <main className="screen-content">{screens[activeTab]}</main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
      {ticketEvent && <TicketModal event={ticketEvent} onClose={() => setTicketEvent(null)} />}
    </div>
  );
}
