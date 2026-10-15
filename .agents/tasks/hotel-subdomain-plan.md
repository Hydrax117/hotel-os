# Implementation Plan: hotel.domain.com / domain.com Subdomain Split

## Codebase findings

- **proxy.ts** lives at the project root and exports `export function proxy(...)` — the correct convention for Next.js 16 (middleware was renamed to proxy in this version). Do NOT rename this function.
- **signup page** is a client component with a role toggle and a `hotelName` field shown for `role === 'owner'`.
- **signin page** has hardcoded "Welcome back" heading; redirect logic is already role-aware.
- **OnboardingContext** runs `register()` as the first step of `submit()`, validates account fields first, then creates the hotel. The `account` state is pre-populated via `updateAccount()` calls.
- **`AuthUser` type** (`app/lib/api/client.ts`) has `id, email, firstName, lastName, role` — **no `phone` field**. The OnboardingContext pre-population must set `phone` to `''` rather than `user.phone ?? ''`.
- **onboarding/layout.tsx** is a server component (no `'use client'`, exports no metadata). Auth guard must be a separate client component imported into it.
- **dashboard/layout.tsx** is a server component (exports `metadata`). Auth guard must be a separate client component at `app/dashboard/components/DashboardAuthGuard.tsx`.
- **step-8** guard redirects to `/onboarding/steps/step-1` — must change to `step-2`.
- **StepIndicator STEPS** array uses `number` as both the display value and the active-state key matched against `currentStep`. Removing entry `{ number: 1, label: 'Account' }` leaves steps 2–8 with unchanged numbers and URLs.
- **`/hotel-home` route** does not exist yet.
- **CSS variables**: `--tp-*` tokens are defined in `app/globals.css`; use them for the hotel-home landing page to match the existing traveler homepage style.
- **Build command**: `npx next build` from `c:\Users\Pkaka\music\hotel-os`.

---

## Implementation Plan

- [ ] 1. Update `proxy.ts` — replace routing logic with the subdomain split.

      The current proxy redirects `hotel.*  /` to `/dashboard`. Replace the entire routing body with:
      - `hotel.*  /` → `NextResponse.rewrite(url with pathname '/hotel-home')`
      - `hotel.*  /auth/signup` → `NextResponse.rewrite(url with pathname '/auth/signup' and searchParams `context=owner`)`
      - `hotel.*  /auth/signin` → `NextResponse.rewrite(url with pathname '/auth/signin' and searchParams `context=owner`)`
      - `hotel.*  /auth/*` (all other auth paths) → `NextResponse.next()`
      - `hotel.*  /dashboard/*, /onboarding/*, /admin/*` (owner paths) → `NextResponse.next()`
      - `hotel.*  /hotel-home` → `NextResponse.next()`
      - `hotel.*  any other path` → `NextResponse.redirect(url with pathname '/hotel-home')`
      - `domain.com  /dashboard/*, /onboarding/*, /admin/*, /hotel-home` → `NextResponse.redirect(url with pathname '/')`
      - `domain.com  everything else` → `NextResponse.next()`
      - Static / shared paths (`/_next`, `/favicon.ico`, `/public`, `/api`) → always `NextResponse.next()` (already handled by `isSharedPath` — keep this guard at the top).

      Keep `export function proxy(...)` — do not rename. Keep `export const config` unchanged.

      Files: `c:\Users\Pkaka\music\hotel-os\proxy.ts`
      Verify: `npx next build` — no TypeScript errors.

- [ ] 2. Create `/hotel-home` owner landing page.

      Create `app/hotel-home/page.tsx` as a server component (no `'use client'`). Structure:
      - **Nav**: HotelOS logo (`Hotel<span style={{color: 'var(--tp-accent)'}}>OS</span>`) on the left; 'Sign in' link (`href="/auth/signin"`) and 'List your hotel' button (`href="/auth/signup"`) on the right. Use `<Link>` from `next/link`.
      - **Hero**: Bold headline `'Grow your hotel business with HotelOS'`, subheading about reaching thousands of travelers, primary CTA button `'Get started — it\'s free'` → `href="/auth/signup"`.
      - **Features section**: 3 cards — `'Easy listing setup'`, `'Real-time reservations'`, `'Fast payouts'` — each with a short description line.
      - **How it works**: 3 numbered steps — `'Create your account'`, `'Submit hotel details'`, `'Start receiving bookings'`.
      - **Stats bar**: `'500+ hotels listed'`, `'50,000+ traveler bookings'`, `'₦2B+ processed'`.
      - **Footer**: copyright line.
      - Use `var(--tp-*)` CSS variables throughout for colors (matching `app/page.tsx` pattern). Use Tailwind utility classes for layout. No new dependencies.

      Files: `c:\Users\Pkaka\music\hotel-os\app\hotel-home\page.tsx`
      Verify: `npx next build` — page compiles; visiting `/hotel-home` locally renders the landing page.

- [ ] 3. Make signup subdomain-aware.

      Edit `app/auth/signup/page.tsx`. This is already a client component.

      Changes:
      1. Add `import { useSearchParams } from 'next/navigation'` and `import { Suspense } from 'react'`.
      2. Extract the form into an inner component `SignUpForm` that calls `useSearchParams()`. Wrap the export default with `<Suspense>` to satisfy the Next.js requirement that `useSearchParams()` be inside a Suspense boundary.
      3. Inside `SignUpForm`: `const isOwnerContext = useSearchParams().get('context') === 'owner'`.
      4. Remove the role toggle JSX entirely. Remove the `role` state. Remove the `hotelName` state, field, and `hotelName` validation.
      5. Derive the role from context: `const effectiveRole = isOwnerContext ? 'HOTEL_OWNER' : 'TRAVELER'`.
      6. Update the heading and subheading:
         - `isOwnerContext`: heading = `'Create your Hotel OS account'`, subheading = `'Start listing your hotel in minutes.'`
         - Otherwise: heading = `'Create your account'`, subheading = `'Join thousands of travelers booking verified hotels across Nigeria.'`
      7. In `handleSubmit`, replace `role === 'owner' ? 'HOTEL_OWNER' : 'TRAVELER'` with `effectiveRole`.
      8. On success redirect: `isOwnerContext` → `router.push('/onboarding/steps/step-2')`, otherwise → `router.push('/')`.
      9. Remove the `hotelName` validation from `handleSubmit` (the `role === 'owner' && !hotelName.trim()` check).
      10. Remove `FormErrors.hotelName` field from the interface (or leave it — it will just be unused; cleaner to remove it).
      11. The `AuthLeftPanel` panel text may stay as-is (it's on the left side, both contexts share the same panel).

      Files: `c:\Users\Pkaka\music\hotel-os\app\auth\signup\page.tsx`
      Verify: `npx next build` — no TypeScript errors; navigating to `/auth/signup?context=owner` shows owner copy with no role toggle; `/auth/signup` shows traveler copy.

- [ ] 4. Make signin subdomain-aware.

      Edit `app/auth/signin/page.tsx`. This is already a client component.

      Changes:
      1. Add `import { useSearchParams } from 'next/navigation'` and `import { Suspense } from 'react'`.
      2. Extract the form into an inner component `SignInForm` that calls `useSearchParams()`. Wrap the export default with `<Suspense>`.
      3. Inside `SignInForm`: `const isOwnerContext = useSearchParams().get('context') === 'owner'`.
      4. Change the heading from the hardcoded `'Welcome back'` to:
         - `isOwnerContext`: `'Sign in to your Hotel OS account'`
         - Otherwise: `'Welcome back'`
      5. The post-login redirect logic (`role → /dashboard/overview | /admin/overview | /`) is already correct — no change needed.

      Files: `c:\Users\Pkaka\music\hotel-os\app\auth\signin\page.tsx`
      Verify: `npx next build` — no TypeScript errors; `/auth/signin?context=owner` shows owner heading.

- [ ] 5. Remove Step 1 from onboarding wizard (3 files + context).

      **5a. `app/onboarding/page.tsx`**: Change `redirect('/onboarding/steps/step-1')` to `redirect('/onboarding/steps/step-2')`.

      **5b. `app/onboarding/steps/step-1/page.tsx`**: Replace the entire file content with a simple client redirect component:
      ```tsx
      'use client';
      import { useEffect } from 'react';
      import { useRouter } from 'next/navigation';
      export default function Step1Page() {
        const router = useRouter();
        useEffect(() => { router.replace('/onboarding/steps/step-2'); }, [router]);
        return null;
      }
      ```
      (Keeps the file so any bookmarked `/onboarding/steps/step-1` URLs redirect gracefully.)

      **5c. `app/onboarding/components/StepIndicator.tsx`**: Remove `{ number: 1, label: 'Account' }` from the `STEPS` array. Keep steps 2–8 with their existing `number` values so URLs don't change and `currentStep` tracking stays aligned.

      **5d. `app/onboarding/context/OnboardingContext.tsx`**: Four changes:
      1. Remove `import { register } from '@/app/lib/api/auth'`.
      2. Add `import { useAuth } from '@/app/lib/auth-context'`.
      3. Add a `useEffect` inside `OnboardingProvider` that reads `useAuth().user` and pre-populates `state.account`:
         ```tsx
         const { user } = useAuth();
         useEffect(() => {
           if (user) {
             updateAccount({
               name: `${user.firstName} ${user.lastName}`.trim(),
               email: user.email,
               phone: '', // AuthUser has no phone field
             });
           }
         }, [user]);
         ```
      4. In `submit()`:
         - Remove the Step 1 validation block (the 4 `errors.push` checks for `account.name`, `account.email`, `account.phone`, `account.password`).
         - Remove the initial `setState(s => ({ ...s, submitting: true, submitError: null, submitStep: 'Creating account…' }))`.
         - Replace it with `setState(s => ({ ...s, submitting: true, submitError: null, submitStep: null }))`.
         - Remove the `await register(...)` call entirely (the entire block: the `setState` for `'Creating account…'` and the `register(...)` await).
         - The submit function now starts directly with step 2 (`setState` for `'Creating hotel…'` then `await createHotel(...)`).

      Note: `AccountData.password` type field can remain — it will simply always be empty.

      Files:
      - `c:\Users\Pkaka\music\hotel-os\app\onboarding\page.tsx`
      - `c:\Users\Pkaka\music\hotel-os\app\onboarding\steps\step-1\page.tsx`
      - `c:\Users\Pkaka\music\hotel-os\app\onboarding\components\StepIndicator.tsx`
      - `c:\Users\Pkaka\music\hotel-os\app\onboarding\context\OnboardingContext.tsx`
      Verify: `npx next build` — no TypeScript errors. `OnboardingContext` no longer references `register`.

- [ ] 6. Add auth guard to onboarding layout.

      Edit `app/onboarding/layout.tsx`. Currently a server component.

      Create a new client component at `app/onboarding/components/OnboardingAuthGuard.tsx`:
      ```tsx
      'use client';
      import { useEffect } from 'react';
      import { useRouter } from 'next/navigation';
      import { useAuth } from '@/app/lib/auth-context';

      export function OnboardingAuthGuard({ children }: { children: React.ReactNode }) {
        const { user, isLoading } = useAuth();
        const router = useRouter();

        useEffect(() => {
          if (isLoading) return;
          if (!user) {
            router.replace('/auth/signup?context=owner');
          } else if (user.role !== 'HOTEL_OWNER') {
            router.replace('/');
          }
        }, [user, isLoading, router]);

        if (isLoading) {
          return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ob-accent)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }} aria-label="Loading">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
          );
        }

        if (!user || user.role !== 'HOTEL_OWNER') return null;
        return <>{children}</>;
      }
      ```

      In `app/onboarding/layout.tsx`, import `OnboardingAuthGuard` and wrap `children` with it inside `OnboardingProvider`:
      ```tsx
      <OnboardingProvider>
        <OnboardingAuthGuard>
          <div className="min-h-screen" ...>
            ...
            <main ...>{children}</main>
          </div>
        </OnboardingAuthGuard>
      </OnboardingProvider>
      ```

      Files:
      - `c:\Users\Pkaka\music\hotel-os\app\onboarding\components\OnboardingAuthGuard.tsx` (new)
      - `c:\Users\Pkaka\music\hotel-os\app\onboarding\layout.tsx`
      Verify: `npx next build` — no TypeScript errors.

- [ ] 7. Add auth guard to dashboard layout.

      Create `app/dashboard/components/DashboardAuthGuard.tsx` as a client component:
      ```tsx
      'use client';
      import { useEffect } from 'react';
      import { useRouter } from 'next/navigation';
      import { useAuth } from '@/app/lib/auth-context';

      const ALLOWED_ROLES = ['HOTEL_OWNER', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'SUPER_ADMIN'] as const;
      type AllowedRole = typeof ALLOWED_ROLES[number];

      export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
        const { user, isLoading } = useAuth();
        const router = useRouter();

        useEffect(() => {
          if (isLoading) return;
          if (!user) {
            router.replace('/auth/signin?context=owner');
          } else if (!(ALLOWED_ROLES as readonly string[]).includes(user.role)) {
            router.replace('/');
          }
        }, [user, isLoading, router]);

        if (isLoading) {
          return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--db-bg)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--db-accent)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }} aria-label="Loading">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
          );
        }

        if (!user || !(ALLOWED_ROLES as readonly string[]).includes(user.role)) return null;
        return <>{children}</>;
      }
      ```

      In `app/dashboard/layout.tsx`, import `DashboardAuthGuard` and wrap `DashboardSidebarWrapper` with it. Keep the server component structure and `metadata` export:
      ```tsx
      import { DashboardAuthGuard } from './components/DashboardAuthGuard';
      // ...
      export default function DashboardLayout({ children }) {
        return (
          <DashboardAuthGuard>
            <DashboardSidebarWrapper>{children}</DashboardSidebarWrapper>
          </DashboardAuthGuard>
        );
      }
      ```

      Files:
      - `c:\Users\Pkaka\music\hotel-os\app\dashboard\components\DashboardAuthGuard.tsx` (new)
      - `c:\Users\Pkaka\music\hotel-os\app\dashboard\layout.tsx`
      Verify: `npx next build` — no TypeScript errors; `metadata` export is preserved.

- [ ] 8. Fix step-8 guard and email display.

      Edit `app/onboarding/steps/step-8/page.tsx`.

      Changes:
      1. In the `useEffect` guard, change `router.replace('/onboarding/steps/step-1')` to `router.replace('/onboarding/steps/step-2')`.
      2. In the null-render guard `if (!account.email.trim() || !subscription)`, this check now serves as a "still loading" guard — it remains correct because OnboardingContext pre-populates `account.email` from `useAuth().user.email` via the new `useEffect` added in step 5d. No change needed to the condition itself.
      3. In the success screen, change `{account.email}` to `{useAuth().user?.email ?? account.email}`. To do this:
         - Add `import { useAuth } from '@/app/lib/auth-context'` at the top.
         - Add `const { user: authUser } = useAuth();` inside the component.
         - Change the email display to `{authUser?.email ?? account.email}`.

      Files: `c:\Users\Pkaka\music\hotel-os\app\onboarding\steps\step-8\page.tsx`
      Verify: `npx next build` — no TypeScript errors.

- [ ] 9. Final build verification.

      Run `npx next build` from `c:\Users\Pkaka\music\hotel-os`.

      Expected outcome: build completes with 0 TypeScript errors and 0 compilation errors. All route pages compile successfully, including the new `/hotel-home` page.

      Fix any remaining TypeScript errors before marking complete.

      Files: none (verification only)
      Verify: `npx next build` exits with code 0.

---

## Notes for the implementing agent

- **`AuthUser` has no `phone` field.** The OnboardingContext pre-population (step 5d) must set `phone: ''` — do not attempt `user.phone`.
- **`useSearchParams()` requires a Suspense boundary** in Next.js App Router. Steps 3 and 4 both require extracting the form body into a child component and wrapping the page export in `<Suspense>`.
- **Proxy rewrites vs redirects**: for `hotel.* /auth/signup`, use `NextResponse.rewrite()` (not redirect) so the URL stays as the subdomain URL (`hotel.domain.com/auth/signup`) while the page that renders receives `?context=owner`. The context is passed via the rewritten URL's search params, not the visible browser URL.
- **`spin` keyframe**: The `@keyframes spin` rule is already defined in `app/globals.css` — the auth guards can reference it via `style={{ animation: 'spin 1s linear infinite' }}` without adding a local `<style>` tag.
- **Subdomain detection in local dev**: `context=owner` is injected by the proxy rewrite, which only fires when accessed via `hotel.localhost:3000`. For local testing of the owner flow, navigate directly to `/auth/signup?context=owner` or `/auth/signin?context=owner`.
- **hotel.* /hotel-home path**: The proxy must explicitly pass through `/hotel-home` on the hotel subdomain (or it will match the "any other path → redirect to /hotel-home" catch-all and loop). Add `pathname === '/hotel-home'` as a pass-through before the catch-all redirect.
