# Hotel application flow overhaul

Hotels no longer get created when a user submits the onboarding form. Instead, a `HotelApplication` staging record is created, an admin reviews and approves it, and only then is the `Hotel` record born. Subscription and plan selection are pushed entirely to the post-approval path. The change spans the Prisma schema, a new NestJS module, the onboarding context, the dashboard auth guard, the hotel-review page, and the admin verification page.

**Watch for:** double document upload (confirmed — step-3 uploads on file select, context uploads again at submit); `onboarding.ts` still exports the old `createHotel`/`createRoomType` functions but they're now unused dead code; admin verification history only shows REJECTED applications, not APPROVED ones; and `Hotel.subscriptionPlan` is non-nullable in the schema (defaults to `STARTER`) but the flow conceptually treats it as "not chosen yet."

**Verdict**: NEEDS_CHANGES

---

## High-level view

The Prisma schema is correct. `HotelApplication` is a proper staging model with a `UNIQUE` constraint on `ownerId`, full JSON blobs for images/documents/rooms, and a foreign key to `User`. The User model now carries the `hotelApplication` relation. `Hotel.subscriptionPlan` is not actually nullable — it defaults to `STARTER` — which is fine functionally (the value only matters once a subscription is chosen) but could mislead future readers who expect it to signal "not yet selected."

The `HotelApplications` NestJS module handles the full CRUD and approval lifecycle. Route ordering is correct: `GET my` is declared before `GET :id`, so NestJS resolves the static segment first. ConflictException fires on duplicate PENDING or APPROVED applications; a prior REJECTED application is silently replaced, allowing resubmission. The approve transaction creates Hotel, HotelImage, HotelDocument, and RoomType records in a single Prisma `$transaction`, with `isPublished: false` and `isActive: true`. A `HotelVerification` record is created immediately after the transaction in a separate call — this is outside the atomic boundary and could leave the hotel without a verification record if the server crashes between the two.

`DashboardAuthGuard` now performs a two-step check: `getMyHotel()` → if null, `getMyApplication()`. All application status branches are covered. Network errors are caught and surfaced as a retry prompt instead of a redirect loop, which is a clear improvement over the prior implementation.

`hotel-review/page.tsx` no longer has the apostrophe parse error. It covers all three application states (PENDING, REJECTED, APPROVED) with appropriate messaging and SVG icons throughout. The APPROVED branch delegates the "go to dashboard" flow to a refresh-then-redirect button rather than automatically navigating, which is reasonable given the eventual-consistency window between application approval and hotel creation.

The admin verification page fetches real data from `getAdminApplications`. Documents are rendered as clickable links, images as thumbnails, rooms as pill chips. The reject modal requires a non-empty notes field before confirming. The history table only shows REJECTED applications — APPROVED ones are not shown anywhere after they leave the pending queue.

The onboarding context's `submit()` function has been rewritten to call `submitApplication()` and never touches `createHotel`, `createRoomType`, or `saveHotelImage`. The upload sequence uploads documents and images to Supabase before calling the application endpoint. However, step-3 also uploads each document to Supabase immediately on file selection — meaning each document is uploaded twice before it reaches the backend.

---

<details>
<summary>Issues (6)</summary>

1. **Double document upload** — Step-3 uploads each document to Supabase on select (`await uploadDocument(...)` in `handleFileChange`), discards the returned URL, and stores only the `File` object in context. `OnboardingContext.submit()` then re-uploads every document from the same `File` object. Each file hits Supabase twice. Fix: either save the URL from step-3's upload into context and skip the re-upload in `submit()`, or remove the upload call from step-3's `handleFileChange` entirely so uploads happen only at submit time.

2. **`onboarding.ts` dead code** — `createHotel`, `createRoomType`, and `saveDocument` are still exported from `app/lib/api/onboarding.ts` and are no longer called anywhere in the onboarding flow. They will mislead future developers into thinking these endpoints are in use. Remove or clearly mark them.

3. **HotelVerification creation outside the transaction** — `approveApplication` runs `prisma.$transaction([...])` and then, only if that completes, calls `prisma.hotelVerification.create(...)` in a separate statement. If the process crashes between the two, the Hotel exists but no `HotelVerification` record is attached. Move the `hotelVerification.create` inside the `$transaction` array.

4. **Admin history only shows REJECTED** — The admin verification page calls `getAdminApplications({ status: 'REJECTED' })` for its history table. Approved applications disappear from the UI entirely after being processed. Admins have no way to audit past approvals. Add a second query for `APPROVED` or show a combined history with both statuses.

5. **Non-nullable `subscriptionPlan` on Hotel** — `Hotel.subscriptionPlan` is typed `SubscriptionPlan @default(STARTER)`, not nullable. The approve transaction creates the Hotel with no explicit `subscriptionPlan` value, so every new hotel silently gets `STARTER`. The business intent is "no plan selected yet," but the schema doesn't express this. Consider making the field nullable (`SubscriptionPlan?`) so the "not chosen" state is unambiguous.

6. **Step-5 upload URL lost on error** — In `step-5/handleFileChange`, if the upload throws, `updateImageSlot(id, file, '')` is called with an empty string URL. The file reference is kept in context, and `OnboardingContext.submit()` will attempt to re-upload it — which is the desired fallback. But `submit()` calls `uploadImage(slot.file, 'application', slot.id)` and expects a non-empty URL to include in the payload; an empty URL from a failed upload will silently carry through as a zero-byte image entry. The error path in step-5 should either clear the slot (`updateImageSlot(id, null, '')`) so the re-upload in submit works correctly, or not call `updateImageSlot` at all on error.

</details>

<details>
<summary>Details</summary>

## Double upload in document handling

Step-3's `handleFileChange` calls `await uploadDocument(file, 'application', id)` synchronously on every file pick, shows a spinner while it runs, and then discards the returned URL — only the `File` object is written to context via `updateVerification(id, file)`. When the user later reaches step-7 and hits Submit, `OnboardingContext.submit()` iterates the same `verification` array and calls `uploadDocument(doc.file, 'application', doc.id)` again for every file that has a `File` object attached. The result is two Supabase uploads per document, two objects in storage, and the URL used in the application payload comes from the second upload, not the first.

The fix is a one-of-two options: store the URL from step-3's upload in context (requires adding a `url` field to `VerificationDocument`) and skip the upload in `submit()` when a URL is already present; or strip the `await uploadDocument(...)` call from step-3's `handleFileChange` entirely and only show a visual "checking" state without uploading.

## Transaction atomicity gap in `approveApplication`

The approval path executes three operations inside `$transaction`: updating the application, creating the Hotel (with images, documents, room types nested), and updating the user role. A fourth operation — `prisma.hotelVerification.create(...)` — runs outside the transaction boundary after `await this.prisma.$transaction([...])` returns. If the server process dies, receives SIGKILL, or the DB connection drops between the transaction commit and the verification create, the Hotel record exists and is fully active (`isActive: true`, `verificationStatus: 'APPROVED'`) but has no linked `HotelVerification` row. The `Hotel.verification` relation is typed as `HotelVerification?` so queries won't error, but it leaves an audit gap that the verification endpoint would expose. Moving the `hotelVerification.create` into the `$transaction` array eliminates the gap.

## Admin approved application audit gap

The admin page's `load()` function fetches `PENDING` and `REJECTED` applications in parallel and shows them in two distinct UI sections. The `APPROVED` slice is never fetched. Once an admin approves an application it disappears from the pending queue and has nowhere else to appear. The history table is titled "Recently Rejected" and only shows rejected rows. Adding `getAdminApplications({ status: 'APPROVED' })` to the `Promise.all` and adding an approved-history section (even collapsed) would close this gap.

## `onboarding.ts` dead code

The file at `app/lib/api/onboarding.ts` exports `createHotel`, `createRoomType`, and `saveDocument`. None of these are imported anywhere in the onboarding flow now that the context has been rewritten. `createSubscription` is still used by the subscription page. The dead exports should be removed to avoid confusion.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `prisma/schema.prisma` | Added `ApplicationStatus` enum and `HotelApplication` model; added `hotelApplication` relation to `User` |
| `prisma/migrations/…add_hotel_application/migration.sql` | New migration creating `HotelApplication` table with unique index on `ownerId` |
| `src/hotel-applications/hotel-applications.service.ts` | New service: submit, getMyApplication, getApplicationById, listApplications, approveApplication (with transaction), rejectApplication |
| `src/hotel-applications/hotel-applications.controller.ts` | New controller: all six routes with correct role guards |
| `src/hotel-applications/hotel-applications.module.ts` | New module wiring service and controller |
| `src/hotel-applications/dto/create-application.dto.ts` | New DTO with nested ApplicationImageDto, ApplicationDocumentDto, ApplicationRoomDto |
| `src/app.module.ts` | Added `HotelApplicationsModule` to the imports array |
| `src/admin/admin.service.ts` | `approveHotel`: changed `isPublished: true` to `isPublished: false` |
| `app/lib/api/applications.ts` | New API client file for all hotel-application endpoints |
| `app/dashboard/components/DashboardAuthGuard.tsx` | Two-step hotel+application check; error state shows retry instead of redirecting |
| `app/hotel-review/page.tsx` | Full rewrite: uses `getMyApplication`, three status branches, SVG icons, no parse error |
| `app/admin/hotels/verification/page.tsx` | Full rewrite: real data from applications API, document links, image thumbnails, reject modal |
| `app/onboarding/context/OnboardingContext.tsx` | Removed hotel/room-type creation; `submit()` calls `submitApplication()` instead |
| `app/onboarding/steps/step-3/page.tsx` | Uploads on file select, disables navigation during upload |
| `app/onboarding/steps/step-5/page.tsx` | Uploads on file select, disables navigation during upload |
| `app/onboarding/components/FileUploadSlot.tsx` | Added `isLoading` prop, spinner overlay |
| `app/onboarding/components/StepShell.tsx` | Added `isBackDisabled` prop |
| `app/components/Toast.tsx` | New component with auto-dismiss, SVG icons, `useToast` hook |
| `app/auth/signup/page.tsx` | Added `Toast` on successful account creation |
| `app/lib/api/onboarding.ts` | Minor cleanup (dead `createHotel` etc. remain in file) |

Full diff: `git diff origin/master HEAD` in both `hotel-os` and `hotel-os-api`.

</details>
