import { apiClient } from './client';

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export async function getUserProfile(): Promise<UserProfile> {
  return apiClient.get<UserProfile>('/api/v1/users/profile');
}

export async function updateUserProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  return apiClient.patch<UserProfile>('/api/v1/users/profile', payload);
}
