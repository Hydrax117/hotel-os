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

// Shape returned by GET /api/v1/search/hotels
type HotelSearchResult = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  rating: number | null;
  reviewCount: number;
  primaryImageUrl: string | null;
  amenities: string[];
  lowestPrice: number | null;
};

function mapSearchResult(h: HotelSearchResult): HotelSummary {
  return {
    id: h.id,
    name: h.name,
    city: h.city,
    state: h.state,
    rating: h.rating ?? 0,
    reviewCount: h.reviewCount,
    pricePerNight: h.lowestPrice ?? 0,
    amenities: h.amenities,
    imageUrl: h.primaryImageUrl ?? undefined,
  };
}

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
  if (params.destination) qs.set('q', params.destination);
  if (params.checkIn)     qs.set('checkIn', params.checkIn);
  if (params.checkOut)    qs.set('checkOut', params.checkOut);
  if (params.guests)      qs.set('guests', String(params.guests));
  if (params.page)        qs.set('page', String(params.page));
  if (params.limit)       qs.set('limit', String(params.limit));
  const res = await fetch(`${BASE_URL}/api/v1/search/hotels?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json() as { message?: string | string[] };
      if (body.message) msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  const data = await res.json() as { hotels: HotelSearchResult[]; total: number; page: number; limit: number };
  return {
    hotels: data.hotels.map(mapSearchResult),
    total: data.total,
    page: data.page,
    limit: data.limit,
  };
}

/**
 * Fetch featured hotels — used by homepage server component, no auth needed.
 */
export async function fetchFeaturedHotels(): Promise<HotelSummary[]> {
  try {
    const data = await serverFetch<{ hotels: HotelSearchResult[] }>('/api/v1/search/featured?limit=4');
    return data.hotels.map(h => ({
      id: h.id,
      name: h.name,
      city: h.city,
      state: h.state,
      rating: h.rating ?? 0,
      reviewCount: h.reviewCount,
      pricePerNight: h.lowestPrice ?? 0,
      amenities: h.amenities,
      featured: true,
      imageUrl: h.primaryImageUrl ?? undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch city counts — uses the dedicated popular-cities endpoint.
 */
export async function fetchCityCounts(): Promise<CityCount[]> {
  try {
    const data = await serverFetch<{ city: string; state: string; hotelCount: number }[]>(
      '/api/v1/search/popular-cities',
    );
    return data.map(d => ({ city: d.city, hotelCount: d.hotelCount }));
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
