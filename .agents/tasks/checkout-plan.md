# Implementation Plan — Checkout & Confirmation Pages

## Context

- Project: `c:\Users\Pkaka\music\hotel-os`
- Stack: Next.js App Router, React 19, Tailwind CSS 4
- **Breaking API**: `searchParams` is a `Promise` — must be awaited in server components. `params` is also a `Promise`. Client components use `useSearchParams()` from `next/navigation` (no await needed).
- Build/verify command: `npx next build` from `c:\Users\Pkaka\music\hotel-os`
- Design tokens (confirmed in `app/globals.css`): `--tp-bg`, `--tp-surface`, `--tp-primary`, `--tp-secondary`, `--tp-accent`, `--tp-accent-light`, `--tp-border`, `--tp-muted`, `--tp-gold`
- Layout pattern (from `app/search/layout.tsx`, `app/hotels/[id]/layout.tsx`): minimal wrapper exporting `metadata` + a fragment layout component
- `TravelerNav` import: `@/app/components/TravelerNav` (named export `TravelerNav`)
- `Footer` import: `@/app/components/Footer` (named export `Footer`)
- Mock data imports: `HOTEL_DETAILS`, `HOTEL_ROOM_TYPES`, `DEFAULT_ROOM_TYPES` from `@/app/hotels/mock`; `SEARCH_MOCK_HOTELS` from `@/app/search/mock`
- `RoomCard` currently destructures only `room` from props despite `hotelId: string` being in the type — needs to also destructure `hotelId`

---

## Steps

- [ ] 1. Create `app/checkout/layout.tsx` — simple layout with metadata.
      Pattern copied from `app/search/layout.tsx`. Export `metadata` with title `"Complete your booking — Hotel OS"`. Default export is a fragment wrapper accepting `{ children: React.ReactNode }`.
      Files: `app/checkout/layout.tsx`
      Verify: file created; `npx next build` does not error on this file alone (will pass after step 2 creates the page).

- [ ] 2. Create `app/checkout/page.tsx` — client component for the checkout form.
      Add `'use client'` directive at top. Import `useSearchParams`, `useRouter` from `next/navigation`. Import `TravelerNav`, `Footer`. Import `HOTEL_DETAILS`, `HOTEL_ROOM_TYPES`, `DEFAULT_ROOM_TYPES` from `@/app/hotels/mock`. Import `SEARCH_MOCK_HOTELS` from `@/app/search/mock`.

      **Data loading logic:**
      - Call `useSearchParams()` to get `hotelId`, `roomId`, `checkIn`, `checkOut`, `guests` (default `"1"`).
      - Find hotel: `HOTEL_DETAILS[hotelId]` first; if not present fall back to `SEARCH_MOCK_HOTELS.find(h => h.id === hotelId)`. If neither exists, render error state.
      - Find room: search `(HOTEL_ROOM_TYPES[hotelId] ?? DEFAULT_ROOM_TYPES)` for `.find(r => r.id === roomId)`. If not found, render error state.
      - Calculate nights: if both `checkIn` and `checkOut` are non-empty, compute `Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))`. If either is missing, use `1` and display `"—"` for dates.
      - Financial: `subtotal = room.pricePerNight * nights`, `fee = Math.round(subtotal * 0.03)`, `total = subtotal + fee`.

      **Error state** (hotel or room not found):
      - Centered message "Booking details not found" with a "← Back to hotels" `Link` to `/search`.

      **Payment tab state**: `useState<'card' | 'bank'>('card')`.

      **Page structure** (`<div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}`):
      1. `<TravelerNav />` at top.
      2. Main content div with `paddingTop: '64px'` (nav height), `maxWidth: '1280px'`, centered, `px-6 py-10`.
      3. Two-column grid on desktop (`grid-cols-1 lg:grid-cols-[1fr_360px]`), gap-8. **On mobile**: booking summary first (order-first on mobile, order-last on desktop via CSS order), form second.

      **Left column — guest details form** (`<form onSubmit={e => { e.preventDefault(); handlePay(); }}`):

      *Section "Your details"* — card `rounded-xl border p-6 flex flex-col gap-5 bg-[--tp-surface]`:
      - Heading `"Your details"` (text-lg font-semibold, --tp-primary).
      - 2-col grid on sm: First name + Last name inputs.
      - Full-width: Email input (`type="email"`, required).
      - Full-width: Phone input (`type="tel"`, placeholder `"+234 800 000 0000"`, required).
      - All inputs: `id` + `<label>`, `rounded-lg border border-[--tp-border] px-4 py-3 text-sm w-full outline-none focus:border-[--tp-accent]` (use inline style for CSS var).

      *Section "Special requests"* — card same styling:
      - Heading `"Special requests"` with `(optional)` in secondary color.
      - `<textarea>` with placeholder `"Any special requests? (optional)"`, 3 rows, same border/focus styling.
      - Note text: `"Special requests are subject to availability and cannot be guaranteed."` (text-xs, --tp-secondary).

      *Section "Payment"* — card same styling:
      - Heading row with lock SVG icon: `"Secure payment"`.
      - Pill tabs: two `<button>` elements side-by-side, active tab: `background: 'var(--tp-primary)', color: '#fff'`; inactive: `background: 'var(--tp-muted)', color: 'var(--tp-secondary)'`. Both `rounded-full px-5 py-2 text-sm font-medium`.
      - **Card tab content** (shown when `tab === 'card'`):
        - Card number input with inline card SVG icon (absolute positioned left) — `placeholder="1234 5678 9012 3456"`, `pl-10`.
        - 2-col grid: Expiry (`placeholder="MM/YY"`) + CVV (`placeholder="CVV"`).
        - Cardholder name input.
        - Shield note: inline shield SVG + `"Your card details are encrypted and secure"` (text-xs, --tp-secondary).
      - **Bank transfer tab content** (shown when `tab === 'bank'`):
        - Card `rounded-lg border p-4 bg-[--tp-muted]` with 4 rows: Bank, Account number, Account name, and transfer instruction.
        - Values: Bank `"Paystack Trust"`, Account `"0123456789"`, Name `"Hotel OS Escrow"`.
        - Instruction note: `"Transfer exact amount and use your booking reference as the narration."` (text-xs, --tp-secondary, mt-2).

      **Pay & reserve button** (below form, not inside form tag — or at bottom of form):
      - `<button type="submit">` full-width, `py-4 rounded-xl text-white font-semibold text-base`, `background: 'var(--tp-primary)'`.
      - Lock SVG icon inline left.
      - Text: `"Pay ₦{total.toLocaleString()}"`.
      - Below button: `"You won't be charged until you click Pay & reserve"` (text-xs, --tp-secondary, text-center).
      - Terms note: `"By completing this booking you agree to our Terms & Conditions and Privacy Policy."` (text-xs, --tp-secondary, text-center).

      **`handlePay` function**:
      ```ts
      const ref = `HOS-${Math.floor(10000 + Math.random() * 90000)}`;
      router.push(
        `/booking/confirmation?ref=${ref}&hotelId=${hotelId}&roomId=${roomId}` +
        `&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&total=${total}`
      );
      ```

      **Right column — booking summary** (sticky on desktop: `position: 'sticky', top: '80px', alignSelf: 'flex-start'`):
      Card `rounded-xl border p-6 flex flex-col gap-4 bg-[--tp-surface]`:
      - Heading `"Booking summary"` (text-base font-semibold, --tp-primary).
      - Hotel name (font-medium, --tp-primary) + city (text-sm, --tp-secondary).
      - Room type + bed type (text-sm, --tp-secondary).
      - Divider `<hr style={{ borderColor: 'var(--tp-border)' }} />`.
      - Check-in row: label `"Check-in"` + value (format date as `"Sat, 1 Feb 2025"` using `new Date(checkIn).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })`, or `"—"` if no date).
      - Check-out row same pattern.
      - Nights row: `"{nights} night{nights !== 1 ? 's' : ''}"`.
      - Guests row: `"{guests} guest{Number(guests) !== 1 ? 's' : ''}"`.
      - Divider.
      - Price breakdown rows (each: label left, value right, text-sm):
        - `"Room × {nights} nights"` → `"₦{subtotal.toLocaleString()}"`.
        - `"Service fee (3%)"` → `"₦{fee.toLocaleString()}"`.
      - Total row (font-bold, text-base, --tp-primary): `"Total"` → `"₦{total.toLocaleString()}"`.
      - Cancellation policy chip: `rounded-full px-3 py-1 text-xs font-medium`. Green (`bg-[--tp-accent-light] text-[--tp-accent]`) if `room.cancellationPolicy` includes `"Free"`; amber (`bg-amber-50 text-amber-700`) if `"Non-refundable"`; else muted.
      - Note `"Price shown in Nigerian Naira (NGN)"` (text-xs, --tp-secondary, text-center).

      Files: `app/checkout/page.tsx`
      Verify: `npx next build` — zero TypeScript errors, no build warnings about missing types.

- [ ] 3. Create `app/booking/layout.tsx` — simple layout with metadata.
      Export `metadata` with title `"My Booking — Hotel OS"`. Fragment wrapper.
      Files: `app/booking/layout.tsx`
      Verify: directory and file created; build passes after step 4.

- [ ] 4. Create `app/booking/confirmation/page.tsx` — server component, await searchParams.
      No `'use client'`. Function signature:
      ```ts
      export default async function ConfirmationPage({
        searchParams,
      }: {
        searchParams: Promise<{
          ref?: string;
          hotelId?: string;
          roomId?: string;
          checkIn?: string;
          checkOut?: string;
          guests?: string;
          total?: string;
        }>;
      })
      ```
      `const params = await searchParams;` then destructure all fields.

      **Room lookup**: find room name by searching `(HOTEL_ROOM_TYPES[hotelId ?? ''] ?? DEFAULT_ROOM_TYPES).find(r => r.id === roomId)?.name ?? roomId ?? 'Unknown room'`.

      **Page structure** (`div` with `background: 'var(--tp-bg)', minHeight: '100vh'`):
      1. `<TravelerNav />`.
      2. Content wrapper: `paddingTop: '64px'`, `maxWidth: '672px'` (max-w-2xl), centered with `mx-auto px-6 py-12`.
      3. All content in a single `flex flex-col gap-6`.

      **Block 1 — Success banner** (text-center):
      - Circle `width: 80, height: 80, borderRadius: '50%', background: 'var(--tp-accent)'`, centered with `mx-auto flex items-center justify-center`:
        - White checkmark SVG (path: `M 20 12 L 9 23 L 4 18`, strokeWidth 2.5, stroke white, fill none, width/height 40).
      - `<h1>` `"Reservation confirmed"` (text-2xl font-bold, --tp-primary, mt-4).
      - `<p>` `"Your booking is confirmed. A confirmation has been sent to your email."` (text-sm, --tp-secondary, mt-1).

      **Block 2 — Booking reference card** (`rounded-xl border p-6 text-center bg-[--tp-surface]`):
      - Label `"Booking reference"` (text-xs uppercase tracking-wider, --tp-secondary).
      - `<div>` with ref value: `font-mono text-2xl font-bold` style `color: 'var(--tp-accent)'`.
      - Note `"Save this reference number for check-in"` (text-xs, --tp-secondary, mt-2).

      **Block 3 — Booking details card** (`rounded-xl border p-6 flex flex-col gap-4 bg-[--tp-surface]`):
      - Heading `"Booking details"` (text-base font-semibold, --tp-primary, mb-2).
      - Detail rows (each `flex justify-between items-baseline text-sm`):
        - `"Hotel"` → hotel name (looked up from `HOTEL_DETAILS[hotelId]?.name ?? SEARCH_MOCK_HOTELS.find(...)?.name ?? hotelId`).
        - `"Room"` → room name (from lookup above).
        - `"Check-in"` → formatted date (same `toLocaleDateString` pattern as checkout page) or `"—"`.
        - `"Check-out"` → formatted date or `"—"`.
        - `"Guests"` → `"{guests} guest(s)"`.
        - `"Total paid"` → `"₦{Number(total).toLocaleString()}"` (font-bold, --tp-accent).
      - Divider between rows; label in --tp-secondary, value in --tp-primary (bold for total).

      **Block 4 — Action buttons** (`grid grid-cols-2 gap-3`):
      - "View booking" (`Link href="/bookings"`): filled dark button `bg-[--tp-primary] text-white rounded-lg py-3 text-sm font-medium text-center w-full`.
      - "Download receipt" (`<a href="#">`): outline button `border border-[--tp-border] rounded-lg py-3 text-sm font-medium text-center w-full flex items-center justify-center gap-2`, with download SVG icon.
      - "Add to calendar" (`<a href="#">`): same outline style, calendar SVG icon.
      - "Contact hotel" (`Link href={/hotels/${hotelId ?? ''}}`): same outline style, message SVG icon.
      - All outline buttons: `color: 'var(--tp-primary)'`.

      **Block 5 — Support link** (text-center):
      - `<p>` `"Need help?"` + `<Link href="#">` `"Contact our support team"` styled `text-[--tp-accent] underline`. Text-xs, --tp-secondary.

      Then `<Footer />` at bottom (outside the centered wrapper, full width).

      Files: `app/booking/confirmation/page.tsx`
      Verify: `npx next build` — zero TypeScript errors.

- [ ] 5. Update `app/hotels/[id]/components/RoomCard.tsx` — fix Reserve button to link to checkout.
      Two changes needed:
      1. Change the `<a href="#">` Reserve button to `<Link>` from `next/link`.
      2. Fix the component destructuring: the prop type already has `hotelId: string`, but the function signature destructures only `{ room }`. Change to `{ room, hotelId }`.
      3. Update the `href` to:
         ```
         `/checkout?hotelId=${hotelId}&roomId=${room.id}&checkIn=&checkOut=&guests=1`
         ```
      Add `import Link from 'next/link';` at top. Replace `<a href="#" ...>Reserve</a>` with `<Link href={...} className="..." style={...}>Reserve</Link>`.

      Files: `app/hotels/[id]/components/RoomCard.tsx`
      Verify: `npx next build` — zero TypeScript errors; navigating to a hotel detail page and clicking "Reserve" routes to `/checkout?hotelId=...&roomId=...`.

- [ ] 6. Final build verification — confirm zero errors across all new and changed files.
      Run from `c:\Users\Pkaka\music\hotel-os`.
      Files: no changes — verification only.
      Verify: `npx next build` exits with code 0, no TypeScript errors, all 5 new/modified files compile cleanly.

---

## Design decisions

- **checkout/page.tsx is `'use client'`** because it uses `useSearchParams()` (which only works in client components) and `useState` for payment tab switching and form state. Server component data-loading via awaited `searchParams` is not available here since we need reactive state. This matches the pattern established by the search page's `SearchResults` client component.

- **booking/confirmation/page.tsx is a server component** because it only reads URL params (no client interaction needed) and the spec explicitly says to await searchParams — the correct Next.js App Router approach for server components.

- **Booking summary placed first on mobile** via CSS `order` properties on the grid children (`order-first` on mobile for the summary column, `order-last lg:order-none` effectively). On desktop the two-column grid restores the natural left-form / right-summary order. This matches the spec ("summary first on mobile").

- **No date picker UI on checkout** — dates come from URL params set earlier in the search/hotel flow. The RoomCard Reserve link passes empty `checkIn=&checkOut=` as a deliberate placeholder; a future step can add a date-picker modal on the checkout page without changing this plan's scope.

- **Financial calculations** kept in the client component, not a shared util, to avoid unnecessary abstraction given this is the only place they're used.

- **No new dependencies** — all SVGs are inline, all styling uses `--tp-*` tokens and Tailwind classes already in the project.
