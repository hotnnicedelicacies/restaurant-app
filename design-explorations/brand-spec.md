# Hot N Nice Delicacies · Brand Spec
> Source of truth for the v2026 rebuild. All HTML/JSX must reference these values, not invent new ones.
> Collected: 2026-05-11 · Direction: v3-β Walnut & Cream (Heritage British)

---

## 🎯 Core Assets (Tier 1 — must use)

### Logo
- Primary (full badge): `public/logo.png` — vintage seal-style emblem, deep crimson + orange + cream internal palette, hand-lettered "Hot 'n' Nice", chef's hat + crossed utensils, "PREMIUM" / "DELICACIES" curving labels
- Favicon / app icon: `app/icon.svg` — stylized red bowl with three steam wisps, used at small sizes (PWA, tab, mobile shortcut)
- React component for inline use: `components/LogoMark.tsx` (SVG bowl) and `components/LogoStacked.tsx` (stacked wordmark)
- Usage scenarios: page header (always), order confirmation emails, invoice PDFs, PWA install icon, footer crest
- Sits on both cream and walnut backgrounds without modification — its internal cream backdrop carries it

### Food photography
- Hero / signature: `assets/hero-food.jpg` (curated hero spread)
- Per-item: `assets/meals/{name}-1.png` (curated, preferred) or `assets/meals/{name}.jpeg` (raw)
- Style: top-down or 3/4 plated, warm natural light, served on plain plates against neutral surfaces — no decorative ethnic styling props
- Quality: ≥1200×1200, food-cookbook-grade, no filtered/oversaturated edits
- Add to brand language: photography is the most visible expression of the brand. Per huashu-design §1.a — never use SVG/CSS shapes to represent food

---

## 🎨 Tier 2 — Color System (contrast-audited)

```css
--cream:        #F1E5CD   /* main background */
--cream-soft:   #ECDFC0   /* card/elevation surface — slightly darker cream */
--walnut:       #2D1F18   /* dark bands (header, day-strip, footer) + primary text on cream */
--walnut-soft:  #3D2A20   /* secondary emphasis text */
--ink-muted:    #4a3a2c   /* italic body / descriptions on cream — AAA on cream */
--bronze:       #A56F40   /* DECORATIVE ONLY — eyebrows ≥12px+letterspacing, CTA bg, ornaments */
--bronze-deep:  #7E5530   /* bronze-toned TEXT on cream where contrast must pass AA */
--rule:         rgba(45, 31, 24, 0.18)  /* dividers, dashed lines, borders */
--rule-light:   rgba(241, 229, 205, 0.22)  /* dividers ON walnut bands */
```

### Contrast contract

| Pair | Ratio | Use |
|---|---|---|
| `--walnut` on `--cream` | 13.0:1 (AAA) | All body text, headings |
| `--cream` on `--walnut` | 13.0:1 (AAA) | Text on dark bands |
| `--ink-muted` on `--cream` | 8.8:1 (AAA) | Italic descriptions, secondary copy |
| `--walnut-soft` on `--cream` | 11.0:1 (AAA) | Emphasis text |
| `--bronze-deep` on `--cream` | 4.8:1 (AA normal) | Bronze-toned text on cream (subheads, captions) |
| `--bronze` on `--cream` | 3.7:1 (AA large only) | **Decorative only** — ornaments, eyebrows ≥12px with letterspacing |
| `--bronze` on `--walnut` | 3.5:1 (AA large only) | **Decorative only** — accents on dark bands, CTA-button bg paired with walnut foreground |

### Disallowed colors (do not reintroduce)
- Pure black `#000000` — use `--walnut` instead
- Pure white — use `--cream` instead
- The current site's bright orange `hsl(24 95% 53%)` — too saturated for this direction
- Green of any kind — explicitly excluded by client
- Any purple, blue, or "AI gradient" colors

---

## ✍️ Tier 3 — Typography

### Font stack (load via next/font in `app/layout.tsx`)

| Role | Font | Weights | Source |
|---|---|---|---|
| Display + body editorial | **Cormorant Garamond** | 300, 400, 500, 600, 700 (+italic at 400, 500, 600) | Google Fonts |
| Small labels, mono / monospace data | **Geist Mono** | 400, 500 | Google Fonts |
| Sans (use sparingly — only where Cormorant feels wrong: forms, dense tables) | **Geist** | 400, 500, 600 | Google Fonts |

### Type system (px scale, applied at large breakpoints — scale down ~15-20% on mobile)

| Token | Element | Spec |
|---|---|---|
| `display-xl` | Hero headline | Cormorant Garamond 500, 60-72px, line-height 1.02, letter-spacing -0.005em |
| `display-l` | Section title (e.g., "Today's Bill of Fare") | Cormorant Garamond 500, 40-48px, italic on the emphasized word |
| `display-m` | Sub-section title | Cormorant Garamond 500, 28-32px |
| `headline` | Page sub-header, large body lead | Cormorant Garamond 500, 22-24px |
| `body-l` | Long-form body (about, item descriptions) | Cormorant Garamond italic 400, 16-18px, line-height 1.5 |
| `body` | Standard body, captions | Cormorant Garamond 400, 14-16px |
| `eyebrow` | Small-caps section labels | Cormorant Garamond 500 small-caps, 12-13px, letter-spacing 0.18-0.22em, color bronze on cream OR bronze on walnut |
| `mono` | Issue numbers, page nums, monospace data | Geist Mono 400, 9-11px, uppercase, letter-spacing 0.18-0.22em |
| `nav` | Top nav links | Cormorant Garamond 500 small-caps, 13-14px, letter-spacing 0.14em |
| `price` | Menu price | Cormorant Garamond 600, 17-20px |

### Italic discipline
- Italics for descriptions, captions, deck text, subheads
- Italics in headlines: ONLY on the emphasized phrase, not the whole headline ("delivered *hot*", "Bill of *Fare*")
- Italic body text uses `--ink-muted` color, not full `--walnut`, to soften the rhythm

### Small-caps treatment
- Use `font-variant: small-caps` not all-caps for navs, eyebrows, button labels
- Always paired with positive letter-spacing (0.12-0.22em)

---

## 📐 Tier 4 — Layout & Composition

### Anti-AI-slop rules (apply to all pages)
- **No center-aligned hero text over image** — always left-aligned in overlay, anchored bottom
- **No three-equal-cards row** — use 2-col, single-col image-rows, or asymmetric grid
- **No emoji** anywhere (icons, text, alt)
- **No "Elevate / Seamless / Unleash / Next-Gen"** copywriting filler
- **No floating gradient blobs / mesh gradients**
- **No purple AI-glow buttons** (this brand has no business with purple)
- **No SVG illustrations of food** (we have real photography; use it)

### Layout principles
- Generous outer margins (32-48px on mobile, 48-80px on desktop)
- Heritage editorial rhythm: alternating dark-band sections with cream-content sections
- Premium-detail flourishes that reward looking closer: `№ 11 · 11.05.26` issue numbers, `Vol. 01 · The Eleventh of May` eyebrows, dashed dividers between menu items, ornamental rules (40px wide, 1px, bronze opacity 0.7)
- Asymmetric balance > strict symmetry; image-paired rows > centered cards
- Negative space is structural, not filler

### Hero pattern (locked)
- Full-bleed food photograph as background
- Dark walnut gradient overlay (top: ~8% alpha → bottom: ~88% alpha) — keeps photo visible at top, ensures text contrast at bottom
- Eyebrow (small caps, bronze accent) + issue number on top row
- Headline (display-xl, italic emphasis on key phrase) + italic deck paragraph at bottom

### "Today's Bill of Fare" section pattern (locked)
- Centered editorial section header: small-caps eyebrow + italic-emphasized title + ornamental rule
- Vertical list of menu items as image-paired rows
- Each row: ~110-140px square image on left, item-text (numbered category eyebrow + name + italic description + price) on right
- Dashed divider between rows, no divider after last
- Sub-grid inside text: name+description column flexes, price column right-aligned with `white-space: nowrap`

### Footer / trust pattern
- Walnut band
- Crest centered: bronze small-caps 5-star line
- Italic delivery areas line below

---

## 🗣 Tier 5 — Voice & Tone

### Brand voice (keep consistent across copy, emails, error messages, invoices)
- Warm, grown-up, slightly understated. Never excited or salesy.
- Speaks like a confident home cook who knows their craft, not a takeaway shouting deals
- Specific: "Order by ten o'clock" beats "Order early!" — actual times, actual constraints
- British food-house tradition: "Today's Bill of Fare", "Cooked this morning", "Delivered hot to your door", "From the kitchen"
- Trust signals are stated, not shouted: "Five-star Food Hygiene Rating · Food Standards Agency" (no exclamation marks, no badges with sunbursts)

### Signature phrases (canonical — reuse across UI)
- "No shortcuts. No frozen meals. Just dinner."
- "Made with love, delivered hot to your door."
- "From our home kitchen in Middlesbrough."
- "Cooked this morning · Delivered hot"
- "Order by 10am for same-day delivery"

### What we don't say
- "Authentic African cuisine" / "exotic flavours" — by client direction, broad appeal not category-tagged
- "Award-winning" / "premium" (in body copy) — implied by the design, not claimed in words
- Restaurant superlatives ("the best", "unrivalled") — confident understatement instead

---

## 🚫 Brand No-Go List

- No ethnic visual cues (Ankara patterns, kente, African geometric motifs) — by client direction, brand reads as universal home-cooked food
- No emoji food icons (🍛 🌶 🍽 etc.) — anti-slop, dilutes premium tone
- No stock "lifestyle" photos of people eating — only food photography
- No price comparisons / discount banners — out of voice
- No "limited time offers" / urgency banners — out of voice
- No social-proof carousels of customer Instagram tags — out of voice

---

## ✅ Implementation Checklist (when adding new UI)

Before merging any new page or component, verify:

- [ ] All colors come from CSS variables; no hard-coded hex outside this spec
- [ ] All text passes contrast contract above (no bronze for body text)
- [ ] Cormorant Garamond used for editorial type; Geist only where Cormorant feels wrong
- [ ] No emoji in code, content, or alt text
- [ ] Hero composition is asymmetric / left-aligned, not centered text over image
- [ ] No 3-equal-card row layouts
- [ ] Real food photography used (no SVG / CSS shape food)
- [ ] Copy passes the "Voice & Tone" check (no filler verbs, no exclamation marks for trust signals)
- [ ] Italic discipline followed (italic body uses `--ink-muted`, italic emphasis only on the focal phrase in headlines)
- [ ] Premium-detail flourishes present where they help (issue numbers, eyebrows, ornaments) — never forced
