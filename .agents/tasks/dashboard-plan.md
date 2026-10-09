# Implementation Plan — Hotel OS Dashboard

> This plan is also decomposed into FEAT artifacts under `.agents/tasks/dashboard-hotel-os/`.
> The workflow tail has been replaced with per-FEAT coder steps + a convergence loop.

## Next.js 16.4 Breaking Changes That Affect Dashboard Code

1. **`params` is a Promise** — any layout or page that reads dynamic route params must `await params` (async server component) or `use(params)` (client component). No synchronous `params.something` access.
2. **`searchParams` is a Promise** — same rule; access via `await searchParams` or `use(searchParams)`.
3. **`LayoutProps<'/path'>` helper** — the root layout already uses this. Dashboard sub-layouts should use `{ children: React.ReactNode }` inline (no dynamic segments) following the pattern in `app/onboarding/layout.tsx`.
4. **`cacheComponents: true` is on** — `loading.tsx` in layouts won't show for uncached layout data; wrap any runtime data reads in `<Suspense>`. For mock-data pages this is irrelevant but worth noting.
5. **No `useSearchParams` without Suspense** — any client component using `useSearchParams` must be wrapped in `<Suspense>` at its call site or in the page.

---

## CSS Token Additions (`--db-*` prefix)

Add to `app/globals.css` inside `:root`:

```css
/* Dashboard design tokens */
--db-sidebar-bg:   #111110;   /* near-black sidebar              */
--db-sidebar-text: #a8a29e;   /* stone-400 nav text              */
--db-sidebar-active: #ffffff; /* active nav item text            */
--db-sidebar-w:    240px;     /* sidebar width (desktop)         */
--db-topbar-h:     56px;      /* topbar height                   */
--db-surface:      #ffffff;   /* card / panel surface            */
--db-bg:           #f5f4f2;   /* warm off-white page bg          */
--db-primary:      #1a1a1a;   /* headings + primary text         */
--db-secondary:    #6b6560;   /* secondary / muted text          */
--db-accent:       #3d6b4f;   /* same earthy green as onboarding */
--db-border:       #e8e4df;   /* warm subtle border              */
--db-muted:        #f1ede8;   /* muted surface (chips, pills)    */
--db-danger:       #dc2626;   /* destructive actions             */
--db-warning:      #d97706;   /* caution / pending states        */
--db-success:      #16a34a;   /* confirmed / active states       */
```

---

## TypeScript Types for Mock Data

All types go in `app/dashboard/types/index.ts`.

```ts
// ── Shared ────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending' | 'confirmed' | 'checked_in'
  | 'checked_out' | 'cancelled' | 'no_show';

export type StaffRole = 'owner' | 'manager' | 'receptionist' | 'staff';

// ── Mock Hotel ─────────────────────────────────────────────────────────────────

export type Hotel = {
  id: string;
  name: string;
  city: string;
  state: string;
  subscription: 'starter' | 'professional' | 'enterprise';
  occupancyPercent: number;         // 0–100
};

// ── Reservations ──────────────────────────────────────────────────────────────

export type Reservation = {
  id: string;             // e.g. "HOS-82931"
  guestName: string;
  guestEmail: string;
  roomTypeName: string;
  roomNumber: string;
  checkIn: string;        // ISO date "2024-10-12"
  checkOut: string;       // ISO date "2024-10-15"
  nights: number;
  amountNgn: number;      // e.g. 255000
  status: BookingStatus;
  createdAt: string;      // ISO datetime
};

// ── Room Management ───────────────────────────────────────────────────────────

export type RoomType = {
  id: string;
  name: string;
  totalRooms: number;
  availableRooms: number;
  pricePerNight: number;
  bedType: string;
  capacity: number;
  imageUrl?: string;
};

// ── Inventory Calendar ────────────────────────────────────────────────────────

export type InventoryDay = {
  date: string;           // "2024-10-12"
  available: number;
  held: number;
  booked: number;
};

export type RoomInventory = {
  roomTypeId: string;
  roomTypeName: string;
  days: InventoryDay[];   // 30 days of data
};

// ── Staff ─────────────────────────────────────────────────────────────────────

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: 'active' | 'inactive';
  lastActive: string;     // ISO datetime or "Never"
  avatarInitials: string; // e.g. "OA"
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export type RevenueDay = {
  date: string;           // "2024-10-01"
  revenueNgn: number;
  bookings: number;
  occupancyPercent: number;
};

// ── Payout ────────────────────────────────────────────────────────────────────

export type PayoutTransaction = {
  id: string;
  bookingId: string;
  guestName: string;
  date: string;           // ISO date
  grossNgn: number;
  commissionNgn: number;
  netNgn: number;
  status: 'settled' | 'pending' | 'processing';
};
```

---

## File Creation Order (dependency-ordered)

### FEAT-001 — Foundation (tokens, types, layout, shared components)

1. `app/globals.css` — add `--db-*` tokens
2. `app/dashboard/types/index.ts` — all types above
3. `app/dashboard/mock/data.ts` — realistic mock arrays for all types
4. `app/dashboard/components/DashboardSidebar.tsx` — collapsible sidebar with nav items
5. `app/dashboard/components/DashboardTopbar.tsx` — hotel name, user avatar, notification bell
6. `app/dashboard/components/StatusBadge.tsx` — `BookingStatus` → styled pill
7. `app/dashboard/components/StatCard.tsx` — metric card (label + value + optional delta)
8. `app/dashboard/layout.tsx` — `{ children: React.ReactNode }`, mounts sidebar + topbar
9. `app/dashboard/page.tsx` — redirect to `/dashboard/overview`

### FEAT-002 — Overview + Reservations + Rooms

10. `app/dashboard/overview/page.tsx` — greeting, 5 stat cards, revenue sparkline placeholder, upcoming reservations mini-table
11. `app/dashboard/reservations/page.tsx` — filterable/searchable table with status badges + action buttons
12. `app/dashboard/reservations/[id]/page.tsx` — reservation detail: guest info, timeline, actions
13. `app/dashboard/rooms/page.tsx` — room type cards grid, availability pills
14. `app/dashboard/rooms/[id]/page.tsx` — room type detail: photos placeholder, config summary

### FEAT-003 — Staff + Inventory + Analytics + Remaining Pages

15. `app/dashboard/staff/page.tsx` — table with role badges, invite button, deactivate action
16. `app/dashboard/inventory/page.tsx` — 30-day calendar grid (rows = room types, cols = dates), color-coded availability cells
17. `app/dashboard/analytics/page.tsx` — occupancy/revenue/bookings summary cards + inline sparkline charts (pure CSS / SVG, no chart lib)
18. `app/dashboard/subscription/page.tsx` — current plan card, upgrade CTAs, billing history table
19. `app/dashboard/payouts/page.tsx` — available/pending/settled balances, transaction table
20. `app/dashboard/profile/page.tsx` — hotel info display, edit link placeholder
21. `app/dashboard/guests/page.tsx` — unique guest list derived from reservations mock data

---

## Build Verification Steps

After each FEAT the coder must run:

```powershell
cd c:\Users\Pkaka\Music\hotel-os
npx next build 2>&1
```

Expected: `✓ Compiled successfully` — zero TypeScript errors, all routes listed in the build output.

Additionally after FEAT-001 (layout is wired):

```powershell
npx next build 2>&1 | Select-String "dashboard"
```

Expected: `/dashboard`, `/dashboard/overview` appear in the route list.

There are no automated tests in this project (`package.json` has no test script). Build success + zero TypeScript errors is the verification gate.
