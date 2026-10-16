# Implementation Plan — Three Fixes

## Files Confirmed Read

### Backend (c:\Users\Pkaka\music\hotel-os-api)
- `src/subscriptions/subscriptions.service.ts` — `createSubscription`, `verifyHotelOwnership`, SUBSCRIPTION_PLANS price lookup confirmed
- `src/subscriptions/subscriptions.controller.ts` — existing routes confirmed; no Paystack initialize/verify routes present
- `src/subscriptions/subscription-plans.ts` — STARTER=25000, PROFESSIONAL=50000, ENTERPRISE=150000 (priceNgn)
- `src/subscriptions/subscriptions.module.ts` — imports PrismaModule only; SubscriptionsService exported
- `src/subscriptions/dto/create-subscription.dto.ts` — `@IsEnum(SubscriptionPlan) plan`
- `src/subscriptions/dto/change-plan.dto.ts` — same pattern
- `src/hotels/hotels.service.ts` — `create`, `update`, `getMyHotel`, `updateVerificationStatus`; `verifyHotelOwnership` NOT present (only in subscriptions.service); need to add `publishHotel`/`unpublishHotel`
- `src/hotels/hotels.controller.ts` — route order confirmed: `GET /`, `GET my`, `GET admin/pending`, `GET slug/:slug`, `GET :id`, `POST /`, `PATCH :id`, `PATCH :id/verify`, images/docs sub-routes
- `src/hotel-applications/hotel-applications.service.ts` — REJECTED delete-and-reapply confirmed; `approveApplication` sets `isActive:true, isPublished:false`
- `src/auth/auth.service.ts` — register accepts role from DTO (TRAVELER or HOTEL_OWNER)
- `src/auth/dto/register.dto.ts` — role field optional, accepts TRAVELER or HOTEL_OWNER only
- `.env.example` — PAYSTACK_SECRET_KEY and FRONTEND_URL both present; `.env` already has them set

### Frontend (c:\Users\Pkaka\music\hotel-os)
- `app/dashboard/subscription/page.tsx` — `handleConfirm` has TODO for Paystack; currently calls `createSubscription` directly
- `app/lib/api/onboarding.ts` — `createSubscription` function present, POSTs to `/api/v1/subscriptions/hotels/:hotelId`
- `app/lib/api/dashboard.ts` — `DashboardHotel.isPublished?: boolean` confirmed; `publishHotel`/`unpublishHotel` NOT present
- `app/lib/api/client.ts` — `apiClient.patch()` available; `ApiError` exported
- `app/dashboard/profile/page.tsx` — minimal `isPublished===false` banner only; no publish/unpublish button
- `app/onboarding/layout.tsx` — wraps with `OnboardingProvider` + `OnboardingAuthGuard`; confirmed present
- `app/onboarding/components/OnboardingAuthGuard.tsx` — blocks non-HOTEL_OWNER only; HOTEL_OWNERs with REJECTED applications pass through cleanly
- `app/onboarding/context/OnboardingContext.tsx` — `submit()` calls `submitApplication` (not `createHotel`); correct
- `app/onboarding/steps/step-7/page.tsx` — `useEffect` on `submitted` redirects to `/hotel-review`; confirmed correct
- `app/onboarding/steps/step-8/page.tsx` — just redirects to step-7; no logic
- `app/hotel-review/page.tsx` — REJECTED state has "Start a new application" button that pushes to `/onboarding/steps/step-2`
- `app/dashboard/components/DashboardAuthGuard.tsx` — routes HOTEL_OWNER with no hotel AND REJECTED application to `/hotel-review`; correct
- `app/auth/signup/page.tsx` — registers with role=HOTEL_OWNER when subdomain is `hotel.` or `?context=owner`

---

## FIX 3 — Reapplication Flow: Verdict

**No changes needed.** The flow is correct end-to-end:
1. Admin rejects → `hotelApplication.status = REJECTED`, no hotel record.
2. User logs in → `DashboardAuthGuard` calls `getMyHotel()` (null), then `getMyApplication()` (REJECTED) → redirects to `/hotel-review`.
3. `/hotel-review` shows REJECTED UI with "Start a new application" button → pushes to `/onboarding/steps/step-2`.
4. `OnboardingAuthGuard` passes HOTEL_OWNER through.
5. User fills steps 2-7 and submits → `OnboardingContext.submit()` calls `submitApplication()` which deletes the old REJECTED record and creates a new PENDING one.
6. `step-7` redirects to `/hotel-review` on success.

---

## Implementation Plan

---

- [ ] 1. Add two new DTOs for Paystack initialize and verify.

  Create `InitializePaymentDto` with `@IsEnum(SubscriptionPlan) plan` and `VerifyPaymentDto` with `@IsString() reference`. These go in the subscriptions dto folder alongside the existing DTOs, following the same `@IsEnum`/`@IsString` pattern.

  Files:
  - CREATE `c:\Users\Pkaka\music\hotel-os-api\src\subscriptions\dto\initialize-payment.dto.ts`
  - CREATE `c:\Users\Pkaka\music\hotel-os-api\src\subscriptions\dto\verify-payment.dto.ts`

  Verify: `nest build` from `c:\Users\Pkaka\music\hotel-os-api` — no TypeScript errors.

---

- [ ] 2. Add `initializePayment` and `verifyPayment` methods to `SubscriptionsService`.

  Add to `subscriptions.service.ts`:

  `initializePayment(hotelId, ownerId, plan)`:
  - Call `verifyHotelOwnership(hotelId, ownerId)` (already exists in the service).
  - Look up owner email: `await this.prisma.user.findUnique({ where: { id: ownerId }, select: { email: true } })`.
  - If user not found, throw `NotFoundException('Owner not found')`.
  - Read `process.env.PAYSTACK_SECRET_KEY`. If falsy, throw `InternalServerErrorException('Payment gateway not configured')`.
  - `const amount = SUBSCRIPTION_PLANS[plan].priceNgn * 100` (kobo).
  - `const reference = \`sub_${hotelId}_${Date.now()}\``.
  - `const callbackUrl = (process.env.FRONTEND_URL ?? 'http://hotel.localhost:3000') + '/dashboard/subscription/callback'`.
  - POST to `https://api.paystack.co/transaction/initialize` using native `fetch` (no new packages). Header: `Authorization: Bearer ${key}`, `Content-Type: application/json`. Body: `{ email, amount, reference, callback_url: callbackUrl, metadata: { hotelId, plan, ownerId } }`.
  - If Paystack response is not ok or `data.status !== true`, throw `BadRequestException('Could not initialize payment. Please try again.')`.
  - Return `{ authorizationUrl: data.data.authorization_url, reference: data.data.reference }`.

  `verifyPayment(hotelId, ownerId, reference)`:
  - Call `verifyHotelOwnership(hotelId, ownerId)`.
  - Read `process.env.PAYSTACK_SECRET_KEY`. If falsy, throw `InternalServerErrorException('Payment gateway not configured')`.
  - GET `https://api.paystack.co/transaction/verify/${reference}` with the same Authorization header.
  - If Paystack response `data.data.status !== 'success'`, throw `BadRequestException('Payment verification failed. Please try again or contact support if you were charged.')`.
  - Extract `plan` from `data.data.metadata.plan` (already set in initialize).
  - Call the existing `this.createSubscription(hotelId, ownerId, { plan })` and return the result.

  Imports to add: `InternalServerErrorException` from `@nestjs/common`.

  Files:
  - MODIFY `c:\Users\Pkaka\music\hotel-os-api\src\subscriptions\subscriptions.service.ts`

  Verify: `nest build` from `c:\Users\Pkaka\music\hotel-os-api` — no TypeScript errors.

---

- [ ] 3. Add `initializePayment` and `verifyPayment` endpoints to `SubscriptionsController`.

  Add before `@Post('hotels/:hotelId')` (new static-ish sub-path routes must precede dynamic ones):

  ```
  @Post('hotels/:hotelId/initialize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOTEL_OWNER)
  initializePayment(
    @CurrentUser() user: JwtUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: InitializePaymentDto,
  ) {
    return this.subscriptionsService.initializePayment(hotelId, user.userId, dto.plan);
  }

  @Post('hotels/:hotelId/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOTEL_OWNER)
  verifyPayment(
    @CurrentUser() user: JwtUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.subscriptionsService.verifyPayment(hotelId, user.userId, dto.reference);
  }
  ```

  Route ordering: `hotels/:hotelId/initialize` and `hotels/:hotelId/verify` have a fixed second segment so NestJS distinguishes them from `hotels/:hotelId` (bare POST). Place them BEFORE `@Post('hotels/:hotelId')`.

  Add imports: `InitializePaymentDto`, `VerifyPaymentDto`.

  Files:
  - MODIFY `c:\Users\Pkaka\music\hotel-os-api\src\subscriptions\subscriptions.controller.ts`

  Verify: `nest build` from `c:\Users\Pkaka\music\hotel-os-api` — no TypeScript errors.

---

- [ ] 4. Create `app/lib/api/subscriptions.ts` on the frontend with the two Paystack API helpers.

  ```typescript
  // app/lib/api/subscriptions.ts
  import { apiClient } from './client';

  export type InitializePaymentResponse = {
    authorizationUrl: string;
    reference: string;
  };

  export type SubscriptionResponse = {
    id: string;
    plan: string;
    status: string;
  };

  export function initializeSubscriptionPayment(
    hotelId: string,
    plan: string,
  ): Promise<InitializePaymentResponse> {
    return apiClient.post<InitializePaymentResponse>(
      `/api/v1/subscriptions/hotels/${hotelId}/initialize`,
      { plan },
    );
  }

  export function verifySubscriptionPayment(
    hotelId: string,
    reference: string,
  ): Promise<SubscriptionResponse> {
    return apiClient.post<SubscriptionResponse>(
      `/api/v1/subscriptions/hotels/${hotelId}/verify`,
      { reference },
    );
  }
  ```

  Files:
  - CREATE `c:\Users\Pkaka\music\hotel-os\app\lib\api\subscriptions.ts`

  Verify: `next build` from `c:\Users\Pkaka\music\hotel-os` — no TypeScript errors for this file (checked as part of build).

---

- [ ] 5. Update `handleConfirm` in `app/dashboard/subscription/page.tsx` to use Paystack redirect.

  Replace the entire `handleConfirm` function. Remove the import of `createSubscription` from `onboarding` if it becomes unused. Add import of `initializeSubscriptionPayment` from `@/app/lib/api/subscriptions`.

  New `handleConfirm`:
  ```typescript
  async function handleConfirm() {
    if (!selectedPlan) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { authorizationUrl, reference } = await initializeSubscriptionPayment(
        hotel.id,
        selectedPlan.toUpperCase(),
      );
      sessionStorage.setItem('pending_sub_ref', reference);
      sessionStorage.setItem('pending_sub_hotel', hotel.id);
      window.location.href = authorizationUrl;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not start payment. Please try again.';
      setErrorMsg(message);
      setLoading(false);
    }
    // Do not setLoading(false) on success — page is navigating away
  }
  ```

  Also update the confirm step copy from "You will be billed ${plan.priceNum}/month. Confirm to activate." to "You will be redirected to Paystack to complete your ${plan.priceNum}/month payment securely." so the user knows they are leaving the page.

  Files:
  - MODIFY `c:\Users\Pkaka\music\hotel-os\app\dashboard\subscription\page.tsx`

  Verify: `next build` — no TypeScript errors.

---

- [ ] 6. Create `app/dashboard/subscription/callback/page.tsx` — the Paystack return page.

  This page:
  - Is a `'use client'` component.
  - Uses `useSearchParams()` wrapped in `<Suspense>` (required in Next.js App Router for useSearchParams).
  - On mount: reads `reference` from URL param `?reference=`. Fallback: read `pending_sub_ref` and `pending_sub_hotel` from sessionStorage.
  - If no reference or hotelId found: show error state with "Go back to subscription" button.
  - Calls `verifySubscriptionPayment(hotelId, reference)`.
  - On success: clears `pending_sub_ref` and `pending_sub_hotel` from sessionStorage; shows success state with a check SVG icon and "Subscription activated" heading; after 2 seconds calls `router.push('/dashboard/overview')`.
  - On error: shows the specific error message (from `err.message`); shows "Try again" button that calls `router.push('/dashboard/subscription')`.
  - Loading state: centered spinner SVG (no text spinner, no emoji).
  - No emoji anywhere — SVG icons only.
  - The outer export default wraps the inner component in `<Suspense fallback={<Spinner />}>` since `useSearchParams` requires it.

  Files:
  - CREATE `c:\Users\Pkaka\music\hotel-os\app\dashboard\subscription\callback\page.tsx`

  Verify: `next build` — no TypeScript errors; the new route compiles cleanly.

---

- [ ] 7. Add `publishHotel` and `unpublishHotel` service methods to `HotelsService`.

  Add to `hotels.service.ts`:

  ```typescript
  async publishHotel(hotelId: string, ownerId: string): Promise<Hotel> {
    const hotel = await this.prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException(`Hotel ${hotelId} not found`);
    if (hotel.ownerId !== ownerId) throw new ForbiddenException('You do not own this hotel');
    if (!hotel.isActive) {
      throw new BadRequestException('Your hotel must be approved before it can be published');
    }
    // Check active subscription
    const activeSub = await this.prisma.subscription.findFirst({
      where: {
        hotelId,
        status: { in: ['ACTIVE', 'GRACE_PERIOD'] },
      },
    });
    if (!hotel.subscriptionPlan && !activeSub) {
      throw new BadRequestException(
        'An active subscription is required to publish your hotel',
      );
    }
    return this.prisma.hotel.update({
      where: { id: hotelId },
      data: { isPublished: true },
      include: hotelInclude,
    });
  }

  async unpublishHotel(hotelId: string, ownerId: string): Promise<Hotel> {
    const hotel = await this.prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException(`Hotel ${hotelId} not found`);
    if (hotel.ownerId !== ownerId) throw new ForbiddenException('You do not own this hotel');
    return this.prisma.hotel.update({
      where: { id: hotelId },
      data: { isPublished: false },
      include: hotelInclude,
    });
  }
  ```

  Add `BadRequestException` to the imports from `@nestjs/common` (it's not currently imported in hotels.service.ts — verify this before adding).

  Also import `SubscriptionStatus` from `@prisma/client` for the status array check (use string literals `'ACTIVE'`, `'GRACE_PERIOD'` if the enum import creates a circular dependency issue, but prefer the enum).

  Files:
  - MODIFY `c:\Users\Pkaka\music\hotel-os-api\src\hotels\hotels.service.ts`

  Verify: `nest build` — no TypeScript errors.

---

- [ ] 8. Add `PATCH :id/publish` and `PATCH :id/unpublish` routes to `HotelsController`.

  These must be placed BEFORE the existing `@Patch(':id')` handler to avoid NestJS matching `:id` as the route with "publish" or "unpublish" as the id parameter. Insert them directly above the `@Patch(':id')` route:

  ```typescript
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOTEL_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish hotel (owner only)' })
  publishHotel(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.hotelsService.publishHotel(id, user.userId);
  }

  @Patch(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOTEL_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish hotel (owner only)' })
  unpublishHotel(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.hotelsService.unpublishHotel(id, user.userId);
  }
  ```

  Files:
  - MODIFY `c:\Users\Pkaka\music\hotel-os-api\src\hotels\hotels.controller.ts`

  Verify: `nest build` — no TypeScript errors.

---

- [ ] 9. Add `publishHotel` and `unpublishHotel` to `app/lib/api/dashboard.ts`.

  Add at the bottom of dashboard.ts, following the same `apiClient.patch` pattern used by `updateStaffStatus`:

  ```typescript
  export async function publishHotel(hotelId: string): Promise<DashboardHotel> {
    return apiClient.patch<DashboardHotel>(`/api/v1/hotels/${hotelId}/publish`);
  }

  export async function unpublishHotel(hotelId: string): Promise<DashboardHotel> {
    return apiClient.patch<DashboardHotel>(`/api/v1/hotels/${hotelId}/unpublish`);
  }
  ```

  Note: `apiClient.patch` sends `body: JSON.stringify(body)` — both endpoints need no body, so pass `undefined` as body (the existing patch signature supports this).

  Files:
  - MODIFY `c:\Users\Pkaka\music\hotel-os\app\lib\api\dashboard.ts`

  Verify: `next build` — no TypeScript errors.

---

- [ ] 10. Replace the publish banner in `app/dashboard/profile/page.tsx` with a full publish/unpublish section.

  Add `publishHotel` and `unpublishHotel` to the import from `../../lib/api/dashboard`. Add state: `const [publishLoading, setPublishLoading] = useState(false)` and `const [publishError, setPublishError] = useState<string | null>(null)`.

  Replace the minimal banner (the `{hotel && hotel.isPublished === false && (...)}` block) with:

  **If `hotel.isPublished === false`:** show a card banner:
  - White/surface card with a yellow-tinted left border accent OR a neutral design — keep consistent with the profile page's existing card style (`var(--db-surface)`, `var(--db-border)`).
  - Heading: "Your hotel is not visible to travellers yet"
  - Sub-text: "Publish it to start receiving bookings."
  - A [Publish Hotel] button styled like the accent button (`background: var(--db-accent), color: #fff`). On click: set `publishLoading = true`, call `publishHotel(hotel.id)`, on success update `hotel` state with the returned hotel (spread new value), set `publishLoading = false`, clear error. On error: set `publishError` to the `err.message`, set `publishLoading = false`.
  - Show `publishLoading` spinner inside the button when loading.
  - Show `publishError` as a small red error message beneath the button if set.
  - No emoji — use an SVG eye-slash icon (outline) next to the heading.

  **If `hotel.isPublished === true`:** in the header row, add a green "Published" badge inline next to the hotel name (same style as "Active" badge in subscription page: `background: #dcfce7, color: #166534`). Also add an "Unpublish" button (secondary style, border only) that calls `unpublishHotel(hotel.id)` with same loading/error handling pattern.

  When the publish/unpublish API call returns the updated hotel, update the `hotel` state: `setHotel(prev => prev ? { ...prev, isPublished: result.isPublished } : prev)`.

  Files:
  - MODIFY `c:\Users\Pkaka\music\hotel-os\app\dashboard\profile\page.tsx`

  Verify: `next build` — no TypeScript errors.

---

## TypeScript Types to Update / Add

| Location | Change |
|----------|--------|
| `src/subscriptions/dto/initialize-payment.dto.ts` | New file: `{ plan: SubscriptionPlan }` |
| `src/subscriptions/dto/verify-payment.dto.ts` | New file: `{ reference: string }` |
| `app/lib/api/subscriptions.ts` | New file: `InitializePaymentResponse`, `SubscriptionResponse` |
| `app/lib/api/dashboard.ts` | Add `publishHotel` and `unpublishHotel` exports (no new types needed — `DashboardHotel` already has `isPublished?: boolean`) |

## Imports to Add

### Backend
- `subscriptions.service.ts`: add `InternalServerErrorException` to `@nestjs/common` imports; add `SubscriptionStatus` to `@prisma/client` imports (for publishHotel check in hotels.service)
- `hotels.service.ts`: add `BadRequestException` to `@nestjs/common` imports; add `SubscriptionStatus` (or use string literals for status check)
- `subscriptions.controller.ts`: add `InitializePaymentDto`, `VerifyPaymentDto`
- `hotels.controller.ts`: no new imports needed (publishHotel/unpublishHotel use existing imports)

### Frontend
- `app/dashboard/subscription/page.tsx`: remove `createSubscription` import from `onboarding`; add `initializeSubscriptionPayment` from `@/app/lib/api/subscriptions`
- `app/dashboard/profile/page.tsx`: add `publishHotel`, `unpublishHotel` to import from `../../lib/api/dashboard`

---

## Build Verification Steps

Run these in order after implementation:

1. **Backend compile:**
   ```
   cd c:\Users\Pkaka\music\hotel-os-api
   npm run build
   ```
   Expected: exits with code 0, no TypeScript errors.

2. **Backend tests:**
   ```
   cd c:\Users\Pkaka\music\hotel-os-api
   npm run test
   ```
   Expected: all existing tests pass.

3. **Frontend build:**
   ```
   cd c:\Users\Pkaka\music\hotel-os
   npm run build
   ```
   Expected: exits with code 0; no TypeScript errors; the new `/dashboard/subscription/callback` route appears in the build output.

4. **Frontend lint:**
   ```
   cd c:\Users\Pkaka\music\hotel-os
   npm run lint
   ```
   Expected: no errors in modified files.

---

## Notes / Assumptions

- **ENTERPRISE plan and Paystack:** The plan spec does not special-case ENTERPRISE. The `SUBSCRIPTION_PLANS.ENTERPRISE.priceNgn` is 150000, which equals ₦150,000 = 15,000,000 kobo — a valid Paystack amount. The "Contact Sales" flow in the frontend currently goes through `handleConfirm` too. The implementer should keep ENTERPRISE going through Paystack just like the other plans, since the backend has a real price for it. If a "contact sales" bypass is later needed, that is a separate feature.
- **Paystack callback URL:** Uses `FRONTEND_URL` env var (already set in `.env`). The callback page at `/dashboard/subscription/callback` must exist before this can be tested end-to-end.
- **isPublished after approval:** `approveApplication` sets `isPublished: false` — confirmed. The publish/unpublish endpoints are the correct mechanism to go live post-subscription.
- **No hotel record from `getMyHotel()` when `subscriptionPlan` is null:** After admin approval + payment, `publishHotel` service checks `hotel.subscriptionPlan` OR an active Subscription record. After `verifyPayment` succeeds, `createSubscription` is called which sets `hotel.subscriptionPlan` in a transaction — so the check will pass correctly.
- **FIX 3 requires no code changes.** The reapplication flow works correctly end-to-end as confirmed by reading all relevant files.
