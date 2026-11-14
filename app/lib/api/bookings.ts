import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApiBookingStatus =
  | 'HELD'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'PAYMENT_PENDING'
  | 'NO_SHOW'
  | 'PENDING';

export type CreateBookingPayload = {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
};

export type BookingResponse = {
  id: string;
  /** Human-readable reference, e.g. HOS-12345 */
  reference?: string;
  hotelId: string;
  /** The backend returns this field as roomTypeId, not roomId */
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  /** The backend stores this as totalNgn (Decimal) */
  totalNgn: number;
  subtotalNgn?: number;
  serviceFeeNgn?: number;
  status: ApiBookingStatus;
  specialRequests?: string;
  createdAt: string;
  hotel?: {
    id: string;
    name: string;
    city: string;
    state: string;
    address?: string;
    phone?: string;
    email?: string;
    checkInTime?: string;
    checkOutTime?: string;
  };
  /** The backend includes room type as roomType, not room */
  roomType?: {
    id: string;
    name: string;
    bedType?: string;
    capacity?: number;
    sizeSqm?: number;
    pricePerNight: number;
  };
  payment?: {
    id: string;
    reference: string;
    amountNgn: number;
    status: string;
    paidAt?: string;
  };
  hasReview?: boolean;
};

export type InitPaymentResponse = {
  paymentUrl: string;
  reference: string;
  bookingReference: string;
};

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Create a new booking.
 * POST /api/v1/bookings
 */
export function createBooking(payload: CreateBookingPayload): Promise<BookingResponse> {
  return apiClient.post<BookingResponse>('/api/v1/bookings', payload);
}

/**
 * Initialize payment for a booking — returns a Paystack redirect URL.
 * POST /api/v1/payments/initialize
 */
export function initializePayment(
  bookingId: string,
  email: string,
  callbackUrl?: string,
): Promise<InitPaymentResponse> {
  return apiClient.post<InitPaymentResponse>(
    `/api/v1/payments/initialize`,
    { bookingId, email, ...(callbackUrl ? { callbackUrl } : {}) },
  );
}

/**
 * Verify a payment by Paystack reference and confirm the booking.
 * GET /api/v1/payments/verify/:reference
 */
export function verifyPayment(reference: string): Promise<{ status: string; bookingId: string }> {
  return apiClient.get<{ status: string; bookingId: string }>(
    `/api/v1/payments/verify/${encodeURIComponent(reference)}`,
  );
}

type MyBookingsResponse = { bookings: BookingResponse[]; total: number } | BookingResponse[];

/**
 * Fetch all bookings for the authenticated user.
 * GET /api/v1/bookings
 */
export async function getMyBookings(): Promise<BookingResponse[]> {
  const raw = await apiClient.get<MyBookingsResponse>('/api/v1/bookings');
  // The backend returns { bookings: [...], total: N } — handle both shapes for safety
  if (Array.isArray(raw)) return raw;
  return (raw as { bookings: BookingResponse[]; total: number }).bookings ?? [];
}

/**
 * Cancel a booking by ID.
 * POST /api/v1/bookings/{bookingId}/cancel
 */
export function cancelBooking(bookingId: string): Promise<void> {
  return apiClient.post<void>(`/api/v1/bookings/${bookingId}/cancel`);
}

/**
 * Get a single booking by ID (full detail including hotel, roomType, payment).
 * GET /api/v1/bookings/{bookingId}
 */
export function getBookingById(bookingId: string): Promise<BookingResponse> {
  return apiClient.get<BookingResponse>(`/api/v1/bookings/${bookingId}`);
}
