'use client';

import React, { createContext, useContext, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AccountData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type PropertyData = {
  hotelName: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
};

export type VerificationDocument = {
  id: string;
  label: string;
  file: File | null;
  required: boolean;
};

export type PropertyInfoData = {
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  houseRules: string;
  languages: string[];
};

export type ImageSlot = {
  id: string;
  label: string;
  file: File | null;
  preview: string | null;
};

export type RoomType = {
  id: string;
  name: string;
  capacity: number;
  bedType: string;
  bathroomType: string;
  totalRooms: number;
  pricePerNight: number;
};

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise' | null;

export type OnboardingState = {
  currentStep: number;
  account: AccountData;
  property: PropertyData;
  verification: VerificationDocument[];
  propertyInfo: PropertyInfoData;
  images: ImageSlot[];
  rooms: RoomType[];
  subscription: SubscriptionPlan;
  submitted: boolean;
};

export type OnboardingContextValue = OnboardingState & {
  setStep: (step: number) => void;
  updateAccount: (data: Partial<AccountData>) => void;
  updateProperty: (data: Partial<PropertyData>) => void;
  updateVerification: (id: string, file: File | null) => void;
  updatePropertyInfo: (data: Partial<PropertyInfoData>) => void;
  updateImageSlot: (id: string, file: File, preview: string) => void;
  addRoom: () => void;
  updateRoom: (id: string, data: Partial<RoomType>) => void;
  removeRoom: (id: string) => void;
  setSubscription: (plan: SubscriptionPlan) => void;
  submit: () => void;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_VERIFICATION_DOCS: VerificationDocument[] = [
  { id: 'cac', label: 'CAC / Business Registration', file: null, required: true },
  { id: 'ownerInfo', label: 'Owner Information', file: null, required: true },
  { id: 'governmentId', label: 'Government-Issued ID', file: null, required: true },
  { id: 'hotelDocs', label: 'Hotel Documents', file: null, required: false },
  { id: 'bankDetails', label: 'Bank Details', file: null, required: true },
];

const DEFAULT_IMAGE_SLOTS: ImageSlot[] = [
  { id: 'exterior',   label: 'Hotel Exterior', file: null, preview: null },
  { id: 'lobby',      label: 'Lobby',          file: null, preview: null },
  { id: 'rooms',      label: 'Rooms',          file: null, preview: null },
  { id: 'bathroom',   label: 'Bathroom',       file: null, preview: null },
  { id: 'pool',       label: 'Pool',           file: null, preview: null },
  { id: 'restaurant', label: 'Restaurant',     file: null, preview: null },
  { id: 'gym',        label: 'Gym',            file: null, preview: null },
  { id: 'other',      label: 'Other',          file: null, preview: null },
];

const defaultState: OnboardingState = {
  currentStep: 1,
  account: { name: '', email: '', phone: '', password: '' },
  property: {
    hotelName: '', description: '', address: '',
    city: '', state: '', country: '', latitude: '', longitude: '',
  },
  verification: DEFAULT_VERIFICATION_DOCS,
  propertyInfo: {
    amenities: [], checkInTime: '14:00', checkOutTime: '11:00',
    cancellationPolicy: '', houseRules: '', languages: [],
  },
  images: DEFAULT_IMAGE_SLOTS,
  rooms: [],
  subscription: null,
  submitted: false,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState);

  const setStep = (step: number) => setState(s => ({ ...s, currentStep: step }));

  const updateAccount = (data: Partial<AccountData>) =>
    setState(s => ({ ...s, account: { ...s.account, ...data } }));

  const updateProperty = (data: Partial<PropertyData>) =>
    setState(s => ({ ...s, property: { ...s.property, ...data } }));

  const updateVerification = (id: string, file: File | null) =>
    setState(s => ({
      ...s,
      verification: s.verification.map(doc =>
        doc.id === id ? { ...doc, file } : doc
      ),
    }));

  const updatePropertyInfo = (data: Partial<PropertyInfoData>) =>
    setState(s => ({ ...s, propertyInfo: { ...s.propertyInfo, ...data } }));

  const updateImageSlot = (id: string, file: File, preview: string) =>
    setState(s => ({
      ...s,
      images: s.images.map(slot =>
        slot.id === id ? { ...slot, file, preview } : slot
      ),
    }));

  const addRoom = () =>
    setState(s => ({
      ...s,
      rooms: [
        ...s.rooms,
        {
          id: crypto.randomUUID(),
          name: '',
          capacity: 1,
          bedType: '',
          bathroomType: '',
          totalRooms: 1,
          pricePerNight: 0,
        },
      ],
    }));

  const updateRoom = (id: string, data: Partial<RoomType>) =>
    setState(s => ({
      ...s,
      rooms: s.rooms.map(room => room.id === id ? { ...room, ...data } : room),
    }));

  const removeRoom = (id: string) =>
    setState(s => ({ ...s, rooms: s.rooms.filter(room => room.id !== id) }));

  const setSubscription = (plan: SubscriptionPlan) =>
    setState(s => ({ ...s, subscription: plan }));

  const submit = () => setState(s => ({ ...s, submitted: true }));

  const value: OnboardingContextValue = {
    ...state,
    setStep,
    updateAccount,
    updateProperty,
    updateVerification,
    updatePropertyInfo,
    updateImageSlot,
    addRoom,
    updateRoom,
    removeRoom,
    setSubscription,
    submit,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
