# Implementation Plan — Payments Module (NestJS API)

## Project location

The NestJS API lives at **`c:\Users\Pkaka\music\hotel-os-api`** — NOT inside the
`hotel-os` frontend workspace. All paths below are relative to that root.

---

## Findings from codebase exploration

### 1. Import paths (ESM — `.js` extension required on all relative imports)

Every relative import in the existing codebase carries a `.js` extension (confirmed
across `bookings.service.ts`, `bookings.controller.ts`, `bookings.module.ts`,
`inventory.service.ts`, `app.module.ts`). New payments files must follow the same
convention.

Examples:
```ts
import { PrismaService }   from '../prisma/prisma.service.js';
import { BookingsService } from '../bookings/bookings.service.js';
import { JwtAuthGuard }    from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser }     from '../auth/decorators/current-user.decorator.js';
import { type JwtUser }    from '../auth/strategies/jwt.strategy.js';
```

### 2. Prisma model field names (from `prisma/schema.prisma`)

**Payment model** (all fields):
- `id`, `bookingId` (FK, `@unique`), `reference` (`@unique`), `amountNgn`, `commissionNgn`, `netNgn`
- `status` → enum `PaymentStatus { PENDING PROCESSING SUCCESS FAILED REFUNDED }`
- `provider` (String, default `"paystack"`), `providerRef` (String?), `method` (String?)
- `paidAt` (DateTime?), `failedAt` (DateTime?), `failureReason` (String?)
- `createdAt`, `updatedAt`
- Relations: `booking Booking`, `refund Refund?`, `payoutItem PayoutItem?`

**Refund model** (all fields):
- `id`, `paymentId` (FK, `@unique`), `amountNgn`, `reason`, `processedAt` (DateTime?)
- `status` → enum `RefundStatus { PENDING PROCESSING COMPLETED FAILED }`
- `createdAt`
- Relation: `payment Payment`

**Booking model** (fields relevant to payments):
- `id`, `reference`, `userId`, `hotelId`, `roomTypeId`
- `subtotalNgn`, `serviceFeeNgn`, `totalNgn` (all `Decimal @db.Decimal(12, 2)`)
- `status` → enum `BookingStatus { PENDING HELD PAYMENT_PENDING CONFIRMED CHECKED_IN CHECKED_OUT CANCELLED NO_SHOW FAILED }`
- `heldUntil` (DateTime?), `confirmedAt` (DateTime?), `cancelledAt` (DateTime?)
- Relation: `payment Payment?`

**Important**: Prisma `Decimal` fields come back as `Decimal` objects (not plain
`number`). Use `.toNumber()` when doing arithmetic or `Number(...)` when needed.

### 3. BookingsService method signatures

```ts
// Advance booking to CONFIRMED; also calls inventoryService.confirmBooking()
confirmBooking(bookingId: string, userId: string): Promise<Booking>
  // Throws ForbiddenException if booking.userId !== userId
  // Throws BadRequestException if status is not HELD|PAYMENT_PENDING
  // Throws BadRequestException if heldUntil is expired

// Cancel booking; releases inventory for HELD and CONFIRMED statuses
cancelBooking(bookingId: string, userId: string, dto: CancelBookingDto): Promise<Booking>
  // Throws ForbiddenException if user is neither the booker nor the hotel owner

// NOT a direct call into PaymentsService — the payment webhook calls BookingsService.confirmBooking()
```

PaymentsService will call `bookingsService.confirmBooking(booking.id, booking.userId)`
from the `verifyPayment` flow once the payment provider confirms success. This means
PaymentsModule must import BookingsModule (or at least BookingsService via its exports).

BookingsModule already exports `BookingsService` — confirmed in
`src/bookings/bookings.module.ts`.

### 4. What needs to change in main.ts and app.module.ts

**`src/main.ts`** — No changes needed. The global prefix (`api/v1`), CORS, ValidationPipe,
and Swagger config are already in place and apply automatically to the new module.

**`src/app.module.ts`** — One change: add `PaymentsModule` to the `imports` array and
add the corresponding import line with `.js` extension:
```ts
import { PaymentsModule } from './payments/payments.module.js';
// then add PaymentsModule to @Module({ imports: [...] })
```

### 5. JwtUser shape (from `src/auth/strategies/jwt.strategy.ts`)

```ts
interface JwtUser {
  userId: string;   // from JWT sub claim
  email: string;
  role: string;     // UserRole enum value as string
}
```

The `@CurrentUser()` decorator returns this shape. Access the user ID via
`user.userId` in controller handlers.

### 6. Existing guards and decorators

- `JwtAuthGuard` — `src/auth/guards/jwt-auth.guard.ts` — extends `AuthGuard('jwt')`
- `RolesGuard` — `src/auth/guards/roles.guard.ts` — reads `@Roles(...)` metadata,
  checks `user.role` from the JWT
- `@Roles(...)` decorator — `src/auth/decorators/roles.decorator.ts`
- `@CurrentUser()` decorator — `src/auth/decorators/current-user.decorator.ts`

SUPER_ADMIN-only endpoints should apply both `@UseGuards(JwtAuthGuard, RolesGuard)`
and `@Roles(UserRole.SUPER_ADMIN)`.

### 7. Build and test commands (from `hotel-os-api/package.json`)

- Build: `npm run build` (uses `nest build`)
- Unit tests: `npm run test` (uses `vitest run`)
- Lint: `npm run lint` (uses `oxlint`)
- Working directory for all commands: `c:\Users\Pkaka\music\hotel-os-api`

### 8. Gotchas

- **No scheduler package yet** — `@nestjs/schedule` is not in `package.json`.
  The `releaseExpiredHolds` pattern in BookingsService uses a plain service method
  called from a scheduler. If this plan adds a payments scheduler, install the package
  first. For MVP the webhook-driven flow doesn't require a scheduler; skip it unless
  specifically needed.
- **PayoutItem and Payout** — the Prisma schema already defines `Payout`, `PayoutItem`,
  `PayoutStatus`. Payouts are a separate concern from the Payments module but
  `Payment.payoutItem` links them. The Payments module should NOT manage payouts
  directly; leave that for a future PayoutsModule.
- **`Decimal` arithmetic** — `Payment.amountNgn`, `commissionNgn`, `netNgn` and
  `Refund.amountNgn` are Prisma `Decimal` objects. Prisma auto-coerces plain number
  literals in `create`/`update` calls, but comparisons and arithmetic in TypeScript
  code need `.toNumber()`.
- **`reference` uniqueness** — both `Booking.reference` and `Payment.reference` are
  `@unique`. Generate payment references with a different prefix (e.g. `PAY-xxxxx`)
  to avoid confusion with booking references (`HOS-xxxxx`).
- **`BookingsModule` already exports `BookingsService`** — confirmed. PaymentsModule
  can safely import BookingsModule and inject BookingsService without any additional
  module change.
- **Commission calculation** — the spec says ~10% platform commission, but the exact
  rate should come from a config/env variable (`PLATFORM_COMMISSION_RATE`), not a
  hardcoded constant, to allow admin configuration later.
- **Paystack webhook signature** — Paystack signs webhook payloads with HMAC-SHA512
  using the secret key. Verify with `crypto.createHmac('sha512', secret).update(body).digest('hex')`.
  The raw body must be compared (`===`) to the `x-paystack-signature` header.
  NestJS body parser converts the body to a parsed object by default — the webhook
  endpoint needs `@Headers('x-paystack-signature')` and must use the **raw body**.
  Use a `RawBodyMiddleware` or register the endpoint with `express.raw()` middleware
  for the `/payments/webhook` route only, OR use `NestFactory.create({ rawBody: true })`
  (NestJS 10+ feature, available in NestJS 12).
- **`rawBody: true`** is the cleanest option. Add it to `NestFactory.create(AppModule, { rawBody: true, instrument: ObserveInstrument })` in `main.ts` and inject `RawBodyRequest` in the webhook handler.

---

## Step-by-step file creation order

- [ ] 1. Add `rawBody: true` option to `NestFactory.create` in `src/main.ts`.
      The webhook signature verification requires access to the raw request body.
      NestJS 12 supports `rawBody: true` natively in the create options.
      Files: `src/main.ts`
      Verify: `npm run build` from `c:\Users\Pkaka\music\hotel-os-api` — zero TypeScript errors.

- [ ] 2. Create `src/payments/dto/initialize-payment.dto.ts`.
      Single field: `@IsString() @IsNotEmpty() bookingId: string`.
      Decorated with class-validator. Import from `class-validator`.
      Files: `src/payments/dto/initialize-payment.dto.ts`
      Verify: `npm run build` — zero errors.

- [ ] 3. Create `src/payments/dto/verify-payment.dto.ts`.
      Single field: `@IsString() @IsNotEmpty() reference: string`.
      This is the Paystack payment reference returned after initialization.
      Files: `src/payments/dto/verify-payment.dto.ts`
      Verify: `npm run build` — zero errors.

- [ ] 4. Create `src/payments/dto/refund-payment.dto.ts`.
      Fields:
      - `@IsString() @IsNotEmpty() paymentId: string`
      - `@IsString() @IsNotEmpty() reason: string`
      - `@IsOptional() @IsNumber() @Min(1) amountNgn?: number` (partial refund amount;
        if omitted, full refund of `payment.amountNgn` is issued)
      Files: `src/payments/dto/refund-payment.dto.ts`
      Verify: `npm run build` — zero errors.

- [ ] 5. Create `src/payments/payments.service.ts`.
      Implements the core payment logic. Injectable service.
      Constructor injects `PrismaService`, `BookingsService`, `ConfigService`.
      Use `ConfigService` for `PAYSTACK_SECRET_KEY` and `PLATFORM_COMMISSION_RATE`
      (default `0.1`).

      **Methods to implement:**

      `initializePayment(userId: string, dto: InitializePaymentDto): Promise<{ authorizationUrl: string; reference: string; paymentId: string }>`
      - Load booking from DB: `prisma.booking.findUnique({ where: { id: dto.bookingId }, include: { payment: true } })`
      - Guard: throw `NotFoundException` if not found; throw `ForbiddenException` if `booking.userId !== userId`
      - Guard: throw `BadRequestException` if `booking.status !== BookingStatus.HELD && booking.status !== BookingStatus.PAYMENT_PENDING`
      - Guard: throw `BadRequestException` if booking already has a payment with status `SUCCESS`
      - Generate payment reference: `PAY-${Math.floor(10000 + Math.random() * 90000)}`; loop
        until unique (same pattern as booking reference generation in BookingsService).
      - Calculate `commissionNgn = Math.round(booking.totalNgn.toNumber() * commissionRate)`,
        `netNgn = booking.totalNgn.toNumber() - commissionNgn`.
      - Upsert the Payment record: if `booking.payment` already exists (status not SUCCESS),
        update it; otherwise create. Fields: `reference`, `amountNgn`, `commissionNgn`,
        `netNgn`, `status: PaymentStatus.PENDING`, `provider: 'paystack'`.
      - Call Paystack initialize endpoint (`https://api.paystack.co/transaction/initialize`)
        via `fetch` with `Authorization: Bearer <secret>`, body `{ email, amount: amountKobo, reference, callback_url }`.
        Amount in kobo: `Math.round(booking.totalNgn.toNumber() * 100)`.
      - On Paystack error, update Payment status to `FAILED`, throw `BadRequestException`.
      - Update booking status to `PAYMENT_PENDING`.
      - Return `{ authorizationUrl, reference, paymentId: payment.id }`.

      `verifyPayment(reference: string, userId: string): Promise<Payment>`
      - Load payment: `prisma.payment.findUnique({ where: { reference }, include: { booking: true } })`
      - Guard: throw `NotFoundException` if not found.
      - Guard: throw `ForbiddenException` if `payment.booking.userId !== userId`.
      - Guard: if already `SUCCESS`, return payment immediately (idempotent).
      - Call Paystack verify endpoint (`https://api.paystack.co/transaction/verify/${reference}`).
      - If Paystack status is `success`:
        - Update payment: `status: PaymentStatus.SUCCESS`, `paidAt: new Date()`,
          `providerRef: data.id`, `method: data.channel`.
        - Call `bookingsService.confirmBooking(payment.booking.id, payment.booking.userId)`.
      - If Paystack status is `failed`:
        - Update payment: `status: PaymentStatus.FAILED`, `failedAt: new Date()`,
          `failureReason: data.gateway_response`.
        - Update booking status to `BookingStatus.FAILED`.
      - Return updated payment.

      `handleWebhook(signature: string, rawBody: Buffer): Promise<void>`
      - Verify signature: `crypto.createHmac('sha512', secret).update(rawBody).digest('hex')`;
        if it doesn't match `signature`, throw `UnauthorizedException`.
      - Parse JSON from `rawBody.toString('utf-8')`.
      - Switch on `event`:
        - `charge.success`: call internal `_handleChargeSuccess(data)`.
        - `charge.failed`: call internal `_handleChargeFailed(data)`.
        - Other events: log and return (no-op — idempotent).

      `_handleChargeSuccess(data: PaystackChargeData): Promise<void>` (private)
      - Load payment by `reference: data.reference`. If not found, log and return (no-op).
      - If already `SUCCESS`, return immediately (idempotency).
      - Update payment to `SUCCESS`, set `paidAt`, `providerRef`, `method`.
      - Call `bookingsService.confirmBooking(payment.booking.id, payment.booking.userId)`.

      `_handleChargeFailed(data: PaystackChargeData): Promise<void>` (private)
      - Load payment by `reference: data.reference`. If not found, return.
      - If already `FAILED`, return (idempotency).
      - Update payment to `FAILED`, set `failedAt`, `failureReason`.
      - Update booking to `BookingStatus.FAILED`.

      `issueRefund(paymentId: string, adminUserId: string, dto: RefundPaymentDto): Promise<Refund>`
      - This is an admin-only operation (caller must have `SUPER_ADMIN` role, enforced in controller).
      - Load payment: `prisma.payment.findUnique({ where: { id: paymentId }, include: { refund: true, booking: true } })`.
      - Guard: throw `NotFoundException` if not found.
      - Guard: throw `BadRequestException` if payment status is not `SUCCESS`.
      - Guard: throw `BadRequestException` if a `Refund` already exists for this payment.
      - Amount: use `dto.amountNgn ?? payment.amountNgn.toNumber()`.
      - Guard: throw `BadRequestException` if `amount > payment.amountNgn.toNumber()`.
      - Create `Refund` record: `{ paymentId, amountNgn: amount, reason: dto.reason, status: RefundStatus.PENDING }`.
      - Update `Payment.status` to `PaymentStatus.REFUNDED`.
      - Call `bookingsService.cancelBooking(payment.booking.id, payment.booking.userId, { reason: dto.reason })`.
      - Return created `Refund`.

      `getPaymentByBookingId(bookingId: string, userId: string): Promise<Payment>`
      - `prisma.payment.findUnique({ where: { bookingId }, include: { booking: true, refund: true } })`.
      - Guard: throw `NotFoundException` if not found.
      - Guard: throw `ForbiddenException` if `payment.booking.userId !== userId`.
      - Return payment.

      Files: `src/payments/payments.service.ts`
      Verify: `npm run build` — zero TypeScript errors.

- [ ] 6. Create `src/payments/payments.controller.ts`.
      Pattern: follow `src/bookings/bookings.controller.ts` exactly.

      ```ts
      @ApiTags('payments')
      @Controller('payments')
      export class PaymentsController { ... }
      ```

      Endpoints:
      - `POST /payments/initialize` — `@UseGuards(JwtAuthGuard)` — calls `initializePayment(user.userId, dto)`
      - `POST /payments/verify` — `@UseGuards(JwtAuthGuard)` — calls `verifyPayment(dto.reference, user.userId)`
      - `POST /payments/webhook` — **no auth guard** — raw body endpoint; inject `@Headers('x-paystack-signature')` and `@Req() req: RawBodyRequest<Request>` (type from `@nestjs/common`); calls `handleWebhook(signature, req.rawBody)`
      - `GET /payments/booking/:bookingId` — `@UseGuards(JwtAuthGuard)` — calls `getPaymentByBookingId(bookingId, user.userId)`
      - `POST /payments/:id/refund` — `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.SUPER_ADMIN)` — calls `issueRefund(id, user.userId, dto)`

      Import `RawBodyRequest` from `@nestjs/common`.
      Import `Request` from `express` (already a transitive dependency via `@nestjs/platform-express`).
      Import `UserRole` from `@prisma/client`.
      Import `Roles` from `'../auth/decorators/roles.decorator.js'`.
      Import `RolesGuard` from `'../auth/guards/roles.guard.js'`.

      The webhook endpoint must declare route before any `:id` param routes to avoid
      route shadowing (same rule as in BookingsController).

      Files: `src/payments/payments.controller.ts`
      Verify: `npm run build` — zero errors.

- [ ] 7. Create `src/payments/payments.module.ts`.
      ```ts
      @Module({
        imports: [PrismaModule, BookingsModule],
        controllers: [PaymentsController],
        providers: [PaymentsService],
        exports: [PaymentsService],
      })
      export class PaymentsModule {}
      ```
      Imports `PrismaModule` (for `PrismaService`) and `BookingsModule` (for
      `BookingsService`). No `forwardRef` needed — the dependency graph is
      PaymentsModule → BookingsModule → InventoryModule, which is acyclic.
      All import paths use `.js` extension.
      Files: `src/payments/payments.module.ts`
      Verify: `npm run build` — zero errors.

- [ ] 8. Register `PaymentsModule` in `src/app.module.ts`.
      Add to the `imports` array:
      ```ts
      import { PaymentsModule } from './payments/payments.module.js';
      // add PaymentsModule to @Module({ imports: [..., PaymentsModule] })
      ```
      Files: `src/app.module.ts`
      Verify: `npm run build` — zero errors.

- [ ] 9. Write unit tests in `src/payments/payments.service.spec.ts`.
      Use Vitest (the project's test runner — confirmed in `package.json`).
      Follow the pattern in `src/search/search.service.spec.ts` (the only existing
      spec file in the project). Mock `PrismaService`, `BookingsService`, and
      `ConfigService` using Vitest's `vi.fn()` and `vi.mock()`.
      Test cases:
      - `initializePayment`: throws `NotFoundException` when booking not found; throws
        `ForbiddenException` when `booking.userId !== userId`; throws `BadRequestException`
        when booking status is not `HELD/PAYMENT_PENDING`; creates Payment record and
        returns authorization URL on success.
      - `verifyPayment`: returns existing payment immediately when already `SUCCESS`;
        calls `bookingsService.confirmBooking` on Paystack `success` status; updates
        payment to `FAILED` on Paystack `failed` status.
      - `handleWebhook`: throws `UnauthorizedException` on invalid signature; processes
        `charge.success` event; is idempotent on duplicate events.
      - `issueRefund`: throws `BadRequestException` if payment is not `SUCCESS`; creates
        refund and cancels booking on valid input.
      Files: `src/payments/payments.service.spec.ts`
      Verify: `npm run test` from `c:\Users\Pkaka\music\hotel-os-api` — all new tests pass.

- [ ] 10. Final build and test verification.
       Run `npm run build && npm run test` from `c:\Users\Pkaka\music\hotel-os-api`.
       Expected: zero TypeScript compile errors, all tests pass.
       Files: no changes — verification step only.
       Verify: exit code 0 for both commands.

---

## Architecture decisions

**PaymentsService depends on BookingsService (not the other way around).**
BookingsService already exposes `confirmBooking` and `cancelBooking`. Having
PaymentsService call into BookingsService keeps the booking state machine as the
single source of truth for status transitions. The dependency is acyclic (Payments →
Bookings → Inventory), so no `forwardRef` is needed.

**Webhook signature uses the raw body.**
NestJS 12 supports `rawBody: true` in `NestFactory.create`. This is the cleanest
approach — the webhook controller receives `req.rawBody` as a `Buffer` without any
custom middleware. The `main.ts` change is the only setup needed.

**No `@nestjs/schedule` for this module.**
Hold expiry is already handled by `BookingsService.releaseExpiredHolds`, which is a
scheduler-ready method. Adding a cron job for payments (e.g. re-querying failed
verifications) is out of scope for MVP. If added later, install
`@nestjs/schedule` and call it from a dedicated scheduler module rather than
inside PaymentsModule.

**Commission rate comes from env config.**
`PLATFORM_COMMISSION_RATE` read via `ConfigService.get<number>('PLATFORM_COMMISSION_RATE') ?? 0.1`
makes the rate configurable without a deploy. The `.env` file in `hotel-os-api`
already uses `ConfigModule.forRoot({ envFilePath: '.env' })`.

**Paystack calls use native `fetch`.**
Node 18+ (and the project targets NestJS 12 / TypeScript 6, which implies a modern
Node runtime) ships native `fetch`. No `axios` or `node-fetch` install needed. This
avoids adding a dependency for two HTTP calls.

**Refund is admin-only for MVP.**
The `SUPER_ADMIN` role guard on the refund endpoint prevents hotel owners from
issuing refunds directly. This matches the spec's "Admin: issue/refund bookings"
capability and avoids complex partial-refund flows for now.

---

## Environment variables needed (add to `.env` and `.env.example`)

```
PAYSTACK_SECRET_KEY=sk_test_...
PLATFORM_COMMISSION_RATE=0.1
```

These are read by `PaymentsService` via `ConfigService`. If not set, the service will
fail at runtime when calling Paystack; add validation in the module if desired.
