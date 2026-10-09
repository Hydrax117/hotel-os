# Implementation Plan — Hotel Onboarding Multi-Step Form

## Overview

Build the 8-step hotel onboarding flow at `/onboarding` in the Next.js 16.4 App Router project.
All files live under `app/onboarding/`. State is managed locally in a single React context provider.
No backend, no external UI libraries. Tailwind CSS 4 utility classes only.

---

## Component Hierarchy

```
app/onboarding/layout.tsx          ← onboarding shell (server component, LayoutProps<"/onboarding">)
  OnboardingProvider               ← "use client", holds all form state + currentStep
    app/onboarding/page.tsx        ← redirects to /onboarding/steps/step-1
    app/onboarding/steps/
      step-1/page.tsx              ← Account
      step-2/page.tsx              ← Property
      step-3/page.tsx              ← Verification
      step-4/page.tsx              ← Property Information
      step-5/page.tsx              ← Images
      step-6/page.tsx              ← Rooms
      step-7/page.tsx              ← Subscription
      step-8/page.tsx              ← Approval / Review
    components/
      StepIndicator.tsx            ← progress bar (reads currentStep from context)
      StepShell.tsx                ← title + description + Back/Next buttons
      FormField.tsx                ← labelled input wrapper
      MultiSelectChips.tsx         ← chip-based multi-select (amenities, languages)
      FileUploadSlot.tsx           ← drag-and-drop image/doc upload slot
      RoomCard.tsx                 ← editable room type entry in step 6
      SubscriptionCard.tsx         ← plan card in step 7
      SummarySection.tsx           ← labelled group in the step-8 review screen
```

---

## State Shape

All onboarding state lives in a single context value. The provider file defines both the context
and the `useOnboarding()` hook.

```ts
// app/onboarding/context/OnboardingContext.tsx

type AccountData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

type PropertyData = {
  hotelName: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
};

type VerificationDocument = {
  id: string;          // e.g. "cac", "governmentId", "bankDetails"
  label: string;
  file: File | null;
  required: boolean;
};

type PropertyInfoData = {
  amenities: string[];          // array of selected amenity keys
  checkInTime: string;          // "HH:MM"
  checkOutTime: string;
  cancellationPolicy: string;
  houseRules: string;
  languages: string[];
};

type ImageSlot = {
  id: string;                   // e.g. "exterior", "lobby", "rooms"
  label: string;
  file: File | null;
  preview: string | null;       // object URL for thumbnail
};

type RoomType = {
  id: string;                   // uuid generated client-side
  name: string;
  capacity: number;
  bedType: string;
  bathroomType: string;
  totalRooms: number;
  pricePerNight: number;
};

type SubscriptionPlan = "starter" | "professional" | "enterprise" | null;

type OnboardingState = {
  currentStep: number;          // 1–8
  account: AccountData;
  property: PropertyData;
  verification: VerificationDocument[];
  propertyInfo: PropertyInfoData;
  images: ImageSlot[];
  rooms: RoomType[];
  subscription: SubscriptionPlan;
  submitted: boolean;
};

type OnboardingContextValue = OnboardingState & {
  setStep: (step: number) => void;
  updateAccount: (data: Partial<AccountData>) => void;
  updateProperty: (data: Partial<PropertyData>) => void;
  updateVerification: (id: string, file: File | null) => void;
  updatePropertyInfo: (data: Partial<PropertyInfoData>) => void;
  updateImageSlot: (id: string, file: File, preview: string) => void;
  addRoom: () => void;
  updateRoom: (id: string, data: Partial<RoomType>) => void;
  removeRoom: (id: string) => void;
  setSubscription: (plan: SubscriptionPlan) => void;
  submit: () => void;
};
```

Default verification documents (configurable — just change the array):
```ts
const DEFAULT_VERIFICATION_DOCS: VerificationDocument[] = [
  { id: "cac", label: "CAC / Business Registration", file: null, required: true },
  { id: "ownerInfo", label: "Owner Information", file: null, required: true },
  { id: "governmentId", label: "Government-Issued ID", file: null, required: true },
  { id: "hotelDocs", label: "Hotel Documents", file: null, required: false },
  { id: "bankDetails", label: "Bank Details", file: null, required: true },
];
```

Default image slots:
```ts
const DEFAULT_IMAGE_SLOTS: ImageSlot[] = [
  { id: "exterior", label: "Hotel Exterior", file: null, preview: null },
  { id: "lobby",    label: "Lobby",          file: null, preview: null },
  { id: "rooms",    label: "Rooms",          file: null, preview: null },
  { id: "bathroom", label: "Bathroom",       file: null, preview: null },
  { id: "pool",     label: "Pool",           file: null, preview: null },
  { id: "restaurant", label: "Restaurant",  file: null, preview: null },
  { id: "gym",      label: "Gym",            file: null, preview: null },
  { id: "other",    label: "Other",          file: null, preview: null },
];
```

---

## TypeScript Considerations

### LayoutProps and `LayoutRoutes`

The `.next/types/routes.d.ts` file declares `LayoutRoutes = "/"`. This means the generated
global type `LayoutProps<T>` only accepts `"/"` as `T`. The onboarding layout **cannot** use
`LayoutProps<"/onboarding">` — that route is not yet in the union.

**Decision:** The onboarding layout uses an explicit inline props type instead:

```ts
// app/onboarding/layout.tsx
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) { ... }
```

This avoids a TypeScript error while staying consistent with the project's pattern (the root
layout uses `LayoutProps<"/">`, which works because `"/"` is in `LayoutRoutes`). Once
`next dev` or `next build` regenerates `routes.d.ts` with the new routes, a follow-up can
switch to `LayoutProps<"/onboarding">`.

### `"use client"` Boundaries

- `app/onboarding/layout.tsx` — **server component** (no directive). Wraps children in the
  static shell HTML (sidebar, step indicator container) and renders `<OnboardingProvider>`.
  But because the provider must be a client component, the layout imports it and wraps children
  inside it. The layout itself does NOT need `"use client"`.
- `app/onboarding/context/OnboardingContext.tsx` — `"use client"`. Contains all `useState`/`useReducer`.
- All step pages (`step-1/page.tsx` through `step-8/page.tsx`) — `"use client"` (they use `useOnboarding()` hook).
- All components in `app/onboarding/components/` — `"use client"` (interactive).

### File Object Handling

`File` objects cannot be serialised, so the onboarding state lives entirely in the
client component tree (no server actions, no serialisation needed). Object URLs for
image previews are created with `URL.createObjectURL()` and stored in the `images`
state alongside the `File`. The component that creates them should also call
`URL.revokeObjectURL()` on unmount to avoid memory leaks.

### `crypto.randomUUID()`

Used to generate room `id` values client-side. Available in modern browsers and in
Next.js edge/node environments. No polyfill needed.

---

## CSS / Design Tokens

Add onboarding-specific CSS custom properties to `app/globals.css` (do not overwrite the
existing file — append only):

```css
/* Onboarding design tokens */
:root {
  --ob-bg:        #f9f7f4;   /* warm off-white page background   */
  --ob-surface:   #ffffff;   /* card / panel surface             */
  --ob-primary:   #1a1a1a;   /* deep charcoal text + buttons     */
  --ob-secondary: #6b6560;   /* stone/warm gray                  */
  --ob-accent:    #3d6b4f;   /* muted earthy green               */
  --ob-border:    #e8e4df;   /* subtle warm border               */
  --ob-muted:     #f1ede8;   /* muted surface (chips, slots)     */
}
```

---

## File List

| File | Role |
|------|------|
| `app/globals.css` | Append onboarding CSS tokens (do not rewrite the file) |
| `app/onboarding/layout.tsx` | Server component shell: renders the 2-column layout (sidebar with StepIndicator + main content area), wraps in OnboardingProvider |
| `app/onboarding/page.tsx` | Immediate redirect to `/onboarding/steps/step-1` using `redirect()` from `next/navigation` |
| `app/onboarding/context/OnboardingContext.tsx` | `"use client"` — defines OnboardingState, OnboardingContextValue, OnboardingProvider, and `useOnboarding()` hook |
| `app/onboarding/components/StepIndicator.tsx` | `"use client"` — reads currentStep from context, renders 8-dot/numbered progress bar with step labels |
| `app/onboarding/components/StepShell.tsx` | `"use client"` — receives title, description, step number, onBack, onNext props; renders the step frame with navigation buttons |
| `app/onboarding/components/FormField.tsx` | `"use client"` — labelled `<input>` or `<textarea>` wrapper, shows optional required indicator and validation message |
| `app/onboarding/components/MultiSelectChips.tsx` | `"use client"` — renders a grid of toggleable chip buttons; takes `options`, `selected`, `onChange` |
| `app/onboarding/components/FileUploadSlot.tsx` | `"use client"` — drag-and-drop zone; shows preview thumbnail when a file is selected; accepts `accept`, `label`, `file`, `preview`, `onChange` |
| `app/onboarding/components/RoomCard.tsx` | `"use client"` — single room type editor card (all fields + remove button) |
| `app/onboarding/components/SubscriptionCard.tsx` | `"use client"` — plan card with name, price, feature list, and selected state ring |
| `app/onboarding/components/SummarySection.tsx` | `"use client"` — review screen section: heading + key/value list of entered data |
| `app/onboarding/steps/step-1/page.tsx` | Account: Name, Email, Phone, Password |
| `app/onboarding/steps/step-2/page.tsx` | Property: Hotel name, Description, Address, City, State, Country, Lat, Lng |
| `app/onboarding/steps/step-3/page.tsx` | Verification: renders verification doc slots from state array |
| `app/onboarding/steps/step-4/page.tsx` | Property Information: amenities chips, times, policy, rules, languages chips |
| `app/onboarding/steps/step-5/page.tsx` | Images: 8 FileUploadSlot components in a 2-col grid |
| `app/onboarding/steps/step-6/page.tsx` | Rooms: list of RoomCard components + "Add room type" button |
| `app/onboarding/steps/step-7/page.tsx` | Subscription: 3 SubscriptionCard components in a row |
| `app/onboarding/steps/step-8/page.tsx` | Review: SummarySection for each step's data + Submit button + pending state |

---

## Ordered Implementation Steps

- [ ] 1. Add onboarding CSS tokens to `app/globals.css`.
      Append the `:root` block with `--ob-*` custom properties listed above.
      Files: `app/globals.css`
      Verify: `npm run build` — no CSS errors.

- [ ] 2. Create the OnboardingContext provider.
      Define all types, default state (including `DEFAULT_VERIFICATION_DOCS` and
      `DEFAULT_IMAGE_SLOTS`), `OnboardingProvider` component with `useState`, and the
      `useOnboarding()` hook. Export both.
      Files: `app/onboarding/context/OnboardingContext.tsx`
      Verify: `npm run build` — TypeScript compiles with no errors.

- [ ] 3. Create shared UI components.
      Create all five reusable components in one pass; each is a focused, standalone
      `"use client"` component:
      - `FormField.tsx` — label + input/textarea + error message slot
      - `MultiSelectChips.tsx` — toggleable chip grid
      - `FileUploadSlot.tsx` — drag-and-drop zone with thumbnail preview
      - `RoomCard.tsx` — room type editor card (all 6 fields + remove button)
      - `SubscriptionCard.tsx` — plan selection card
      - `SummarySection.tsx` — key/value review section
      Files: `app/onboarding/components/FormField.tsx`,
             `app/onboarding/components/MultiSelectChips.tsx`,
             `app/onboarding/components/FileUploadSlot.tsx`,
             `app/onboarding/components/RoomCard.tsx`,
             `app/onboarding/components/SubscriptionCard.tsx`,
             `app/onboarding/components/SummarySection.tsx`
      Verify: `npm run build` — no TypeScript errors.

- [ ] 4. Create StepIndicator and StepShell.
      `StepIndicator` reads `currentStep` from the onboarding context and renders the
      8-step progress indicator with step number, label, and completion state.
      `StepShell` is a layout wrapper that accepts `title`, `description`, `step`,
      `totalSteps`, `onBack`, `onNext`, `nextLabel` (optional, default "Continue"),
      `isNextDisabled` (optional), and `children`.
      Files: `app/onboarding/components/StepIndicator.tsx`,
             `app/onboarding/components/StepShell.tsx`
      Verify: `npm run build` — no errors.

- [ ] 5. Create the onboarding layout and entry page.
      `layout.tsx` — server component, inline `{ children: React.ReactNode }` props type,
      renders the 2-column shell: left sidebar (logo + StepIndicator), right main area.
      Wraps children in `<OnboardingProvider>`. Uses `--ob-bg` and `--ob-surface` CSS vars.
      `page.tsx` — calls `redirect("/onboarding/steps/step-1")` from `next/navigation`.
      Files: `app/onboarding/layout.tsx`,
             `app/onboarding/page.tsx`
      Verify: `npm run dev` — visiting `/onboarding` redirects to `/onboarding/steps/step-1`
              without crashing.

- [ ] 6. Build Step 1 (Account) and Step 2 (Property).
      Both pages use `useOnboarding()` to read/write their slice of state.
      Navigation: "Back" goes to previous step (or is hidden on step 1); "Continue" calls
      `setStep` and uses `useRouter().push()` to navigate to the next step route.
      Step 1 fields: Name, Email, Phone, Password (type="password").
      Step 2 fields: Hotel name, Description (textarea), Address, City, State, Country,
      Latitude, Longitude. Lat/Lng are `type="number"` inputs.
      Files: `app/onboarding/steps/step-1/page.tsx`,
             `app/onboarding/steps/step-2/page.tsx`
      Verify: `npm run dev` — can fill and navigate steps 1 and 2; `npm run build` passes.

- [ ] 7. Build Step 3 (Verification) and Step 4 (Property Information).
      Step 3: maps over `verification` array from context, renders a `FileUploadSlot` for
      each document. Required slots show a visual indicator. `updateVerification(id, file)`
      is called on file selection.
      Step 4: `MultiSelectChips` for amenities (list of 20+ common hotel amenities defined
      in a constants file), time inputs for check-in/check-out, textarea for cancellation
      policy and house rules, `MultiSelectChips` for languages spoken.
      Files: `app/onboarding/steps/step-3/page.tsx`,
             `app/onboarding/steps/step-4/page.tsx`,
             `app/onboarding/constants/amenities.ts` (amenity option list),
             `app/onboarding/constants/languages.ts` (language option list)
      Verify: `npm run build` passes; amenities and languages chips toggle correctly in dev.

- [ ] 8. Build Step 5 (Images) and Step 6 (Rooms).
      Step 5: renders all 8 image slots in a `grid grid-cols-2 md:grid-cols-4` layout.
      Each slot uses `FileUploadSlot`. On file selection, call `URL.createObjectURL()` and
      pass both `file` and `preview` to `updateImageSlot()`.
      Step 6: maps `rooms` array to `RoomCard` components. "Add room type" button calls
      `addRoom()` (which creates a new room with default values and a `crypto.randomUUID()`
      id). Each card calls `updateRoom(id, data)` on change and `removeRoom(id)` on delete.
      A minimum of one room is required — disable "Continue" if `rooms.length === 0`.
      Files: `app/onboarding/steps/step-5/page.tsx`,
             `app/onboarding/steps/step-6/page.tsx`
      Verify: `npm run build` passes; images show thumbnail previews; rooms can be added/removed.

- [ ] 9. Build Step 7 (Subscription) and Step 8 (Approval/Review).
      Step 7: renders three `SubscriptionCard` components side-by-side (stacked on mobile).
      Selecting a card calls `setSubscription(plan)`. Continue is disabled until a plan is
      selected.
      Step 8: renders `SummarySection` for each of the 7 preceding data groups (account,
      property, verification, property info, images, rooms, subscription). "Submit" button
      calls `submit()` which sets `submitted: true`. After submission, replace the summary
      with a "Pending verification" confirmation message and a checkmark icon. No network
      call is made — this is frontend only.
      Files: `app/onboarding/steps/step-7/page.tsx`,
             `app/onboarding/steps/step-8/page.tsx`
      Verify: `npm run build` passes; full 8-step flow can be completed end-to-end in dev.

- [ ] 10. Final build verification and mobile check.
       Run `npm run build` and confirm zero TypeScript errors and zero ESLint errors.
       Check that all 8 steps are navigable, state persists across steps within the same
       session, and the layout is responsive at 375px (mobile) and 1280px (desktop).
       Files: no new files — fix any issues found during this step.
       Verify: `npm run build` exits 0.

---

## Navigation Strategy

Step pages use `useRouter().push(nextRoute)` from `next/navigation` for navigation. The
step indicator in the sidebar also links to steps, but only for already-visited steps
(disable forward-skipping). The `currentStep` integer in context drives both the indicator
highlight and back/forward logic.

Route-to-step mapping:
```
/onboarding/steps/step-1  →  1
/onboarding/steps/step-2  →  2
...
/onboarding/steps/step-8  →  8
```

The `StepShell` component computes `onBack` and `onNext` handlers by decrementing/incrementing
the current step number and pushing the corresponding route. Step 1 hides the Back button.
Step 8 replaces "Continue" with "Submit" and disables it until `subscription` is set.

---

## Key Decisions

1. **Local context over URL params for state.** Onboarding state is held in a single
   `OnboardingProvider` that wraps all step routes via the layout. This avoids serialising
   complex state (Files, arrays) into URL search params or localStorage on every keystroke.
   A future backend integration would replace `submit()` with a server action.

2. **No `LayoutProps<"/onboarding">`** — the generated `routes.d.ts` only includes `"/"` in
   `LayoutRoutes` at project bootstrap. Using an explicit inline type avoids a TypeScript
   error that would block the build. This is documented above and in the layout file.

3. **Verification documents as a configurable array.** The default `verification` slice is
   an array of document objects. Adding a new requirement only requires adding one entry to
   `DEFAULT_VERIFICATION_DOCS` in the context file — no JSX changes needed.

4. **Image previews via Object URLs.** No base64 encoding. `URL.createObjectURL()` is fast,
   memory-efficient for large images, and cleaned up on unmount. File objects remain in
   React state and are never serialised.

5. **No test framework setup required.** The project has no test framework configured
   (`package.json` has no test script). Verification uses `npm run build` (TypeScript
   compile + Next.js build) as the primary correctness gate, supplemented by manual
   dev-server checks for interactive features (drag-and-drop, chips, navigation).
