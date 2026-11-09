import { apiClient } from './client';

export type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type CreatedApiKey = ApiKey & {
  rawKey: string; // only returned once at creation
};

export function listApiKeys(hotelId: string): Promise<ApiKey[]> {
  return apiClient.get<ApiKey[]>(`/api/v1/hotels/${hotelId}/api-keys`);
}

export function createApiKey(
  hotelId: string,
  payload: { name: string; expiresAt?: string },
): Promise<CreatedApiKey> {
  return apiClient.post<CreatedApiKey>(`/api/v1/hotels/${hotelId}/api-keys`, payload);
}

export function revokeApiKey(hotelId: string, keyId: string): Promise<void> {
  return apiClient.delete<void>(`/api/v1/hotels/${hotelId}/api-keys/${keyId}`);
}
