export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export type TravelerBooking = {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelCity: string;
  hotelState: string;
  roomName: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalNgn: number;
  status: BookingStatus;
  createdAt: string;
  specialRequests?: string;
};

export const MOCK_TRAVELER_BOOKINGS: TravelerBooking[] = [
  // 3 upcoming (Oct 2026+)
  {
    id: 'HOS-82931',
    hotelId: 'transcorp-hilton-abuja',
    hotelName: 'Transcorp Hilton Abuja',
    hotelCity: 'Abuja',
    hotelState: 'FCT',
    roomName: 'Deluxe King Room',
    roomId: 'transcorp-deluxe',
    checkIn: '2026-10-15',
    checkOut: '2026-10-18',
    nights: 3,
    guests: 2,
    totalNgn: 510255,
    status: 'upcoming',
    createdAt: '2026-09-01',
    specialRequests: 'Early check-in if possible, non-smoking room',
  },
  {
    id: 'HOS-74512',
    hotelId: 'ibom-icon-hotel',
    hotelName: 'Ibom Icon Hotel & Golf Resort',
    hotelCity: 'Uyo',
    hotelState: 'Akwa Ibom',
    roomName: 'Golf View Room',
    roomId: 'ibom-golf-view',
    checkIn: '2026-12-24',
    checkOut: '2026-12-27',
    nights: 3,
    guests: 2,
    totalNgn: 432300,
    status: 'upcoming',
    createdAt: '2026-10-05',
    specialRequests: 'Honeymoon package, rose petals requested',
  },
  {
    id: 'HOS-91087',
    hotelId: 'eko-hotel-vi',
    hotelName: 'Eko Hotels & Suites',
    hotelCity: 'Lagos',
    hotelState: 'Lagos',
    roomName: 'Junior Suite',
    roomId: 'eko-junior-suite',
    checkIn: '2026-11-05',
    checkOut: '2026-11-07',
    nights: 2,
    guests: 3,
    totalNgn: 432600,
    status: 'upcoming',
    createdAt: '2026-10-01',
  },
  // 3 completed (2025)
  {
    id: 'HOS-61203',
    hotelId: 'meridian-ph',
    hotelName: 'Le Meridien Ogeyi Place',
    hotelCity: 'Port Harcourt',
    hotelState: 'Rivers',
    roomName: 'Deluxe King Room',
    roomId: 'meridian-deluxe-king',
    checkIn: '2025-03-10',
    checkOut: '2025-03-14',
    nights: 4,
    guests: 2,
    totalNgn: 680040,
    status: 'completed',
    createdAt: '2025-02-20',
  },
  {
    id: 'HOS-55841',
    hotelId: 'nicon-luxury-asokoro',
    hotelName: 'NICON Luxury Hotel',
    hotelCity: 'Abuja',
    hotelState: 'FCT',
    roomName: 'Classic Room',
    roomId: 'default-standard',
    checkIn: '2025-06-02',
    checkOut: '2025-06-05',
    nights: 3,
    guests: 1,
    totalNgn: 478575,
    status: 'completed',
    createdAt: '2025-05-15',
  },
  {
    id: 'HOS-49331',
    hotelId: 'presidential-ph',
    hotelName: 'Presidential Hotel Port Harcourt',
    hotelCity: 'Port Harcourt',
    hotelState: 'Rivers',
    roomName: 'Standard Room',
    roomId: 'default-standard',
    checkIn: '2025-08-18',
    checkOut: '2025-08-20',
    nights: 2,
    guests: 2,
    totalNgn: 185400,
    status: 'completed',
    createdAt: '2025-08-01',
  },
  // 2 cancelled
  {
    id: 'HOS-38812',
    hotelId: 'sheraton-ikeja',
    hotelName: 'Sheraton Lagos Hotel',
    hotelCity: 'Lagos',
    hotelState: 'Lagos',
    roomName: 'Deluxe Room',
    roomId: 'default-deluxe',
    checkIn: '2025-04-20',
    checkOut: '2025-04-23',
    nights: 3,
    guests: 2,
    totalNgn: 415350,
    status: 'cancelled',
    createdAt: '2025-03-10',
    specialRequests: 'High floor requested',
  },
  {
    id: 'HOS-27645',
    hotelId: 'radisson-blu-lekki',
    hotelName: 'Radisson Blu Hotel Lekki',
    hotelCity: 'Lagos',
    hotelState: 'Lagos',
    roomName: 'Deluxe Room',
    roomId: 'default-deluxe',
    checkIn: '2025-09-12',
    checkOut: '2025-09-14',
    nights: 2,
    guests: 2,
    totalNgn: 370800,
    status: 'cancelled',
    createdAt: '2025-08-25',
  },
];
