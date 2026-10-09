import { MockHotel, SEARCH_MOCK_HOTELS } from '../search/mock';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RoomType = {
  id: string;
  name: string;
  bedType: string;          // "King", "Twin", "Queen", "Double"
  capacity: number;
  sizeSqm: number;
  pricePerNight: number;    // NGN
  amenities: string[];
  breakfastIncluded: boolean;
  cancellationPolicy: string;
  available: number;        // 1-8
};

export type HotelReview = {
  id: string;
  guestName: string;
  guestInitials: string;
  date: string;             // "January 2025"
  rating: number;           // 1-5
  title: string;
  body: string;
  categories: {
    cleanliness: number;
    location: number;
    service: number;
    value: number;
    facilities: number;
  };
};

export type HotelDetail = MockHotel & {
  description: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  policies: string[];
  nearbyAttractions: { name: string; distance: string }[];
};

// ── Room Types ────────────────────────────────────────────────────────────────

export const DEFAULT_ROOM_TYPES: RoomType[] = [
  {
    id: 'default-standard',
    name: 'Standard Room',
    bedType: 'Queen',
    capacity: 2,
    sizeSqm: 28,
    pricePerNight: 38000,
    amenities: ['WiFi', 'Air conditioning', 'TV', 'En-suite bathroom'],
    breakfastIncluded: false,
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
    available: 6,
  },
  {
    id: 'default-deluxe',
    name: 'Deluxe Room',
    bedType: 'King',
    capacity: 2,
    sizeSqm: 38,
    pricePerNight: 55000,
    amenities: ['WiFi', 'Air conditioning', 'TV', 'En-suite bathroom', 'Mini fridge'],
    breakfastIncluded: true,
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
    available: 4,
  },
];

export const HOTEL_ROOM_TYPES: Record<string, RoomType[]> = {
  'eko-hotel-vi': [
    {
      id: 'eko-standard',
      name: 'Classic Room',
      bedType: 'Queen',
      capacity: 2,
      sizeSqm: 32,
      pricePerNight: 120000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Mini bar'],
      breakfastIncluded: false,
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      available: 5,
    },
    {
      id: 'eko-deluxe',
      name: 'Deluxe Room',
      bedType: 'King',
      capacity: 2,
      sizeSqm: 42,
      pricePerNight: 155000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Mini bar', 'City view'],
      breakfastIncluded: true,
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      available: 3,
    },
    {
      id: 'eko-junior-suite',
      name: 'Junior Suite',
      bedType: 'King',
      capacity: 3,
      sizeSqm: 68,
      pricePerNight: 210000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Mini bar', 'Living area', 'Ocean view'],
      breakfastIncluded: true,
      cancellationPolicy: 'Free cancellation up to 72 hours before check-in',
      available: 2,
    },
    {
      id: 'eko-executive-suite',
      name: 'Executive Suite',
      bedType: 'King',
      capacity: 4,
      sizeSqm: 110,
      pricePerNight: 280000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Mini bar', 'Living room', 'Dining area', 'Ocean view', 'Butler service'],
      breakfastIncluded: true,
      cancellationPolicy: 'Non-refundable',
      available: 1,
    },
  ],

  'transcorp-hilton-abuja': [
    {
      id: 'transcorp-guest',
      name: 'Guest Room',
      bedType: 'King',
      capacity: 2,
      sizeSqm: 36,
      pricePerNight: 140000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Work desk', 'Mini fridge'],
      breakfastIncluded: false,
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      available: 7,
    },
    {
      id: 'transcorp-deluxe',
      name: 'Deluxe King Room',
      bedType: 'King',
      capacity: 2,
      sizeSqm: 46,
      pricePerNight: 165000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Work desk', 'Mini bar', 'Pool view'],
      breakfastIncluded: true,
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      available: 4,
    },
    {
      id: 'transcorp-twin',
      name: 'Twin Room',
      bedType: 'Twin',
      capacity: 2,
      sizeSqm: 38,
      pricePerNight: 150000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Work desk'],
      breakfastIncluded: false,
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      available: 3,
    },
    {
      id: 'transcorp-suite',
      name: 'Presidential Suite',
      bedType: 'King',
      capacity: 4,
      sizeSqm: 140,
      pricePerNight: 270000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Living room', 'Dining room', 'Kitchenette', 'Butler service', 'City view'],
      breakfastIncluded: true,
      cancellationPolicy: 'Non-refundable',
      available: 1,
    },
  ],

  'ibom-icon-hotel': [
    {
      id: 'ibom-standard',
      name: 'Standard Room',
      bedType: 'Queen',
      capacity: 2,
      sizeSqm: 34,
      pricePerNight: 110000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Work desk'],
      breakfastIncluded: false,
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
      available: 6,
    },
    {
      id: 'ibom-golf-view',
      name: 'Golf View Room',
      bedType: 'King',
      capacity: 2,
      sizeSqm: 44,
      pricePerNight: 140000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Golf course view', 'Mini bar'],
      breakfastIncluded: true,
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      available: 4,
    },
    {
      id: 'ibom-pool-suite',
      name: 'Pool Suite',
      bedType: 'King',
      capacity: 3,
      sizeSqm: 72,
      pricePerNight: 195000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Private terrace', 'Pool view', 'Mini bar', 'Sitting area'],
      breakfastIncluded: true,
      cancellationPolicy: 'Free cancellation up to 72 hours before check-in',
      available: 2,
    },
    {
      id: 'ibom-family',
      name: 'Family Room',
      bedType: 'Double',
      capacity: 4,
      sizeSqm: 62,
      pricePerNight: 165000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Extra beds', 'Garden view'],
      breakfastIncluded: true,
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      available: 3,
    },
  ],

  'meridian-ph': [
    {
      id: 'meridian-superior',
      name: 'Superior Room',
      bedType: 'Queen',
      capacity: 2,
      sizeSqm: 38,
      pricePerNight: 130000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Work desk', 'Mini fridge'],
      breakfastIncluded: false,
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      available: 5,
    },
    {
      id: 'meridian-deluxe-king',
      name: 'Deluxe King Room',
      bedType: 'King',
      capacity: 2,
      sizeSqm: 48,
      pricePerNight: 165000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Mini bar', 'City view', 'Bathtub'],
      breakfastIncluded: true,
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      available: 3,
    },
    {
      id: 'meridian-executive',
      name: 'Executive Floor Room',
      bedType: 'King',
      capacity: 2,
      sizeSqm: 52,
      pricePerNight: 195000,
      amenities: ['WiFi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom', 'Mini bar', 'Lounge access', 'City view', 'Evening cocktails'],
      breakfastIncluded: true,
      cancellationPolicy: 'Free cancellation up to 72 hours before check-in',
      available: 2,
    },
  ],
};

// ── Reviews ───────────────────────────────────────────────────────────────────

export const HOTEL_REVIEWS: Record<string, HotelReview[]> = {
  'eko-hotel-vi': [
    {
      id: 'eko-r1',
      guestName: 'Chukwuemeka Obi',
      guestInitials: 'CO',
      date: 'March 2025',
      rating: 5,
      title: 'Exceptional Lagos experience',
      body: 'Stayed for a business conference and was thoroughly impressed. The pool area is stunning and the staff were incredibly attentive. Room service was prompt and the food quality was excellent. Will definitely return.',
      categories: { cleanliness: 5, location: 5, service: 5, value: 4, facilities: 5 },
    },
    {
      id: 'eko-r2',
      guestName: 'Adaeze Nwosu',
      guestInitials: 'AN',
      date: 'February 2025',
      rating: 4,
      title: 'Great stay, minor hiccups',
      body: 'The hotel is beautiful and the ocean view from my room was breathtaking. Breakfast buffet was outstanding. The only downside was slow WiFi in the room, but the overall experience was well worth it.',
      categories: { cleanliness: 5, location: 5, service: 4, value: 4, facilities: 4 },
    },
    {
      id: 'eko-r3',
      guestName: 'Babatunde Olawale',
      guestInitials: 'BO',
      date: 'January 2025',
      rating: 4,
      title: 'Business trip made comfortable',
      body: 'Perfect for business travellers. The conference facilities are top-notch and the executive lounge is a great touch. Parking can get busy during events though, so plan ahead.',
      categories: { cleanliness: 4, location: 4, service: 4, value: 3, facilities: 5 },
    },
    {
      id: 'eko-r4',
      guestName: 'Ngozi Eze',
      guestInitials: 'NE',
      date: 'February 2025',
      rating: 5,
      title: 'Anniversary trip — absolutely magical',
      body: 'We celebrated our 5th anniversary here and the staff went above and beyond to make it special. A bottle of champagne and rose petals awaited us in the room. The spa treatment was divine.',
      categories: { cleanliness: 5, location: 5, service: 5, value: 5, facilities: 5 },
    },
    {
      id: 'eko-r5',
      guestName: 'Fatima Al-Hassan',
      guestInitials: 'FA',
      date: 'March 2025',
      rating: 3,
      title: 'Good hotel, but overpriced',
      body: 'The facilities are nice and the location on Victoria Island is convenient. However, for the price you pay, I expected more consistency. The air conditioning in my room was noisy and maintenance took a day to fix it.',
      categories: { cleanliness: 4, location: 5, service: 3, value: 2, facilities: 3 },
    },
  ],

  'transcorp-hilton-abuja': [
    {
      id: 'th-r1',
      guestName: 'Kelechi Onyeaka',
      guestInitials: 'KO',
      date: 'March 2025',
      rating: 5,
      title: 'Best hotel in Abuja, no contest',
      body: 'I have stayed at Transcorp Hilton many times and it never disappoints. The rooms are consistently well-maintained, the pool is gorgeous and the staff remember returning guests. A true landmark of Abuja.',
      categories: { cleanliness: 5, location: 5, service: 5, value: 4, facilities: 5 },
    },
    {
      id: 'th-r2',
      guestName: 'Amina Bello',
      guestInitials: 'AB',
      date: 'January 2025',
      rating: 4,
      title: 'Excellent for government business trips',
      body: 'Stayed here during a federal government workshop. The meeting rooms are well-equipped and the catering team handled our group of 40 beautifully. Rooms are spacious and comfortable.',
      categories: { cleanliness: 4, location: 5, service: 4, value: 4, facilities: 5 },
    },
    {
      id: 'th-r3',
      guestName: 'Emeka Duru',
      guestInitials: 'ED',
      date: 'February 2025',
      rating: 5,
      title: 'Outstanding service from check-in to checkout',
      body: 'The staff at Transcorp set the gold standard for Nigerian hospitality. Check-in was smooth, concierge was helpful with restaurant recommendations in Abuja, and checkout was hassle-free.',
      categories: { cleanliness: 5, location: 5, service: 5, value: 4, facilities: 5 },
    },
    {
      id: 'th-r4',
      guestName: 'Chidinma Okafor',
      guestInitials: 'CO',
      date: 'March 2025',
      rating: 4,
      title: 'Solid luxury experience',
      body: 'Fantastic hotel overall. The gym is well-equipped and the spa offers a great selection of treatments. Food at the main restaurant was exceptional. The only minor issue was slow room service during peak hours.',
      categories: { cleanliness: 5, location: 5, service: 4, value: 3, facilities: 5 },
    },
    {
      id: 'th-r5',
      guestName: 'Usman Garba',
      guestInitials: 'UG',
      date: 'January 2025',
      rating: 4,
      title: 'Worth every naira',
      body: 'Came for a family vacation and the kids loved the pool. The family rooms are spacious and the hotel organised a tour of Abuja landmarks for us. Great memories made here.',
      categories: { cleanliness: 4, location: 5, service: 5, value: 4, facilities: 4 },
    },
  ],

  'ibom-icon-hotel': [
    {
      id: 'ibom-r1',
      guestName: 'Nsikak Udoh',
      guestInitials: 'NU',
      date: 'February 2025',
      rating: 5,
      title: 'The jewel of Uyo — absolutely world class',
      body: 'Ibom Icon is simply extraordinary. The golf resort is impeccably maintained and the hotel itself feels like it belongs on any global top-10 list. Service is warm and very professional. A proud achievement for Akwa Ibom State.',
      categories: { cleanliness: 5, location: 5, service: 5, value: 5, facilities: 5 },
    },
    {
      id: 'ibom-r2',
      guestName: 'Blessing Etim',
      guestInitials: 'BE',
      date: 'March 2025',
      rating: 5,
      title: 'Perfect for a weekend getaway',
      body: 'Came with my husband for a long weekend and we did not want to leave. The pool is gorgeous, the food is incredible — especially the local Nigerian dishes — and the golf course views are stunning.',
      categories: { cleanliness: 5, location: 5, service: 5, value: 4, facilities: 5 },
    },
    {
      id: 'ibom-r3',
      guestName: 'Chukwuemeka Obi',
      guestInitials: 'CO',
      date: 'January 2025',
      rating: 4,
      title: 'Impressive but a long way from anywhere',
      body: 'The hotel is stunning and the facilities are among the best in Nigeria. My only comment is that Uyo city centre is about 30 minutes away, so if you need to run business errands you will need the hotel shuttle. Worth it for a relaxing stay.',
      categories: { cleanliness: 5, location: 3, service: 5, value: 4, facilities: 5 },
    },
    {
      id: 'ibom-r4',
      guestName: 'Abigail Effiong',
      guestInitials: 'AE',
      date: 'February 2025',
      rating: 5,
      title: 'Honeymoon destination worthy',
      body: 'We used Ibom Icon for our honeymoon and it was everything we dreamed of. The staff arranged a romantic dinner on the terrace overlooking the golf course. Truly unforgettable.',
      categories: { cleanliness: 5, location: 5, service: 5, value: 5, facilities: 5 },
    },
  ],

  'meridian-ph': [
    {
      id: 'mph-r1',
      guestName: 'Tonye Williams',
      guestInitials: 'TW',
      date: 'March 2025',
      rating: 5,
      title: 'Best hotel in Port Harcourt',
      body: 'Le Meridien Ogeyi Place consistently delivers a five-star experience. The food and beverage team is exceptional and the rooms are always immaculate. Ideal for oil and gas executives visiting PH.',
      categories: { cleanliness: 5, location: 5, service: 5, value: 4, facilities: 5 },
    },
    {
      id: 'mph-r2',
      guestName: 'Ngozi Eze',
      guestInitials: 'NE',
      date: 'January 2025',
      rating: 4,
      title: 'Excellent location, great rooms',
      body: 'The hotel is perfectly located in the GRA area which makes everything accessible. Room was spacious and the bed was very comfortable. Breakfast spread was impressive. The pool area could do with some upgrading.',
      categories: { cleanliness: 5, location: 5, service: 4, value: 4, facilities: 4 },
    },
    {
      id: 'mph-r3',
      guestName: 'Babatunde Olawale',
      guestInitials: 'BO',
      date: 'February 2025',
      rating: 4,
      title: 'Professional and polished',
      body: 'Stayed here on a two-week project assignment. The rooms are quiet and well-insulated from city noise. Gym is well-stocked. The in-house restaurant serves excellent pepper soup — a must try.',
      categories: { cleanliness: 4, location: 5, service: 4, value: 3, facilities: 4 },
    },
    {
      id: 'mph-r4',
      guestName: 'Chioma Akpan',
      guestInitials: 'CA',
      date: 'March 2025',
      rating: 3,
      title: 'Good but not great value',
      body: 'The hotel has a good reputation and it largely lives up to it. However, at this price point I expected seamless service. There were some delays at check-in and housekeeping skipped my room one day. Management was apologetic and responsive.',
      categories: { cleanliness: 3, location: 5, service: 3, value: 2, facilities: 4 },
    },
    {
      id: 'mph-r5',
      guestName: 'Ikenna Nwosu',
      guestInitials: 'IN',
      date: 'February 2025',
      rating: 5,
      title: 'Superb corporate retreat venue',
      body: "Organised our company's annual retreat here for 60 people. The event planning team was outstanding. Catering was excellent throughout the two days, and the AV setup in the conference rooms was flawless.",
      categories: { cleanliness: 5, location: 5, service: 5, value: 4, facilities: 5 },
    },
  ],
};

// Initialise empty arrays for hotels without specific reviews
SEARCH_MOCK_HOTELS.forEach(hotel => {
  if (!HOTEL_REVIEWS[hotel.id]) {
    HOTEL_REVIEWS[hotel.id] = [];
  }
});

// ── Hotel Details ─────────────────────────────────────────────────────────────

export const HOTEL_DETAILS: Record<string, HotelDetail> = Object.fromEntries(
  SEARCH_MOCK_HOTELS.map(hotel => {
    const detailMap: Record<string, Omit<HotelDetail, keyof MockHotel>> = {
      'eko-hotel-vi': {
        description: 'Eko Hotels & Suites is Lagos\'s most iconic waterfront resort, sprawling across Victoria Island with multiple pools, a private beach, and a world-class convention centre. A landmark of Nigerian hospitality since 1977, the property blends contemporary luxury with a distinctly Lagos energy.',
        address: '1415 Adetokunbo Ademola Street, Victoria Island, Lagos',
        checkInTime: '3:00 PM',
        checkOutTime: '12:00 PM',
        policies: [
          'Valid government-issued ID required at check-in',
          'No smoking in rooms — designated areas available',
          'Pets not allowed',
          'Children of all ages welcome',
          'Credit card or cash deposit required at check-in',
        ],
        nearbyAttractions: [
          { name: 'Bar Beach (Eko Atlantic)', distance: '0.5 km' },
          { name: 'Tafawa Balewa Square', distance: '4.2 km' },
          { name: 'National Museum Lagos', distance: '5.1 km' },
          { name: 'Lekki Conservation Centre', distance: '18 km' },
        ],
      },
      'radisson-blu-lekki': {
        description: 'The Radisson Blu Hotel Lekki offers sleek contemporary design and panoramic views over Lekki, making it the preferred address for the city\'s business community and discerning travellers. Floor-to-ceiling windows, a rooftop pool, and all-day dining complete the experience.',
        address: 'Plot 1, Block 28, Admiralty Way, Lekki Phase 1, Lagos',
        checkInTime: '3:00 PM',
        checkOutTime: '12:00 PM',
        policies: [
          'Valid ID required at check-in',
          'No smoking in rooms or public areas',
          'Pets not allowed',
          'Children welcome with complimentary breakfast under 12',
          'Damage deposit may be required',
        ],
        nearbyAttractions: [
          { name: 'Lekki-Epe Expressway Market', distance: '1.2 km' },
          { name: 'Lekki Conservation Centre', distance: '8 km' },
          { name: 'Landmark Beach', distance: '3.5 km' },
          { name: 'Freedom Park Lagos', distance: '12 km' },
        ],
      },
      'sheraton-ikeja': {
        description: 'Sheraton Lagos Hotel is a classic business-class property set in the commercial heart of Ikeja, offering well-appointed rooms, multiple dining options, and easy access to Murtala Muhammed International Airport. A reliable choice for transit guests and corporate travellers alike.',
        address: '30 Mobolaji Bank Anthony Way, Ikeja, Lagos',
        checkInTime: '2:00 PM',
        checkOutTime: '12:00 PM',
        policies: [
          'Valid ID required at check-in',
          'No smoking in rooms',
          'Pets not allowed',
          'Early check-in subject to availability',
          'Airport shuttle available on request',
        ],
        nearbyAttractions: [
          { name: 'Murtala Muhammed International Airport', distance: '4 km' },
          { name: 'Ikeja City Mall', distance: '2.5 km' },
          { name: 'Computer Village Ikeja', distance: '3 km' },
          { name: 'Lagos State Secretariat', distance: '5 km' },
        ],
      },
      'federal-palace-vi': {
        description: 'Federal Palace Hotel & Casino is a heritage property on Victoria Island, combining old-world glamour with the excitement of an in-house casino. Originally built in 1960, the hotel retains a classic character while offering modern comfort and a lively entertainment scene.',
        address: '6 Ahmadu Bello Way, Victoria Island, Lagos',
        checkInTime: '2:00 PM',
        checkOutTime: '11:00 AM',
        policies: [
          'Valid ID required at check-in',
          'Guests must be 18 or over to access the casino',
          'Smart casual dress code in public areas after 6 PM',
          'No smoking in rooms',
          'Pets not allowed',
        ],
        nearbyAttractions: [
          { name: 'Tafawa Balewa Square', distance: '3.8 km' },
          { name: 'Lagos Island Market', distance: '4.5 km' },
          { name: 'Eko Atlantic City', distance: '2 km' },
          { name: 'National Theatre Lagos', distance: '6 km' },
        ],
      },
      'best-western-ikeja': {
        description: 'Best Western Plus Ikeja is a comfortable mid-range hotel located minutes from Lagos airport, making it a smart choice for early flights or stopovers. Clean, well-run, and offering reliable amenities at accessible prices.',
        address: '19 Allen Avenue, Ikeja, Lagos',
        checkInTime: '2:00 PM',
        checkOutTime: '11:00 AM',
        policies: [
          'Valid ID required at check-in',
          'No smoking indoors',
          'Pets not allowed',
          'Free parking for hotel guests',
          'Children under 12 stay free with parents',
        ],
        nearbyAttractions: [
          { name: 'Murtala Muhammed International Airport', distance: '6 km' },
          { name: 'Ikeja City Mall', distance: '1.5 km' },
          { name: 'Computer Village Ikeja', distance: '2 km' },
          { name: 'Maryland Mall', distance: '4 km' },
        ],
      },
      'transcorp-hilton-abuja': {
        description: 'Transcorp Hilton Abuja is the capital\'s most prestigious hotel, a 670-room landmark that has hosted heads of state and international dignitaries for decades. Set on 14 acres with immaculate gardens, a large outdoor pool, and extensive conference facilities, it defines the Abuja luxury experience.',
        address: '1 Aguiyi Ironsi Street, Maitama, Abuja, FCT',
        checkInTime: '3:00 PM',
        checkOutTime: '12:00 PM',
        policies: [
          'Valid government-issued ID required at check-in',
          'No smoking in rooms — designated outdoor areas available',
          'Pets not allowed',
          'Smart casual dress code in restaurants',
          'Security screening at hotel entrance',
        ],
        nearbyAttractions: [
          { name: 'Aso Rock Presidential Villa', distance: '3 km' },
          { name: 'Nigerian National Mosque', distance: '4.5 km' },
          { name: 'Millennium Park', distance: '5 km' },
          { name: 'Wuse Market', distance: '6 km' },
        ],
      },
      'bolingo-hotel-abuja': {
        description: 'Bolingo Hotel & Towers offers a stylish blend of business convenience and contemporary comfort in Abuja\'s Central Business District. With spacious rooms, a rooftop pool, and versatile meeting facilities, it caters to corporate guests and leisure travellers alike.',
        address: 'Plot 759, Constitution Avenue, Central Business District, Abuja',
        checkInTime: '2:00 PM',
        checkOutTime: '12:00 PM',
        policies: [
          'Valid ID required at check-in',
          'No smoking in rooms',
          'Pets not allowed',
          'Conference rooms available for hire',
          'Complimentary parking for hotel guests',
        ],
        nearbyAttractions: [
          { name: 'Nigerian National Mosque', distance: '2.5 km' },
          { name: 'Abuja National Stadium', distance: '3 km' },
          { name: 'Millennium Park', distance: '4 km' },
          { name: 'Jabi Lake Mall', distance: '8 km' },
        ],
      },
      'rockview-garki': {
        description: 'Rockview Hotel Garki is a well-established mid-range property in the Garki business district, popular with Nigerian government officials and regional business travellers. Clean, efficient, and offering good value for money in the heart of Abuja.',
        address: 'Plot 2073, Michael Okpara Street, Wuse Zone 5, Abuja',
        checkInTime: '2:00 PM',
        checkOutTime: '11:00 AM',
        policies: [
          'Valid ID required at check-in',
          'No smoking in rooms',
          'Pets not allowed',
          'Complimentary breakfast for all guests',
          'Free parking available',
        ],
        nearbyAttractions: [
          { name: 'Wuse Market', distance: '1.5 km' },
          { name: 'Nigerian National Mosque', distance: '3 km' },
          { name: 'Garki Shopping Mall', distance: '2 km' },
          { name: 'Transcorp Hilton (landmark)', distance: '4 km' },
        ],
      },
      'nicon-luxury-asokoro': {
        description: 'NICON Luxury Hotel in Asokoro stands among Abuja\'s finest addresses, offering refined accommodation and dining experiences within easy reach of Nigeria\'s seat of power. The hotel\'s elegant design, spa, and curated restaurant make it a favourite among diplomats and senior executives.',
        address: 'Plot 903, Tafawa Balewa Way, Asokoro District, Abuja',
        checkInTime: '3:00 PM',
        checkOutTime: '12:00 PM',
        policies: [
          'Valid ID required at check-in',
          'No smoking in rooms or public areas',
          'Pets not allowed',
          'Formal attire required in the main restaurant for dinner',
          'Credit card imprint required at check-in',
        ],
        nearbyAttractions: [
          { name: 'Aso Rock Presidential Villa', distance: '1.5 km' },
          { name: 'Eagle Square', distance: '3.5 km' },
          { name: 'Abuja Arts & Crafts Village', distance: '5 km' },
          { name: 'Asokoro District Park', distance: '0.8 km' },
        ],
      },
      'presidential-ph': {
        description: 'Presidential Hotel Port Harcourt is a Port Harcourt institution, offering comfortable accommodation and comprehensive facilities in the Garden City\'s commercial hub. With a large swimming pool, business centre, and well-regarded restaurant, it\'s a reliable base for both business and leisure stays.',
        address: '2 Stadium Road, GRA Phase 1, Port Harcourt, Rivers State',
        checkInTime: '2:00 PM',
        checkOutTime: '12:00 PM',
        policies: [
          'Valid ID required at check-in',
          'No smoking in rooms',
          'Pets not allowed',
          'Parking available for hotel guests',
          'Children welcome',
        ],
        nearbyAttractions: [
          { name: 'Isaac Boro Park', distance: '1 km' },
          { name: 'Port Harcourt Mall', distance: '3.5 km' },
          { name: 'Port Harcourt Zoo', distance: '4 km' },
          { name: 'Rumuola Market', distance: '5 km' },
        ],
      },
      'novotel-ph': {
        description: 'Novotel Port Harcourt brings the trusted Accor Hotels standard to the Garden City, offering modern rooms with smart amenities and a lively poolside area. An excellent choice for families and corporate travellers seeking international-grade comfort in Port Harcourt.',
        address: 'Plot 7, Trans-Amadi Industrial Layout, Port Harcourt, Rivers State',
        checkInTime: '3:00 PM',
        checkOutTime: '12:00 PM',
        policies: [
          'Valid ID required at check-in',
          'No smoking in rooms',
          'Pets allowed with prior arrangement',
          'Children under 16 stay free sharing parents\' room',
          'Free parking on premises',
        ],
        nearbyAttractions: [
          { name: 'Trans-Amadi Industrial Area', distance: '0.5 km' },
          { name: 'Isaac Boro Park', distance: '4 km' },
          { name: 'Port Harcourt Port Complex', distance: '6 km' },
          { name: 'Rumuola Market', distance: '7 km' },
        ],
      },
      'meridian-ph': {
        description: 'Le Meridien Ogeyi Place is Port Harcourt\'s most prestigious hotel, offering five-star luxury in the heart of the GRA district. With an exquisite pool, outstanding dining, and rooms designed for the discerning guest, it\'s the natural choice for senior executives and special occasions.',
        address: '7 Tombia Street, GRA Phase 2, Port Harcourt, Rivers State',
        checkInTime: '3:00 PM',
        checkOutTime: '12:00 PM',
        policies: [
          'Valid government-issued ID required at check-in',
          'No smoking in rooms or public areas',
          'Pets not allowed',
          'Smart casual dress code applies in all dining areas',
          'Security screening at hotel entrance',
        ],
        nearbyAttractions: [
          { name: 'Government House Port Harcourt', distance: '2 km' },
          { name: 'Isaac Boro Park', distance: '2.5 km' },
          { name: 'Port Harcourt Mall', distance: '5 km' },
          { name: 'Bonny Island (ferry)', distance: '65 km' },
        ],
      },
      'ibom-icon-hotel': {
        description: 'Ibom Icon Hotel & Golf Resort in Uyo is widely regarded as the finest hotel in southern Nigeria, an architectural masterpiece set around a championship 18-hole golf course. Every detail — from the immaculate rooms to the exceptional restaurant — reflects Akwa Ibom State\'s commitment to world-class tourism.',
        address: 'Airport Road, Uyo, Akwa Ibom State',
        checkInTime: '3:00 PM',
        checkOutTime: '12:00 PM',
        policies: [
          'Valid ID required at check-in',
          'Golf course bookings must be arranged in advance',
          'Smart attire required on the golf course',
          'No smoking in rooms',
          'Pets not allowed',
        ],
        nearbyAttractions: [
          { name: 'Victor Attah International Airport', distance: '3 km' },
          { name: 'Ibom Tropicana Entertainment Centre', distance: '1.5 km' },
          { name: 'Uyo City Centre', distance: '12 km' },
          { name: 'Annang Cultural Museum', distance: '15 km' },
        ],
      },
      'five-star-uyo': {
        description: 'Five Star Hotel Uyo offers comfortable and affordable accommodation in the heart of Uyo city, making it a practical base for business travellers and visitors to Akwa Ibom State. Clean rooms, reliable WiFi, and a friendly restaurant make it excellent value for money.',
        address: '14 Aka Road, Uyo, Akwa Ibom State',
        checkInTime: '2:00 PM',
        checkOutTime: '11:00 AM',
        policies: [
          'Valid ID required at check-in',
          'No smoking in rooms',
          'Pets not allowed',
          'Complimentary breakfast included',
          'Free parking available',
        ],
        nearbyAttractions: [
          { name: 'Uyo City Centre', distance: '1 km' },
          { name: 'Annang Cultural Museum', distance: '3 km' },
          { name: 'Ibom Icon Hotel (landmark)', distance: '12 km' },
          { name: 'Victor Attah International Airport', distance: '15 km' },
        ],
      },
      'tahir-guest-palace-kano': {
        description: 'Tahir Guest Palace is a distinguished hospitality establishment in Kano, blending Northern Nigerian architectural tradition with modern hotel comfort. Known for its warm service, it is a favourite among business delegates, NGO workers, and cultural travellers to the ancient city.',
        address: '1 Tahir Guest Palace Road, Nassarawa GRA, Kano State',
        checkInTime: '2:00 PM',
        checkOutTime: '11:00 AM',
        policies: [
          'Valid ID required at check-in',
          'No smoking indoors',
          'Pets not allowed',
          'Halal dining options available',
          'Dress modestly in public areas',
        ],
        nearbyAttractions: [
          { name: 'Kano City Walls (Ganuwar Kano)', distance: '4 km' },
          { name: 'Kurmi Market', distance: '5 km' },
          { name: 'Emir\'s Palace Kano', distance: '5.5 km' },
          { name: 'Kano State Museum', distance: '6 km' },
        ],
      },
      'hamdala-hotel-kaduna': {
        description: 'Hamdala Hotel Kaduna is a classic establishment at the centre of Kaduna\'s social and business life, known for its welcoming atmosphere, pool, and popular restaurant that draws both hotel guests and local diners. An affordable and dependable choice for visitors to Nigeria\'s northern hub.',
        address: '22 Ahmadu Bello Way, Kaduna, Kaduna State',
        checkInTime: '2:00 PM',
        checkOutTime: '11:00 AM',
        policies: [
          'Valid ID required at check-in',
          'No smoking in rooms',
          'Pets not allowed',
          'Free parking on premises',
          'Children under 12 stay free',
        ],
        nearbyAttractions: [
          { name: 'Kaduna State Governor\'s Office', distance: '1.5 km' },
          { name: 'Kaduna Cultural Centre', distance: '2 km' },
          { name: 'Kaduna Central Market', distance: '3 km' },
          { name: 'Kajuru Castle', distance: '40 km' },
        ],
      },
    };

    const detail = detailMap[hotel.id] ?? {
      description: `${hotel.name} offers comfortable accommodation and quality service in ${hotel.city}.`,
      address: `${hotel.city}, ${hotel.state}, Nigeria`,
      checkInTime: '2:00 PM',
      checkOutTime: '11:00 AM',
      policies: [
        'Valid ID required at check-in',
        'No smoking in rooms',
        'Pets not allowed',
      ],
      nearbyAttractions: [
        { name: `${hotel.city} City Centre`, distance: '2 km' },
      ],
    };

    return [hotel.id, { ...hotel, ...detail }];
  })
);
