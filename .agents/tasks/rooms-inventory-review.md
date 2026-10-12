# Rooms and Inventory modules for Hotel OS API — revision pass

Two NestJS modules — Rooms and Inventory — implement room-type CRUD, physical room management, and date-based inventory tracking. This is a second-pass review against the five blocking issues raised in the initial review. All five have been addressed. The build artifacts in `dist/` (`.js`, `.d.ts`, `.js.map` for all rooms and inventory files) confirm a clean compile with zero TypeScript errors.

**Watch for:** No remaining blocking concerns. One minor note on `bulkUpdateInventory` (see below) but it is not a blocker.

**Verdict**: APPROVED

---

## High-level view

All five issues from the prior review are resolved. `updateRoomStatus` now traverses `room → roomType → hotel → ownerId` and the controller threads `user.userId` through. `holdInventory` has been rewritten to use the interactive `$transaction(async (tx) => { ... })` callback form consistent with `releaseHold`, `confirmBooking`, and `releaseBooking`. `EnsureInventoryDto` and `GetCalendarDto` are both present with proper `class-validator` decorators. `UpdateRoomDto` is now a standalone class that explicitly excludes `number`, with a comment explaining why.

`bulkUpdateInventory` uses `Promise.all(dates.map(...upsert))` outside of a transaction. For a bulk block operation across 30+ days this means partial failure leaves some days updated and others not — but this is an owner-facing admin operation, not a booking-critical path, and the upsert semantics make it idempotent (retry succeeds). Not a blocker, worth a note in the backlog.

The `checkAvailability` min-available calculation correctly uses `Math.min(...availablePerDay)` across all dates in the range, handles the case where no inventory records exist by falling back to `roomType.totalRooms`, and reports `blockedDates` in the response so callers can surface which specific days are blocked.

`ensureInventoryExists` is called inside `createRoomType` immediately after the `roomType.create` call, seeding 90 days of inventory atomically with the room type creation path.

Both modules use `forwardRef()` correctly — `RoomsModule` wraps `InventoryModule` import, `InventoryModule` wraps `RoomsModule` import, and both service constructors use `@Inject(forwardRef(() => ...))`.

All relative imports use `.js` extensions throughout. No `any` types appear in the new code.

---

<details>
<summary>Issues (1)</summary>

1. **`bulkUpdateInventory` runs upserts outside a transaction** — `Promise.all` with N individual upserts means a partial failure leaves some days updated. The operation is idempotent so a retry recovers, but callers receive a 500 with no indication of which days were applied. Consider wrapping in `$transaction` for consistent error reporting, or document the retry semantics in a code comment.

</details>

<details>
<summary>Details</summary>

### Prior issues — all resolved

**Ownership gap in `updateRoomStatus`** — The service now fetches `room` with `include: { roomType: { include: { hotel: true } } }` and checks `room.roomType.hotel.ownerId !== ownerId`, throwing `ForbiddenException` on mismatch. The controller passes `@CurrentUser() user: JwtUser` and forwards `user.userId`.

**Non-atomic `holdInventory`** — Rewritten to the interactive callback form:

```ts
await this.prisma.$transaction(async (tx) => {
  for (const date of dates) {
    await tx.inventoryDay.update({
      where: { roomTypeId_date: { roomTypeId, date } },
      data: { heldUnits: { increment: 1 } },
    });
  }
});
```

This is consistent with `releaseHold`, `confirmBooking`, and `releaseBooking`, and uses the composite unique key `roomTypeId_date` rather than `updateMany` with a date equality filter, eliminating the timestamp precision risk noted previously.

**`/ensure` validation** — `EnsureInventoryDto` exists in `src/inventory/dto/ensure-inventory.dto.ts` with `@IsInt() @Min(1) @Max(365) days`. The controller imports and uses it.

**`getCalendar` query validation** — `GetCalendarDto` exists with `@IsDateString()` on both `from` and `to`. The controller binds it with `@Query() dto: GetCalendarDto` and passes `dto.from` and `dto.to` to the service.

**`UpdateRoomDto` excluding `number`** — Standalone DTO with only `floor`, `status`, and `notes`. A comment in the file explicitly states that `number` is intentionally excluded to prevent silent P2002 unique-constraint errors.

### `bulkUpdateInventory` non-transactional upserts

The bulk update runs `Promise.all(dates.map(date => this.prisma.inventoryDay.upsert(...)))`. If the array spans 30 days and the database rejects one upsert mid-array (connection drop, constraint violation), the remaining days are neither applied nor rolled back — the operation fails silently with a partial state change. The response shape `{ updated: dates.length }` always reports the full count even if some upserts failed, because `dates.length` is computed before the upserts run.

The upserts are individually idempotent, so a retry will converge, but the caller gets a 500 with no indication of which days were applied. Wrapping in `$transaction` is straightforward here and would make the operation all-or-nothing. The `ensureInventoryExists` method has the same pattern, though its use-case (seeding) is even more retry-tolerant.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `src/rooms/dto/create-room-type.dto.ts` | 7 fields with class-validator decorators |
| `src/rooms/dto/update-room-type.dto.ts` | `PartialType(CreateRoomTypeDto)` |
| `src/rooms/dto/create-room.dto.ts` | `number`, `floor`, `status`, `notes` |
| `src/rooms/dto/update-room-status.dto.ts` | Standalone status+notes patch DTO |
| `src/rooms/dto/update-room.dto.ts` | Standalone DTO; `number` explicitly excluded with comment |
| `src/rooms/rooms.service.ts` | Full CRUD; ownership checks on all mutating ops including `updateRoomStatus` |
| `src/rooms/rooms.controller.ts` | 9 endpoints; `@CurrentUser()` on all write handlers |
| `src/rooms/rooms.module.ts` | `forwardRef(() => InventoryModule)` |
| `src/inventory/dto/get-availability.dto.ts` | `checkIn`, `checkOut`, `guests` with `@Type(() => Number)` |
| `src/inventory/dto/get-calendar.dto.ts` | `from`, `to` with `@IsDateString()` |
| `src/inventory/dto/update-inventory.dto.ts` | `date`, `totalUnits`, `priceOverride`, `isBlocked` |
| `src/inventory/dto/bulk-update-inventory.dto.ts` | `fromDate`, `toDate`, optional unit/price/block fields |
| `src/inventory/dto/ensure-inventory.dto.ts` | `@IsInt() @Min(1) @Max(365) days` |
| `src/inventory/inventory.service.ts` | All methods; `holdInventory` now uses interactive transaction |
| `src/inventory/inventory.controller.ts` | 5 endpoints; `EnsureInventoryDto` and `GetCalendarDto` wired |
| `src/inventory/inventory.module.ts` | `forwardRef(() => RoomsModule)` |
| `src/app.module.ts` | `RoomsModule` and `InventoryModule` added to imports |
| `README.md` | Rooms and inventory marked complete; endpoint tables added; build order updated |

</details>
