# Auth wiring to real NestJS backend

The change replaces all mock/stub auth logic with real API calls to the hosted NestJS backend at `https://hotel-os-api-52qe.onrender.com`. A new `apiClient` fetch wrapper handles authorization headers, error normalization, and 204 responses. An `AuthProvider` context carries the resolved user through the React tree, and both auth pages now drive routing by role after a successful login or registration. `TravelerNav` becomes auth-aware, showing user initials and a sign-out button when a session is active.

Watch for: The refresh token is stored in `localStorage` but there is no token refresh logic — once the access token expires, all API calls will start returning 401 with no recovery path. The `AuthProvider` initializes from `localStorage` synchronously on mount but never calls `getMe` to re-validate the stored token against the server, so a revoked or expired token will appear valid until the next API call fails.

**Verdict**: NEEDS_CHANGES

---

## High-level view

The fetch layer in `client.ts` is solid: typed request/response generics, a structured `ApiError` class with status and field-level `errors`, and correct handling of 204 No Content. The `BASE_URL` falls back to the production URL when `NEXT_PUBLIC_API_URL` is absent, and `.env.local` carries the variable but is correctly gitignored.

`AuthProvider` reads the user from `localStorage` once on mount and exposes it to the tree. It never re-validates against `/api/v1/auth/me`, so the context can hold a user whose token has expired or been revoked — subsequent API calls will fail but the nav will still render the avatar.

The refresh token is stored but never used. There is no interceptor or retry path that exchanges it for a new access token. When the access token expires, the user silently gets 401 errors until they manually sign out and back in.

The sign-in routing table matches the acceptance criteria exactly: `HOTEL_OWNER | HOTEL_MANAGER | HOTEL_STAFF` → `/dashboard/overview`, `SUPER_ADMIN` → `/admin/overview`, everything else → `/`. Sign-up maps 409 to the email field error and puts all other API errors into the general red banner above the submit button.

The logout in `TravelerNav` calls `auth.logout()` (which hits `/api/v1/auth/logout` and uses `finally` to clear tokens) before calling `signOut()` on the context. If the network call to the backend logout endpoint fails, `clearTokens` still runs, so local state is always cleaned up.

---

<details>
<summary>Issues (2)</summary>

1. **No access token refresh** — The refresh token is stored in `localStorage` but `client.ts` has no 401-retry interceptor that calls the refresh endpoint. Expired access tokens produce silent failures. Add a refresh flow in `request()` that retries once with a new token before throwing.

2. **Stale session on cold load** — `AuthProvider` trusts the `localStorage` user blob without verifying it against `/api/v1/auth/me`. A revoked or expired session shows the user as logged in until an API call fails. Call `getMe()` in the `useEffect` and clear the stored user if it throws a 401.

</details>

---

<details>
<summary>Details</summary>

### Refresh token stored but never consumed

`storeTokens` writes `hotel_os_refresh_token` to `localStorage`, but nowhere in `client.ts` or `auth.ts` is that key read. The `request` function has no 401 handler that would attempt to exchange it. In practice, once the access token's TTL elapses, every subsequent API call throws `ApiError(401)` — the pages show error banners but the user has no way to recover without manually signing out and back in. The fix belongs in `client.ts`'s `request()` function: detect a 401, read the refresh token, call a refresh endpoint, update storage, and retry the original request once.

### Session validation on hydration

`AuthProvider` runs `setUser(getCurrentUser())` on mount, which reads the `hotel_os_user` JSON blob from `localStorage`. Nothing checks whether the stored access token is still valid. If a user closes and reopens the browser after the token has expired, the nav renders their initials and the sign-out button, but the first protected API call they make will return 401. Calling `getMe()` in the `useEffect` and clearing state on failure would keep the client in sync with server-side session validity.

### `@keyframes spin` defined twice

The `globals.css` export adds a global `@keyframes spin` rule, and both `signin/page.tsx` and `signup/page.tsx` also inject `<style>{`@keyframes spin { ... }`}</style>` inline on every render. The duplicate definitions are harmless (same rule, same effect), but the local `<style>` tags are unnecessary now that the animation lives in the global stylesheet. Confirmed — low severity.

</details>

---

<details>
<summary>Files changed</summary>

| File | What changed |
|---|---|
| `app/lib/api/client.ts` | New — base fetch wrapper, `ApiError`, `AuthUser` type, token storage helpers |
| `app/lib/api/auth.ts` | New — `login`, `register`, `logout`, `getMe` calling real API endpoints |
| `app/lib/auth-context.tsx` | New — `AuthProvider` and `useAuth` hook backed by `localStorage` |
| `app/layout.tsx` | `AuthProvider` wrapping the `<body>` |
| `app/globals.css` | `@keyframes spin` added |
| `app/auth/signin/page.tsx` | Real `login()` call, role-based routing, general error banner |
| `app/auth/signup/page.tsx` | Real `register()` call, 409 → email field error, general error banner |
| `app/components/TravelerNav.tsx` | Auth-aware: user initials + sign out when session present |

Full diff: `git show af525aa`

</details>
