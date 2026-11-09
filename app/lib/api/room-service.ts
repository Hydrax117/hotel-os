import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ServiceVenueType = 'RESTAURANT' | 'BAR' | 'CAFE' | 'ROOM_SERVICE' | 'OTHER';

export type ServiceOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'DELIVERED'
  | 'CANCELLED';

export type MenuItem = {
  id: string;
  venueId: string;
  name: string;
  description?: string;
  category: string;
  priceNgn: number;
  isAvailable: boolean;
  imageUrl?: string;
};

export type ServiceVenue = {
  id: string;
  hotelId: string;
  name: string;
  type: ServiceVenueType;
  description?: string;
  isActive: boolean;
  menuItems: MenuItem[];
};

export type OrderItem = {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  menuItem?: { name: string; category?: string };
};

export type ServiceOrder = {
  id: string;
  reference: string;
  bookingId: string;
  venueId: string;
  userId: string;
  status: ServiceOrderStatus;
  totalNgn: number;
  notes?: string;
  roomNumber?: string;
  createdAt: string;
  items: OrderItem[];
  venue?: { name: string; type: ServiceVenueType };
  payment?: { status: string; paidAt?: string };
  booking?: { reference: string; guestFirstName: string; guestLastName: string };
};

export type PlaceOrderPayload = {
  bookingId: string;
  venueId: string;
  items: { menuItemId: string; quantity: number }[];
  notes?: string;
  roomNumber?: string;
  callbackUrl?: string;
};

export type ExtensionCheck = {
  available: boolean;
  extraNights: number;
  extraAmountNgn: number;
  pricePerNight: number;
};

// ── Room service API ──────────────────────────────────────────────────────────

/** Public: get venues + menus for a hotel */
export function getPublicVenues(
  hotelId: string,
): Promise<{ enabled: boolean; venues: ServiceVenue[] }> {
  return apiClient.get(`/api/v1/room-service/hotels/${hotelId}/public`);
}

/** Place an order — returns Paystack URL */
export function placeOrder(
  payload: PlaceOrderPayload,
): Promise<{ orderId: string; paymentUrl: string; reference: string }> {
  return apiClient.post('/api/v1/room-service/orders', payload);
}

/** Verify room service payment */
export function verifyOrderPayment(
  reference: string,
): Promise<{ status: string; orderId: string }> {
  return apiClient.get(`/api/v1/room-service/orders/verify/${encodeURIComponent(reference)}`);
}

/** Get current user's orders (optionally filtered by booking) */
export function getMyOrders(bookingId?: string): Promise<ServiceOrder[]> {
  const qs = bookingId ? `?bookingId=${encodeURIComponent(bookingId)}` : '';
  return apiClient.get(`/api/v1/room-service/orders/mine${qs}`);
}

/** Get a single order */
export function getOrder(orderId: string): Promise<ServiceOrder> {
  return apiClient.get(`/api/v1/room-service/orders/${orderId}`);
}

// ── Hotel management API ──────────────────────────────────────────────────────

export function toggleRoomService(
  hotelId: string,
  enabled: boolean,
): Promise<{ id: string; roomServiceEnabled: boolean }> {
  return apiClient.patch(`/api/v1/room-service/hotels/${hotelId}/toggle`, { enabled });
}

export function getHotelVenues(hotelId: string): Promise<ServiceVenue[]> {
  return apiClient.get(`/api/v1/room-service/hotels/${hotelId}/venues`);
}

export function createVenue(
  hotelId: string,
  data: { name: string; type: ServiceVenueType; description?: string },
): Promise<ServiceVenue> {
  return apiClient.post(`/api/v1/room-service/hotels/${hotelId}/venues`, data);
}

export function updateVenue(
  venueId: string,
  data: Partial<{ name: string; type: ServiceVenueType; description: string; isActive: boolean }>,
): Promise<ServiceVenue> {
  return apiClient.patch(`/api/v1/room-service/venues/${venueId}`, data);
}

export function deleteVenue(venueId: string): Promise<void> {
  return apiClient.delete(`/api/v1/room-service/venues/${venueId}`);
}

export function createMenuItem(
  venueId: string,
  data: {
    name: string;
    description?: string;
    category: string;
    priceNgn: number;
    isAvailable?: boolean;
  },
): Promise<MenuItem> {
  return apiClient.post(`/api/v1/room-service/venues/${venueId}/menu`, data);
}

export function updateMenuItem(
  itemId: string,
  data: Partial<{
    name: string;
    description: string;
    category: string;
    priceNgn: number;
    isAvailable: boolean;
  }>,
): Promise<MenuItem> {
  return apiClient.patch(`/api/v1/room-service/menu/${itemId}`, data);
}

export function deleteMenuItem(itemId: string): Promise<void> {
  return apiClient.delete(`/api/v1/room-service/menu/${itemId}`);
}

export function getHotelOrders(hotelId: string): Promise<ServiceOrder[]> {
  return apiClient.get(`/api/v1/room-service/hotels/${hotelId}/orders`);
}

export function updateOrderStatus(
  orderId: string,
  status: ServiceOrderStatus,
): Promise<ServiceOrder> {
  return apiClient.patch(`/api/v1/room-service/orders/${orderId}/status`, { status });
}

// ── Stay extension API ────────────────────────────────────────────────────────

export function checkExtensionAvailability(
  bookingId: string,
  newCheckOut: string,
): Promise<ExtensionCheck> {
  return apiClient.get(
    `/api/v1/bookings/${bookingId}/extension/check?newCheckOut=${encodeURIComponent(newCheckOut)}`,
  );
}

export function confirmStayExtension(
  bookingId: string,
  newCheckOut: string,
): Promise<{ id: string; checkOut: string; nights: number; totalNgn: number }> {
  return apiClient.post(`/api/v1/bookings/${bookingId}/extension`, { newCheckOut });
}
