'use client';

import { useState } from 'react';
import { FormField } from './FormField';
import type { RoomType } from '../context/OnboardingContext';

type RoomCardProps = {
  room: RoomType;
  onUpdate: (data: Partial<RoomType>) => void;
  onRemove: () => void;
  index: number;
  /** When true, show validation errors even if the field hasn't been touched yet. */
  showErrors?: boolean;
};

export function RoomCard({ room, onUpdate, onRemove, index, showErrors = false }: RoomCardProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));
  const shouldShow = (field: string) => showErrors || touched[field];

  const nameError = shouldShow('name') && !room.name.trim() ? 'Room name is required.' : undefined;
  const totalRoomsError = shouldShow('totalRooms') && room.totalRooms <= 0 ? 'Must be at least 1.' : undefined;
  const priceError = shouldShow('pricePerNight') && room.pricePerNight <= 0 ? 'Price must be greater than 0.' : undefined;

  return (
    <div className="rounded-xl border border-[var(--ob-border)] bg-[var(--ob-surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--ob-primary)]">Room Type {index + 1}</h3>
        <button
          type="button"
          onClick={onRemove}
          className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Room Name"
          placeholder="e.g. Deluxe Double"
          value={room.name}
          onChange={e => onUpdate({ name: e.currentTarget.value })}
          onBlur={() => touch('name')}
          required
          error={nameError}
        />
        <FormField
          label="Capacity (guests)"
          type="number"
          min={1}
          value={room.capacity}
          onChange={e => onUpdate({ capacity: Number(e.currentTarget.value) })}
          required
        />
        <FormField
          label="Bed Type"
          placeholder="e.g. King, Twin, Bunk"
          value={room.bedType}
          onChange={e => onUpdate({ bedType: e.currentTarget.value })}
        />
        <FormField
          label="Bathroom Type"
          placeholder="e.g. En-suite, Shared"
          value={room.bathroomType}
          onChange={e => onUpdate({ bathroomType: e.currentTarget.value })}
        />
        <FormField
          label="Total Rooms"
          type="number"
          min={1}
          value={room.totalRooms}
          onChange={e => onUpdate({ totalRooms: Number(e.currentTarget.value) })}
          onBlur={() => touch('totalRooms')}
          required
          error={totalRoomsError}
        />
        <FormField
          label="Price Per Night (₦)"
          type="number"
          min={0}
          value={room.pricePerNight}
          onChange={e => onUpdate({ pricePerNight: Number(e.currentTarget.value) })}
          onBlur={() => touch('pricePerNight')}
          required
          error={priceError}
        />
      </div>
    </div>
  );
}
