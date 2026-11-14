import { apiClient, ApiError } from './client';
import type { BookingStatus } from '../../dashboard/types';

// ── Exported Types ─────────────────────────────────────────────────────────────

export type DashboardStaffMember = {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'STAFF';
  status: 'active' | 'inactive';
  lastActive: string;
  avatarInitials: string;
};

export type DashboardHotel = {
  id: string;
  name: string;
  city: string;
  state: string;
  email?: string | null;
  phone?: string | null;
  subscriptionPlan?: string;
  occupancyRate?: number;
  verificationStatus?: string;
  isPublished?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
};

export type DashboardReservation = {
  id: string;
  guestName: string;
  guestEmail: string;
  resourceName: string;
  /** @deprecated use resourceName */
  roomTypeName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  amountNgn: number;
  status: BookingStatus;
  createdAt: string;
};

export type DashboardRoomType = {
  id: string;
  name: string;
  totalRooms: number;
  availableRooms: number;
  pricePerNight: number;
  bedType: string;
  capacity: number;
  imageUrl?: string;
};

export type DashboardResource = {
  id: string;
  name: string;
  code: string;
  categoryName: string;
  resourceTypeName: string;
  bookingUnit: string;
  lifecycleStatus: string;
  operationalStatus: string;
  marketplaceVisibility: string;
  isBookable: boolean;
  capacity: number | null;
  primaryImageUrl?: string;
};

export type DashboardInventoryDay = {
  date: string;
  available: boolean;
};

export type DashboardResourceAvailability = {
  resourceId: string;
  resourceName: string;
  days: DashboardInventoryDay[];
};

export type DashboardStats = {
  occupancyPercent: number;
  todayRevenueNgn: number;
  bookingsToday: number;
  upcomingCheckIns: number;
  upcomingCheckOuts: number;
};

// ── Internal helpers ───────────────────────────────────────────────────────────

/** Maps UPPERCASE API booking statuses to lowercase dashboard BookingStatus values. */
function normalizeStatus(apiStatus: string): BookingStatus {
  const map: Record<string, BookingStatus> = {
    HELD:            'pending',
    CONFIRMED:       'confirmed',
    CHECKED_IN:      'checked_in',
    CHECKED_OUT:     'checked_out',
    CANCELLED:       'cancelled',
    PAYMENT_PENDING: 'pending',
    NO_SHOW:         'no_show',
    PENDING:         'pending',
  };
  return map[apiStatus] ?? 'pending';
}

// Raw shapes returned by the API (not exported — internal mapper use only)
type ApiBooking = {
  id: string;
  reference?: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  resource?: { name?: string };
  roomType?: { name?: string };
  room?: { name?: string; number?: string };
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  nights?: number;
  totalNgn?: number;
  totalAmount?: number;
  status: string;
  createdAt: string;
};

type ApiRoomType = {
  id: string;
  name: string;
  totalRooms?: number;
  quantity?: number;
  availableRooms?: number;
  available?: number;
  pricePerNight: number;
  bedType: string;
  capacity?: number;
  maxGuests?: number;
  imageUrl?: string;
};

// ── Exported Functions ─────────────────────────────────────────────────────────

/**
 * Returns the hotel owned by the authenticated user.
 * GET /api/v1/hotels/my
 * Returns null if the owner has no hotel yet (404).
 * Re-throws on any other error so callers can distinguish "no hotel" from "API failure".
 */
export async function getMyHotel(): Promise<DashboardHotel | null> {
  try {
    return await apiClient.get<DashboardHotel>('/api/v1/hotels/my');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Returns all reservations for a given hotel.
 * GET /api/v1/bookings/hotel/:hotelId
 * Backend returns { bookings: [...], total: N }
 */
export async function getDashboardReservations(hotelId: string): Promise<DashboardReservation[]> {
  const raw = await apiClient.get<
    ApiBooking[] | { bookings: ApiBooking[]; total: number } | { data: ApiBooking[] }
  >(`/api/v1/bookings/hotel/${hotelId}`);

  // Handle all response shapes gracefully
  let bookings: ApiBooking[];
  if (Array.isArray(raw)) {
    bookings = raw;
  } else if ('bookings' in raw && Array.isArray(raw.bookings)) {
    bookings = raw.bookings;
  } else if ('data' in raw && Array.isArray(raw.data)) {
    bookings = raw.data;
  } else {
    bookings = [];
  }

  return bookings.map((booking) => {
    // Dates come as ISO strings or Date objects from Prisma — handle both
    const checkInMs  = new Date(booking.checkIn).getTime();
    const checkOutMs = new Date(booking.checkOut).getTime();
    const nights     = booking.nights ?? Math.round((checkOutMs - checkInMs) / 86_400_000);

    // Guest name: prefer direct booking fields, fall back to nested user
    const firstName = booking.guestFirstName ?? booking.user?.firstName ?? '';
    const lastName  = booking.guestLastName  ?? booking.user?.lastName  ?? '';
    const guestName = (firstName + ' ' + lastName).trim() || 'Unknown Guest';
    const guestEmail = booking.guestEmail ?? booking.user?.email ?? '';

    // Resource name: prefer new resource field, fall back to legacy roomType
    const resourceName = booking.resource?.name ?? booking.roomType?.name ?? booking.room?.name ?? 'Room';

    // Total: backend stores as totalNgn
    const amountNgn = Number(booking.totalNgn ?? booking.totalAmount ?? 0);

    return {
      id:          booking.id,
      guestName,
      guestEmail,
      resourceName,
      roomTypeName: resourceName,
      roomNumber:  booking.roomNumber ?? booking.room?.number ?? '–',
      checkIn:     booking.checkIn.slice(0, 10),
      checkOut:    booking.checkOut.slice(0, 10),
      nights:      isNaN(nights) ? 0 : nights,
      amountNgn,
      status:      normalizeStatus(booking.status),
      createdAt:   booking.createdAt,
    };
  });
}

/**
 * Returns all room types for a given hotel.
 * GET /api/v1/hotels/:hotelId/room-types
 * Handles both plain-array and { rooms: [...] } response shapes.
 */
export async function getDashboardRoomTypes(hotelId: string): Promise<DashboardRoomType[]> {
  const raw = await apiClient.get<ApiRoomType[] | { rooms: ApiRoomType[] }>(
    `/api/v1/hotels/${hotelId}/room-types`,
  );

  const rooms: ApiRoomType[] = Array.isArray(raw) ? raw : raw.rooms;

  return rooms.map((room) => ({
    id:             room.id,
    name:           room.name,
    totalRooms:     room.totalRooms     ?? room.quantity   ?? 0,
    availableRooms: room.availableRooms ?? room.available  ?? 0,
    pricePerNight:  room.pricePerNight,
    bedType:        room.bedType,
    capacity:       room.capacity       ?? room.maxGuests  ?? 0,
    imageUrl:       room.imageUrl,
  }));
}

/**
 * Returns all resources for a hotel.
 * GET /api/v1/hotels/:hotelId/resources
 */
export async function getDashboardResources(hotelId: string): Promise<DashboardResource[]> {
  try {
    type ApiResource = {
      id: string; name: string; code: string; bookingUnit: string;
      lifecycleStatus: string; operationalStatus: string;
      marketplaceVisibility: string; isBookable: boolean; capacity?: number | null;
      images?: { url: string; isPrimary: boolean }[];
      category?: { name: string; resourceType?: { name: string } };
    };
    const raw = await apiClient.get<ApiResource[]>(`/api/v1/hotels/${hotelId}/resources`);
    return (Array.isArray(raw) ? raw : []).map(r => ({
      id: r.id, name: r.name, code: r.code,
      categoryName: r.category?.name ?? '',
      resourceTypeName: r.category?.resourceType?.name ?? '',
      bookingUnit: r.bookingUnit,
      lifecycleStatus: r.lifecycleStatus,
      operationalStatus: r.operationalStatus,
      marketplaceVisibility: r.marketplaceVisibility,
      isBookable: r.isBookable,
      capacity: r.capacity ?? null,
      primaryImageUrl: r.images?.find(img => img.isPrimary)?.url ?? r.images?.[0]?.url,
    }));
  } catch {
    return [];
  }
}

/**
 * Returns availability calendar data for each resource.
 * GET /api/v1/resources/:resourceId/inventory/calendar
 */
export async function getDashboardInventory(hotelId: string): Promise<DashboardResourceAvailability[]> {
  try {
    const resources = await getDashboardResources(hotelId);
    if (resources.length === 0) return [];

    const today = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

    const results = await Promise.all(
      resources.filter(r => r.isBookable && r.lifecycleStatus === 'ACTIVE').map(async (r) => {
        try {
          const days = await apiClient.get<{ date: string; available: boolean }[]>(
            `/api/v1/resources/${r.id}/inventory/calendar?from=${today}&to=${end}`,
          );
          return { resourceId: r.id, resourceName: r.name, days: Array.isArray(days) ? days : [] };
        } catch {
          return { resourceId: r.id, resourceName: r.name, days: [] };
        }
      }),
    );
    return results;
  } catch {
    return [];
  }
}

/**
 * Returns summary stats for a given hotel.
 * Tries GET /api/v1/hotels/:hotelId/stats first; falls back to deriving stats
 * from reservations if that endpoint is absent. Always returns a DashboardStats object.
 */
export async function getDashboardStats(hotelId: string): Promise<DashboardStats> {
  // Attempt the dedicated stats endpoint first
  try {
    const stats = await apiClient.get<DashboardStats>(`/api/v1/hotels/${hotelId}/stats`);
    if (
      typeof stats.occupancyPercent === 'number' &&
      typeof stats.todayRevenueNgn  === 'number'
    ) {
      return stats;
    }
  } catch {
    // Fall through to derived stats
  }

  // Also try the analytics/overview endpoint as a secondary option
  try {
    const analytics = await apiClient.get<DashboardStats>(
      `/api/v1/hotels/${hotelId}/analytics/overview`,
    );
    if (
      typeof analytics.occupancyPercent === 'number' &&
      typeof analytics.todayRevenueNgn  === 'number'
    ) {
      return analytics;
    }
  } catch {
    // Fall through to derived stats
  }

  // Derive stats from reservations as a last resort
  try {
    const reservations = await getDashboardReservations(hotelId);
    const todayStr     = new Date().toISOString().slice(0, 10);

    const checkedInCount = reservations.filter((r) => r.status === 'checked_in').length;
    const total          = reservations.length;

    const upcomingCheckIns  = reservations.filter((r) => r.status === 'confirmed').length;
    const upcomingCheckOuts = reservations.filter((r) => r.status === 'checked_in').length;
    const bookingsToday     = reservations.filter(
      (r) => r.createdAt.slice(0, 10) === todayStr,
    ).length;
    const todayRevenueNgn = reservations
      .filter((r) => r.checkOut.slice(0, 10) === todayStr && r.status === 'checked_out')
      .reduce((sum, r) => sum + r.amountNgn, 0);
    const occupancyPercent = total > 0 ? Math.round((checkedInCount / total) * 100) : 0;

    return {
      occupancyPercent,
      todayRevenueNgn,
      bookingsToday,
      upcomingCheckIns,
      upcomingCheckOuts,
    };
  } catch {
    // Return safe zeros so the dashboard never crashes
    return {
      occupancyPercent: 0,
      todayRevenueNgn:  0,
      bookingsToday:    0,
      upcomingCheckIns: 0,
      upcomingCheckOuts: 0,
    };
  }
}

/**
 * Returns staff members for a given hotel.
 * NOTE: No dedicated staff endpoint exists on the backend yet.
 * Returns [] gracefully so pages degrade without crashing.
 */
export async function getHotelStaff(_hotelId: string): Promise<DashboardStaffMember[]> {
  return [];
}

/**
 * Invites a new staff member to the hotel.
 * NOTE: No staff management endpoint exists on the backend yet.
 */
export async function inviteStaffMember(
  _hotelId: string,
  _payload: { name: string; email: string; role: string },
): Promise<DashboardStaffMember> {
  throw new Error('Staff management is not yet available.');
}

/**
 * Updates the status of a staff member.
 * NOTE: No staff management endpoint exists on the backend yet.
 */
export async function updateStaffStatus(
  _hotelId: string,
  _staffId: string,
  _status: 'active' | 'inactive',
): Promise<void> {
  throw new Error('Staff management is not yet available.');
}

/**
 * Removes a staff member from the hotel.
 * NOTE: No staff management endpoint exists on the backend yet.
 */
export async function removeStaffMember(_hotelId: string, _staffId: string): Promise<void> {
  throw new Error('Staff management is not yet available.');
}

/**
 * Updates a room type's price (and optionally other fields).
 * PATCH /api/v1/hotels/:hotelId/room-types/:roomTypeId
 */
export async function updateRoomTypePricing(
  hotelId: string,
  roomTypeId: string,
  payload: { pricePerNight?: number; name?: string; totalRooms?: number },
): Promise<DashboardRoomType> {
  type ApiRoomTypeRaw = {
    id: string; name: string; totalRooms?: number; quantity?: number;
    availableRooms?: number; available?: number; pricePerNight: number;
    bedType: string; capacity?: number; maxGuests?: number; imageUrl?: string;
  };
  const raw = await apiClient.patch<ApiRoomTypeRaw>(
    `/api/v1/hotels/${hotelId}/room-types/${roomTypeId}`,
    payload,
  );
  return {
    id: raw.id,
    name: raw.name,
    totalRooms: raw.totalRooms ?? raw.quantity ?? 0,
    availableRooms: raw.availableRooms ?? raw.available ?? 0,
    pricePerNight: typeof raw.pricePerNight === 'number'
      ? raw.pricePerNight
      : Number(raw.pricePerNight),
    bedType: raw.bedType,
    capacity: raw.capacity ?? raw.maxGuests ?? 0,
    imageUrl: raw.imageUrl,
  };
}

/**
 * Publishes the hotel so it becomes visible to travellers.
 * PATCH /api/v1/hotels/:hotelId/publish
 * Requires an approved hotel with an active subscription.
 */
export async function publishHotel(hotelId: string): Promise<DashboardHotel> {
  return apiClient.patch<DashboardHotel>(`/api/v1/hotels/${hotelId}/publish`);
}

/**
 * Unpublishes the hotel, hiding it from travellers.
 * PATCH /api/v1/hotels/:hotelId/unpublish
 */
export async function unpublishHotel(hotelId: string): Promise<DashboardHotel> {
  return apiClient.patch<DashboardHotel>(`/api/v1/hotels/${hotelId}/unpublish`);
}
