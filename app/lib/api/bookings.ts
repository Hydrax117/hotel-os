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
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: ApiBookingStatus;
  specialRequests?: string;
  createdAt: string;
  hotel?: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
  room?: {
    id: string;
    name: string;
    pricePerNight: number;
  };
};

export type InitPaymentResponse = {
  paymentUrl: string;
  reference: string;
  accessCode: string;
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
export function initializePayment(bookingId: string, email: string): Promise<InitPaymentResponse> {
  return apiClient.post<InitPaymentResponse>(
    `/api/v1/payments/initialize`,
    { bookingId, email },
  );
}

/**
 * Fetch all bookings for the authenticated user.
 * GET /api/v1/bookings
 */
export function getMyBookings(): Promise<BookingResponse[]> {
  return apiClient.get<BookingResponse[]>('/api/v1/bookings');
}

/**
 * Cancel a booking by ID.
 * POST /api/v1/bookings/{bookingId}/cancel
 */
export function cancelBooking(bookingId: string): Promise<void> {
  return apiClient.post<void>(`/api/v1/bookings/${bookingId}/cancel`);
}
