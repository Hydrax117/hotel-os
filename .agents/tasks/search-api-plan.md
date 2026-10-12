# Implementation Plan — Wire Search Flow to Real API

**Backend**: `https://hotel-os-api-52qe.onrender.com`  
**Confirmed endpoint shape** (GET /api/v1/hotels): `{ hotels: [], total: 0, page: 1, limit: 20 }`  
**No Swagger docs available** — shape inferred from mock types and live probing.

---

## Key Architectural Decisions

1. **`serverFetch` vs `apiClient`**: `apiClient` reads `localStorage` for the auth token — it only works in browser (client) context. Server Components cannot use it. Define a bare `serverFetch(path)` helper in `search.ts` that calls `fetch(url, { cache: 'no-store' })` with no auth header. Public hotel endpoints are unauthenticated. `SearchResults` is `'use client'` so it can call `apiClient.get` via the exported `searchHotels()` function.

2. **No `export const dynamic`**: `next.config.ts` has `cacheComponents: true` (Next.js 16). The `dynamic` route segment config option is removed in this mode. Server component fetches without `'use cache'` run fresh on every request by default — no extra config needed.

3. **`generateStaticParams` removal**: The hotel detail page currently calls `generateStaticParams` using mock IDs. Remove it entirely. Without it, the dynamic route `/hotels/[id]` renders on-demand. No `dynamicParams` export needed (default is `true`).

4. **404 handling**: `fetchHotelDetail` returns `null` when the API responds with 404. The page calls Next.js `notFound()` on a null result.

5. **Empty API fallback**: The backend has no seeded data yet. All server component fetchers (`fetchFeaturedHotels`, `fetchCityCounts`) catch errors and return empty arrays. When empty, the homepage falls back to the hardcoded arrays so the page is never blank.

6. **Reviews section**: No `/api/v1/hotels/:id/reviews` endpoint exists. Remove the reviews section from the hotel detail page (or render the empty placeholder). All review data, the `HotelReview` type, and computed variables (`avgRating`, `countFor`, `categoryAvg`) are removed.

---

## Type Definitions to Create in `app/lib/api/search.ts`

```ts
// Returned by GET /api/v1/hotels (list) and embedded in HotelCard / HotelListCard
export type HotelSummary = {
  id: string;
  name: string;
  city: string;
  state: string;
  rating: number;        // 0 when no reviews
  reviewCount: number;
  pricePerNight: number; // NGN, lowest room price
  amenities: string[];
  featured?: boolean;
  imageUrl?: string;
};

export type SearchHotelsParams = {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  page?: number;
  limit?: number;
};

export type SearchHotelsResponse = {
  hotels: HotelSummary[];
  total: number;
  page: number;
  limit: number;
};

export type CityCount = {
  city: string;
  hotelCount: number;
};

// Used in RoomCard and hotel detail page
export type RoomAvailability = {
  id: string;
  name: string;
  bedType: string;          // 'King' | 'Twin' | 'Queen' | 'Double'
  capacity: number;
  sizeSqm: number;
  pricePerNight: number;
  amenities: string[];
  breakfastIncluded: boolean;
  cancellationPolicy: string;
  available: number;        // 0 = sold out
};

export type NearbyAttraction = { name: string; distance: string };

// Returned by GET /api/v1/hotels/:id
export type HotelDetail = {
  id: string;
  name: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  description: string;
  address: string;
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  policies: string[];
  nearbyAttractions: NearbyAttraction[];
  rooms: RoomAvailability[];
  imageUrl?: string;
  featured?: boolean;
};
```

---

## `serverFetch` Helper Pattern

```ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://hotel-os-api-52qe.onrender.com';

async function serverFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}
```

`{ cache: 'no-store' }` ensures this runs on every request (not statically cached) in Next.js 16 with cacheComponents mode.

---

## Functions and Which Fetcher They Use

| Function | Fetcher | Called from |
|---|---|---|
| `searchHotels(params)` | `apiClient.get` (browser, with auth) | `SearchResults` useEffect |
| `fetchFeaturedHotels()` | `serverFetch` (server, no auth) | `app/page.tsx` server component |
| `fetchCityCounts()` | `serverFetch` (server, no auth) | `app/page.tsx` server component |
| `fetchHotelDetail(id)` | `serverFetch` (server, no auth) | `app/hotels/[id]/page.tsx` |
| `fetchHotelRooms(hotelId)` | `serverFetch` (server, no auth) | `app/hotels/[id]/page.tsx` |

---

## Plan

- [ ] 1. Create `app/lib/api/search.ts` with all types and all five exported functions.
      Defines `HotelSummary`, `SearchHotelsParams`, `SearchHotelsResponse`, `CityCount`, `RoomAvailability`, `NearbyAttraction`, `HotelDetail`, the private `serverFetch` helper, and exports `searchHotels`, `fetchFeaturedHotels`, `fetchCityCounts`, `fetchHotelDetail`, `fetchHotelRooms`.
      Files: `app/lib/api/search.ts`
      Verify: `npx next build` — TypeScript compiles clean.

- [ ] 2. Update `app/search/components/SearchResults.tsx` — replace mock with API + state management.
      Remove `import { SEARCH_MOCK_HOTELS } from '../mock'`. Add `useState` for `hotels: HotelSummary[]`, `total: number`, `loading: boolean`, `error: string | null`, `page: number`. Add `useEffect([destination, checkIn, checkOut, guests, page])` that calls `searchHotels(...)`, sets state, and returns a cleanup function setting `cancelled = true`. Remove the local destination filter (server handles it). Keep client-side `sortBy` sort on the returned `hotels`. Replace mock-filtered count in result label with `total` from API. Wire pagination buttons to `setPage(p => p+1 / p-1)` and use `total` for the "Showing X–Y of Z" label. Render a loading skeleton while `loading === true`. Render an error banner with retry if `error !== null`.
      Files: `app/search/components/SearchResults.tsx`
      Verify: `npx next build` — no TypeScript errors.

- [ ] 3. Update `app/page.tsx` — server-side API calls for featured hotels and destination cities.
      Convert `HomePage` to `async` (it already is a server component; add `async` keyword). Call `Promise.allSettled([fetchFeaturedHotels(), fetchCityCounts()])` at the top of the function body. Extract results with fallback to the existing hardcoded arrays when the result is `'rejected'` or the returned array is empty. Define `CITY_GRADIENTS` map for the 6 known Nigerian cities. Map `cities` array to `DestinationCard` props with gradient lookups; unknown cities get the Lagos gradient as fallback. Remove the top-level `const featuredHotels` and `const destinations` hardcoded arrays (keep them as inline fallbacks in the conditional).
      Files: `app/page.tsx`
      Verify: `npx next build` — no TypeScript errors.

- [ ] 4. Add `RoomAvailability`, `NearbyAttraction`, and `HotelDetail` types to `app/lib/api/search.ts` plus `fetchHotelDetail` and `fetchHotelRooms` functions.
      *(This is part of step 1 but listed separately for clarity — do it all in step 1.)*
      Files: `app/lib/api/search.ts`

- [ ] 5. Update `app/hotels/[id]/components/RoomCard.tsx` — swap `RoomType` for `RoomAvailability`.
      Replace `import { RoomType } from '../../mock'` with `import { RoomAvailability } from '@/app/lib/api/search'`. Change `RoomCardProps.room` type from `RoomType` to `RoomAvailability`. The field names (`id`, `name`, `bedType`, `capacity`, `sizeSqm`, `pricePerNight`, `amenities`, `breakfastIncluded`, `cancellationPolicy`, `available`) are identical — no template changes needed.
      Files: `app/hotels/[id]/components/RoomCard.tsx`
      Verify: `npx next build` — no TypeScript errors.

- [ ] 6. Update `app/hotels/[id]/page.tsx` — real API, remove `generateStaticParams`, handle 404, remove reviews.
      a) Delete `export function generateStaticParams()` and its imports from `../../search/mock`.
      b) Delete all imports from `../mock` (`HOTEL_DETAILS`, `HOTEL_ROOM_TYPES`, `DEFAULT_ROOM_TYPES`, `HOTEL_REVIEWS`, `HotelReview`).
      c) Import `fetchHotelDetail`, `fetchHotelRooms`, `HotelDetail`, `RoomAvailability` from `@/app/lib/api/search`.
      d) Replace the mock data lookups with:
         ```ts
         const [detail, rooms] = await Promise.all([
           fetchHotelDetail(id),
           fetchHotelRooms(id),
         ]);
         if (!detail) notFound();
         ```
      e) Apply null-coalescing on all optional arrays: `detail.amenities ?? []`, `detail.nearbyAttractions ?? []`, `detail.policies ?? []`.
      f) Remove Section 7 (Guest reviews) entirely from the JSX — no reviews API exists yet. Remove all review-dependent computed variables: `reviews`, `avgRating`, `countFor`, `categoryAvg`, `IconSmallStar`.
      g) The `lowestPrice` calculation and `rooms.map(room => <RoomCard ... />)` are unchanged.
      Files: `app/hotels/[id]/page.tsx`
      Verify: `npx next build` — no TypeScript errors; page builds without `generateStaticParams`.

---

## Prop Mapping: API Types → Component Props

### `HotelListCard` (search results)
| Component prop | API field | Notes |
|---|---|---|
| `id` | `HotelSummary.id` | Direct |
| `name` | `HotelSummary.name` | Direct |
| `city` | `HotelSummary.city` | Direct |
| `state` | `HotelSummary.state` | Direct |
| `rating` | `HotelSummary.rating` | Direct |
| `reviewCount` | `HotelSummary.reviewCount` | Direct |
| `pricePerNight` | `HotelSummary.pricePerNight` | Direct |
| `amenities` | `HotelSummary.amenities ?? []` | Null-coalesce |
| `featured` | `HotelSummary.featured` | Optional |

### `HotelCard` (homepage featured)
| Component prop | API field | Notes |
|---|---|---|
| `name` | `HotelSummary.name` | Direct |
| `city` | `HotelSummary.city` | Direct |
| `state` | `HotelSummary.state` | Direct |
| `rating` | `HotelSummary.rating` | Direct |
| `reviewCount` | `HotelSummary.reviewCount` | Direct |
| `pricePerNight` | `HotelSummary.pricePerNight` | Direct |
| `amenities` | `HotelSummary.amenities ?? []` | Null-coalesce |
| `imageUrl` | `HotelSummary.imageUrl` | Optional |
| `featured` | `HotelSummary.featured` | Optional |

### `DestinationCard` (homepage cities)
| Component prop | API field | Notes |
|---|---|---|
| `city` | `CityCount.city` | Direct |
| `hotelCount` | `CityCount.hotelCount` | Direct |
| `gradientFrom` | `CITY_GRADIENTS[city]?.gradientFrom ?? '#d4a574'` | Lookup with fallback |
| `gradientTo` | `CITY_GRADIENTS[city]?.gradientTo ?? '#8b5e3c'` | Lookup with fallback |

### `RoomCard` (hotel detail)
| Component prop | API field | Notes |
|---|---|---|
| `room.id` | `RoomAvailability.id` | Direct |
| `room.name` | `RoomAvailability.name` | Direct |
| `room.bedType` | `RoomAvailability.bedType` | Direct |
| `room.capacity` | `RoomAvailability.capacity` | Direct |
| `room.sizeSqm` | `RoomAvailability.sizeSqm` | Direct |
| `room.pricePerNight` | `RoomAvailability.pricePerNight` | Direct |
| `room.amenities` | `RoomAvailability.amenities` | Direct |
| `room.breakfastIncluded` | `RoomAvailability.breakfastIncluded` | Direct |
| `room.cancellationPolicy` | `RoomAvailability.cancellationPolicy` | Direct |
| `room.available` | `RoomAvailability.available` | Direct |

---

## `SearchResults` State Shape and useEffect

```ts
const [hotels, setHotels]   = useState<HotelSummary[]>([]);
const [total, setTotal]     = useState(0);
const [loading, setLoading] = useState(true);
const [error, setError]     = useState<string | null>(null);
const [page, setPage]       = useState(1);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  setError(null);
  searchHotels({ destination, checkIn, checkOut, guests, page, limit: 12 })
    .then(data => {
      if (!cancelled) { setHotels(data.hotels); setTotal(data.total); }
    })
    .catch(err => {
      if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load hotels');
    })
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, [destination, checkIn, checkOut, guests, page]);
```

Reset `page` to 1 when destination/checkIn/checkOut/guests change (add a separate useEffect or use a ref to track). Simplest: add `setPage(1)` at the start of the effect when `page !== 1`, or use the `key` prop pattern — pass a key to a sub-component. Best approach: separate effect resets page on search param change:

```ts
useEffect(() => { setPage(1); }, [destination, checkIn, checkOut, guests]);
```

---

## 404 Handling for Hotel Detail Page

`fetchHotelDetail` catches errors. If the error message starts with `'API 404'`, it returns `null`. Any other error is re-thrown (server error — Next.js will show the error boundary). In the page:

```ts
const detail = await fetchHotelDetail(id);
if (!detail) notFound(); // renders the nearest not-found.tsx boundary
```

---

## Removing `generateStaticParams` Safely

Removing the function is safe because:
1. `dynamicParams` defaults to `true` — Next.js will render any `[id]` at request time.
2. There are no static IDs to pre-generate anyway (backend is empty).
3. The page is a dynamic data page (hotel data changes) — dynamic rendering is correct.

Simply delete the exported function and the imports it depended on.

---

## Null-Coalescing / Type Guards for Optional Fields

- `detail.amenities ?? []` — amenities array
- `detail.nearbyAttractions ?? []` — nearby attractions
- `detail.policies ?? []` — policies list
- `hotel.amenities ?? []` — in all card components
- `hotel.featured` — already optional in all card components
- `hotel.rating` — treat 0 as valid (no reviews yet), no coalescing needed
- `hotel.pricePerNight` — treat 0 as valid, guard only the `lowestPrice` display: if `lowestPrice === Infinity || lowestPrice === 0`, show "from —"

