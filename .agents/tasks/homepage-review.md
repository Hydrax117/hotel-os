# Traveler-facing homepage for Hotel OS

The homepage introduces the traveler side of Hotel OS — a booking surface for Nigerian hotels. It adds a full-page layout (`app/page.tsx`) with seven sections, a new design token namespace (`--tp-*` in `globals.css`), and four new components. The build log confirms zero TypeScript errors and clean static generation of all 30 routes. Watch for: the SearchBar Search button fires no handler and no navigation occurs on submit — confirmed dead end.

**Verdict**: APPROVED

## High-level view

All seven sections are present and in order: TravelerNav, Hero, Popular Destinations, Featured Hotels, How It Works, Trust Bar, Footer. Client/server boundary is correct — `TravelerNav` and `SearchBar` carry `'use client'`; `HotelCard` and `DestinationCard` are server components with no directive. No external UI libraries imported.

The `--tp-*` token block is appended as a third `:root` block after `--ob-*` and `--db-*`. None of the nine new token names collide with existing ones; no regressions to prior token sets.

The hero mixed-typography headline is in place: "Stay" in Geist Sans, "somewhere worth remembering." in Georgia italic, same `<h1>`. The collage renders only at `lg:` breakpoint. All four mock hotels are in the static data array. The trust bar has four stats. The footer has four columns and a bottom copyright bar.

The SearchBar collects state in four controlled fields but the Search button has `type="button"` and no `onClick` on either the desktop or mobile variant. The collected state (`destination`, `checkIn`, `checkOut`, `guests`) is never used for navigation.

<details>
<summary>Issues (1)</summary>

1. **Search button fires no handler** — `SearchBar`'s "Search hotels" button has `type="button"` and no `onClick`. The four fields collect state that goes nowhere. Before the page goes live, wire it to `router.push('/search?...')` or wrap the fields in a `<form>` with an `action`. Confirmed.

</details>

<details>
<summary>Details</summary>

## Search button is a dead end

The "Search hotels" button in `SearchBar` carries `type="button"` with no `onClick` on either the desktop or mobile layout. The four controlled fields (`destination`, `checkIn`, `checkOut`, `guests`) collect state that is never consumed — no query string is assembled, no `router.push` fires, no form submission occurs. A traveler who fills in the form and taps Search gets no feedback and goes nowhere.

</details>

## File map

<details>
<summary>Changed files</summary>

- `app/globals.css` — added `--tp-*` token block (9 tokens)
- `app/layout.tsx` — updated `<title>` and `<description>` metadata for traveler audience
- `app/page.tsx` — full traveler homepage with 7 sections and static mock data
- `app/components/TravelerNav.tsx` — sticky client nav with scroll shadow and mobile hamburger overlay
- `app/components/SearchBar.tsx` — client search widget with 4 fields and guest counter
- `app/components/HotelCard.tsx` — server component card with star rating, amenity chips, and NGN price
- `app/components/DestinationCard.tsx` — server component card with gradient or image background

Full diff: `git diff main -- app/globals.css app/layout.tsx app/page.tsx app/components/TravelerNav.tsx app/components/SearchBar.tsx app/components/HotelCard.tsx app/components/DestinationCard.tsx`

</details>
