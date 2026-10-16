'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { submitApplication } from '@/app/lib/api/applications';
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

export type OnboardingState = {
  currentStep: number;
  account: AccountData;
  property: PropertyData;
  verification: VerificationDocument[];
  propertyInfo: PropertyInfoData;
  images: ImageSlot[];
  rooms: RoomType[];
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
  submitted: false,
  submitting: false,
  submitError: null,
  submitStep: null,
};

// ─── Context ──────────────────────────────────────────────────────────────────

// NOTE: Onboarding state is intentionally ephemeral (React context only).
// A hard refresh will lose all entered data. File objects (verification docs,
// images) cannot be serialized, so sessionStorage cannot fully restore a session.
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

  // Pre-populate account data from the authenticated user so step 1 is no
  // longer needed (registration happens on the signup page before onboarding).
  const { user } = useAuth();
  useEffect(() => {
    if (user) {
      updateAccount({
        name: [user.firstName, user.lastName].filter(Boolean).join(' '),
        email: user.email,
        phone: '', // AuthUser has no phone field
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = async (): Promise<void> => {
    // ── Pre-flight validation ─────────────────────────────────────────────────
    const snap = state;
    const errors: string[] = [];

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

    const missingDocs = snap.verification.filter(d => d.required && !d.file);
    if (missingDocs.length > 0)
      errors.push(`Missing required documents: ${missingDocs.map(d => d.label).join(', ')} (Step 3).`);

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

    if (errors.length > 0) {
      setState(s => ({ ...s, submitError: errors.join('\n') }));
      return;
    }
    // ── End validation ────────────────────────────────────────────────────────

    setState(s => ({ ...s, submitting: true, submitError: null, submitStep: null }));
    try {
      // 1. Upload verification documents to Supabase
      setState(s => ({ ...s, submitStep: 'Uploading documents…' }));
      const uploadedDocuments: Array<{ url: string; documentType: string; label: string }> = [];
      for (const doc of snap.verification) {
        if (!doc.file) continue;
        const url = await uploadDocument(doc.file, 'application', doc.id);
        uploadedDocuments.push({ url, documentType: doc.id, label: doc.label });
      }

      // 2. Upload images to Supabase
      setState(s => ({ ...s, submitStep: 'Uploading images…' }));
      const uploadedImages: Array<{
        url: string;
        caption: string;
        isPrimary: boolean;
        sortOrder: number;
      }> = [];
      let imgIdx = 0;
      for (const slot of snap.images) {
        if (!slot.file) { imgIdx++; continue; }
        const url = await uploadImage(slot.file, 'application', slot.id);
        uploadedImages.push({
          url,
          caption: slot.label,
          isPrimary: slot.id === 'exterior',
          sortOrder: imgIdx,
        });
        imgIdx++;
      }

      // 3. Submit application
      setState(s => ({ ...s, submitStep: 'Submitting application…' }));
      await submitApplication({
        name: snap.property.hotelName,
        description: snap.property.description,
        address: snap.property.address,
        city: snap.property.city,
        state: snap.property.state,
        country: snap.property.country || 'Nigeria',
        latitude: snap.property.latitude ? parseFloat(snap.property.latitude) : undefined,
        longitude: snap.property.longitude ? parseFloat(snap.property.longitude) : undefined,
        phone: undefined,
        email: undefined,
        checkInTime: snap.propertyInfo.checkInTime,
        checkOutTime: snap.propertyInfo.checkOutTime,
        amenityIds: snap.propertyInfo.amenities,
        languages: snap.propertyInfo.languages,
        images: uploadedImages,
        documents: uploadedDocuments,
        rooms: snap.rooms.map(room => ({
          name: room.name,
          bedType: room.bedType,
          capacity: room.capacity,
          pricePerNight: room.pricePerNight,
          totalRooms: room.totalRooms,
          bathroomType: room.bathroomType || undefined,
        })),
      });

      setState(s => ({
        ...s,
        submitted: true,
        submitting: false,
        submitStep: null,
        account: { ...s.account, password: '' },
      }));
    } catch (err: unknown) {
      let message: string;
      if (err instanceof ApiError) {
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
