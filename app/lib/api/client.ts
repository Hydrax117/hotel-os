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

// Attempt to refresh the access token using the stored refresh token.
// Returns the new access token on success, or null if refresh fails.
async function attemptTokenRefresh(): Promise<string | 'network_error' | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('hotel_os_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    // 401/403 means the refresh token is genuinely invalid/expired
    if (res.status === 401 || res.status === 403) return null;
    // Any other non-OK (5xx, network-level timeout surfaced as !ok) — don't
    // treat as an auth failure; signal the caller to preserve the session.
    if (!res.ok) return 'network_error';
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    storeTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    // Fetch itself threw (network down, CORS, timeout) — not an auth failure
    return 'network_error';
  }
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // On 401, attempt a one-time token refresh then retry the original request
  if (res.status === 401 && !isRetry) {
    const refreshResult = await attemptTokenRefresh();
    if (typeof refreshResult === 'string' && refreshResult !== 'network_error') {
      // Got a fresh token — retry the original request
      return request<T>(path, options, true);
    }
    if (refreshResult === null) {
      // Refresh token is genuinely invalid/expired — clear session
      clearTokens();
    }
    // refreshResult === 'network_error': backend unreachable, keep tokens and
    // let the ApiError propagate so the caller can decide what to do
  }

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
