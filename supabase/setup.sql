-- =====================================================================
-- Hot N Nice Delicacies · Initial schema
-- =====================================================================
-- Mirrors the data model documented in design-explorations/admin-settings.md.
-- All tables live in the `public` schema; auth.users is Supabase-managed.
-- =====================================================================

-- Extensions
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- 1. Settings (key-value store for site-wide config)
-- ---------------------------------------------------------------------
create table public.settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Menu categories
-- ---------------------------------------------------------------------
create table public.menu_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  display_order integer not null default 0,
  is_visible    boolean not null default true,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Menu items
-- ---------------------------------------------------------------------
create table public.menu_items (
  id                   uuid primary key default gen_random_uuid(),
  category_id          uuid not null references public.menu_categories(id) on delete restrict,
  name                 text not null,
  slug                 text not null unique,
  description          text not null,
  long_description     text,
  price_gbp            numeric(8, 2) not null check (price_gbp >= 0),
  image_path           text,
  gallery_paths        text[] not null default '{}',
  is_available_today   boolean not null default true,
  is_cod_eligible      boolean not null default true,
  is_featured          boolean not null default false,
  is_hidden            boolean not null default false,
  dietary_tags         text[] not null default '{}',
  allergen_tags        text[] not null default '{}',
  badges               text[] not null default '{}',
  variants             jsonb not null default '{"groups":[]}'::jsonb,
  addons               jsonb not null default '{"items":[]}'::jsonb,
  display_order        integer not null default 0,
  archived_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_menu_items_category on public.menu_items(category_id);
create index idx_menu_items_featured on public.menu_items(is_featured) where is_featured = true;
create index idx_menu_items_visible  on public.menu_items(is_hidden, is_available_today);

-- ---------------------------------------------------------------------
-- 4. Delivery zones
-- ---------------------------------------------------------------------
create table public.delivery_zones (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  postcodes       text[] not null default '{}',
  base_fee_gbp    numeric(8, 2) not null default 0 check (base_fee_gbp >= 0),
  min_order_gbp   numeric(8, 2) not null default 0 check (min_order_gbp >= 0),
  prep_time_min   integer not null default 30,
  prep_time_max   integer not null default 60,
  is_quoted       boolean not null default false,
  allows_cod      boolean not null default true,
  is_active       boolean not null default true,
  display_order   integer not null default 0,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_delivery_zones_active on public.delivery_zones(is_active) where is_active = true;

-- ---------------------------------------------------------------------
-- 5. Profiles (mirror of auth.users for app-specific fields)
-- ---------------------------------------------------------------------
create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  display_name            text,
  phone                   text,
  is_admin                boolean not null default false,
  marketing_opt_in        boolean not null default false,
  notify_status_changes   boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_profiles_admin on public.profiles(is_admin) where is_admin = true;

-- ---------------------------------------------------------------------
-- 6. Saved addresses
-- ---------------------------------------------------------------------
create table public.addresses (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  label           text,
  recipient_name  text not null,
  line1           text not null,
  line2           text,
  city            text not null,
  postcode        text not null,
  phone           text,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_addresses_profile on public.addresses(profile_id);
-- Only one default per profile
create unique index idx_addresses_one_default on public.addresses(profile_id) where is_default = true;

-- ---------------------------------------------------------------------
-- 7. Orders
-- ---------------------------------------------------------------------
create type order_status     as enum ('received', 'preparing', 'on_its_way', 'delivered', 'cancelled');
create type payment_method   as enum ('card', 'cod');
create type payment_status   as enum ('pending', 'paid', 'refunded', 'partially_refunded', 'failed');
create type cod_status       as enum ('uncollected', 'collected');

create table public.orders (
  id                       uuid primary key default gen_random_uuid(),
  ref                      text not null unique,  -- HNN-XXXX-NNNN

  -- Customer snapshot at order time
  profile_id               uuid references public.profiles(id) on delete set null,
  customer_first_name      text not null,
  customer_last_name       text not null,
  customer_email           text not null,
  customer_phone           text not null,

  -- Delivery snapshot
  delivery_line1           text not null,
  delivery_line2           text,
  delivery_city            text not null,
  delivery_postcode        text not null,
  delivery_zone_id         uuid references public.delivery_zones(id),
  delivery_fee_gbp         numeric(8, 2) not null default 0,
  delivery_date            date not null,
  delivery_window_start    time not null,
  delivery_window_end      time not null,
  delivery_notes           text,

  -- Money
  subtotal_gbp             numeric(8, 2) not null,
  total_gbp                numeric(8, 2) not null,

  -- Payment
  payment_method           payment_method not null,
  payment_status           payment_status not null default 'pending',
  stripe_payment_intent_id text,
  card_brand               text,
  card_last4               text,
  cod_status               cod_status,                          -- only set when payment_method = 'cod'
  cod_collected_at         timestamptz,
  cod_collected_by         uuid references auth.users(id),
  refund_amount_gbp        numeric(8, 2),
  refund_reason            text,

  -- Status
  status                   order_status not null default 'received',
  cancelled_at             timestamptz,
  cancelled_reason         text,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index idx_orders_profile        on public.orders(profile_id);
create index idx_orders_status         on public.orders(status);
create index idx_orders_delivery_date  on public.orders(delivery_date);
create index idx_orders_payment_method on public.orders(payment_method);
create index idx_orders_cod            on public.orders(cod_status) where payment_method = 'cod';
create index idx_orders_ref            on public.orders(ref);

-- ---------------------------------------------------------------------
-- 8. Order line items
-- ---------------------------------------------------------------------
create table public.order_items (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders(id) on delete cascade,
  menu_item_id          uuid references public.menu_items(id) on delete set null,

  -- Snapshot of item at the time of ordering
  name                  text not null,
  unit_price_gbp        numeric(8, 2) not null,
  quantity              integer not null check (quantity > 0),
  line_total_gbp        numeric(8, 2) not null,

  variants_chosen       jsonb not null default '{}'::jsonb,
  addons_chosen         jsonb not null default '[]'::jsonb,
  special_instructions  text,
  image_path            text,

  display_order         integer not null default 0,
  created_at            timestamptz not null default now()
);

create index idx_order_items_order on public.order_items(order_id);

-- ---------------------------------------------------------------------
-- 9. Kitchen notes (per-order log + customer-facing messages)
-- ---------------------------------------------------------------------
create table public.kitchen_notes (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders(id) on delete cascade,
  author_id             uuid references auth.users(id) on delete set null,
  author_name           text not null,
  status_at_time        order_status,
  body                  text not null,
  visible_to_customer   boolean not null default true,
  emailed               boolean not null default false,
  created_at            timestamptz not null default now()
);

create index idx_kitchen_notes_order on public.kitchen_notes(order_id);

-- =====================================================================
-- Triggers + functions
-- =====================================================================

-- Generic updated_at trigger fn
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger settings_updated_at        before update on public.settings        for each row execute function public.set_updated_at();
create trigger menu_categories_updated_at before update on public.menu_categories for each row execute function public.set_updated_at();
create trigger menu_items_updated_at      before update on public.menu_items      for each row execute function public.set_updated_at();
create trigger delivery_zones_updated_at  before update on public.delivery_zones  for each row execute function public.set_updated_at();
create trigger profiles_updated_at        before update on public.profiles        for each row execute function public.set_updated_at();
create trigger addresses_updated_at       before update on public.addresses       for each row execute function public.set_updated_at();
create trigger orders_updated_at          before update on public.orders          for each row execute function public.set_updated_at();

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Order ref generator: HNN-XXXX-NNNN (chars then digits)
create or replace function public.generate_order_ref()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- omit 0, 1, I, O for clarity
  part1 text := '';
  part2 text := '';
  i int;
begin
  for i in 1..4 loop
    part1 := part1 || substr(chars, floor(random() * length(chars))::int + 1, 1);
  end loop;
  for i in 1..4 loop
    part2 := part2 || floor(random() * 10)::text;
  end loop;
  return 'HNN-' || part1 || '-' || part2;
end;
$$;
-- =====================================================================
-- Row Level Security · Hot N Nice Delicacies
-- =====================================================================
-- Three actor classes: anon, authenticated (customer), admin.
-- - anon       → can read public menu/zones; can insert guest orders.
-- - customer   → can read+write their own profile/addresses/orders.
-- - admin      → can read+write everything.
-- =====================================================================

-- Enable RLS on every table
alter table public.settings        enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;
alter table public.delivery_zones  enable row level security;
alter table public.profiles        enable row level security;
alter table public.addresses       enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.kitchen_notes   enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- =====================================================================
-- Public-readable tables (menu + zones + select settings)
-- =====================================================================

-- Anyone can read the menu (visible items in visible categories)
create policy "menu_categories: public read visible"
  on public.menu_categories for select
  using (is_visible = true and archived_at is null);

create policy "menu_items: public read visible"
  on public.menu_items for select
  using (
    is_hidden = false
    and archived_at is null
    and exists (
      select 1 from public.menu_categories c
      where c.id = menu_items.category_id
        and c.is_visible = true
        and c.archived_at is null
    )
  );

create policy "delivery_zones: public read active"
  on public.delivery_zones for select
  using (is_active = true and archived_at is null);

create policy "settings: public read"
  on public.settings for select
  using (true);  -- All settings are public for now; sensitive keys (Stripe secrets) are stored encrypted server-side, not in this table

-- =====================================================================
-- Profiles
-- =====================================================================

create policy "profiles: read own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and is_admin = (select is_admin from public.profiles where id = auth.uid()));  -- can't grant self admin

create policy "profiles: admin read all"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles: admin write all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- Addresses
-- =====================================================================

create policy "addresses: read own"
  on public.addresses for select
  using (profile_id = auth.uid());

create policy "addresses: insert own"
  on public.addresses for insert
  with check (profile_id = auth.uid());

create policy "addresses: update own"
  on public.addresses for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "addresses: delete own"
  on public.addresses for delete
  using (profile_id = auth.uid());

create policy "addresses: admin read all"
  on public.addresses for select
  using (public.is_admin());

-- =====================================================================
-- Orders
-- =====================================================================

-- Customers (incl. guests via service role) can place an order.
-- The application enforces validation server-side; RLS just gates writes.
create policy "orders: anon and authed can insert"
  on public.orders for insert
  with check (
    -- Authenticated user can only attach their own profile_id, or none (guest)
    (auth.uid() is null and profile_id is null)
    or (auth.uid() is not null and (profile_id = auth.uid() or profile_id is null))
  );

create policy "orders: read own"
  on public.orders for select
  using (profile_id = auth.uid());

-- Anyone with a unique order ref can view a single order (used for
-- login-less /track/[ref]). The ref is unguessable (4 chars + 4 digits).
-- This is enforced at the application layer via `select * where ref = $1`.
-- We do NOT add a policy for that here — it goes through service-role
-- requests on the server. If you want public-by-ref via the anon role,
-- add: `create policy "orders: read by ref" on orders for select using (true);`
-- and ensure the API never SELECT * without a WHERE clause.

create policy "orders: admin all"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- Order items
-- =====================================================================

create policy "order_items: read for own orders"
  on public.order_items for select
  using (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id
              and o.profile_id = auth.uid())
  );

create policy "order_items: insert with own order"
  on public.order_items for insert
  with check (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id
              and (o.profile_id = auth.uid() or o.profile_id is null))
  );

create policy "order_items: admin all"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- Kitchen notes (admin-write, customer-read for own orders if visible)
-- =====================================================================

create policy "kitchen_notes: customer read own visible"
  on public.kitchen_notes for select
  using (
    visible_to_customer = true
    and exists (select 1 from public.orders o
                where o.id = kitchen_notes.order_id
                  and o.profile_id = auth.uid())
  );

create policy "kitchen_notes: admin all"
  on public.kitchen_notes for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- Admin-only mutation on menu / zones / categories / settings
-- =====================================================================

create policy "menu_categories: admin write"
  on public.menu_categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "menu_items: admin write"
  on public.menu_items for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "delivery_zones: admin write"
  on public.delivery_zones for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "settings: admin write"
  on public.settings for all
  using (public.is_admin())
  with check (public.is_admin());
-- =====================================================================
-- Storage · Hot N Nice Delicacies
-- =====================================================================
-- Public bucket for menu photography (primary + gallery photos per item).
-- Public read; admin-only writes via Storage RLS policies.
-- =====================================================================

-- Create the bucket (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  10 * 1024 * 1024,  -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS policies on storage.objects for the menu-images bucket

-- Public read
drop policy if exists "menu_images_public_read" on storage.objects;
create policy "menu_images_public_read"
  on storage.objects for select
  using (bucket_id = 'menu-images');

-- Admin-only write (insert / update / delete)
drop policy if exists "menu_images_admin_insert" on storage.objects;
create policy "menu_images_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "menu_images_admin_update" on storage.objects;
create policy "menu_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'menu-images' and public.is_admin())
  with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "menu_images_admin_delete" on storage.objects;
create policy "menu_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'menu-images' and public.is_admin());
