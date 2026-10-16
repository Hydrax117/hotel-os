# Implementation Plan — Hotel Application / Approval Flow

> Codebase read on: both projects fully explored.  
> Key finding: the current `submit()` in `OnboardingContext.tsx` calls `POST /api/v1/hotels` which creates a `Hotel` record immediately. The plan below replaces that end-to-end with a `HotelApplication` staging table. No Hotel record is created until admin approves; subscription/plan selection comes after approval.

---

## Naming / conflict notes (discovered by reading actual code)

| Item | Note |
|---|---|
| `SubscriptionPlan` enum in schema | Already exists (`STARTER`, `PROFESSIONAL`, `ENTERPRISE`). The new `HotelApplication` model will reference it as **nullable** (null = not yet chosen). |
| `VerificationStatus` enum in schema | Already exists. Will be reused on `HotelApplication`. |
| `AdminApproveHotelDto` | Lives in **both** `src/admin/dto/approve-hotel.dto.ts` and `src/hotels/dto/approve-hotel.dto.ts`. The new application-approve DTO will be a separate file in `src/hotel-applications/dto/`. |
| `getMyHotel()` in `dashboard.ts` | Returns `null` on 404. `DashboardAuthGuard` uses this to decide routing. The guard must be updated to also handle the `PENDING_APPLICATION` state. |
| `onboarding.ts` → `createHotel()` | Must be replaced with `submitApplication()` targeting the new `POST /api/v1/hotel-applications` endpoint. |
| `hotel-review/page.tsx` parse error | The file has an apostrophe in a string literal on line 88 that broke the build: `"We'll email you"`. This is fixed as part of the rewrite of that file. |
| Step 8 | Currently just redirects to step 7. The subscription step (currently inside onboarding) will be moved to a **new** `/onboarding/subscription` route that only appears after approval. Step 8 stays as a redirect. |
| `DOC_ITEMS` checklist in admin verification page | Currently hard-coded strings with check icons regardless of real data. Must be replaced with actual document links fetched from the application payload. |

---

## Build order: backend first, then frontend

---

## BACKEND

### Step 1 — Add `HotelApplication` model to Prisma schema

Add the new model and enum after the existing `Hotel` block.

**Files:** `c:\Users\Pkaka\music\hotel-os-api\prisma\schema.prisma`

```prisma
enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
}

model HotelApplication {
  id          String            @id @default(cuid())
  ownerId     String            @unique          // one pending application per owner
  owner       User              @relation(fields: [ownerId], references: [id])
  status      ApplicationStatus @default(PENDING)
  adminNotes  String?

  // Hotel details (mirrors Hotel fields)
  name        String
  description String?
  address     String
  city        String
  state       String
  country     String  @default("Nigeria")
  latitude    Float?
  longitude   Float?
  phone       String?
  email       String?
  checkInTime  String @default("14:00")
  checkOutTime String @default("12:00")

  // Stored as JSON arrays (serialized before persist)
  amenityIds  String[]
  languages   String[]

  // Images and documents stored as JSON arrays of {url, caption, isPrimary, sortOrder} / {url, documentType, label}
  images      Json  @default("[]")
  documents   Json  @default("[]")

  // Room types stored as JSON array of room data
  rooms       Json  @default("[]")

  reviewedBy  String?
  reviewedAt  DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Also add the `hotelApplications` relation to the `User` model:

```prisma
hotelApplications  HotelApplication[]
```

The `Hotel.subscriptionPlan` field keeps its current default (`STARTER`) — this is fine; it will only be set when the subscription step runs after approval. No schema change needed for that field.

**Verify:** `cd c:\Users\Pkaka\music\hotel-os-api; npx prisma validate` — no errors.

---

### Step 2 — Run database migration

DB is reachable (Supabase PostgreSQL at `aws-0-eu-west-1.pooler.supabase.com` — confirmed by `prisma db pull` succeeding). Use `migrate dev` which will generate and apply the migration.

```bash
cd c:\Users\Pkaka\music\hotel-os-api
npx prisma migrate dev --name add-hotel-application
npx prisma generate
```

**Verify:** migration file appears in `prisma/migrations/`, `npx prisma validate` passes, and `npx prisma generate` completes without errors.

---

### Step 3 — Create `HotelApplications` NestJS module

Create the following files:

**`src/hotel-applications/dto/create-application.dto.ts`**
Fields to validate:
- `name` — `@IsString() @MinLength(2)`
- `description` — `@IsString() @MinLength(20)`
- `address`, `city`, `state` — `@IsString()`
- `country` — `@IsString() @IsOptional()`
- `latitude`, `longitude` — `@IsNumber() @IsOptional()`
- `phone` — `@IsString() @IsOptional()`
- `email` — `@IsEmail() @IsOptional()`
- `checkInTime`, `checkOutTime` — `@IsString() @IsOptional()`
- `amenityIds` — `@IsArray() @IsString({ each: true }) @IsOptional()`
- `languages` — `@IsArray() @IsString({ each: true }) @IsOptional()`
- `images` — `@IsArray() @ValidateNested({ each: true })` — each item: `{ url: string; caption?: string; isPrimary?: boolean; sortOrder?: number }`
- `documents` — `@IsArray() @ValidateNested({ each: true })` — each item: `{ url: string; documentType: string; label: string }`
- `rooms` — `@IsArray() @ValidateNested({ each: true }) @ArrayMinSize(1)` — each item mirrors `CreateRoomTypeDto` fields (`name`, `bedType`, `capacity`, `pricePerNight`, `totalRooms`, optional: `description`, `sizeSqm`, `bathroomType`)

**`src/hotel-applications/hotel-applications.service.ts`**

Service methods:
- `submitApplication(ownerId: string, dto: CreateApplicationDto): Promise<HotelApplication>`
  - Checks: if a `Hotel` already exists for this owner → throw `ConflictException('You already have an approved hotel')`
  - Checks: if an application with status `PENDING` already exists → throw `ConflictException('You already have a pending application')`
  - Creates the `HotelApplication` record with `status: PENDING`
- `getMyApplication(ownerId: string): Promise<HotelApplication | null>`
  - Returns the most recent application for `ownerId` (any status), or null
- `getApplicationById(id: string): Promise<HotelApplication>`
  - Returns the full application record; throws `NotFoundException` if missing
- `listApplications(status?: ApplicationStatus): Promise<HotelApplication[]>`
  - Used by admin to list all applications filtered by optional status, ordered by `createdAt asc`, includes owner via `include: { owner: { select: { firstName, lastName, email } } }`
- `approveApplication(id: string, adminId: string, notes?: string): Promise<Hotel>`
  - Fetches the application; throws `NotFoundException` if not found
  - Throws `ConflictException` if `status !== PENDING`
  - Checks: if a Hotel already exists for this owner → throw `ConflictException`
  - Runs a Prisma `$transaction([...])` that:
    1. Updates `HotelApplication` → `status: APPROVED`, `reviewedBy: adminId`, `reviewedAt: now()`
    2. Creates `Hotel` from application fields (use `generateSlug(app.name)` from `src/common/utils/slug.ts`), sets `verificationStatus: APPROVED`, `isActive: true`, `isPublished: false`
    3. Creates `HotelVerification` for the new hotel
    4. Creates `HotelImage[]` from `app.images` (JSON array)
    5. Creates `HotelDocument[]` from `app.documents` (JSON array)
    6. Creates `RoomType[]` from `app.rooms` (JSON array) — use `RoomType` model via `prisma.roomType.createMany()`
    7. Updates `User.role` to `HOTEL_OWNER` (it should already be, but ensure it)
  - Returns the newly created `Hotel`
- `rejectApplication(id: string, adminId: string, notes: string): Promise<HotelApplication>`
  - Updates `HotelApplication` → `status: REJECTED`, `adminNotes: notes`, `reviewedBy: adminId`, `reviewedAt: now()`

**`src/hotel-applications/hotel-applications.controller.ts`**

Routes:
- `POST /hotel-applications` — `@Roles(UserRole.HOTEL_OWNER)` — calls `submitApplication(user.userId, dto)`
- `GET /hotel-applications/my` — `@Roles(UserRole.HOTEL_OWNER)` — calls `getMyApplication(user.userId)`, returns 404 if null
- `GET /hotel-applications` — `@Roles(UserRole.SUPER_ADMIN)` — calls `listApplications(query.status)`
- `GET /hotel-applications/:id` — `@Roles(UserRole.SUPER_ADMIN)` — calls `getApplicationById(id)`
- `POST /hotel-applications/:id/approve` — `@Roles(UserRole.SUPER_ADMIN)` — body: `{ notes?: string }` — calls `approveApplication(id, user.userId, body.notes)`
- `POST /hotel-applications/:id/reject` — `@Roles(UserRole.SUPER_ADMIN)` — body: `{ notes: string }` — calls `rejectApplication(id, user.userId, body.notes)`

All routes use `@UseGuards(JwtAuthGuard, RolesGuard)` and `@ApiBearerAuth()`.

**`src/hotel-applications/hotel-applications.module.ts`**

Imports: `PrismaModule`, `ConfigModule`. Providers: `HotelApplicationsService`. Controllers: `HotelApplicationsController`. Exports: `HotelApplicationsService`.

**Files:**
- `src/hotel-applications/dto/create-application.dto.ts` (new)
- `src/hotel-applications/hotel-applications.service.ts` (new)
- `src/hotel-applications/hotel-applications.controller.ts` (new)
- `src/hotel-applications/hotel-applications.module.ts` (new)

**Verify:** `cd c:\Users\Pkaka\music\hotel-os-api; npm run build` — compiles without errors.

---

### Step 4 — Register `HotelApplicationsModule` in `AppModule`

Add `HotelApplicationsModule` import to `src/app.module.ts`.

**File:** `src/app.module.ts`

Add:
```typescript
import { HotelApplicationsModule } from './hotel-applications/hotel-applications.module.js';
// ... in @Module imports array:
HotelApplicationsModule,
```

**Verify:** `npm run build` — compiles without errors.

---

### Step 5 — Update `AdminService.getPlatformStats()` to count applications

The `pendingVerifications` counter currently counts `Hotel` rows with `status: PENDING`. Add a separate `pendingApplications` counter using `prisma.hotelApplication.count({ where: { status: 'PENDING' } })`.

Add `pendingApplications: number` to:
- `src/admin/admin.types.ts` → `PlatformStats` type
- `src/admin/admin.service.ts` → `getPlatformStats()` method

**Files:**
- `src/admin/admin.service.ts`
- `src/admin/admin.types.ts`

**Verify:** `npm run build` — no TS errors.

---

### Step 6 — Backend integration test (manual smoke test)

Start the server with `npm run start:dev`. Confirm:
- `POST /api/v1/hotel-applications` with a valid JWT returns `201` with the application id
- `GET /api/v1/hotel-applications/my` returns the application
- `GET /api/v1/hotel-applications?status=PENDING` (admin JWT) returns the application in the list
- `POST /api/v1/hotel-applications/:id/approve` creates a Hotel record and returns it
- `POST /api/v1/hotel-applications/:id/reject` updates status to REJECTED with notes

**Verify:** `npm run build` passes. Unit tests pass with `npm run test`.

---

## FRONTEND

### Step 7 — Create `app/lib/api/applications.ts`

New file with the following types and functions:

```typescript
// Types
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ApplicationImage = { url: string; caption?: string; isPrimary?: boolean; sortOrder?: number };
export type ApplicationDocument = { url: string; documentType: string; label: string };
export type ApplicationRoom = { name: string; bedType: string; capacity: number; pricePerNight: number; totalRooms: number; description?: string; bathroomType?: string };

export type HotelApplication = {
  id: string;
  ownerId: string;
  status: ApplicationStatus;
  adminNotes?: string | null;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  email?: string;
  checkInTime: string;
  checkOutTime: string;
  amenityIds: string[];
  languages: string[];
  images: ApplicationImage[];
  documents: ApplicationDocument[];
  rooms: ApplicationRoom[];
  createdAt: string;
  updatedAt: string;
  owner?: { firstName: string; lastName: string; email: string };
};

export type SubmitApplicationPayload = {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  checkInTime?: string;
  checkOutTime?: string;
  amenityIds?: string[];
  languages?: string[];
  images: ApplicationImage[];
  documents: ApplicationDocument[];
  rooms: ApplicationRoom[];
};
```

Functions:
- `submitApplication(payload: SubmitApplicationPayload): Promise<HotelApplication>` → `POST /api/v1/hotel-applications`
- `getMyApplication(): Promise<HotelApplication | null>` → `GET /api/v1/hotel-applications/my`, return null on 404
- `getAdminApplications(params?: { status?: string; page?: number; limit?: number }): Promise<{ applications: HotelApplication[]; total: number }>` → `GET /api/v1/hotel-applications` with query params
- `getAdminApplicationDetail(id: string): Promise<HotelApplication>` → `GET /api/v1/hotel-applications/:id`
- `approveApplication(id: string, notes?: string): Promise<unknown>` → `POST /api/v1/hotel-applications/:id/approve`
- `rejectApplication(id: string, notes: string): Promise<unknown>` → `POST /api/v1/hotel-applications/:id/reject`

**File:** `app/lib/api/applications.ts` (new)

**Verify:** `npm run build` — TypeScript compiles, no import errors.

---

### Step 8 — Create `app/components/Toast.tsx`

A lightweight toast notification component. Implementation:
- Renders a fixed-position container (`position: fixed; bottom: 24px; right: 24px; z-index: 9999`)
- Accepts: `message: string`, `type: 'success' | 'error' | 'info'`, `onClose: () => void`, `duration?: number` (default 4000)
- Uses `useEffect` to auto-dismiss after `duration` ms
- Uses icons (SVG inline, no emoji): check circle for success, X circle for error, info circle for info
- Colors: success → green bg `#dcfce7` / text `#16a34a`; error → red `#fee2e2` / `#dc2626`; info → blue `#dbeafe` / `#1d4ed8`

Also create a `useToast` hook in the same file:
```typescript
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const show = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ message, type });
  const hide = () => setToast(null);
  return { toast, show, hide };
}
```

**File:** `app/components/Toast.tsx` (new)

**Verify:** `npm run build` — no TypeScript errors.

---

### Step 9 — Rewrite `OnboardingContext.tsx` — replace hotel creation with application submission

**File:** `app/onboarding/context/OnboardingContext.tsx`

Changes:
1. Remove imports of `createHotel`, `createRoomType` from `onboarding.ts` and `saveHotelImage` from `images.ts`
2. Import `submitApplication` from `applications.ts`
3. Remove `subscription: SubscriptionPlan` from `OnboardingState` — subscription selection is post-approval only
4. Remove `setSubscription` from context value
5. Rewrite `submit()` to:
   a. Run the same pre-flight validation (property, required docs, rooms)
   b. `setState submitting: true, submitStep: 'Uploading documents…'`
   c. Upload each required/optional document that has a file to Supabase via `uploadDocument()` — collect `{ url, documentType: doc.id, label: doc.label }` objects
   d. `setState submitStep: 'Uploading images…'`
   e. Upload each image slot that has a file to Supabase via `uploadImage()` — collect `{ url, caption: slot.label, isPrimary: slot.id === 'exterior', sortOrder: idx }` objects
   f. `setState submitStep: 'Submitting application…'`
   g. Call `submitApplication({ name, description, address, city, state, country, latitude, longitude, amenityIds: propertyInfo.amenities, languages: propertyInfo.languages, checkInTime, checkOutTime, images, documents, rooms })`
   h. On success: `setState submitted: true, submitting: false`
   i. On error: `setState submitting: false, submitError: message`

**Note on file upload order:** Documents and images are uploaded to Supabase before the application is submitted (same pattern as before, just without creating a hotel first). The `hotelId` path segment is replaced with `'application'` as a logical folder since no hotel exists yet — use `uploadDocument(file, 'application', doc.id)` and `uploadImage(file, 'application', slot.id)`.

**Verify:** `npm run build` — no TypeScript errors.

---

### Step 10 — Add upload-on-select loading state to Step 3 (documents)

**File:** `app/onboarding/steps/step-3/page.tsx`

Current: `onChange={file => updateVerification(doc.id, file)}` — synchronous, no loading.

Changes:
1. Add `uploadingIds: Set<string>` state
2. `handleFileChange(id: string, file: File)`:
   - Add `id` to `uploadingIds` (disable Next/Prev buttons)
   - Call `uploadDocument(file, 'application', id)` from `supabase.ts`
   - On success: call `updateVerification(id, file)` — store the file reference so the upload URL is recoverable
   - On error: show an inline error below that slot
   - Remove `id` from `uploadingIds` regardless
3. Pass `uploadingIds.size > 0` to `StepShell`'s `isNextDisabled` and `isBackDisabled` props (check that `StepShell` accepts `isBackDisabled` — if it doesn't, add that prop)
4. Add a loading spinner inside `FileUploadSlot` when the slot's id is in `uploadingIds`. Pass `isLoading?: boolean` prop to `FileUploadSlot` and render a spinner overlay when true.

**Files:**
- `app/onboarding/steps/step-3/page.tsx`
- `app/onboarding/components/FileUploadSlot.tsx` — add `isLoading?: boolean` prop, render spinner when true

**Verify:** `npm run build` — no errors.

---

### Step 11 — Add upload-on-select loading state to Step 5 (images)

**File:** `app/onboarding/steps/step-5/page.tsx`

Current: uploads the image immediately on `handleFileChange` but doesn't block navigation.

Changes:
1. Add `uploadingIds: Set<string>` state
2. `handleFileChange(id: string, file: File)`:
   - Add `id` to `uploadingIds`
   - Call `uploadImage(file, 'application', id)` from `supabase.ts`
   - On success: `updateImageSlot(id, file, url)` (url returned from Supabase)
   - On error: show inline error; still call `updateImageSlot(id, file, '')` so the file reference is kept but the URL is empty
   - Remove `id` from `uploadingIds`
3. Pass `uploadingIds.size > 0` as `isNextDisabled` and `isBackDisabled` to `StepShell`
4. Pass `isLoading={uploadingIds.has(slot.id)}` to each `FileUploadSlot`

**File:** `app/onboarding/steps/step-5/page.tsx`

**Verify:** `npm run build` — no errors.

---

### Step 12 — Update `StepShell` to support `isBackDisabled`

Locate `app/onboarding/components/StepShell.tsx`. Add optional `isBackDisabled?: boolean` prop and wire it to the Back button's `disabled` attribute. This allows steps 3 and 5 to prevent navigation in both directions during upload.

**File:** `app/onboarding/components/StepShell.tsx`

**Verify:** `npm run build` — no TypeScript errors.

---

### Step 13 — Update Step 7 (review/submit page) to remove subscription section

**File:** `app/onboarding/steps/step-7/page.tsx`

Step 7 currently calls `submit()` which now submits an application (no hotel created). The UI summary remains the same except:
- Remove any subscription plan summary row (there may not be one in the current code, but confirm by reading the file — confirmed: no subscription row exists in SummarySections)
- The "submitted" success state redirects to `/hotel-review` — keep this

No breaking changes needed here; the `submit()` function signature and `submitted` flag are unchanged.

**Verify:** `npm run build` — no errors.

---

### Step 14 — Update `DashboardAuthGuard` for two-step check

**File:** `app/dashboard/components/DashboardAuthGuard.tsx`

Current logic for `HOTEL_OWNER`:
1. Calls `getMyHotel()` → null → send to `/onboarding/steps/step-2`
2. Calls `getMyHotel()` → PENDING status → send to `/hotel-review`
3. Calls `getMyHotel()` → approved → allow through

New logic:
1. Call `getMyHotel()` from `dashboard.ts`
   - If null (no hotel): call `getMyApplication()` from `applications.ts`
     - If null (no application either): send to `/onboarding/steps/step-2`
     - If application with status `PENDING` or `REJECTED`: send to `/hotel-review`
     - If application with status `APPROVED` but hotel doesn't exist yet: this is a race condition — send to `/hotel-review` (the page will show the plan-selection UI)
   - If hotel exists with `PENDING` status: send to `/hotel-review` (legacy hotel-before-approval data)
   - If hotel exists and approved: check if subscription exists / `isPublished`
     - If hotel exists, approved, but no subscription yet: also allow through to dashboard (plan selection is in subscription dashboard section)
     - If hotel exists and approved: allow through to dashboard
2. Add `isApprovedNoPlan` state: after approval and hotel creation, if `hotel.subscriptionPlan === null` (will be null after we adjust the schema) OR a simpler heuristic: just allow through if hotel exists and is not in a PENDING/REJECTED state
   - Since `Hotel.subscriptionPlan` has a default of `STARTER` in the current schema (not nullable), check `hotel.subscription` relation instead — but `DashboardHotel` type doesn't include `subscription`. Simpler: allow through to dashboard always when hotel exists and is APPROVED; the subscription page inside the dashboard handles the "no plan" state.

**Imports to add:** `getMyApplication` from `app/lib/api/applications.ts`

**New routing table for `HOTEL_OWNER`:**
```
getMyHotel() === null
  → getMyApplication() === null         → /onboarding/steps/step-2
  → application.status === 'PENDING'    → /hotel-review (shows "under review" UI)
  → application.status === 'REJECTED'   → /hotel-review (shows rejection UI)
  → application.status === 'APPROVED'   → /hotel-review (shows "select a plan" UI)
getMyHotel() exists && status is PENDING → /hotel-review (legacy row or race)
getMyHotel() exists && APPROVED          → allow through (hotel-review redirects to /dashboard/overview)
```

**Verify:** `npm run build` — no TypeScript errors.

---

### Step 15 — Rewrite `app/hotel-review/page.tsx`

**File:** `app/hotel-review/page.tsx`

The current file:
- Uses `getMyHotel()` which returns null if no hotel exists — but post-approval-flow, owners have an application not a hotel
- Has a build error (apostrophe in string literal on line 88)
- Always shows "under review" UI even after rejection

New behavior:
1. On mount: call `getMyApplication()` (not `getMyHotel()`)
2. If application is `null` → redirect to `/onboarding/steps/step-2`
3. If application status is `PENDING` → show the existing "under review" card UI (no changes needed to the design)
4. If application status is `REJECTED` → show a rejection UI:
   - Red/warning status pill ("Application Rejected")
   - Heading: "Your application was not approved"
   - If `application.adminNotes` exists, show it in a styled info box
   - CTA button: "Start a new application" → `router.push('/onboarding/steps/step-2')`
5. If application status is `APPROVED` and hotel does not yet exist (check via `getMyHotel()` returning null) → show a "Select your plan" UI:
   - Green status pill ("Application Approved!")
   - Heading: "Choose a plan to activate your hotel"
   - Three plan cards (Starter, Professional, Enterprise) with pricing and feature bullets
   - On plan select: call the subscription creation endpoint → `POST /api/v1/subscriptions/hotels/:hotelId` — but wait, we need the hotelId. Call `getMyHotel()` to get it after approval.
   - After subscription created → redirect to `/dashboard/overview`
6. If application is `APPROVED` and hotel exists → redirect to `/dashboard/overview` (same as current logic when hotel is APPROVED)

**Replace emojis with SVG icons:**
- 📋 → clipboard SVG
- 🔍 → search/magnifier SVG
- 🏨 → building SVG
- ✅ → check circle SVG
- 💡 → lightbulb SVG

**Fix the build error:** The current apostrophe issue (`We'll email you`) was caused by incorrect quotation. In the rewrite, use JSX string escaping: `We&apos;ll email you` or template literals.

**Verify:** `npm run build` — parse error gone, no TypeScript errors.

---

### Step 16 — Rewrite `app/admin/hotels/verification/page.tsx`

**File:** `app/admin/hotels/verification/page.tsx`

Current: fetches `AdminHotel[]` from `GET /api/v1/admin/hotels?status=PENDING`. New: fetches `HotelApplication[]` from `GET /api/v1/hotel-applications?status=PENDING`.

Changes:
1. Replace `getAdminHotels` import with `getAdminApplications`, `approveApplication`, `rejectApplication` from `applications.ts`
2. Replace the `DOC_ITEMS` hard-coded checklist with actual document links from `application.documents[]`:
   - Render each `{ url, label, documentType }` as a clickable link that opens in a new tab: `<a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.label}</a>`
3. Show image thumbnails from `application.images[]`:
   - Render a horizontal scrollable row of `<img>` thumbnails (max height 80px) with captions
4. Replace `handleApprove` to call `approveApplication(id)` with optional notes
5. Replace `handleReject` to call `rejectApplication(id, notes)` — add a small inline textarea for rejection notes before confirming reject
6. Update the "Verification History" table to also show REJECTED applications (call `getAdminApplications({ status: 'REJECTED', limit: 10 })`)
7. Fix all type references: use `HotelApplication` from `applications.ts` instead of `AdminHotel` from `admin.ts`
8. Replace emoji icons (📋, ✅) with the same SVG icons used in the hotel-review rewrite

**Naming conflict:** `AdminHotel` type in `admin.ts` is still used by other admin pages. Do not remove it. The verification page simply switches to `HotelApplication` type.

**Verify:** `npm run build` — no TypeScript errors.

---

### Step 17 — Add success toast to signup page

**File:** `app/auth/signup/page.tsx`

1. Import `useToast` and `Toast` from `app/components/Toast.tsx`
2. In `SignUpForm`, call `useToast()` to get `{ toast, show, hide }`
3. After successful `register()` call and before `router.push(...)`, call `show('Account created successfully!', 'success')`
4. Render `{toast && <Toast message={toast.message} type={toast.type} onClose={hide} />}` inside the component

Note: the redirect happens immediately after signup, so the toast will only be visible for a moment on the signup page itself. A better UX is to pass a `?signup=success` query param to the destination page and show the toast there. However, since the destinations are `/onboarding/steps/step-2` (for owners) and `/` (for travelers) — and we cannot add toast logic to the landing page here without more scope — keep the toast on the signup page itself as a simple implementation. The user will see it briefly before redirect.

**Verify:** `npm run build` — no TypeScript errors.

---

### Step 18 — Remove subscription step from onboarding (Step 6 or wherever it is)

Check `app/onboarding/steps/step-6/page.tsx`. If it contains the subscription plan selection UI, replace it with just a redirect to step-7 (or remove the plan selection UI and show the room type step there). Based on the code read: step 6 is the rooms step, step 7 is review/submit, step 8 redirects to step-7. The subscription plan was in `OnboardingState.subscription` but the UI for it does not appear in any of the step files read (no step renders the plan selector in onboarding). The `SubscriptionPlan` type in `OnboardingContext` is effectively dead code — the plan selector that was referenced in the original user complaint was presumably in a step that was already removed. Clean up:
- Remove `subscription` field from `OnboardingState`
- Remove `setSubscription` from context value type and implementation
- Remove `SubscriptionPlan` type from `OnboardingContext.tsx`

**File:** `app/onboarding/context/OnboardingContext.tsx` (already in scope from Step 9)

**Verify:** `npm run build` — no TypeScript errors.

---

### Step 19 — Create `/onboarding/subscription` page for post-approval plan selection

After admin approval, the hotel is created but `isPublished: false` and no subscription exists. The owner needs to select a plan. This page handles that.

**File:** `app/onboarding/subscription/page.tsx` (new)

Behavior:
1. Guard: must be `HOTEL_OWNER` role and must have an approved application. On mount, call `getMyHotel()`.
   - If null → redirect to `/hotel-review`
   - If hotel exists but `hotel.subscriptionPlan` indicates active subscription → redirect to `/dashboard/overview`
   - If hotel exists → show plan selection
2. Render three plan cards:
   - **Starter** — Free during beta / ₦0 — basic listing, up to 10 rooms
   - **Professional** — ₦15,000/month — analytics, promotions, up to 50 rooms
   - **Enterprise** — ₦35,000/month — unlimited rooms, priority support, API access
3. On select: call `createSubscription(hotel.id, { plan: selectedPlan })` from `onboarding.ts`
4. On success: redirect to `/dashboard/overview`
5. Show loading state during submission

Note: the `hotel-review/page.tsx` rewrite in Step 15 already shows a simplified inline version of this for the "Approved, no plan selected yet" state. This dedicated page is for direct navigation to `/onboarding/subscription`.

**Verify:** `npm run build` — no TypeScript errors.

---

### Step 20 — Final build verification

Run a clean build of both projects.

**Backend:**
```bash
cd c:\Users\Pkaka\music\hotel-os-api
npm run build
npm run test
```

**Frontend:**
```bash
cd c:\Users\Pkaka\music\hotel-os
npm run build
```

**Expected outcome:** Both builds succeed with zero errors. The Next.js build must not produce any parsing errors (the apostrophe bug in `hotel-review/page.tsx` is fixed in step 15).

---

## Summary table

| # | Where | What |
|---|---|---|
| 1 | BE schema | Add `HotelApplication` model + `ApplicationStatus` enum + `User.hotelApplications` relation |
| 2 | BE DB | Run `prisma migrate dev --name add-hotel-application` + `prisma generate` |
| 3 | BE | New `src/hotel-applications/` module (service, controller, DTOs, module) |
| 4 | BE | Register `HotelApplicationsModule` in `app.module.ts` |
| 5 | BE | Add `pendingApplications` to `AdminService.getPlatformStats()` |
| 6 | BE | Manual smoke test: submit/list/approve/reject via API |
| 7 | FE | New `app/lib/api/applications.ts` |
| 8 | FE | New `app/components/Toast.tsx` + `useToast` hook |
| 9 | FE | `OnboardingContext.tsx` → replace hotel creation with `submitApplication()`, remove subscription state |
| 10 | FE | Step 3 → upload-on-select with loading state + disabled nav |
| 11 | FE | Step 5 → upload-on-select with loading state + disabled nav |
| 12 | FE | `StepShell.tsx` → add `isBackDisabled` prop |
| 13 | FE | Step 7 → confirm no subscription summary row; keep as-is |
| 14 | FE | `DashboardAuthGuard.tsx` → two-step check (hotel → then application) |
| 15 | FE | `hotel-review/page.tsx` → full rewrite: pending/rejected/approved UI, no emojis, fix parse error |
| 16 | FE | Admin verification page → switch to applications API, real doc links, image thumbnails |
| 17 | FE | Signup page → toast on success |
| 18 | FE | `OnboardingContext.tsx` → remove dead subscription fields |
| 19 | FE | New `/onboarding/subscription/page.tsx` — plan selection after approval |
| 20 | Both | Full build + test verification |
