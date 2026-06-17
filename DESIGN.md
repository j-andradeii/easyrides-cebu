# EasyRideCebu — Design System

> Single source of truth for the visual language of the EasyRideCebu marketing site.
> **Read this before making any styling change.** New UI must reuse the tokens, patterns,
> and class recipes below so the site stays visually consistent.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 (CSS-first config) · PrimeReact 10 (`lara-light-blue` base theme) · PrimeIcons · framer-motion (available, used sparingly).

**Theme of the brand:** warm tropical "Cebu sunset" — cream paper background, a coral-red→mango-orange signature gradient (from the logo car + sunset), accented by palm green, terracotta, papaya, and hibiscus. Neutrals come from Tailwind's **slate** scale. The mood is friendly, premium-but-affordable, sunny.

---

## 1. Where the design system lives

| Concern | Location |
| --- | --- |
| Color tokens + font vars + PrimeReact overrides | `src/app/globals.css` |
| Font loading (`next/font`) | `src/app/layout.tsx` |
| Tailwind v4 theme mapping (`@theme inline`) | `src/app/globals.css` |
| Real component patterns (the canonical reference) | `src/components/landing/*` |
| Form field primitives | `src/components/Form*.tsx` |

> ⚠️ `src/layouts/MainLayout.tsx` is **leftover starter boilerplate** (uses `gray-*`, "EasyRides App", generic header). It is **not** part of this design system — do not copy from it. The landing page (`src/app/page.tsx` + `src/components/landing/`) is the canonical reference.

---

## 2. Typography

Two Google fonts are loaded via `next/font/google` in `layout.tsx` and exposed as CSS variables:

| Role | Font | CSS var | Tailwind token | Weights loaded |
| --- | --- | --- | --- | --- |
| Body / UI / sans | **Poppins** | `--font-poppins` | `font-sans` | 300, 400, 500, 600, 700 |
| Headings / display | **DM Sans** | `--font-dm-sans` | `font-display` | 400, 500, 600, 700 |

**Global defaults (set in `globals.css`, applied automatically — don't re-declare):**

```css
body  { font-family: Poppins; font-weight: 400; line-height: 1.6; letter-spacing: -0.01em; }
h1–h6 { font-family: DM Sans; font-weight: 600; line-height: 1.2; letter-spacing: -0.02em; }
```

So `<h1>`–`<h6>` already use DM Sans + tight tracking. You normally only add **size**, **weight override**, and **color** utilities.

### Type scale (observed conventions)

| Use | Classes |
| --- | --- |
| Hero H1 | `text-4xl sm:text-5xl lg:text-6xl font-bold ... leading-tight` |
| Section H2 (large) | `text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight` |
| Section H2 (standard) | `text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4` |
| Card / sub H3 | `text-xl` → `text-2xl font-bold text-slate-900` |
| Small heading (footer/info) | `text-lg font-semibold` / `font-semibold` |
| Lead paragraph | `text-lg text-slate-600 max-w-2xl mx-auto` |
| Body | `text-base` / default; muted = `text-slate-600` |
| Small / meta | `text-sm text-slate-500` |
| Micro / labels | `text-xs` (often `uppercase tracking-wider` for badges) |

**Rules of thumb**
- Headings: `font-bold` (700) on the page, `font-semibold` (600) for smaller sub-headings.
- Body copy color is `text-slate-600`; primary text is `text-slate-900`; on dark/photo backgrounds use `text-white` with `drop-shadow-*`.
- Always make large headings responsive (`text-3xl sm:text-4xl lg:text-5xl` ladder).

---

## 3. Color tokens

Defined as CSS custom properties in `:root` and mapped to Tailwind utilities via `@theme inline` in `globals.css`. **Use the Tailwind tokens** (`bg-coral`, `text-mango`, …), not raw hex.

### Brand palette

| Token (primary alias) | Tailwind classes | Hex | Light / Dark | Meaning |
| --- | --- | --- | --- | --- |
| **cebu-red** = `coral` | `*-cebu-red` / `*-coral` | `#DC2626` | `#EF4444` / `#B91C1C` | Primary brand red (the car) |
| **sunset-orange** = `mango` | `*-sunset-orange` / `*-mango` | `#F59E0B` | `#FBBF24` / `#D97706` | Primary brand orange (sunset) |
| **sunset-yellow** = `golden` | `*-sunset-yellow` / `*-golden` | `#FFC107` | `#FFEB3B` / `#FFA000` | Warm yellow accent |
| **palm** | `*-palm` | `#2D6A4F` | `#40916C` / `#1B4332` | Tropical green (trust/eco) |
| **palm-black** | `*-palm-black` | `#1A1A1A` | `#374151` / `#0F0F0F` | Near-black text/logo |
| **cream** | `*-cream` | `#F5F0E1` | `#FAF8F3` / `#E8E0CC` | Page background / paper |
| **papaya** | `*-papaya` | `#FFAB76` | `#FFBF94` / `#E89560` | Soft warm accent |
| **terracotta** | `*-terracotta` | `#E07A5F` | `#E99680` / `#C96A50` | Earthy accent (headings/badges) |
| **hibiscus** | `*-hibiscus` | `#C94C4C` | `#D86B6B` / `#A83D3D` | Tropical red accent |

Each token has `-light` and `-dark` variants (e.g. `bg-coral-dark`, `text-palm-light`).

> **Aliases:** `coral`/`mango`/`golden` are the legacy names and are **the ones used most in components**. `cebu-red`/`sunset-orange`/`sunset-yellow` are the same colors under brand names (used in `Navigation`). They are interchangeable — **prefer `coral` / `mango`** for new code to match the majority of the codebase.

### Foundation tokens

| Token | Classes | Hex |
| --- | --- | --- |
| Background (page) | `bg-background` (or `bg-cream` / `bg-[#F5F0E1]`) | `#F5F0E1` |
| Foreground (text) | `text-foreground` | `#1A1A1A` |

### Neutrals — use Tailwind **slate**

Brand has no custom gray scale; neutrals come straight from Tailwind's default **slate**:

| Use | Class |
| --- | --- |
| Light section background | `bg-slate-50` |
| Card border | `border-slate-100` / `border-slate-200` |
| Primary text | `text-slate-900` |
| Body / muted text | `text-slate-600` |
| Subtle / meta text | `text-slate-500` |
| Placeholder / faint | `text-slate-400` |
| Dark surfaces (footer) | `from-slate-900 to-slate-950` |

### Functional / utility colors (Tailwind defaults)

| Purpose | Color |
| --- | --- |
| WhatsApp / success | `bg-green-500` / `green-50` + `green-200` + `green-800` (toasts) |
| Messenger | `bg-blue-600` |
| Error / invalid | `text-cebu-red`, `border-cebu-red`; error toast `bg-red-50 / border-red-200 / text-red-800` |

### Dark mode

`globals.css` has a `@media (prefers-color-scheme: dark)` block that swaps `--background`/`--foreground`, **but components hardcode light surfaces** (white cards, slate text). **Dark mode is effectively not supported** — design for light mode. Don't rely on `dark:` working unless you implement it deliberately.

---

## 4. The signature gradient

The brand's hero element. Reuse it for primary emphasis; don't invent new gradients.

```jsx
// Primary CTA / brand gradient (left→right)
bg-gradient-to-r from-coral to-mango
// Hover state
hover:from-coral-dark hover:to-mango-dark
// Disabled state
disabled:from-coral/70 disabled:to-mango/70

// As gradient TEXT (headings accent)
bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent

// Brand-name equivalent (Navigation) — same colors
bg-gradient-to-r from-cebu-red to-sunset-orange
```

Other accepted gradient accents (used for variety per section, always brand tokens):
- `from-palm to-palm-dark` (fleet / green stat)
- `from-mango to-coral` (reverse, occasionally)
- Icon tiles: `bg-gradient-to-br from-coral/10 to-mango/10`

---

## 5. Spacing & layout

| Concern | Convention |
| --- | --- |
| Page container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Section vertical padding | `py-12` (compact) · `py-24` (spacious). Some are tighter (`py-2`) when visually adjacent. |
| Section header → content gap | `mb-16` (sometimes `mb-20`) |
| Card internal padding | `p-6` / `p-8` (large feature panels `p-8 sm:p-10` / `sm:p-12`) |
| Form field spacing | wrap fields in `space-y-4`; pass `className="mb-0"` to Form\* components to neutralize their built-in `mb-4` |
| Grid gaps | `gap-6` / `gap-8` (cards), `gap-3`/`gap-4` (form rows, button rows) |
| Fixed-nav anchor offset | sections use `scroll-mt-15`; hero uses `pt-16` to clear the `h-16` fixed header |

### Section anatomy (copy this skeleton)

```jsx
<section id="anchor" className="py-12 bg-slate-50 relative overflow-hidden scroll-mt-15">
  {/* 1. Decorative blurred glow blobs */}
  <div className="absolute top-0 right-0 w-96 h-96 bg-coral/5 rounded-full blur-3xl" />
  <div className="absolute bottom-0 left-0 w-80 h-80 bg-mango/5 rounded-full blur-3xl" />

  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* 2. Centered header: pill badge + H2 + lead */}
    <div className="text-center mb-16">
      <div className="inline-flex items-center gap-2 bg-white text-coral px-4 py-2 rounded-full
                      text-sm font-medium mb-4 shadow-sm border border-coral/20">
        <span className="w-1.5 h-1.5 bg-coral rounded-full animate-pulse" />
        Eyebrow label
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
        Headline with <span className="bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent">accent</span>
      </h2>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">Supporting sentence.</p>
    </div>

    {/* 3. Content grid */}
  </div>
</section>
```

**Landing page section order & anchor IDs** (`src/app/page.tsx`):
`#services` → `#fleet` → DriverBanner → `#tours` → `#pricing` → WhyChooseUs → `#contact` → Footer.
Nav links and CTAs point at these IDs.

---

## 6. Border radius & elevation

### Radius scale

| Token | Used for |
| --- | --- |
| `rounded-lg` (0.5rem) | inputs, standard buttons, small tiles |
| `rounded-xl` | icon tiles, prominent buttons, info cards |
| `rounded-2xl` | standard cards |
| `rounded-3xl` | large cards, feature/CTA panels, accordion panels |
| `rounded-full` | pills, badges, avatars, icon circles, dots |

### Shadow scale

| Token | Used for |
| --- | --- |
| `shadow-sm` | cards at rest, header |
| `shadow-md` | nav "Book Now", subtle hover |
| `shadow-lg` | primary CTAs, active cards |
| `shadow-xl` | card hover, form containers |
| `shadow-2xl` | hero booking form |
| **Colored shadow** | CTAs glow with brand tint: `shadow-lg shadow-coral/25` (also `shadow-coral/20`) |

---

## 7. Component recipes

### Buttons

```jsx
// PRIMARY — gradient CTA (most important action)
className="bg-gradient-to-r from-coral to-mango hover:from-coral-dark hover:to-mango-dark
           text-white py-4 rounded-lg font-semibold transition-all
           shadow-lg shadow-coral/25 flex items-center justify-center gap-2"

// PRIMARY (lift variant) — add motion on larger CTAs
"... rounded-xl hover:shadow-xl hover:-translate-y-0.5"

// SECONDARY — outlined coral on light
className="bg-white border-2 border-coral text-coral hover:bg-coral/5
           px-6 py-3 rounded-lg font-semibold transition-colors"

// SOLID DARK — neutral strong action
className="bg-slate-900 text-white hover:bg-slate-800 py-4 rounded-xl font-bold
           hover:-translate-y-0.5 transition-all"

// SOLID ACCENT (per-service color) — e.g. palm / terracotta / hibiscus
className="bg-palm hover:bg-palm/90 text-white px-8 py-4 rounded-xl font-bold shadow-lg"

// TEXT / GHOST (on photo or nav)
className="text-white hover:text-coral px-6 py-3 font-semibold transition-colors"

// INVERTED — white button on a gradient/colored panel
className="bg-white text-coral hover:bg-white/95 px-8 py-4 rounded-xl font-semibold shadow-lg"
```

- Submit buttons commonly use PrimeReact `<Button>` with the same gradient classes + `submit-button` (see globals override) and a `pi pi-send` / `pi pi-spin pi-spinner` icon.
- Loading state: spinner SVG (`animate-spin`) or `pi pi-spin pi-spinner`, label switches to "Submitting…"/"Sending…", `disabled` + `disabled:from-coral/70`.

### Cards

```jsx
// Standard hover-lift card
className="group bg-white rounded-2xl overflow-hidden border border-slate-100
           hover:shadow-xl hover:-translate-y-2 transition-all duration-300"

// Soft feature card (icon + text)
className="group flex gap-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-100
           hover:shadow-lg hover:-translate-y-1 transition-all duration-300"

// "Popular" highlighted card
className="ring-1 ring-coral/20 shadow-xl shadow-coral/5 hover:shadow-2xl
           hover:shadow-coral/10 hover:-translate-y-1"   // vs default border-slate-100
```

Use the `group` / `group-hover:` pattern to coordinate child motion (image `group-hover:scale-110`, title `group-hover:text-coral`, button reveal gradient).

### Pill / eyebrow badge

```jsx
// Header eyebrow (color varies per section: coral, terracotta, mango-dark…)
className="inline-flex items-center gap-2 bg-white text-coral px-4 py-2 rounded-full
           text-sm font-medium mb-4 shadow-sm border border-coral/20"
// → contains a pulsing dot (animate-pulse / animate-ping) or a 16px icon

// "MOST POPULAR" ribbon on a card
className="bg-gradient-to-r from-coral to-mango text-white text-xs font-bold
           px-3 py-1.5 rounded-full shadow-lg shadow-coral/20"

// Solid status badge
className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"  // + bg-{accent} text-white
```

### Icon tiles

```jsx
// Gradient-tint square (feature lists)
className="w-14 h-14 bg-gradient-to-br from-coral/10 to-mango/10 rounded-xl
           flex items-center justify-center text-coral flex-shrink-0"

// Solid-tint circle (info rows / stats)
className="w-10 h-10 bg-coral/10 rounded-full flex items-center justify-center text-coral"
```

### Decorative background glows

Every major section places 1–2 of these (non-interactive, behind content):

```jsx
<div className="absolute top-0 right-0 w-96 h-96 bg-coral/5 rounded-full blur-3xl" />
```
Tint with `bg-{brand}/5`–`/10`. Keep them `pointer-events-none` / behind a `relative z-10` content wrapper.

---

## 8. Forms

Form fields are pre-built, react-hook-form-integrated components in `src/components/` — **reuse them**, don't hand-roll inputs:

`FormInput` · `FormSelect` · `FormCalendar` · `FormCheckbox` · `FormTextarea` · `FormPhoneInput` · `FormError`

Validation: **Zod** schema + `zodResolver` + `<FormProvider>`. Messages/constants live in `src/core/form-messages.ts` and `src/core/constants.ts`.

### Field anatomy & classes

```jsx
// Label
className="block text-sm font-medium text-slate-700 mb-2"
// Required marker
<span className="text-cebu-red ml-1">*</span>

// Text input (FormInput)
className="w-full px-4 py-3 border rounded-lg bg-white text-slate-700 transition-colors
           focus:ring-2 focus:ring-coral focus:border-transparent
           border-slate-200          /* valid */
           border-cebu-red           /* invalid (fieldState.invalid) */
           bg-slate-50 text-slate-500 cursor-not-allowed  /* disabled/readonly */"

// Error text (FormError)
className="text-cebu-red text-sm mt-1 block"   // rendered as <small>
```

- Inside a `space-y-4` form, pass `className="mb-0"` to each Form\* component (their default is `mb-4`).
- PrimeReact inputs (Calendar, Dropdown, Checkbox) are themed in `globals.css` to match: focus ring/hover/selected all use `--coral`; panels are white, `rounded-xl`, `shadow` like the cards. Class hooks: `.hero-calendar` / `.hero-dropdown` (hero form), `.form-calendar` / `.form-dropdown`, `.phone-country-dropdown`, `.submit-button`.

### Toast / inline notification

```jsx
// Success
className="bg-green-50 border border-green-200 text-green-800 ... rounded-lg shadow-lg"
// Error
className="bg-red-50 border border-red-200 text-red-800 ..."
// Animated in with the custom keyframe:
className="animate-[slideIn_0.3s_ease-out]"   // fixed bottom-4 right-4 z-50, auto-dismiss ~5s
```

---

## 9. Navigation & overlays

- **Header:** `fixed top-0 inset-x-0 z-50 bg-[#F5F0E1] backdrop-blur-sm shadow-sm`, height `h-16`. Logo (52px rounded-full) + wordmark `text-xl font-bold text-palm-black`. Links `text-palm-black hover:text-cebu-red font-medium transition-colors`. Mobile menu toggles below `md`.
- **Z-index ladder:** background art `z-0` → section content `z-10` → fixed header `z-50` → toasts/overlays `z-50`.
- **Image overlays on photos:** darken with `bg-black/45` or `bg-slate-900/50–60` (gradient `from-slate-900/50 to-transparent`); white text gets `drop-shadow-md`/`drop-shadow-lg` for legibility.

---

## 10. Iconography

| Source | When |
| --- | --- |
| **Inline SVG** (Heroicons-style: 24×24 viewBox, `stroke-width` 1.5–2, `stroke="currentColor"`) | Default for UI/decorative icons. Sizes `w-4 h-4` … `w-8 h-8`. Color via `text-*`. |
| **PrimeIcons** (`pi pi-*`, e.g. `pi pi-send`, `pi pi-spin pi-spinner`) | Inside PrimeReact `<Button>` and PrimeReact widgets. |
| **Emoji** (🚗 ✈️ 🗺️) | Lightweight pickers / playful affordances (hero service selector). |

Brand social SVG marks (Facebook, Instagram, WhatsApp, Messenger) are hand-inlined in `Footer`/forms — reuse those paths.

---

## 11. Motion

- Transitions: `transition-all` / `transition-colors` / `transition-transform`, durations `duration-300` (UI), `duration-500`–`duration-700` (images / accordion).
- Hover signatures: `hover:-translate-y-0.5` / `-translate-y-1` / `-translate-y-2` (cards & CTAs), `hover:scale-110` (images, icon tiles), `group-hover:translate-x-1` (arrow icons).
- Looping accents: `animate-pulse` (glow blobs, dots), `animate-ping` (live "status" dot), `animate-spin` (loaders).
- Custom keyframe `slideIn` (in `globals.css`) for toast entrance: `animate-[slideIn_0.3s_ease-out]`.
- `framer-motion` is installed and available for richer choreography, but most current motion is pure Tailwind — prefer Tailwind utilities for simple hovers; reach for framer-motion only for orchestrated/entrance animations.
- `html` has `scroll-smooth`; anchor scrolling is handled via `useAnchorScroll` (`src/hooks/`).

---

## 12. Do / Don't

**Do**
- Reuse the `coral`/`mango` gradient for primary emphasis and the slate scale for neutrals.
- Start sections from the §5 skeleton (container + glow blobs + centered header).
- Reuse `Form*` components, `TourCard`, and the button/card recipes verbatim.
- Keep headings on the responsive size ladder and let global CSS supply the font/tracking.
- Tint shadows on CTAs (`shadow-coral/25`) and use `group`/`group-hover` for coordinated hover.

**Don't**
- Don't hardcode hex values — use the Tailwind brand tokens (`bg-coral`, not `bg-[#DC2626]`).
- Don't introduce new fonts, new gradients, or a second gray scale (no `gray-*`; use `slate-*`).
- Don't copy from `src/layouts/MainLayout.tsx` (boilerplate, off-brand `gray-*`).
- Don't assume dark mode works — components are light-only today.
- Don't restyle PrimeReact widgets ad-hoc; extend the overrides in `globals.css` so all instances stay consistent.

---

## 13. Quick reference — token cheat sheet

```
Brand:    coral (=cebu-red, #DC2626)   mango (=sunset-orange, #F59E0B)   golden (=sunset-yellow, #FFC107)
          palm (#2D6A4F)   terracotta (#E07A5F)   papaya (#FFAB76)   hibiscus (#C94C4C)
          palm-black (#1A1A1A)   cream/background (#F5F0E1)
          (+ -light / -dark on every brand token)
Neutral:  slate-50/100/200 (surfaces, borders) · slate-500/600 (muted text) · slate-900 (text/dark)
Fonts:    Poppins → body (font-sans)   ·   DM Sans → headings (font-display, auto on h1–h6)
Gradient: bg-gradient-to-r from-coral to-mango  (hover: -dark/-dark · text: +bg-clip-text text-transparent)
Radius:   lg=inputs/buttons · xl=tiles/info · 2xl=cards · 3xl=feature panels · full=pills/avatars
Shadow:   sm rest → lg/xl hover · 2xl hero form · CTA glow shadow-coral/25
Container:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8   ·   Section: py-12 / py-24, scroll-mt-15
```
