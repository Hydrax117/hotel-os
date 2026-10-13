import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type HotelImage = {
  id: string;
  hotelId: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
};

// ── API Functions ─────────────────────────────────────────────────────────────

/** Returns all images for a hotel. GET /api/v1/hotels/:hotelId/images */
export function getHotelImages(hotelId: string): Promise<HotelImage[]> {
  return apiClient.get<HotelImage[]>(`/api/v1/hotels/${hotelId}/images`);
}

/** Saves a new hotel image record. POST /api/v1/hotels/:hotelId/images */
export function saveHotelImage(
  hotelId: string,
  dto: { url: string; caption?: string; isPrimary?: boolean; sortOrder?: number },
): Promise<HotelImage> {
  return apiClient.post<HotelImage>(`/api/v1/hotels/${hotelId}/images`, dto);
}

/** Deletes a hotel image record. DELETE /api/v1/hotels/:hotelId/images/:imageId */
export function deleteHotelImage(hotelId: string, imageId: string): Promise<void> {
  return apiClient.delete<void>(`/api/v1/hotels/${hotelId}/images/${imageId}`);
}

/** Marks a hotel image as the primary image. PATCH /api/v1/hotels/:hotelId/images/:imageId/primary */
export function setImagePrimary(hotelId: string, imageId: string): Promise<HotelImage> {
  return apiClient.patch<HotelImage>(`/api/v1/hotels/${hotelId}/images/${imageId}/primary`);
}
