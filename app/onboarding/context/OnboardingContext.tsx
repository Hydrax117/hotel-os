'use client';

import React, { createContext, useContext, useState } from 'react';
import { register } from '@/app/lib/api/auth';
import {
  createHotel,
  createRoomType,
  saveDocument,
  createSubscription,
} from '@/app/lib/api/onboarding';
import { saveHotelImage } from '@/app/lib/api/images';
import { uploadImage, uploadDocument } from '@/app/lib/supabase';
import { ApiError } from '@/app/lib/api/client';

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
  submitting: boolean;
  submitError: string | null;
  submitStep: string | null;
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
  submit: () => Promise<void>;
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
  submitting: false,
  submitError: null,
  submitStep: null,
};

// ─── Context ──────────────────────────────────────────────────────────────────

// NOTE: Onboarding state is intentionally ephemeral (React context only).
// A hard refresh will lose all entered data. File objects (verification docs,
// images) cannot be serialized, so sessionStorage cannot fully restore a session.
// TODO(persistence): serialize scalar fields to sessionStorage on update and restore
//                    on mount; show a notice if the session is restored mid-flow
//                    asking users to re-upload any files they had selected.
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

  const submit = async (): Promise<void> => {
    // ── Pre-flight validation ─────────────────────────────────────────────────
    // Validate ALL fields before making any network request.
    // Collect every error so the user sees them all at once.
    const snap = state;
    const errors: string[] = [];

    // Step 1 — Account
    if (!snap.account.name.trim())
      errors.push('Full name is required (Step 1).');
    if (!snap.account.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(snap.account.email))
      errors.push('A valid email address is required (Step 1).');
    if (!snap.account.phone.trim())
      errors.push('Phone number is required (Step 1).');
    if (!snap.account.password || snap.account.password.length < 8)
      errors.push('Password must be at least 8 characters (Step 1).');

    // Step 2 — Property
    if (!snap.property.hotelName.trim())
      errors.push('Hotel name is required (Step 2).');
    if (!snap.property.description.trim())
      errors.push('Hotel description is required (Step 2).');
    if (!snap.property.address.trim())
      errors.push('Address is required (Step 2).');
    if (!snap.property.city.trim())
      errors.push('City is required (Step 2).');
    if (!snap.property.state.trim())
      errors.push('State is required (Step 2).');

    // Step 3 — Required verification documents
    const missingDocs = snap.verification.filter(d => d.required && !d.file);
    if (missingDocs.length > 0)
      errors.push(`Missing required documents: ${missingDocs.map(d => d.label).join(', ')} (Step 3).`);

    // Step 6 — Room types (at least one required)
    if (snap.rooms.length === 0)
      errors.push('Add at least one room type (Step 6).');
    snap.rooms.forEach((room, i) => {
      if (!room.name.trim())
        errors.push(`Room ${i + 1}: name is required (Step 6).`);
      if (!room.bedType.trim())
        errors.push(`Room ${i + 1}: bed type is required (Step 6).`);
      if (room.pricePerNight <= 0)
        errors.push(`Room ${i + 1}: price per night must be greater than 0 (Step 6).`);
      if (room.totalRooms <= 0)
        errors.push(`Room ${i + 1}: total rooms must be greater than 0 (Step 6).`);
    });

    // Step 7 — Subscription
    if (!snap.subscription)
      errors.push('Please select a subscription plan (Step 7).');

    if (errors.length > 0) {
      setState(s => ({
        ...s,
        submitError: errors.join('\n'),
      }));
      return;
    }
    // ── End validation ────────────────────────────────────────────────────────

    setState(s => ({ ...s, submitting: true, submitError: null, submitStep: 'Creating account…' }));
    try {
      // 1. Register account — storeTokens/storeUser are called inside register()
      const nameParts = snap.account.name.trim().split(/\s+/);
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ') || firstName;
      await register({
        email: snap.account.email,
        password: snap.account.password,
        firstName,
        lastName,
        phone: snap.account.phone || undefined,
        role: 'HOTEL_OWNER',
      });

      // 2. Create hotel
      setState(s => ({ ...s, submitStep: 'Creating hotel…' }));
      const hotel = await createHotel({
        name: snap.property.hotelName,
        description: snap.property.description,
        address: snap.property.address,
        city: snap.property.city,
        state: snap.property.state,
        country: snap.property.country,
        latitude: snap.property.latitude ? parseFloat(snap.property.latitude) : undefined,
        longitude: snap.property.longitude ? parseFloat(snap.property.longitude) : undefined,
        amenities: snap.propertyInfo.amenities,
        checkInTime: snap.propertyInfo.checkInTime,
        checkOutTime: snap.propertyInfo.checkOutTime,
        cancellationPolicy: snap.propertyInfo.cancellationPolicy || undefined,
        houseRules: snap.propertyInfo.houseRules || undefined,
        languages: snap.propertyInfo.languages,
      });
      const hotelId = hotel.id;

      // 3. Upload & save verification documents
      setState(s => ({ ...s, submitStep: 'Uploading documents…' }));
      for (const doc of snap.verification) {
        if (!doc.file) continue;
        const url = await uploadDocument(doc.file, hotelId, doc.id);
        await saveDocument(hotelId, { url, documentType: doc.id, label: doc.label });
      }

      // 4. Upload & save hotel images (parallel for speed)
      setState(s => ({ ...s, submitStep: 'Uploading images…' }));
      await Promise.all(
        snap.images
          .filter(slot => slot.file !== null)
          .map(slot =>
            uploadImage(slot.file!, hotelId, slot.id).then(url =>
              saveHotelImage(hotelId, {
                url,
                caption: slot.label,
                isPrimary: slot.id === 'exterior',
                sortOrder: 0,
              })
            )
          )
      );

      // 5. Create room types
      setState(s => ({ ...s, submitStep: 'Saving room types…' }));
      for (const room of snap.rooms) {
        await createRoomType(hotelId, {
          name: room.name,
          capacity: room.capacity,
          bedType: room.bedType,
          bathroomType: room.bathroomType,
          totalRooms: room.totalRooms,
          pricePerNight: room.pricePerNight,
        });
      }

      // 6. Create subscription — guard ensures we never silently complete
      //    without a subscription record; the UI should prevent this path,
      //    but submit() enforces the invariant as a fail-loud precondition.
      setState(s => ({ ...s, submitStep: 'Activating subscription…' }));
      if (!snap.subscription) {
        throw new Error('No subscription plan selected. Please go back and choose a plan before submitting.');
      }
      await createSubscription(hotelId, { plan: snap.subscription });

      // Done — clear password from state
      setState(s => ({
        ...s,
        submitted: true,
        submitting: false,
        submitStep: null,
        account: { ...s.account, password: '' },
      }));
    } catch (err: unknown) {
      let message: string;
      if (err instanceof ApiError && err.status === 409) {
        message = 'An account with this email already exists. Please sign in instead.';
      } else if (err instanceof ApiError) {
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = 'Submission failed. Please try again.';
      }
      setState(s => ({ ...s, submitting: false, submitStep: null, submitError: message }));
    }
  };

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
