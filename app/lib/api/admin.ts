import { apiClient } from './client';

// ── Exported Types ─────────────────────────────────────────────────────────────

export type AdminStats = {
  totalHotels: number;
  activeHotels: number;
  pendingVerifications: number;
  suspendedHotels: number;
  totalBookings: number;
  confirmedBookings: number;
  gmvNgn: number;
  platformRevenueNgn: number;
  totalTravelers: number;
  totalHotelOwners: number;
};

export type AdminHotel = {
  id: string;
  name: string;
  city: string;
  state: string;
  verificationStatus: string;
  subscriptionPlan: string;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  owner: { id: string; firstName: string; lastName: string; email: string } | null;
  _count?: { bookings: number; reviews: number };
};

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: { bookings: number };
};

export type AdminBooking = {
  id: string;
  reference: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalNgn: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string } | null;
  hotel: { name: string; city: string } | null;
  roomType: { name: string } | null;
};

export type AdminHotelsResponse = { hotels: AdminHotel[]; total: number };
export type AdminUsersResponse = { users: AdminUser[]; total: number };
export type AdminBookingsResponse = { bookings: AdminBooking[]; total: number };

export type RevenueStats = {
  fromDate: string;
  toDate: string;
  totalGmvNgn: number;
  totalCommissionNgn: number;
  bookingCount: number;
  averageBookingValueNgn: number;
  dailyRevenue: { date: string; gmvNgn: number; commissionNgn: number; bookings: number }[];
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Converts a params object (skipping undefined values) into a URL query string. */
export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? '?' + parts.join('&') : '';
}

// ── API Functions ────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  return apiClient.get<AdminStats>('/api/v1/admin/stats');
}

export async function getAdminRevenue(fromDate: string, toDate: string): Promise<RevenueStats> {
  const qs = buildQuery({ fromDate, toDate });
  return apiClient.get<RevenueStats>(`/api/v1/admin/revenue${qs}`);
}

export async function getAdminHotels(params?: {
  status?: string;
  city?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<AdminHotelsResponse> {
  const qs = buildQuery(params ?? {});
  const raw = await apiClient.get<AdminHotelsResponse | AdminHotel[]>(`/api/v1/admin/hotels${qs}`);
  if (Array.isArray(raw)) {
    return { hotels: raw, total: raw.length };
  }
  return raw;
}

export async function getAdminHotelDetail(id: string): Promise<AdminHotel> {
  return apiClient.get<AdminHotel>(`/api/v1/admin/hotels/${id}`);
}

export async function approveHotel(
  id: string,
  payload: { status: string; notes?: string },
): Promise<AdminHotel> {
  return apiClient.post<AdminHotel>(`/api/v1/admin/hotels/${id}/approve`, payload);
}

export async function suspendHotel(id: string, reason: string): Promise<AdminHotel> {
  return apiClient.post<AdminHotel>(`/api/v1/admin/hotels/${id}/suspend`, { reason });
}

export async function getAdminUsers(params?: {
  role?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<AdminUsersResponse> {
  const qs = buildQuery(params ?? {});
  const raw = await apiClient.get<AdminUsersResponse | AdminUser[]>(`/api/v1/admin/users${qs}`);
  if (Array.isArray(raw)) {
    return { users: raw, total: raw.length };
  }
  return raw;
}

export async function suspendUser(id: string): Promise<AdminUser> {
  return apiClient.post<AdminUser>(`/api/v1/admin/users/${id}/suspend`);
}

export async function reactivateUser(id: string): Promise<AdminUser> {
  return apiClient.post<AdminUser>(`/api/v1/admin/users/${id}/reactivate`);
}

export async function getAdminBookings(params?: {
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}): Promise<AdminBookingsResponse> {
  const qs = buildQuery(params ?? {});
  const raw = await apiClient.get<AdminBookingsResponse | AdminBooking[]>(
    `/api/v1/admin/bookings${qs}`,
  );
  if (Array.isArray(raw)) {
    return { bookings: raw, total: raw.length };
  }
  return raw;
}
