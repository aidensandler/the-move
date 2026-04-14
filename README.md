# 🐯 The Move — Princeton Campus Events App

**The Move** is the answer to "what's the move tonight?" — a luxuriously designed full-stack campus events hub for Princeton students.

## Three packages

```
the-move/
├── backend/              # Node.js + Express + Supabase (PostgreSQL)
├── frontend-student/     # React PWA — student-facing mobile app
└── frontend-club/        # React — club admin portal (post flyers, manage events)
```

---

## 🚀 Quick start

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project

### Step 1 — Supabase setup (5 min)
1. Create a project at supabase.com
2. In the SQL Editor, paste and run the entire contents of `backend/db/schema.sql`
3. Go to **Project Settings → API** — copy your Project URL, anon key, and service role key
4. Go to **Storage** → create a bucket called `flyers` (public read, authenticated write)
5. Go to **Authentication → Settings** → restrict signups to `@princeton.edu` (Email domain allowlist)

### Step 2 — Backend
```bash
cd backend
cp .env.example .env   # paste your Supabase credentials
npm install
npm run dev            # http://localhost:4000
```
The auto-sync job fires immediately — Princeton events + athletics will start populating.

### Step 3 — Student app
```bash
cd frontend-student
cp .env.example .env   # set VITE_API_URL=http://localhost:4000
npm install
npm run dev            # http://localhost:5173
```

### Step 4 — Club admin portal
```bash
cd frontend-club
cp .env.example .env   # same VITE_API_URL
npm install
npm run dev            # http://localhost:5174
```

---

## 🎨 Design system

The Move uses an ink-black + antique gold palette with Playfair Display (serif) for headings and Inter for body text. All card banners use deep dark backgrounds so the white overlay text is always readable.

**Key CSS variables:**
| Variable | Value |
|----------|-------|
| `--gold` | `#C9A84C` |
| `--ink` | `#0D0D0D` |
| `--cream` | `#FDFBF7` |
| `--smoke` | `#F7F5F0` |
| `--mist` | `#E8E4D8` |
| `--ash` | `#9A9488` |
| `--serif` | Playfair Display, Georgia |
| `--sans` | Inter, system-ui |

---

## 🏗 Architecture

### Backend API routes
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (princeton.edu only) |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Current user + club |
| GET | `/api/events` | All published events (filterable) |
| POST | `/api/events` | Create event + flyer upload (club admin) |
| PATCH | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/clubs` | List all clubs |
| POST | `/api/clubs` | Create club |
| GET | `/api/clubs/eating/status` | Tonight's eating club statuses |
| POST | `/api/clubs/eating/:id/status` | Submit eating club status |
| POST | `/api/social/rsvp/:eventId` | Toggle RSVP |
| GET | `/api/social/recommendations` | AI-scored For You events |
| GET | `/api/social/friends-activity` | Friend RSVP feed |
| POST | `/api/social/follow/:userId` | Toggle follow |
| POST | `/api/social/tickets` | Purchase ticket |
| GET | `/api/social/tickets` | My tickets |

### Auto-sync cron job
Runs every 4 hours, pulling from:
- Princeton Events Calendar RSS (`events.princeton.edu`)
- Go Princeton Tigers Athletics iCal feeds (basketball, lacrosse, football, baseball)

### AI recommendations (`/api/social/recommendations`)
Scores upcoming events using:
- **+40pts** — friends are going
- **+30pts** — matches your most-attended category
- **+20pts** — popularity (RSVP count)
- **+10pts** — happening within 3 days

---

## 🚢 Deployment

| Service | What |
|---------|------|
| [Render](https://render.com) | Backend (free tier) |
| [Vercel](https://vercel.com) | Both frontends (free) |
| [Supabase](https://supabase.com) | Database + Auth + Storage (free tier) |

```bash
# Build student app
cd frontend-student && npm run build  # outputs to /dist

# Build club portal
cd frontend-club && npm run build

# Deploy backend to Render — connect your GitHub repo and set env vars
```

## 🔜 Next steps
- [ ] Stripe Connect for in-app ticket payments
- [ ] Princeton CAS SSO integration
- [ ] Push notifications (Expo/FCM)
- [ ] React Native mobile app (iOS + Android)
- [ ] Map view of campus events
- [ ] Eating club status crowdsource + upvote
