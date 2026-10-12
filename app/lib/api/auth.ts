import { apiClient, storeTokens, storeUser, clearTokens, type AuthUser } from './client';

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', payload);
  storeTokens(res.accessToken, res.refreshToken);
  storeUser(res.user);
  return res;
}

export async function register(payload: {
  email: string; password: string; firstName: string; lastName: string;
  phone?: string; role?: 'TRAVELER' | 'HOTEL_OWNER';
}): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/v1/auth/register', payload);
  storeTokens(res.accessToken, res.refreshToken);
  storeUser(res.user);
  return res;
}

export async function logout(): Promise<void> {
  try { await apiClient.post('/api/v1/auth/logout'); } finally { clearTokens(); }
}

export async function getMe(): Promise<AuthUser> {
  return apiClient.get<AuthUser>('/api/v1/auth/me');
}
