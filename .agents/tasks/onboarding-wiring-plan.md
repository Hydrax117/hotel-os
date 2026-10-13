# Implementation Plan — Onboarding API Wiring

## Context & Decisions

- **Auth** — `register()` in `app/lib/api/auth.ts` expects `{ email, password, firstName, lastName, phone?, role? }`. The context's `account.name` is a full name; split on the first space to get `firstName` / `lastName`. Register first; the returned tokens are stored by `register()` itself via `storeTokens` + `storeUser`.
- **Hotel creation** — POST `/api/v1/hotels` after registration using the `property` + `propertyInfo` fields. The returned `hotel.id` drives every subsequent call.
- **Document upload** — Supabase, using a separate `hotel-documents` bucket (not `hotel-images`). Add `uploadDocument()` to `app/lib/supabase.ts` mirroring `uploadImage()`. After upload, save the public URL to the backend via POST `/api/v1/hotels/:id/documents`.
- **Image upload** — reuse the existing `uploadImage()` + `saveHotelImage()` from `app/lib/supabase.ts` and `app/lib/api/images.ts`. Upload only slots that have a `file`; skip nulls.
- **Room types** — POST `/api/v1/hotels/:id/room-types` per room. The `RoomType` fields map directly to the backend payload.
- **Subscription** — POST `/api/v1/hotels/:id/subscription` with `{ plan: subscription }`.
- **submit() shape** — change from `() => void` to `() => Promise<void>`. `StepShell.onNext` is typed as `() => void`; widen it to `() => void | Promise<void>` so the button can fire an async handler without a TS error.
- **New state fields** — add `submitting: boolean`, `submitError: string | null`, `submitStep: string | null` to `OnboardingState` and expose them in `OnboardingContextValue`.
- **No test framework is configured** — verification is `next build` passing with no type errors.
- **Import alias** — project uses `@/` mapped to the workspace root; always import with that alias.

---

## Plan

- [ ] 1. Add `uploadDocument` to `app/lib/supabase.ts`.
      Copy the shape of `uploadImage()` but target a separate `hotel-documents` bucket via a new `DOCUMENTS_BUCKET` constant (default `'hotel-documents'`). Export `DOCUMENTS_BUCKET` and `STORAGE_BUCKET` so callers can reference them by name. The function signature:
      ```ts
      export async function uploadDocument(
        file: File,
        hotelId: string,
        docType: string,
      ): Promise<string>
      ```
      Path pattern: `` `${hotelId}/${docType}/${crypto.randomUUID()}.${ext}` ``.
      Files: `app/lib/supabase.ts`
      Verify: `npx next build` — no TypeScript errors in `supabase.ts`.

- [ ] 2. Create `app/lib/api/onboarding.ts` — all backend calls needed after registration.
      Follow the exact pattern in `bookings.ts` and `images.ts`: import `apiClient` from `'./client'`, define typed response shapes, export plain async functions.

      Types to define:
      ```ts
      export type CreateHotelPayload = {
        name: string;
        description: string;
        address: string;
        city: string;
        state: string;
        country: string;
        latitude?: number;
        longitude?: number;
        amenities?: string[];
        checkInTime?: string;
        checkOutTime?: string;
        cancellationPolicy?: string;
        houseRules?: string;
        languages?: string[];
      };

      export type HotelResponse = {
        id: string;
        name: string;
        status: string;
        // add further fields as the API returns them; at minimum id is required
      };

      export type CreateRoomTypePayload = {
        name: string;
        capacity: number;
        bedType: string;
        bathroomType: string;
        totalRooms: number;
        pricePerNight: number;
      };

      export type RoomTypeResponse = { id: string; name: string };

      export type SaveDocumentPayload = {
        url: string;
        documentType: string;
        label: string;
      };

      export type DocumentResponse = { id: string; url: string; documentType: string };

      export type CreateSubscriptionPayload = { plan: string };
      export type SubscriptionResponse = { id: string; plan: string; status: string };
      ```

      Functions:
      ```ts
      // POST /api/v1/hotels
      export function createHotel(payload: CreateHotelPayload): Promise<HotelResponse>

      // POST /api/v1/hotels/:hotelId/room-types
      export function createRoomType(hotelId: string, payload: CreateRoomTypePayload): Promise<RoomTypeResponse>

      // POST /api/v1/hotels/:hotelId/documents
      export function saveDocument(hotelId: string, payload: SaveDocumentPayload): Promise<DocumentResponse>

      // POST /api/v1/hotels/:hotelId/subscription
      export function createSubscription(hotelId: string, payload: CreateSubscriptionPayload): Promise<SubscriptionResponse>
      ```

      Note: `saveHotelImage` already exists in `app/lib/api/images.ts` — import from there in the context, do not duplicate it here.
      Files: `app/lib/api/onboarding.ts`
      Verify: `npx next build` — no TypeScript errors.

- [ ] 3. Widen `StepShell.onNext` to accept an async handler.
      Change the `onNext` prop type from `() => void` to `() => void | Promise<void>`. The button's `onClick` calls `onNext()` and the JSX engine discards the returned promise safely — this is the standard React pattern for async button handlers. No other changes to `StepShell.tsx`.
      Files: `app/onboarding/components/StepShell.tsx`
      Verify: `npx next build` — no TypeScript errors.

- [ ] 4. Add new async state fields and rewrite `submit()` in `OnboardingContext.tsx`.

      **State additions** — extend `OnboardingState`:
      ```ts
      submitting: boolean;       // true while API calls are in flight
      submitError: string | null; // human-readable error message, null on success
      submitStep: string | null;  // e.g. "Creating account…" for progress display
      ```
      Add corresponding fields to `OnboardingContextValue` (same types, read-only from consumers).
      Add defaults: `submitting: false, submitError: null, submitStep: null`.

      **Imports to add at the top of the file** (all from existing modules):
      ```ts
      import { register } from '@/app/lib/api/auth';
      import {
        createHotel,
        createRoomType,
        saveDocument,
        createSubscription,
      } from '@/app/lib/api/onboarding';
      import { saveHotelImage } from '@/app/lib/api/images';
      import { uploadImage, uploadDocument } from '@/app/lib/supabase';
      ```

      **`submit()` implementation** — change the signature on `OnboardingContextValue` to `submit: () => Promise<void>` and implement the full sequence inside the provider:

      ```ts
      const submit = async (): Promise<void> => {
        setState(s => ({ ...s, submitting: true, submitError: null, submitStep: 'Creating account…' }));
        try {
          // 1. Register account — storeTokens/storeUser are called inside register()
          const nameParts = state.account.name.trim().split(/\s+/);
          const firstName = nameParts[0] ?? '';
          const lastName = nameParts.slice(1).join(' ') || firstName;
          await register({
            email: state.account.email,
            password: state.account.password,
            firstName,
            lastName,
            phone: state.account.phone || undefined,
            role: 'HOTEL_OWNER',
          });

          // 2. Create hotel
          setState(s => ({ ...s, submitStep: 'Creating hotel…' }));
          const hotel = await createHotel({
            name: state.property.hotelName,
            description: state.property.description,
            address: state.property.address,
            city: state.property.city,
            state: state.property.state,
            country: state.property.country,
            latitude: state.property.latitude ? parseFloat(state.property.latitude) : undefined,
            longitude: state.property.longitude ? parseFloat(state.property.longitude) : undefined,
            amenities: state.propertyInfo.amenities,
            checkInTime: state.propertyInfo.checkInTime,
            checkOutTime: state.propertyInfo.checkOutTime,
            cancellationPolicy: state.propertyInfo.cancellationPolicy || undefined,
            houseRules: state.propertyInfo.houseRules || undefined,
            languages: state.propertyInfo.languages,
          });
          const hotelId = hotel.id;

          // 3. Upload & save verification documents
          setState(s => ({ ...s, submitStep: 'Uploading documents…' }));
          for (const doc of state.verification) {
            if (!doc.file) continue;
            const url = await uploadDocument(doc.file, hotelId, doc.id);
            await saveDocument(hotelId, { url, documentType: doc.id, label: doc.label });
          }

          // 4. Upload & save hotel images
          setState(s => ({ ...s, submitStep: 'Uploading images…' }));
          for (const slot of state.images) {
            if (!slot.file) continue;
            const url = await uploadImage(slot.file, hotelId, slot.id);
            await saveHotelImage(hotelId, { url, caption: slot.label, isPrimary: slot.id === 'exterior', sortOrder: 0 });
          }

          // 5. Create room types
          setState(s => ({ ...s, submitStep: 'Saving room types…' }));
          for (const room of state.rooms) {
            await createRoomType(hotelId, {
              name: room.name,
              capacity: room.capacity,
              bedType: room.bedType,
              bathroomType: room.bathroomType,
              totalRooms: room.totalRooms,
              pricePerNight: room.pricePerNight,
            });
          }

          // 6. Create subscription
          setState(s => ({ ...s, submitStep: 'Activating subscription…' }));
          if (state.subscription) {
            await createSubscription(hotelId, { plan: state.subscription });
          }

          // Done — clear password from state
          setState(s => ({
            ...s,
            submitted: true,
            submitting: false,
            submitStep: null,
            account: { ...s.account, password: '' },
          }));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
          setState(s => ({ ...s, submitting: false, submitStep: null, submitError: message }));
        }
      };
      ```

      **Important TS note**: Inside the `submit` closure, always read from `state` (captured at call time), not from `s` inside `setState` callbacks, because the sequence of `await` calls means `state` holds the snapshot at the moment `submit` was invoked. Each intermediate `setState(s => ...)` call only updates the progress fields; the full data snapshot is read from the outer `state` binding.

      Files: `app/onboarding/context/OnboardingContext.tsx`
      Verify: `npx next build` — no TypeScript errors.

- [ ] 5. Update `step-8/page.tsx` — submitting overlay, error banner, and async `onNext`.

      Destructure the three new fields from `useOnboarding()`:
      ```ts
      const { ..., submitting, submitError, submitStep, submit } = useOnboarding();
      ```

      **Submit button** — pass `submitting` to `isNextDisabled` (OR the existing `isSubmitDisabled`):
      ```ts
      isNextDisabled={isSubmitDisabled || submitting}
      ```

      **`onNext` prop** — `StepShell.onNext` is now `() => void | Promise<void>`, so pass `submit` directly:
      ```ts
      onNext={submit}
      ```
      No wrapper needed; TypeScript will accept it after item 3.

      **Error banner** — render above `<SummarySection>` rows when `submitError` is non-null:
      ```tsx
      {submitError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}
      ```

      **Progress overlay** — render when `submitting` is true, overlaying the whole step:
      ```tsx
      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
          <svg className="h-8 w-8 animate-spin text-[var(--ob-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm font-medium text-[var(--ob-primary)]">{submitStep ?? 'Submitting…'}</p>
        </div>
      )}
      ```
      Place the overlay **outside** the `<StepShell>` wrapper so it covers the whole viewport regardless of scroll position.

      Files: `app/onboarding/steps/step-8/page.tsx`
      Verify: `npx next build` — no TypeScript errors.

- [ ] 6. Update `step-3/page.tsx` — add per-document security note.
      Below each `<FileUploadSlot>` (inside the `.map()`) add a small disclaimer line:
      ```tsx
      <p className="mt-1 text-xs text-[var(--ob-secondary)]">
        Stored securely and used only for verification purposes.
      </p>
      ```
      Wrap the slot + note in a `<div key={doc.id}>` so the `key` moves to the wrapper and can be removed from `<FileUploadSlot>` (or keep the key on both — React only requires it on the outermost mapped element).
      Files: `app/onboarding/steps/step-3/page.tsx`
      Verify: `npx next build` — no TypeScript errors.

---

## Final Build Check

After all items are complete, run:

```
npx next build
```

Expected: build completes with 0 type errors and 0 lint errors. There is no test runner configured in `package.json` beyond `eslint`, so the build + lint pass is the authoritative verification gate.

---

## Potential TS Issues to Avoid

1. **`submit` return type mismatch** — `OnboardingContextValue.submit` must be typed as `() => Promise<void>`, not `() => void`. The old sync signature will cause a TS error when the `value` object is assembled.
2. **`onNext` prop in StepShell** — after widening to `() => void | Promise<void>`, the button's `onClick` fires `onNext()` and discards the promise. This is fine for React but add `// eslint-disable-next-line @typescript-eslint/no-floating-promises` only if ESLint is configured with that rule — check before adding.
3. **`parseFloat` on empty string** — `parseFloat('')` returns `NaN`. Guard with a ternary: `latitude ? parseFloat(latitude) : undefined`.
4. **`state` vs `s` in async closures** — see item 4 note. Never try to read `rooms`, `images`, etc., from inside a `setState(s => ...)` callback after an `await`; use the captured `state` snapshot instead.
5. **`hotel-documents` bucket** — this bucket must exist in your Supabase project before running the onboarding flow. Create it in the Supabase dashboard (Storage → New bucket → name: `hotel-documents`, set Public). If RLS is enabled, add a policy allowing authenticated inserts.
