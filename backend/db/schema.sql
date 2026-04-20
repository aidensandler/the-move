-- ══════════════════════════════════════════════
-- Tiger Board — Database Schema
-- Paste into Supabase SQL Editor and run
-- ══════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Users (extends Supabase auth.users) ──────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  name        text,
  class_year  int,
  avatar_url  text,
  role        text not null default 'student' check (role in ('student', 'club_admin', 'super_admin')),
  created_at  timestamptz default now()
);

-- ── Clubs ─────────────────────────────────────
create table public.clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  category    text not null default 'general',
  logo_url    text,
  instagram   text,
  email       text,
  verified    boolean default false,
  created_at  timestamptz default now()
);

-- Link club admins to clubs
create table public.club_admins (
  user_id  uuid references public.profiles(id) on delete cascade,
  club_id  uuid references public.clubs(id) on delete cascade,
  primary key (user_id, club_id)
);

-- ── Club admin applications ──────────────────
-- Users apply to become an admin of an existing club.
-- Existing admins of that club (or super_admins) review and approve/reject.
create table public.club_admin_applications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  club_id      uuid not null references public.clubs(id)     on delete cascade,
  message      text,
  status       text not null default 'pending'
               check (status in ('pending', 'approved', 'rejected')),
  reviewed_by  uuid references public.profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz default now(),
  -- A user can only have one pending application per club
  unique (user_id, club_id, status)
);

create index if not exists idx_club_admin_applications_club
  on public.club_admin_applications (club_id, status);
create index if not exists idx_club_admin_applications_user
  on public.club_admin_applications (user_id, status);

-- ── Events ────────────────────────────────────
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  category     text not null default 'general'
               check (category in ('sports','arts','academic','street','social','food','other')),
  source       text not null default 'club'
               check (source in ('club','auto','admin')),
  club_id      uuid references public.clubs(id) on delete set null,
  venue        text,
  event_date   date not null,
  start_time   time,
  end_time     time,
  banner_url   text,           -- uploaded flyer image
  banner_emoji text,           -- fallback emoji if no image
  banner_bg    text default '#F5F5F5',
  ticket_price numeric(6,2),   -- null = no ticket needed
  ticket_url   text,           -- external URL fallback
  guest_policy text,           -- for eating club events
  is_open      boolean,        -- for eating club live status
  capacity     int,
  is_published boolean default true,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── RSVPs ─────────────────────────────────────
create table public.rsvps (
  user_id   uuid references public.profiles(id) on delete cascade,
  event_id  uuid references public.events(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, event_id)
);

-- ── Tickets (purchased) ───────────────────────
create table public.tickets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade,
  event_id      uuid references public.events(id) on delete cascade,
  quantity      int not null default 1,
  tier_name     text default 'General',
  amount_paid   numeric(8,2),
  stripe_payment_id text,      -- fill in after Stripe integration
  qr_code       text,          -- generated token for check-in
  used          boolean default false,
  created_at    timestamptz default now()
);

-- ── Friends / Follow ─────────────────────────
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (follower_id, following_id)
);

-- ── Eating Club Status ───────────────────────
create table public.eating_clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text,
  prospect_order int,
  club_id     uuid references public.clubs(id)
);

create table public.eating_club_status (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid references public.eating_clubs(id) on delete cascade,
  status_date date not null default current_date,
  is_open     boolean default false,
  hours       text,
  guest_policy text,
  notes       text,
  submitted_by uuid references public.profiles(id),
  upvotes     int default 0,
  created_at  timestamptz default now(),
  unique (club_id, status_date)
);

-- ══════════════════════════════════════════════
-- Row Level Security
-- ══════════════════════════════════════════════

alter table public.profiles         enable row level security;
alter table public.clubs            enable row level security;
alter table public.club_admins      enable row level security;
alter table public.club_admin_applications enable row level security;
alter table public.events           enable row level security;
alter table public.rsvps            enable row level security;
alter table public.tickets          enable row level security;
alter table public.follows          enable row level security;
alter table public.eating_clubs     enable row level security;
alter table public.eating_club_status enable row level security;

-- Profiles: users can read all, only edit own
create policy "profiles_read_all"   on public.profiles for select using (true);
create policy "profiles_edit_own"   on public.profiles for update using (auth.uid() = id);

-- Events: anyone can read published events
create policy "events_read"  on public.events for select using (is_published = true);
-- Club admins can insert/update their own club's events
create policy "events_insert" on public.events for insert
  with check (
    exists (select 1 from public.club_admins where user_id = auth.uid() and club_id = events.club_id)
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );
create policy "events_update" on public.events for update
  using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

-- RSVPs: users manage own
create policy "rsvps_all" on public.rsvps for all using (auth.uid() = user_id);

-- Tickets: users see own
create policy "tickets_read_own" on public.tickets for select using (auth.uid() = user_id);

-- Follows: users manage own
create policy "follows_all" on public.follows for all using (auth.uid() = follower_id);
create policy "follows_read" on public.follows for select using (true);

-- Club admin applications:
--   • applicants can read their own applications
--   • existing admins of the target club can read applications for that club
--   • super_admins can read all
--   • any authenticated user can submit one for themselves
--   • only admins of that club or super_admins can update (approve/reject)
create policy "apps_read_own" on public.club_admin_applications
  for select using (auth.uid() = user_id);
create policy "apps_read_club_admin" on public.club_admin_applications
  for select using (
    exists (select 1 from public.club_admins
            where user_id = auth.uid()
              and club_id = club_admin_applications.club_id)
    or exists (select 1 from public.profiles
               where id = auth.uid() and role = 'super_admin')
  );
create policy "apps_insert_self" on public.club_admin_applications
  for insert with check (auth.uid() = user_id);
create policy "apps_update_reviewer" on public.club_admin_applications
  for update using (
    exists (select 1 from public.club_admins
            where user_id = auth.uid()
              and club_id = club_admin_applications.club_id)
    or exists (select 1 from public.profiles
               where id = auth.uid() and role = 'super_admin')
  );

-- Eating clubs: public read
create policy "ec_read" on public.eating_clubs for select using (true);
create policy "ec_status_read" on public.eating_club_status for select using (true);
create policy "ec_status_insert" on public.eating_club_status for insert with check (auth.uid() is not null);

-- ══════════════════════════════════════════════
-- Seed eating clubs
-- ══════════════════════════════════════════════
insert into public.eating_clubs (name, icon, prospect_order) values
  ('Ivy Club',       '🏛', 1),
  ('Cottage Club',   '⚓', 2),
  ('Tower Club',     '🎶', 3),
  ('Cap & Gown',     '🦁', 4),
  ('Colonial Club',  '🌿', 5),
  ('Charter Club',   '🔱', 6),
  ('Cloister Inn',   '🗝', 7),
  ('Terrace Club',   '🎨', 8),
  ('Tiger Inn',      '🐯', 9),
  ('Campus Club',    '🏫', 10),
  ('Quadrangle Club','♟', 11);
