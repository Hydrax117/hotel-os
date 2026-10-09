export type MockHotel = {
  id: string;
  name: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  amenities: string[];
  featured?: boolean;
};

export const SEARCH_MOCK_HOTELS: MockHotel[] = [
  // ── Lagos ──────────────────────────────────────────────────────────────────
  {
    id: 'eko-hotel-vi',
    name: 'Eko Hotels & Suites',
    city: 'Lagos',
    state: 'Lagos',
    rating: 4.7,
    reviewCount: 1284,
    pricePerNight: 145000,
    amenities: ['Pool', 'WiFi', 'Gym', 'Restaurant', 'Bar', 'Spa'],
    featured: true,
  },
  {
    id: 'radisson-blu-lekki',
    name: 'Radisson Blu Hotel Lekki',
    city: 'Lagos',
    state: 'Lagos',
    rating: 4.6,
    reviewCount: 892,
    pricePerNight: 180000,
    amenities: ['Pool', 'WiFi', 'Gym', 'Restaurant', 'Bar', 'Breakfast included'],
    featured: true,
  },
  {
    id: 'sheraton-ikeja',
    name: 'Sheraton Lagos Hotel',
    city: 'Lagos',
    state: 'Lagos',
    rating: 4.5,
    reviewCount: 1103,
    pricePerNight: 135000,
    amenities: ['Pool', 'WiFi', 'Gym', 'Restaurant', 'Bar', 'Parking'],
  },
  {
    id: 'federal-palace-vi',
    name: 'Federal Palace Hotel & Casino',
    city: 'Lagos',
    state: 'Lagos',
    rating: 4.2,
    reviewCount: 674,
    pricePerNight: 98000,
    amenities: ['Pool', 'WiFi', 'Restaurant', 'Bar', 'Parking'],
  },
  {
    id: 'best-western-ikeja',
    name: 'Best Western Plus Ikeja',
    city: 'Lagos',
    state: 'Lagos',
    rating: 3.9,
    reviewCount: 411,
    pricePerNight: 55000,
    amenities: ['WiFi', 'Gym', 'Restaurant', 'Breakfast included', 'Parking'],
  },

  // ── Abuja ──────────────────────────────────────────────────────────────────
  {
    id: 'transcorp-hilton-abuja',
    name: 'Transcorp Hilton Abuja',
    city: 'Abuja',
    state: 'FCT',
    rating: 4.8,
    reviewCount: 2051,
    pricePerNight: 175000,
    amenities: ['Pool', 'WiFi', 'Gym', 'Restaurant', 'Bar', 'Spa'],
    featured: true,
  },
  {
    id: 'bolingo-hotel-abuja',
    name: 'Bolingo Hotel & Towers',
    city: 'Abuja',
    state: 'FCT',
    rating: 4.3,
    reviewCount: 547,
    pricePerNight: 85000,
    amenities: ['Pool', 'WiFi', 'Restaurant', 'Bar', 'Parking'],
  },
  {
    id: 'rockview-garki',
    name: 'Rockview Hotel Garki',
    city: 'Abuja',
    state: 'FCT',
    rating: 4.1,
    reviewCount: 389,
    pricePerNight: 65000,
    amenities: ['WiFi', 'Restaurant', 'Bar', 'Parking', 'Breakfast included'],
  },
  {
    id: 'nicon-luxury-asokoro',
    name: 'NICON Luxury Hotel',
    city: 'Abuja',
    state: 'FCT',
    rating: 4.6,
    reviewCount: 763,
    pricePerNight: 155000,
    amenities: ['Pool', 'WiFi', 'Gym', 'Restaurant', 'Spa', 'Bar'],
    featured: true,
  },

  // ── Port Harcourt ──────────────────────────────────────────────────────────
  {
    id: 'presidential-ph',
    name: 'Presidential Hotel Port Harcourt',
    city: 'Port Harcourt',
    state: 'Rivers',
    rating: 4.4,
    reviewCount: 618,
    pricePerNight: 90000,
    amenities: ['Pool', 'WiFi', 'Gym', 'Restaurant', 'Bar', 'Parking'],
  },
  {
    id: 'novotel-ph',
    name: 'Novotel Port Harcourt',
    city: 'Port Harcourt',
    state: 'Rivers',
    rating: 4.5,
    reviewCount: 502,
    pricePerNight: 120000,
    amenities: ['Pool', 'WiFi', 'Gym', 'Restaurant', 'Bar', 'Breakfast included'],
  },
  {
    id: 'meridian-ph',
    name: 'Le Meridien Ogeyi Place',
    city: 'Port Harcourt',
    state: 'Rivers',
    rating: 4.7,
    reviewCount: 841,
    pricePerNight: 160000,
    amenities: ['Pool', 'WiFi', 'Gym', 'Restaurant', 'Bar', 'Spa'],
    featured: true,
  },

  // ── Uyo ───────────────────────────────────────────────────────────────────
  {
    id: 'ibom-icon-hotel',
    name: 'Ibom Icon Hotel & Golf Resort',
    city: 'Uyo',
    state: 'Akwa Ibom',
    rating: 4.9,
    reviewCount: 1127,
    pricePerNight: 130000,
    amenities: ['Pool', 'WiFi', 'Gym', 'Restaurant', 'Bar', 'Spa', 'Parking'],
    featured: true,
  },
  {
    id: 'five-star-uyo',
    name: 'Five Star Hotel Uyo',
    city: 'Uyo',
    state: 'Akwa Ibom',
    rating: 3.8,
    reviewCount: 233,
    pricePerNight: 40000,
    amenities: ['WiFi', 'Restaurant', 'Parking', 'Breakfast included'],
  },

  // ── Kano ──────────────────────────────────────────────────────────────────
  {
    id: 'tahir-guest-palace-kano',
    name: 'Tahir Guest Palace',
    city: 'Kano',
    state: 'Kano',
    rating: 4.2,
    reviewCount: 344,
    pricePerNight: 48000,
    amenities: ['WiFi', 'Restaurant', 'Parking', 'Gym', 'Breakfast included'],
  },

  // ── Kaduna ─────────────────────────────────────────────────────────────────
  {
    id: 'hamdala-hotel-kaduna',
    name: 'Hamdala Hotel Kaduna',
    city: 'Kaduna',
    state: 'Kaduna',
    rating: 4.0,
    reviewCount: 278,
    pricePerNight: 38000,
    amenities: ['WiFi', 'Pool', 'Restaurant', 'Bar', 'Parking'],
  },
];
