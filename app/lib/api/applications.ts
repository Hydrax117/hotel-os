import { apiClient, ApiError } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ApplicationImage = {
  url: string;
  caption?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

export type ApplicationDocument = {
  url: string;
  documentType: string;
  label: string;
};

export type ApplicationRoom = {
  name: string;
  bedType: string;
  capacity: number;
  pricePerNight: number;
  totalRooms: number;
  description?: string;
  sizeSqm?: number;
  bathroomType?: string;
};

export type HotelApplication = {
  id: string;
  ownerId: string;
  status: ApplicationStatus;
  adminNotes?: string | null;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  email?: string;
  checkInTime: string;
  checkOutTime: string;
  amenityIds: string[];
  languages: string[];
  images: ApplicationImage[];
  documents: ApplicationDocument[];
  rooms: ApplicationRoom[];
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; firstName: string; lastName: string; email: string };
};

export type SubmitApplicationPayload = {
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  checkInTime?: string;
  checkOutTime?: string;
  amenityIds?: string[];
  languages?: string[];
  images: ApplicationImage[];
  documents: ApplicationDocument[];
  rooms: ApplicationRoom[];
};

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Submit a new hotel application.
 * POST /api/v1/hotel-applications
 */
export async function submitApplication(
  payload: SubmitApplicationPayload,
): Promise<HotelApplication> {
  return apiClient.post<HotelApplication>('/api/v1/hotel-applications', payload);
}

/**
 * Get the current owner's own application.
 * GET /api/v1/hotel-applications/my
 * Returns null if the owner has no application yet (404).
 */
export async function getMyApplication(): Promise<HotelApplication | null> {
  try {
    return await apiClient.get<HotelApplication>('/api/v1/hotel-applications/my');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * List all applications (admin only).
 * GET /api/v1/hotel-applications
 */
export async function getAdminApplications(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<HotelApplication[]> {
  const parts: string[] = [];
  if (params?.status) parts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.page !== undefined) parts.push(`page=${params.page}`);
  if (params?.limit !== undefined) parts.push(`limit=${params.limit}`);
  const qs = parts.length > 0 ? '?' + parts.join('&') : '';
  const raw = await apiClient.get<HotelApplication[] | { applications: HotelApplication[] }>(
    `/api/v1/hotel-applications${qs}`,
  );
  return Array.isArray(raw) ? raw : raw.applications;
}

/**
 * Get a single application by id (admin only).
 * GET /api/v1/hotel-applications/:id
 */
export async function getAdminApplicationDetail(id: string): Promise<HotelApplication> {
  return apiClient.get<HotelApplication>(`/api/v1/hotel-applications/${id}`);
}

/**
 * Approve an application (admin only).
 * POST /api/v1/hotel-applications/:id/approve
 */
export async function approveApplication(id: string, notes?: string): Promise<unknown> {
  return apiClient.post<unknown>(`/api/v1/hotel-applications/${id}/approve`, { notes });
}

/**
 * Reject an application (admin only).
 * POST /api/v1/hotel-applications/:id/reject
 */
export async function rejectApplication(id: string, notes: string): Promise<unknown> {
  return apiClient.post<unknown>(`/api/v1/hotel-applications/${id}/reject`, { notes });
}
