'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ServiceOrder, ServiceOrderStatus } from './api/room-service';

const WS_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'https://hotel-os-api-52qe.onrender.com').replace(
    /\/$/,
    '',
  );

export type OrderUpdatePayload = { orderId: string; status: ServiceOrderStatus };

type Handlers = {
  onNewOrder?: (order: ServiceOrder) => void;
  onOrderUpdate?: (payload: OrderUpdatePayload) => void;
};

/**
 * Connects to the /room-service Socket.IO namespace and joins the hotel room.
 * Re-connects automatically if the connection drops.
 *
 * Usage:
 *   useRoomServiceSocket({ hotelId: 'abc', onNewOrder: handler })
 */
export function useRoomServiceSocket(
  hotelId: string | undefined,
  handlers: Handlers,
) {
  const socketRef = useRef<Socket | null>(null);

  // Keep latest handlers in a ref so we never need to re-subscribe
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const connect = useCallback(() => {
    if (!hotelId) return;

    const socket = io(`${WS_URL}/room-service`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      socket.emit('join-hotel', { hotelId });
    });

    socket.on('new-order', (order: ServiceOrder) => {
      handlersRef.current.onNewOrder?.(order);
    });

    socket.on('order-updated', (payload: OrderUpdatePayload) => {
      handlersRef.current.onOrderUpdate?.(payload);
    });

    socketRef.current = socket;
    return socket;
  }, [hotelId]);

  useEffect(() => {
    const socket = connect();
    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [connect]);
}
