# Implementation Plan — Traveler Homepage

## Context & Decisions

**Project:** Next.js 16.4 / React 19.3 / Tailwind CSS 4 / TypeScript strict mode.  
**Path alias:** `@/` maps to the repo root (i.e. `@/app/…`).  
**Styling pattern:** CSS custom properties defined in `globals.css` under named `:root` blocks, consumed via `var(--token)` inline `style` props or Tailwind's arbitrary-value syntax. No external UI libraries — inline SVGs only.  
**Token naming:** existing blocks are `--ob-*` (onboarding) and `--db-*` (dashboard). The new traveler-platform block will use `--tp-*` to keep token sets cleanly separated.  
**Component split:** interactive elements (nav links, search form with state, mobile hamburger) are `'use client'`; sections whose data is static or can be hardcoded (hotel cards, destination cards) are server components so they're zero-JS by default.  
**No `params`/`searchParams` needed on `page.tsx`** because the homepage is purely static. The documented async-Promise API is only relevant for dynamic routes and pages that read URL params — leave the root page signature param-free.  
**Image strategy:** Next.js `<Image>` for any real photo assets; `placeholder="blur"` or `blurDataURL` only for images that exist on disk. All mock images use `unoptimized` + `fill` layout pattern already used in `dashboard` components — or use CSS `background-image` on a `<div>` for hero to avoid the `src` requirement on placeholder builds.  
**Build verification command:** `npx next build` (runs type-check + lint + build).  
**Lint command:** `npx eslint .` — available via `scripts.lint` in `package.json`.

---

## Implementation Plan

- [ ] 1. Add `--tp-*` design tokens to `globals.css`.  
      Append a new `:root` block named "Traveler platform design tokens" immediately after the dashboard tokens block. Tokens needed:  
      - `--tp-bg: #f9f7f4` — warm page background (same as `--ob-bg`)  
      - `--tp-surface: #ffffff` — card/panel surface  
      - `--tp-primary: #1a1a1a` — primary headings/text  
      - `--tp-secondary: #6b6560` — secondary/muted text  
      - `--tp-accent: #3d6b4f` — earthy green CTA (same family as `--ob-accent`)  
      - `--tp-accent-hover: #2f5540` — darker shade for hover  
      - `--tp-border: #e8e4df` — subtle warm border  
      - `--tp-muted: #f1ede8` — muted surface (chips, badges)  
      - `--tp-nav-h: 64px` — navbar height for offset on sticky elements  
      - `--tp-hero-overlay: rgba(0,0,0,0.45)` — dark overlay on hero image  
      - `--tp-star: #d4a843` — star/rating gold  
      Files: `app/globals.css`  
      Verify: `npx next build` — no type errors, build succeeds.

- [ ] 2. Create `app/components/TravelerNav.tsx` (`'use client'`).  
      **What to build:** sticky top navbar, height `var(--tp-nav-h)`. Transparent on hero scroll (hero is full-viewport), solid `var(--tp-surface)` with shadow once user scrolls past hero. Implemented with a `useEffect` + `scroll` listener toggling a boolean state. Contains:  
      - Logo: text mark `Hotel<span>OS</span>` using same style as `DashboardSidebar` (white text when transparent, `--tp-primary` when solid).  
      - Nav links: "Explore", "My Bookings", "List your hotel" (links to `/dashboard/overview` for now).  
      - Auth CTAs: "Sign in" (ghost button), "Get started" (filled, `--tp-accent`).  
      - Mobile: hamburger button (inline SVG) toggling a slide-down menu with the same links.  
      - Uses `Link` from `next/link` and `usePathname` from `next/navigation` for active state styling.  
      **Key concerns:**  
      - Must be `'use client'` because of `useState`/`useEffect`/`usePathname`.  
      - No `useSearchParams` — it doesn't need query params.  
      - Accessible: `role="navigation"`, `aria-label="Main"`, hamburger has `aria-expanded` and `aria-controls`.  
      Files: `app/components/TravelerNav.tsx` *(new file, new directory)*  
      Verify: `npx next build` — component type-checks cleanly.

- [ ] 3. Create `app/components/SearchBar.tsx` (`'use client'`).  
      **What to build:** horizontal search module used inside the hero and optionally as a compact version at the top of search results. Four fields in one pill-shaped bar:  
      1. **Destination** — text input, placeholder "Where are you going?", with a location-pin SVG icon.  
      2. **Check-in** — `<input type="date">` with a calendar SVG icon.  
      3. **Check-out** — `<input type="date">` with a calendar SVG icon.  
      4. **Guests** — stepper (increment/decrement buttons) for adult count with a person SVG icon.  
      Submit button: "Search hotels" — styled with `--tp-accent` background, full rounded, navigates to `/search` with query params via `useRouter().push(…)`.  
      **Props interface:**  
      ```ts
      type SearchBarProps = {
        variant?: 'hero' | 'compact';   // hero = large, compact = smaller for search results page
        initialDestination?: string;
        initialCheckIn?: string;
        initialCheckOut?: string;
        initialGuests?: number;
      };
      ```  
      **Key concerns:**  
      - `'use client'` for controlled state and `useRouter`.  
      - `useRouter` from `next/navigation` (App Router).  
      - Responsive: on mobile, stack fields vertically; on `sm:` and up, horizontal row.  
      - No external date-picker library — native `<input type="date">`.  
      Files: `app/components/SearchBar.tsx`  
      Verify: `npx next build` — no type errors.

- [ ] 4. Create `app/components/HotelCard.tsx` (server component).  
      **What to build:** reusable card for a hotel listing. Used in "Featured Hotels" and "Recommended Stays" sections.  
      **Props type (define inline in file):**  
      ```ts
      type HotelCardProps = {
        id: string;
        name: string;
        city: string;
        neighborhood?: string;
        starRating: number;        // 1–5
        reviewCount: number;
        reviewScore: number;       // e.g. 8.7 out of 10
        pricePerNight: number;     // in NGN
        imageUrl: string;
        amenities: string[];       // up to 3 shown
        tag?: string;              // e.g. "Featured", "New"
      };
      ```  
      **Card layout:**  
      - Image area (aspect-ratio 4/3) using Next.js `<Image fill sizes="(max-width:640px) 100vw, 340px" alt={name}>` wrapped in a `relative overflow-hidden` container. `priority={false}`.  
      - Content area: name (bold, `--tp-primary`), location line (pin SVG + city + neighborhood), star rating display (filled star SVGs), review score badge, amenity chips (up to 3), and "From ₦X,XXX/night" price line.  
      - Entire card links to `/hotels/${id}` via `<Link>`.  
      - Hover: subtle `box-shadow` lift transition (`transition-shadow duration-200`).  
      **Key concerns:**  
      - No `'use client'` — server component, zero JS.  
      - Star rendering: 5 inline SVG stars, filled vs unfilled based on `starRating`. Use `aria-label={`${starRating} out of 5 stars`}`.  
      - Price format: use `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })`. This is safe in a server component (Node environment).  
      - Must use `import Image from 'next/image'` and `import Link from 'next/link'`.  
      Files: `app/components/HotelCard.tsx`  
      Verify: `npx next build` — no type errors.

- [ ] 5. Create `app/components/DestinationCard.tsx` (server component).  
      **What to build:** editorial card for popular city destinations. Used in the "Popular Destinations" section.  
      **Props type:**  
      ```ts
      type DestinationCardProps = {
        city: string;
        state: string;
        hotelCount: number;
        imageUrl: string;
        href: string;    // e.g. "/search?destination=Lagos"
      };
      ```  
      **Card layout:**  
      - Full-bleed image with dark gradient overlay (`linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)`).  
      - City name and `"${hotelCount} hotels"` text overlaid at the bottom in white.  
      - Aspect ratio: 3/4 on mobile, 1/1 on grid layout.  
      - Hover: image scale `scale-105` with `overflow-hidden` on the container, 300ms transition.  
      - The whole card is wrapped in `<Link href={href}>`.  
      **Key concerns:**  
      - No `'use client'`.  
      - Image: `<Image fill sizes="(max-width:640px) 50vw, 220px" alt={`${city}, ${state}`}>` inside relative container.  
      - `aria-label` on the link: `"Explore hotels in ${city}"`.  
      Files: `app/components/DestinationCard.tsx`  
      Verify: `npx next build` — no type errors.

- [ ] 6. Replace `app/page.tsx` with the full 7-section traveler homepage.  
      This is a **server component** (no `'use client'` at page level). It imports the four components above plus `TravelerNav`. All data (destinations, hotels) is hardcoded as static arrays in the file — no API calls yet.  

      **7 sections:**

      **Section 1 — Navbar**  
      `<TravelerNav />` positioned `fixed top-0 left-0 right-0 z-50`.

      **Section 2 — Hero**  
      Full-viewport-height div (`min-h-screen`) with a CSS `background-image` pointing to `/images/hero-bg.jpg` (add a note that this asset must be placed in `public/images/`; until then use a dark CSS gradient as fallback: `linear-gradient(135deg, #1a1a1a 0%, #2d4a3e 100%)`). Overlay with `--tp-hero-overlay`. Centered content: headline `"Stay somewhere worth remembering."` in a large serif-like weight (use `font-bold text-4xl sm:text-5xl lg:text-6xl text-white`), subheadline, then `<SearchBar variant="hero" />`. Use `padding-top: calc(var(--tp-nav-h) + 2rem)` so content clears the fixed nav.

      **Section 3 — Popular Destinations**  
      Heading: "Popular Destinations". Grid of 6 `<DestinationCard />` items: Lagos, Abuja, Port Harcourt, Uyo, Kano, Kaduna. Static `hotelCount` values (mock). Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`.

      **Section 4 — Featured Hotels**  
      Heading: "Featured Hotels". Horizontal scroll on mobile, 3-col grid on desktop: 3 `<HotelCard />` items with mock data. Include a "View all hotels →" link to `/search`.

      **Section 5 — Recommended Stays**  
      Same grid layout as Featured Hotels but with 3 different mock hotels tagged "Recommended". Heading: "Recommended Stays".

      **Section 6 — Weekend Stays CTA strip**  
      Full-width band with dark `--tp-primary` background. Left: headline `"Plan your weekend escape."`, subtext `"Browse last-minute availability for this weekend."`. Right: CTA button `"Browse weekend stays"` → `/search?tag=weekend`. Flexbox row, stacked on mobile.

      **Section 7 — Footer**  
      Three columns: Brand (logo + one-liner), Quick Links (Explore, List your hotel, Help), Legal (Privacy, Terms). Bottom bar with copyright `"© 2025 Hotel OS. All rights reserved."`.

      **Key concerns:**  
      - Do NOT use `params` or `searchParams` in the page signature — this is a static homepage.  
      - Do NOT add `'use client'` to `page.tsx`; interactive client islands are already encapsulated in `TravelerNav` and `SearchBar`.  
      - Remove the existing Next.js `import Image from "next/image"` import and placeholder content entirely.  
      - The `pt-[var(--tp-nav-h)]` trick for the first section below the fixed nav — use `style={{ paddingTop: 'var(--tp-nav-h)' }}` since Tailwind 4 arbitrary values with CSS vars can be inconsistent without the `@theme` map entry.  
      - Mock data arrays for hotels and destinations go at the top of the file (not exported — internal only). Keep it simple: 6 destinations, 6 hotel objects.  
      - All `imageUrl` values in mock data point to `/images/hotels/hotel-1.jpg` etc. — note in a comment that these assets are placeholders and the `<Image>` tag should have `onError` fallback styling or a neutral background color while assets are absent. Use `unoptimized={true}` on placeholder images to avoid Next.js throwing on missing files during `next build`.  

      **Risk:** `<Image>` with `fill` requires its parent to have explicit `position: relative` and a defined height/width — verify every card usage sets this correctly (covered in items 4 and 5 above).  

      Files: `app/page.tsx` *(full replacement)*  
      Verify: `npx next build` — builds without errors; `npx next dev` — homepage renders at `http://localhost:3000`.

- [ ] 7. Update `app/layout.tsx` metadata.  
      Replace the generic `metadata` export with Hotel OS branding:  
      ```ts
      export const metadata: Metadata = {
        title: {
          default: 'Hotel OS — Discover & Book Hotels in Nigeria',
          template: '%s | Hotel OS',
        },
        description:
          'Discover verified hotels across Nigeria and book your next stay with confidence. Lagos, Abuja, Port Harcourt and more.',
        keywords: ['hotel booking', 'Nigeria hotels', 'Lagos hotels', 'Abuja hotels', 'Hotel OS'],
        openGraph: {
          siteName: 'Hotel OS',
          locale: 'en_NG',
          type: 'website',
        },
      };
      ```  
      No changes to the `RootLayout` function body, font setup, or `LayoutProps<"/">` usage — leave those intact.  
      Files: `app/layout.tsx`  
      Verify: `npx next build` — metadata types compile cleanly. In dev, `<title>` in the browser tab shows "Hotel OS — Discover & Book Hotels in Nigeria".

---

## Risk Register

| Risk | Mitigation |
|---|---|
| `next/image` `fill` layout requires a positioned parent with non-zero height | Every `HotelCard` and `DestinationCard` wrapper must have `className="relative"` and an explicit height (e.g. `h-52`) or aspect-ratio utility |
| Missing hero/hotel image assets cause build warnings or blank areas | Use CSS gradient fallback for hero; set `unoptimized` on mock `<Image>` tags; add a neutral background color to image containers |
| `TravelerNav` scroll listener memory leak | Clean up in `useEffect` return: `window.removeEventListener('scroll', handler)` |
| Tailwind 4 `@theme` token required for `bg-[var(--tp-accent)]` to work | Use `style={{ background: 'var(--tp-accent)' }}` inline pattern (same as `StatCard.tsx` and `DashboardSidebar.tsx`) instead of Tailwind arbitrary values for CSS-var colors, unless the token is also registered in `@theme inline {}` |
| `useRouter` import must be from `next/navigation`, not `next/router` | Confirmed by reading Next.js 16 docs — App Router uses `next/navigation` exclusively |
| `LayoutProps<"/">` in `layout.tsx` is generated by `next typegen` during dev/build | Do not remove it; it is already correct — leave the `RootLayout` signature untouched |
