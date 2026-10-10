# Implementation Plan — 5 New Dashboard Pages + Sidebar Update

## Context

- **Project**: Hotel OS, Next.js 16.4 App Router, React 19, Tailwind CSS 4, TypeScript
- **Build**: `npm run build` / `npm run dev`
- **Lint**: `npm run lint`
- **No external UI libraries** — inline SVGs, pure CSS, `--db-*` design tokens only
- **Token names in use**: `--db-surface`, `--db-bg`, `--db-primary`, `--db-secondary`, `--db-accent`, `--db-border`, `--db-muted`, `--db-danger`, `--db-warning`, `--db-success`, `--db-sidebar-bg`, `--db-sidebar-text`, `--db-sidebar-active`, `--db-sidebar-w`
- **Existing reusable components**: `StatCard` (`app/dashboard/components/StatCard.tsx`), `StatusBadge` (`app/dashboard/components/StatusBadge.tsx`)
- **Mock data available**: `MOCK_HOTEL`, `MOCK_ROOM_TYPES`, `MOCK_RESERVATIONS`, `MOCK_STAFF`, `MOCK_REVENUE_DAYS`, `MOCK_PAYOUTS` — all from `app/dashboard/mock/data.ts`
- **Existing types**: `Hotel`, `RoomType`, `Reservation`, `StaffMember`, `RevenueDay`, `PayoutTransaction`, `BookingStatus` — all from `app/dashboard/types/index.ts`
- **Page patterns**: server components use `async function Page()` + `await connection()` for dynamic rendering (see `overview/page.tsx`); client components open with `'use client'` (see `reservations/page.tsx`)
- **Sidebar pattern**: add new `NavItem` entries to the `NAV_ITEMS` array in `DashboardSidebar.tsx`; icons are 18×18 stroke-based inline SVGs with `aria-hidden="true"`

---

## Files to read before implementing each item

| Item | Files to read |
|------|--------------|
| All | `app/dashboard/mock/data.ts`, `app/dashboard/types/index.ts`, `app/dashboard/components/StatCard.tsx`, `app/globals.css` |
| Rates | `app/dashboard/reservations/page.tsx` (tab + table pattern), `app/dashboard/rooms/page.tsx` (room type context) |
| Promotions | `app/dashboard/reservations/page.tsx` (status toggle pattern) |
| Integrations, Listing Preview | `app/dashboard/overview/page.tsx` (server component pattern) |
| Settings | `app/dashboard/profile/page.tsx` (section/card pattern), `app/dashboard/staff/page.tsx` (form pattern) |
| Sidebar | `app/dashboard/components/DashboardSidebar.tsx` |

---

## Implementation Plan

- [ ] 1. Add mock data for the three new domains (Rates, Promotions, Integrations) to `app/dashboard/mock/data.ts`.

  **Rates** — add `MOCK_RATE_SEASONS` array (3 seasons: Standard, Peak, Low — each with a `id`, `label`, `startDate`, `endDate`) and `MOCK_SEASON_RATES` array (one record per `{ seasonId, roomTypeId, roomTypeName, pricePerNight, weekendSurchargePercent, minNights }`). Derive the 12 records by crossing 3 seasons × 4 room types from `MOCK_ROOM_TYPES`.

  **Promotions** — add `MOCK_PROMOTIONS` array (6 entries), each with `{ id, name, code, discountType: 'percent'|'flat', discountValue, startDate, endDate, active: boolean, usageCount, maxUsage }`.

  **Integrations** — add `MOCK_INTEGRATIONS_CONNECTED` array (3 entries: "Booking.com Channel Manager", "Flutterwave Payments", "Google Analytics") each with `{ id, name, category, connectedAt, status: 'active'|'error' }`. Add `MOCK_INTEGRATIONS_AVAILABLE` array (6 entries covering OTA, POS, accounting, etc.) each with `{ id, name, category, description, logoInitials }`.

  **Types to add inline in `app/dashboard/types/index.ts`**:
  ```ts
  export type RateSeason = { id: string; label: string; startDate: string; endDate: string; };
  export type SeasonRate = { seasonId: string; roomTypeId: string; roomTypeName: string; pricePerNight: number; weekendSurchargePercent: number; minNights: number; };
  export type Promotion = { id: string; name: string; code: string; discountType: 'percent'|'flat'; discountValue: number; startDate: string; endDate: string; active: boolean; usageCount: number; maxUsage: number; };
  export type Integration = { id: string; name: string; category: string; connectedAt?: string; status?: 'active'|'error'; description?: string; logoInitials: string; };
  ```

  Files: `app/dashboard/mock/data.ts`, `app/dashboard/types/index.ts`

  Verify: `npm run build` — no TypeScript errors. Confirm the new exports compile cleanly.

---

- [ ] 2. Build `app/dashboard/rates/page.tsx` — Rates Management (`'use client'`).

  **Layout**:
  - Page header: "Rates Management" h1.
  - Season tab row: renders one pill-button per season from `MOCK_RATE_SEASONS`; active tab uses `--db-accent` background; tab switching filters the rate rows below.
  - Rate table: columns — Room Type | Base Rate (₦/night) | Weekend Surcharge (%) | Min Nights | Actions. Each row shows the values for `MOCK_SEASON_RATES` filtered by active season. The "Edit" action switches that row into inline-edit mode: the three numeric cells become `<input type="number">` fields styled with `--db-border` border; a "Save" button (accent) and "Cancel" button revert to read mode.
  - Bulk Update section below the table: a card with a "Apply to all room types" subheading, one `<input type="number">` for a percentage uplift, and an "Apply Uplift" button that updates all rates in local state.

  **State**: `activeSeasonId`, `editingRowKey` (composite `seasonId+roomTypeId`), `draftRates` (copy of `MOCK_SEASON_RATES` for local edits), `bulkUplift` string.

  **Types**: use `RateSeason` and `SeasonRate` from `app/dashboard/types/index.ts`. No new types needed.

  **Helpers**: `formatNgn(amount)` (same as in reservations page).

  Files: `app/dashboard/rates/page.tsx`

  Verify: `npm run build` — page compiles with no errors.

---

- [ ] 3. Build `app/dashboard/promotions/page.tsx` — Promotions (`'use client'`).

  **Layout**:
  - Page header: "Promotions" h1 + count badge (same pattern as reservations page).
  - Promotions list: one card per promotion from `MOCK_PROMOTIONS`. Each card shows: name, discount label (e.g. "20% off" or "₦5,000 off"), promo code in a monospace pill, date range, usage bar (`usageCount / maxUsage`), and a toggle switch (pure CSS — a `<button role="switch" aria-checked={active}>` with a sliding thumb via inline styles using `--db-accent` when active, `--db-border` when inactive). Toggling flips `active` in local state.
  - Create Promotion form: a collapsible panel (toggled by a "+ New Promotion" button). Fields: Name (text), Code (text, uppercase), Discount Type (two pill-buttons: "Percent" / "Flat ₦"), Discount Value (number), Start Date (date), End Date (date), Max Uses (number). A "Create" button adds the entry to local state and collapses the form. A "Cancel" button collapses without saving.

  **State**: `promotions` (copy of `MOCK_PROMOTIONS` for toggles + adds), `formOpen`, form field states.

  Files: `app/dashboard/promotions/page.tsx`

  Verify: `npm run build` — page compiles with no errors.

---

- [ ] 4. Build `app/dashboard/integrations/page.tsx` — Integrations (server component, no `'use client'`).

  **Layout** (top to bottom):
  1. **Hero banner**: full-width card with `--db-accent` left border (4px), title "Connect Your Hotel Stack", subtitle "Link the tools you already use — channel managers, payment processors, analytics, and more."
  2. **Connected Systems** section: `<h2>` + grid of cards from `MOCK_INTEGRATIONS_CONNECTED`. Each card: logo initials circle (`--db-accent` background), name, category, "Connected" date, status badge (green dot + "Active" or red + "Error").
  3. **Available Integrations** grid: `<h2>` + 2-column grid of cards from `MOCK_INTEGRATIONS_AVAILABLE`. Each card: logo initials, name, category chip, description, "Connect" button (outline style, `--db-accent` color).
  4. **How It Works** section: 3-step numbered list (Authorize → Map your rooms → Go live) using inline SVG number circles.
  5. **API Access** card: monospace-styled placeholder API key (`sk_live_••••••••••••`), "Copy Key" button (visually-only since server component — renders as `<button>` but no onClick; note in comment that a client wrapper would be needed for real copy), link to "View API Docs".

  Files: `app/dashboard/integrations/page.tsx`

  Verify: `npm run build` — page compiles with no errors.

---

- [ ] 5. Build `app/dashboard/settings/page.tsx` — Settings (`'use client'`).

  **Layout**: page header "Settings" + four tabs: General | Notifications | Security | Billing. Active tab uses `--db-accent` bottom border (2px) and `--db-primary` text; inactive uses `--db-secondary`. Each tab renders its own panel:

  **General tab**:
  - Hotel details form: Hotel Name, City/State, Phone, Email, Website, Check-in Time, Check-out Time — all `<input>` fields pre-populated from `MOCK_HOTEL`. "Save Changes" button (accent).
  - Currency & locale row: static display (Nigerian Naira ₦, en-NG locale) with note "Contact support to change".

  **Notifications tab**:
  - List of 6 toggle rows: New Booking, Check-in Reminder, Check-out Reminder, Complaint Filed, Low Inventory Alert, Payout Processed — each row has a label, sub-label, and a CSS toggle switch (same pattern as Promotions page). State initialised to sensible defaults (first 4 on, last 2 on).

  **Security tab**:
  - Change Password section: Current Password, New Password, Confirm New Password inputs (type="password"). "Update Password" button.
  - Two-Factor Authentication row: status badge ("Not enabled"), "Enable 2FA" button.
  - Active Sessions section: static list of 2 mock sessions (current device, mobile) with "Revoke" button on the second.

  **Billing tab**:
  - Current plan card: shows `MOCK_HOTEL.subscription` ("Professional"), renewal date, "Upgrade Plan" button.
  - Payment method row: last-4 card number placeholder, "Update Card" button.
  - Billing history table (3 static rows): Date | Description | Amount | Status — same table styling as reservations page.

  **State**: `activeTab`, notification toggles (`Record<string, boolean>`), password form fields.

  Files: `app/dashboard/settings/page.tsx`

  Verify: `npm run build` — page compiles with no errors.

---

- [ ] 6. Build `app/dashboard/listing-preview/page.tsx` — Hotel Listing Preview (server component).

  This is a read-only replica of how the hotel appears on the traveler-facing platform. All data comes from `MOCK_HOTEL` and `MOCK_ROOM_TYPES`.

  **Layout** (top to bottom):
  1. **Preview Banner**: full-width amber/warning-toned strip (`--db-warning` background at 10% opacity, `--db-warning` border) with eye icon and text "This is a preview of how your listing appears to guests. Changes are made on the Hotel Profile page." Include a "Go to Profile" `<Link>`.
  2. **Hero section**: hotel name as large heading, city/state sub-line, star rating row (5 filled SVG stars, `--tp-gold` color from globals.css), "Professional" plan badge.
  3. **Room Types grid**: 2-column grid. Each card uses `--db-surface` background, shows room type name, bed type, capacity (person icon + number), price per night in ₦, and availability pill (same logic as overview page: Good/Limited/Low). Cards are read-only (no buttons).
  4. **Amenities section**: static list of 8 mock amenities (Free Wi-Fi, Pool, Gym, Restaurant, Room Service, Parking, 24h Front Desk, Airport Shuttle) rendered as a 2×4 grid of icon+label chips using `--db-muted` background.
  5. **Location section**: hotel address line, a static grey placeholder map-box (200px tall, `--db-muted` background, centered "Map preview not available" text + location pin SVG).
  6. **Policies section**: 2-column grid of policy cards (Check-in: 2:00 PM, Check-out: 12:00 PM, Cancellation: 24h before, Pets: Not allowed).

  Files: `app/dashboard/listing-preview/page.tsx`

  Verify: `npm run build` — page compiles with no errors.

---

- [ ] 7. Update `DashboardSidebar.tsx` — add 5 new nav items and their icons.

  **Add these inline SVG icon components** (18×18, `viewBox="0 0 24 24"`, stroke-based, `aria-hidden="true"`) before the `NAV_ITEMS` array:

  - `IconRates` — a price tag shape: `<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3"/>`
  - `IconPromotions` — a percent/discount badge: `<circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="15" r="1.5"/><path d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z"/><line x1="9.5" y1="14.5" x2="14.5" y2="9.5"/>`
  - `IconIntegrations` — a plug/connector: `<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>`
  - `IconSettings` — a gear: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>`
  - `IconListingPreview` — an eye: `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`

  **Add to `NAV_ITEMS`** (append after "Payouts"):
  ```ts
  { label: 'Rates',            href: '/dashboard/rates',            icon: <IconRates /> },
  { label: 'Promotions',       href: '/dashboard/promotions',       icon: <IconPromotions /> },
  { label: 'Integrations',     href: '/dashboard/integrations',     icon: <IconIntegrations /> },
  { label: 'Settings',         href: '/dashboard/settings',         icon: <IconSettings /> },
  { label: 'Listing Preview',  href: '/dashboard/listing-preview',  icon: <IconListingPreview /> },
  ```

  Files: `app/dashboard/components/DashboardSidebar.tsx`

  Verify: `npm run build` — no TypeScript/JSX errors. Navigate to `/dashboard/overview` in dev and confirm the 5 new items appear in the sidebar with correct active-state highlighting when their routes are visited.

---

## Dependency order

Items 1–6 can be written in any order but item 1 (mock data + types) must be complete before items 2 and 3 (which import `RateSeason`/`SeasonRate` and `Promotion` types). Items 4, 5, 6 have no inter-dependencies beyond the existing types. Item 7 (sidebar) is independent and can be done at any point.

Recommended order: **1 → 2 → 3 → 4 → 5 → 6 → 7**

## Coding conventions to follow

- Helpers like `formatNgn` should be defined locally in each page file (they are not shared via a util file in this project).
- Inline styles using `style={{ color: 'var(--db-...)' }}` for all token-based colours; Tailwind only for layout/spacing/sizing utilities.
- Tab components are not extracted into separate files — keep them as local functions or inline JSX inside the page, consistent with the existing pages.
- Server components should use `import { connection } from 'next/server'` + `await connection()` if they rely on `new Date()` at render time (see `overview/page.tsx`). The three server components in this plan (integrations, listing-preview) contain only static mock data, so `connection()` is not needed.
- `'use client'` must be the very first line (before imports) in client components.
