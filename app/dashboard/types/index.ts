// ── Shared ────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type StaffRole = 'owner' | 'manager' | 'receptionist' | 'staff';

// ── Mock Hotel ─────────────────────────────────────────────────────────────────

export type Hotel = {
  id: string;
  name: string;
  city: string;
  state: string;
  subscription: 'starter' | 'professional' | 'enterprise';
  occupancyPercent: number; // 0–100
};

// ── Reservations ──────────────────────────────────────────────────────────────

export type Reservation = {
  id: string;           // e.g. "HOS-82931"
  guestName: string;
  guestEmail: string;
  roomTypeName: string;
  roomNumber: string;
  checkIn: string;      // ISO date "2024-10-12"
  checkOut: string;     // ISO date "2024-10-15"
  nights: number;
  amountNgn: number;    // e.g. 255000
  status: BookingStatus;
  createdAt: string;    // ISO datetime
};

// ── Room Management ───────────────────────────────────────────────────────────

export type RoomType = {
  id: string;
  name: string;
  totalRooms: number;
  availableRooms: number;
  pricePerNight: number;
  bedType: string;
  capacity: number;
  imageUrl?: string;
};

// ── Inventory Calendar ────────────────────────────────────────────────────────

export type InventoryDay = {
  date: string;      // "2024-10-12"
  available: number;
  held: number;
  booked: number;
};

export type RoomInventory = {
  roomTypeId: string;
  roomTypeName: string;
  days: InventoryDay[]; // 30 days of data
};

// ── Staff ─────────────────────────────────────────────────────────────────────

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: 'active' | 'inactive';
  lastActive: string;     // ISO datetime or "Never"
  avatarInitials: string; // e.g. "OA"
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export type RevenueDay = {
  date: string;           // "2024-10-01"
  revenueNgn: number;
  bookings: number;
  occupancyPercent: number;
};

// ── Payout ────────────────────────────────────────────────────────────────────

export type PayoutTransaction = {
  id: string;
  bookingId: string;
  guestName: string;
  date: string;         // ISO date
  grossNgn: number;
  commissionNgn: number;
  netNgn: number;
  status: 'settled' | 'pending' | 'processing';
};
