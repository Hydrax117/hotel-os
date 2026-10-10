export type HotelVerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';

export type AdminHotel = {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  city: string;
  state: string;
  submittedAt: string;
  verificationStatus: HotelVerificationStatus;
  subscription: SubscriptionPlan;
  totalBookings: number;
  totalRevenueNgn: number;
  isActive: boolean;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'traveler' | 'hotel_owner' | 'admin';
  joinedAt: string;
  totalBookings: number;
  totalSpentNgn: number;
  isActive: boolean;
};

export type AdminBooking = {
  id: string;
  hotelName: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomName: string;
  totalNgn: number;
  commissionNgn: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  createdAt: string;
};

export type PlatformStats = {
  totalHotels: number;
  activeHotels: number;
  pendingApprovals: number;
  suspendedHotels: number;
  totalBookings: number;
  gmvNgn: number;
  platformRevenueNgn: number;
  totalTravelers: number;
  activeCities: number;
};

export const ADMIN_HOTELS: AdminHotel[] = [
  { id: 'ah-001', name: 'Eko Signature Hotel', ownerName: 'Chukwuemeka Obi', ownerEmail: 'c.obi@ekosig.ng', city: 'Lagos', state: 'Lagos', submittedAt: '2024-10-01', verificationStatus: 'approved', subscription: 'enterprise', totalBookings: 312, totalRevenueNgn: 28500000, isActive: true },
  { id: 'ah-002', name: 'Abuja Continental', ownerName: 'Fatima Al-Hassan', ownerEmail: 'f.alhassan@abujacont.ng', city: 'Abuja', state: 'FCT', submittedAt: '2024-10-15', verificationStatus: 'approved', subscription: 'professional', totalBookings: 184, totalRevenueNgn: 15200000, isActive: true },
  { id: 'ah-003', name: 'Transcorp Hilton Annex', ownerName: 'Ngozi Adeyemi', ownerEmail: 'n.adeyemi@transcorpannex.ng', city: 'Abuja', state: 'FCT', submittedAt: '2024-09-20', verificationStatus: 'approved', subscription: 'enterprise', totalBookings: 421, totalRevenueNgn: 52000000, isActive: true },
  { id: 'ah-004', name: 'Port Harcourt Grandeur', ownerName: 'Emeka Nwosu', ownerEmail: 'e.nwosu@phgrandeur.ng', city: 'Port Harcourt', state: 'Rivers', submittedAt: '2024-11-01', verificationStatus: 'approved', subscription: 'professional', totalBookings: 97, totalRevenueNgn: 8100000, isActive: true },
  { id: 'ah-005', name: 'Ibadan Crown Suites', ownerName: 'Adebayo Fashola', ownerEmail: 'a.fashola@ibadancrown.ng', city: 'Ibadan', state: 'Oyo', submittedAt: '2024-11-10', verificationStatus: 'approved', subscription: 'starter', totalBookings: 45, totalRevenueNgn: 2800000, isActive: true },
  { id: 'ah-006', name: 'Kano Royal Suites', ownerName: 'Musa Garba', ownerEmail: 'm.garba@kanoroyalsuites.ng', city: 'Kano', state: 'Kano', submittedAt: '2024-12-01', verificationStatus: 'approved', subscription: 'starter', totalBookings: 38, totalRevenueNgn: 1950000, isActive: true },
  { id: 'ah-007', name: 'Calabar Heritage Inn', ownerName: 'Ita Effiong', ownerEmail: 'i.effiong@calabarheritage.ng', city: 'Calabar', state: 'Cross River', submittedAt: '2024-12-10', verificationStatus: 'approved', subscription: 'professional', totalBookings: 72, totalRevenueNgn: 5600000, isActive: true },
  { id: 'ah-008', name: 'Enugu Mountain View', ownerName: 'Chidinma Eze', ownerEmail: 'c.eze@enugumtn.ng', city: 'Enugu', state: 'Enugu', submittedAt: '2024-12-15', verificationStatus: 'approved', subscription: 'starter', totalBookings: 29, totalRevenueNgn: 1400000, isActive: true },
  { id: 'ah-009', name: 'Lekki Boutique Hotel', ownerName: 'Toyin Ajayi', ownerEmail: 't.ajayi@lekkiboutique.ng', city: 'Lagos', state: 'Lagos', submittedAt: '2025-01-05', verificationStatus: 'approved', subscription: 'professional', totalBookings: 134, totalRevenueNgn: 11200000, isActive: true },
  { id: 'ah-010', name: 'Surulere Park Hotel', ownerName: 'Kunle Oduya', ownerEmail: 'k.oduya@surulerpark.ng', city: 'Lagos', state: 'Lagos', submittedAt: '2025-01-12', verificationStatus: 'approved', subscription: 'professional', totalBookings: 88, totalRevenueNgn: 6300000, isActive: true },
  { id: 'ah-011', name: 'Asaba Riverside Inn', ownerName: 'Emeka Okafor', ownerEmail: 'e.okafor@asabariverside.ng', city: 'Asaba', state: 'Delta', submittedAt: '2025-01-18', verificationStatus: 'approved', subscription: 'starter', totalBookings: 22, totalRevenueNgn: 980000, isActive: true },
  { id: 'ah-012', name: 'Warri Prestige Hotel', ownerName: 'Ovie Okoro', ownerEmail: 'o.okoro@warriprestige.ng', city: 'Warri', state: 'Delta', submittedAt: '2025-01-20', verificationStatus: 'approved', subscription: 'starter', totalBookings: 17, totalRevenueNgn: 760000, isActive: true },
  { id: 'ah-013', name: 'Kaduna Central Suites', ownerName: 'Ibrahim Suleiman', ownerEmail: 'i.suleiman@kadunacentral.ng', city: 'Kaduna', state: 'Kaduna', submittedAt: '2025-02-01', verificationStatus: 'pending', subscription: 'starter', totalBookings: 0, totalRevenueNgn: 0, isActive: false },
  { id: 'ah-014', name: 'Benin Palace Hotel', ownerName: 'Osagie Omoruyi', ownerEmail: 'o.omoruyi@beninpalace.ng', city: 'Benin City', state: 'Edo', submittedAt: '2025-02-03', verificationStatus: 'pending', subscription: 'professional', totalBookings: 0, totalRevenueNgn: 0, isActive: false },
  { id: 'ah-015', name: 'Owerri Comfort Inn', ownerName: 'Chinyere Mbah', ownerEmail: 'c.mbah@owerricomfort.ng', city: 'Owerri', state: 'Imo', submittedAt: '2025-02-05', verificationStatus: 'pending', subscription: 'starter', totalBookings: 0, totalRevenueNgn: 0, isActive: false },
  { id: 'ah-016', name: 'Makurdi Gateway Hotel', ownerName: 'Tersoo Agber', ownerEmail: 't.agber@makurdigateway.ng', city: 'Makurdi', state: 'Benue', submittedAt: '2025-01-28', verificationStatus: 'pending', subscription: 'starter', totalBookings: 0, totalRevenueNgn: 0, isActive: false },
  { id: 'ah-017', name: 'Jos Plateau View', ownerName: 'Pam Dung', ownerEmail: 'p.dung@josplateau.ng', city: 'Jos', state: 'Plateau', submittedAt: '2025-01-25', verificationStatus: 'pending', subscription: 'professional', totalBookings: 0, totalRevenueNgn: 0, isActive: false },
  { id: 'ah-018', name: 'Sokoto Oasis Hotel', ownerName: 'Aliyu Waziri', ownerEmail: 'a.waziri@sokotooasis.ng', city: 'Sokoto', state: 'Sokoto', submittedAt: '2024-11-20', verificationStatus: 'suspended', subscription: 'starter', totalBookings: 14, totalRevenueNgn: 520000, isActive: false },
  { id: 'ah-019', name: 'Uyo Streamside Hotel', ownerName: 'Aniefiok Udoh', ownerEmail: 'a.udoh@uyostreamside.ng', city: 'Uyo', state: 'Akwa Ibom', submittedAt: '2024-12-05', verificationStatus: 'suspended', subscription: 'professional', totalBookings: 31, totalRevenueNgn: 2100000, isActive: false },
  { id: 'ah-020', name: 'Ilorin Highlands Hotel', ownerName: 'Rasheed Afolabi', ownerEmail: 'r.afolabi@ilorinhighlands.ng', city: 'Ilorin', state: 'Kwara', submittedAt: '2024-08-15', verificationStatus: 'rejected', subscription: 'starter', totalBookings: 0, totalRevenueNgn: 0, isActive: false },
];

export const ADMIN_USERS: AdminUser[] = [
  { id: 'au-001', name: 'Adaeze Nwosu', email: 'adaeze.nwosu@gmail.com', role: 'traveler', joinedAt: '2024-09-01', totalBookings: 8, totalSpentNgn: 620000, isActive: true },
  { id: 'au-002', name: 'Bello Usman', email: 'bello.usman@yahoo.com', role: 'traveler', joinedAt: '2024-09-15', totalBookings: 3, totalSpentNgn: 180000, isActive: true },
  { id: 'au-003', name: 'Chukwuemeka Obi', email: 'c.obi@ekosig.ng', role: 'hotel_owner', joinedAt: '2024-10-01', totalBookings: 0, totalSpentNgn: 0, isActive: true },
  { id: 'au-004', name: 'Damilola Ojo', email: 'damilola.ojo@hotmail.com', role: 'traveler', joinedAt: '2024-10-10', totalBookings: 12, totalSpentNgn: 1450000, isActive: true },
  { id: 'au-005', name: 'Efua Mensah', email: 'efua.mensah@gmail.com', role: 'traveler', joinedAt: '2024-10-20', totalBookings: 5, totalSpentNgn: 390000, isActive: true },
  { id: 'au-006', name: 'Fatima Al-Hassan', email: 'f.alhassan@abujacont.ng', role: 'hotel_owner', joinedAt: '2024-10-15', totalBookings: 0, totalSpentNgn: 0, isActive: true },
  { id: 'au-007', name: 'Gbemi Adekoya', email: 'gbemi.adekoya@gmail.com', role: 'traveler', joinedAt: '2024-11-01', totalBookings: 2, totalSpentNgn: 145000, isActive: true },
  { id: 'au-008', name: 'Hassan Ibrahim', email: 'hassan.ibrahim@gmail.com', role: 'traveler', joinedAt: '2024-11-15', totalBookings: 1, totalSpentNgn: 75000, isActive: false },
  { id: 'au-009', name: 'Ifeoma Chukwu', email: 'ifeoma.chukwu@gmail.com', role: 'traveler', joinedAt: '2024-12-01', totalBookings: 6, totalSpentNgn: 480000, isActive: true },
  { id: 'au-010', name: 'Jide Olatunde', email: 'jide.olatunde@yahoo.com', role: 'traveler', joinedAt: '2024-12-10', totalBookings: 4, totalSpentNgn: 310000, isActive: true },
  { id: 'au-011', name: 'Ngozi Adeyemi', email: 'n.adeyemi@transcorpannex.ng', role: 'hotel_owner', joinedAt: '2024-09-20', totalBookings: 0, totalSpentNgn: 0, isActive: true },
  { id: 'au-012', name: 'Kunle Oduya', email: 'k.oduya@surulerpark.ng', role: 'hotel_owner', joinedAt: '2025-01-12', totalBookings: 0, totalSpentNgn: 0, isActive: true },
  { id: 'au-013', name: 'Lola Bankole', email: 'lola.bankole@gmail.com', role: 'traveler', joinedAt: '2025-01-05', totalBookings: 3, totalSpentNgn: 225000, isActive: true },
  { id: 'au-014', name: 'Mide Adeola', email: 'mide.adeola@hotmail.com', role: 'traveler', joinedAt: '2025-01-20', totalBookings: 1, totalSpentNgn: 95000, isActive: false },
  { id: 'au-015', name: 'Nkechi Okonkwo', email: 'nkechi.okonkwo@gmail.com', role: 'admin', joinedAt: '2024-08-01', totalBookings: 0, totalSpentNgn: 0, isActive: true },
];

export const ADMIN_BOOKINGS: AdminBooking[] = [
  { id: 'HOS-10001', hotelName: 'Eko Signature Hotel', guestName: 'Adaeze Nwosu', guestEmail: 'adaeze.nwosu@gmail.com', checkIn: '2025-02-01', checkOut: '2025-02-04', nights: 3, roomName: 'Deluxe King', totalNgn: 225000, commissionNgn: 22500, status: 'checked_out', createdAt: '2025-01-20' },
  { id: 'HOS-10002', hotelName: 'Abuja Continental', guestName: 'Damilola Ojo', guestEmail: 'damilola.ojo@hotmail.com', checkIn: '2025-02-03', checkOut: '2025-02-07', nights: 4, roomName: 'Executive Suite', totalNgn: 580000, commissionNgn: 58000, status: 'checked_out', createdAt: '2025-01-25' },
  { id: 'HOS-10003', hotelName: 'Transcorp Hilton Annex', guestName: 'Bello Usman', guestEmail: 'bello.usman@yahoo.com', checkIn: '2025-02-05', checkOut: '2025-02-06', nights: 1, roomName: 'Standard Double', totalNgn: 85000, commissionNgn: 8500, status: 'checked_out', createdAt: '2025-01-28' },
  { id: 'HOS-10004', hotelName: 'Lekki Boutique Hotel', guestName: 'Efua Mensah', guestEmail: 'efua.mensah@gmail.com', checkIn: '2025-02-08', checkOut: '2025-02-10', nights: 2, roomName: 'Deluxe King', totalNgn: 160000, commissionNgn: 16000, status: 'confirmed', createdAt: '2025-02-01' },
  { id: 'HOS-10005', hotelName: 'Port Harcourt Grandeur', guestName: 'Jide Olatunde', guestEmail: 'jide.olatunde@yahoo.com', checkIn: '2025-02-10', checkOut: '2025-02-12', nights: 2, roomName: 'Standard Suite', totalNgn: 190000, commissionNgn: 19000, status: 'confirmed', createdAt: '2025-02-02' },
  { id: 'HOS-10006', hotelName: 'Eko Signature Hotel', guestName: 'Ifeoma Chukwu', guestEmail: 'ifeoma.chukwu@gmail.com', checkIn: '2025-02-12', checkOut: '2025-02-15', nights: 3, roomName: 'Executive Suite', totalNgn: 435000, commissionNgn: 43500, status: 'confirmed', createdAt: '2025-02-04' },
  { id: 'HOS-10007', hotelName: 'Surulere Park Hotel', guestName: 'Gbemi Adekoya', guestEmail: 'gbemi.adekoya@gmail.com', checkIn: '2025-02-14', checkOut: '2025-02-15', nights: 1, roomName: 'Deluxe Room', totalNgn: 75000, commissionNgn: 7500, status: 'checked_in', createdAt: '2025-02-05' },
  { id: 'HOS-10008', hotelName: 'Calabar Heritage Inn', guestName: 'Lola Bankole', guestEmail: 'lola.bankole@gmail.com', checkIn: '2025-02-15', checkOut: '2025-02-18', nights: 3, roomName: 'Heritage Suite', totalNgn: 270000, commissionNgn: 27000, status: 'confirmed', createdAt: '2025-02-06' },
  { id: 'HOS-10009', hotelName: 'Transcorp Hilton Annex', guestName: 'Damilola Ojo', guestEmail: 'damilola.ojo@hotmail.com', checkIn: '2025-02-18', checkOut: '2025-02-22', nights: 4, roomName: 'Presidential Suite', totalNgn: 960000, commissionNgn: 96000, status: 'confirmed', createdAt: '2025-02-07' },
  { id: 'HOS-10010', hotelName: 'Ibadan Crown Suites', guestName: 'Hassan Ibrahim', guestEmail: 'hassan.ibrahim@gmail.com', checkIn: '2025-02-20', checkOut: '2025-02-21', nights: 1, roomName: 'Crown Room', totalNgn: 65000, commissionNgn: 6500, status: 'cancelled', createdAt: '2025-02-08' },
  { id: 'HOS-10011', hotelName: 'Abuja Continental', guestName: 'Adaeze Nwosu', guestEmail: 'adaeze.nwosu@gmail.com', checkIn: '2025-02-22', checkOut: '2025-02-25', nights: 3, roomName: 'Business Suite', totalNgn: 345000, commissionNgn: 34500, status: 'confirmed', createdAt: '2025-02-09' },
  { id: 'HOS-10012', hotelName: 'Enugu Mountain View', guestName: 'Mide Adeola', guestEmail: 'mide.adeola@hotmail.com', checkIn: '2025-02-24', checkOut: '2025-02-25', nights: 1, roomName: 'Mountain Room', totalNgn: 55000, commissionNgn: 5500, status: 'confirmed', createdAt: '2025-02-10' },
  { id: 'HOS-10013', hotelName: 'Kano Royal Suites', guestName: 'Bello Usman', guestEmail: 'bello.usman@yahoo.com', checkIn: '2025-02-25', checkOut: '2025-02-27', nights: 2, roomName: 'Royal Room', totalNgn: 110000, commissionNgn: 11000, status: 'confirmed', createdAt: '2025-02-11' },
  { id: 'HOS-10014', hotelName: 'Lekki Boutique Hotel', guestName: 'Ifeoma Chukwu', guestEmail: 'ifeoma.chukwu@gmail.com', checkIn: '2025-03-01', checkOut: '2025-03-03', nights: 2, roomName: 'Boutique Deluxe', totalNgn: 185000, commissionNgn: 18500, status: 'confirmed', createdAt: '2025-02-12' },
  { id: 'HOS-10015', hotelName: 'Port Harcourt Grandeur', guestName: 'Jide Olatunde', guestEmail: 'jide.olatunde@yahoo.com', checkIn: '2025-03-05', checkOut: '2025-03-08', nights: 3, roomName: 'Grandeur Suite', totalNgn: 390000, commissionNgn: 39000, status: 'confirmed', createdAt: '2025-02-13' },
];

// Derive PLATFORM_STATS from the arrays above
const approvedBookingStatuses = ['confirmed', 'checked_in', 'checked_out'] as const;
const gmv = ADMIN_BOOKINGS
  .filter(b => (approvedBookingStatuses as readonly string[]).includes(b.status))
  .reduce((sum, b) => sum + b.totalNgn, 0);

export const PLATFORM_STATS: PlatformStats = {
  totalHotels: ADMIN_HOTELS.length,
  activeHotels: ADMIN_HOTELS.filter(h => h.isActive).length,
  pendingApprovals: ADMIN_HOTELS.filter(h => h.verificationStatus === 'pending').length,
  suspendedHotels: ADMIN_HOTELS.filter(h => h.verificationStatus === 'suspended').length,
  totalBookings: ADMIN_BOOKINGS.length,
  gmvNgn: gmv,
  platformRevenueNgn: Math.round(gmv * 0.1),
  totalTravelers: ADMIN_USERS.filter(u => u.role === 'traveler').length,
  activeCities: new Set(ADMIN_HOTELS.filter(h => h.isActive).map(h => h.city)).size,
};
