import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CreateHotelPayload = {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  houseRules?: string;
  languages?: string[];
};

export type HotelResponse = {
  id: string;
  name: string;
  status: string;
};

export type CreateRoomTypePayload = {
  name: string;
  capacity: number;
  bedType: string;
  bathroomType: string;
  totalRooms: number;
  pricePerNight: number;
};

export type RoomTypeResponse = { id: string; name: string };

export type SaveDocumentPayload = {
  url: string;
  documentType: string;
  label: string;
};

export type DocumentResponse = { id: string; url: string; documentType: string };

export type CreateSubscriptionPayload = { plan: string };
export type SubscriptionResponse = { id: string; plan: string; status: string };

// ── API Functions ─────────────────────────────────────────────────────────────

/** Creates a new hotel. POST /api/v1/hotels */
export function createHotel(payload: CreateHotelPayload): Promise<HotelResponse> {
  return apiClient.post<HotelResponse>('/api/v1/hotels', payload);
}

/** Creates a room type for a hotel. POST /api/v1/hotels/:hotelId/room-types */
export function createRoomType(
  hotelId: string,
  payload: CreateRoomTypePayload,
): Promise<RoomTypeResponse> {
  return apiClient.post<RoomTypeResponse>(`/api/v1/hotels/${hotelId}/room-types`, payload);
}

/** Saves a verification document record. POST /api/v1/hotels/:hotelId/documents */
export function saveDocument(
  hotelId: string,
  payload: SaveDocumentPayload,
): Promise<DocumentResponse> {
  return apiClient.post<DocumentResponse>(`/api/v1/hotels/${hotelId}/documents`, payload);
}

/** Creates a subscription for a hotel. POST /api/v1/hotels/:hotelId/subscription */
export function createSubscription(
  hotelId: string,
  payload: CreateSubscriptionPayload,
): Promise<SubscriptionResponse> {
  return apiClient.post<SubscriptionResponse>(`/api/v1/hotels/${hotelId}/subscription`, payload);
}
