# Implementation Plan — Dashboard API Wiring

Workspace: `c:\Users\Pkaka\music\hotel-os`
Backend: `https://hotel-os-api-52qe.onrender.com` (via `NEXT_PUBLIC_API_URL`)

---

## Context & Key Findings

**Current state of the 4 pages and topbar:**
- `overview/page.tsx` — server async component using `connection()` from next/server; imports `MOCK_HOTEL`, `MOCK_RESERVATIONS`, `MOCK_REVENUE_DAYS`, `MOCK_ROOM_TYPES`
- `reservations/page.tsx` — `'use client'` with useState/useMemo; imports `MOCK_RESERVATIONS`
- `rooms/page.tsx` — plain server component (no directive, no state); imports `MOCK_ROOM_TYPES`
- `inventory/page.tsx` — `'use client'` with useState; imports `MOCK_INVENTORY`
- `DashboardTopbar.tsx` — `'use client'`; imports `MOCK_HOTEL` for hotel name and avatar initials

**Auth system:** `useAuth()` from `app/lib/auth-context.tsx` → `{ user: AuthUser | null, isLoading: boolean }`. Tokens in localStorage → server components cannot read them. Auth gate must be client-side.

**API client:** `apiClient` from `app/lib/api/client.ts` — handles Bearer token injection and 401/refresh automatically. All dashboard endpoints are protected; use `apiClient`, not raw `fetch`.

**Type conflict to resolve:** `BookingStatus` in `dashboard/types/index.ts` uses lowercase strings (`'pending'`, `'confirmed'`, etc.). `ApiBookingStatus` in `bookings.ts` uses UPPERCASE (`'CONFIRMED'`, `'CHECKED_IN'`, etc.). A normalizer function must map API values to dashboard values.

**Overview's revenue chart:** No revenue/analytics endpoint is being wired in this task. The bar chart will be replaced with a static placeholder panel ("Revenue chart coming soon") — the chart relies on `MOCK_REVENUE_DAYS` which has no API equivalent in scope.

---

## FEAT-001: Create app/lib/api/dashboard.ts

- [ ] 1. Create `app/lib/api/dashboard.ts` with all exported types and functions.
      Import `apiClient` from `./client` and `BookingStatus` from `../../dashboard/types`.
      Do NOT import `server-only` (functions are called from client components).
      Files: `app/lib/api/dashboard.ts`
      Verify: `npx next build` — exits 0, no TypeScript errors in this file.

### Types to export

```ts
// Maps to the authenticated hotel owner's hotel
export type DashboardHotel = {
  id: string;
  name: string;
  city: string;
  state: string;
  subscriptionPlan?: string;
  occupancyRate?: number;
};

// Matches dashboard/types Reservation shape exactly
export type DashboardReservation = {
  id: string;
  guestName: string;
  guestEmail: string;
  roomTypeName: string;
  roomNumber: string;
  checkIn: string;         // ISO date
  checkOut: string;        // ISO date
  nights: number;
  amountNgn: number;
  status: BookingStatus;   // lowercase — from dashboard/types
  createdAt: string;
};

// Matches dashboard/types RoomType exactly
export type DashboardRoomType = {
  id: string;
  name: string;
  totalRooms: number;
  availableRooms: number;
  pricePerNight: number;
  bedType: string;
  capacity: number;
  imageUrl?: string;
};

// Matches dashboard/types InventoryDay / RoomInventory exactly
export type DashboardInventoryDay = {
  date: string;
  available: number;
  held: number;
  booked: number;
};

export type DashboardRoomInventory = {
  roomTypeId: string;
  roomTypeName: string;
  days: DashboardInventoryDay[];
};

export type DashboardStats = {
  occupancyPercent: number;
  todayRevenueNgn: number;
  bookingsToday: number;
  upcomingCheckIns: number;
  upcomingCheckOuts: number;
};
```

### Functions to export

**`getMyHotel(): Promise<DashboardHotel | null>`**
- `GET /api/v1/hotels/my` via `apiClient.get<DashboardHotel>('/api/v1/hotels/my')`
- Catches all errors and returns `null` (caller shows error state)
- Decision rationale: the `AuthUser` type does not carry a `hotelId` field, so a dedicated "my hotel" endpoint is the only way to get the hotel ID needed by all other calls.

**`getDashboardReservations(hotelId: string): Promise<DashboardReservation[]>`**
- `GET /api/v1/hotels/:hotelId/bookings` via `apiClient.get`
- Response may be a plain array or `{ data: [...] }` wrapper — handle both
- Apply this status normalizer:

```ts
function normalizeStatus(apiStatus: string): BookingStatus {
  const map: Record<string, BookingStatus> = {
    HELD:            'pending',
    CONFIRMED:       'confirmed',
    CHECKED_IN:      'checked_in',
    CHECKED_OUT:     'checked_out',
    CANCELLED:       'cancelled',
    PAYMENT_PENDING: 'pending',
    NO_SHOW:         'no_show',
    PENDING:         'pending',
  };
  return map[apiStatus] ?? 'pending';
}
```

- Compute `nights` from `checkIn` and `checkOut`: `(new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000`
- Map `guestName` from `booking.user?.firstName + ' ' + booking.user?.lastName` (fallback `'Unknown Guest'`)
- Map `guestEmail` from `booking.user?.email` (fallback `''`)
- Map `roomTypeName` from `booking.room?.name` (fallback `'Room'`)
- Map `roomNumber` from `booking.roomNumber ?? booking.room?.number ?? '–'`
- Map `amountNgn` from `booking.totalAmount`

**`getDashboardRoomTypes(hotelId: string): Promise<DashboardRoomType[]>`**
- `GET /api/v1/hotels/:hotelId/rooms` via `apiClient.get`
- Response may be plain array or `{ rooms: [...] }` — handle both
- Map: `id`, `name`, `totalRooms` (or `quantity`), `availableRooms` (or `available`), `pricePerNight`, `bedType`, `capacity` (or `maxGuests`), `imageUrl`

**`getDashboardInventory(hotelId: string): Promise<DashboardRoomInventory[]>`**
- `GET /api/v1/hotels/:hotelId/inventory` via `apiClient.get`
- On any error (including 404 if endpoint not yet built), catch and return `[]`
- This prevents the inventory page from breaking if the backend endpoint is absent

**`getDashboardStats(hotelId: string): Promise<DashboardStats>`**
- Try `GET /api/v1/hotels/:hotelId/stats` first
- If that fails (404/500), derive from reservations:
  - Fetch reservations internally (re-use `getDashboardReservations`)
  - `upcomingCheckIns` = count where `status === 'confirmed'`
  - `upcomingCheckOuts` = count where `status === 'checked_in'`
  - `bookingsToday` = count where `createdAt` date === today
  - `todayRevenueNgn` = sum `amountNgn` where `checkOut` === today and status === `'checked_out'`
  - `occupancyPercent` = round((checked_in count / total reservations) * 100)
  - Return zeros for any field that cannot be computed
- Always returns a `DashboardStats` object — never throws

---

## FEAT-002: Wire dashboard pages and DashboardTopbar

Depends on FEAT-001 being committed first.

- [ ] 2. Wire `app/dashboard/overview/page.tsx` to real API data.
      Files: `app/dashboard/overview/page.tsx`
      Verify: `npx next build` exits 0; no TypeScript errors.

      **Changes:**
      - Add `'use client'` at top; remove `connection()` import and `export const instant = false`
      - Add imports: `useState`, `useEffect` from react; `useRouter` from next/navigation; `useAuth` from `../../lib/auth-context`; `getMyHotel`, `getDashboardStats`, `getDashboardReservations`, `getDashboardRoomTypes` from `../../lib/api/dashboard`
      - Remove all MOCK_* imports
      - Auth gate (see auth gate pattern below)
      - State: `hotel`, `stats`, `reservations`, `roomTypes`, `isLoading`, `error`
      - Fetch on mount (after auth confirmed): `getMyHotel()` then `Promise.all([getDashboardStats, getDashboardReservations, getDashboardRoomTypes])`
      - Replace `MOCK_HOTEL.name` → `hotel?.name ?? 'Your Hotel'` in greeting
      - Replace stat card values: occupancy from `stats.occupancyPercent`, revenue from `stats.todayRevenueNgn`, bookings from `stats.bookingsToday`, check-ins from `stats.upcomingCheckIns`, check-outs from `stats.upcomingCheckOuts`
      - Replace `upcomingReservations` filter: filter from `reservations` state array (same logic)
      - Replace `MOCK_ROOM_TYPES.map` → `roomTypes.map` in room availability section
      - Remove revenue bar chart section; replace with:
        ```tsx
        <div className="rounded-xl border p-5" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--db-primary)' }}>Revenue — Last 7 Days</h2>
          <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>Revenue analytics coming soon.</p>
        </div>
        ```
      - Show loading spinner while `isLoading` is true
      - Show error panel if `error` is set

- [ ] 3. Wire `app/dashboard/reservations/page.tsx` to real API data.
      Files: `app/dashboard/reservations/page.tsx`
      Verify: `npx next build` exits 0.

      **Changes:**
      - Add imports: `useEffect` (already has useState); `useRouter` from next/navigation; `useAuth` from `../../lib/auth-context`; `DashboardReservation, getMyHotel, getDashboardReservations` from `../../lib/api/dashboard`
      - Remove `MOCK_RESERVATIONS` import
      - Auth gate
      - Change `const filtered = useMemo(...)` to read from `reservations` state instead of `MOCK_RESERVATIONS`
      - Add `const [reservations, setReservations] = useState<DashboardReservation[]>([])`
      - Add `const [isLoading, setIsLoading] = useState(true)`
      - Add `const [error, setError] = useState<string | null>(null)`
      - Add useEffect to fetch data (after auth is confirmed)
      - Change the count badge from `MOCK_RESERVATIONS.length` → `reservations.length`
      - Show loading/error states
      - `DashboardReservation` has all the same fields as `Reservation` in dashboard/types, so no JSX changes needed — just replace the type annotation

- [ ] 4. Wire `app/dashboard/rooms/page.tsx` to real API data.
      Files: `app/dashboard/rooms/page.tsx`
      Verify: `npx next build` exits 0.

      **Changes:**
      - Add `'use client'` at top (convert from server to client component)
      - Add imports: `useState`, `useEffect` from react; `useRouter` from next/navigation; `useAuth` from `../../lib/auth-context`; `DashboardRoomType, getMyHotel, getDashboardRoomTypes` from `../../lib/api/dashboard`
      - Remove `MOCK_ROOM_TYPES` import
      - Auth gate
      - Add state: `roomTypes`, `isLoading`, `error`
      - useEffect to fetch on mount
      - Replace `MOCK_ROOM_TYPES.map` → `roomTypes.map` (no other JSX changes; field names match exactly)
      - Loading and error states

- [ ] 5. Wire `app/dashboard/inventory/page.tsx` to real API data.
      Files: `app/dashboard/inventory/page.tsx`
      Verify: `npx next build` exits 0.

      **Changes:**
      - Add imports: `useEffect` (already has useState); `useRouter` from next/navigation; `useAuth` from `../../lib/auth-context`; `DashboardRoomInventory, getMyHotel, getDashboardInventory` from `../../lib/api/dashboard`
      - Remove `MOCK_INVENTORY` import
      - Auth gate
      - Change `useState<RoomInventory[]>(MOCK_INVENTORY)` → `useState<DashboardRoomInventory[]>([])`  
        `DashboardRoomInventory` and `RoomInventory` from `dashboard/types` are structurally identical so both type annotations work; use `DashboardRoomInventory` for clarity
      - Add `isLoading` and `error` state
      - useEffect: fetch after auth is confirmed
      - Show loading and error states
      - The existing edit-cell / save logic does not change — it mutates local state only

- [ ] 6. Fix `app/dashboard/components/DashboardTopbar.tsx` to use auth user data.
      Files: `app/dashboard/components/DashboardTopbar.tsx`
      Verify: `npx next build` exits 0.

      **Changes:**
      - Add import: `useAuth` from `../../lib/auth-context`
      - Remove `MOCK_HOTEL` import from `../mock/data`
      - Add `const { user } = useAuth();` inside the component
      - Change hotel name chip: `MOCK_HOTEL.name` → `user ? `${user.firstName} ${user.lastName}` : 'Hotel OS'`
      - Change `title={MOCK_HOTEL.name}` → `title={user?.firstName ?? 'User'}`
      - Change initials computation:
        ```ts
        const initials = user
          ? (user.firstName[0] ?? '') + (user.lastName[0] ?? '')
          : 'HO';
        ```
      - Change aria-label: `aria-label={`User avatar: ${initials}`}`

---

## Auth Gate Pattern (apply to all 4 pages)

Apply this at the top of every client component's render body, after the hook declarations:

```tsx
const { user, isLoading: authLoading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!authLoading && !user) {
    router.replace('/auth/signin');
  }
}, [authLoading, user, router]);

if (authLoading) {
  return (
    <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>
      Loading…
    </div>
  );
}

if (!user) return null; // redirect in progress
```

Data-fetching useEffect should only run when `user` is confirmed (add `user` to the dependency array and guard with `if (!user) return;`).

---

## Type Conflicts Analysis

| Field | `dashboard/types/index.ts` | Backend API | Resolution |
|---|---|---|---|
| `BookingStatus` | lowercase: `'pending'`, `'confirmed'`, etc. | UPPERCASE: `'PENDING'`, `'CONFIRMED'`, etc. | `normalizeStatus()` in dashboard.ts |
| `Reservation.id` | `string` (e.g. `'HOS-10021'`) | `string` (UUID) | compatible — UUID renders fine |
| `Reservation.amountNgn` | `number` (NGN amount) | `totalAmount: number` | rename in mapper |
| `RoomType.totalRooms` | `number` | may be `quantity` | try both field names with fallback |
| `RoomType.availableRooms` | `number` | may be `available` | try both field names with fallback |
| `RoomType.capacity` | `number` | may be `maxGuests` | try both field names with fallback |
| `RoomInventory` | `{ roomTypeId, roomTypeName, days }` | unknown shape | catch-all with `[]` fallback |

`DashboardReservation`, `DashboardRoomType`, and `DashboardRoomInventory` in `dashboard.ts` use the dashboard/types field names, not the API field names. The mapper functions do the translation. No changes to `dashboard/types/index.ts` are needed — the existing types are kept as the canonical shapes.

---

## Build Verification

After completing both features:

```powershell
cd c:\Users\Pkaka\music\hotel-os
npx next build
```

Expected: exit code 0, all routes listed including `/dashboard/overview`, `/dashboard/reservations`, `/dashboard/rooms`, `/dashboard/inventory`.

Also confirm no mock imports remain in the changed files:

```powershell
Select-String -Path "app/dashboard/overview/page.tsx","app/dashboard/reservations/page.tsx","app/dashboard/rooms/page.tsx","app/dashboard/inventory/page.tsx","app/dashboard/components/DashboardTopbar.tsx" -Pattern "MOCK_"
```

Expected: no output (zero matches).
