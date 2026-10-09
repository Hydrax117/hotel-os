# Hotel OS — Product & Technical Specification

## 1. Product Vision

### Working Concept

Hotel OS is a two-sided hotel operating, distribution, and booking platform for Nigeria/Africa.

Hotels connect to Hotel OS to manage and distribute their room inventory.

Travelers use the consumer platform to:

- Discover hotels
- Compare rooms
- Check availability
- Make reservations
- Pay
- Receive confirmations
- Manage bookings

The platform sits between hotels and travelers.

```text
                         HOTEL OS
                            │
              ┌─────────────┴─────────────┐
              │                           │
        HOTEL PLATFORM              TRAVEL PLATFORM
              │                           │
       ┌──────┼──────┐             ┌──────┼──────┐
       │      │      │             │      │      │
   Inventory Rates Bookings      Search Hotels Booking
       │      │      │             │      │      │
       └──────┴──────┘             └──────┴──────┘
              │                           │
              └───────────┬───────────────┘
                          │
                    BOOKING ENGINE
                          │
                       PAYMENTS
```

---

# 2. The Two Products

Build one platform with two experiences rather than two completely independent systems.

### Hotel OS

`app.yourdomain.com`

For:

- Hotel owners
- Managers
- Receptionists
- Staff
- Administrators

### Traveler Platform

`yourdomain.com`

For:

- Travelers
- Guests
- Corporate users

Eventually:

```text
yourdomain.com
app.yourdomain.com
api.yourdomain.com
```

---

# 3. User Types and Roles

## Platform

### SUPER_ADMIN

Can:

- Manage hotels
- Approve hotels
- Manage users
- Manage bookings
- Manage payments
- Manage subscriptions
- Manage commissions
- Manage disputes
- Manage cities
- Manage reviews
- Suspend hotels
- View platform analytics

## Hotel

### HOTEL_OWNER

Can:

- Manage property
- Manage rooms
- Manage pricing
- Manage inventory
- View bookings
- Manage staff
- Manage payouts
- Manage subscription

### HOTEL_MANAGER

Can manage daily operations but not sensitive financial settings.

### HOTEL_STAFF

Can:

- View reservations
- Check guests in/out
- Update room status

## Traveler

### CUSTOMER

Can:

- Search
- Book
- Pay
- Cancel
- Review
- Manage profile

---

# 4. Hotel Onboarding

Hotel clicks:

> **List my hotel**

## Step 1 — Account

- Name
- Email
- Phone
- Password

## Step 2 — Property

- Hotel name
- Description
- Address
- City
- State
- Country
- Latitude
- Longitude

## Step 3 — Verification

Potential information:

- CAC/business information
- Owner information
- Government ID
- Hotel documents
- Bank details

Verification requirements should remain configurable so additional requirements can be introduced later.

## Step 4 — Property Information

- Amenities
- Check-in time
- Check-out time
- Cancellation policy
- House rules
- Languages

## Step 5 — Images

- Hotel exterior
- Lobby
- Rooms
- Bathroom
- Pool
- Restaurant
- Gym
- Other relevant areas

## Step 6 — Rooms

Example:

```text
Deluxe King Room

Capacity: 2
Bed: King
Bathroom: Private

Total rooms: 20

₦85,000/night
```

## Step 7 — Subscription

```text
Starter
Professional
Enterprise
```

## Step 8 — Approval

Hotel enters:

`Pending verification`

Admin reviews.

Then:

`Approved → Published`

---

# 5. Hotel Dashboard

The hotel dashboard should be one of the strongest parts of the product.

Example:

```text
Good morning, Example Hotel 👋

Today's occupancy
━━━━━━━━━━━━━━━━
78%

Today's bookings
34

Today's revenue
₦2,840,000

Upcoming check-ins
28

Upcoming check-outs
19
```

---

# 6. Inventory Management

Distinguish between:

### Room Type

Example:

> Deluxe King

and:

### Physical Room

Example:

> Room 302

Relationship:

```text
ROOM TYPE

Deluxe King
├── 301
├── 302
├── 303
├── 304
└── ...
```

The marketplace normally sells room types, while the hotel's operational system can manage physical rooms.

---

# 7. Availability Model

Do not simply store:

```text
available_rooms = 5
```

Use date-based inventory.

Example:

```text
Deluxe King

Oct 10 → 8 available
Oct 11 → 7
Oct 12 → 4
Oct 13 → 3
Oct 14 → 8
```

A traveler searching:

> Lagos  
> Oct 12–15  
> 2 guests

should receive availability calculated across the requested date range.

---

# 8. Booking Engine

Booking flow:

```text
SEARCH
 ↓
SELECT HOTEL
 ↓
SELECT ROOM
 ↓
CHECK AVAILABILITY
 ↓
TEMPORARY HOLD
 ↓
CUSTOMER DETAILS
 ↓
PAYMENT
 ↓
PAYMENT CONFIRMED
 ↓
BOOKING CONFIRMED
 ↓
INVENTORY DECREMENTED
 ↓
HOTEL NOTIFIED
 ↓
CUSTOMER NOTIFIED
```

## Temporary Holds

Do not decrement inventory only after payment.

Example:

```text
Available: 5

Customer starts checkout

Available: 4
Held: 1

Payment timeout after 10 minutes

Available: 5
Held: 0
```

This prevents overselling the final room.

---

# 9. Booking State Machine

Use explicit booking states instead of a simple `paid = true` flag.

```text
PENDING
   ↓
HELD
   ↓
PAYMENT_PENDING
   ↓
CONFIRMED
   ↓
CHECKED_IN
   ↓
CHECKED_OUT
```

Alternative paths:

```text
PAYMENT_PENDING
      ↓
    FAILED

CONFIRMED
      ↓
 CANCELLED

CONFIRMED
      ↓
   NO_SHOW
```

This is important for refunds, reporting, and operational workflows.

---

# 10. Traveler Search

User enters:

> Lagos

The system can show:

```text
Lagos
├── Victoria Island
├── Lekki
├── Ikeja
├── Yaba
├── Surulere
└── Mainland
```

Search parameters:

```text
destination
checkIn
checkOut
guests
rooms
```

Filters:

- Price
- Rating
- Location
- Amenities
- Room type
- Breakfast
- Pool
- Gym
- Parking
- Cancellation policy
- Payment options

---

# 11. Hotel Discovery Page

Example:

```text
Hotels in Lagos

342 properties

Sort:
Recommended
Price
Rating
Distance
```

Hotel card:

```text
┌───────────────────────────┐
│                           │
│       HOTEL IMAGE         │
│                           │
│ ❤️                        │
├───────────────────────────┤
│ Example Hotel             │
│ ★★★★★ 4.7                │
│ Victoria Island, Lagos    │
│                           │
│ Pool · WiFi · Gym         │
│                           │
│ From ₦85,000/night        │
└───────────────────────────┘
```

---

# 12. Hotel Page

The hotel page should feel premium and information-rich.

```text
Hotel name
★★★★☆

📍 Victoria Island, Lagos

★★★★★ 4.7
328 reviews
```

Include:

- Image gallery
- Description
- Amenities
- Rooms
- Reviews
- Policies
- Location
- Nearby attractions

## Available Rooms

```text
Deluxe King

2 guests
King bed
Breakfast included

₦85,000/night

[Reserve]
```

---

# 13. Reservation Checkout

Keep checkout simple.

## Guest Information

- First name
- Last name
- Email
- Phone

## Reservation Summary

```text
Deluxe King
Oct 12 → Oct 15

3 nights × ₦85,000

Room subtotal    ₦255,000
Service fee        ₦7,650
────────────────────────
Total             ₦262,650
```

Button:

> Pay ₦262,650

---

# 14. Payment Architecture

Initially design around a payment provider such as Paystack that supports marketplace-style split settlements/subaccounts.

Conceptually:

```text
Customer pays ₦262,650
        │
        ▼
     Payment Provider
        │
   ┌────┴─────┐
   │          │
Platform     Hotel
commission   settlement
```

Keep payment providers behind an abstraction.

Example:

```ts
interface PaymentProvider {
  initializePayment()
  verifyPayment()
  refundPayment()
  createRecipient()
  createSplit()
}
```

Then:

```text
PaymentService
      │
 ┌────┴─────────┐
 │              │
Paystack     OtherProvider
```

This allows another provider to be added later without rewriting the booking system.

---

# 15. Payment and Settlement Model

Avoid building an internal wallet that unnecessarily holds hotel funds in the MVP.

Prefer provider-managed settlement/split mechanisms where the commercial, legal, and regulatory setup permits.

Example:

```text
Booking ₦255,000

Platform commission
10% = ₦25,500

Hotel settlement
Remaining amount after applicable fees
```

The exact commission, payment fee, settlement timing, refund responsibility, and tax treatment should be configurable and reviewed commercially/legal before launch.

---

# 16. Hotel Payouts

Hotel dashboard:

```text
AVAILABLE
₦4,820,000

PENDING
₦640,000

SETTLED
₦18,400,000
```

Transaction:

```text
Booking #HOS-82931

Customer paid      ₦262,650

Platform fee         ₦26,265
Payment fees          ...
Hotel settlement    ...
```

Use a proper ledger rather than calculating balances from ad-hoc booking queries.

---

# 17. Subscription System

Hotels pay a subscription to access Hotel OS and marketplace distribution.

Example plans:

## Starter — ₦25k/month

- Hotel listing
- Basic dashboard
- Bookings
- Inventory

## Professional — ₦50k/month

- Everything in Starter
- Analytics
- Staff accounts
- Advanced inventory
- Promotions

## Enterprise — Custom

- API integration
- Multi-property support
- Advanced reporting
- Dedicated support

Prices should be configurable from the admin dashboard rather than hard-coded.

---

# 18. Subscription Lifecycle

Use states:

```text
ACTIVE
GRACE_PERIOD
SUSPENDED
ARCHIVED
```

Example:

```text
Subscription expires
        ↓
7-day grace period
        ↓
Hotel becomes unavailable for NEW bookings
        ↓
Existing reservations remain valid
```

Never cancel existing guest reservations simply because a hotel subscription expired.

---

# 19. PMS Integration Architecture

The platform should eventually allow hotels to connect their existing Property Management System (PMS).

Example:

```text
Hotel PMS
   │
   │ API
   ▼
Your Integration API
   │
   ├── Room availability
   ├── Rates
   ├── Reservations
   ├── Cancellations
   └── Guest information
```

Do not require PMS integration for MVP.

Support:

1. Manual management
2. CSV/Excel import
3. API integration

---

# 20. PMS Adapter Architecture

Different PMS providers will have different APIs and data structures.

Build an adapter system.

```ts
interface PMSAdapter {
  getProperty()
  getRoomTypes()
  getAvailability()
  getRates()
  createReservation()
  cancelReservation()
  updateReservation()
}
```

Architecture:

```text
PMS Integration Engine
        │
 ┌──────┼──────────┐
 │      │          │
PMS A  PMS B      PMS C
Adapter Adapter   Adapter
```

The core booking engine should not care which PMS is connected.

---

# 21. Integration Mapping

Hotel systems will use their own identifiers.

Example:

```text
External PMS:

"DLX"

        ↓ mapping

Hotel OS:

"DELUXE_KING"
```

Integration entities should support:

- External property ID
- External room type ID
- External room ID
- External rate plan ID
- Internal Hotel OS ID
- Sync status
- Last synced timestamp
- Mapping errors

---

# 22. Hotel API

Eventually expose:

```http
POST /v1/hotels
GET /v1/hotels
GET /v1/hotels/:id

GET /v1/room-types
GET /v1/availability

POST /v1/reservations
GET /v1/reservations/:id
POST /v1/reservations/:id/cancel
```

Integration endpoints:

```http
POST /v1/integrations
POST /v1/integrations/:id/sync
POST /v1/webhooks/pms
```

API authentication should support:

- API keys
- OAuth/client credentials where appropriate
- Webhook signatures
- IP restrictions for enterprise integrations where useful

---

# 23. Webhooks

Important events should be event-driven.

Examples:

```text
booking.created
booking.confirmed
booking.cancelled

payment.initialized
payment.success
payment.failed
payment.refunded

inventory.updated

hotel.approved
hotel.suspended

subscription.created
subscription.expired
```

Store webhook events and make processing idempotent.

If a payment provider sends the same webhook three times:

```text
event_id = evt_123
```

the system should process it once.

---

# 24. Background Jobs

Use background workers for:

- Reservation hold expiry
- Payment verification
- Email
- WhatsApp notifications
- Booking reminders
- PMS synchronization
- Subscription checks
- Review requests
- Reconciliation
- Image processing

Suggested architecture:

```text
API
 │
 └── Queue
      │
      ├── Booking worker
      ├── Payment worker
      ├── Notification worker
      ├── PMS sync worker
      └── Subscription worker
```

Redis + BullMQ is a practical starting point.

---

# 25. Notifications

## Email

- Booking confirmation
- Cancellation
- Payment receipt
- Hotel approval
- Subscription notifications
- Password reset
- Review request

## WhatsApp

Eventually:

> Your reservation at Example Hotel is confirmed.

Then:

> Your check-in is tomorrow.

After checkout:

> How was your stay?

## SMS

Use for high-value transactional situations where SMS adds meaningful reliability.

---

# 26. Admin Platform

Admin dashboard should include:

```text
Hotels                 482
Active                  421
Pending                  31
Suspended                30

Bookings              8,421

GMV                  ₦482m

Platform revenue      ₦41m
```

Admin actions:

- Approve hotels
- Reject hotels
- Verify documents
- Edit listings
- Suspend hotels
- Manage subscriptions
- Manage commissions
- Resolve disputes
- Issue/refund bookings
- Manage cities
- Feature hotels
- Moderate reviews
- View system activity

---

# 27. Hotel Ranking

Do not simply sort by price.

Potential ranking signals:

```text
availability
conversion rate
rating
review count
price competitiveness
response quality
cancellation rate
booking success
distance
```

Sponsored placement should be clearly distinguished from organic/recommended ranking.

Use:

> Sponsored

and:

> Recommended

as separate concepts.

---

# 28. Reviews

Only allow verified-stay reviews.

Flow:

```text
Booking
 ↓
Checked out
 ↓
Eligible for review
 ↓
Review
```

Review categories:

- Overall
- Cleanliness
- Location
- Service
- Value
- Facilities

This reduces fake reviews and makes ratings more trustworthy.

---

# 29. Location Architecture

Store more than just a city string.

Use:

```text
Country
State
City
Area
Latitude
Longitude
```

This enables:

> Hotels within 5km of Victoria Island.

or:

> Hotels near Lagos airport.

or:

> Hotels near a specific landmark.

---

# 30. Search Architecture

MVP:

**PostgreSQL + PostGIS + appropriate indexes**

Later:

```text
PostgreSQL
      +
OpenSearch/Elasticsearch
```

Advanced search can eventually support:

> Hotels near the airport with a pool under ₦100k.

---

# 31. Recommended Technology Stack

## Traveler Web

- Next.js
- React
- Tailwind CSS
- shadcn/ui

## Hotel Dashboard

Same frontend ecosystem.

## Backend

Recommended:

**NestJS**

Reasons:

- API-first architecture
- Integrations
- Webhooks
- Queues
- Workers
- Payments
- Modular services

## Database

**PostgreSQL**

with:

**Prisma**

## Cache / Queues

**Redis**

**BullMQ**

## Object Storage

S3-compatible object storage for:

- Hotel images
- Verification documents
- Other media

## Infrastructure

Possible structure:

```text
Vercel
   │
Traveler Web
Hotel Web
   │
   ▼
API
   │
AWS / Railway / Render / EC2
   │
 ┌─┴───────────────┐
Postgres          Redis
                    │
                  Workers
```

Because the platform will have booking, integration, webhook, and worker workloads, do not casually place the entire backend/database access pattern inside serverless functions without a deliberate connection-pooling strategy.

---

# 32. Core Database Entities

Recommended core entities:

```text
User
Hotel
HotelStaff
HotelVerification
HotelImage

RoomType
Room
RoomRate
Inventory
InventoryDay

Amenity
HotelAmenity

Booking
BookingGuest
BookingRoom
BookingPayment

Payment
Refund

Review

Subscription
SubscriptionPlan

Payout
LedgerEntry

Integration
IntegrationCredential
IntegrationMapping
WebhookEvent

City
State
Country

Promotion
Coupon
```

---

# 33. Core Relationship Model

```text
User
 │
 ├──────────────┐
 │              │
Traveler      Hotel
                │
         ┌──────┼────────┐
         │      │        │
      RoomType  Staff   Images
         │
       Room
         │
     Inventory
         │
       Booking
         │
      Payment
```

---

# 34. Inventory Schema Concept

Example:

```text
InventoryDay

id
roomTypeId
date
totalUnits
heldUnits
bookedUnits
availableUnits
```

Conceptually:

```text
total = 10
held = 2
booked = 5

available = 3
```

The actual source of truth should be protected by database transactions and concurrency controls rather than trusting a mutable `availableUnits` value.

---

# 35. Concurrency Protection

Critical scenario:

```text
Last room available: 1

Customer A → checkout
Customer B → checkout
```

Both cannot successfully reserve it.

Use PostgreSQL transactions and appropriate row-level locking/constraints.

Conceptually:

```text
BEGIN

lock inventory row

check availability

create hold

increment held units

COMMIT
```

Then payment proceeds.

A background worker releases expired holds.

---

# 36. Suggested API Modules

Structure the API into clear domains:

```text
/auth
/hotels
/rooms
/inventory
/search
/bookings
/payments
/subscriptions
/reviews
/integrations
/notifications
/admin
```

Internal services:

```text
AuthService
HotelService
InventoryService
AvailabilityService
BookingService
PaymentService
SettlementService
SubscriptionService
SearchService
IntegrationService
NotificationService
```

Avoid giant functions where booking logic directly handles payment, inventory, email, subscription, and hotel notification logic.

---

# 37. MVP Scope

## Include

### Hotel Side

- Registration
- Authentication
- Hotel onboarding
- Verification
- Hotel profile
- Images
- Amenities
- Room types
- Room inventory
- Pricing
- Availability
- Reservations
- Basic dashboard

### Traveler Side

- Registration/login
- Search
- City/state filtering
- Hotel listing
- Hotel details
- Room selection
- Availability
- Checkout
- Payment
- Booking confirmation
- Booking history

### Admin

- Hotel approval
- Hotel management
- Booking management
- Subscription management
- Commission configuration
- User management
- Basic analytics

### Payments

- Payment initialization
- Verification
- Webhooks
- Refund flow
- Settlement/reconciliation

---

# 38. Do NOT Build in MVP

Avoid:

- Native mobile apps
- Flights
- Car rentals
- Tour packages
- Loyalty points
- AI concierge
- Corporate travel
- Multi-country currencies
- 20 PMS integrations
- Full channel manager
- Hotel accounting
- Housekeeping management
- Restaurant POS

These are future expansion areas.

---

# 39. Development Roadmap

## Month 1 — Foundation

```text
Authentication
Roles
Hotel onboarding
Hotel verification
Hotel profile
Cities/states
Database
Admin
```

## Month 2 — Hotel Inventory

```text
Room types
Rooms
Pricing
Availability
Amenities
Images
Hotel dashboard
```

## Month 3 — Booking Engine

```text
Search
Hotel pages
Room selection
Availability
Reservation holds
Checkout
Booking state machine
```

## Month 4 — Payments + Marketplace

```text
Payment provider
Webhooks
Payment verification
Hotel settlement
Refunds
Receipts
Traveler bookings
```

## Month 5 — Product Polish

```text
Reviews
Notifications
Hotel analytics
Promotions
Featured listings
SEO
Performance
Security
```

## Month 6 — Integration Beta

Start with one PMS/integration partner.

```text
PMS
 ↓
Adapter
 ↓
Hotel OS
 ↓
Inventory
 ↓
Marketplace
```

Then recruit hotels.

---

# 40. Market Entry Strategy

Do not launch across every Nigerian city simultaneously.

Start with one city.

For example:

### Phase 1

Abuja

Target:

**20–30 hotels**

### Phase 2

Lagos

Target:

**50–100 hotels**

### Phase 3

Port Harcourt

### Phase 4

Uyo

### Phase 5

Kano

### Phase 6

Kaduna

Then expand nationally.

Your consumer positioning becomes:

> **Book verified hotels across Nigeria.**

---

# 41. First Hotel Sales Pitch

Do not sell it primarily as hotel management software.

Sell the outcome:

> **Get your hotel discovered and booked by travelers searching for accommodation in your city.**
>
> Hotel OS gives your hotel a digital booking page, inventory management, online reservations, payment collection, and distribution to travelers — without requiring you to replace your existing hotel system.

The ability to integrate with an existing PMS is a major selling point.

---

# 42. Long-Term Platform Architecture

Once you have meaningful hotel supply:

```text
                    HOTEL OS
                       │
        ┌──────────────┼───────────────┐
        │              │               │
   Marketplace       API          Distribution
        │              │               │
   Travelers       Travel apps     Agencies
        │              │               │
        └──────────────┼───────────────┘
                       │
                    Hotels
```

The long-term goal is not merely:

> "Another hotel booking website."

It is:

> **Hotel distribution infrastructure for Africa.**

---

# 43. Future Hotel API

Once the inventory network becomes large enough, third parties can consume your hotel inventory.

Potential endpoints:

```http
GET /v1/hotels?city=lagos

GET /v1/hotels/{id}

GET /v1/room-types/{id}/availability

POST /v1/reservations

POST /v1/reservations/{id}/cancel
```

Potential customers:

- Travel agencies
- Corporate travel platforms
- Tour operators
- Travel apps
- Other booking websites

This creates a second B2B revenue channel.

---

# 44. Business Model

Hotel OS can eventually have multiple revenue streams.

## A. Hotel Subscription

Monthly SaaS fee.

## B. Booking Commission

Percentage of completed bookings.

## C. Featured Listings

Hotels pay for sponsored placement.

## D. Enterprise PMS Integration

Charge larger hotels/properties for integration and advanced features.

## E. API Access

Travel businesses pay for access to your hotel inventory.

## F. Corporate Travel

Companies use Hotel OS for employee accommodation.

---

# 45. ₦10m+ Revenue Scenario

Example:

```text
100 hotels
× ₦50,000/month
= ₦5,000,000/month
```

Even at an average of ₦20,000/month:

```text
100 × ₦20,000
= ₦2,000,000/month
```

Booking commissions can sit on top of subscription revenue.

The long-term advantage is that the platform becomes a network:

> Hotels want access to travelers.

> Travelers want access to hotels.

> Hotel OS connects both sides.

---

# 46. Initial Success Metrics

Do not measure success by number of features.

Measure:

## Supply

**50 verified hotels**

## Inventory

**500+ bookable rooms**

## Demand

**1,000 registered travelers**

## Transactions

**100 successful bookings**

## Reliability

**0 double-bookings**

## Revenue

**At least 10 paying hotels**

If these numbers are achieved, the platform has evidence of real product-market potential.

---

# 47. Recommended MVP Strategy

Build the first version as a **web platform/PWA**, not native mobile applications.

Prioritize:

1. Hotel acquisition
2. Accurate inventory
3. Search/discovery
4. Reliable reservations
5. Payments
6. Hotel settlement
7. Marketplace demand
8. PMS integrations

Native apps should come after you have repeat traveler demand and enough booking activity to justify them.

---

# 48. Development Milestones

Do not give the entire six-month specification to an AI coding agent and ask it to build everything at once.

Use controlled milestones.

### Milestone 1

Foundation + authentication + database + hotel onboarding

### Milestone 2

Hotel dashboard + inventory

### Milestone 3

Traveler marketplace

### Milestone 4

Booking engine

### Milestone 5

Payments + settlement

### Milestone 6

Admin + subscriptions

### Milestone 7

PMS integration layer

### Milestone 8

Production hardening

---

# 49. Final Product Positioning

The strongest version of the idea is:

> **Hotel OS is a hotel distribution and booking infrastructure platform that allows hotels to manage or integrate their existing inventory while giving travelers a single marketplace to discover and reserve verified hotels across Nigeria.**

The MVP should prove one simple loop:

```text
HOTEL
  ↓
LISTS ROOMS
  ↓
INVENTORY AVAILABLE
  ↓
TRAVELER DISCOVERS HOTEL
  ↓
TRAVELER BOOKS
  ↓
PAYMENT
  ↓
HOTEL CONFIRMS
  ↓
ROOM RESERVED
  ↓
HOTEL GETS SETTLED
```

Once this loop works reliably, everything else becomes expansion.
