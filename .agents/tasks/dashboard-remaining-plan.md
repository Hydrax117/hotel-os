# Implementation Plan — Wire Remaining Dashboard Pages to Real API

## Context

The first dashboard API wiring task already completed:
- `app/lib/api/dashboard.ts` — exports `getMyHotel`, `getDashboardReservations`, `getDashboardRoomTypes`, `getDashboardInventory`, `getDashboardStats`
- `app/dashboard/overview/page.tsx`, `reservations/page.tsx`, `rooms/page.tsx`, `inventory/page.tsx`, `DashboardTopbar.tsx` — all wired to real API

Remaining pages still import from `../mock/data`:
- `analytics/page.tsx` — uses `MOCK_REVENUE_DAYS`, `MOCK_RESERVATIONS`, `MOCK_ROOM_TYPES`
- `staff/page.tsx` — uses `MOCK_STAFF`
- `guests/page.tsx` — uses `MOCK_RESERVATIONS`
- `payouts/page.tsx` — uses `MOCK_PAYOUTS`
- `profile/page.tsx` — uses `MOCK_HOTEL`

**Key design decisions:**

1. **Analytics** — The backend has no dedicated revenue-by-day endpoint. Derive revenue trends from `getDashboardReservations` (sum `amountNgn` grouped by `checkOut` date for the last 30 days) and occupancy from `getDashboardStats`. Use `getDashboardRoomTypes` for the bookings-by-room-type bar chart (room names already on reservations). No new API endpoint needed.

2. **Staff** — The backend manages hotel staff at `GET /api/v1/hotels/:hotelId/staff`. Add `getHotelStaff`, `inviteStaffMember`, `updateStaffMember`, and `removeStaffMember` to `dashboard.ts`. Staff mutations use `POST`/`PATCH`/`DELETE`. The invite form POSTs to `POST /api/v1/hotels/:hotelId/staff`. Status toggle uses `PATCH /api/v1/hotels/:hotelId/staff/:staffId`. Remove uses `DELETE /api/v1/hotels/:hotelId/staff/:staffId`. All actions optimistically update UI and revert on error.

3. **Guests** — `DashboardReservation[]` already has all the fields needed to build the guest summary view (`guestName`, `guestEmail`, `amountNgn`, `checkOut`). Reuse `getDashboardReservations` — no new endpoint needed. The `buildGuestList` helper function is kept intact, just fed live data.

4. **Payouts** — The backend exposes `GET /api/v1/hotels/:hotelId/payouts`. Add `getHotelPayouts` to `dashboard.ts`. The `PayoutTransaction` type maps from the API response. `POST /api/v1/hotels/:hotelId/payouts/request` handles the "Request Payout" button. If the endpoint doesn't exist (404), fall back to deriving payout records from checked-out reservations applying a 5% platform fee.

5. **Profile** — The full hotel profile (address, contact, policies) comes from `GET /api/v1/hotels/:hotelId` (expanded). Add `getHotelProfile` to `dashboard.ts`. The Edit Profile button wires to `PATCH /api/v1/hotels/:hotelId`. Photos section remains a UI placeholder (no upload endpoint in scope). Profile page converts from a static server component to a client component.

6. **Auth gate** — All five pages are currently either static server components (analytics, profile, payouts) or `'use client'` without auth gating (staff, guests). All five will become `'use client'` with the same auth gate pattern used in `reservations/page.tsx`: `useAuth()` + `useRouter()` + redirect to `/auth/signin` when unauthenticated.

---

- [ ] 1. Extend `app/lib/api/dashboard.ts` with new types and functions for staff, payouts, and hotel profile.

  Add the following exports — do not remove or change anything already in the file:

  **Types to add:**
  - `DashboardStaffMember`: `{ id, name, email, role: 'HOTEL_OWNER'|'HOTEL_MANAGER'|'HOTEL_STAFF', status: 'active'|'inactive', lastActive: string }` — matches the API's staff member shape. Include a `toStaffRole()` helper (unexported) that maps API role strings to the dashboard's `StaffRole` type: `HOTEL_OWNER->'owner'`, `HOTEL_MANAGER->'manager'`, `HOTEL_STAFF->'staff'`; everything else defaults to `'staff'`.
  - `DashboardPayoutTransaction`: `{ id, bookingId, guestName, date, grossNgn, commissionNgn, netNgn, status: 'settled'|'pending'|'processing' }`
  - `DashboardHotelProfile`: `{ id, name, city, state, country?, address?, phone?, email?: string, website?: string, checkInTime?: string, checkOutTime?: string, cancellationPolicy?: string, starRating?: number, type?: string }`

  **Functions to add:**

  ```
  getHotelStaff(hotelId: string): Promise<DashboardStaffMember[]>
    GET /api/v1/hotels/:hotelId/staff
    Handle both plain array and { data: [...] } shapes.
    On any error return [] (page shows empty state gracefully).

  inviteStaffMember(hotelId: string, payload: { name: string; email: string; role: string }): Promise<DashboardStaffMember>
    POST /api/v1/hotels/:hotelId/staff
    Throws on error so the UI can show the error message.

  updateStaffStatus(hotelId: string, staffId: string, status: 'active'|'inactive'): Promise<void>
    PATCH /api/v1/hotels/:hotelId/staff/:staffId  body: { status }
    Throws on error.

  removeStaffMember(hotelId: string, staffId: string): Promise<void>
    DELETE /api/v1/hotels/:hotelId/staff/:staffId
    Throws on error.

  getHotelPayouts(hotelId: string): Promise<DashboardPayoutTransaction[]>
    GET /api/v1/hotels/:hotelId/payouts
    Handle both plain array and { data: [...] } shapes.
    On 404/error: derive payout records from getDashboardReservations —
      filter for status === 'checked_out', compute grossNgn = amountNgn,
      commissionNgn = Math.round(amountNgn * 0.05), netNgn = grossNgn - commissionNgn,
      status = 'settled', date = checkOut, guestName from reservation.
    Always returns an array, never throws.

  requestPayout(hotelId: string): Promise<void>
    POST /api/v1/hotels/:hotelId/payouts/request
    Throws ApiError on failure so UI can display the error.

  getHotelProfile(hotelId: string): Promise<DashboardHotelProfile | null>
    GET /api/v1/hotels/:hotelId
    On error return null.

  updateHotelProfile(hotelId: string, payload: Partial<DashboardHotelProfile>): Promise<DashboardHotelProfile>
    PATCH /api/v1/hotels/:hotelId  body: payload
    Throws on error.
  ```

  Files: `app/lib/api/dashboard.ts`

  Verify: `npx next build` from `c:\Users\Pkaka\music\hotel-os` — exit code 0, no TypeScript errors in dashboard.ts.

---

- [ ] 2. Wire `app/dashboard/analytics/page.tsx` to real API data.

  The current file is a static server component (no `'use client'`). Convert it fully:

  1. Add `'use client'` directive at the top.
  2. Add imports: `useState`, `useEffect`, `useCallback`, `useRouter` from react/next, `useAuth` from `../../lib/auth-context`, `getMyHotel`, `getDashboardReservations`, `getDashboardRoomTypes`, `getDashboardStats`, types `DashboardReservation`, `DashboardRoomType` from `../../lib/api/dashboard`.
  3. Remove all imports from `../mock/data` (`MOCK_REVENUE_DAYS`, `MOCK_RESERVATIONS`, `MOCK_ROOM_TYPES`).
  4. Auth gate: same pattern as `reservations/page.tsx` — `useAuth()` + `useEffect` redirect + early returns for `authLoading` and `!user`.
  5. State: `reservations: DashboardReservation[]`, `roomTypes: DashboardRoomType[]`, `stats`, `isLoading: boolean`, `error: string | null`.
  6. Data fetch `useEffect` (depends on `user`): call `getMyHotel()`, then `Promise.all([getDashboardReservations(id), getDashboardRoomTypes(id), getDashboardStats(id)])`. Store results.
  7. **Derived analytics** (replace module-level constants with `useMemo` values computed from state):
     - `revenueByDay`: group reservations with `status === 'checked_out'` by `checkOut` date (last 30 days). Each entry: `{ date, revenueNgn: sum of amountNgn, bookings: count, occupancyPercent: 0 }`. Merge with `stats.occupancyPercent` for today. Sort by date ascending.
     - `totalRevenue`: sum of all `revenueNgn` in `revenueByDay`.
     - `avgOccupancy`: `stats.occupancyPercent` (single value; show as "Current" instead of "Avg" in the stat card label).
     - `totalBookings`: `reservations.length`.
     - `cancelledCount` / `cancellationRate`: from `reservations` array.
     - `adr`: `totalRevenue / (totalBookings || 1)`.
  8. **`RevenueBarChart`**: change from reading `MOCK_REVENUE_DAYS` to accepting a `data` prop of type `{ date: string; revenueNgn: number }[]`. Pass `revenueByDay.slice(-14)` from the page.
  9. **`OccupancyLineChart`**: the mock had per-day occupancy data which we no longer have. Replace this chart with a single "Current Occupancy" stat display — a large number with a circular progress arc showing `stats.occupancyPercent`. Keep it as an SVG for visual consistency. The section heading changes to "Current Occupancy".
  10. **`BookingsByRoomType`**: change from reading module-level constants to accepting `reservations` and `roomTypes` as props. The counting logic is identical.
  11. Show loading state while `isLoading`. Show error state if `error` is set with a Retry button.

  Files: `app/dashboard/analytics/page.tsx`

  Verify: `npx next build` — exit code 0. Confirm `MOCK_` does not appear in the file.

---

- [ ] 3. Wire `app/dashboard/staff/page.tsx` to real API data.

  The current file is `'use client'` but seeds state from `MOCK_STAFF`.

  1. Remove import of `MOCK_STAFF` from `../mock/data`.
  2. Add imports: `useEffect`, `useCallback`, `useRouter` (already has `useState`), `useAuth` from `../../lib/auth-context`, `getMyHotel`, `getHotelStaff`, `inviteStaffMember`, `updateStaffStatus`, `removeStaffMember`, `DashboardStaffMember` from `../../lib/api/dashboard`.
  3. Auth gate: `useAuth()` + redirect.
  4. Replace `useState<StaffMember[]>(MOCK_STAFF)` with `useState<DashboardStaffMember[]>([])`.
  5. Add `hotelId: string | null` state and `isLoading: boolean`, `error: string | null` state.
  6. Fetch `useEffect` (depends on `user`): call `getMyHotel()` then `getHotelStaff(hotelId)`. Set `staffList`.
  7. **`handleInvite`**: call `inviteStaffMember(hotelId, { name, email, role: role.toUpperCase() })`. On success, optimistically append the returned member to `staffList` (or re-fetch). On error, show inline error in the modal.
  8. **`toggleStatus`**: call `updateStaffStatus(hotelId, id, newStatus)`. Optimistically update local state; revert on error.
  9. **`removeMember`**: call `removeStaffMember(hotelId, id)`. Optimistically remove from local state; revert on error.
  10. **Role mapping**: The API returns `HOTEL_OWNER`, `HOTEL_MANAGER`, `HOTEL_STAFF` — map these to the dashboard's `StaffRole` type (`'owner'`, `'manager'`, `'staff'`) for `ROLE_COLORS` / `ROLE_LABELS`. Use the `toStaffRole` mapping from dashboard.ts conceptually — implement it inline as a small helper in the page file.
  11. The `avatarInitials` field may not be in the API response. Derive it from `name` the same way `getInitials(name)` already does — call that function when mapping API staff to display.
  12. The permissions table is static UI — leave it unchanged.
  13. Show loading state and error state.

  Files: `app/dashboard/staff/page.tsx`

  Verify: `npx next build` — exit code 0. `MOCK_STAFF` not imported.

---

- [ ] 4. Wire `app/dashboard/guests/page.tsx` to real API data.

  The current file is `'use client'` seeding from `MOCK_RESERVATIONS`.

  1. Remove import of `MOCK_RESERVATIONS` from `../mock/data` and the `Reservation` type from `../types`.
  2. Add imports: `useEffect`, `useCallback`, `useRouter`, `useAuth`, `getMyHotel`, `getDashboardReservations`, `DashboardReservation` from `../../lib/api/dashboard`.
  3. Auth gate.
  4. Change `buildGuestList` to accept `DashboardReservation[]` instead of `Reservation[]`. The fields are identical (`guestName`, `guestEmail`, `amountNgn`, `checkOut`, `checkIn`, `roomTypeName`, `roomNumber`, `status`, `id`) — `DashboardReservation` has all of them. Update the type reference in the function signature and in the `GuestSummary.bookings` field type.
  5. Replace `useMemo(() => buildGuestList(MOCK_RESERVATIONS), [])` with state: `reservations: DashboardReservation[]`, then `const allGuests = useMemo(() => buildGuestList(reservations), [reservations])`.
  6. Add `useEffect` to fetch: `getMyHotel()` then `getDashboardReservations(hotelId)`.
  7. Add loading and error states.
  8. The `StatusBadge` in the expanded bookings row already accepts `BookingStatus` — `DashboardReservation.status` is already typed as `BookingStatus`, so no change needed there.

  Files: `app/dashboard/guests/page.tsx`

  Verify: `npx next build` — exit code 0. `MOCK_RESERVATIONS` not imported.

---

- [ ] 5. Wire `app/dashboard/payouts/page.tsx` to real API data.

  The current file is a static server component. Convert it:

  1. Add `'use client'` directive.
  2. Remove import of `MOCK_PAYOUTS` from `../mock/data`.
  3. Add imports: `useState`, `useEffect`, `useCallback`, `useRouter`, `useAuth`, `getMyHotel`, `getHotelPayouts`, `requestPayout`, `DashboardPayoutTransaction` from `../../lib/api/dashboard`.
  4. Auth gate.
  5. State: `payouts: DashboardPayoutTransaction[]`, `hotelId: string | null`, `isLoading: boolean`, `error: string | null`, `requestingPayout: boolean`, `payoutError: string | null`.
  6. Fetch `useEffect`: `getMyHotel()` then `getHotelPayouts(hotelId)`.
  7. Replace all `MOCK_PAYOUTS` references with `payouts` state.
  8. Move the derived balance constants (`availableBalance`, `pendingBalance`, `totalSettled`) and the `totalGross`/`totalFee`/`totalNet` totals inside the component body as `useMemo` values computed from `payouts`.
  9. **"Request Payout" button**: call `requestPayout(hotelId)` in `onClick`, set `requestingPayout: true` while pending, clear on resolve. Show error under the button if `requestPayout` throws. Disable the button while `requestingPayout` is true in addition to the existing `availableBalance === 0` check.
  10. Show loading state and error state.
  11. `PayoutBadge` component and its types are local to the file — keep them unchanged.

  Files: `app/dashboard/payouts/page.tsx`

  Verify: `npx next build` — exit code 0. `MOCK_PAYOUTS` not imported.

---

- [ ] 6. Wire `app/dashboard/profile/page.tsx` to real API data.

  The current file is a static server component. Convert it:

  1. Add `'use client'` directive.
  2. Remove import of `MOCK_HOTEL` from `../mock/data`.
  3. Add imports: `useState`, `useEffect`, `useCallback`, `useRouter`, `useAuth`, `getMyHotel`, `getHotelProfile`, `updateHotelProfile`, `DashboardHotelProfile` from `../../lib/api/dashboard`.
  4. Auth gate.
  5. State: `hotel: DashboardHotelProfile | null`, `isLoading: boolean`, `error: string | null`, `editing: boolean`, `saving: boolean`, `saveError: string | null`.
  6. Fetch `useEffect`: `getMyHotel()` then `getHotelProfile(hotelId)`.
  7. Replace all `MOCK_HOTEL.*` / hardcoded placeholder strings with `hotel.*` fields. Use `hotel?.name ?? '—'` for values that might be missing from the API.
     - Header h1: `hotel?.name`
     - "Lagos, Lagos State" subtitle: `[hotel?.city, hotel?.state].filter(Boolean).join(', ')`
     - Property Details card: `hotel?.name`, `hotel?.type ?? 'Hotel'`, `hotel?.starRating ? \`${hotel.starRating} Stars\` : '—'`, description as `'—'` (no description field in scope)
     - Location card: `hotel?.address ?? '—'`, `hotel?.city ?? '—'`, `hotel?.state ?? '—'`, `hotel?.country ?? 'Nigeria'`
     - Contact card: `hotel?.phone ?? '—'`, `hotel?.email ?? '—'`, `hotel?.website ?? '—'`
     - Policies card: `hotel?.checkInTime ?? '—'`, `hotel?.checkOutTime ?? '—'`, `hotel?.cancellationPolicy ?? '—'`
  8. **Edit Profile button**: when `editing` is false, clicking opens an inline edit form (replace the `InfoCard` static view with editable `<input>` fields). When `editing` is true, show "Save" and "Cancel" buttons. On Save, call `updateHotelProfile(hotelId, updatedFields)`. On success, update local `hotel` state and set `editing: false`. On error, show `saveError`.
  9. Photos section stays as UI placeholder — no change.
  10. "Preview Public Listing" link stays as `href="#"` — no change needed.
  11. Show loading and error states.

  Files: `app/dashboard/profile/page.tsx`

  Verify: `npx next build` — exit code 0. `MOCK_HOTEL` not imported.

---

- [ ] 7. Final build verification — confirm all five pages compile cleanly and no mock imports remain.

  Run the following in sequence from `c:\Users\Pkaka\music\hotel-os`:

  ```powershell
  npx next build
  ```

  Expected: exit code 0, all dashboard routes listed in output with no TypeScript errors.

  Additionally confirm no mock imports remain in any of the changed files:
  ```powershell
  Select-String -Path `
    "app/dashboard/analytics/page.tsx",`
    "app/dashboard/staff/page.tsx",`
    "app/dashboard/guests/page.tsx",`
    "app/dashboard/payouts/page.tsx",`
    "app/dashboard/profile/page.tsx" `
    -Pattern "MOCK_"
  ```
  Expected: no output (zero matches).

  Files: none (verification only)

  Verify: `npx next build` exits 0.
