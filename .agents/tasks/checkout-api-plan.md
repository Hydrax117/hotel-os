# Implementation Plan — Checkout API Wiring

> **Full FEAT artifacts live at** `c:\Users\Pkaka\music\hotel-os\.agents\tasks\checkout-api-wiring\`
> `context.json`, `task.json`, `features/FEAT-001.json`, `features/FEAT-002.json`
> Coder steps should read context.json first — it replaces the need to re-explore the codebase.

---

## Design Decisions

- **bookings.ts is the single API module** for all booking operations. The apiClient in `app/lib/api/client.ts` already handles auth tokens, 401 refresh, and error normalisation — bookings.ts just defines the types and wraps the endpoints. No new dependencies.

- **Checkout stays `'use client'`** because it uses `useState` for form fields and needs to call `window.location.href` for Paystack redirect. The hotel/room data lookup (previously from mock) now fetches from the public REST API using a `useEffect`.

- **Paystack payment flow**: `createBooking` → `initializePayment(booking.id)` → `window.location.href = payment.paymentUrl`. The payment card/bank form fields are removed entirely — Paystack's hosted page collects payment details. The confirmation page is the Paystack callback target, receiving `ref` and other booking params as URL query params.

- **Confirmation page reads from URL params only** (no API call). The checkout page passes `hotelName`, `roomName`, `total` etc. as URL params alongside `ref`. This keeps the server component simple and avoids an authenticated API call on a page the user lands on after payment.

- **BookingStatus mapping**: API statuses `CONFIRMED | HELD | PAYMENT_PENDING | CHECKED_IN | PENDING` → UI `upcoming`; `CHECKED_OUT` → `completed`; `CANCELLED | NO_SHOW` → `cancelled`.

- **Auth gate pattern** (same as other protected pages): `useEffect(() => { if (!authLoading && !user) router.push('/auth/signin?redirect=<path>'); }, [authLoading, user, router])`.

---

## Steps

- [ ] 1. Create `app/lib/api/bookings.ts` — API client for all booking endpoints.

      Define four types (no `any`):
      - `ApiBookingStatus`: `'HELD' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'PAYMENT_PENDING' | 'NO_SHOW' | 'PENDING'`
      - `CreateBookingPayload`: `{ roomId: string; checkIn: string; checkOut: string; guests: number; specialRequests?: string }`
      - `BookingResponse`: `{ id: string; hotelId: string; roomId: string; checkIn: string; checkOut: string; guests: number; totalAmount: number; status: ApiBookingStatus; specialRequests?: string; createdAt: string; hotel?: { id: string; name: string; city: string; state: string }; room?: { id: string; name: string; pricePerNight: number } }`
      - `InitPaymentResponse`: `{ paymentUrl: string; reference: string; accessCode: string }`

      Export four functions using `apiClient` imported from `./client`:
      - `createBooking(payload: CreateBookingPayload): Promise<BookingResponse>` → `POST /api/v1/bookings`
      - `initializePayment(bookingId: string): Promise<InitPaymentResponse>` → `POST /api/v1/bookings/${bookingId}/payment/initialize`
      - `getMyBookings(): Promise<BookingResponse[]>` → `GET /api/v1/bookings/my`
      - `cancelBooking(bookingId: string): Promise<void>` → `POST /api/v1/bookings/${bookingId}/cancel`

      Files: `app/lib/api/bookings.ts`
      Verify: `npx next build` — file compiles, zero TypeScript errors.

- [ ] 2. Rewrite `app/checkout/page.tsx` — real API, auth gate, Paystack redirect.

      **Imports to remove:** `HOTEL_DETAILS`, `HOTEL_ROOM_TYPES`, `DEFAULT_ROOM_TYPES` from `../hotels/mock`; `SEARCH_MOCK_HOTELS` from `../search/mock`.

      **Imports to add:**
      ```ts
      import { useEffect } from 'react';         // already imported — add useEffect to destructure
      import { useAuth } from '../lib/auth-context';
      import { createBooking, initializePayment, type CreateBookingPayload } from '../lib/api/bookings';
      import { calcNights, calcBookingCost } from '../lib/booking';
      import { ApiError } from '../lib/api/client';
      import type { HotelDetail, RoomAvailability } from '../lib/api/search';
      ```

      **Auth gate** (inside `CheckoutInner`, after `useSearchParams`/`useRouter`):
      ```ts
      const { user, isLoading: authLoading } = useAuth();
      useEffect(() => {
        if (!authLoading && !user) router.push('/auth/signin?redirect=/checkout');
      }, [authLoading, user, router]);
      ```
      While `authLoading` or `!user`: return a centered loading spinner (or `null`).

      **Pre-fill guest fields from auth:**
      ```ts
      useEffect(() => {
        if (user) {
          setFirstName(user.firstName);
          setLastName(user.lastName);
          setEmail(user.email);
        }
      }, [user]);
      ```

      **Data state (replaces mock lookup):**
      ```ts
      const [hotelName, setHotelName] = useState('');
      const [hotelCity, setHotelCity] = useState('');
      const [roomName, setRoomName] = useState('');
      const [pricePerNight, setPricePerNight] = useState(0);
      const [cancellationPolicy, setCancellationPolicy] = useState('');
      const [dataLoading, setDataLoading] = useState(true);
      const [dataError, setDataError] = useState('');
      ```
      Fetch in `useEffect` (runs when `hotelId`/`roomId` are set):
      ```ts
      useEffect(() => {
        if (!hotelId || !roomId) return;
        setDataLoading(true);
        const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://hotel-os-api-52qe.onrender.com';
        Promise.all([
          fetch(`${BASE}/api/v1/hotels/${hotelId}`).then(r => r.json() as Promise<HotelDetail>),
          fetch(`${BASE}/api/v1/hotels/${hotelId}/rooms`).then(r => r.json() as Promise<{ rooms: RoomAvailability[] }>),
        ]).then(([hotel, roomsData]) => {
          setHotelName(hotel.name);
          setHotelCity(hotel.city);
          const room = roomsData.rooms.find(r => r.id === roomId);
          if (room) {
            setRoomName(room.name);
            setPricePerNight(room.pricePerNight);
            setCancellationPolicy(room.cancellationPolicy);
          } else {
            setDataError('Room not found.');
          }
        }).catch(() => setDataError('Failed to load booking details.'))
          .finally(() => setDataLoading(false));
      }, [hotelId, roomId]);
      ```

      **Submit state:**
      ```ts
      const [submitting, setSubmitting] = useState(false);
      const [submitError, setSubmitError] = useState('');
      ```

      **New `handlePay` (async):**
      ```ts
      async function handlePay(): Promise<void> {
        // Existing field validations...
        setSubmitting(true);
        setSubmitError('');
        try {
          const payload: CreateBookingPayload = {
            roomId,
            checkIn: checkInInput,
            checkOut: checkOutInput,
            guests: Number(guests),
            specialRequests: specialRequests.trim() || undefined,
          };
          const booking = await createBooking(payload);
          const payment = await initializePayment(booking.id);
          window.location.href = payment.paymentUrl;
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
          setSubmitError(msg);
        } finally {
          setSubmitting(false);
        }
      }
      ```

      **Remove** the entire payment card/bank form section (Section 3). Replace with:
      ```tsx
      <section style={{ background: 'var(--tp-surface)', border: '1px solid var(--tp-border)', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <LockIcon size={16} />
          <h2 style={{ fontWeight: 600, color: 'var(--tp-primary)' }}>Secure payment</h2>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--tp-secondary)' }}>
          You will be redirected to Paystack&apos;s secure payment page to complete your booking.
        </p>
      </section>
      ```
      Remove the `paymentTab`, `cardNumber`, `expiry`, `cvv`, `cardholderName` state variables and the card/bank validation in `handlePay`.

      **Pay button:** `disabled={submitting}`, text: `submitting ? 'Processing…' : 'Pay ₦' + total.toLocaleString()`.

      **Booking summary** (right column): use `pricePerNight` state (not `room.pricePerNight`); use `hotelName`, `hotelCity`, `roomName`, `cancellationPolicy` from state.

      **Show data loading**: while `dataLoading`, render a skeleton placeholder in place of the booking summary values. Exact text values become `'—'` placeholders.

      **Show data error**: if `dataError` is non-empty and not loading, render the same error state as before (centered error message + back link).

      Files: `app/checkout/page.tsx`
      Verify: `npx next build` — zero TypeScript errors; no imports from `hotels/mock` or `search/mock`.

- [ ] 3. Rewrite `app/booking/confirmation/page.tsx` — simplified, URL params only, no mock.

      **Imports to remove:** `HOTEL_DETAILS`, `HOTEL_ROOM_TYPES`, `DEFAULT_ROOM_TYPES` from `../../hotels/mock`; `SEARCH_MOCK_HOTELS` from `../../search/mock`; `calcNights`, `calcBookingCost` from `../../lib/booking`.

      **searchParams shape update** (new params added by the new checkout `handlePay`):
      ```ts
      searchParams: Promise<{
        ref?: string;
        hotelName?: string;
        roomName?: string;
        checkIn?: string;
        checkOut?: string;
        guests?: string;
        total?: string;
      }>
      ```

      **Remove all mock data lookups.** Replace with:
      ```ts
      const ref       = params.ref      ?? 'HOS-00000';
      const hotelName = params.hotelName ?? 'Hotel';
      const roomName  = params.roomName  ?? 'Room';
      const checkIn   = params.checkIn;
      const checkOut  = params.checkOut;
      const guests    = params.guests    ?? '1';
      const totalNgn  = Number(params.total ?? '0');
      ```

      **Remove** the `if (!room)` guard (room data comes from URL now).

      **Keep** the existing page UI unchanged — success banner, booking reference card, booking details card rows (Hotel, Room, Check-in, Check-out, Guests, Total paid), action buttons, support link.

      **Update the details card** to use `hotelName`, `roomName`, and `totalNgn` (not `total` from `calcBookingCost`).

      **Keep** `export const instant = false;` and `export default Page;`.

      Files: `app/booking/confirmation/page.tsx`
      Verify: `npx next build` — zero TypeScript errors; no imports from `hotels/mock` or `search/mock`.

- [ ] 4. Rewrite `app/bookings/page.tsx` — real API, auth gate, status mapping, cancel action, loading skeleton.

      **Imports to remove:** `MOCK_TRAVELER_BOOKINGS` from `./mock` (keep `TravelerBooking` and `BookingStatus` imports — they drive the UI).

      **Imports to add:**
      ```ts
      import { useEffect, useCallback } from 'react';    // add to existing react import
      import { useRouter } from 'next/navigation';         // already imported via useSearchParams — add useRouter
      import { useAuth } from '../lib/auth-context';
      import { getMyBookings, cancelBooking, type BookingResponse } from '../lib/api/bookings';
      import { ApiError } from '../lib/api/client';
      import { calcNights } from '../lib/booking';
      ```

      **Status mapping function** (above the component):
      ```ts
      function mapStatus(apiStatus: BookingResponse['status']): BookingStatus {
        switch (apiStatus) {
          case 'CONFIRMED':
          case 'HELD':
          case 'PAYMENT_PENDING':
          case 'CHECKED_IN':
          case 'PENDING':
            return 'upcoming';
          case 'CHECKED_OUT':
            return 'completed';
          case 'CANCELLED':
          case 'NO_SHOW':
            return 'cancelled';
        }
      }
      ```

      **Mapping function** (above the component):
      ```ts
      function mapApiBooking(b: BookingResponse): TravelerBooking {
        return {
          id: b.id,
          hotelId: b.hotel?.id ?? b.hotelId,
          hotelName: b.hotel?.name ?? 'Hotel',
          hotelCity: b.hotel?.city ?? '—',
          hotelState: b.hotel?.state ?? '—',
          roomName: b.room?.name ?? 'Room',
          roomId: b.roomId,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          nights: calcNights(b.checkIn, b.checkOut),
          guests: b.guests,
          totalNgn: b.totalAmount,
          status: mapStatus(b.status),
          createdAt: b.createdAt,
          specialRequests: b.specialRequests,
        };
      }
      ```

      **State in `BookingsPage`:**
      ```ts
      const { user, isLoading: authLoading } = useAuth();
      const router = useRouter();
      const [bookings, setBookings] = useState<TravelerBooking[]>([]);
      const [loadingBookings, setLoadingBookings] = useState(true);
      const [fetchError, setFetchError] = useState('');
      const [cancellingId, setCancellingId] = useState<string | null>(null);
      ```

      **Auth gate:**
      ```ts
      useEffect(() => {
        if (!authLoading && !user) router.push('/auth/signin?redirect=/bookings');
      }, [authLoading, user, router]);
      ```

      **Fetch bookings:**
      ```ts
      useEffect(() => {
        if (!user) return;
        setLoadingBookings(true);
        getMyBookings()
          .then(raw => setBookings(raw.map(mapApiBooking)))
          .catch(err => setFetchError(err instanceof ApiError ? err.message : 'Failed to load bookings.'))
          .finally(() => setLoadingBookings(false));
      }, [user]);
      ```

      **Cancel handler:**
      ```ts
      const handleCancelBooking = useCallback(async (bookingId: string): Promise<void> => {
        setCancellingId(bookingId);
        try {
          await cancelBooking(bookingId);
          setBookings(prev => prev.map(b =>
            b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b
          ));
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : 'Failed to cancel booking.';
          alert(msg);
        } finally {
          setCancellingId(null);
        }
      }, []);
      ```

      **Update `BookingCard`** props type to add `onCancel: (id: string) => Promise<void>` and `cancellingId: string | null`. Change the "Cancel booking" button: `onClick={() => onCancel(booking.id)}`, `disabled={cancellingId === booking.id}`, text: `cancellingId === booking.id ? 'Cancelling…' : 'Cancel booking'`.

      **Replace all three `MOCK_TRAVELER_BOOKINGS` references** with `bookings`.

      **Loading skeleton** (render when `loadingBookings`):
      ```tsx
      {loadingBookings && (
        <div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
          {[0,1,2].map(i => (
            <div key={i} style={{ height: 120, background: 'var(--tp-muted)', borderRadius: '14px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}
      ```

      **Error banner** (render when `fetchError` is set and not loading):
      ```tsx
      {fetchError && !loadingBookings && (
        <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '10px', padding: '14px 20px', marginBottom: '16px', fontSize: '14px' }}>
          {fetchError}
        </div>
      )}
      ```

      Files: `app/bookings/page.tsx`
      Verify: `npx next build` — zero TypeScript errors; no `MOCK_TRAVELER_BOOKINGS` import.

- [ ] 5. Final build verification — confirm all four files are clean.
      Run from `c:\Users\Pkaka\music\hotel-os`.
      Files: no changes — verification only.
      Verify: `npx next build` exits with code 0; zero TypeScript errors; grep for `MOCK_TRAVELER_BOOKINGS`, `hotels/mock` in checkout/confirmation/bookings pages returns no matches.

---

## Summary of imports changed per file

| File | Remove | Add |
|---|---|---|
| `app/lib/api/bookings.ts` | (new file) | `apiClient` from `./client` |
| `app/checkout/page.tsx` | `HOTEL_DETAILS`, `HOTEL_ROOM_TYPES`, `DEFAULT_ROOM_TYPES`, `SEARCH_MOCK_HOTELS` | `useAuth`, `createBooking`, `initializePayment`, `CreateBookingPayload`, `calcNights`, `calcBookingCost`, `ApiError`, `HotelDetail`, `RoomAvailability` |
| `app/booking/confirmation/page.tsx` | `HOTEL_DETAILS`, `HOTEL_ROOM_TYPES`, `DEFAULT_ROOM_TYPES`, `SEARCH_MOCK_HOTELS`, `calcNights`, `calcBookingCost` | (nothing new — all data from URL params) |
| `app/bookings/page.tsx` | `MOCK_TRAVELER_BOOKINGS` | `useRouter`, `useAuth`, `getMyBookings`, `cancelBooking`, `BookingResponse`, `ApiError`, `calcNights` |

## TypeScript strictness notes

- No `any` types in any new or modified code.
- `mapApiBooking` has explicit return type `TravelerBooking`.
- `mapStatus` has explicit parameter type `BookingResponse['status']` and return type `BookingStatus`.
- `handlePay` has return type `Promise<void>`.
- `handleCancelBooking` wrapped in `useCallback` with return type `Promise<void>`.
- All `useState` calls use explicit generic types where inference is insufficient.
