import { useState, useEffect } from "react";
import { clubApi, getToken } from "./api";
import LoginPage    from "./pages/LoginPage";
import Sidebar      from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import PostFlyerPage from "./pages/PostFlyerPage";
import ManageEventsPage from "./pages/ManageEventsPage";
import ClubProfilePage  from "./pages/ClubProfilePage";
import SetupClubPage    from "./pages/SetupClubPage";

export default function App() {
  const [user, setUser]       = useState(null);
  const [club, setClub]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState("dashboard");
  const [editEvent, setEditEvent] = useState(null); // event being edited

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    Promise.all([clubApi.me(), clubApi.myClub()])
      .then(([profile, clubData]) => { setUser(profile); setClub(clubData); })
      .catch(() => {
        clubApi.me().then(setUser).catch(() => localStorage.removeItem("club_token"));
      })
      .finally(() => setLoading(false));
  }, []);

  function handleLogin(profile, clubData) {
    setUser(profile);
    setClub(clubData);
    setPage("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("club_token");
    setUser(null); setClub(null);
  }

  function openEdit(event) {
    setEditEvent(event);
    setPage("post");
  }

  if (loading) {
    return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100dvh", fontSize:36 }}>🐯</div>;
  }

  if (!user) return <LoginPage onLogin={handleLogin} />;

  // Club not set up yet
  if (!club) return <SetupClubPage user={user} onCreated={(c) => { setClub(c); setPage("dashboard"); }} />;

  const pages = {
    dashboard: <DashboardPage club={club} onNavigate={setPage} />,
    post:      <PostFlyerPage club={club} editEvent={editEvent} onSaved={() => { setEditEvent(null); setPage("events"); }} onCancel={() => { setEditEvent(null); setPage("events"); }} />,
    events:    <ManageEventsPage club={club} onEdit={openEdit} />,
    profile:   <ClubProfilePage club={club} onUpdated={setClub} />,
  };

  return (
    <div className="admin-shell">
      <Sidebar active={page} onChange={(p) => { setEditEvent(null); setPage(p); }} club={club} user={user} onLogout={handleLogout} />
      <main className="main-content">
        {pages[page] ?? pages.dashboard}
      </main>
    </div>
  );
}
