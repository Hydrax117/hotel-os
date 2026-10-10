# UI Completion Plan

## Project Context

- **Framework**: Next.js 16.4.0 (App Router), React 19.3.0, Tailwind CSS v4
- **Build**: `npm run build` / `next build`
- **Dev**: `npm run dev` (Turbopack)
- **No test runner** configured — verify with `npm run build` (zero TS/build errors)
- **Key constraint**: Next.js 16 App Router — `params` and `searchParams` are Promises in server components, must be `await`ed. Server components that read dynamic data (e.g. `new Date()`) need `await connection()` from `next/server` or `export const instant = false` to opt out of static generation. See `app/admin/subscriptions/page.tsx` for the established pattern.

---

## Design Tokens

### Traveler platform (`--tp-*`)
| Token | Value | Use |
|-------|-------|-----|
| `--tp-bg` | `#faf9f7` | Page background |
| `--tp-surface` | `#ffffff` | Cards |
| `--tp-primary` | `#1a1a1a` | Headings, primary text |
| `--tp-secondary` | `#6b6560` | Muted text |
| `--tp-accent` | `#3d6b4f` | CTA green |
| `--tp-accent-light` | `#e8f0eb` | Light accent tint |
| `--tp-border` | `#e8e4df` | Card borders |
| `--tp-muted` | `#f5f3f0` | Chips, badges |
| `--tp-gold` | `#b5935a` | Star ratings |

### Admin platform (`--ad-*`)
| Token | Value | Use |
|-------|-------|-----|
| `--ad-bg` | `#f4f6f9` | Page background |
| `--ad-surface` | `#ffffff` | Cards |
| `--ad-primary` | `#1a1d2e` | Headings |
| `--ad-secondary` | `#6b7280` | Muted text |
| `--ad-accent` | `#2563eb` | Blue CTA |
| `--ad-border` | `#e5e7eb` | Borders |
| `--ad-muted` | `#f9fafb` | Table headers |
| `--ad-danger` | `#dc2626` | Destructive |
| `--ad-warning` | `#d97706` | Pending/caution |
| `--ad-success` | `#16a34a` | Active/confirmed |

---

## Import Paths

| Symbol | Import path |
|--------|-------------|
| `TravelerNav` | `'../components/TravelerNav'` (from `app/profile/`) or `'../../components/TravelerNav'` (from `app/reviews/new/`) |
| `Footer` | `'../components/Footer'` / `'../../components/Footer'` |
| `MOCK_TRAVELER_BOOKINGS`, `TravelerBooking` | `'../bookings/mock'` (from `app/reviews/new/`) or adjust as needed |
| `ADMIN_BOOKINGS`, `ADMIN_HOTELS`, etc. | `'../mock'` (all admin pages are siblings of `app/admin/mock.ts`) |
| `connection` | `'next/server'` |

---

## Sidebar Verification

The `AdminSidebar.tsx` already contains all required nav links:

- **PLATFORM**: Overview, Hotels, Hotel Verification, Bookings, Users
- **FINANCE**: Subscriptions, Payments (`/admin/payments`), Payouts (`/admin/payouts`)
- **CONTENT**: Reviews (`/admin/reviews`), Cities (`/admin/cities`)
- **SYSTEM**: Reports (`/admin/reports`), Audit Logs (`/admin/audit`), System

**No changes required to `AdminSidebar.tsx`.**

---

## Files to Create / Modify

| # | File | Type | Status |
|---|------|------|--------|
| 1 | `app/profile/page.tsx` | Traveler page, `'use client'` | Create |
| 2 | `app/reviews/new/page.tsx` | Traveler page, `'use client'` | Create |
| 3 | `app/bookings/page.tsx` | Traveler page, `'use client'` | Modify |
| 4 | `app/admin/payments/page.tsx` | Admin server component | Create |
| 5 | `app/admin/payouts/page.tsx` | Admin server component | Create |
| 6 | `app/admin/reviews/page.tsx` | Admin server component | Create |
| 7 | `app/admin/cities/page.tsx` | Admin server component | Create |
| 8 | `app/admin/reports/page.tsx` | Admin server component | Create |
| 9 | `app/admin/audit/page.tsx` | Admin server component | Create |
| 10 | `app/admin/components/AdminSidebar.tsx` | Verify only | No change |

---

## Implementation Plan

- [ ] 1. Create `app/profile/page.tsx` — Traveler Profile page.
      A `'use client'` component. Renders under `TravelerNav` + `Footer` using `--tp-*` tokens. Shows a two-section layout: (a) a profile card with avatar initials, display name, email, member-since date, and an "Edit profile" button stub; (b) a stats strip showing total bookings, nights stayed, and total spent derived from `MOCK_TRAVELER_BOOKINGS`. Follows the same page shell as `app/bookings/page.tsx`: fixed-nav spacer, `max-w-4xl` centred container, breadcrumb, `<main>`, then `<Footer />`.
      Files: `app/profile/page.tsx`
      Imports: `'use client'`, `React`, `Link` from `next/link`, `TravelerNav` from `'../components/TravelerNav'`, `Footer` from `'../components/Footer'`, `MOCK_TRAVELER_BOOKINGS` from `'../bookings/mock'`
      Verify: `npm run build` — zero TypeScript/build errors.

- [ ] 2. Create `app/reviews/new/page.tsx` — Leave a Review page.
      A `'use client'` component. Reads `hotelId`, `hotelName`, `bookingId` from `useSearchParams()`. Renders under `TravelerNav` + `Footer`. The form contains: (a) a star-rating widget (1–5 interactive stars using `--tp-gold`); (b) a title `<input>`; (c) a body `<textarea>`; (d) five category sliders (Cleanliness, Location, Service, Value, Facilities) each 1–5; (e) a Submit button with `--tp-accent` background. On submit, show an inline success banner ("Review submitted — thank you!") and a "Back to My Bookings" link. No network call — purely mock state. Uses `useSearchParams()` which requires wrapping in `<Suspense>` boundary per Next.js 16 rules: export a default that wraps the inner component in `<Suspense fallback={<div>Loading…</div>}>`.
      Files: `app/reviews/new/page.tsx`
      Imports: `'use client'`, `React`, `useState`, `useSearchParams` from `next/navigation`, `Suspense` from `react`, `Link`, `TravelerNav` from `'../../components/TravelerNav'`, `Footer` from `'../../components/Footer'`
      Verify: `npm run build` — zero TypeScript/build errors.

- [ ] 3. Modify `app/bookings/page.tsx` — Fix "Leave a review" + add reviewed toast.
      Two changes to the existing `BookingCard` component:
      (a) The "Leave a review" `<button>` for `completed` bookings should become a `<Link>` pointing to `/reviews/new?bookingId=${booking.id}&hotelId=${booking.hotelId}&hotelName=${encodeURIComponent(booking.hotelName)}`. Keep the same visual style (`border: '1px solid var(--tp-accent)'`, `color: 'var(--tp-accent)'`).
      (b) Add a `reviewed` boolean state (per-booking, keyed by `booking.id`) to the `BookingsPage` component. After a booking is marked reviewed (simulated via a callback from `BookingCard` — not needed here since navigation happens; instead, read `?reviewed=<bookingId>` from `useSearchParams()` on mount and show a dismissible green toast banner at the top of the page: "Your review for [Hotel Name] has been submitted. Thank you!"). Use `useSearchParams()` + `useEffect` to detect the param. Wrap `useSearchParams()` calls in a child component inside `<Suspense>` to satisfy Next.js 16 requirements.
      Files: `app/bookings/page.tsx`
      Imports: Add `useSearchParams`, `Suspense` from `react` (already imported), `useEffect` to existing imports.
      Verify: `npm run build` — zero TypeScript/build errors.

- [ ] 4. Create `app/admin/payments/page.tsx` — Payments page (server component).
      Server component following the exact pattern of `app/admin/subscriptions/page.tsx`: `export const instant = false`, `await connection()`, no `'use client'`. Shows: (a) three stat cards — Total Collected (sum of all `totalNgn` from non-cancelled `ADMIN_BOOKINGS`), Platform Commission (sum of `commissionNgn`), Pending Payouts (placeholder ₦0); (b) a full table of `ADMIN_BOOKINGS` with columns: Booking ID, Hotel, Guest, Date, Amount, Commission, Status. Reuse the `statusBadge` helper pattern from `app/admin/overview/page.tsx`. Use `--ad-*` tokens throughout. The `fmtNgn` helper: `if n >= 1_000_000 return '₦' + (n/1_000_000).toFixed(1) + 'm'` else `'₦' + n.toLocaleString()`.
      Files: `app/admin/payments/page.tsx`
      Imports: `React`, `{ connection }` from `'next/server'`, `{ ADMIN_BOOKINGS }` from `'../mock'`, `type { AdminBooking }` from `'../mock'`
      Verify: `npm run build` — zero TypeScript/build errors.

- [ ] 5. Create `app/admin/payouts/page.tsx` — Payouts page (server component).
      Same boilerplate as payments. Shows: (a) three stat cards — Total Payouts Due (sum of `totalNgn - commissionNgn` for `checked_out` bookings), Hotels Awaiting Payout (count of distinct hotel names in `checked_out` bookings), Already Paid Out (placeholder ₦0); (b) a table showing one row per distinct hotel in `checked_out` bookings with columns: Hotel Name, Completed Bookings, Gross Revenue, Commission, Net Payout, Status (badge "Pending" for all rows). Group by `hotelName` using `Array.reduce` over `ADMIN_BOOKINGS.filter(b => b.status === 'checked_out')`.
      Files: `app/admin/payouts/page.tsx`
      Imports: `React`, `{ connection }` from `'next/server'`, `{ ADMIN_BOOKINGS }` from `'../mock'`
      Verify: `npm run build` — zero TypeScript/build errors.

- [ ] 6. Create `app/admin/reviews/page.tsx` — Reviews moderation page (server component).
      Same boilerplate. Data source: import `HOTEL_REVIEWS` from `'../../hotels/mock'` and flatten into a list of `{ hotelId, hotelName, review }` objects. Import `HOTEL_DETAILS` (or use `SEARCH_MOCK_HOTELS` from `'../../search/mock'` for hotel names). Shows: (a) two stat cards — Total Reviews (count of all review objects), Average Rating (mean of all `review.rating`, formatted to 1 decimal); (b) a table with columns: Guest, Hotel, Rating (★ stars inline), Date, Title, Excerpt (first 80 chars of `body`), Status (badge "Published" for all). Use `HOTEL_REVIEWS` record where keys are hotel IDs; map keys to hotel names via `SEARCH_MOCK_HOTELS.find(h => h.id === key)?.name`. Truncate body with `body.slice(0, 80) + (body.length > 80 ? '…' : '')`.
      Files: `app/admin/reviews/page.tsx`
      Imports: `React`, `{ connection }` from `'next/server'`, `{ HOTEL_REVIEWS }` from `'../../hotels/mock'`, `type { HotelReview }` from `'../../hotels/mock'`, `{ SEARCH_MOCK_HOTELS }` from `'../../search/mock'`
      Verify: `npm run build` — zero TypeScript/build errors.

- [ ] 7. Create `app/admin/cities/page.tsx` — Cities management page (server component).
      Same boilerplate. Derives city data from `ADMIN_HOTELS`: group hotels by `city`/`state`, count active hotels, sum bookings, sum revenue. Shows: (a) one stat card — Active Cities (count of distinct cities with at least one active hotel); (b) a table with columns: City, State, Active Hotels, Total Bookings, Total Revenue, Actions (stub "View" button). Sort rows by Total Bookings descending.
      Files: `app/admin/cities/page.tsx`
      Imports: `React`, `{ connection }` from `'next/server'`, `{ ADMIN_HOTELS }` from `'../mock'`
      Verify: `npm run build` — zero TypeScript/build errors.

- [ ] 8. Create `app/admin/reports/page.tsx` — Reports page (server component).
      Same boilerplate. Shows: (a) four stat cards — Total GMV, Platform Revenue, Active Hotels, Total Travelers (from `PLATFORM_STATS`); (b) an SVG bar chart of revenue by city — group `checked_out` bookings by `hotelName` prefix isn't possible, so group `ADMIN_HOTELS` by city and sum their `totalRevenueNgn`, render as an SVG bar chart following the exact pattern in `app/admin/overview/page.tsx` (viewBox, rect, text); (c) a breakdown table with columns: City, Hotels, Total Bookings, GMV, Commission, Net Payout. Derive all data from `ADMIN_HOTELS` and `ADMIN_BOOKINGS`.
      Files: `app/admin/reports/page.tsx`
      Imports: `React`, `{ connection }` from `'next/server'`, `{ ADMIN_HOTELS, ADMIN_BOOKINGS, PLATFORM_STATS }` from `'../mock'`
      Verify: `npm run build` — zero TypeScript/build errors.

- [ ] 9. Create `app/admin/audit/page.tsx` — Audit Logs page (server component).
      Same boilerplate. Since there is no real audit log data source, generate a deterministic in-file mock array `AUDIT_LOGS` (defined at the top of the file as a `const`, not imported). Each entry: `{ id, timestamp, actor, action, target, ip }`. Include ~15 entries covering actions like "Hotel approved", "Subscription cancelled", "Booking confirmed", "User suspended", "Review removed" — with actor "Super Admin" or "System". Shows: (a) two stat cards — Total Events (15), Events Today (count where timestamp matches today's ISO date prefix — always 0 since dates are hardcoded, so show a static "3"); (b) a table with columns: Timestamp, Actor, Action, Target, IP Address. Rows ordered newest first. No `connection()` needed since all data is static (can omit `await connection()` since no `new Date()` is called — or use `export const instant = false` for safety).
      Files: `app/admin/audit/page.tsx`
      Imports: `React` — no external data imports needed.
      Verify: `npm run build` — zero TypeScript/build errors.

---

## Risks & Special Considerations

### `'use client'` placement
- `app/profile/page.tsx` and `app/reviews/new/page.tsx` use `useState`/`useSearchParams` → must have `'use client'` as the very first line.
- `app/bookings/page.tsx` already has `'use client'`.
- All new admin pages are server components → no `'use client'` directive.

### `useSearchParams()` in Next.js 16
`useSearchParams()` must be called inside a component that is wrapped in `<Suspense>`. Pattern to follow:
```tsx
'use client';
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function InnerPage() {
  const params = useSearchParams();
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <InnerPage />
    </Suspense>
  );
}
```
This applies to `app/reviews/new/page.tsx` and the `useSearchParams` addition in `app/bookings/page.tsx`.

### `connection()` for server components with dynamic data
Server components that call `new Date()` or otherwise must not be statically rendered must either:
- `import { connection } from 'next/server'; await connection();` at the top of the page function, OR
- `export const instant = false;`

`app/admin/subscriptions/page.tsx` uses both. For consistency, all new admin pages should use `export const instant = false` plus `await connection()` if they contain any date-derived computation.

`app/admin/audit/page.tsx` has hardcoded dates and no dynamic computation — use `export const instant = false` only (skip `connection()` since no `await` is needed in a sync-looking component; or keep it for consistency).

### `HOTEL_REVIEWS` import in `app/admin/reviews/page.tsx`
`../../hotels/mock` is two levels up from `app/admin/reviews/`. Verify relative depth:
- File is at: `app/admin/reviews/page.tsx`
- Target is: `app/hotels/mock.ts`
- Relative path: `../../hotels/mock` ✓

### Admin layout wrapping
All files under `app/admin/*/page.tsx` are automatically wrapped by `app/admin/layout.tsx` → `AdminSidebarWrapper` → renders `AdminSidebar` + `AdminTopbar`. No manual layout import is needed in any admin page.

### Traveler layout
`app/profile/` and `app/reviews/new/` do not have a layout file. Each page must manually render `<TravelerNav />` and `<Footer />` and include a `<div style={{ paddingTop: '64px' }} />` spacer after the nav (same as `app/bookings/page.tsx`).

### No test framework
Verification is `npm run build` (TypeScript compilation + Next.js static analysis). A passing build with zero errors is the acceptance criterion for all items.
