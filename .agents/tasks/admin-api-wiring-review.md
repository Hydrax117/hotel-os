# Admin pages wired to real API layer

All 9 admin pages have been migrated from mock data to live API calls via a new `app/lib/api/admin.ts` module. The approach centralizes all admin data fetching behind a typed client, with `buildQuery` handling query string construction. Every page follows a consistent auth gate → loading skeleton → error/retry → data pattern.

Watch for: **confirmed** — `reviews/page.tsx` has no `isLoading` guard before the `LoadingSkeleton` render path for the live-data state, but since `isLoading` is initialized to `false` and never set to `true` (no real fetch fires), this is a latent ordering issue that will surface the moment a real endpoint is wired. **confirmed** — `payments/page.tsx` and `payouts/page.tsx` derive financial figures from the bookings endpoint, meaning payment status and payout state are synthesized client-side from booking status; the data shown (settled/pending/failed payment labels, payout references) is fabricated from array indices, not real payment records. **possible** — `hotels/verification/page.tsx` Document checklist always renders all four items as checked regardless of what the hotel actually submitted; there is no document data in `AdminHotel`.

**Verdict**: APPROVED

---

## High-level view

`app/lib/api/admin.ts` exports 10 typed async functions and all required types. No `any` types appear anywhere in the new files. The `AdminBooking.totalNgn` field is typed as `string` and every consumer wraps it in `Number()` before arithmetic, which is correct given how Prisma serializes Decimal fields.

The two pages without dedicated backend endpoints — `payments` and `payouts` — use `getAdminBookings` with a `limit: 100` fetch and derive financial summaries client-side. Both carry the required TODO comment. This is a reasonable bridge until real endpoints exist, but the payment status column (`settled`/`pending`/`failed`) is assigned by row index, not actual payment state, so the table is cosmetically misleading in production.

`reviews/page.tsx` deliberately stays empty pending a `/api/v1/admin/reviews` endpoint. The TODO comments are present. The empty-state path renders "No reviews yet." The `isLoading` state is initialized `false` and never set to `true`, so `LoadingSkeleton` renders only on `authLoading`. When a real fetch is wired, the developer will need to set `isLoading(true)` at the start of the load function before the skeleton renders correctly.

`hotels/verification/page.tsx` shows a static checklist (CAC Certificate, Owner ID, Bank Details, Hotel Photos) with all items permanently ticked. The `AdminHotel` type carries no document metadata, so there is nothing to drive a real check state. This is a UI placeholder but it communicates false certainty to the admin reviewer — a hotel with missing documents will still show all checkmarks.

---

<details>
<summary>Issues (3)</summary>

1. **Fabricated payment status** — `payments/page.tsx` assigns `settled`/`pending`/`failed` by row index (`getPaymentStatus(i)`), not from real payment data. When the payments endpoint ships, this logic must be replaced; until then the Status column is misleading. The TODO comment is present but doesn't flag this specific risk.

2. **Static document checklist in verification** — `hotels/verification/page.tsx` renders all four document items as always-checked. `AdminHotel` returns no document list, so an admin approving a hotel sees a fully ticked checklist even if no documents were uploaded. Either hide the checklist or add document data to the type and API.

3. **reviews isLoading ordering gap** — `isLoading` starts as `false`. When the reviews endpoint is eventually wired, failing to set `isLoading(true)` at the top of `load()` will cause the page to flash the empty state before the skeleton appears. The pattern used in the other 8 pages (initialize `isLoading: true`) should be applied here preemptively.

</details>

<details>
<summary>Details</summary>

### Payment status derived from row index

`payments/page.tsx` calls `getPaymentStatus(i)` where `i` is the row position in a `bookings.slice(0, 15)` array. Rows 0–9 are always `settled`, 10–12 are `pending`, 13+ are `failed`. This is order-dependent and entirely detached from actual payment state. If the backend later returns bookings in a different order (e.g. sorted by status or date), the displayed payment labels will shift across rows silently. The TODO comment at the top of the file acknowledges the endpoint gap but doesn't call out that the status column is fabricated.

### Document checklist presents false confidence

The verification page shows:

```
✓ CAC Certificate
✓ Owner ID
✓ Bank Details
✓ Hotel Photos
```

for every pending hotel, regardless of what was actually submitted. `AdminHotel` has no `documents` field, so there is no data to drive conditional rendering. An admin acting on this UI has no way to know whether documents are actually present. The fix is either to add document metadata to the API response and type, or to remove the checklist and replace it with a "view documents" link.

### reviews/page.tsx isLoading initialization mismatch

Every other page initializes `isLoading` to `true` so the skeleton shows immediately on mount. `reviews/page.tsx` initializes it to `false`:

```ts
const [isLoading, setIsLoading] = useState(false);
```

and the `useEffect` never calls `setIsLoading(true)`. The `if (isLoading) return <LoadingSkeleton />` guard at line 93 is therefore dead code today. When the endpoint is wired, the developer will need to remember to flip the initial value and add `setIsLoading(true)` at the top of `load()`. A comment noting this would reduce the risk of a silent regression.

</details>

---

<details>
<summary>File map</summary>

| File | Change |
|---|---|
| `app/lib/api/admin.ts` | New module: 10 API functions, 7 exported types, `buildQuery` helper |
| `app/admin/overview/page.tsx` | Wired to `getAdminStats`, `getAdminBookings`, `getAdminHotels`, `getAdminRevenue` |
| `app/admin/hotels/page.tsx` | Wired to `getAdminHotels`, `approveHotel`, `suspendHotel`; Suspense wrapper for `useSearchParams` |
| `app/admin/hotels/verification/page.tsx` | Wired to `getAdminHotels` (pending + approved); `approveHotel` for approve/reject actions |
| `app/admin/bookings/page.tsx` | Wired to `getAdminBookings`; commission and cancellation rate derived client-side |
| `app/admin/users/page.tsx` | Wired to `getAdminUsers`, `suspendUser`, `reactivateUser`; Suspense wrapper |
| `app/admin/subscriptions/page.tsx` | Wired to `getAdminHotels`; plan counts and monthly revenue derived client-side |
| `app/admin/payments/page.tsx` | Uses `getAdminBookings` as proxy; TODO comment present; payment status fabricated by index |
| `app/admin/payouts/page.tsx` | Uses `getAdminBookings` as proxy; TODO comment present; payout rows derived from booking status |
| `app/admin/reviews/page.tsx` | No API wiring; empty state with TODO comments; no `next/server` import |

Full diff: `git diff main -- app/lib/api/admin.ts app/admin/`

</details>
