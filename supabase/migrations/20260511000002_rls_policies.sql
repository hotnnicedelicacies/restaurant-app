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
