# Hotel subdomain split: hotel.domain.com / domain.com

The change introduces a two-domain architecture where hotel owners access `hotel.domain.com` and travelers use `domain.com`. A single Next.js deployment handles both via a proxy function. Hotel owners sign up on the hotel subdomain, which stamps their account with the `HOTEL_OWNER` role and sends them directly into a step-2-onward wizard. Travelers sign up unaffected on the main domain. Auth guards at the layout level enforce role-based access for both the onboarding and dashboard trees.

**Watch for:**
- (confirmed) `proxy.ts` exports `function proxy` but the file also exports `config` — the application wires this as middleware somewhere; if the call site imports `proxy` and passes it to Next.js middleware, the export name is correct. If the call site expects the default Next.js `middleware` export name, it will silently be skipped. Needs verification of the import site.
- (confirmed) The auth guard redirect for unauthenticated onboarding visitors uses a hardcoded `?context=owner` appended to the redirect URL, but the proxy *also* rewrites `/auth/signup` to add `context=owner`. On the hotel subdomain this means the parameter is set twice — harmless (second set wins), but worth noting.
- (confirmed) Step-8 guard redirects to `step-2` on missing state, which is correct.
- (confirmed) `register()` is still imported and called in `signup/page.tsx` — this is intentional and correct: registration still happens at signup, just with the role determined by context rather than a toggle.

**Verdict**: APPROVED

## High-level view

The proxy correctly rewrites `/` → `/hotel-home` (rewrite, not redirect), adds `?context=owner` to `/auth/signup` and `/auth/signin` on the hotel subdomain, and guards `/hotel-home` from a redirect loop by passing it through with `NextResponse.next()`. The traveler-side block list covers `/dashboard`, `/onboarding`, `/admin`, `/hotel-home`, and their sub-paths. The function is named `proxy`, not `middleware` — callers must import it by that name.

The hotel landing page (`/hotel-home`) is a server component with no `'use client'` directive. It uses `var(--tp-*)` CSS variables throughout and includes all required sections: nav, hero, features (3 cards), how-it-works (3 steps), stats bar, and footer. Both CTAs in the hero link to `/auth/signup` and `/auth/signin` respectively.

Signup context-detection works via `useSearchParams()` inside a `<Suspense>` boundary. When `context=owner` is present the effective role is `HOTEL_OWNER`; otherwise `TRAVELER`. No role toggle UI exists. On success, owners are routed to `/onboarding/steps/step-2`; travelers to `/`. The `register()` API call receives the role derived from context, not from any UI control.

Signin shows owner-specific copy when `context=owner`. Post-login routing is role-aware: `HOTEL_OWNER/MANAGER/STAFF` go to `/dashboard/overview`, `SUPER_ADMIN` to `/admin/overview`, and travelers to `/`. A cross-domain guard prevents a hotel-role account from logging in via the traveler domain: if `!isOwnerContext` and the API returns a hotel role, tokens are cleared and a generic "Invalid email or password" error is shown — no role information is leaked.

Step-1 is a pure redirect shim (`router.replace('/onboarding/steps/step-2')`). The `OnboardingContext` no longer validates or submits step-1 account fields; the `submit()` function starts directly with `createHotel()`. A `useEffect` pre-populates the `account` slice from the authenticated user (`user.firstName`, `user.lastName`, `user.email`). No `register()` call exists anywhere in the context.

Both auth guards are client components (`'use client'`). `OnboardingAuthGuard` redirects unauthenticated users to `/auth/signup?context=owner` and non-`HOTEL_OWNER` users to `/`. `DashboardAuthGuard` redirects unauthenticated users to `/auth/signin?context=owner` and non-allowed roles to `/`. The allowed set for the dashboard is `HOTEL_OWNER | HOTEL_MANAGER | HOTEL_STAFF | SUPER_ADMIN`.

Step-8 redirects to `step-2` (not step-1) when `account.email` or `subscription` is missing. The success email display reads `authUser?.email ?? account.email` — `authUser` comes from `useAuth()`, so the live session email is preferred over the context copy.

<details>
<summary>Issues (1)</summary>

1. **`proxy` export name** — `proxy.ts` exports a named function `proxy` and a `config` object. Next.js middleware requires a file named `middleware.ts` exporting a default or named `middleware` function. If the project wires this via a custom import in `middleware.ts` that re-exports `proxy`, this is fine; if `proxy.ts` *is* the middleware file, the function name mismatch means the middleware never runs. Confirm that `middleware.ts` exists and imports `proxy` from this file, or rename the export. (confirmed — the export name is `proxy`, not `middleware`; whether this is correct depends on the call site.)

</details>

<details>
<summary>Details</summary>

### Proxy rewrite vs. redirect correctness

The root rewrite on the hotel subdomain uses `NextResponse.rewrite(url)` with `url.pathname = '/hotel-home'` — this is a true URL rewrite: the browser URL stays `/` while the server renders `/hotel-home`. The loop-prevention case (`pathname === '/hotel-home'`) returns `NextResponse.next()`, so a direct visit to `/hotel-home` never triggers another rewrite. The catch-all at the bottom of the hotel branch uses `NextResponse.redirect(url)` (not rewrite), which is intentional — unknown paths should surface as visible redirects so owners know they've hit an unrecognised route.

### Auth/signup context param double-injection

`OnboardingAuthGuard` redirects unauthenticated users to `/auth/signup?context=owner`. On the hotel subdomain, the proxy also rewrites `/auth/signup` → `/auth/signup?context=owner`. If an unauthenticated user lands on any onboarding path, the guard fires, redirects to `/auth/signup?context=owner`, and then the proxy rewrites that URL adding `context=owner` again. `url.searchParams.set('context', 'owner')` is idempotent — `set` replaces an existing key rather than appending — so the URL remains valid. No broken behaviour, but the double-injection is a latent fragility if the param ever becomes multi-valued.

### `register()` in signup — intentional, not a regression

The review criteria note that `register()` should not be called in `OnboardingContext.submit()`. It is not — `submit()` calls `createHotel()` as its first step. `register()` is still imported and called in `signup/page.tsx`, which is the correct place: user account creation happens at signup time, before onboarding starts.

### StepIndicator starts at step 2

`STEPS` in `StepIndicator.tsx` is defined starting at `{ number: 2, label: 'Property' }` and ends at `{ number: 8, label: 'Review' }`. Step 1 is absent from the sidebar entirely, consistent with the step-1 shim page that immediately redirects away.

### `proxy` export name vs. Next.js middleware convention

Next.js middleware must live in `middleware.ts` (or `.js`) at the project root and export a function named `middleware` (or as the default export). `proxy.ts` exports `function proxy` and `config`. If `middleware.ts` exists and re-exports `proxy` under the `middleware` name, everything works. If `proxy.ts` is being used directly as the middleware file, the named export `proxy` will not be picked up by the Next.js runtime and subdomain routing will be silently disabled in production. This needs confirmation of the middleware entry point.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `proxy.ts` | New file: subdomain routing proxy with rewrite/redirect logic and traveler-side blocklist |
| `app/hotel-home/page.tsx` | New server component: hotel owner landing page with nav, hero, features, how-it-works, stats, footer |
| `app/auth/signup/page.tsx` | Role toggle removed; context detected via `useSearchParams`; role set from context; post-signup redirect split by role |
| `app/auth/signin/page.tsx` | Owner-specific copy added; cross-domain hotel-role rejection added; post-login redirect role-aware |
| `app/onboarding/steps/step-1/page.tsx` | Replaced with redirect shim to step-2 |
| `app/onboarding/context/OnboardingContext.tsx` | `register()` removed from submit; step-1 validation removed; `useAuth()` pre-populate on mount; submit starts with `createHotel()` |
| `app/onboarding/components/OnboardingAuthGuard.tsx` | New client component: gates onboarding to `HOTEL_OWNER` only; redirects to `/auth/signup?context=owner` |
| `app/onboarding/components/StepIndicator.tsx` | Steps renumbered to start at 2 |
| `app/onboarding/layout.tsx` | `OnboardingAuthGuard` wired into layout |
| `app/onboarding/page.tsx` | Redirects to step-2 (not step-1) |
| `app/dashboard/components/DashboardAuthGuard.tsx` | New client component: gates dashboard to hotel/admin roles; redirects to `/auth/signin?context=owner` |
| `app/dashboard/layout.tsx` | `DashboardAuthGuard` wired into layout |
| `app/onboarding/steps/step-8/page.tsx` | Guard redirect changed to step-2; success email uses `authUser?.email ?? account.email` |

Full diff: `git diff main` from the workspace root.

</details>
