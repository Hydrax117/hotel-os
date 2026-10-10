# Hotel OS UI completion — profile, reviews, bookings update, and six admin pages

Nine pages land in this batch: the traveler profile settings hub, the leave-a-review form, an updated bookings list, and six new admin pages (payments, payouts, reviews, cities, reports, audit). The build log records 0 TypeScript errors and all eight required routes in the output.

**Watch for:**
- The admin reviews page renders filter tabs as static `<div>` elements with no `onClick` — tab switching is entirely non-functional at runtime (confirmed).
- The `instant = false` export on every server component is an unknown export that Next.js will silently ignore — intended as `dynamic` (likely `'force-dynamic'`).

**Verdict**: NEEDS_CHANGES

---

## High-level view

The build passes cleanly with zero TypeScript errors and all eight new routes confirmed in the output. Every file uses only `--tp-*` tokens on traveler pages and `--ad-*` tokens on admin pages with no cross-contamination. Traveler pages (`/profile`, `/reviews/new`, `/bookings`) all mount `TravelerNav` and `Footer`. Admin pages inherit the sidebar via the existing `AdminLayout`.

The admin reviews page is a server component that renders five filter tabs — All, Pending, Approved, Flagged, Removed — as static `<div>` elements. There is no state and no `onClick` handler, so clicking a tab does nothing. This is the primary blocking concern in the batch.

The `instant = false` export appears on every async server component (`payments`, `payouts`, `reviews`, `cities`, `reports`). Next.js does not recognise this export; the intended name is `dynamic`. The `connection()` calls on those same pages likely force dynamic rendering on their own in Next.js 16, but the stray export is misleading.

---

<details>
<summary>Issues (2)</summary>

1. **Admin reviews tabs are non-functional** — The five filter tabs in `/admin/reviews` are `<div>` elements with no `onClick` or state. Tab switching does nothing at runtime. Convert to a `'use client'` wrapper or a URL-param-driven server approach so tabs actually filter the displayed reviews.

2. **`instant = false` is an unrecognised export** — Every server component in this batch exports `export const instant = false`. Next.js has no `instant` page export; this was likely intended as `export const dynamic = 'force-dynamic'` to opt pages out of static caching, since these pages call `connection()`. Rename to `dynamic` or remove.

</details>

<details>
<summary>Details</summary>

### Admin reviews — static tabs that don't filter

In `app/admin/reviews/page.tsx` the tab bar is built from the `TABS` array and rendered as plain `<div>` elements:

```tsx
{TABS.map((tab, i) => (
  <div
    key={tab.key}
    style={{
      padding: '8px 16px',
      fontWeight: i === 0 ? 600 : 400,
      color: i === 0 ? 'var(--ad-accent)' : 'var(--ad-secondary)',
      borderBottom: i === 0 ? '2px solid var(--ad-accent)' : '2px solid transparent',
      cursor: 'pointer',
      ...
    }}
  >
    {tab.label}
  </div>
))}
```

The active tab is hardcoded to index `0` ("All") — no `useState`, no `onClick`, no URL param. The `cursor: pointer` style creates a false affordance: visually it looks interactive, but nothing happens on click. The review list below always renders all eight mock reviews. This is a blocking gap because review moderation is one of the page's core purposes.

### `instant` export vs `dynamic`

Every async server component in this batch — `payments`, `payouts`, `reviews`, `cities`, `reports` — exports `export const instant = false` alongside a `connection()` call. The `connection()` import from `next/server` is the correct mechanism for opting a route out of static prerendering, but the `instant` export is not a recognised Next.js page export. The intended export is `export const dynamic = 'force-dynamic'`. As written, the `connection()` call alone may be sufficient to force dynamic rendering in Next.js 16 (Turbopack), but the stray export is misleading and should be corrected regardless.


</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `app/profile/page.tsx` | New — six-section profile hub (personal info, security, saved hotels, payment methods, notifications, preferences) |
| `app/reviews/new/page.tsx` | New — leave-a-review form with overall + per-category star ratings, title, body, photo placeholders |
| `app/bookings/page.tsx` | Updated — tabbed booking list (upcoming / completed / cancelled) with stats strip and reviewed-toast banner |
| `app/admin/payments/page.tsx` | New — payment transaction table with stat cards and CSV export stub |
| `app/admin/payouts/page.tsx` | New — payout requests table + settlement history with download stubs |
| `app/admin/reviews/page.tsx` | New — review moderation cards with static (non-functional) tab bar |
| `app/admin/cities/page.tsx` | New — city coverage table + add-city form |
| `app/admin/reports/page.tsx` | New — report card grid + recent reports download table |
| `app/admin/audit/page.tsx` | New — full audit log table with date/action/user filter row |
| `app/bookings/mock.ts` | New — typed mock booking data for the bookings page |

Full diff: `git diff main -- app/profile app/reviews app/bookings app/admin/payments app/admin/payouts app/admin/reviews app/admin/cities app/admin/reports app/admin/audit`

</details>
