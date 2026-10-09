# Hotel OS Dashboard — FEAT-002 & FEAT-003

FEAT-002 (hotel management) and FEAT-003 (staff & front desk) collectively add 16 dashboard pages covering reservations, rooms, inventory, staff management, front-desk check-in/out, complaints, reviews, guests, analytics, payouts, subscription, and profile. Every page is wired to a single `mock/data.ts` module with fully-typed data. Dynamic routes (`rooms/[id]` and `reservations/[id]`) use the Next.js 15+ `await params` pattern. The implementation is largely clean, but there are several real bugs to fix before the mock layer is replaced with live API calls.

**Watch for:** (1) `formatDateTime` crashes on `"Never"` in the Staff table — **confirmed**. (2) `RevenueBarChart` in Analytics uses hardcoded SVG color `#3d6b4f` instead of `var(--db-accent)` — **confirmed**. (3) The `export const instant = false` export on dynamic route pages is not a recognised Next.js export — **confirmed**. (4) `SubscriptionPage` silences an import with `void MOCK_HOTEL` rather than actually using it, indicating dead code — **confirmed**.

**Verdict**: NEEDS_CHANGES

---

## High-level view

The two dynamic pages (`reservations/[id]` and `rooms/[id]`) correctly `await params` and call `notFound()` on a missing record — the guard pattern is solid. The sidebar navigation entries are consistent with the filesystem routes, and "Calendar" → `/dashboard/inventory` is the only non-obvious mapping, which is intentional.

State mutations on the front-desk pages (check-in, check-out) and on the staff page are client-side only — they reset on navigation. This is expected scaffolding, but the staff page's `removeMember` and `toggleStatus` are fully functional against local state and behave correctly. The bigger concern is `formatDateTime` receiving `"Never"` as a valid mock data value: `new Date("Never")` produces `Invalid Date`, which renders as `"Invalid Date Invalid Date"` in the UI.

The analytics chart components hardcode `fill="#3d6b4f"` for bars and `stroke="#3d6b4f"` for the occupancy line, where the rest of the codebase uses `var(--db-accent)`. SVG attributes don't resolve CSS variables — they need the `style` prop — so this silently diverges from the design token and breaks if the accent color changes.

The `export const instant = false` export present on both dynamic route pages (`rooms/[id]/page.tsx` and `reservations/[id]/page.tsx`) is not a recognised Next.js export — the actual directive is `export const dynamic = 'force-dynamic'` or a related option. This export will be silently ignored, and whether that causes a prerender regression depends on whether `cacheComponents` is set in the project config.

`SubscriptionPage` imports `MOCK_HOTEL` but immediately discards it with `void MOCK_HOTEL`. The plan value is hardcoded as "Professional Plan" instead of reading from `MOCK_HOTEL.subscription`. This means the page will show the wrong plan name when the hotel's subscription changes.

---

<details>
<summary>Issues (6)</summary>

1. **`formatDateTime` crash on "Never"** — `new Date("Never")` is `Invalid Date`; all `.toLocaleDateString()` / `.toLocaleTimeString()` calls return the string `"Invalid Date"`, which renders visibly in the Staff table for any member whose `lastActive` is `"Never"`. Guard with a null/invalid check: `if (!iso || iso === 'Never') return 'Never';` before constructing the Date.

2. **`export const instant = false` is not a Next.js directive** — Both `rooms/[id]/page.tsx` and `reservations/[id]/page.tsx` export `instant`. The valid export is `export const dynamic = 'force-dynamic'` (or `export const revalidate = 0`). The current export is silently ignored by Next.js, meaning the stated intent (preventing static prerender of a page that uses `usePathname()` in the layout) may not be honoured, risking a build-time prerender error.

3. **Hardcoded `#3d6b4f` in `RevenueBarChart`** — `analytics/page.tsx` uses `fill="#3d6b4f"` for bars and `stroke="#3d6b4f"` for the occupancy line. The rest of the codebase uses `var(--db-accent)`. If the accent token changes (e.g. for a white-label hotel), these charts will diverge visually. Replace with `fill="var(--db-accent)"` — SVG `fill` accepts CSS variables when set as a `style` attribute rather than a plain attribute.

4. **`SubscriptionPage` ignores `MOCK_HOTEL.subscription`** — The page imports `MOCK_HOTEL` but silences it with `void MOCK_HOTEL`. The plan name, price, and feature list are all hardcoded as "Professional Plan". The current plan should be derived from `MOCK_HOTEL.subscription` so the page reflects the actual data and is ready for the live API swap.

5. **Inventory `formatDateHeader` uses local time instead of UTC** — `new Date(dateStr + 'T00:00:00')` (no `Z`) parses in local time, meaning the displayed weekday can be off by one day for users in UTC- timezones (e.g. New York sees `2024-10-01T00:00:00` as Sep 30). Other date helpers in the codebase consistently append `T00:00:00Z`. Change to `new Date(dateStr + 'T00:00:00Z')` to match.

6. **Check-in button active on cancelled/no-show bookings** — When a search query is active, `check-in/page.tsx` shows all reservations regardless of status. The "Confirm Check-in" button is disabled only for `checked_in`, so it is fully clickable for `cancelled` and `no_show` records surfaced by search. Filter out terminal statuses (`checked_out`, `cancelled`, `no_show`) from search results, or disable the button for any status that isn't `confirmed | pending`.

</details>

<details>
<summary>Details</summary>

### `formatDateTime("Never")` crash in the Staff table

`staff/page.tsx` calls `formatDateTime(member.lastActive)` for every row. `formatDateTime` unconditionally does `new Date(iso)`, which produces `Invalid Date` for the string `"Never"`. Both `.toLocaleDateString()` and `.toLocaleTimeString()` called on `Invalid Date` return the literal string `"Invalid Date"`, so any staff member with `lastActive: "Never"` will render `"Invalid Date Invalid Date"` in that column. `MOCK_STAFF` has no `"Never"` value today, but the `StaffMember` type declares `lastActive: string` with the comment `// ISO datetime or "Never"`, and `handleInvite` sets `lastActive: new Date().toISOString()` for new members, so this is a latent crash waiting for real data. Confidence: **confirmed**.

### `export const instant = false` is not a Next.js export

Both `reservations/[id]/page.tsx` and `rooms/[id]/page.tsx` open with:

```ts
export const instant = false;
```

The comment says "Allow blocking prerender (required because layout uses usePathname() + dynamic params)". This is not a recognised Next.js segment config option. The valid options are `dynamic`, `dynamicParams`, `revalidate`, `fetchCache`, `runtime`, and `preferredRegion`. The `instant` export will be silently ignored. Whether this causes an actual prerender failure depends on project config, but the stated protective intent is not achieved. Change to `export const dynamic = 'force-dynamic';` if the goal is to opt out of static generation. Confidence: **confirmed**.

### Hardcoded accent color in Analytics charts

Inside `analytics/page.tsx`, `RevenueBarChart` uses `fill="#3d6b4f"` for the bar rects and `OccupancyLineChart` uses `stroke="#3d6b4f"` for the polyline and dots. Every other chart and accent usage in the codebase reads `var(--db-accent)`. SVG attributes like `fill` and `stroke` do not resolve CSS variables — they need to be set via the `style` prop:

```tsx
<rect ... style={{ fill: 'var(--db-accent)' }} />
<polyline ... style={{ stroke: 'var(--db-accent)' }} />
<circle ... style={{ fill: 'var(--db-accent)' }} />
```

The guide-line color `#e8e4df` and label color `#6b6560` are also hardcoded but appear to be intentionally muted neutrals rather than theme tokens, which is consistent with how other badge constants are handled across the codebase. Confidence: **confirmed**.

### Dead import and hardcoded plan in `SubscriptionPage`

```ts
// Suppress unused variable warning — MOCK_HOTEL is imported as instructed
void MOCK_HOTEL;
```

The plan name "Professional Plan", the price "₦50,000 / month", and the billing history description are all literal strings. `MOCK_HOTEL.subscription` is `'professional'`, which could drive at minimum the "Active" badge and the current plan section heading. At API-integration time, someone will need to rewire this page from scratch. The `void` suppression is a code smell that should be replaced with actual usage. Confidence: **confirmed**.

### UTC vs. local time in Inventory date headers

`inventory/page.tsx` parses date strings with:

```ts
const d = new Date(dateStr + 'T00:00:00');  // local time
```

Every other date helper in the codebase appends `Z`:

```ts
const d = new Date(dateStr + 'T00:00:00Z');  // UTC
```

A user in UTC-5 will see `2024-10-01T00:00:00` parsed as `2024-09-30T05:00:00Z`, shifting the displayed weekday label one day back. The inventory data itself is generated with `d.toISOString().split('T')[0]` in UTC, so the mismatch between generation timezone and display timezone is real. Confidence: **confirmed**.

### Check-in search shows all statuses

`check-in/page.tsx` shows only `confirmed | pending` reservations by default, but when a search query is active it shows all reservations regardless of status — including `checked_out`, `cancelled`, and `no_show` records. The "Confirm Check-in" button is correctly disabled for `checked_in` but fully enabled for `cancelled` and `no_show` reservations surfaced by search. A receptionist searching for a guest could accidentally check in a cancelled booking. The fix is to either filter out terminal statuses from search results or disable the button for any status that isn't `confirmed | pending`. Confidence: **confirmed**.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `overview/page.tsx` | New: dashboard home with stats, 7-day revenue bar chart, upcoming reservations table, room availability grid |
| `reservations/page.tsx` | New: paginated reservation list with search and status-tab filter |
| `reservations/[id]/page.tsx` | New: reservation detail with booking timeline stepper and action buttons |
| `rooms/page.tsx` | New: room-type grid with availability pill |
| `rooms/[id]/page.tsx` | New: room detail with info grid, photo upload placeholders, description placeholder |
| `staff/page.tsx` | New: staff table with invite modal, deactivate/remove actions, permissions matrix |
| `front-desk/check-in/page.tsx` | New: front-desk check-in with search and per-card confirm button |
| `front-desk/check-out/page.tsx` | New: front-desk check-out showing checked-in guests with confirm button |
| `complaints/page.tsx` | New: complaints table with expandable description row and status workflow |
| `reviews/page.tsx` | New: guest review cards with star-rating filter and hotel response flow |
| `inventory/page.tsx` | New: 14-day rolling inventory calendar with inline cell editing |
| `analytics/page.tsx` | New: analytics page with stat cards, bar chart, occupancy line chart, bookings-by-room-type bars |
| `subscription/page.tsx` | New: subscription management with plan comparison and billing history |
| `payouts/page.tsx` | New: payout transactions table with balance summary and totals footer |
| `profile/page.tsx` | New: hotel profile read-only view with property details, location, contact, and policies |
| `guests/page.tsx` | New: guest list derived from reservations, with expandable booking history |
| `components/DashboardSidebar.tsx` | New: sidebar with full nav, expandable Front Desk group, mobile backdrop |
| `mock/data.ts` | New: mock data for all entities |
| `types/index.ts` | New: shared TypeScript types for all dashboard entities |

Full diff: `git diff main -- app/dashboard`

</details>
