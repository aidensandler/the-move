import { useState } from "react";
import { api } from "../api";

const TIERS = [
  { name: "General",   multiplier: 1 },
  { name: "Courtside", multiplier: 2.25 },
  { name: "Student",   multiplier: 0.625 },
];

export default function TicketModal({ event, onClose }) {
  const base      = Number(event.ticket_price ?? 0);
  const [tierIdx, setTierIdx] = useState(0);
  const [qty, setQty]         = useState(1);
  const [busy, setBusy]       = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const tierPrice = Math.round(base * TIERS[tierIdx].multiplier);
  const total     = (tierPrice * qty).toFixed(2);

  async function purchase() {
    setBusy(true); setError("");
    try {
      await api.purchaseTicket({ event_id: event.id, quantity: qty, tier_name: TIERS[tierIdx].name, amount_paid: Number(total) });
      setDone(true);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const modalStyle = {
    background: "#FDFBF7", borderRadius: 16, padding: 22,
    border: "0.5px solid #E8E4D8", width: "100%", maxWidth: 430, margin: "0 auto",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(13,13,13,0.78)", display: "flex", alignItems: "flex-end", zIndex: 300 }} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 28, color: "#C9A84C" }}>◈</div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, color: "#0D0D0D", margin: "10px 0 6px" }}>Confirmed</div>
            <p style={{ fontSize: 10, color: "#9A9488", letterSpacing: "0.04em" }}>Your ticket appears in the Tickets tab.</p>
            <button onClick={onClose} style={buyBtnStyle}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 30 }}>{event.banner_emoji ?? "◈"}</div>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 15, color: "#0D0D0D", marginTop: 6 }}>{event.title}</div>
              <div style={{ fontSize: 10, color: "#9A9488", marginTop: 3, letterSpacing: "0.04em" }}>{event.venue}</div>
            </div>

            <div style={{ borderTop: "0.5px solid #E8E4D8", margin: "12px 0" }} />

            <div style={{ fontSize: 8, color: "#9A9488", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Select tier</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {TIERS.map((tier, i) => {
                const p = Math.round(base * tier.multiplier);
                return (
                  <div key={tier.name} onClick={() => setTierIdx(i)} style={{
                    flex: 1, border: i === tierIdx ? "1.5px solid #C9A84C" : "0.5px solid #E8E4D8",
                    borderRadius: 8, padding: "7px 4px", textAlign: "center", cursor: "pointer",
                    background: i === tierIdx ? "#FDFBF7" : "#F7F5F0",
                  }}>
                    <div style={{ fontSize: 9, color: "#9A9488", letterSpacing: "0.06em", textTransform: "uppercase" }}>{tier.name}</div>
                    <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 14, color: "#0D0D0D", marginTop: 2 }}>${p}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: "#9A9488" }}>Quantity</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setQty(Math.max(1,qty-1))} style={qtyBtnStyle}>−</button>
                <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, color: "#0D0D0D" }}>{qty}</span>
                <button onClick={() => setQty(Math.min(10,qty+1))} style={qtyBtnStyle}>+</button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "0.5px solid #E8E4D8", marginBottom: 14 }}>
              <span style={{ fontSize: 9, color: "#9A9488", letterSpacing: "0.08em", textTransform: "uppercase" }}>Total</span>
              <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 17, color: "#0D0D0D" }}>${total}</span>
            </div>

            {error && <p style={{ fontSize: 11, color: "#8B2020", marginBottom: 8 }}>{error}</p>}

            <button onClick={purchase} disabled={busy} style={buyBtnStyle}>
              {busy ? "Processing…" : `Purchase · $${total}`}
            </button>
            <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

const qtyBtnStyle = { width: 26, height: 26, borderRadius: "50%", border: "0.5px solid #E8E4D8", background: "#F7F5F0", fontSize: 16, cursor: "pointer", color: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center" };
const buyBtnStyle = { width: "100%", background: "#0D0D0D", color: "#C9A84C", border: "none", borderRadius: 8, padding: 12, fontSize: 10, fontWeight: 400, cursor: "pointer", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" };
const cancelBtnStyle = { width: "100%", background: "transparent", color: "#9A9488", border: "0.5px solid #E8E4D8", borderRadius: 8, padding: 10, fontSize: 9, cursor: "pointer", letterSpacing: "0.06em" };
