# Implementation Plan — Supabase Storage Image Upload (Hotel OS)

## Design Decisions

1. **Two-FEAT split**: backend first (FEAT-001), then frontend (FEAT-002). The frontend
   `images.ts` API module calls endpoints added in FEAT-001, so ordering is mandatory.

2. **Supabase admin client scoped to ImagesService**: the service role key is only needed
   server-side (delete from Storage). The browser client uses the anon key. This keeps
   secrets off the frontend.

3. **ImageUploadSlot in `app/components/`** (not `app/onboarding/components/`): it is
   used by the dashboard profile page, so it lives with other shared dashboard components.

4. **Profile page image section**: replaces the 4 static placeholder divs with
   `ImageUploadSlot` components. Images are loaded with `getHotelImages(hotelId)` on
   mount (after `getMyHotel` resolves). Shows `max(4, images.length + 1)` slots.

5. **Onboarding step-5**: the existing `FileUploadSlot` is replaced with a direct
   `<input type="file">` that calls `uploadImage` on change, stores the Supabase public
   URL via `updateImageSlot(id, file, url)`. No change to context signature needed.

6. **No `any` types in backend**: Supabase JS v2 is fully typed; SupabaseClient generic
   params are used for the admin client.

7. **ConfigModule already global** in `app.module.ts` — `hotels.module.ts` does NOT need
   to re-import it; `ImagesService` just injects `ConfigService`.

---

## Plan

- [ ] 1. Create `src/hotels/dto/add-image.dto.ts` in the backend.
         Add `AddImageDto` with `@IsString() @IsUrl() url`, optional
         `@IsString() caption`, `@IsBoolean() @IsOptional() isPrimary`,
         `@IsInt() @IsOptional() sortOrder` using class-validator decorators.
         Use ESM `.js` imports (none needed here — only class-validator).
         Files: `c:\Users\Pkaka\music\hotel-os-api\src\hotels\dto\add-image.dto.ts`
         Verify: `cd hotel-os-api && npm run build` — no TypeScript errors.

- [ ] 2. Create `src/hotels/images.service.ts` in the backend.
         `ImagesService` with `getImages`, `addImage`, `deleteImage`, `setPrimary`.
         - Inject `PrismaService` and `ConfigService`.
         - Instantiate a Supabase admin client using `SUPABASE_URL` and
           `SUPABASE_SERVICE_ROLE_KEY` from ConfigService.
         - `addImage`: ownership check, unset existing primary if `isPrimary=true`, then
           `prisma.hotelImage.create`.
         - `deleteImage`: ownership check, delete from Supabase Storage via admin client
           (`storage.from(bucket).remove([path])`), then `prisma.hotelImage.delete`.
         - `setPrimary`: unset all images for hotel, then set the target one.
         - No `any` types; use typed Prisma return values.
         Files: `c:\Users\Pkaka\music\hotel-os-api\src\hotels\images.service.ts`
         Verify: `cd hotel-os-api && npm run build` — no TypeScript errors.

- [ ] 3. Update `src/hotels/hotels.controller.ts` — add 4 image endpoints.
         Import `Delete` from `@nestjs/common`, `AddImageDto`, `ImagesService`.
         Add below the existing `PATCH :id/verify` handler:
           - `GET  /hotels/:id/images` — no body, calls `imagesService.getImages(id, user.userId)`
           - `POST /hotels/:id/images` — `@Body() dto: AddImageDto`, calls `imagesService.addImage(id, user.userId, dto)`
           - `DELETE /hotels/:id/images/:imageId` — calls `imagesService.deleteImage(id, imageId, user.userId)`
           - `PATCH /hotels/:id/images/:imageId/primary` — calls `imagesService.setPrimary(id, imageId, user.userId)`
         All four guarded by `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.HOTEL_OWNER)`.
         Inject `ImagesService` via constructor.
         Files: `c:\Users\Pkaka\music\hotel-os-api\src\hotels\hotels.controller.ts`
         Verify: `cd hotel-os-api && npm run build` — no TypeScript errors.

- [ ] 4. Update `src/hotels/hotels.module.ts` — add `ImagesService` to providers.
         `ConfigModule` is already global; no new import needed.
         Files: `c:\Users\Pkaka\music\hotel-os-api\src\hotels\hotels.module.ts`
         Verify: `cd hotel-os-api && npm run build` — no TypeScript errors.

- [ ] 5. Verify `.env.example` already has Supabase vars (confirmed during exploration —
         `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` are
         already present). No change needed.
         Files: `c:\Users\Pkaka\music\hotel-os-api\.env.example` (read-only confirm)
         Verify: visual inspection only.

- [ ] 6. Create `app/lib/supabase.ts` in the frontend.
         - Create a lazily-initialised Supabase browser client using
           `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
         - Export `uploadImage(file: File, hotelId: string, category: string): Promise<string>`
           — uploads to `hotel-images/<hotelId>/<category>/<uuid>.<ext>`, returns public URL.
         - Export `deleteImage(storagePath: string): Promise<void>`.
         - Export `extractStoragePath(publicUrl: string): string` — strips the bucket base
           URL prefix to get the relative path for deletion.
         - Bucket name from `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`.
         Files: `c:\Users\Pkaka\music\hotel-os\app\lib\supabase.ts`
         Verify: `cd hotel-os && npm run build` — no TypeScript errors.

- [ ] 7. Create `app/lib/api/images.ts` in the frontend.
         Export type `HotelImage { id, hotelId, url, caption, isPrimary, sortOrder, createdAt }`.
         Export:
         - `getHotelImages(hotelId: string): Promise<HotelImage[]>`
           → `apiClient.get('/api/v1/hotels/:id/images')`
         - `saveHotelImage(hotelId, dto): Promise<HotelImage>`
           → `apiClient.post('/api/v1/hotels/:id/images', dto)`
         - `deleteHotelImage(hotelId, imageId): Promise<void>`
           → `apiClient.delete('/api/v1/hotels/:id/images/:imageId')`
         - `setImagePrimary(hotelId, imageId): Promise<HotelImage>`
           → `apiClient.patch('/api/v1/hotels/:id/images/:imageId/primary')`
         Files: `c:\Users\Pkaka\music\hotel-os\app\lib\api\images.ts`
         Verify: `cd hotel-os && npm run build` — no TypeScript errors.

- [ ] 8. Create `app/components/ImageUploadSlot.tsx`.
         `'use client'` component. Props:
           `hotelId: string, label: string, existingImage?: HotelImage | null,
            onUploaded: (img: HotelImage) => void, onDeleted: (id: string) => void,
            category: string, isPrimary?: boolean`
         Behaviour:
         - If `existingImage`, show `<img>` preview with a delete overlay button (×).
         - If no image, show a clickable dashed-border drop zone styled with dashboard
           CSS vars (`--db-muted`, `--db-border`, `--db-secondary`).
         - On file pick: validate MIME (jpeg/png/webp) and size ≤ 10 MB; show inline
           error text otherwise.
         - Upload flow: set loading spinner → call `uploadImage(file, hotelId, category)`
           → call `saveHotelImage(hotelId, { url, isPrimary, sortOrder: 0 })`
           → call `onUploaded(savedImage)`.
         - Delete flow: loading spinner → call `deleteImage(extractStoragePath(existingImage.url))`
           → call `deleteHotelImage(hotelId, existingImage.id)` → call `onDeleted(id)`.
         - Accessible: `<input type="file" className="sr-only">`, visible label, role
           and aria-label on the drop zone.
         Files: `c:\Users\Pkaka\music\hotel-os\app\components\ImageUploadSlot.tsx`
         Verify: `cd hotel-os && npm run build` — no TypeScript errors.

- [ ] 9. Update `app/dashboard/profile/page.tsx` — replace static photo placeholders.
         - Import `getHotelImages`, `HotelImage` from `app/lib/api/images`.
         - Import `ImageUploadSlot` from `app/components/ImageUploadSlot`.
         - Add `images` state (`HotelImage[]`), initialise to `[]`.
         - After `getMyHotel()` resolves and `hotel` is set, call `getHotelImages(hotel.id)`
           and store in `images` state (inside the same `fetchData` async function).
         - Replace the `{[1,2,3,4].map(...)}` block with a computed slot list:
           `slotCount = Math.max(4, images.length + 1)`. Render `slotCount` slots:
           for index `i`, pass `existingImage={images[i] ?? null}`.
         - Wire `onUploaded` to append to `images`; `onDeleted` to filter out by id.
         - Use the CATEGORIES array `['exterior','lobby','rooms','other']` — slot `i % 4`
           for the category prop.
         Files: `c:\Users\Pkaka\music\hotel-os\app\dashboard\profile\page.tsx`
         Verify: `cd hotel-os && npm run build` — no TypeScript errors.

- [ ] 10. Update `app/onboarding/steps/step-5/page.tsx` — wire upload to Supabase.
          - Import `uploadImage` from `app/lib/supabase`.
          - Replace `handleFileChange` with an async handler:
            1. Call `uploadImage(file, 'onboarding', slot.id)` — no hotelId yet, use
               `'onboarding'` as the hotelId path segment.
            2. On success: `updateImageSlot(id, file, url)` with the public URL.
            3. On failure: `updateImageSlot(id, file, '')`.
          - Keep using `FileUploadSlot` — no component swap needed.
          Files: `c:\Users\Pkaka\music\hotel-os\app\onboarding\steps\step-5\page.tsx`
          Verify: `cd hotel-os && npm run build` — no TypeScript errors.

- [ ] 11. Final integration build check.
          Run `npm run build` in both repos and confirm zero TypeScript errors
          and no missing environment variable warnings that would fail at runtime.
          Files: (no changes)
          Verify:
            `cd hotel-os-api && npm run build`
            `cd hotel-os && npm run build`
