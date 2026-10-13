# Dashboard pages wired to real API: analytics, staff, guests, profile

Four dashboard pages had their mock imports removed and replaced with real API calls in a single commit (`b64cf71`). The payouts page is intentionally deferred with a TODO comment and MOCK_PAYOUTS retained. Each of the four updated pages follows the same auth-gate pattern: `useAuth()` + `useRouter()` + redirect to `/auth/signin`, loads hotel context via `getMyHotel()`, then fetches page-specific data. The `dashboard.ts` API module gained `getHotelProfile` and `getHotelStaff` functions, both typed without `any`.

**Watch for:** Staff mutations (invite, toggle status, remove) are local-state-only with no API call — changes don't persist across page loads (confirmed). No build log covers the current HEAD commit — the most recent available log (`checkout-build.log`) predates `b64cf71` by over an hour (confirmed). Revenue-by-day is bucketed by `checkIn` date rather than `checkOut`, which skews the trend chart for multi-night stays (confirmed).

**Verdict**: NEEDS_CHANGES

---

## High-level view

The analytics page derives all metrics client-side from the bookings array rather than hitting a dedicated analytics endpoint, which is the right call given the backend doesn't expose one. Confirmed/checked-in/checked-out bookings contribute to revenue and occupancy; cancelled bookings go to the cancellation rate. The revenue trend chart covers the last 14 days bucketed by `checkIn` date — this is a semantic mismatch since revenue is recognized at checkout, not check-in, and a guest checking in today won't appear as revenue until they check out.

The staff page reads live data from `GET /api/v1/hotels/:hotelId/staff` and displays correctly, including an empty state when the API returns no members. The invite, deactivate, and remove actions only mutate local component state — no API calls are made for mutations. A refreshed page undoes any change. `hotelId` is stored in state and visually suppressed via a hidden `<span>`, signaling the mutations were planned but not completed.

The profile page fetches via `getHotelProfile()`, which is an alias for `getMyHotel()` — both call `GET /api/v1/hotels/my`. This means the page issues the same request twice sequentially with no additional data retrieved on the second call. The published and pending-verification banners correctly key on `hotel.isPublished` and `hotel.verificationStatus`. Many InfoCard rows display `'—'` because `DashboardHotel` doesn't carry address, phone, email, website, or description fields. The Edit Profile button is UI-only with no form or `PATCH` call.

---

<details>
<summary>Issues (4)</summary>

1. **Staff mutations are local-state-only** — `handleInvite`, `toggleStatus`, and `removeMember` mutate `staffList` in memory only. No API call is made to `POST/PATCH/DELETE /api/v1/hotels/:id/staff`. A page refresh resets all changes. Wire mutations to the API or mark each button as "coming soon" to avoid user confusion.

2. **Revenue trend bucketed by checkIn, not checkOut** — `analytics/page.tsx` groups revenue by `b.checkIn.slice(0, 10)`. Hotel revenue is earned at checkout; using check-in date associates income to the wrong day for multi-night stays. Change to `b.checkOut.slice(0, 10)` for semantic correctness.

3. **No build log covers HEAD commit** — The most recent build artifact (`checkout-build.log`) was committed at 10:20 on Oct 13; the changes under review landed at 11:38. No `npx next build` output exists to confirm the current codebase compiles without TypeScript errors. A passing build log should be committed alongside the feature commit.

4. **`getHotelProfile` is a redundant alias** — `getHotelProfile()` in `dashboard.ts` calls `getMyHotel()` directly. The profile page calls both in sequence: `getMyHotel()` to get `hotel.id`, then `getHotelProfile()` to get the same object, doubling the network round-trip for no benefit. Remove one call; the profile page can use `myHotel` directly, or change `getHotelProfile` to hit an extended endpoint so the second call adds value.

</details>

---

<details>
<summary>Details</summary>

## Staff mutations silently drop changes

`handleInvite` constructs a synthetic `DashboardStaffMember` with a `'staff-new-' + Date.now()` id and appends it to local state. `toggleStatus` flips `status` in the local array. `removeMember` filters the local array. None of these call `apiClient` — the `hotelId` state variable that was set during fetch is never used after that point (the hidden `<span>` rendering it is the tell). The plan document explicitly called for `inviteStaffMember`, `updateStaffStatus`, and `removeStaffMember` API functions; none were implemented in `dashboard.ts`. A hotel owner who invites a new staff member will see them appear in the table, close the tab, and find them gone on reload.

## Revenue-by-day date key

In the data fetch effect, the revenue-by-day accumulation reads:

```ts
const d = b.checkIn.slice(0, 10);
if (new Date(d).getTime() >= cutoffMs) {
  dayMap.set(d, (dayMap.get(d) ?? 0) + b.amountNgn);
}
```

`checkIn` is the arrival date. For a booking that checks in on day 1 and checks out on day 5, the full `amountNgn` lands on day 1 in the chart. This places future revenue in the past and can exclude completed stays whose check-in fell outside the 14-day window. Change the key to `b.checkOut.slice(0, 10)` to align with when revenue is realized.

## `getHotelProfile` double-fetch

`profile/page.tsx` does:

```ts
const myHotel = await getMyHotel();       // GET /api/v1/hotels/my  (call 1)
// ...
const profile = await getHotelProfile();  // GET /api/v1/hotels/my  (call 2, same endpoint)
if (!cancelled) setHotel(profile ?? myHotel);
```

`getHotelProfile` in `dashboard.ts` is defined as `return getMyHotel()` — it issues an identical request. The fallback `profile ?? myHotel` is never exercised since both calls return the same data. The profile page should either use `myHotel` directly, or `getHotelProfile` should be changed to fetch an extended endpoint (e.g., `GET /api/v1/hotels/:id` with more fields) so the second call actually delivers additional data.

## Missing build evidence

The task specification requires build evidence (`npx next build` exit 0) for the reviewed commit. The available build logs in `.agents/tasks/` cover commits up to and including the checkout-api-wiring task (10:20 on Oct 13). Commit `b64cf71` (11:38 on Oct 13) has no associated build log — TypeScript errors in any of the changed files would be undetected. A passing build log should be committed alongside the feature commit.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `app/dashboard/analytics/page.tsx` | Full rewrite: `'use client'`, auth gate, live API data, derived metrics, revenue bar chart, circular occupancy display |
| `app/dashboard/staff/page.tsx` | Replaced `MOCK_STAFF` seed with API fetch; auth gate added; mutations remain local-state-only |
| `app/dashboard/guests/page.tsx` | Replaced `MOCK_RESERVATIONS` seed with API fetch; auth gate added; guest deduplication logic unchanged |
| `app/dashboard/profile/page.tsx` | Converted from server component to `'use client'`; published and verification status banners added; many fields still `'—'` |
| `app/dashboard/payouts/page.tsx` | TODO comment added at top; otherwise unchanged (MOCK_PAYOUTS retained intentionally) |
| `app/lib/api/dashboard.ts` | Added `getHotelProfile` (alias for `getMyHotel`) and `getHotelStaff` with response-shape normalization |

[Full diff: `git diff bb8bf46 b64cf71`]

</details>
