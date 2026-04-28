import { useState, useEffect } from "react";
import { clubApi, getToken } from "./api";
import LoginPage    from "./pages/LoginPage";
import Sidebar      from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import PostFlyerPage from "./pages/PostFlyerPage";
import ManageEventsPage from "./pages/ManageEventsPage";
import ClubProfilePage  from "./pages/ClubProfilePage";
import SetupClubPage    from "./pages/SetupClubPage";
import AdminApplicationsPage from "./pages/AdminApplicationsPage";
import PendingClubsPage from "./pages/PendingClubsPage";

export default function App() {
  const [user, setUser]       = useState(null);
  const [club, setClub]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState("dashboard");
  const [editEvent, setEditEvent] = useState(null); // event being edited
  const [navOpen, setNavOpen] = useState(false);    // mobile drawer

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
    dashboard:       <DashboardPage club={club} onNavigate={setPage} />,
    post:            <PostFlyerPage club={club} editEvent={editEvent} onSaved={() => { setEditEvent(null); setPage("events"); }} onCancel={() => { setEditEvent(null); setPage("events"); }} />,
    events:          <ManageEventsPage club={club} onEdit={openEdit} />,
    profile:         <ClubProfilePage club={club} onUpdated={setClub} />,
    applications:    <AdminApplicationsPage club={club} />,
    "pending-clubs": <PendingClubsPage />,
  };

  const activeLabel = ({
    dashboard: "Dashboard",
    post: "Post a flyer",
    events: "Manage events",
    profile: "Club profile",
    applications: "Admin applications",
    "pending-clubs": "Pending clubs",
  })[page] || "Dashboard";

  return (
    <div className="admin-shell">
      {/* Mobile-only top bar with hamburger */}
      <header className="mobile-topbar">
        <button className="hamburger" onClick={() => setNavOpen(true)} aria-label="Open menu">≡</button>
        <div className="mobile-topbar-brand" style={{ flexDirection: "column", alignItems: "flex-end", gap: 0 }}>
          <span>{activeLabel}</span>
          <small>{club?.name || "The Move · Club Portal"}</small>
        </div>
      </header>

      {/* Backdrop closes the drawer on mobile */}
      {navOpen && <div className="sidebar-backdrop" onClick={() => setNavOpen(false)} />}

      <Sidebar
        active={page}
        onChange={(p) => { setEditEvent(null); setPage(p); }}
        club={club}
        user={user}
        onLogout={handleLogout}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <main className="main-content">
        {pages[page] ?? pages.dashboard}
      </main>
    </div>
  );
}
