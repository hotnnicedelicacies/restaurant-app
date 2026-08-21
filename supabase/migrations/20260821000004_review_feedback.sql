-- =====================================================================
-- Review page · private feedback + cookieless analytics
-- =====================================================================
-- Backs `/review` (QR-code landing page). Two tables:
--   feedback       — private messages to the kitchen, triaged in
--                    /admin/feedback. Contact details are optional.
--   review_events  — page views, Google-review clicks, feedback
--                    submissions, tagged by QR source. No IPs, no user
--                    agents, no cookies — just enough to see which
--                    sticker gets scanned and how many scans convert.
--
-- All writes go through the service-role client (bypasses RLS). There
-- are deliberately NO anon policies: the public can't read or write
-- either table directly.
-- =====================================================================

create table public.feedback (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  src         text not null default 'site'
              check (src in ('truck', 'box', 'receipt', 'whatsapp', 'email', 'site')),
  message     text not null check (char_length(message) between 1 and 2000),
  name        text check (name is null or char_length(name) <= 80),
  contact     text check (contact is null or char_length(contact) <= 120),
  handled     boolean not null default false,
  handled_at  timestamptz
);

create index idx_feedback_open on public.feedback (created_at desc) where handled = false;

create table public.review_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event       text not null check (event in ('view', 'google_click', 'feedback_submit')),
  src         text not null default 'site'
              check (src in ('truck', 'box', 'receipt', 'whatsapp', 'email', 'site'))
);

create index idx_review_events_created on public.review_events (created_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.feedback      enable row level security;
alter table public.review_events enable row level security;

create policy "feedback: admin all"
  on public.feedback for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "review_events: admin read"
  on public.review_events for select
  using (public.is_admin());
