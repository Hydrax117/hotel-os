// ── Types ─────────────────────────────────────────────────────────────────────

export type HotelSummary = {
  id: string;
  name: string;
  city: string;
  state: string;
  rating: number;          // may be 0 when no reviews yet
  reviewCount: number;
  pricePerNight: number;   // lowest room price in NGN
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

// ── Server-side fetch helper (no auth token, for server components) ───────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://hotel-os-api-52qe.onrender.com';

async function serverFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ── Exported API functions ────────────────────────────────────────────────────

/**
 * Search hotels — used by SearchResults (client component).
 * Public endpoint; no auth token required.
 */
export async function searchHotels(params: SearchHotelsParams): Promise<SearchHotelsResponse> {
  const qs = new URLSearchParams();
  if (params.destination) qs.set('destination', params.destination);
  if (params.checkIn)     qs.set('checkIn', params.checkIn);
  if (params.checkOut)    qs.set('checkOut', params.checkOut);
  if (params.guests)      qs.set('guests', String(params.guests));
  if (params.page)        qs.set('page', String(params.page));
  if (params.limit)       qs.set('limit', String(params.limit));
  const res = await fetch(`${BASE_URL}/api/v1/hotels?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json() as { message?: string | string[] };
      if (body.message) msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<SearchHotelsResponse>;
}

/**
 * Fetch featured hotels — used by homepage server component, no auth needed.
 */
export async function fetchFeaturedHotels(): Promise<HotelSummary[]> {
  try {
    const data = await serverFetch<SearchHotelsResponse>('/api/v1/hotels?featured=true&limit=4');
    return data.hotels;
  } catch {
    return [];
  }
}

/**
 * Fetch city counts — used by homepage server component, returns distinct
 * cities with hotel counts derived from the full hotel list.
 */
export async function fetchCityCounts(): Promise<CityCount[]> {
  try {
    const data = await serverFetch<SearchHotelsResponse>('/api/v1/hotels?limit=100');
    const counts = new Map<string, number>();
    for (const h of data.hotels) {
      counts.set(h.city, (counts.get(h.city) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([city, hotelCount]) => ({ city, hotelCount }));
  } catch {
    return [];
  }
}

// ── Hotel detail types ────────────────────────────────────────────────────────

export type RoomAvailability = {
  id: string;
  name: string;
  bedType: string;               // 'King' | 'Twin' | 'Queen' | 'Double'
  capacity: number;
  sizeSqm: number;
  pricePerNight: number;
  amenities: string[];
  breakfastIncluded: boolean;
  cancellationPolicy: string;
  available: number;             // rooms available; may be 0
};

export type NearbyAttraction = { name: string; distance: string };

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
  checkInTime: string;           // e.g. '3:00 PM'
  checkOutTime: string;          // e.g. '12:00 PM'
  policies: string[];
  nearbyAttractions: NearbyAttraction[];
  rooms: RoomAvailability[];     // embedded in detail response OR fetched separately
  imageUrl?: string;
  featured?: boolean;
};

// ── Hotel detail fetch functions ──────────────────────────────────────────────

export async function fetchHotelDetail(id: string): Promise<HotelDetail | null> {
  try {
    return await serverFetch<HotelDetail>(`/api/v1/hotels/${id}`);
  } catch (err) {
    // 404 = not found, return null so the page can call notFound()
    if (err instanceof Error && err.message.startsWith('API 404')) return null;
    throw err;
  }
}

export async function fetchHotelRooms(hotelId: string): Promise<RoomAvailability[]> {
  try {
    const data = await serverFetch<{ rooms: RoomAvailability[] }>(`/api/v1/hotels/${hotelId}/rooms`);
    return data.rooms ?? [];
  } catch {
    return [];
  }
}
