'use client';

import { FormField } from './FormField';
import type { RoomType } from '../context/OnboardingContext';

type RoomCardProps = {
  room: RoomType;
  onUpdate: (data: Partial<RoomType>) => void;
  onRemove: () => void;
  index: number;
};

export function RoomCard({ room, onUpdate, onRemove, index }: RoomCardProps) {
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
          onChange={e => onUpdate({ name: (e.target as HTMLInputElement).value })}
          required
        />
        <FormField
          label="Capacity (guests)"
          type="number"
          min={1}
          value={room.capacity}
          onChange={e => onUpdate({ capacity: Number((e.target as HTMLInputElement).value) })}
          required
        />
        <FormField
          label="Bed Type"
          placeholder="e.g. King, Twin, Bunk"
          value={room.bedType}
          onChange={e => onUpdate({ bedType: (e.target as HTMLInputElement).value })}
        />
        <FormField
          label="Bathroom Type"
          placeholder="e.g. En-suite, Shared"
          value={room.bathroomType}
          onChange={e => onUpdate({ bathroomType: (e.target as HTMLInputElement).value })}
        />
        <FormField
          label="Total Rooms"
          type="number"
          min={1}
          value={room.totalRooms}
          onChange={e => onUpdate({ totalRooms: Number((e.target as HTMLInputElement).value) })}
          required
        />
        <FormField
          label="Price Per Night (₦)"
          type="number"
          min={0}
          value={room.pricePerNight}
          onChange={e => onUpdate({ pricePerNight: Number((e.target as HTMLInputElement).value) })}
          required
        />
      </div>
    </div>
  );
}
