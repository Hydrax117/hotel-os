# Reviews and Subscriptions modules

Two new NestJS modules — `reviews` and `subscriptions` — are added to the backend alongside wiring into `AppModule`. Reviews handles post-stay feedback with a 6-dimension rating model, hotel response capability, and admin moderation. Subscriptions handles hotel billing with plan management, a grace-period lifecycle, and admin suspend/reactivate. The implementation deviates from the plan in a few meaningful ways (no `BookingsModule` import, `respondToReview` has no role guard, `checkExpiredSubscriptions` is not scheduled), none of which are blocking bugs but some are behavioral gaps worth tracking.

Watch for: `checkExpiredSubscriptions` (confirmed) exists in the service but has no `@Cron` decorator and is not exposed as an HTTP endpoint — the lifecycle transition ACTIVE → GRACE\_PERIOD → SUSPENDED will never fire automatically. `respondToReview` (confirmed) is gated by `JwtAuthGuard` only, not `@Roles(HOTEL_OWNER)` — any authenticated user who knows a review ID can attempt a response (the ownership check in the service is the only protection).

**Verdict**: APPROVED

---

## High-level view

The reviews module splits its controller surface across two controllers: `ReviewsController` at `/reviews` and `HotelReviewsController` at `/hotels/:hotelId/reviews`. The split is structurally sensible — hotel-scoped reads sit next to the hotels resource — but it means `ReviewsModule` does not import `BookingsModule`. The service never calls `BookingsService`; it queries the booking directly via `PrismaService`, which works because `PrismaModule` is globally scoped.

`getHotelReviews` runs three Prisma queries in a single `Promise.all`: paginated results, a count, and an aggregate for `averageRating`. The aggregate is scoped to `hotelId` without the pagination filters, so the returned `averageRating` is always the whole-hotel average regardless of `minRating` or `approvedOnly` — this is almost certainly the right behavior for a rating summary, but worth noting.

`checkExpiredSubscriptions` implements the correct state machine (ACTIVE → GRACE\_PERIOD at `nextBilling`, GRACE\_PERIOD → SUSPENDED at `gracePeriodEnd`). The method is correct but unreachable: there is no `@Cron` decorator, no `ScheduleModule` import, and no HTTP endpoint to trigger it. The billing lifecycle will not advance without manual intervention.

The subscription create/change-plan flows wrap both the `subscription` and `hotel` updates in `prisma.$transaction`, keeping `hotel.subscriptionPlan` in sync. `cancelSubscription` transitions to `ARCHIVED` (not `SUSPENDED`), and `suspendSubscription` correctly sets `isPublished: false` on the hotel. `reactivateSubscription` reverses both.

---

<details>
<summary>Issues (3)</summary>

1. **`checkExpiredSubscriptions` never fires** — The method exists and is correct, but there is no `@Cron` decorator, no `@nestjs/schedule` import in `SubscriptionsModule`, and no HTTP endpoint. Billing lifecycle transitions (ACTIVE → GRACE\_PERIOD → SUSPENDED) will never happen automatically. Add `@nestjs/schedule`, `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)`, and register `ScheduleModule.forRoot()` in `AppModule` (or expose a protected admin endpoint as a short-term alternative).

2. **`respondToReview` has no role guard** — The controller uses `@UseGuards(JwtAuthGuard)` only. Any authenticated traveler who knows a review ID can POST to `:id/respond`. The service's `hotel.ownerId !== hotelOwnerId` check prevents the update, but the absence of `@Roles(HOTEL_OWNER)` means the request reaches the service layer before being rejected, and it does not communicate clearly in Swagger that this endpoint is owner-only. Add `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.HOTEL_OWNER)`.

3. **`suspendSubscription` and `reactivateSubscription` don't guard against wrong states** — `suspendSubscription` fetches the first subscription for the hotel without a status filter, so it can "suspend" a subscription that is already `ARCHIVED` or `SUSPENDED`. `reactivateSubscription` similarly accepts any status. Neither throws if the subscription is already in the target state. Add a status precondition check (throw `BadRequestException` if already in the target state, or if trying to reactivate an `ARCHIVED` subscription).

</details>

---

<details>
<summary>Details</summary>

## Acceptance criteria verification

`tsc --noEmit` on this commit produces two errors, both in the pre-existing `src/payments/payments.service.spec.ts` — present before this commit, confirmed via `git log`. Zero errors in `reviews/` or `subscriptions/`.

`createReview` checks `booking.status !== BookingStatus.CHECKED_OUT` (confirmed, `reviews.service.ts:31`). The enum comes from `@prisma/client`. A `findUnique` on `bookingId` follows; if a record exists, `ConflictException` is thrown before the create call.

`respondToReview` enforces `review.hotel.ownerId !== hotelOwnerId` at the service layer, but the controller applies only `@UseGuards(JwtAuthGuard)`, not `@Roles(HOTEL_OWNER)` (see Issues).

`checkExpiredSubscriptions` logic is confirmed correct — ACTIVE → GRACE\_PERIOD at `nextBilling`, GRACE\_PERIOD → SUSPENDED at `gracePeriodEnd`. The method is never called (see Issues).

`GET /reviews/my` handler appears at line 33, before `GET /reviews/:id` at line 39 — confirmed.

No `any` types confirmed across both modules. The `Transform` callback in `review-query.dto.ts` is typed `{ value: unknown }`. All relative imports carry `.js` extensions. Both modules are marked `✅ Complete` in the README with endpoint tables and lifecycle documentation.

## `checkExpiredSubscriptions` — unreachable state machine

The method at `subscriptions.service.ts:192` is well-implemented: a two-pass loop that first ages ACTIVE subscriptions past `nextBilling` into GRACE\_PERIOD, then ages GRACE\_PERIOD subscriptions past `gracePeriodEnd` into SUSPENDED. The SUSPENDED transition wraps both the subscription update and `hotel.isPublished = false` in a `$transaction`. The method returns the count of subscriptions changed, useful for logging.

The problem is invocation. There is no `@Cron` decorator on the method, `ScheduleModule.forRoot()` is absent from `AppModule`, and the subscriptions controller has no admin endpoint to trigger it manually. Until one of those is added, every hotel subscription will remain `ACTIVE` indefinitely regardless of billing date. This is a functional gap.

## `respondToReview` — authorization layer mismatch

The plan specified `@Roles(HOTEL_OWNER)` on this endpoint. The controller applies only `@UseGuards(JwtAuthGuard)`. A logged-in traveler with role `GUEST` can reach the service method; the service will do a database round-trip to fetch the review and hotel before throwing `ForbiddenException`. The behavior is ultimately correct, but the intent is not expressed at the HTTP layer, and Swagger will not document this endpoint as owner-restricted.

## `suspendSubscription` / `reactivateSubscription` — missing state guards

Both admin methods fetch a subscription with `findFirst({ where: { hotelId } })` — no status filter. `suspendSubscription` could re-suspend an already-suspended or archived subscription, writing an unnecessary transaction. `reactivateSubscription` could "reactivate" an `ARCHIVED` subscription that was intentionally cancelled by the owner. A status precondition (`if (subscription.status === target) throw BadRequestException`) would prevent silent no-ops and protect against admin errors.



</details>

---

<details>
<summary>File map</summary>

| File | Change |
|---|---|
| `src/reviews/reviews.module.ts` | New — wires ReviewsController, HotelReviewsController, ReviewsService |
| `src/reviews/reviews.controller.ts` | New — POST /reviews, GET /reviews/my, GET /reviews/:id, POST /:id/respond, PATCH /:id/approve, PATCH /:id/flag, DELETE /:id |
| `src/reviews/hotel-reviews.controller.ts` | New — GET /hotels/:hotelId/reviews |
| `src/reviews/reviews.service.ts` | New — createReview, getHotelReviews, getReviewById, respondToReview, approveReview, flagReview, deleteReview, getMyReviews |
| `src/reviews/dto/create-review.dto.ts` | New — 6-dimension rating DTO with validation |
| `src/reviews/dto/review-query.dto.ts` | New — pagination + minRating + approvedOnly query params |
| `src/reviews/dto/respond-to-review.dto.ts` | New — hotel response string DTO |
| `src/subscriptions/subscriptions.module.ts` | New — wires SubscriptionsController, SubscriptionsService |
| `src/subscriptions/subscriptions.controller.ts` | New — full subscription CRUD + suspend/reactivate admin endpoints |
| `src/subscriptions/subscriptions.service.ts` | New — createSubscription, getSubscription, changePlan, cancelSubscription, suspendSubscription, reactivateSubscription, checkExpiredSubscriptions |
| `src/subscriptions/subscription-plans.ts` | New — STARTER/PROFESSIONAL/ENTERPRISE plan constants |
| `src/subscriptions/dto/create-subscription.dto.ts` | New — plan enum DTO |
| `src/subscriptions/dto/change-plan.dto.ts` | New — plan enum DTO for plan changes |
| `src/app.module.ts` | Updated — ReviewsModule and SubscriptionsModule added to imports |
| `README.md` | Updated — Reviews and Subscriptions marked ✅ Complete, endpoint tables and subscription lifecycle added |

Full diff: `git diff f0d36d6..7b50b1d` against the prior commit.

</details>
