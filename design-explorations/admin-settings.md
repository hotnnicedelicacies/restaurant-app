# Admin-Controlled Settings · Catalogue
> Every dynamic field on the customer-facing site that must be editable from the admin dashboard.
> This is the source-of-truth for Phase 4 (admin dashboard build) — every entry below maps to a settings record, a settings UI field, or a content management screen.

Last updated: 2026-05-11

---

## Conventions

In HTML mockups, admin-controlled strings are marked with:
```html
<!-- ADMIN: settings.opening_hours -->
<span>Tue – Sun · 12 – 8pm</span>
```

When porting to code, replace the literal string with a fetch from the corresponding Supabase settings table or content table. All ADMIN markers in the mockup HTML files map back to entries in this document.

---

## 1. Business Hours & Cutoff (`settings.business_hours`)

Stored as a single editable settings record.

| Field | Type | Default | Used on |
|---|---|---|---|
| `opening_days` | enum-array | `['Tue','Wed','Thu','Fri','Sat','Sun']` | Day band, hero, footer, "How it works" |
| `opening_time` | time | `12:00` | Day band, hero, footer |
| `closing_time` | time | `20:00` | Day band, hero, footer |
| `same_day_cutoff` | time | `10:00` | Day band, hero, footer, item detail (availability check), checkout |
| `is_kitchen_open_today` | boolean (derived) | computed from above + current time | Banner override on homepage if closed |
| `closed_override_message` | text (optional) | empty | Shown if admin manually pauses orders (e.g. holiday) |

UI: Single settings page section with day-of-week checkboxes + time pickers + a textarea for the holiday override.

---

## 2. Contact Information (`settings.contact`)

| Field | Type | Used on |
|---|---|---|
| `business_name` | text | Everywhere (currently "Hot N Nice Delicacies") |
| `phone` | E.164 phone | Header CTA, CTA band, footer, contact page, order confirmation email |
| `whatsapp` | E.164 phone | Hero CTA, CTA band, contact page |
| `email` | email | Footer, CTA band, contact page, transactional emails (reply-to) |
| `business_address` | multiline text | Contact page, footer (optional), invoice PDFs |
| `instagram_url` | url | Footer, contact page |
| `facebook_url` | url | Footer, contact page |
| `tiktok_url` (optional) | url | Footer, contact page |

UI: Single contact settings form.

---

## 3. Delivery Zones (`delivery_zones` table)

Each zone is a row.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | text | e.g., "Middlesbrough Central" |
| `postcodes` | text-array | List of postcode prefixes covered (e.g., `['TS1','TS3']`) |
| `base_fee_gbp` | decimal | Fixed fee for orders to this zone |
| `min_order_gbp` | decimal | Minimum order value |
| `prep_time_minutes` | int | Estimated prep + delivery shown to customer |
| `is_quoted` | boolean | If true, customer sees "Contact for quote" instead of fixed fee — for surrounding areas |
| `allows_cod` | boolean | Whether Cash-on-Delivery is permitted in this zone. Defaults to true. Admin can disable per zone (e.g., outlying areas where driver can't carry cash). Combined with `settings.flags.cod_enabled_globally` and the per-item `is_cod_eligible` flag — COD only appears at checkout when all three are true. |
| `is_active` | boolean | Soft toggle (vs delete) |
| `display_order` | int | Order in admin lists |

UI: List view with add/edit/archive. Postcode field as a comma-separated chip input.

Postcodes not matching any active zone → customer shown the "outside our area, get in touch" message at checkout.

---

## 4. Menu Items (`menu_items` table)

Each menu item is a row.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | text | Item name |
| `slug` | text | URL-safe identifier |
| `category_id` | uuid → `menu_categories` | Foreign key |
| `description` | text | Short description for menu rows |
| `long_description` | text (optional) | Longer copy for item detail page |
| `price_gbp` | decimal | Base price |
| `image_path` | text | Supabase Storage path |
| `gallery_paths` | text-array (optional) | Additional images for detail page |
| `is_available_today` | boolean | "Sold out today" toggle |
| `is_cod_eligible` | boolean | Cash-on-delivery eligibility (per-meal) |
| `is_featured` | boolean | Show in "Today's Bill of Fare" on homepage |
| `dietary_tags` | text-array | e.g., `['gluten-free','spicy','contains-seafood']`. Shown as tag chips on menu rows and item detail. Admin edits the list freely per item. |
| `allergen_tags` | text-array | e.g., `['dairy','nuts','gluten']`. Shown alongside dietary tags. |
| `badges` | text-array | Editorial labels shown next to the category eyebrow on rows / item detail (e.g., `['Signature','Fusion','House special','New this week']`). Curator's call — admin sets these per item to surface story. |
| `variants` | jsonb | Size/protein/etc. variants — see structure below |
| `addons` | jsonb | Optional add-ons — see structure below |
| `display_order` | int | Order within category |

### `variants` structure (admin-editable, jsonb)
```json
{
  "groups": [
    {
      "name": "Protein choice",
      "is_required": true,
      "options": [
        {"label": "Chicken", "price_delta_gbp": 0},
        {"label": "Beef",    "price_delta_gbp": 0},
        {"label": "Fish",    "price_delta_gbp": 2}
      ]
    },
    {
      "name": "Size",
      "is_required": true,
      "options": [
        {"label": "Regular", "price_delta_gbp": 0},
        {"label": "Large",   "price_delta_gbp": 4}
      ]
    }
  ]
}
```

### `addons` structure
```json
{
  "items": [
    {"label": "Extra plantain", "description": "Two extra pieces", "price_delta_gbp": 2},
    {"label": "Side of moin moin", "description": "House moin moin", "price_delta_gbp": 3}
  ]
}
```

UI: CRUD list view. Edit screen has form for all fields above, including a JSON-aware editor for variants/addons (so admin can add/remove options without raw JSON editing).

---

## 5. Menu Categories (`menu_categories` table)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | text | e.g., "Pasta", "Grill" |
| `slug` | text | URL-safe |
| `description` (optional) | text | Shown under category header on menu page |
| `display_order` | int | Order on menu page |
| `is_visible` | boolean | Hide entire category (e.g., breakfast paused) |

---

## 6. Site Content (`site_content` table)

Editable copy that lives outside settings/menu data.

| Key | Field | Used on |
|---|---|---|
| `home.hero_eyebrow` | text | Hero: "A Home Kitchen · Middlesbrough · Est. 2019" |
| `home.hero_headline` | text (rich) | Hero headline with italic span markers |
| `home.hero_deck` | text | Hero deck paragraph |
| `home.bill_of_fare_subhead` | text | "Cooked this morning · Delivered hot" |
| `home.kitchen_story_title` | text | Kitchen story title (e.g., "A small kitchen, cooking honestly.") |
| `home.kitchen_story_body` | text (rich) | Kitchen story paragraphs |
| `home.how_it_works[]` | array of {title, body} | The three steps |
| `home.cta_eyebrow` | text | "Ready when you are" |
| `home.cta_title` | text | "Tonight's dinner, handled." |
| `home.cta_sub` | text | Sub-line under CTA title |
| `about.title` | text | About page title |
| `about.body` | text (rich) | About page long copy |
| `contact.intro` | text | Contact page intro copy |
| `legal.terms_of_service` | text (rich) | Terms page |
| `legal.privacy_policy` | text (rich) | Privacy page |
| `legal.refund_policy` | text (rich) | Refund page |
| `legal.cookie_notice` | text | Cookie banner text |
| `email.from_name` | text | Transactional email "from" name |
| `email.from_address` | text | Transactional email "from" address |
| `email.footer_signature` | text (rich) | Signature on transactional emails |

UI: A "Pages" admin section listing each editable string with rich-text or plain-text editors per key.

---

## 7. Hygiene & Trust (`settings.hygiene`)

| Field | Type | Default |
|---|---|---|
| `rating` | int (0-5) | 5 |
| `rating_label` | text | "Very Good" |
| `authority` | text | "Food Standards Agency" |
| `verify_url` | url | Current FSA listing URL |
| `inspected_on` | date (optional) | Last inspection date |

UI: Single settings form.

---

## 8. Operational Toggles (`settings.flags`)

| Field | Type | Default | Notes |
|---|---|---|---|
| `pickup_enabled` | boolean | `false` | Disabled in v1; admin can turn on later. Per SOW. |
| `cod_enabled_globally` | boolean | `true` | Master kill-switch for COD across all items |
| `accept_new_orders` | boolean | `true` | Manual pause for incoming orders |
| `show_kitchen_story_section` | boolean | `true` | Toggle whether the about section shows on homepage |

UI: A "Site toggles" admin settings page.

---

## 9. Payment (`settings.payment`)

| Field | Type | Notes |
|---|---|---|
| `stripe_publishable_key` | text | Public key, used client-side |
| `stripe_secret_key` | encrypted text | Server-side only |
| `stripe_webhook_secret` | encrypted text | Server-side only |
| `statement_descriptor` | text (≤22 chars) | What appears on customer card statements |
| `cod_collection_message` | text | Shown to admin when marking a COD as collected (e.g. "Cash received from customer") |

UI: Stripe setup form — keys are written-only (never displayed after save, only "rotate" available).

---

## 10. Email & Notification Templates (later phase)

Out of scope for v1 per SOW, but listed here for future reference: email template editor would manage the subject lines and body copy of:
- Order confirmation (to customer)
- New-order alert (to admin)
- Invoice (PDF cover note)
- Status-update emails

For v1, these strings live in code with sensible defaults. Editing them is a Phase-2 add-on.

---

## Cross-reference summary

When you see `<!-- ADMIN: ... -->` in a mockup HTML file, it maps to one of the entries above. Phase 4 (admin dashboard) builds the UI to edit each one.

In Phase 3 (Supabase + data layer), the corresponding tables/columns are created with the schemas above as the contract.
