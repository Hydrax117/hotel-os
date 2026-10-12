# Payments module — Paystack integration, webhooks, refunds

The Payments module wires Paystack into the Hotel OS booking flow: initialize a transaction, confirm it via webhook or manual verify, and issue refunds. The implementation is structured around a dedicated `PaystackService` for all HTTP and crypto concerns, with `PaymentsService` owning the business logic and state transitions. The webhook path uses `rawBody: true` with `timingSafeEqual` for HMAC verification, and the downstream booking state machine is driven by calls into `BookingsService`.

Watch for: **(confirmed)** `verifyAndConfirmPayment` is unauthenticated — any caller with a reference string can trigger a booking confirmation or cancellation; **(confirmed)** refund endpoint has no role gate (any authenticated user can try to refund any payment they own); **(confirmed)** `VerifyPaymentDto` is missing `@IsNotEmpty()` — an empty string passes validation and will reach Paystack; **(confirmed)** commission rate is hardcoded at 0.1 rather than read from `ConfigService`; **(confirmed)** refund flow calls Paystack before creating the `Refund` record, so a Paystack timeout leaves the payment in `REFUNDED` status with no `Refund` row.

**Verdict**: NEEDS_CHANGES

---

## High-level view

The `PaystackService` abstraction is clean — HMAC verification with `timingSafeEqual`, all three Paystack calls wrapped in try/catch throwing `BadGatewayException`, no secrets logged. The separation of Paystack HTTP concerns from business logic in `PaymentsService` is the right design.

The webhook handler verifies the signature and checks for an already-terminal payment before delegating to `verifyAndConfirmPayment`, which satisfies the idempotency requirement. But `verifyAndConfirmPayment` is a `GET /payments/verify/:reference` endpoint with only a JWT guard, no ownership check — anyone who knows the reference can trigger the Paystack verify call and flip a booking into CONFIRMED or FAILED.

The refund path deviates from the plan in two important ways: it checks `payment.booking.userId !== userId` instead of requiring `SUPER_ADMIN`, and it calls `paystackService.createRefund` before writing the `Refund` record, creating a gap where Paystack processes the refund but the local record is never persisted if the database write fails.

The commission rate is hardcoded to `0.1` in `initializePayment` rather than read from `ConfigService`, contradicting both the plan and the README's documented `PLATFORM_COMMISSION_RATE` env variable.

`rawBody: true` is in place, `PaymentsModule` is registered in `AppModule`, ESM `.js` extensions are used throughout, and the README is updated with endpoints and the payment flow diagram — these all look correct.

---

<details>
<summary>Issues (7)</summary>

1. **Unauthenticated verify endpoint** — `GET /payments/verify/:reference` has a `JwtAuthGuard` but no ownership check; any authenticated user with a reference can confirm or cancel another user's booking. Add `payment.booking.userId !== user.userId` ownership guard inside `verifyAndConfirmPayment`, or keep the endpoint user-scoped and pass `userId` through.

2. **Hardcoded commission rate** — `initializePayment` uses `0.1` directly instead of `configService.get<number>('PLATFORM_COMMISSION_RATE') ?? 0.1`. `ConfigService` is not injected at all; `PaystackService` is injected instead. Add `ConfigService` to the constructor and read the rate from config.

3. **Refund write ordering** — `refundPayment` calls `paystackService.createRefund` before `prisma.refund.update` sets the status to `PROCESSING`. If the Prisma update fails after Paystack succeeds, the refund is processed externally but the local record stays in `PENDING` with no indication it was sent. Create the `Refund` record first, call Paystack second, then update status.

4. **Refund not admin-gated** — The plan specifies `SUPER_ADMIN` role for refunds; the controller uses only `JwtAuthGuard`. Any authenticated user can attempt a refund on their own booking without admin involvement. Add `RolesGuard` + `@Roles(UserRole.SUPER_ADMIN)` to the refund endpoint, or document the deliberate deviation.

5. **`@IsNotEmpty()` missing on `VerifyPaymentDto`** — `reference` has only `@IsString()`, so an empty string passes class-validator and reaches Paystack's verify endpoint. Add `@IsNotEmpty()`.

6. **`cancelBooking` called on `abandoned` payment** — `verifyAndConfirmPayment` calls `bookingsService.cancelBooking` when Paystack status is `'abandoned'`. `CancelBookingDto` is constructed inline as `{ reason: 'Payment failed' }` without the `reason` field being validated. Confirm this matches `CancelBookingDto`'s required fields, or this will throw a runtime error at the service boundary.

7. **Partial-refund amount guard missing** — `refundPayment` does not check `dto.amountNgn > payment.amountNgn` before calling Paystack. A value larger than the original payment will be sent to Paystack, which may reject it with a non-2xx response (caught by `BadGatewayException`), but the `Payment.status` has already been set to `REFUNDED` and the `Refund` record created before the call — leaving the records in an inconsistent state.

</details>

---

<details>
<summary>Details</summary>

## Webhook signature and idempotency

The try/catch around `timingSafeEqual` handles the length-mismatch exception that fires when a malformed or missing `x-paystack-signature` header is shorter than the 128-char HMAC hex — returns `false` cleanly rather than throwing into the controller.

The `handleWebhook` method checks for an existing `SUCCESS` or `FAILED` payment before doing anything else, satisfying the idempotency requirement. One edge worth noting: `handleWebhook` receives `payload: string` (the controller converts `req.rawBody` via `.toString()`), while `verifyWebhookSignature` passes it straight to `crypto.createHmac(...).update(payload)`. Node's HMAC `update` treats a bare string as UTF-8, which matches Paystack's signing convention — but if `req.rawBody` ever contains non-UTF-8 bytes, the signature comparison will fail silently. Passing the raw `Buffer` directly through both the controller and the service would eliminate this dependency on encoding assumptions.

## Unauthenticated verify path

`GET /payments/verify/:reference` is gated by `JwtAuthGuard` but the handler calls `verifyAndConfirmPayment(reference)` with no user context passed in. The service method does not check whether the calling user owns the booking. Any authenticated user who knows a payment reference can trigger a booking state transition — confirming or cancelling someone else's booking. This is a **confirmed** access-control gap. The fix is either to pass `user.userId` through and add an ownership check in `verifyAndConfirmPayment`, or to scope the endpoint to the booking owner only.

## Refund access control and ordering

The plan designates the refund endpoint as `SUPER_ADMIN`-only. The controller has `@UseGuards(JwtAuthGuard)` only — no `RolesGuard`, no `@Roles` decorator. The service enforces `payment.booking.userId !== userId`, which means any guest can refund their own payment. Whether this is an intentional deviation from the plan or an oversight is unclear, but it is a confirmed divergence.

The ordering issue is more serious for data integrity. The current flow in `refundPayment`:

1. Create `Refund` record in `PENDING`
2. Call `paystackService.createRefund` (Paystack API)
3. Update `Refund` record to `PROCESSING`

If step 3 fails, the Paystack refund has been submitted but the local record stays in `PENDING`. This makes it impossible to distinguish "not yet submitted" from "submitted but not updated" without querying Paystack. The correct order is: create local record → call Paystack → update status. More critically, the `Payment.status` is never updated to `REFUNDED` in the current code — there is no `prisma.payment.update` call in `refundPayment`. The payment remains in `SUCCESS` status after a refund is issued, which breaks downstream checks that use `payment.status !== PaymentStatus.SUCCESS` as a guard.

Also absent: the `bookingsService.cancelBooking` call that the plan specified should accompany a refund. The refund flow does not transition the booking out of `CONFIRMED` status.

## Hardcoded commission and missing ConfigService

`initializePayment` uses:
```ts
const commission = Math.round(totalNgn * 0.1);
```

`ConfigService` is not in the constructor at all. The README documents `PLATFORM_COMMISSION_RATE` as an env variable; the plan specifies reading it via `ConfigService`. This is a confirmed divergence — the rate cannot be changed without a code deploy.

## `VerifyPaymentDto` validation gap

```ts
export class VerifyPaymentDto {
  @IsString()
  reference!: string;
}
```

Missing `@IsNotEmpty()`. An empty string passes `@IsString()` and will be sent to Paystack's verify endpoint as `/transaction/verify/`, which will return a 404 from Paystack — caught by `BadGatewayException`. A minor correctness issue but easily fixed.

## Route ordering

The controller declares routes in this order: `webhook` → `initialize` → `verify/:reference` → `booking/:bookingId` → `hotel/:hotelId` → `:paymentId/refund`. All static-path routes precede the catch-all `:paymentId/refund` — no route shadowing.

## ESM imports

All relative imports in the five new files use `.js` extensions. The `main.ts` import of `AppModule` (`from './app.module'`) is missing the extension, but that is a pre-existing pattern outside this diff's scope.

## Test coverage

No unit tests were written (`payments.service.spec.ts` does not exist). The plan included a full test matrix: guard assertions for `initializePayment`, idempotency verification for `verifyAndConfirmPayment`, signature rejection for `handleWebhook`, and refund guard checks for `issueRefund`. None of these are present. This is not a blocking concern for a first implementation pass, but the gaps in the webhook idempotency and refund ordering paths are exactly the cases that tests would have caught.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `src/payments/dto/initialize-payment.dto.ts` | New — `bookingId`, `email`, optional `callbackUrl` |
| `src/payments/dto/verify-payment.dto.ts` | New — `reference` field only, missing `@IsNotEmpty()` |
| `src/payments/dto/refund-payment.dto.ts` | New — `reason`, optional `amountNgn`; missing `@Min(1)` from plan |
| `src/payments/paystack.service.ts` | New — initialize, verify, refund HTTP calls + `timingSafeEqual` webhook verification |
| `src/payments/payments.service.ts` | New — initialize, verify, webhook handler, refund, booking/hotel payment queries |
| `src/payments/payments.controller.ts` | New — five endpoints; webhook before parameterised routes |
| `src/payments/payments.module.ts` | New — imports `PrismaModule`, `BookingsModule`; provides and exports `PaystackService` |
| `src/app.module.ts` | Added `PaymentsModule` import |
| `src/main.ts` | Added `rawBody: true` to `NestFactory.create` options |
| `README.md` (hotel-os-api) | Payments marked ✅; endpoints table and payment flow added |

Full diff: `git diff main -- src/payments/ src/main.ts src/app.module.ts README.md` from `c:\Users\Pkaka\music\hotel-os-api`

</details>
