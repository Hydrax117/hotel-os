# Hotel onboarding wizard (8-step flow)

The change adds a complete hotel onboarding wizard to the Hotel OS app — an 8-step flow covering account creation, property details, business verification, property information, image upload, room configuration, subscription selection, and a final review + submit screen. State lives in a single React context (`OnboardingProvider`) mounted in the onboarding layout, which correctly wraps all steps. Each step is a Next.js App Router page under `/onboarding/steps/step-N`. The build is clean (TypeScript, no errors, all 13 routes generated).

Watch for: **Step 6's `isNextDisabled` is always `false`** — invalid or empty rooms won't block navigation at the shell level. **`submit()` has no API call** — the form is a local flag only. **Step 8 doesn't re-verify required docs** — a user who navigates back to step 3, removes a required file, and returns to step 8 can still submit. **`(e.target as HTMLInputElement).value` casts throughout** — a minor type smell that could silently fail if the component is ever reused against a non-input element.

**Verdict**: NEEDS_CHANGES

---

## High-level view

Step 6 (Rooms) has a behavioral gap: `isNextDisabled` is hardcoded `false`. The real guard is inside `handleNext`, which sets `attempted` and returns early. This means the Continue button appears enabled even when no rooms are added, which contradicts the UX contract that `StepShell` exposes through `isNextDisabled` — the button looks clickable, the user presses it, nothing happens, and there's no immediate visual cue explaining why.

`submit()` sets a local `submitted` flag and clears the password from state, but makes no API call. Step 8 shows a "pending verification" confirmation screen as if the application was actually submitted. A user arriving at the success screen has no data persisted anywhere.

Step 8's `useEffect` guard only checks `account.email` and `subscription`. A user who completes step 3, navigates back, clears a required document, and returns to step 8 will see the inline red warning in the summary but nothing blocks them from clicking Submit — they can submit a known-incomplete application.

The `e.target as HTMLInputElement` cast is used in every step page's `onChange` handlers. `FormField` already receives `React.ChangeEvent<HTMLInputElement>` so `e.currentTarget` is correctly typed without a cast — the explicit cast to `e.target` silences TypeScript rather than satisfying it.

---

<details>
<summary>Issues (4)</summary>

1. **Step 6 `isNextDisabled` always false** — The Continue button is never visually disabled on the Rooms step even when no rooms exist or rooms have validation errors. Move the `allRoomsValid` check into `isNextDisabled` on `StepShell`, or at minimum make the button visually inactive to match the UX contract of every other step.

2. **`submit()` is a no-op** — Calling `submit()` only flips a local boolean and displays a success screen. No data reaches any backend. The TODO notes this but the success screen copy ("Your property is now pending verification") implies the submission was real. Either wire up the API call before shipping or change the success screen copy to make clear that submission is deferred.

3. **Step 8 re-validates subscription but not required docs** — The `useEffect` guard on Step 8 only checks `account.email` and `subscription`. A user can complete step 3 (verification), navigate back, clear a required document, and proceed to step 8 where the red "Required — not uploaded" indicator appears in the summary but does not block submission. Add a guard for required verification documents before calling `submit()`.

4. **`(e.target as HTMLInputElement).value` casts** — Every step uses `(e.target as HTMLInputElement).value` and `(e.target as HTMLTextAreaElement).value` inside `onChange` handlers, bypassing the correct type `e.currentTarget.value` that TypeScript would infer from the event type. This works in practice but silences a class of type errors. `FormField` already receives correctly-typed `InputHTMLAttributes` / `TextareaHTMLAttributes`; the step pages should use `e.currentTarget.value` to keep the types tight.

</details>

<details>
<summary>Details</summary>

### Step 6 navigation guard bypasses `StepShell`'s disabled contract

Every other step that gates progression sets `isNextDisabled` on `StepShell`. Step 6 passes `isNextDisabled={false}` unconditionally and moves the guard into `handleNext`:

```tsx
const handleNext = () => {
  if (!allRoomsValid) {
    setAttempted(true);
    return;   // silent: button looked enabled, click does nothing
  }
  ...
};
```

The user sees an enabled-looking Continue button, clicks it, the click is swallowed, and the only feedback is the room card validation errors appearing — which won't show if no rooms have been added yet (the error message for zero rooms is shown conditionally below an empty state that's already visible). The other seven steps all use `isNextDisabled` correctly. `isNextDisabled` should be `!allRoomsValid` here; the `attempted` state can remain for showing field-level errors.

### `submit()` local flag vs. real submission

`submit()` in `OnboardingContext` sets `submitted: true` and clears `account.password`. The Step 8 success screen renders immediately, showing the user's email and messaging "pending verification. Our team will review your submission." No data has been sent anywhere — the entire `OnboardingState` exists only in component memory. The TODO comment targets the right fix but the optimistic success copy is misleading even in a prototype context if it's shared with stakeholders or used for demos.

### Step 8 soft guard doesn't cover required documents

```tsx
useEffect(() => {
  if (!account.email.trim() || !subscription) {
    router.replace('/onboarding/steps/step-1');
  }
}, [account.email, subscription, router]);
```

The guard is checking for direct-URL access, not full submission readiness. Because the `submit` button on Step 8 has no `isNextDisabled` condition tied to verification document completeness, a user who cleared a required document can submit a summary that already shows the red warning inline — submitting a known-incomplete application.

### `e.target` vs `e.currentTarget` cast pattern — confirmed

In every step page, `onChange` handlers on `FormField` cast via `e.target as HTMLInputElement`:

```tsx
onChange={e => updateProperty({ hotelName: (e.target as HTMLInputElement).value })}
```

`FormField` accepts `React.InputHTMLAttributes<HTMLInputElement>`, so the `onChange` event is `React.ChangeEvent<HTMLInputElement>`, making `e.currentTarget` already typed as `HTMLInputElement` — no cast needed. Using `e.target` + a cast is technically equivalent at runtime but is a footgun: if the input is ever wrapped or delegated in future, `e.target` can drift from `currentTarget`. TypeScript won't catch it because the cast suppresses the error.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `app/onboarding/page.tsx` | Entry redirect to `/onboarding/steps/step-1` |
| `app/onboarding/layout.tsx` | Layout wrapping all steps; mounts `OnboardingProvider` and sidebar `StepIndicator` |
| `app/onboarding/context/OnboardingContext.tsx` | Full onboarding state machine — types, defaults, all updaters, `submit()` |
| `app/onboarding/components/StepShell.tsx` | Shared step chrome: title, step counter, Back/Continue navigation |
| `app/onboarding/components/StepIndicator.tsx` | Sidebar progress indicator reading `currentStep` from context |
| `app/onboarding/components/FormField.tsx` | Reusable `input`/`textarea` wrapper with label, error, hint |
| `app/onboarding/components/FileUploadSlot.tsx` | Drag-and-drop file upload with optional image preview (object URL lifecycle managed) |
| `app/onboarding/components/RoomCard.tsx` | Inline room type form with per-field touched validation |
| `app/onboarding/components/MultiSelectChips.tsx` | Pill-style multi-select for amenities and languages |
| `app/onboarding/components/SubscriptionCard.tsx` | Clickable plan card for subscription selection |
| `app/onboarding/components/SummarySection.tsx` | `<dl>`-based summary grid used on Step 8 |
| `app/onboarding/constants/amenities.ts` | 24 amenity options |
| `app/onboarding/constants/languages.ts` | 18 language options |
| `app/onboarding/steps/step-1/page.tsx` | Account: name, email, phone, password |
| `app/onboarding/steps/step-2/page.tsx` | Property: name, description, address, geo coords |
| `app/onboarding/steps/step-3/page.tsx` | Verification: 5 document upload slots (4 required) |
| `app/onboarding/steps/step-4/page.tsx` | Property info: amenities, times, policy, house rules, languages |
| `app/onboarding/steps/step-5/page.tsx` | Images: 8 slots with live thumbnail preview |
| `app/onboarding/steps/step-6/page.tsx` | Rooms: dynamic room type list with inline validation |
| `app/onboarding/steps/step-7/page.tsx` | Subscription: 3-plan selector (Starter / Professional / Enterprise) |
| `app/onboarding/steps/step-8/page.tsx` | Review + submit; success screen on completion |
| `app/globals.css` | `--ob-*` CSS design tokens added to `:root` |

Full diff: `git diff main -- app/onboarding app/globals.css`

</details>
