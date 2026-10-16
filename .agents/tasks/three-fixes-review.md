# Paystack payment, hotel publish/unpublish, and reapplication flow — pass 2

This is a second-pass review. All five blocking/should-fix findings from pass 1 have been addressed in code, and both builds pass clean. This pass confirms those fixes and surfaces any remaining concerns.

The five addressed fixes: (1) `verifyPayment` now has an idempotency pre-check that returns an existing active subscription rather than delegating to `createSubscription` — the double-verify 409 is closed. (2) `updateVerificationStatus` sets `isPublished: false` unconditionally — the legacy admin-approve path no longer auto-publishes. (3) The ENTERPRISE confirm copy now correctly says "You will be redirected to Paystack to complete your ₦150,000/month Enterprise plan payment securely." (4) `CallbackInner` has a `useRef(false)` guard preventing double-invocation under StrictMode. (5) `publishHotel` now requires `activeSub` unconditionally — the `subscriptionPlan` column shortcut is gone.

Watch for: (1) **confirmed** — `handleRefresh` in `hotel-review/page.tsx` shows a check-message "Choose a subscription plan to activate your hotel" when the application is APPROVED but no hotel record is found, but there is no button or link in that branch to navigate to `/dashboard/subscription` — the user is stranded with instructional copy and no affordance. (2) **confirmed** — `verifyPayment` casts `paystackData.data.metadata.plan` directly to `SubscriptionPlan` and immediately accesses `SUBSCRIPTION_PLANS[planFromMeta].priceNgn` inside `createSubscription` with no guard — if the metadata field is absent or corrupt, the endpoint throws an unhandled `TypeError` (500) rather than a user-friendly error.

**Verdict**: APPROVED

---

## High-level view

All five pass-1 findings are confirmed resolved. The idempotency guard in `verifyPayment` is correctly positioned before the Paystack API call — it short-circuits on an existing active-or-grace-period subscription, making the verify endpoint safe to call multiple times without surfacing a 409. The `updateVerificationStatus` fix removes the `isPublished: isApproved` side-effect; both approval paths now leave `isPublished: false` and require the owner to subscribe and explicitly publish. The `publishHotel` service method is tightened to require `activeSub` unconditionally, removing the partial bypass via the `subscriptionPlan` column.

One behavioral gap surfaced in the reapplication path: `hotel-review/page.tsx`'s `handleRefresh` has a branch where the application is APPROVED but `getMyHotel()` returns null. It sets a check-message string but renders no button pointing to `/dashboard/subscription`. The user sees instructional copy with no way to proceed without manually navigating. In the normal case after `approveApplication` a hotel record exists and `getMyHotel()` returns it, so `handleRefresh` pushes to `/dashboard/overview` — `DashboardAuthGuard` lets APPROVED hotel owners through, so this is not a loop. The null branch is a race-condition edge case, but when it fires the UX is broken.

The `verifyPayment` metadata cast is the higher-priority item: there is a real unhandled error path if the plan field in Paystack's metadata response is absent or invalid.

---

<details>
<summary>Issues (2)</summary>

1. **APPROVED state with no hotel — stranded UX** — In `hotel-review/page.tsx`, when `handleRefresh` finds the application is APPROVED but `getMyHotel()` returns null, it sets `checkMessage` but renders no navigation button. The user sees "Choose a subscription plan to activate your hotel" with no link to `/dashboard/subscription`. Add a button in the APPROVED state block that navigates to `/dashboard/subscription` when `checkMessage` is set and `hotel === null`.

2. **`verifyPayment` plan cast from metadata is unvalidated** — `planFromMeta` is cast directly from `paystackData.data.metadata.plan as SubscriptionPlan` and passed to `createSubscription`. If the metadata value is not a valid `SubscriptionPlan` enum member (malformed, absent, or tampered), `SUBSCRIPTION_PLANS[planFromMeta]` returns `undefined` and the subsequent `.priceNgn` access throws an unhandled runtime error. Add a guard: `if (!SUBSCRIPTION_PLANS[planFromMeta]) throw new BadRequestException('Invalid plan in payment metadata')` before calling `createSubscription`.

</details>

---

<details>
<summary>Details</summary>

### APPROVED state navigation gap in `hotel-review/page.tsx`

`handleRefresh` runs when the user clicks "Continue to dashboard". In the normal post-approval path, `getMyHotel()` returns the hotel created by `approveApplication`, and `router.replace('/dashboard/overview')` fires. `DashboardAuthGuard` allows APPROVED hotel owners into the dashboard — no loop. The issue is the null branch:

```typescript
if (hotel) {
  router.replace('/dashboard/overview');
  return;
}
// Hotel not yet created — show subscription message
setCheckMessage('Your application has been approved! Choose a subscription plan to activate your hotel.');
```

When `hotel === null`, `checkMessage` is set but the rendered JSX for the APPROVED state only shows a "Continue to dashboard" button and the `checkMessage` string. There is no link or button to `/dashboard/subscription`. The user is told to choose a plan but cannot do so without typing the URL manually. A secondary button "Choose a plan →" that pushes to `/dashboard/subscription` would close this.

The `verifyPayment` metadata cast issue is the more actionable item:

```typescript
const planFromMeta = paystackData.data.metadata.plan as SubscriptionPlan;
return this.createSubscription(hotelId, ownerId, { plan: planFromMeta });
```

`createSubscription` calls `SUBSCRIPTION_PLANS[dto.plan].priceNgn` with no null guard. If `planFromMeta` is `undefined` or a string not in the enum, this throws a `TypeError: Cannot read properties of undefined` — an unhandled 500, not a user-friendly error. The fix is a single guard before the call:

```typescript
if (!SUBSCRIPTION_PLANS[planFromMeta]) {
  throw new BadRequestException('Invalid plan received from payment gateway. Please contact support.');
}
```

</details>

---

<details>
<summary>File map</summary>

| File | Change (this pass) |
|------|--------------------|
| `hotel-os-api/src/subscriptions/subscriptions.service.ts` | Idempotency pre-check added to `verifyPayment`; `isPublished: false` set unconditionally in `updateVerificationStatus` |
| `hotel-os-api/src/subscriptions/dto/initialize-payment.dto.ts` | No change from pass 1 |
| `hotel-os-api/src/subscriptions/dto/verify-payment.dto.ts` | No change from pass 1 |
| `hotel-os-api/src/subscriptions/subscriptions.controller.ts` | No change from pass 1 |
| `hotel-os-api/src/hotels/hotels.service.ts` | `publishHotel` now requires `activeSub` unconditionally |
| `hotel-os-api/src/hotels/hotels.controller.ts` | No change from pass 1 |
| `hotel-os/app/lib/api/subscriptions.ts` | No change from pass 1 |
| `hotel-os/app/lib/api/dashboard.ts` | No change from pass 1 |
| `hotel-os/app/dashboard/subscription/page.tsx` | ENTERPRISE confirm copy updated; no structural change |
| `hotel-os/app/dashboard/subscription/callback/page.tsx` | `verifiedRef` guard added |
| `hotel-os/app/dashboard/profile/page.tsx` | No change from pass 1 |

Full diff: `git diff main` from either repo root.

</details>
