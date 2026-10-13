# Implementation Plan — Admin Pages API Wiring

## Context & Key Decisions

**Architecture decision**: All 9 admin pages currently use server-side or mixed rendering with mock data. Because the API calls require the `Authorization: Bearer <token>` header read from `localStorage` (see `app/lib/api/client.ts` → `getAccessToken()`), every admin page **must become a `'use client'` component**. Server Components cannot access localStorage. This is consistent with the pattern already used in `app/admin/reviews/page.tsx` (already `'use client'`).

**Auth gate pattern**: The `useAuth()` hook from `app/lib/auth-context.tsx` exposes `user` and `isLoading`. The gate pattern for all pages:
- While `isLoading`: show a loading skeleton.
- If `user?.role !== 'SUPER_ADMIN'`: show a "403 — Access Denied" message and stop rendering.
- On load error: show an error message with a retry button.

**API module**: All admin API calls live in a new `app/lib/api/admin.ts`. The file follows the same `apiClient` + explicit types pattern as `app/lib/api/dashboard.ts`. The NestJS backend base URL is `https://hotel-os-api-52qe.onrender.com` (from `app/lib/api/client.ts`). Assumed admin API routes follow the pattern `/api/v1/admin/*` — confirmed by the existing NestJS convention in the codebase.

**Pages with `await connection()` / `export const instant`**: `hotels/page.tsx`, `hotels/verification/page.tsx`, `subscriptions/page.tsx`, `payouts/page.tsx`, and `payments/page.tsx` currently use these server-only APIs. They must be removed when converting to `'use client'`.

**Pages that already have their own inline mock data**: `reviews/page.tsx` has `MOCK_REVIEWS`, `payouts/page.tsx` has `PAYOUT_REQUESTS`/`SETTLED_PAYOUTS`. These will be replaced with API data.

---

## Implementation Plan

- [ ] 1. Create `app/lib/api/admin.ts` with all admin API functions and TypeScript types.

      Define these exported types (mirroring the shapes in `app/admin/mock.ts` but using backend-aligned field names):
      - `AdminHotel`, `AdminUser`, `AdminBooking`, `PlatformStats`
      - `AdminReview` (rating, title, body, status, guestName, hotelName, verified, date)
      - `AdminPayment` (transaction derived from bookings)
      - `AdminPayout` and `AdminSettledPayout`
      - `AdminSubscription`

      Define these 10 exported functions, each using `apiClient` from `./client`:
      1. `getAdminStats(): Promise<PlatformStats>` — GET `/api/v1/admin/stats`
      2. `getAdminHotels(params?: { status?: string; q?: string }): Promise<AdminHotel[]>` — GET `/api/v1/admin/hotels`
      3. `getPendingVerifications(): Promise<AdminHotel[]>` — GET `/api/v1/admin/hotels?status=pending`
      4. `approveHotel(id: string): Promise<void>` — POST `/api/v1/admin/hotels/:id/approve`
      5. `rejectHotel(id: string): Promise<void>` — POST `/api/v1/admin/hotels/:id/reject`
      6. `suspendHotel(id: string): Promise<void>` — POST `/api/v1/admin/hotels/:id/suspend`
      7. `getAdminUsers(params?: { role?: string }): Promise<AdminUser[]>` — GET `/api/v1/admin/users`
      8. `getAdminBookings(): Promise<AdminBooking[]>` — GET `/api/v1/admin/bookings`
      9. `getAdminReviews(): Promise<AdminReview[]>` — GET `/api/v1/admin/reviews`
      10. `getAdminPayouts(): Promise<{ requests: AdminPayout[]; settled: AdminSettledPayout[] }>` — GET `/api/v1/admin/payouts`

      Each function must:
      - Handle both `T[]` and `{ data: T[] }` response shapes (backend may wrap arrays).
      - Accept an optional `ApiError` re-throw so pages can show error state.
      - Follow the exact pattern in `dashboard.ts` (typed raw API shape → mapped return type).

      Files: `app/lib/api/admin.ts`
      Verify: `npm run build` from `c:\Users\Pkaka\music\hotel-os` — TypeScript compilation passes with no errors in the new file.

- [ ] 2. Convert `app/admin/overview/page.tsx` to a client component that fetches from the real API.

      Changes:
      - Add `'use client'` directive at the top.
      - Replace `import { PLATFORM_STATS, ADMIN_BOOKINGS, ADMIN_HOTELS } from '../mock'` with `import { getAdminStats, getAdminBookings, getAdminHotels } from '../../lib/api/admin'`.
      - Add `import { useAuth } from '../../lib/auth-context'`.
      - Convert the default export from a plain function to a React client component using `useState` + `useEffect` for data fetching.
      - State: `stats: PlatformStats | null`, `bookings: AdminBooking[]`, `pendingHotels: AdminHotel[]`, `isLoading: boolean`, `error: string | null`.
      - `useEffect`: fetch all three in parallel with `Promise.all([getAdminStats(), getAdminBookings(), getAdminHotels({ status: 'pending' })])`.
      - Auth gate at the top of the render: if `authLoading` → skeleton; if `user?.role !== 'SUPER_ADMIN'` → 403 block.
      - Loading skeleton: 6 grey `rounded-xl` placeholder boxes matching the existing stat card grid layout.
      - Error state: red-tinted card with the error message and a "Retry" button that re-runs the fetch.
      - Remove `export const instant = false` (server-only export, irrelevant to client components).

      Files: `app/admin/overview/page.tsx`
      Verify: `npm run build` — no type errors; page compiles cleanly.

- [ ] 3. Convert `app/admin/hotels/page.tsx` to a client component fetching real hotel data.

      Changes:
      - Add `'use client'` directive.
      - Remove `import { ADMIN_HOTELS } from '../mock'` and the `instant` export.
      - Import `getAdminHotels`, `approveHotel`, `rejectHotel`, `suspendHotel` from `../../../lib/api/admin`.
      - Import `useAuth` from `../../../lib/auth-context`.
      - Convert to a client component: `useState` for `hotels`, `isLoading`, `error`; `useSearchParams` (from `next/navigation`) for `status` and `q` filter params instead of `searchParams` prop (since server `searchParams` prop is not available on client components).
      - Fetch on mount with `getAdminHotels({ status: statusFilter, q: query })`.
      - The Suspend/Approve/Reject action buttons call the corresponding API functions, then re-fetch to refresh state.
      - Auth gate, loading skeleton (table rows with grey placeholder cells), error+retry block.
      - The search `<input>` remains uncontrolled for display but navigates via `router.push` on `onChange` using `useRouter`.

      Files: `app/admin/hotels/page.tsx`
      Verify: `npm run build` — no type errors.

- [ ] 4. Convert `app/admin/hotels/verification/page.tsx` to a client component.

      Changes:
      - Add `'use client'` directive.
      - Remove `import { connection } from 'next/server'`, `export const instant = false`, and the `ADMIN_HOTELS` mock import.
      - Import `getPendingVerifications`, `approveHotel`, `rejectHotel` from `../../../lib/api/admin`.
      - Import `useAuth`.
      - Convert to client component with state: `pending: AdminHotel[]`, `history: AdminHotel[]`, `isLoading`, `error`.
      - Fetch pending + non-pending (history) in a single `getAdminHotels()` call on mount, then split client-side.
      - Approve/Reject buttons call API then re-fetch.
      - Auth gate, loading skeleton (pending card placeholders), error+retry.
      - Keep the `addDays` helper for the history table "Action Date" column.

      Files: `app/admin/hotels/verification/page.tsx`
      Verify: `npm run build` — no type errors.

- [ ] 5. Convert `app/admin/bookings/page.tsx` to a client component.

      Changes:
      - Add `'use client'` directive.
      - Remove `import { ADMIN_BOOKINGS } from '../mock'` and the type import.
      - Import `getAdminBookings` from `../../lib/api/admin`.
      - Import `useAuth`.
      - State: `bookings: AdminBooking[]`, `isLoading`, `error`.
      - `useEffect` calls `getAdminBookings()`.
      - Summary totals (GMV, commission, cancellation rate) computed from fetched data.
      - Auth gate, loading skeleton (table rows), error+retry.

      Files: `app/admin/bookings/page.tsx`
      Verify: `npm run build` — no type errors.

- [ ] 6. Convert `app/admin/users/page.tsx` to a client component.

      Changes:
      - Add `'use client'` directive.
      - Remove `import { ADMIN_USERS } from '../mock'`, `instant` export.
      - Import `getAdminUsers` from `../../lib/api/admin`.
      - Import `useAuth`.
      - Use `useSearchParams` for `role` filter; state: `users: AdminUser[]`, `isLoading`, `error`.
      - Re-fetch when the role filter changes (include `roleFilter` in the `useEffect` dependency array).
      - Tab counts computed from fetched data.
      - Auth gate, loading skeleton, error+retry.

      Files: `app/admin/users/page.tsx`
      Verify: `npm run build` — no type errors.

- [ ] 7. Convert `app/admin/subscriptions/page.tsx` to a client component.

      Changes:
      - Add `'use client'` directive.
      - Remove `import { connection } from 'next/server'`, `export const instant = false`, and `ADMIN_HOTELS` mock import.
      - Import `getAdminHotels` from `../../lib/api/admin`.
      - Import `useAuth`.
      - State: `hotels: AdminHotel[]`, `isLoading`, `error`.
      - Fetch on mount with `getAdminHotels()`, then filter to approved+active for the summary cards and approved for the table (same logic as mock version, now over real data).
      - `addDays(30)` function stays but use `useMemo` or just call inline since it's client-side.
      - Auth gate, loading skeleton (3 plan cards + table rows), error+retry.

      Files: `app/admin/subscriptions/page.tsx`
      Verify: `npm run build` — no type errors.

- [ ] 8. Convert `app/admin/payments/page.tsx` to a client component.

      Changes:
      - Add `'use client'` directive.
      - Remove `import { connection } from 'next/server'`, `export const instant = false`, `ADMIN_BOOKINGS` import and `AdminBooking` type import from mock.
      - Import `getAdminBookings` from `../../lib/api/admin`.
      - Import `useAuth`.
      - State: `bookings: AdminBooking[]`, `isLoading`, `error`.
      - Fetch on mount; derive stat card values (totalProcessed, commission, pendingSettlement) from fetched data. Remove the hardcoded `4_200_000`.
      - Auth gate, loading skeleton (3 stat cards + table skeleton rows), error+retry.
      - Keep `fmtNgn`, `fmtDate`, `statusBadge`, `getPaymentStatus`, and `StatCard` helpers as-is.

      Files: `app/admin/payments/page.tsx`
      Verify: `npm run build` — no type errors.

- [ ] 9. Convert `app/admin/payouts/page.tsx` to a client component.

      Changes:
      - Add `'use client'` directive.
      - Remove `import { connection } from 'next/server'`, `export const instant = false`, and the `ADMIN_BOOKINGS` mock import.
      - Remove the inline `PAYOUT_REQUESTS` and `SETTLED_PAYOUTS` mock arrays.
      - Import `getAdminPayouts` from `../../lib/api/admin`.
      - Import `useAuth`.
      - State: `requests: AdminPayout[]`, `settled: AdminSettledPayout[]`, `isLoading`, `error`.
      - Fetch on mount with `getAdminPayouts()`.
      - Auth gate, loading skeleton, error+retry.
      - Keep `fmtNgn` and `StatCard` helpers; replace hardcoded stat values (₦4.8m, ₦1.2m, ₦48.6m) with values derived from fetched data or returned directly by the API.

      Files: `app/admin/payouts/page.tsx`
      Verify: `npm run build` — no type errors.

- [ ] 10. Convert `app/admin/reviews/page.tsx` to fetch real reviews from the API.

      Changes:
      - Already `'use client'` — no directive change needed.
      - Remove the inline `MOCK_REVIEWS` array and `MockReview` type.
      - Import `getAdminReviews`, `AdminReview` from `../../lib/api/admin`.
      - Import `useAuth`.
      - State: `reviews: AdminReview[]`, `isLoading`, `error`; keep existing `activeTab` state.
      - `useEffect` calls `getAdminReviews()` on mount.
      - Replace all `MOCK_REVIEWS` references with the `reviews` state array.
      - Auth gate (show spinner/skeleton until `authLoading` resolves; show 403 if not SUPER_ADMIN).
      - Loading skeleton (3 stat cards + review card placeholders), error+retry.
      - The stats row `'1,247'` total reviews hardcode must be replaced with `reviews.length`.

      Files: `app/admin/reviews/page.tsx`
      Verify: `npm run build` — no type errors.

- [ ] 11. Run full build verification.

      From `c:\Users\Pkaka\music\hotel-os`, run:
      ```
      npx next build
      ```
      Expected outcome: build completes with 0 TypeScript errors and 0 Next.js compilation errors. All 9 admin pages should appear in the build output as client-side routes (no `○` static or `●` dynamic server designations for these pages — they are `λ` or listed as client components).

      If the build fails, check:
      1. Any remaining `import { connection } from 'next/server'` or `export const instant` in client components — both are server-only and will error in `'use client'` files.
      2. Any remaining `searchParams: Promise<...>` prop patterns — client components must use `useSearchParams()` instead.
      3. Missing `Suspense` boundary if `useSearchParams` is used — Next.js requires pages using `useSearchParams` to be wrapped in `<Suspense>`. Wrap the default export body or add a thin wrapper.

      Files: none (verification only)
      Verify: `npx next build` exits with code 0.

---

## Server-Side Rendering Conversion Summary

These pages **must be converted** from server/mixed to `'use client'` because they rely on `localStorage`-based auth tokens:

| Page | Current form | Required change |
|---|---|---|
| `overview/page.tsx` | Server Component | → `'use client'` |
| `hotels/page.tsx` | `async` Server Component with `searchParams` prop | → `'use client'` + `useSearchParams` |
| `hotels/verification/page.tsx` | `async` + `await connection()` | → `'use client'` |
| `bookings/page.tsx` | Plain function (no async) | → `'use client'` |
| `users/page.tsx` | `async` Server Component with `searchParams` prop | → `'use client'` + `useSearchParams` |
| `subscriptions/page.tsx` | `async` + `await connection()` | → `'use client'` |
| `payments/page.tsx` | `async` + `await connection()` | → `'use client'` |
| `payouts/page.tsx` | `async` + `await connection()` | → `'use client'` |
| `reviews/page.tsx` | Already `'use client'` | No change to directive |

> **`useSearchParams` Suspense requirement**: Any page that calls `useSearchParams()` must be either wrapped in a `<Suspense>` boundary or have the `'use client'` component that calls it wrapped in one. The simplest approach: export a thin wrapper as the default export that renders the real component inside `<Suspense fallback={<LoadingSkeleton />}>`. Apply this to `hotels/page.tsx` and `users/page.tsx`.
