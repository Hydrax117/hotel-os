const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://hotel-os-api-52qe.onrender.com';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'HOTEL_OWNER' | 'HOTEL_MANAGER' | 'HOTEL_STAFF' | 'TRAVELER';
};

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hotel_os_access_token');
}

export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('hotel_os_access_token', accessToken);
  localStorage.setItem('hotel_os_refresh_token', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('hotel_os_access_token');
  localStorage.removeItem('hotel_os_refresh_token');
  localStorage.removeItem('hotel_os_user');
}

export function storeUser(user: AuthUser): void {
  localStorage.setItem('hotel_os_user', JSON.stringify(user));
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('hotel_os_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let errorBody: { message?: string | string[]; errors?: Record<string, string[]> } = {};
    try { errorBody = await res.json(); } catch { /* ignore */ }
    const msg = Array.isArray(errorBody.message)
      ? errorBody.message.join(', ')
      : (errorBody.message ?? `HTTP ${res.status}`);
    throw new ApiError(res.status, msg, errorBody.errors);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  get:    <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
  post:   <T>(path: string, body?: unknown, init?: RequestInit) => request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown, init?: RequestInit) => request<T>(path, { ...init, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'DELETE' }),
};
