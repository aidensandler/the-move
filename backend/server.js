import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRoutes   from "./routes/auth.js";
import eventRoutes  from "./routes/events.js";
import socialRoutes from "./routes/social.js";
import clubRoutes   from "./routes/clubs.js";
import { startSyncJobs } from "./jobs/syncEvents.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_STUDENT_URL || "http://localhost:5173",
    process.env.FRONTEND_CLUB_URL    || "http://localhost:5174",
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: "Too many requests, please try again later" },
}));

// ── Routes ─────────────────────────────────────
app.use("/api/auth",   authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/clubs",  clubRoutes);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// 404 fallback
app.use((_, res) => res.status(404).json({ error: "Route not found" }));

// ── Start ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🐯 The Move API running on http://localhost:${PORT}`);
  startSyncJobs();
});
