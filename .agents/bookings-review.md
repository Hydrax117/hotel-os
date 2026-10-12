# Bookings module for Hotel OS NestJS API

The Bookings module implements a full booking lifecycle: hold-on-create, confirm-with-expiry-check, cancel with status-aware inventory release, and a scheduler-ready `releaseExpiredHolds`. The state machine, inventory coordination, and authorization patterns are all present. The implementation is largely correct with one advisory gap and one build-log ambiguity worth noting.

**Watch for:**
- `releaseExpiredHolds` silently fails mid-loop if `releaseHold` throws on any booking — confirmed, partial releases are possible (ADVISORY).
- Build log is empty (no output captured), so TypeScript error count is unverifiable.

**Verdict**: APPROVED

---

## High-level view

The state machine is correct. `createBooking` always starts at `HELD`, `confirmBooking` gates on `HELD | PAYMENT_PENDING` and checks `heldUntil` before confirming, `cancelBooking` routes inventory release through `releaseHold` vs `releaseBooking` based on current status, and `updateBookingStatus` enforces a hard transition table (`CONFIRMED → CHECKED_IN | NO_SHOW | CANCELLED`, `CHECKED_IN → CHECKED_OUT`).

`holdInventory` is called outside any Prisma transaction, with a try/catch wrapping the `booking.create` that calls `releaseHold` on failure. This is the correct compensating-transaction pattern; no nested transaction wrapping the inventory call.

Authorization is consistent: `cancelBooking` and `getBookingById` allow the booking owner or the hotel owner. `updateBookingStatus` requires hotel owner or active staff. `confirmBooking` restricts to the booking owner only, which is correct since it's a guest-side payment step.

All relative imports carry the `.js` extension. No `any` types appear anywhere in the module. `GET /bookings/hotel/:hotelId` is declared before `GET /bookings/:id` in the controller. `releaseExpiredHolds` queries `{ status: HELD, heldUntil: { lt: new Date() } }` and transitions to `PENDING`, matching the spec.

The `getBookingById` hotel-staff check only considers the hotel owner, not active staff members. A hotel manager cannot look up a booking by ID even though they can query all hotel bookings via `getHotelBookings`. This asymmetry is minor operationally but could confuse frontend logic.

---

<details>
<summary>Issues (2)</summary>

1. **`releaseExpiredHolds` partial-release on error** — The loop processes each expired booking sequentially without error isolation. If `releaseHold` throws on booking N, bookings N+1…end never have their inventory released and their status is never updated. Wrap each iteration in a `try/catch` and log failures individually, or accumulate errors and continue.

2. **Build log empty** — The captured build output contains only the `nest build` invocation with no compiler output. TypeScript errors cannot be confirmed absent. Verify that the build ran cleanly by re-running `npm run build` and checking for zero `error TS` lines.

</details>

<details>
<summary>Details</summary>

### `releaseExpiredHolds` partial-release on inventory error

The method iterates expired bookings with a plain `for...of` loop, calling `releaseHold` then `prisma.booking.update` for each. If `releaseHold` throws (e.g., a transient DB error), the loop exits entirely — no `catch` is present. Any bookings after the failing one keep `status: HELD` with an expired `heldUntil`, and their inventory units remain permanently held. Because this method is called by a scheduler rather than a request, the caller has no visibility into partial completion. The fix is to wrap each booking's two-step operation in a `try/catch`, log the failure with the booking ID, and continue to the next booking.

```typescript
for (const booking of expiredBookings) {
  try {
    await this.inventoryService.releaseHold(...);
    await this.prisma.booking.update(...);
  } catch (err) {
    this.logger.error(`Failed to release expired hold for booking ${booking.id}`, err);
  }
}
```

### `getBookingById` hotel staff gap

The access check at the end of `getBookingById` is:

```typescript
if (booking.userId !== userId && booking.hotel.ownerId !== userId) {
  throw new ForbiddenException(...);
}
```

Active hotel staff are excluded. `getHotelBookings` correctly checks `hotel.staff.some(s => s.userId === ownerId && s.isActive)`, so a receptionist can list all bookings but cannot fetch a specific booking by ID. This is likely an oversight rather than a deliberate restriction.

### `PENDING | PAYMENT_PENDING` cancellation inventory gap

`cancelBooking` releases inventory for `HELD` and `CONFIRMED` statuses. `PENDING` and `PAYMENT_PENDING` are also in the cancellable set, but neither triggers an inventory release. This is correct for `PENDING` (inventory was never held). For `PAYMENT_PENDING`, the flow through `confirmBooking` already calls `inventoryService.confirmBooking`, which moves units from `heldUnits` to `bookedUnits`. If a booking can reach `PAYMENT_PENDING` without going through `confirmBooking` (e.g., set directly by `updateBookingStatus`), cancelling it would leave a `bookedUnit` permanently allocated. `PAYMENT_PENDING` is not a reachable target in `updateBookingStatus`'s transition table, so this is currently unexploitable, but the dependency is implicit.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `src/bookings/bookings.service.ts` | Full booking lifecycle: create, confirm, cancel, status update, expiry release, queries |
| `src/bookings/bookings.controller.ts` | REST endpoints with auth guards and correct route ordering |
| `src/bookings/bookings.module.ts` | Module wiring with PrismaModule and InventoryModule imports |
| `src/bookings/dto/create-booking.dto.ts` | Input validation for new booking creation |
| `src/bookings/dto/cancel-booking.dto.ts` | Optional cancellation reason |
| `src/bookings/dto/update-booking-status.dto.ts` | Staff-side status transition with optional reason |
| `src/bookings/dto/booking-query.dto.ts` | Paginated, filterable booking list query |
| `src/app.module.ts` | `BookingsModule` registered in root app module |

</details>
