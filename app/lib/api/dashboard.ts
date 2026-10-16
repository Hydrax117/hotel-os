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
  roomTypeName: string;
  roomNumber: string;
  checkIn: string;      // ISO date
  checkOut: string;     // ISO date
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

export type DashboardInventoryDay = {
  date: string;
  available: number;
  held: number;
  booked: number;
};

export type DashboardRoomInventory = {
  roomTypeId: string;
  roomTypeName: string;
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
  user?: { firstName?: string; lastName?: string; email?: string };
  room?: { name?: string; number?: string };
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
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
 * GET /api/v1/hotels/:hotelId/bookings
 * Handles both plain-array and { data: [...] } paginated response shapes.
 */
export async function getDashboardReservations(hotelId: string): Promise<DashboardReservation[]> {
  const raw = await apiClient.get<ApiBooking[] | { data: ApiBooking[] }>(
    `/api/v1/hotels/${hotelId}/bookings`,
  );

  const bookings: ApiBooking[] = Array.isArray(raw) ? raw : raw.data;

  return bookings.map((booking) => {
    const checkInMs  = new Date(booking.checkIn).getTime();
    const checkOutMs = new Date(booking.checkOut).getTime();
    const nights     = Math.round((checkOutMs - checkInMs) / 86_400_000);

    const firstName = booking.user?.firstName ?? '';
    const lastName  = booking.user?.lastName  ?? '';
    const guestName = (firstName + ' ' + lastName).trim() || 'Unknown Guest';

    return {
      id:           booking.id,
      guestName,
      guestEmail:   booking.user?.email  ?? '',
      roomTypeName: booking.room?.name   ?? 'Room',
      roomNumber:   booking.roomNumber   ?? booking.room?.number ?? '–',
      checkIn:      booking.checkIn,
      checkOut:     booking.checkOut,
      nights:       isNaN(nights) ? 0 : nights,
      amountNgn:    booking.totalAmount,
      status:       normalizeStatus(booking.status),
      createdAt:    booking.createdAt,
    };
  });
}

/**
 * Returns all room types for a given hotel.
 * GET /api/v1/hotels/:hotelId/rooms
 * Handles both plain-array and { rooms: [...] } response shapes.
 */
export async function getDashboardRoomTypes(hotelId: string): Promise<DashboardRoomType[]> {
  const raw = await apiClient.get<ApiRoomType[] | { rooms: ApiRoomType[] }>(
    `/api/v1/hotels/${hotelId}/rooms`,
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
 * Returns room inventory calendar data for a given hotel.
 * GET /api/v1/hotels/:hotelId/inventory
 * Returns [] if the endpoint is absent (404/500) so the inventory page degrades gracefully.
 */
export async function getDashboardInventory(hotelId: string): Promise<DashboardRoomInventory[]> {
  try {
    const raw = await apiClient.get<DashboardRoomInventory[]>(
      `/api/v1/hotels/${hotelId}/inventory`,
    );
    return Array.isArray(raw) ? raw : [];
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
 * GET /api/v1/hotels/:hotelId/staff
 * Handles both plain array and { data: [...] } shapes.
 * Returns [] on any error so pages degrade gracefully.
 */
export async function getHotelStaff(hotelId: string): Promise<DashboardStaffMember[]> {
  try {
    const raw = await apiClient.get<DashboardStaffMember[] | { data: DashboardStaffMember[] }>(
      `/api/v1/hotels/${hotelId}/staff`,
    );
    return Array.isArray(raw) ? raw : raw.data;
  } catch {
    return [];
  }
}

/**
 * Invites a new staff member to the hotel.
 * POST /api/v1/hotels/:hotelId/staff
 * Throws on error so the UI can display the message.
 */
export async function inviteStaffMember(
  hotelId: string,
  payload: { name: string; email: string; role: string },
): Promise<DashboardStaffMember> {
  return apiClient.post<DashboardStaffMember>(`/api/v1/hotels/${hotelId}/staff`, payload);
}

/**
 * Updates the status of a staff member.
 * PATCH /api/v1/hotels/:hotelId/staff/:staffId
 * Throws on error so the UI can revert optimistic state.
 */
export async function updateStaffStatus(
  hotelId: string,
  staffId: string,
  status: 'active' | 'inactive',
): Promise<void> {
  await apiClient.patch<unknown>(`/api/v1/hotels/${hotelId}/staff/${staffId}`, { status });
}

/**
 * Removes a staff member from the hotel.
 * DELETE /api/v1/hotels/:hotelId/staff/:staffId
 * Throws on error so the UI can revert optimistic state.
 */
export async function removeStaffMember(hotelId: string, staffId: string): Promise<void> {
  await apiClient.delete<unknown>(`/api/v1/hotels/${hotelId}/staff/${staffId}`);
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
