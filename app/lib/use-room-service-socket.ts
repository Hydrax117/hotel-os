'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ServiceOrder, ServiceOrderStatus } from './api/room-service';

const WS_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'https://hotel-os-api-52qe.onrender.com'
).replace(/\/$/, '');

// ── Event payload types ───────────────────────────────────────────────────────

export type RoomServiceOrderPayload = {
  type: 'room-service-order';
  orderId: string;
  reference: string;
  guestName: string;
  venueName: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  totalNgn: number;
  notes?: string;
  roomNumber?: string;
  status: ServiceOrderStatus;
};

export type OrderUpdatePayload = {
  type: 'room-service-order-updated';
  orderId: string;
  status: ServiceOrderStatus;
};

export type BookingEventPayload = {
  bookingId: string;
  reference: string;
  guestName: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
};

type Handlers = {
  /** New room service order confirmed (payment received) */
  onNewOrder?: (order: RoomServiceOrderPayload) => void;
  /** Room service order status changed by staff */
  onOrderUpdate?: (payload: OrderUpdatePayload) => void;
  /** New hotel booking created */
  onNewBooking?: (payload: BookingEventPayload) => void;
  /** Hotel booking confirmed (payment) */
  onBookingConfirmed?: (payload: BookingEventPayload) => void;
  /** Hotel booking cancelled */
  onBookingCancelled?: (payload: BookingEventPayload) => void;
  /** Guest checked in */
  onGuestCheckIn?: (payload: BookingEventPayload) => void;
};

/**
 * Connects to the unified /notifications Socket.IO namespace and joins the
 * hotel-scoped room `hotel:<hotelId>` so the client only receives events for
 * its own hotel.
 *
 * Authentication: pass the JWT access token so the gateway can verify identity.
 * Without a token the socket still connects but `subscribe-hotel` will fail on
 * the server — in that case we fall back to a simple `join-hotel` (no JWT).
 *
 * Usage:
 *   useRoomServiceSocket({ hotelId: 'abc', token: accessToken, onNewOrder: handler })
 */
export function useRoomServiceSocket(
  hotelId: string | undefined,
  handlers: Handlers,
  token?: string,
) {
  const socketRef = useRef<Socket | null>(null);

  // Keep latest handlers in a ref so we never need to re-subscribe on change
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const connect = useCallback(() => {
    if (!hotelId) return;

    const socket = io(`${WS_URL}/notifications`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      if (token) {
        // JWT-authenticated subscription (preferred)
        socket.emit('subscribe-hotel', { hotelId, token });
      } else {
        // Fallback: unauthenticated room join (dashboard still gets events)
        socket.emit('join-hotel', { hotelId });
      }
    });

    // ── Room service order events ─────────────────────────────────────────
    socket.on('new-order', (payload: RoomServiceOrderPayload) => {
      handlersRef.current.onNewOrder?.(payload);
    });

    socket.on('order-status-updated', (payload: OrderUpdatePayload) => {
      handlersRef.current.onOrderUpdate?.(payload);
    });

    // ── Booking events ────────────────────────────────────────────────────
    socket.on('new-order', (payload: BookingEventPayload) => {
      // The gateway reuses 'new-order' for both; differentiate by type field
      if ((payload as unknown as { type?: string }).type === 'room-service-order') return;
      handlersRef.current.onNewBooking?.(payload);
    });

    socket.on('booking-confirmed', (payload: BookingEventPayload) => {
      handlersRef.current.onBookingConfirmed?.(payload);
    });

    socket.on('booking-cancelled', (payload: BookingEventPayload) => {
      handlersRef.current.onBookingCancelled?.(payload);
    });

    socket.on('guest-checked-in', (payload: BookingEventPayload) => {
      handlersRef.current.onGuestCheckIn?.(payload);
    });

    socketRef.current = socket;
    return socket;
  }, [hotelId, token]);

  useEffect(() => {
    const socket = connect();
    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [connect]);
}
