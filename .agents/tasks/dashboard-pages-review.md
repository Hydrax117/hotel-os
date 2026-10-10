# Five new Hotel OS dashboard pages and sidebar nav update

This diff adds Rates, Promotions, Integrations, Settings, and Listing Preview pages to the dashboard, and extends `DashboardSidebar` with all five corresponding nav entries plus their inline SVG icons. Each page follows the established pattern: CSS variable tokens for all colors, inline SVG icons only, no third-party UI libraries, Tailwind utility classes for layout and spacing with `style={}` for token-keyed colors. The Settings page is the most complex, using a tabbed panel with four subtabs (General, Notifications, Security, Billing) and client-side state throughout.

**Watch for:** `integrations/page.tsx` is missing `'use client'` but renders a `<button>` — confirmed issue. The `promotions/page.tsx` `CSSToggle` has an `aria-label` that is hardcoded to "Toggle promotion active state" for every toggle, losing the promotion name — confirmed. The `--db-success` green (#16a34a) is used as a raw `color` in some security/billing badges where `--db-success-surface` is the defined background token — confirmed partial inconsistency. No test coverage exists for any of the five pages.

**Verdict**: NEEDS_CHANGES

---

## High-level view

The Rates page maintains independent per-season rate state, supports inline row editing with draft buffering, and provides a bulk percentage-uplift tool. The "Apply to all seasons" button on each row is a no-op stub — it calls `showToast()` but does not actually copy the rate to other season buckets. The label implies a functional action and will confuse users until wired up.

The Promotions page renders an active list and an expired table, with a create-form that validates the three required fields before appending a new record. The `badgeColor` on newly created promotions is set to the string `'var(--db-accent)'` rather than the hex value used by the mock data — this is fine since the badge uses `badgeColor + '20'` for the background, which evaluates to `'var(--db-accent)20'`, an invalid CSS color. The badge will render transparent or inherit, not broken but not visually correct — this is a confirmed rendering defect.

The Integrations page is the only server component among the five, which is appropriate since it has no interactive state. However, it renders two `<button>` elements ("Disconnect" and "Connect") and the API key "Copy" and "Regenerate key" buttons — all four are non-functional in a server component, and the component is missing the `'use client'` directive. Without interactivity, these buttons are inert dead weight in the DOM but will not throw; the real risk is that any future handler added to this file will fail silently or cause a hydration error.

The Settings page correctly uses `'use client'` and is well-factored into sub-components per tab. The ARIA tab pattern is properly set up: `role="tablist"`, `role="tab"`, `aria-selected`, and `role="tabpanel"` with `aria-labelledby` are all wired. One gap: the tabpanel `id` is static (`settings-tabpanel`) while each tab's `aria-controls` points to that same id, so the association is correct. However, all tabs share a single tabpanel element; screen readers expect each tab to control its own panel or for the panel to be re-identified on switch. With a single static id this works but is non-standard — worth noting as a likely accessibility concern.

The Listing Preview page is a server component (no directive, no state) which is correct. The `availabilityColor` helper appends `'20'` to a CSS variable value (`'var(--db-success)20'`) for the availability badge background — the same pattern as the Promotions badge defect. This renders as an invalid hex string and the background will be transparent.

The sidebar update is clean. All five new items appear in `NAV_ITEMS` in the correct order (Rates after Calendar, Promotions after Rates, Listing Preview after Hotel Profile, Integrations and Settings at the bottom). Each has a dedicated inline SVG icon component. The `IconListingPreview` eye-path icon, `IconRates` tag icon, `IconPromotions` discount circle, `IconIntegrations` grid-plus, and `IconSettings` gear are all visually distinct and appropriate. The `aria-hidden="true"` attribute is present on all icon SVGs, consistent with the rest of the sidebar.

---

<details>
<summary>Issues (7)</summary>

1. **Missing `'use client'` on Integrations page** — `integrations/page.tsx` renders interactive buttons (Disconnect, Connect, Copy, Regenerate key) without the directive. The buttons are inert. Add `'use client'` and wire handlers, or replace buttons with links/forms that work server-side.

2. **`badgeColor + '20'` produces invalid CSS in Promotions and Listing Preview** — Promotions uses `promo.badgeColor + '20'` for newly-created promos where `badgeColor` is `'var(--db-accent)'`, producing `'var(--db-accent)20'`. Listing Preview's `availabilityColor()` returns CSS variable strings; appending `'20'` to them produces invalid values. Badge backgrounds will be transparent. Use `-surface` tokens directly, or hardcode the resolved hex.

3. **"Apply to all seasons" is a silent no-op in Rates** — the button calls `showToast()` but does not propagate the rate to other season buckets. Wire it to update all three seasons in `setRatesBySeason` or remove it until implemented.

4. **Promotions `CSSToggle` aria-label loses promotion identity** — every toggle announces as "Toggle promotion active state". Change to `` `Toggle ${promo.name}` `` so screen readers can distinguish between promotions.

5. **`#166534` hardcoded green in Settings and Integrations** — SecurityTab, BillingTab, and the Connected badge in Integrations all hardcode `'#166534'` for badge text color instead of `var(--db-success)`. Replace with the token.

6. **`role="banner"` misuse in Listing Preview** — the preview mode notice carries the `banner` landmark role, which conflicts with the page's actual header region. Change to `role="note"` or drop the role.

7. **No test coverage** — Rates bulk-uplift math, Promotions form validation, and Settings password validation are all pure client-side logic with no tests. Not blocking, but a gap in correctness guarantees.

</details>

---

<details>
<summary>Details</summary>

## Integrations page missing `'use client'`

`integrations/page.tsx` has no directive and no `useState`/`useEffect` imports, making it a server component. All four buttons in the component — Disconnect on the connected card, Connect on each available integration card, Copy API key, and Regenerate key — are rendered without `onClick` handlers (the comment in the file even notes "visual only in server component"). While this does not throw a runtime error today, the component signals to the reader that interactivity is intended. Any contributor adding an `onClick` to this file without adding `'use client'` will hit a cryptic Next.js error. The correct fix depends on the intended behavior: if these are placeholder-only, replace with `<span>` or `<a>` elements; if they are meant to be functional, add the directive.

## `badgeColor + '20'` CSS concatenation defect

Two pages use the pattern of appending `'20'` to a color value to get a 12.5%-opacity tint. This works correctly when `badgeColor` is a hex string (e.g., `'#2563eb20'` is valid CSS hex with alpha). It breaks when the value is a CSS custom property reference: `'var(--db-accent)20'` is not parseable by any browser as a color. In Listing Preview, `availabilityColor()` returns `'var(--db-success)'`, `'var(--db-warning)'`, or `'var(--db-danger)'` — all three of these appended with `'20'` produce invalid values.

The fix for Listing Preview is to use `--db-success-surface`, `--db-warning` (no surface token exists — a gap), and `--db-danger-surface` directly, or to define a `--db-warning-surface` token in `globals.css`. For Promotions, the existing mock data uses hex badge colors correctly; only newly created promotions break because `badgeColor` is set to `'var(--db-accent)'` in `savePromo()`. Change that assignment to `'#3d6b4f'` (the accent hex value from globals.css) or add a CSS variable lookup.

## "Apply to all seasons" no-op stub in Rates

The "Apply to all seasons" button on each rate row calls `showToast('Applied to all seasons')` but does not mutate `ratesBySeason` for any season other than the active one. A user who edits a Standard rate and clicks this button will see the toast, switch to Peak, and find the rate unchanged. The button should either be wired to copy the current row's price across all three season buckets in `setRatesBySeason`, or be removed until the feature is implemented.

## `badgeColor + '20'` CSS concatenation defect

Two pages use the pattern of appending `'20'` to a color value to get a 12.5%-opacity tint. This works correctly when `badgeColor` is a hex string (e.g., `'#2563eb20'` is valid CSS hex with alpha). It breaks when the value is a CSS custom property reference: `'var(--db-accent)20'` is not parseable by any browser as a color. In Listing Preview, `availabilityColor()` returns `'var(--db-success)'`, `'var(--db-warning)'`, or `'var(--db-danger)'` — all three appended with `'20'` produce invalid values and the badge backgrounds will be transparent.

The fix for Listing Preview is to use `--db-success-surface` and `--db-danger-surface` directly. No `--db-warning-surface` token exists yet — it needs to be added to `globals.css`. For Promotions, newly created promotions break because `badgeColor` is set to `'var(--db-accent)'` in `savePromo()`. Change that to `'#3d6b4f'` (the resolved hex from globals.css) or define a lookup.

## `#166534` hardcode in Settings and Integrations

`settings/page.tsx` SecurityTab and BillingTab, plus the "Connected" badge in `integrations/page.tsx`, use `color: '#166534'` (Tailwind green-800) as badge text color rather than `var(--db-success)`. All other semantic status text in the dashboard uses `var(--db-success)`. Replace with the token.

## `role="banner"` misuse in Listing Preview

The preview mode notice in `listing-preview/page.tsx` carries `role="banner"`. The `banner` landmark is reserved for the primary page header; using it on a contextual alert means screen readers announce the notice as the page's top-level banner, which conflicts with the actual page structure. Change to `role="note"` or drop the role and use a visually styled `<p>` or `<aside>`.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `app/dashboard/rates/page.tsx` | New client page: per-season rate table with inline row editing and bulk-uplift tool |
| `app/dashboard/promotions/page.tsx` | New client page: active/expired promotions list with create form and toggle |
| `app/dashboard/integrations/page.tsx` | New server(?) page: connected and available integrations catalog with API key section |
| `app/dashboard/settings/page.tsx` | New client page: four-tab settings (General, Notifications, Security, Billing) |
| `app/dashboard/listing-preview/page.tsx` | New server page: read-only preview of hotel listing as travelers see it |
| `app/dashboard/components/DashboardSidebar.tsx` | Added five icon components and five nav entries (Rates, Promotions, Listing Preview, Integrations, Settings) |

[Full diff: `git diff main -- app/dashboard/rates app/dashboard/promotions app/dashboard/integrations app/dashboard/settings app/dashboard/listing-preview app/dashboard/components/DashboardSidebar.tsx`]

</details>
