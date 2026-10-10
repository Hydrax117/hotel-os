# Search page for the Hotel OS traveler platform

The change adds a full search page to the Hotel OS traveler platform: a top-mounted `SearchBar` that navigates to `/search` with query parameters, a server `page.tsx` that awaits `searchParams` and feeds values into a `SearchResults` client component, a `SearchFilters` sidebar with price/rating/amenity/property-type controls, and `HotelListCard` list-view cards with ₦ price formatting. The implementation is client-side filtering only, operating against a static mock dataset. Routing and searchParams handling are both correct for Next.js 16.

**Watch for:** The filter state in `SearchFilters` is completely disconnected from `SearchResults` — filters are rendered but have no effect on the displayed list (confirmed). The `SearchResults` component signature accepts `checkIn`, `checkOut`, and `guests` props but the function body destructures only `destination`, so those three values are silently ignored (confirmed). Pagination UI is present but hardcoded to page 1 with a dead "Next" button (confirmed).

**Verdict**: NEEDS_CHANGES

## High-level view

`page.tsx` correctly types `searchParams` as a `Promise<{...}>` and awaits it inside an inner async component wrapped in `<Suspense>`, which is the required pattern in Next.js 16. The `SearchBar` uses `useRouter` from `next/navigation` and constructs the URL with `encodeURIComponent`, so routing is sound. Initial prop values flow from the awaited params back into the `SearchBar` inputs, so the bar pre-fills correctly on page load.

`SearchResults` filters the mock data by `destination` with a case-insensitive `.includes()` check across both `city` and `state` — the functional requirement is satisfied. But the other three props (`checkIn`, `checkOut`, `guests`) are accepted in the type signature yet immediately dropped on the floor when the component destructures only `{ destination }` from its props. This is not a compile error (the destructuring is valid TypeScript) but it means no date or guest awareness reaches the results column at all.

The `SearchFilters` sidebar renders a complete filter UI — price range inputs, rating pills, amenity checkboxes, property type pills, free cancellation toggle — but none of this state is lifted out of `SearchFilters` or passed to `SearchResults`. The two components sit in a flex row inside `SearchResults` but share no state. On mobile, `SearchFilters` correctly renders as a fixed full-screen overlay when `isOpen` is true, and the "Filters" button in `SearchResults` toggles `filtersOpen`. The desktop sidebar is hidden on mobile via `hidden md:block`. That responsive shell is correct; the filter values just don't do anything.

`HotelListCard` uses `Intl.NumberFormat('en-NG', { currency: 'NGN' })` which renders as `₦145,000` — the ₦ symbol requirement is met. All design tokens used (`--tp-primary`, `--tp-secondary`, `--tp-accent`, `--tp-border`, `--tp-muted`, `--tp-gold`) match the definitions in `globals.css`. Accessibility on the card is clean: `Link` renders a proper anchor, SVG icons carry `aria-hidden="true"`, and the card contains no bare interactive `div` elements.

The custom checkbox `div` elements in `SearchFilters` carry `role="checkbox"`, `aria-checked`, `tabIndex={0}`, and `onKeyDown` handling — the accessibility intent is there. One gap: these `div` elements are wrapped inside `<label>` tags but the label's `htmlFor` is not set, and the clickable `div` is not an actual `<input type="checkbox">`, so clicking the label text does not trigger the `onClick` on the div. The visible interaction still works via direct clicks on the div, but the label-wrapping is misleading rather than functional.

<details>
<summary>Issues (4)</summary>

1. **Filter state is dead** — `SearchFilters` holds all filter state locally and never passes it to `SearchResults`. Price, rating, amenity, property type, and cancellation filters are shown to the user but have no effect on the list. Lift filter state into `SearchResults` (or a shared context) and apply the filters to the `filtered` array before sorting.

2. **Unused props in SearchResults** — The component type signature includes `checkIn`, `checkOut`, and `guests`, and `page.tsx` passes them, but `SearchResults` destructures only `{ destination }`. The other three props are silently discarded. Either use them (e.g. to display the stay details in the results header) or remove them from the type signature and the call site to avoid misleading consumers.

3. **Pagination is fake** — The pagination footer always shows "Showing 1–{min(12, n)} of n hotels" and the "Previous" button is permanently disabled. "Next" is enabled only when there are more than 12 results but clicking it does nothing (no page state exists). Either implement page state or remove the pagination footer until it's real.

4. **Label-wrapping non-input elements** — In `SearchFilters`, amenity checkboxes and the free-cancellation toggle are `div` elements with `role="checkbox"` wrapped in `<label>` tags without `htmlFor`. Clicking the label text doesn't activate the div's `onClick`. Replace the custom div with a visually hidden `<input type="checkbox">` and style a sibling div as the visual indicator, or wire the label's `onClick` directly.

</details>

<details>
<summary>Details</summary>

### Filter state disconnection

`SearchFilters` owns `minPrice`, `maxPrice`, `rating`, `amenities`, `propertyType`, and `freeCancellation` in local `useState`. The component is rendered as a child inside `SearchResults`'s JSX with no callback props and no shared state mechanism:

```tsx
<SearchFilters
  isOpen={filtersOpen}
  onClose={() => setFiltersOpen(false)}
/>
```

`SearchFilters`'s props type is `{ isOpen?: boolean; onClose?: () => void }` — there is no `onChange` or `onFiltersChange` callback, and no filter values are threaded back out. The `filtered` array in `SearchResults` only tests `destination`; nothing derived from `SearchFilters` state is ever consulted.

The fix is to either lift the filter state into `SearchResults` and pass it down as controlled props, or introduce a context. The `clearAll` action inside `SearchFilters` also needs to trigger re-filtering, so lifting state is simpler than a callback-per-filter.

### Unused SearchResults props

```tsx
export function SearchResults({
  destination,
}: SearchResultsProps) {
```

TypeScript does not flag this because it is valid to destructure a subset of a typed object. At runtime, `checkIn`, `checkOut`, and `guests` are received and dropped. `page.tsx` passes all four:

```tsx
<SearchResults
  destination={destination}
  checkIn={checkIn}
  checkOut={checkOut}
  guests={guests}
/>
```

If the intent is to show "2 nights · 2 guests" in the results header or eventually filter by availability, the values need to reach the component body. If they're not used yet, removing them from the props signature avoids the false promise.

### Pagination shell without page state

The footer shows `Math.min(12, sorted.length)` as the upper bound, implying a page size of 12, but the full `sorted` array is always rendered — all hotels appear on screen regardless. There is no `page` state variable, no slice of the sorted array, and no handler on the "Next" button. The "Previous" button is unconditionally `disabled`. This is UI scaffolding that hasn't been connected to behavior.

</details>

<details>
<summary>Files changed</summary>

- `app/components/SearchBar.tsx` — new search bar component; `useRouter` from `next/navigation`, encodes query params, pre-fills from initial props
- `app/search/layout.tsx` — minimal layout wrapper with page `<title>` metadata
- `app/search/page.tsx` — server component; types `searchParams` as `Promise<{...}>`, awaits inside inner async component wrapped in `<Suspense>`
- `app/search/mock.ts` — 16-entry Nigerian hotel mock dataset with typed `MockHotel` export
- `app/search/components/SearchFilters.tsx` — filter sidebar with local state; desktop sidebar + mobile overlay; filter state not connected to results
- `app/search/components/SearchResults.tsx` — client component; destination filtering + sort; renders `SearchFilters` and `HotelListCard` list
- `app/search/components/HotelListCard.tsx` — list-view hotel card with `Intl.NumberFormat` NGN pricing, star rating, amenity chips, and `Link` to hotel detail

</details>
