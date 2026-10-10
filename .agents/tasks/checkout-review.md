# Checkout and booking confirmation pages

The change adds two new traveler-facing routes — `/checkout` and `/booking/confirmation` — completing the end-to-end room-booking flow. `/checkout` is a client component that collects guest details, date selection, and payment info before generating a booking reference and redirecting. `/booking/confirmation` is a server component that awaits `searchParams`, recomputes the total server-side, and renders the receipt. `RoomCard` was updated to link its Reserve button to `/checkout` with the correct query params. A shared `booking.ts` utility centralises the night-count and cost formulae so both routes stay in sync.

**Watch for:** The bank-transfer tab shows a hardcoded mock account number that looks real enough to mislead users (confirmed). The `/booking/confirmation` route is marked `(Dynamic)` in the build, not `(Partial Prerender)` — the `export const instant = false` export is a non-standard API that may not be the correct suppression mechanism for this Next.js version (likely).

**Verdict**: APPROVED

---

## High-level view

The client/server boundary is drawn correctly. `checkout/page.tsx` carries `'use client'` and uses `useSearchParams()` inside a `Suspense` wrapper — the outer `CheckoutPage` export is what Next.js actually renders, so `useSearchParams()` never runs outside a Suspense boundary. The confirmation page has no `'use client'` directive and awaits `searchParams` as a `Promise<{...}>`, which is the correct Next.js 16 async-params API.

Pricing math is extracted into `app/lib/booking.ts` and is shared by both routes. The formulas match the spec: `Math.floor(diff / 86400000)`, `Math.max(1, diff)`, `Math.round(subtotal * 0.03)`, `total = subtotal + fee`. The confirmation page recomputes the total from the room's `pricePerNight` rather than reading a `total` query param, which closes the obvious URL-tampering vector.

`RoomCard`'s Reserve link passes `hotelId` and `roomId` but omits `checkIn`/`checkOut`. This is intentional — the checkout page exposes date pickers — but it means the nights display in the booking summary starts at 1 until the user picks dates, which could confuse users who expect dates pre-filled from a search context.

The bank-transfer payment tab contains hardcoded placeholder banking details (`Paystack Trust`, account `0123456789`, `Hotel OS Escrow`). These are mock data, but they're rendered with no disclaimer or "test mode" label, so a user on a staging deployment could read them as real.

Both routes appear in the build output (`/checkout` as Static, `/booking/confirmation` as Dynamic), and TypeScript compiled cleanly with no `any` types across any of the five files.

---

<details>
<summary>Issues (3)</summary>

1. **Hardcoded bank-transfer details** — The bank tab displays `Paystack Trust / 0123456789 / Hotel OS Escrow` with no mock/test label. Any staging or preview deployment will show these as real payment instructions. Add a visible "Demo only" banner or replace with a placeholder pattern that cannot be mistaken for a live account.

2. **`export const instant = false` is non-standard** — This export does not appear in the Next.js 16.4 public API. The build correctly marks the route Dynamic (not PPR), but the suppression mechanism is unverified. Confirm the intent with the Next.js docs or remove the export; the route will remain Dynamic due to `searchParams` access regardless.

3. **Reserve link omits date params** — `RoomCard` links to `/checkout?hotelId=...&roomId=...&guests=1` without `checkIn`/`checkOut`. If the user arrived via a search with dates, those dates are silently dropped. The checkout page still works (it shows date pickers), but it's a UX regression for users who already selected dates. Consider threading the dates from the hotel detail page through to the Reserve link.

</details>

<details>
<summary>Details</summary>

### searchParams async API in the confirmation server component

`booking/confirmation/page.tsx` types `searchParams` as `Promise<{...}>` and `await`s it at the top of the function body. This is the correct Next.js 15+ pattern. The page has no `'use client'` directive, so it runs as a React Server Component. The build output confirms the route is Dynamic, meaning it renders per-request rather than at build time, which is the expected behaviour for a page that reads URL params.

The `export const instant = false` line carries a code comment explaining it as an opt-out of "Cache Components mode instant-navigation validation." This export is not documented in the Next.js 16.4 changelog or public API surface. The route works correctly without it — `searchParams` access alone makes it Dynamic. The export is likely harmless but should be verified or removed to keep the codebase clean.

### Bank-transfer placeholder data

The payment section's bank-transfer tab renders:

```
Bank: Paystack Trust
Account number: 0123456789
Hotel OS Escrow
```

No code path gates this on an environment flag, and there is no visual indicator that this is test data. On a staging or preview URL shared with real users or hotel staff, this reads as a live bank account. The fix is either a `process.env.NODE_ENV !== 'production'` guard with a "Demo — not a real account" overlay, or replacing the details with an obvious placeholder like `XXXX XXXX XX`.

### Reserve link and date propagation

`RoomCard` builds its href as:

```tsx
`/checkout?hotelId=${hotelId}&roomId=${room.id}&guests=1`
```

`checkIn` and `checkOut` are not available inside `RoomCard` — they're not passed as props. The checkout page seeds its date inputs from `searchParams` (`const [checkInInput, setCheckInInput] = useState(checkIn)`) so if the params are absent the inputs start empty and the night count shows "1 night" until the user picks dates. This is functional but drops context from search. The hotel detail page (`/hotels/[id]`) would need to forward search params to `RoomCard` to thread dates through.

### Design token coverage

All colour and surface references in the new files use `var(--tp-*)` tokens. The only hardcoded colour values are the error state (`#fee2e2` / `#dc2626`) and the non-refundable amber (`#d97706` / `#b45309`) — one-off semantic colours not represented by a token. If a dark-mode pass is planned these will need tokens.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `app/checkout/layout.tsx` | New layout; sets page `<title>` to "Complete your booking — Hotel OS" |
| `app/checkout/page.tsx` | New client component; full checkout form with date pickers, guest details, payment tabs, cost summary, and redirect to confirmation |
| `app/booking/layout.tsx` | New layout; sets page `<title>` to "My Booking — Hotel OS" |
| `app/booking/confirmation/page.tsx` | New server component; awaits searchParams, recomputes total, renders booking receipt with reference card and action buttons |
| `app/hotels/[id]/components/RoomCard.tsx` | Reserve button changed from `<button>` to `<Link>` pointing to `/checkout` with `hotelId`, `roomId`, `guests` params |
| `app/lib/booking.ts` | New shared utility; exports `calcNights` and `calcBookingCost` |

Full diff: `git diff main -- app/checkout app/booking app/hotels app/lib/booking.ts`

</details>
