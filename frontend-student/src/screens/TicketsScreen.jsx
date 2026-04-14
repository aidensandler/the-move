import { useState, useEffect } from "react";
import { api } from "../api";
import { LoadingState } from "./AllEventsScreen";

export default function TicketsScreen() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.myTickets().then(setTickets).finally(() => setLoading(false)); }, []);

  const today    = new Date().toISOString().split("T")[0];
  const upcoming = tickets.filter((t) => (t.events?.event_date ?? "") >= today);
  const past     = tickets.filter((t) => (t.events?.event_date ?? "") < today);

  if (loading) return <LoadingState />;

  return (
    <>
      <div className="section-label">Upcoming</div>
      <div className="feed" style={{ paddingTop: 4 }}>
        {upcoming.length === 0 ? (
          <p style={{ fontSize: 10, color: "var(--ash,#9A9488)", letterSpacing: "0.04em" }}>No upcoming tickets.</p>
        ) : (
          upcoming.map((t) => <TicketRow key={t.id} ticket={t} />)
        )}
      </div>

      {past.length > 0 && (
        <>
          <div style={{ height: "0.5px", background: "var(--mist,#E8E4D8)", margin: "8px 0 0" }} />
          <div className="section-label">Past</div>
          <div className="feed" style={{ paddingTop: 4, opacity: 0.5 }}>
            {past.map((t) => <TicketRow key={t.id} ticket={t} />)}
          </div>
        </>
      )}
    </>
  );
}

function TicketRow({ ticket }) {
  const ev = ticket.events ?? {};
  const BANNER_COLORS = { sports:"#0D1A0D", arts:"#1A0A1A", academic:"#0D1A18", street:"#1A0A2E", other:"#111" };
  const bg = ev.banner_bg ?? BANNER_COLORS[ev.category] ?? "#1A1A1A";

  return (
    <div style={{ background: "var(--cream,#FDFBF7)", borderRadius: 10, border: "0.5px solid var(--mist,#E8E4D8)", padding: 11, display: "flex", gap: 11, alignItems: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        {ev.banner_emoji ?? "◈"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: "var(--ink,#0D0D0D)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title ?? "Event"}</div>
        <div style={{ fontSize: 9, color: "var(--ash,#9A9488)", marginTop: 2, letterSpacing: "0.02em" }}>
          {fmtDate(ev.event_date)} · {ev.venue ?? ""}
        </div>
        <div style={{ fontSize: 9, color: "#4A7C4A", marginTop: 2, letterSpacing: "0.02em" }}>
          {ticket.quantity}× {ticket.tier_name} · {ticket.amount_paid > 0 ? `$${Number(ticket.amount_paid).toFixed(2)}` : "Complimentary"} · Confirmed ✓
        </div>
      </div>
      <span style={{ fontSize: 14, color: "var(--gold,#C9A84C)" }}>◈</span>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
