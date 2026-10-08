import type {
  Hotel,
  Reservation,
  RoomType,
  RoomInventory,
  StaffMember,
  RevenueDay,
  PayoutTransaction,
} from '../types';

// ── Hotel ──────────────────────────────────────────────────────────────────────

export const MOCK_HOTEL: Hotel = {
  id: 'hotel-001',
  name: 'Eko Signature Hotel',
  city: 'Lagos',
  state: 'Lagos',
  subscription: 'professional',
  occupancyPercent: 72,
};

// ── Room Types ─────────────────────────────────────────────────────────────────

export const MOCK_ROOM_TYPES: RoomType[] = [
  {
    id: 'rt-001',
    name: 'Deluxe King',
    totalRooms: 20,
    availableRooms: 8,
    pricePerNight: 75000,
    bedType: 'King',
    capacity: 2,
  },
  {
    id: 'rt-002',
    name: 'Executive Suite',
    totalRooms: 8,
    availableRooms: 3,
    pricePerNight: 145000,
    bedType: 'King',
    capacity: 2,
  },
  {
    id: 'rt-003',
    name: 'Standard Double',
    totalRooms: 30,
    availableRooms: 14,
    pricePerNight: 45000,
    bedType: 'Double',
    capacity: 2,
  },
  {
    id: 'rt-004',
    name: 'Family Room',
    totalRooms: 10,
    availableRooms: 4,
    pricePerNight: 95000,
    bedType: 'Two Queens',
    capacity: 4,
  },
];

// ── Reservations ───────────────────────────────────────────────────────────────

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'HOS-10021',
    guestName: 'Adaeze Okonkwo',
    guestEmail: 'adaeze.okonkwo@gmail.com',
    roomTypeName: 'Deluxe King',
    roomNumber: '204',
    checkIn: '2024-10-14',
    checkOut: '2024-10-17',
    nights: 3,
    amountNgn: 225000,
    status: 'checked_in',
    createdAt: '2024-10-10T09:15:00Z',
  },
  {
    id: 'HOS-10022',
    guestName: 'Emeka Nwosu',
    guestEmail: 'emeka.nwosu@yahoo.com',
    roomTypeName: 'Executive Suite',
    roomNumber: '502',
    checkIn: '2024-10-15',
    checkOut: '2024-10-18',
    nights: 3,
    amountNgn: 435000,
    status: 'confirmed',
    createdAt: '2024-10-11T14:30:00Z',
  },
  {
    id: 'HOS-10023',
    guestName: 'Funmilayo Bello',
    guestEmail: 'funmi.bello@hotmail.com',
    roomTypeName: 'Standard Double',
    roomNumber: '112',
    checkIn: '2024-10-12',
    checkOut: '2024-10-13',
    nights: 1,
    amountNgn: 45000,
    status: 'checked_out',
    createdAt: '2024-10-09T17:00:00Z',
  },
  {
    id: 'HOS-10024',
    guestName: 'Chukwuemeka Eze',
    guestEmail: 'ceze@gmail.com',
    roomTypeName: 'Family Room',
    roomNumber: '310',
    checkIn: '2024-10-16',
    checkOut: '2024-10-20',
    nights: 4,
    amountNgn: 380000,
    status: 'pending',
    createdAt: '2024-10-13T08:45:00Z',
  },
  {
    id: 'HOS-10025',
    guestName: 'Ngozi Adekunle',
    guestEmail: 'ngozi.adekunle@gmail.com',
    roomTypeName: 'Deluxe King',
    roomNumber: '207',
    checkIn: '2024-10-08',
    checkOut: '2024-10-10',
    nights: 2,
    amountNgn: 150000,
    status: 'checked_out',
    createdAt: '2024-10-05T11:20:00Z',
  },
  {
    id: 'HOS-10026',
    guestName: 'Babatunde Oyelaran',
    guestEmail: 'babs.oyelaran@outlook.com',
    roomTypeName: 'Standard Double',
    roomNumber: '105',
    checkIn: '2024-10-17',
    checkOut: '2024-10-19',
    nights: 2,
    amountNgn: 90000,
    status: 'confirmed',
    createdAt: '2024-10-14T16:10:00Z',
  },
  {
    id: 'HOS-10027',
    guestName: 'Ifeoma Chukwu',
    guestEmail: 'ifeoma.c@gmail.com',
    roomTypeName: 'Executive Suite',
    roomNumber: '505',
    checkIn: '2024-10-10',
    checkOut: '2024-10-12',
    nights: 2,
    amountNgn: 290000,
    status: 'cancelled',
    createdAt: '2024-10-07T09:00:00Z',
  },
  {
    id: 'HOS-10028',
    guestName: 'Seun Adesanya',
    guestEmail: 'seun.adesanya@gmail.com',
    roomTypeName: 'Standard Double',
    roomNumber: '108',
    checkIn: '2024-10-09',
    checkOut: '2024-10-10',
    nights: 1,
    amountNgn: 45000,
    status: 'no_show',
    createdAt: '2024-10-06T13:00:00Z',
  },
  {
    id: 'HOS-10029',
    guestName: 'Amaka Obi',
    guestEmail: 'amaka.obi@gmail.com',
    roomTypeName: 'Family Room',
    roomNumber: '315',
    checkIn: '2024-10-18',
    checkOut: '2024-10-22',
    nights: 4,
    amountNgn: 380000,
    status: 'pending',
    createdAt: '2024-10-15T10:05:00Z',
  },
  {
    id: 'HOS-10030',
    guestName: 'Olusegun Falola',
    guestEmail: 'ofalola@business.ng',
    roomTypeName: 'Deluxe King',
    roomNumber: '210',
    checkIn: '2024-10-14',
    checkOut: '2024-10-16',
    nights: 2,
    amountNgn: 150000,
    status: 'checked_in',
    createdAt: '2024-10-12T07:30:00Z',
  },
  {
    id: 'HOS-10031',
    guestName: 'Chidinma Okeke',
    guestEmail: 'chidinma.okeke@gmail.com',
    roomTypeName: 'Executive Suite',
    roomNumber: '501',
    checkIn: '2024-10-20',
    checkOut: '2024-10-23',
    nights: 3,
    amountNgn: 435000,
    status: 'confirmed',
    createdAt: '2024-10-16T15:45:00Z',
  },
  {
    id: 'HOS-10032',
    guestName: 'Tunde Adeyemi',
    guestEmail: 'tunde.adeyemi@yahoo.com',
    roomTypeName: 'Standard Double',
    roomNumber: '120',
    checkIn: '2024-10-11',
    checkOut: '2024-10-13',
    nights: 2,
    amountNgn: 90000,
    status: 'checked_out',
    createdAt: '2024-10-08T12:20:00Z',
  },
];

// ── Inventory (30 days × 4 room types) ────────────────────────────────────────

function generateInventoryDays(
  totalRooms: number,
  startDate: string,
): { date: string; available: number; held: number; booked: number }[] {
  const days: { date: string; available: number; held: number; booked: number }[] = [];
  const base = new Date(startDate);
  for (let i = 0; i < 30; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const booked = Math.floor(Math.random() * (totalRooms * 0.8));
    const held = Math.floor(Math.random() * Math.min(3, totalRooms - booked));
    const available = totalRooms - booked - held;
    days.push({ date: dateStr, available, held, booked });
  }
  return days;
}

export const MOCK_INVENTORY: RoomInventory[] = MOCK_ROOM_TYPES.map(rt => ({
  roomTypeId: rt.id,
  roomTypeName: rt.name,
  days: generateInventoryDays(rt.totalRooms, '2024-10-01'),
}));

// ── Staff ──────────────────────────────────────────────────────────────────────

export const MOCK_STAFF: StaffMember[] = [
  {
    id: 'staff-001',
    name: 'Olumide Adewale',
    email: 'o.adewale@ekosignature.ng',
    role: 'owner',
    status: 'active',
    lastActive: '2024-10-15T08:00:00Z',
    avatarInitials: 'OA',
  },
  {
    id: 'staff-002',
    name: 'Blessing Nnamdi',
    email: 'b.nnamdi@ekosignature.ng',
    role: 'manager',
    status: 'active',
    lastActive: '2024-10-15T09:30:00Z',
    avatarInitials: 'BN',
  },
  {
    id: 'staff-003',
    name: 'Kelechi Okafor',
    email: 'k.okafor@ekosignature.ng',
    role: 'receptionist',
    status: 'active',
    lastActive: '2024-10-15T10:15:00Z',
    avatarInitials: 'KO',
  },
  {
    id: 'staff-004',
    name: 'Yetunde Fashola',
    email: 'y.fashola@ekosignature.ng',
    role: 'receptionist',
    status: 'active',
    lastActive: '2024-10-14T22:45:00Z',
    avatarInitials: 'YF',
  },
  {
    id: 'staff-005',
    name: 'Chidi Okonkwo',
    email: 'c.okonkwo@ekosignature.ng',
    role: 'staff',
    status: 'active',
    lastActive: '2024-10-15T07:00:00Z',
    avatarInitials: 'CO',
  },
  {
    id: 'staff-006',
    name: 'Amara Dike',
    email: 'a.dike@ekosignature.ng',
    role: 'staff',
    status: 'inactive',
    lastActive: '2024-09-30T14:00:00Z',
    avatarInitials: 'AD',
  },
];

// ── Revenue (30 days) ──────────────────────────────────────────────────────────

export const MOCK_REVENUE_DAYS: RevenueDay[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date('2024-10-01');
  d.setDate(d.getDate() + i);
  const dateStr = d.toISOString().split('T')[0];
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const baseRevenue = isWeekend ? 1_200_000 : 780_000;
  const variance = Math.floor((Math.random() - 0.5) * 200_000);
  const bookings = isWeekend ? Math.floor(Math.random() * 8) + 12 : Math.floor(Math.random() * 6) + 6;
  const occupancy = Math.floor(Math.random() * 25) + (isWeekend ? 65 : 50);
  return {
    date: dateStr,
    revenueNgn: Math.max(0, baseRevenue + variance),
    bookings,
    occupancyPercent: Math.min(100, occupancy),
  };
});

// ── Payouts (10 entries) ───────────────────────────────────────────────────────

export const MOCK_PAYOUTS: PayoutTransaction[] = [
  {
    id: 'PAY-001',
    bookingId: 'HOS-10023',
    guestName: 'Funmilayo Bello',
    date: '2024-10-13',
    grossNgn: 45000,
    commissionNgn: 2250,
    netNgn: 42750,
    status: 'settled',
  },
  {
    id: 'PAY-002',
    bookingId: 'HOS-10025',
    guestName: 'Ngozi Adekunle',
    date: '2024-10-10',
    grossNgn: 150000,
    commissionNgn: 7500,
    netNgn: 142500,
    status: 'settled',
  },
  {
    id: 'PAY-003',
    bookingId: 'HOS-10032',
    guestName: 'Tunde Adeyemi',
    date: '2024-10-13',
    grossNgn: 90000,
    commissionNgn: 4500,
    netNgn: 85500,
    status: 'settled',
  },
  {
    id: 'PAY-004',
    bookingId: 'HOS-10021',
    guestName: 'Adaeze Okonkwo',
    date: '2024-10-17',
    grossNgn: 225000,
    commissionNgn: 11250,
    netNgn: 213750,
    status: 'processing',
  },
  {
    id: 'PAY-005',
    bookingId: 'HOS-10030',
    guestName: 'Olusegun Falola',
    date: '2024-10-16',
    grossNgn: 150000,
    commissionNgn: 7500,
    netNgn: 142500,
    status: 'processing',
  },
  {
    id: 'PAY-006',
    bookingId: 'HOS-10022',
    guestName: 'Emeka Nwosu',
    date: '2024-10-18',
    grossNgn: 435000,
    commissionNgn: 21750,
    netNgn: 413250,
    status: 'pending',
  },
  {
    id: 'PAY-007',
    bookingId: 'HOS-10026',
    guestName: 'Babatunde Oyelaran',
    date: '2024-10-19',
    grossNgn: 90000,
    commissionNgn: 4500,
    netNgn: 85500,
    status: 'pending',
  },
  {
    id: 'PAY-008',
    bookingId: 'HOS-10029',
    guestName: 'Amaka Obi',
    date: '2024-10-22',
    grossNgn: 380000,
    commissionNgn: 19000,
    netNgn: 361000,
    status: 'pending',
  },
  {
    id: 'PAY-009',
    bookingId: 'HOS-10031',
    guestName: 'Chidinma Okeke',
    date: '2024-10-23',
    grossNgn: 435000,
    commissionNgn: 21750,
    netNgn: 413250,
    status: 'pending',
  },
  {
    id: 'PAY-010',
    bookingId: 'HOS-10024',
    guestName: 'Chukwuemeka Eze',
    date: '2024-10-20',
    grossNgn: 380000,
    commissionNgn: 19000,
    netNgn: 361000,
    status: 'pending',
  },
];
