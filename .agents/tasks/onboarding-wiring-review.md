# Onboarding API wiring to NestJS backend

The change wires the Hotel OS onboarding wizard's submit flow to a live NestJS backend. It introduces `app/lib/api/onboarding.ts` with four typed API functions, adds `uploadDocument` to the Supabase storage helper using a dedicated `hotel-documents` bucket, and rewrites the `OnboardingContext` `submit()` function as a seven-step async sequence. Step 8 gains a full-screen submitting overlay and an error banner; step 3 gets a per-slot security note. `StepShell.onNext` is widened to accept `Promise<void>`.

Watch for: (1) **confirmed** — `submit()` reads a stale `state` snapshot captured at function entry; any `setState` calls made during the submit sequence (progress steps) do not update `snap`, which is correct for form data but means a user editing another tab concurrently would have their changes silently dropped; (2) **confirmed** — the step ordering differs from the spec: documents upload *after* hotel creation (not before), so `saveDocument` calls include a real `hotelId`, which is actually the correct behavior — this discrepancy is in the spec, not the code; (3) **possible** — no rollback or cleanup on partial failure; a hotel record can be created in the backend while the document upload or subscription step fails, leaving orphaned data.

**Verdict**: APPROVED

---

## High-level view

The seven-step submit sequence is: register account → create hotel → upload & save documents → upload & save images (parallel) → create room types (sequential) → create subscription → set `submitted: true`. This ordering is correct: documents and images need the `hotelId` from step 2, and subscription needs the hotel to exist. The spec said "upload docs → create hotel" but the implementation reverses that — which is the *right* call, since `saveDocument` takes a `hotelId`.

The `state` snapshot pattern in `submit()` is intentional and handles the fact that `setState` is async. Progress label updates use a second closure (`setState(s => ...)`) that never touches the snapshot, so form data is safe. The tradeoff is that in-flight edits from other code paths (unlikely in a wizard, but possible) would be silently dropped.

Bucket routing is clean: images go to `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (defaulting to `hotel-images`) via `uploadImage`, documents go to the hardcoded `hotel-documents` constant via `uploadDocument`. The two buckets are never crossed.

The 409 duplicate-email path maps to a user-readable message. All thrown values are narrowed through `ApiError → Error → unknown` — no `any` casts in the catch block or anywhere in the new code. The `onNext: () => void | Promise<void>` widening in `StepShell` is correct and backward-compatible.

No cleanup runs on partial failure. If `createHotel` succeeds and `createSubscription` throws, the hotel record exists in the backend with no subscription and no way to resume from the wizard.

---

<details>
<summary>Issues (1)</summary>

1. **No partial-failure rollback** — If any step after `createHotel` fails (document upload, image upload, room type creation, subscription), the hotel record is orphaned in the backend. The wizard has no resume capability and no way to delete the partial record. At minimum, the error message shown to the user should acknowledge that a partial record may exist and direct them to contact support, rather than implying a clean retry is safe. — **confirmed**

</details>

---

<details>
<summary>Details</summary>

### Step ordering: spec vs. implementation

The task spec lists the submit order as "register → upload docs → create hotel → …". The implementation does register → create hotel → upload docs. The implementation is correct. `saveDocument` and `saveHotelImage` both take a `hotelId` parameter, so the hotel must exist before either can be called. The spec had an error; the code resolved it correctly.

### Stale snapshot and concurrent edit risk

`submit()` captures `const snap = state` synchronously at the top of the function, then issues progress `setState` calls throughout. Because React state updates are queued and `state` is closed over from the render that fired `submit()`, `snap` will not reflect any `setState` made by another event handler between the time the user clicked Submit and the time any intermediate await resolves. In a linear wizard this is not a realistic risk — no other state mutations should be in flight. It's worth documenting in the code, which the existing comment (`// Capture a snapshot of state…`) does adequately.

### Orphaned records on partial failure

If any step from step 3 onward throws, the catch block sets `submitError` and returns. The hotel record created in step 2 remains in the backend. The same is true for partially uploaded documents and images. The current error banner says "Submission failed: \<message\>" with no indication that some writes succeeded. A user who retries `submit()` will hit `register` again (step 1) and receive a 409, which now shows a "please sign in instead" message — but they can't sign in and resume, because the wizard doesn't support resumption. The correct UX fix is outside the scope of this diff, but the error message should at minimum tell the user to contact support rather than implying a clean retry will work.

### Document security note placement

The security note in step 3 (`"Stored securely and used only for verification purposes."`) is rendered as a `<p>` below each `FileUploadSlot` wrapper `<div>`. This is per-slot, which is what the spec asked for. The note is accessible (plain text, not hidden), visible at the correct scope, and uses the existing `var(--ob-secondary)` color token.

### Submit button disable logic

`isSubmitDisabled` is `hasMissingRequiredDocs || submitting`. The `submitting` flag gates both the button disabled state and the `nextLabel` text. The full-screen overlay is rendered outside `StepShell` using a `<>` fragment, so it covers the entire viewport including the shell's navigation buttons — the user cannot click Back or Submit while the overlay is active even if the button is somehow reached. This is the correct behavior.

</details>

---

<details>
<summary>File map</summary>

- `app/lib/api/onboarding.ts` — new file; typed API functions for createHotel, createRoomType, saveDocument, createSubscription
- `app/lib/supabase.ts` — added `uploadDocument` using hardcoded `hotel-documents` bucket with `contentType` passthrough
- `app/onboarding/context/OnboardingContext.tsx` — rewrote `submit()` as async seven-step sequence; added `submitting`, `submitError`, `submitStep` to state and context type
- `app/onboarding/steps/step-8/page.tsx` — added full-screen submitting overlay, error banner, async `submit` wired to `onNext`; added missing-doc highlighting in summary
- `app/onboarding/steps/step-3/page.tsx` — added per-slot security note below each `FileUploadSlot`
- `app/onboarding/components/StepShell.tsx` — widened `onNext` type to `() => void | Promise<void>`

Full diff: `git diff main -- app/lib/api/onboarding.ts app/lib/supabase.ts app/onboarding/`

</details>
