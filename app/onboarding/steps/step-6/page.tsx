'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/app/onboarding/context/OnboardingContext';
import { StepShell } from '@/app/onboarding/components/StepShell';
import { RoomCard } from '@/app/onboarding/components/RoomCard';

function isRoomValid(room: { name: string; pricePerNight: number; totalRooms: number }) {
  return room.name.trim().length > 0 && room.pricePerNight > 0 && room.totalRooms > 0;
}

export default function Step6Page() {
  const router = useRouter();
  const { rooms, addRoom, updateRoom, removeRoom, setStep } = useOnboarding();
  const [attempted, setAttempted] = useState(false);

  const allRoomsValid = rooms.length > 0 && rooms.every(isRoomValid);

  const handleBack = () => {
    setStep(5);
    router.push('/onboarding/steps/step-5');
  };

  const handleNext = () => {
    if (!allRoomsValid) {
      setAttempted(true);
      return;
    }
    setStep(7);
    router.push('/onboarding/steps/step-7');
  };

  return (
    <StepShell
      title="Room Types"
      description="Define the types of rooms available at your property."
      step={6}
      totalSteps={8}
      onBack={handleBack}
      onNext={handleNext}
      isNextDisabled={!allRoomsValid}
    >
      <div className="flex flex-col gap-4">
        {rooms.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--ob-border)] bg-[var(--ob-muted)] px-6 py-10 text-center">
            <p className="text-sm text-[var(--ob-secondary)]">No room types added yet.</p>
            <p className="mt-1 text-xs text-[var(--ob-secondary)]">Click the button below to add your first room type.</p>
          </div>
        )}

        {attempted && rooms.length === 0 && (
          <p className="text-xs text-red-500">Add at least one room type before continuing.</p>
        )}

        {rooms.map((room, index) => (
          <RoomCard
            key={room.id}
            room={room}
            index={index}
            onUpdate={data => updateRoom(room.id, data)}
            onRemove={() => removeRoom(room.id)}
            showErrors={attempted}
          />
        ))}

        <button
          type="button"
          onClick={addRoom}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--ob-accent)]/40 py-4 text-sm font-medium text-[var(--ob-accent)] transition-colors hover:border-[var(--ob-accent)] hover:bg-[var(--ob-accent)]/5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add room type
        </button>
      </div>
    </StepShell>
  );
}
