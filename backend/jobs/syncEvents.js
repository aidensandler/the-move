import cron from "node-cron";
import fetch from "node-fetch";
import { supabase } from "../db/supabase.js";

// ── Helpers ───────────────────────────────────

function parseDate(str) {
  try { return new Date(str).toISOString().split("T")[0]; }
  catch { return null; }
}

// ── Princeton Events Calendar (events.princeton.edu RSS) ──────────────────

async function syncPrincetonEvents() {
  try {
    const res = await fetch("https://events.princeton.edu/feeds/main.rss");
    const text = await res.text();

    // Simple RSS parse (no external lib needed for basic fields)
    const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)];

    for (const [, itemXml] of items) {
      const title   = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]?.trim();
      const link    = itemXml.match(/<link>(.*?)<\/link>/)?.[1]?.trim();
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
      const desc    = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
                       ?.replace(/<[^>]+>/g, "").trim().slice(0, 500);
      const location = itemXml.match(/<location>(.*?)<\/location>/)?.[1]?.trim()
                    ?? itemXml.match(/Location:\s*(.*?)(?:\n|<)/)?.[1]?.trim();

      if (!title || !pubDate) continue;

      const event_date = parseDate(pubDate);
      if (!event_date) continue;

      // Upsert by title + date to avoid duplicates
      await supabase.from("events").upsert({
        title,
        description: desc,
        category: classifyEvent(title, desc),
        source: "auto",
        venue: location ?? "Princeton Campus",
        event_date,
        ticket_price: null,
        ticket_url: link,
        banner_emoji: "🎓",
        banner_bg: "#E0F2F1",
        is_published: true,
      }, { onConflict: "title,event_date", ignoreDuplicates: true });
    }

    console.log(`[sync] Princeton Events: processed ${items.length} items`);
  } catch (err) {
    console.error("[sync] Princeton Events failed:", err.message);
  }
}

// ── Princeton Athletics (goprincetontigers.com) ───────────────────────────
// They publish an iCal feed — we parse it manually

async function syncAthletics() {
  const feeds = [
    { url: "https://goprincetontigers.com/calendar.ashx/download.ics?sport_id=2",  sport: "Men's Basketball",  emoji: "🏀", bg: "#FFF3E0" },
    { url: "https://goprincetontigers.com/calendar.ashx/download.ics?sport_id=11", sport: "Women's Lacrosse",   emoji: "🥍", bg: "#FCE7F3" },
    { url: "https://goprincetontigers.com/calendar.ashx/download.ics?sport_id=8",  sport: "Football",           emoji: "🏈", bg: "#FFF3E0" },
    { url: "https://goprincetontigers.com/calendar.ashx/download.ics?sport_id=3",  sport: "Baseball",           emoji: "⚾", bg: "#E0F2F1" },
  ];

  for (const { url, sport, emoji, bg } of feeds) {
    try {
      const res  = await fetch(url);
      const ical = await res.text();
      const events = ical.split("BEGIN:VEVENT").slice(1);

      for (const block of events) {
        const summary  = block.match(/SUMMARY:(.*)/)?.[1]?.trim();
        const dtstart  = block.match(/DTSTART[^:]*:(.*)/)?.[1]?.trim();
        const location = block.match(/LOCATION:(.*)/)?.[1]?.trim();
        const url_val  = block.match(/URL:(.*)/)?.[1]?.trim();

        if (!summary || !dtstart) continue;

        const event_date = dtstart.slice(0, 4) + "-" + dtstart.slice(4, 6) + "-" + dtstart.slice(6, 8);
        const start_time = dtstart.length > 8
          ? dtstart.slice(9, 11) + ":" + dtstart.slice(11, 13)
          : null;

        await supabase.from("events").upsert({
          title:       `${sport}: ${summary}`,
          category:    "sports",
          source:      "auto",
          venue:       location ?? "Princeton Athletic Facilities",
          event_date,
          start_time,
          banner_emoji: emoji,
          banner_bg:   bg,
          ticket_price: null,
          ticket_url:  url_val ?? "https://goprincetontigers.com",
          is_published: true,
        }, { onConflict: "title,event_date", ignoreDuplicates: true });
      }

      console.log(`[sync] Athletics ${sport}: ${events.length} events`);
    } catch (err) {
      console.error(`[sync] Athletics ${sport} failed:`, err.message);
    }
  }
}

// ── Category classifier ───────────────────────

function classifyEvent(title = "", desc = "") {
  const text = (title + " " + desc).toLowerCase();
  if (/concert|music|orchestra|jazz|choir|recital/.test(text)) return "arts";
  if (/lecture|seminar|talk|panel|symposium|colloquium/.test(text)) return "academic";
  if (/game|match|tournament|athletics|sport|swim|track|tennis|soccer/.test(text)) return "sports";
  if (/party|social|mixer|gathering|happy hour/.test(text)) return "social";
  if (/food|dinner|lunch|brunch|reception|bbq/.test(text)) return "food";
  return "general";
}

// ── Schedule ──────────────────────────────────

export function startSyncJobs() {
  // Run every 4 hours
  cron.schedule("0 */4 * * *", async () => {
    console.log("[sync] Starting scheduled sync...");
    await syncPrincetonEvents();
    await syncAthletics();
  });

  // Also run once immediately on startup
  setTimeout(async () => {
    console.log("[sync] Running initial sync...");
    await syncPrincetonEvents();
    await syncAthletics();
  }, 3000);
}
