# CLAUDE.md

Notes for any future Claude / coding agent working in this repo. Read this before touching code so you don't re-derive things the hard way.

## What this is

A from-scratch rebuild of <https://hotnnicedelicacies.com> — a Middlesbrough home-kitchen meal delivery service serving Italian classics and West African home cooking. UK only, delivery + cash-on-delivery.

## Stack at a glance

- **Framework.** Next.js 16 (app router) · React 19 · Tailwind v4 (utility tokens) · TypeScript strict.
- **Data.** Supabase (Postgres + Auth + Storage). Service-role key for trusted writes, anon (publishable) key for public reads.
- **Payments.** Stripe Elements + PaymentIntents + 4 webhook events (succeeded / failed / refunded / dispute).
- **Email.** Resend for transactional email.
- **State.** Zustand (cart only, localStorage-persisted, schema-versioned).
- **Hosting.** Vercel. Builds via Turbopack.

## Brand & design

- **Direction:** "Walnut & Cream" — heritage British editorial. Cream `#F1E5CD`, walnut `#2D1F18`, bronze `#A56F40`. Cormorant Garamond serif + Geist Mono monospace.
- **Source of truth.** [`design-explorations/brand-spec.md`](design-explorations/brand-spec.md), [`design-explorations/admin-settings.md`](design-explorations/admin-settings.md), and the HTML mockups in [`design-explorations/pages/`](design-explorations/pages/). The shared CSS lives in [`design-explorations/shared/styles.css`](design-explorations/shared/styles.css). Large chunks of that CSS have been ported into [`app/globals.css`](app/globals.css) with token rewrites (see "CSS porting" below).
- **Anti-slop.** No purple gradients. No emoji icons. No Inter for display. No SVG illustrations of food. No filler verbs ("Elevate", "Seamless"). Heritage prose voice.
- **Contrast contract.** `bronze` is decorative on cream — fails AA for body text. Use `bronze-deep` (`#7E5530`) for bronze-toned body copy.

## Repo map

```
app/
  layout.tsx                — Cormorant + Geist via next/font (on <html>), FoodEstablishment JSON-LD, sonner, CookieBanner
  globals.css               — Tailwind v4 @theme tokens + ~2300 lines of ported design CSS (admin, page-hero, forms, etc.)
  page.tsx                  — Home (HeritageHero, DayBand, BillOfFare, Hygiene, KitchenStory, HowItWorks, DeliveryAreas, CtaBand)
  menu/                     — list (MenuBrowser client wrapper) + [slug] detail
  cart/                     — client cart from zustand
  checkout/                 — CheckoutForm + StripePaymentSection inside <Elements>
  confirmation/[ref]/       — order confirmation, ClearCartOnMount clears the basket here
  track/[ref]/              — customer order tracking + CustomerCancelButton
  receipt/[ref]/            — printable receipt
  sign-in, sign-up, forgot-password, auth/(callback,reset-password)
  account/                  — sidebar + sections (orders, addresses, profile). AddressManager handles CRUD.
  privacy, terms, refund-policy, cookie-notice — UK GDPR/PECR templates
  api/
    zones/check/            — postcode → zone lookup
    stripe/webhook/         — 4-event handler (PI succeeded/failed, charge refunded/dispute)
    admin/export/           — admin CSV/JSON export (orders, customers, menu, kitchen_notes)
    orders/                 — legacy guest order endpoint (kept for compat)

  admin/
    sign-in/                — branded admin sign-in, outside the panel route group
    (panel)/                — route group; layout enforces is_admin
      layout.tsx            — admin shell (header + nav + footer). Kitchen-status pill derived from hours.
      AdminNavLink.tsx      — client nav with usePathname active state
      AdminSignOut.tsx
      page.tsx              — redirects /admin → /admin/orders
      orders/               — list + [ref] detail (status controls, kitchen notes, payment controls)
      menu/                 — list + new + [id] edit (variants/addons editor matches design)
      categories/           — modal CRUD
      zones/                — modal CRUD with chip-input postcodes + monthly orders stat
      payments/             — KPI stats + tabs (Stripe / COD / Refunds) + search/filter
      settings/             — sidebar layout (hours/contact/flags/operations) + advanced/ page

lib/
  supabase/
    server.ts               — getServerClient (cookie-aware, RLS-respecting) + getServiceClient (bypass)
    client.ts               — getBrowserClient
    public.ts               — getPublicClient (cookie-less, used inside unstable_cache)
    storage.ts              — getStorageUrl(path)
    types.ts                — Database types (hand-maintained; can regen via supabase gen types)
  stripe/
    server.ts               — getStripe() — throws clear error if STRIPE_SECRET_KEY is pk_*
    client.ts               — getStripeClient() memoised loadStripe
  auth/
    actions.ts              — sign-in routes admins to /admin/orders, customers to /account
  cart/
    store.ts                — zustand-persist v2 (version bumped to wipe legacy slug carts)
  data/
    menu.ts                 — Supabase-only, no legacy fallback. Cached with unstable_cache (60s, tag 'menu').
    zones.ts                — same pattern, tag 'zones'
    hours.ts                — getHours() returns formatted strings (daysShort, timeLong, displayShort, cutoffShort…), tag 'hours'
    orders.ts               — getOrderByRef (service client; ref is access token)
  orders/
    create.ts               — createOrder server action (Zod-validated, defensive UUID check on menuItemId)
    cancel.ts               — customer-initiated cancel with Stripe refund
  admin/
    auth.ts                 — requireAdmin() for server actions
    orderActions.ts         — updateOrderStatus, markCodCollected, refundOrder, adminCancelOrder, addKitchenNote, syncStripePayment
    catalogActions.ts       — categories/zones/menu/settings CRUD + revalidateTag invalidation
    dataExport.ts           — dataset summaries for /admin/settings/advanced
  account/
    addresses.ts            — addAddress, deleteAddress (Zod)
  contact/
    submit.ts               — emails the kitchen via Resend
  email/
    send.ts                 — Resend wrapper, swallows errors
    templates.ts            — orderConfirmationEmail, statusUpdateEmail, cancellationEmail
  utils.ts                  — formatGBP/Date/Time, romanLower, absoluteUrl, cn

components/
  layout/                   — SiteHeader (with HeaderCartLink + HeaderAuthLink), SiteFooter, PageHero (with `compact` variant)
  admin/ConfirmModal.tsx    — shared modal used everywhere admin (status changes, refunds, archives…)
  CookieBanner.tsx          — GDPR/PECR informational, localStorage `hnn_consent`
  ui/                       — HeritageButton, Pill, Ornament, SectionHead + shadcn-ui Radix primitives
  home/                     — HeritageHero, DayBand (async, reads hours), BillOfFare wrappers, HygieneSection, KitchenStory, HowItWorks (async), DeliveryAreas, CtaBand
  menu/                     — FareRow (clickable tags via onTagClick), MenuBrowser (search + tag + scroll-spy)
  item/                     — CustomiseForm (reads ?edit=<lineId> to pre-fill from cart)
  cart/                     — CartContents
  checkout/                 — CheckoutForm, StripePaymentSection, ClearCartOnMount
  account/                  — AddressManager
  contact/                  — ContactForm (Resend via submitContact)
  auth/                     — AuthCard, PasswordInput

supabase/
  migrations/               — 3 SQL files: initial schema + RLS + storage
  setup.sql                 — combined paste-once version
  seed/                     — data.ts + seed.mjs runner (ws polyfill for Node 20, --create-admin flag)

middleware.ts               — refreshes Supabase session cookie; gates /account, /cart, /checkout, /admin
                              **Admins are auto-redirected away from customer routes to /admin/orders.**
constants/siteConfig.ts     — single source of truth for routes + brand metadata
next.config.ts              — derives Supabase image host from env, 24h CDN cache
```

## CSS porting

Large chunks of `design-explorations/shared/styles.css` are copied into `app/globals.css`:

- Admin panel section (~1700 lines): `admin-shell`, `admin-header`, `admin-nav`, `admin-page-head`, `admin-toolbar`, `admin-filter`, `admin-table`, `admin-stats`, `menu-admin-table`, `pill / pill--*`, `switch`, `tabs`, `chip-input`, `editor-group`, `option-row`, `sticky-save-bar`, `settings-layout`, `day-row`, `kitchen-notes`, `kitchen-note-form`, `status-control`, `status-btn`, `form-section`, `form-field`, `form-grid`, `summary__*`, `modal-overlay`, `modal-card`, `modal-btn--*`, `warning-banner`, `pending-confirm-banner`, `receipt-btn`, `cod-banner`.
- Token rewrites: every `var(--walnut)` in the source becomes `var(--color-walnut)`, etc. (Tailwind v4 prefixes our tokens with `--color-`.)
- When porting more, **always rewrite tokens before pasting**. Easiest path: pipe through a small Python helper (see commit history).

## Critical gotchas

1. **Tailwind v4 + @theme tokens.** Use named utility classes (`bg-walnut`, `text-cream`) — `bg-[--color-walnut]` shorthand doesn't resolve. The full fix is at commit `f9e897a`.

   **Element-selector base rules must live in `@layer base`.** Tailwind v4 resolves CSS cascade layer order *before* selector specificity, so a bare `img { height: auto }` written outside any `@layer` wins against `<img class="h-10">` even though the class has higher specificity — the bare rule lands in the "unlayered" sink which comes AFTER `@layer utilities`. The design's button / a / img resets in globals.css are wrapped in `@layer base {}` for exactly this reason; don't move them out.
2. **Cart `menuItemId` is a UUID.** Old/legacy carts stored the slug. `createOrder` validates the UUID format and stores `null` if invalid; the persist version bump (v2) wipes legacy carts on next load. Don't reintroduce slug-as-id.
3. **`STRIPE_SECRET_KEY` must be `sk_...`.** `getStripe()` throws loudly if it sees `pk_`. The most common deployment mistake.
4. **`isSupabaseConfigured()` accepts both env-name conventions** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the legacy `..._ANON_KEY`).
5. **Cache invalidation.** `lib/data/menu.ts`, `zones.ts`, `hours.ts` wrap their fetchers in `unstable_cache` with tags. Admin actions in `lib/admin/catalogActions.ts` call `revalidateTag(MENU_TAG, 'default')` etc. — **Next 16 requires the two-arg form** (`'default'` is fine).
6. **next/font className goes on `<html>`** in `app/layout.tsx`. The CSS tokens use `var(--font-cormorant, 'Cormorant Garamond')` with explicit fallbacks so the chain stays valid before next/font has set the variable.
7. **`unstable_cache` cannot wrap cookie-aware clients.** Always use `getPublicClient()` (in `lib/supabase/public.ts`) inside cached fetchers.
8. **Admin vs customer split.** Middleware bounces admins off `/account`, `/cart`, `/checkout`, `/sign-in`, `/sign-up` straight to `/admin/orders`. They have different product surfaces.
9. **Stripe webhook reconciliation.** If a webhook gets dropped (local dev without `stripe listen`, transient network), the admin order detail page surfaces a "Sync with Stripe" prompt for pending/failed card orders. Backed by `syncStripePayment` in `lib/admin/orderActions.ts`. Auto-fires on `/admin/orders`, `/admin/orders/[ref]`, `/receipt/[ref]` when a card order is pending/failed and `<1h` old, throttled to one Stripe API call per 15 s per ref (`maybeBackSyncStripe`). Customer-facing receipt, track, and confirmation pages all carry `export const dynamic = 'force-dynamic'` so a sync visible in one tab is visible in another after reload.

   **Stripe PaymentIntent → our `payment_status` mapping** (in `syncStripePayment`):
   - `succeeded` + `refund_amount >= total` → `refunded`
   - `succeeded` + `refund_amount > 0` → `partially_refunded`
   - `succeeded` → `paid`
   - `canceled` → `failed`
   - `requires_payment_method` is **the initial state of every PI** (no method attached yet) — only treat as `failed` when `last_payment_error` is set or a `latest_charge` exists. Otherwise the customer simply abandoned mid-checkout; keep `pending` so they can still complete payment.
   - Everything else (`requires_action` / `requires_confirmation` / `requires_capture` / `processing`) → `pending`.

   **Do not** treat bare `requires_payment_method` as failed — that misclassifies every brand-new PI as failed and was the source of an entire batch of "all my test payments show failed" reports.

   **Stripe PaymentIntent is pinned to `payment_method_types: ['card']`** in `lib/orders/create.ts`. **Don't** swap it to `automatic_payment_methods: { enabled: true }` — that adds Link / Klarna / Revolut Pay / Amazon Pay to the PaymentElement, all of which use redirect-based flows. A customer abandoning mid-redirect strands the PI in `requires_payment_method` with no method, no charge, no error — indistinguishable from "never tried". For a UK kitchen taking small card payments we want exactly one predictable path.

   **`StripePaymentSection` uses `redirect: 'if_required'`** on `stripe.confirmPayment`. The 4242 test card and most live UK cards don't need 3DS — they succeed inline. Without that flag, Stripe always tries to redirect to `return_url`, which behaves unpredictably across localhost / iframed previews / popup blockers and was a likely cause of stranded PIs. On inline success we navigate the user to `/confirmation/[ref]` ourselves; on 3DS we let Stripe redirect as usual.
10. **The Stripe webhook handler is in `app/api/stripe/webhook/route.ts`.** Use `runtime = 'nodejs'` and `dynamic = 'force-dynamic'` — never re-introduce the legacy `export const config = { api: { bodyParser: false } }` pages-router shape; Next 16 rejects it.
11. **Hours come from admin settings, not siteConfig.** Anywhere you'd hardcode "Tue – Sun 12pm – 8pm", call `getHours()` (server) which reads the `settings.hours` row.
12. **No legacy fallback in production.** `constants/meals.ts` and `app/order/` have been deleted on purpose. If you need to backfill empty menu/zones, do it in the DB, not in code.

13. **Auth email confirmation.** Supabase Auth's "Confirm email" toggle in the dashboard (Authentication → Providers → Email) should be **off**. We send our own welcome email via Resend from `signUpAction` (template `welcomeEmail` in `lib/email/templates.ts`). With Supabase confirmation on, `signUp` returns a session-less user, the redirect lands on `/account`, middleware bounces them to `/sign-in` because they aren't authenticated yet — confusing UX. With it off, the cookie is issued immediately on sign-up and the redirect works.

14. **Order ownership / claim flow.** Orders created during guest checkout have `profile_id = null`. After sign-in / sign-up, `claimOrdersByEmail` in `lib/account/profile.ts` walks `orders` and back-links every row whose `customer_email` matches the new user's email and has no `profile_id` yet. There's also a manual `claimOrder(ref)` server action surfaced via `<ClaimOrderBanner>` on `/confirmation/[ref]` and `/track/[ref]` for the case where a signed-in user finds a guest order placed with their email.

15. **Account `closeAccount` anonymises rather than deletes.** Closing the account scrubs PII on `profiles` + on historical `orders` (display_name, customer_email, customer_phone, delivery_line1) and hard-deletes `addresses`, then calls `auth.admin.deleteUser`. The order row stays — UK tax record-keeping needs the line items + amounts for 6 years.

## Confirmation modals

Every admin destructive / state-changing action uses `components/admin/ConfirmModal.tsx`. The shape:

```tsx
<ConfirmModal
  open={...}
  onCancel={...}
  onConfirm={...}
  pending={pending}        // disables buttons while server action is in-flight
  eyebrow="Short label"
  tone="danger"             // optional, picks --danger color
  title={<>Headline with <em>italic emphasis</em></>}
  body={<>Explanation copy with <b>strong</b>.</>}
  detail={[{ label: 'Order', value: 'HNN-…' }]}   // optional fact rows
  inputSlot={<>...form-field inputs...</>}        // optional inputs (refund amount, reason, etc.)
  confirmLabel="Yes, do it"
/>
```

Don't use native `confirm()` / `alert()` anywhere in admin. Don't use `AlertDialog` from shadcn for admin destructive actions either — the shared modal is the canonical pattern.

## Adding a new admin screen

1. Drop the page under `app/admin/(panel)/<slug>/page.tsx`. The layout (header + nav + footer + auth) is inherited.
2. Add a route to the `NAV` array in `app/admin/(panel)/layout.tsx`.
3. Start with an `<div className="admin-page-head">` block (eyebrow + title + actions).
4. Use `form-section` / `form-grid` / `form-field` for forms, `admin-table-wrap` + `admin-table` for tables, `admin-stats` + `admin-stat` for KPI grids, `tabs` + `tab-panel is-active` for tabs, `admin-danger` for destructive zones.
5. Wrap destructive server actions in `ConfirmModal`.
6. If the action mutates cached public data (menu, zones, hours), call `revalidateTag(MENU_TAG, 'default')` etc. inside the server action.

## Launch checklist (live in `HANDOFF.md`)

- Env vars in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` (must start with `sk_`), `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ORDER_FROM_EMAIL`, `ORDER_NOTIFICATION_EMAIL`, `NEXT_PUBLIC_SITE_URL`.
- Supabase: all 3 migrations applied (`supabase/setup.sql`), `menu-images` bucket public, RLS on.
- Stripe webhook registered for the 4 events at the live URL.
- Resend DNS verified (SPF / DKIM / DMARC).
- Admin user seeded with `is_admin = true`.
- OG image + apple icon assets in `public/`.

## Cleanup TODOs (post-launch)

- Drag-to-arrange (menu items, categories, zone display order) — needs a small dnd library.
- Multi-photo gallery on menu items — needs Supabase Storage upload integration.
- Manual / off-platform order entry on `/admin/orders` (currently the design has a "+ New order" button; we deferred it).
- Ownership-transfer flow and full customer-data purge actions on `/admin/settings/advanced` are placeholders — they show modals but do not execute. Manual SQL for now.

## When the user reports a bug

1. **Reproduce in dev or read the deployed CSS / network**. Don't fix from memory — the design and code drift.
2. **Check `getStripe()` and Supabase env first** if it's payments/data.
3. **Cache invalidation**. If admin edits aren't reflected, check the `revalidateTag` call in the matching action.
4. **Run `npx tsc --noEmit -p .`** before committing. `next build` after big changes.
5. **Match the design files**. If something looks off versus `design-explorations/pages/<page>.html`, port the missing CSS into `app/globals.css` (with token rewrites) before reaching for Tailwind utilities.
