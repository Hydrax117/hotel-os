# LODGEN --- Product Requirements, Architecture, Database Schema, API Contracts & Kiro Implementation Specification

**Document:** `LODGEN-PRODUCT-SPECIFICATION.md`\
**Product:** Lodgen\
**Version:** 1.0\
**Date:** 14 November 2026\
**Initial market:** Nigeria\
**Product model:** Hybrid Hotel Operating System (Hotel OS) +
Hospitality Marketplace\
**Architecture principle:** Resource-based inventory and a unified
reservation engine

------------------------------------------------------------------------

## Document purpose

This document is the product and engineering source of truth for
building Lodgen. It is intended to be used by product, design, backend,
frontend, QA and AI coding agents working through Kiro.

It defines:

1.  Product requirements and scope.
2.  Resource-based inventory concepts and business rules.
3.  Technical architecture and system boundaries.
4.  Relational database design and a Prisma implementation baseline.
5.  REST API contracts and representative payloads.
6.  Security, reliability and operational requirements.
7.  Phased implementation backlog, acceptance criteria and Kiro
    specifications.

Implementation agents must follow this document. If an existing codebase
conflicts with it, document the conflict and propose a migration; do not
silently introduce a second inventory or booking model.

------------------------------------------------------------------------
# backend is locateded at cd .. cd hotel-os-api
# PART I --- PRODUCT REQUIREMENTS DOCUMENT

## 1. Product vision

Lodgen is a hospitality technology platform combining:

-   **Lodgen OS:** A property-management and hotel-operations system for
    accommodation providers and other hospitality businesses.
-   **Lodgen Marketplace:** A customer-facing platform for discovering
    properties, checking availability and booking accommodation or other
    bookable spaces.

The initial market is Nigeria. The architecture should support
additional countries, currencies, taxes, languages and payment providers
without redesigning the core domain.

### 1.1 Product goals

-   Give independent hotels and hotel groups one place to manage daily
    operations.
-   Let hotels manage physical inventory beyond bedrooms: suites,
    lounges, conference rooms, halls, private dining spaces and
    scheduled facilities.
-   Prevent double bookings across all booking channels.
-   Provide a consistent reservation experience for marketplace, direct,
    walk-in and staff-created bookings.
-   Let customers discover properties and book eligible resources.
-   Give hotel owners reliable operational and financial reporting.
-   Support multiple organizations and properties with strict tenant
    isolation.

### 1.2 Non-goals for the first release

Unless explicitly approved in a later product decision, the first
release will not attempt to provide:

-   Full payroll, statutory tax filing or enterprise HR.
-   Full restaurant POS, kitchen display or stock procurement.
-   Airline, transport or tour-operator inventory.
-   A complete channel manager with guaranteed two-way integrations to
    every OTA.
-   Dynamic AI revenue management.
-   A full accounting general ledger.
-   Offline creation of reservations with guaranteed conflict-free
    synchronization.

These may be future integrations or modules. Do not build placeholders
that complicate the core booking engine.

## 2. Core architecture decision: resource-based inventory

Lodgen must use one resource-based inventory model. It must not
implement a room-only booking system and later bolt on lounges or event
spaces.

### 2.1 Resource hierarchy

``` text
Platform
└── Organization
    ├── Organization members
    └── Property (hotel, resort, serviced apartment, venue)
        ├── Buildings
        │   └── Floors
        ├── Resource categories
        ├── Resources
        │   ├── Room 101
        │   ├── Room 102
        │   ├── VIP Lounge A
        │   └── Conference Hall
        ├── Rate plans
        ├── Availability rules
        ├── Reservations
        ├── Guests
        └── Operational tasks
```

A property may be a hotel, resort, serviced apartment, guest house or
standalone hospitality venue. An organization may own or operate one or
many properties.

### 2.2 Important domain distinctions

  --------------------------------------------------------------------------
  Concept                 Meaning                    Example
  ----------------------- -------------------------- -----------------------
  Resource type           System-level               Accommodation, event
                          behaviour/classification   space, facility

  Resource category       Property-defined           Standard Room, Deluxe
                          commercial grouping        Suite

  Resource                A specific physical or     Room 101, VIP Lounge A
                          capacity-managed inventory 
                          unit                       

  Resource group          Optional logical grouping  Ground-floor rooms
                          for organization and       
                          reporting                  

  Rate plan               Pricing and cancellation   Standard Flexible Rate
                          terms                      

  Reservation             Customer's                 Booking for Room 101
                          request/confirmed use of   
                          inventory                  

  Availability block      Prevents inventory from    Maintenance closure
                          being booked               
  --------------------------------------------------------------------------

**Room 101 and Room 102 are separate resources.** They may share a
category and rate plan, but their availability and operational status
are independent.

### 2.3 Resource types and booking models

The platform must support at least:

  -----------------------------------------------------------------------
  Resource type           Examples                Typical booking model
  ----------------------- ----------------------- -----------------------
  Accommodation           Rooms, suites,          Nightly
                          apartments              

  Hospitality space       VIP lounge, private     Hourly or daily
                          dining room             

  Event space             Conference room, event  Hourly or daily
                          hall                    

  Scheduled facility      Spa treatment room,     Scheduled slot
                          pool session            

  Non-bookable facility   General gym, shared     Not bookable
                          pool                    
  -----------------------------------------------------------------------

Booking models are configurable. The examples above are defaults, not
hard-coded restrictions.

Supported booking units:

-   `NIGHT`
-   `HOUR`
-   `DAY`
-   `SESSION`
-   `CUSTOM`

A resource can be operationally tracked without being bookable. For
example, a hotel can record a swimming pool, kitchen or gym as a
facility without exposing it to customers.

### 2.4 Resource fields

Each resource should support:

-   ID and property ID.
-   Resource name and unique property-level code (e.g. `101`,
    `VIP-LOUNGE-A`).
-   Resource type and category.
-   Description and photos.
-   Building and floor, where relevant.
-   Capacity and optional minimum capacity.
-   Bed configuration, where relevant.
-   Amenities and features.
-   Bookable / non-bookable setting.
-   Marketplace visibility setting.
-   Operational status.
-   Default booking unit and duration rules.
-   Default rate plan or pricing configuration.
-   Internal notes.
-   Created/updated timestamps and actor references.

Do not use one status field to represent every concern. Separate:

1.  **Lifecycle status:** `ACTIVE`, `INACTIVE`, `ARCHIVED`.
2.  **Operational status:** `READY`, `DIRTY`, `OCCUPIED`, `INSPECTION`,
    `MAINTENANCE`, `OUT_OF_SERVICE`.
3.  **Availability:** calculated from reservations, blocks, rules and
    capacity.
4.  **Marketplace visibility:** `PRIVATE`, `UNLISTED`, `PUBLIC`.

An operational status such as `DIRTY` should not automatically mean a
resource is permanently unavailable. It should be unavailable for a new
check-in until housekeeping marks it ready, while the availability
engine still considers existing reservations.

### 2.5 Capacity-based resources

The initial implementation should primarily support individually
identifiable resources, such as Room 101 or Conference Hall A.

The domain model should leave room for capacity-based inventory (for
example, 20 seats in a shared class or 30 pool-session slots). Do not
implement capacity allocation by creating fake rooms. Capacity-based
inventory should be a separately modelled allocation mode in a later
phase unless needed for the first launch.

### 2.6 Resource creation workflows

The OS must support:

-   Create one resource.
-   Bulk-create resources using a range or list (e.g. 101--110).
-   Assign resources to categories, floors and buildings.
-   Copy common attributes from a template.
-   Edit one resource without changing other resources.
-   Bulk update selected resources.
-   Deactivate/archive a resource while preserving historical
    reservations.
-   Import resources from CSV in a later release.

Bulk creation must validate duplicate codes within a property and show a
preview before saving.

## 3. User types, organizations and permissions

### 3.1 User types

-   Platform super administrator.
-   Organization owner.
-   Organization administrator.
-   Property manager.
-   Front-desk/reception staff.
-   Accountant/finance staff.
-   Housekeeping staff.
-   Maintenance staff.
-   Marketing/listing manager.
-   Marketplace customer.

A user may belong to multiple organizations or properties with different
roles.

### 3.2 Authorization model

Use role-based access control (RBAC) with permission checks on the
server.

Example permission namespaces:

-   `organization.read`, `organization.update`
-   `property.create`, `property.read`, `property.update`
-   `resource.create`, `resource.read`, `resource.update`,
    `resource.archive`
-   `reservation.create`, `reservation.read`, `reservation.update`,
    `reservation.cancel`
-   `guest.read`, `guest.update`
-   `payment.read`, `payment.collect`, `payment.refund`
-   `housekeeping.assign`, `housekeeping.complete`
-   `maintenance.create`, `maintenance.resolve`
-   `staff.invite`, `staff.manage`
-   `reports.read`

Frontend route guards are for usability only. Every API operation must
independently authorize the acting user against the organization,
property and resource.

### 3.3 Tenant isolation

-   Every organization-owned record must be scoped to an organization
    and/or property.
-   A user must not access another tenant's data by changing an ID in a
    URL or request body.
-   Resolve tenant context from authenticated membership, not from an
    untrusted `organizationId` alone.
-   For a property-scoped operation, verify that the user has an active
    membership granting access to that property.
-   Add automated cross-tenant authorization tests for all major
    resources.

## 4. Hotel OS functional modules

Priority definitions:

-   **P0:** Required for a usable initial launch.
-   **P1:** Important shortly after launch.
-   **P2:** Advanced capability / later release.

### 4.1 Organization and property management --- P0

Requirements:

-   Create an organization and one or more properties.
-   Configure property name, type, address, contact details, timezone,
    currency and check-in/check-out defaults.
-   Support Nigeria-first address and phone-number formats.
-   Upload property logo and photos.
-   Set marketplace listing state.
-   Configure property policies and customer-facing descriptions.
-   Keep organization-level settings distinct from property-level
    settings.

Acceptance criteria:

-   An organization can own multiple properties.
-   A property cannot be accessed by an unrelated organization.
-   A property has an explicit IANA timezone, e.g. `Africa/Lagos`.
-   Currency is stored as an ISO 4217 code, initially defaulting to
    `NGN` where appropriate.

### 4.2 Resource and inventory management --- P0

Requirements:

-   Manage resource types, categories, individual resources and optional
    building/floor structure.
-   Create individual and bulk resources.
-   Configure bookability, visibility, capacity and booking unit.
-   Manage photos, amenities, features and descriptions.
-   View resources in list, category and calendar layouts.
-   Filter by category, building, floor, operational status and
    bookability.
-   Create availability blocks for maintenance, private use or closure.
-   Keep resource lifecycle, operational status and reservation
    availability separate.

Acceptance criteria:

-   A manager can create Room 101 and Room 102 under Standard Room.
-   Booking Room 101 does not block Room 102.
-   A maintenance block prevents conflicting reservations.
-   A non-bookable facility cannot be reserved through public or staff
    booking APIs.
-   Archiving a resource does not delete its historical bookings or
    payments.

### 4.3 Availability and booking engine --- P0

Requirements:

-   One central availability service for all channels.
-   Support nightly, hourly, daily and session/custom booking units.
-   Calculate availability using reservations, holds, blocks,
    operational constraints and booking rules.
-   Validate start/end times, minimum/maximum duration and advance
    booking windows.
-   Support property-local timezones.
-   Prevent overlapping confirmed reservations for exclusive resources.
-   Support temporary booking holds with expiry for online checkout.
-   Release expired holds safely.
-   Revalidate availability immediately before confirmation/payment
    capture.
-   Use database transactions and concurrency-safe conflict prevention.

Acceptance criteria:

-   Two simultaneous requests cannot confirm the same exclusive resource
    for overlapping time.
-   A cancelled reservation releases inventory according to the
    cancellation workflow.
-   An expired hold no longer blocks inventory.
-   A reservation created through any channel is visible to all
    authorized channels.

### 4.4 Reservations and front desk --- P0

Requirements:

-   Create reservations from marketplace, direct website, staff entry
    and walk-in channels.
-   Search reservations by reference, guest, resource, date and status.
-   View daily arrivals, departures, in-house guests and upcoming
    reservations.
-   Modify dates, assigned resources, guest count and notes subject to
    availability and audit rules.
-   Cancel reservations and record reason.
-   Record no-shows.
-   Check guests in and out for accommodation reservations.
-   Support hourly/daily check-in and check-out workflows for other
    resource types where applicable.
-   Keep reservation status distinct from payment status.

Suggested reservation statuses:

`DRAFT`, `HELD`, `PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`,
`CHECKED_OUT`, `CANCELLED`, `NO_SHOW`, `EXPIRED`.

Not every resource type uses every status. For example, a conference
room booking does not need a hotel guest check-out state.

### 4.5 Guest management --- P0

Requirements:

-   Create and update guest profiles.
-   Store name, email, phone, country and optional address.
-   Store identification details only where operationally necessary and
    with restricted access.
-   Link guests to reservations.
-   View booking history and guest notes.
-   Support a primary guest and additional guests.
-   Avoid duplicate profiles where a reliable match exists; do not merge
    records automatically based only on similar names.

Privacy requirements:

-   Collect only necessary personal data.
-   Restrict sensitive identity fields.
-   Define retention and deletion policies.
-   Never expose guest details to public marketplace endpoints.

### 4.6 Payments and financial operations --- P0

Requirements:

-   Support payment records, deposits, balances, invoices, receipts and
    refunds.
-   Integrate with a payment provider through an adapter interface.
-   Initial provider can be Paystack or another approved provider after
    commercial and technical validation.
-   Support bank transfer, card and other provider-supported methods.
-   Record provider references and webhook events.
-   Verify webhook signatures.
-   Make webhook processing idempotent.
-   Reconcile provider transactions against Lodgen payment records.
-   Separate reservation amount, amount paid, amount refunded and amount
    outstanding.
-   Support platform commission and hotel settlement rules for
    marketplace bookings in a later milestone.

Never store raw card numbers, CVV or payment credentials.

### 4.7 Staff and access management --- P0

Requirements:

-   Invite staff by email or phone.
-   Assign organization/property roles.
-   Activate, suspend and remove access.
-   Record important staff actions.
-   Support multiple properties and role assignments.
-   Do not let a property manager grant platform-super-admin privileges.

### 4.8 Housekeeping --- P1

Requirements:

-   Create cleaning tasks from check-out, manual request or schedule.
-   Assign tasks to staff.
-   Track `PENDING`, `IN_PROGRESS`, `INSPECTION`, `COMPLETED`,
    `CANCELLED`.
-   Update resource operational status.
-   Record completion time and responsible staff member.
-   Notify front desk when a room becomes ready.

### 4.9 Maintenance --- P1

Requirements:

-   Create maintenance tickets for resources.
-   Set severity, description, assignee and due date.
-   Block a resource for the affected period when required.
-   Track ticket lifecycle and resolution notes.
-   Preserve the maintenance history.

### 4.10 Reporting --- P1

Initial reports:

-   Occupancy and availability.
-   Arrivals and departures.
-   Reservation production by channel.
-   Gross booking value.
-   Collected payments, refunds and outstanding balances.
-   Average Daily Rate (ADR) and Revenue Per Available Room (RevPAR) for
    accommodation resources only.
-   Resource utilization for hourly/daily spaces.
-   Cancellation and no-show rates.

Financial reports must use payment/ledger facts, not merely reservation
totals.

## 5. Lodgen Marketplace requirements

### 5.1 Customer capabilities --- P0

-   Browse published properties.
-   Search by destination, dates, guests and resource category.
-   View property details, photos, amenities, policies and location.
-   Search bookable resources and available rate plans.
-   View price breakdown before booking.
-   Create a booking and receive a confirmation/reference.
-   View and manage own reservations.
-   Cancel according to the applicable policy.
-   Receive booking and payment notifications.

### 5.2 Listing rules

A property/resource is publicly bookable only when:

-   The organization and property are active.
-   The listing is approved/published where moderation is enabled.
-   The resource is active, bookable and publicly visible.
-   The category and rate plan are valid.
-   Required content and pricing fields are complete.
-   The requested period is available.

### 5.3 Booking channels

All channels must call the same domain service:

-   Lodgen marketplace.
-   Hotel's own booking website/widget.
-   Staff-created booking.
-   Walk-in booking.
-   External OTA integration (later phase).

Never implement a separate availability algorithm for the marketplace
and Hotel OS.

------------------------------------------------------------------------

# PART II --- TECHNICAL ARCHITECTURE

## 6. Recommended technology baseline

This is a practical baseline, not a requirement to adopt a technology
that is already incompatible with the existing repository.

  -----------------------------------------------------------------------
  Layer                               Recommendation
  ----------------------------------- -----------------------------------
  Web application                     Next.js with TypeScript

  UI                                  Tailwind CSS and an accessible
                                      component system

  API                                 TypeScript REST API using a modular
                                      backend architecture

  Database                            PostgreSQL

  ORM                                 Prisma

  Validation                          Zod or equivalent shared schemas

  Authentication                      Auth.js or a dedicated
                                      authentication service

  Background jobs                     Redis-backed queue when
                                      asynchronous workload requires it

  Realtime                            WebSockets or server-sent events
                                      for live operational updates

  File storage                        S3-compatible object storage

  Payments                            Provider adapter; validate Paystack
                                      and alternatives

  Email                               Transactional email provider
                                      adapter

  SMS/WhatsApp                        Provider adapter, introduced as
                                      needed

  Monitoring                          Structured logs, error tracking and
                                      uptime monitoring

  Testing                             Unit, integration, API and browser
                                      end-to-end tests
  -----------------------------------------------------------------------

### 6.1 Architectural style

Start with a **modular monolith**, not microservices.

The product needs strong transactional consistency across resources,
availability, reservations and payments. A modular monolith is easier to
develop, deploy and operate initially while preserving clear module
boundaries.

Suggested backend modules:

``` text
src/
  modules/
    auth/
    organizations/
    properties/
    memberships/
    resources/
    categories/
    availability/
    rate-plans/
    reservations/
    guests/
    payments/
    refunds/
    housekeeping/
    maintenance/
    marketplace/
    notifications/
    reports/
    audit/
  shared/
    database/
    errors/
    events/
    policies/
    validation/
    money/
    time/
```

Each module owns its domain logic. Modules must not bypass another
module's service by writing directly to its tables when business rules
are involved.

### 6.2 Logical architecture

``` text
Customer Marketplace ─────┐
Hotel OS Dashboard ────────┼── API / Application Layer
Hotel Website Widget ──────┤          │
Staff / Front Desk ────────┘          │
                                      ├── Identity & Authorization
                                      ├── Organization / Property
                                      ├── Resource Inventory
                                      ├── Availability Engine
                                      ├── Reservation Engine
                                      ├── Guest Management
                                      ├── Payment Orchestration
                                      ├── Housekeeping / Maintenance
                                      ├── Marketplace
                                      └── Reporting / Notifications
                                               │
                                      PostgreSQL Database
                                               │
                              Queue / Object Storage / Providers
```

### 6.3 Core engineering rules

1.  PostgreSQL is the source of truth for reservations and inventory.
2.  Use database transactions for reservation state changes and payment
    state changes.
3.  Use idempotency keys for externally retried write operations.
4.  Use an outbox pattern for reliable domain-event publication when
    asynchronous processing is introduced.
5.  Treat payment webhooks as at-least-once delivery.
6.  Store timestamps in UTC; retain the property's IANA timezone for
    display and local business rules.
7.  Store money in integer minor units (kobo for NGN) with an explicit
    currency code. Never use floating-point numbers for money.
8.  Use UUIDs for externally exposed entity IDs.
9.  Use soft deletion or archival for records that must remain
    auditable.
10. Keep provider-specific logic behind adapters.

## 7. Reservation and availability design

This is the most sensitive subsystem in Lodgen.

### 7.1 Exclusive resource booking

For a specific physical room or exclusive space, only one active
reservation may overlap another active reservation for the same
resource.

Use half-open intervals:

`[startAt, endAt)`

This means a reservation ending at 11:00 does not conflict with another
starting at 11:00, subject to the property's turnover/check-in rules.

### 7.2 Availability inputs

Availability must consider:

-   Resource active/bookable state.
-   Marketplace visibility for public searches.
-   Reservation states that consume inventory.
-   Active booking holds.
-   Availability blocks.
-   Maintenance/out-of-service periods.
-   Resource-specific booking rules.
-   Lead time and advance booking window.
-   Minimum/maximum duration.
-   Capacity and guest count.
-   Property-local operational constraints.

### 7.3 Holds and confirmation

Recommended online flow:

1.  Customer searches availability.
2.  API returns eligible resources/rates and a quote.
3.  Customer requests a hold.
4.  Server revalidates availability and creates a time-limited hold.
5.  Customer initiates payment.
6.  Payment provider processes the transaction.
7.  Verified webhook updates payment state.
8.  Reservation is confirmed only after the required payment condition
    is satisfied.
9.  If payment fails or the hold expires, release the inventory safely.

The hold duration is configurable. Start with a short configurable
duration (for example, 10 minutes) and measure checkout completion
before changing it.

### 7.4 Concurrency protection

Do not rely on frontend checks or a simple "query then insert" sequence.

For PostgreSQL, use a transaction and a database-level conflict
strategy. For exclusive resources, a PostgreSQL exclusion constraint
over a timestamp range is a strong option:

``` sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Illustrative migration. Adapt table and enum names to the final schema.
ALTER TABLE reservation_allocations
ADD CONSTRAINT no_overlapping_active_resource_allocations
EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(start_at, end_at, '[)') WITH &&
)
WHERE (consumes_inventory = TRUE);
```

The final migration must account for the actual reservation status model
and must be tested against the selected Prisma/PostgreSQL versions. If
the ORM cannot express the constraint, add it in a hand-written SQL
migration.

### 7.5 Reservation allocation model

A reservation may contain one or more line items. Each line item may
allocate one or more resources. Use a separate allocation table to
record the actual resource and occupied interval.

This supports:

-   One reservation with multiple rooms.
-   One reservation containing a room and a conference room.
-   Resource reassignment with audit history.
-   Future capacity-based allocations without forcing all resources into
    room semantics.

For the initial launch, each exclusive resource allocation consumes one
physical resource.

------------------------------------------------------------------------

# PART III --- DATABASE DESIGN

## 8. Database conventions

-   PostgreSQL.
-   UUID primary keys.
-   `created_at` and `updated_at` timestamps.
-   UTC timestamps in storage.
-   `Decimal` only where a decimal quantity is genuinely needed; money
    uses integer minor units.
-   Explicit currency code on all monetary records.
-   Foreign keys and unique constraints for integrity.
-   Index all foreign keys and common search/filter fields.
-   Use database transactions for multi-record domain operations.
-   Keep historical financial and reservation records immutable where
    practical.

## 9. Entity relationship overview

``` text
User ──< OrganizationMembership >── Organization
User ──< PropertyMembership >────── Property
Organization ──< Property

Property ──< Building ──< Floor
Property ──< ResourceCategory
Property ──< Resource
ResourceType ──< Resource
ResourceCategory ──< Resource

Property ──< RatePlan
ResourceCategory ──< RatePlan (optional)

Guest ──< Reservation
Reservation ──< ReservationItem
ReservationItem ──< ReservationAllocation >── Resource
Resource ──< AvailabilityBlock

Reservation ──< Payment
Payment ──< Refund
Reservation ──< ReservationStatusHistory

Resource ──< HousekeepingTask
Resource ──< MaintenanceTicket

User ──< AuditLog
Property ──< AuditLog
```

## 10. Core tables

### 10.1 Identity and tenancy

#### `users`

  Column              Type          Notes
  ------------------- ------------- ------------------------------------------
  id                  UUID          Primary key
  email               VARCHAR       Nullable if phone-only auth is supported
  phone               VARCHAR       E.164 normalized
  full_name           VARCHAR       
  password_hash       VARCHAR       Nullable for passwordless auth
  status              ENUM          ACTIVE, INVITED, SUSPENDED
  email_verified_at   TIMESTAMPTZ   Nullable
  phone_verified_at   TIMESTAMPTZ   Nullable
  created_at          TIMESTAMPTZ   
  updated_at          TIMESTAMPTZ   

Unique constraints should be applied to normalized email/phone according
to the authentication policy.

#### `organizations`

  Column          Type          Notes
  --------------- ------------- -----------------------------
  id              UUID          Primary key
  name            VARCHAR       Legal/business display name
  slug            VARCHAR       Unique
  owner_user_id   UUID          FK users
  status          ENUM          ACTIVE, SUSPENDED, CLOSED
  created_at      TIMESTAMPTZ   
  updated_at      TIMESTAMPTZ   

#### `organization_memberships`

  Column            Type          Notes
  ----------------- ------------- ----------------------------
  id                UUID          Primary key
  organization_id   UUID          FK
  user_id           UUID          FK
  role              ENUM          OWNER, ADMIN, MEMBER
  status            ENUM          INVITED, ACTIVE, SUSPENDED
  created_at        TIMESTAMPTZ   

Unique `(organization_id, user_id)`.

#### `properties`

  -----------------------------------------------------------------------
  Column                  Type                    Notes
  ----------------------- ----------------------- -----------------------
  id                      UUID                    Primary key

  organization_id         UUID                    FK

  name                    VARCHAR                 

  slug                    VARCHAR                 Unique within agreed
                                                  scope

  property_type           ENUM                    HOTEL, RESORT,
                                                  GUEST_HOUSE,
                                                  SERVICED_APARTMENT,
                                                  VENUE

  description             TEXT                    

  email                   VARCHAR                 

  phone                   VARCHAR                 

  address_line_1          VARCHAR                 

  address_line_2          VARCHAR                 Nullable

  city                    VARCHAR                 

  state                   VARCHAR                 

  country_code            CHAR(2)                 ISO country code

  timezone                VARCHAR                 IANA timezone

  currency                CHAR(3)                 ISO 4217

  check_in_time           TIME                    Nullable

  check_out_time          TIME                    Nullable

  marketplace_status      ENUM                    DRAFT, PENDING_REVIEW,
                                                  PUBLISHED, SUSPENDED

  created_at              TIMESTAMPTZ             

  updated_at              TIMESTAMPTZ             
  -----------------------------------------------------------------------

#### `property_memberships`

Property-scoped access for staff. Include `property_id`, `user_id`,
`role`, `status`, timestamps and a unique `(property_id, user_id)`
constraint. A user can have different roles at different properties.

### 10.2 Property structure

#### `buildings`

`id`, `property_id`, `name`, `code`, `created_at`, `updated_at`.

Unique `(property_id, code)`.

#### `floors`

`id`, `property_id`, `building_id`, `name`, `level_number`, timestamps.

Validate that the building belongs to the same property.

### 10.3 Resource inventory

#### `resource_types`

System-defined types. Seed initial values:

-   `ACCOMMODATION`
-   `HOSPITALITY_SPACE`
-   `EVENT_SPACE`
-   `SCHEDULED_FACILITY`
-   `GENERAL_FACILITY`

Fields: `id`, `code` (unique), `name`, `description`,
`default_bookable`, `created_at`.

Do not allow individual hotels to redefine system behaviour by changing
a global type.

#### `resource_categories`

Property-defined categories such as Standard Room, Deluxe Room, VIP
Suite and Conference Hall.

Fields:

-   `id`
-   `property_id`
-   `resource_type_id`
-   `name`
-   `code`
-   `description`
-   `default_booking_unit`
-   `default_capacity`
-   `default_minimum_duration_minutes`
-   `default_maximum_duration_minutes`
-   `is_active`
-   timestamps

Unique `(property_id, code)`.

#### `resources`

Represents the actual physical or separately managed inventory unit.

  --------------------------------------------------------------------------
  Column                     Type                    Notes
  -------------------------- ----------------------- -----------------------
  id                         UUID                    Primary key

  property_id                UUID                    FK

  resource_type_id           UUID                    FK

  resource_category_id       UUID                    FK

  building_id                UUID                    Nullable FK

  floor_id                   UUID                    Nullable FK

  name                       VARCHAR                 e.g. Room 101

  code                       VARCHAR                 e.g. 101; unique within
                                                     property

  description                TEXT                    

  booking_unit               ENUM                    NIGHT, HOUR, DAY,
                                                     SESSION, CUSTOM

  is_bookable                BOOLEAN                 

  marketplace_visibility     ENUM                    PRIVATE, UNLISTED,
                                                     PUBLIC

  lifecycle_status           ENUM                    ACTIVE, INACTIVE,
                                                     ARCHIVED

  operational_status         ENUM                    READY, DIRTY, OCCUPIED,
                                                     INSPECTION,
                                                     MAINTENANCE,
                                                     OUT_OF_SERVICE

  capacity                   INTEGER                 Positive where relevant

  minimum_capacity           INTEGER                 Nullable

  minimum_duration_minutes   INTEGER                 Nullable

  maximum_duration_minutes   INTEGER                 Nullable

  buffer_before_minutes      INTEGER                 Default 0

  buffer_after_minutes       INTEGER                 Default 0

  attributes                 JSONB                   Flexible non-critical
                                                     attributes

  created_at                 TIMESTAMPTZ             

  updated_at                 TIMESTAMPTZ             

  archived_at                TIMESTAMPTZ             Nullable
  --------------------------------------------------------------------------

Unique `(property_id, code)`. Validate that category, type, building and
floor belong to the same property.

Do not store availability as a manually editable boolean. Availability
is computed from reservations, holds, blocks and rules.

#### `resource_photos`

`id`, `resource_id`, `storage_key`, `url` (or storage reference),
`alt_text`, `sort_order`, timestamps.

#### `amenities`

`id`, `name`, `slug`, `icon_key`, `created_at`.

#### `resource_amenities`

Join table with `resource_id`, `amenity_id`; unique pair.

### 10.4 Pricing and rate plans

#### `rate_plans`

-   `id`
-   `property_id`
-   `resource_category_id` (nullable if property-wide)
-   `name`
-   `code`
-   `booking_unit`
-   `currency`
-   `base_amount_minor`
-   `deposit_type`
-   `deposit_value`
-   `cancellation_policy`
-   `is_refundable`
-   `is_active`
-   timestamps

#### `resource_rate_overrides`

Optional resource-specific price override: `id`, `resource_id`,
`rate_plan_id`, `amount_minor`, `valid_from`, `valid_to`, timestamps.

Future pricing tables may add seasonal rules, day-of-week prices,
occupancy-based prices, taxes and fees. Keep the first release simple
but do not hard-code a single global room price.

### 10.5 Availability

#### `availability_blocks`

-   `id`
-   `property_id`
-   `resource_id`
-   `start_at`
-   `end_at`
-   `reason` (MAINTENANCE, PRIVATE_USE, OWNER_USE, CLOSURE, OTHER)
-   `notes`
-   `created_by_user_id`
-   `created_at`

Require `start_at < end_at`. Blocks must be checked by the same
availability engine as reservations.

#### `booking_holds`

-   `id`
-   `property_id`
-   `resource_id`
-   `customer_user_id` (nullable for guest checkout)
-   `hold_token_hash`
-   `start_at`
-   `end_at`
-   `expires_at`
-   `status` (ACTIVE, CONVERTED, RELEASED, EXPIRED)
-   `created_at`

Never store a raw secret hold token. Store a secure hash or equivalent
verifier.

### 10.6 Guests and reservations

#### `guests`

-   `id`
-   `property_id`
-   `user_id` (nullable)
-   `first_name`
-   `last_name`
-   `email`
-   `phone`
-   `country_code`
-   `address` (nullable)
-   `notes` (restricted)
-   timestamps

Guest records should be property-scoped initially. A later guest
identity layer can support cross-property recognition with explicit
privacy controls.

#### `reservations`

  -----------------------------------------------------------------------
  Column                  Type                    Notes
  ----------------------- ----------------------- -----------------------
  id                      UUID                    Primary key

  property_id             UUID                    FK

  guest_id                UUID                    FK

  reservation_reference   VARCHAR                 Human-friendly unique
                                                  reference

  channel                 ENUM                    MARKETPLACE, DIRECT,
                                                  WALK_IN, STAFF, OTA

  status                  ENUM                    DRAFT, HELD,
                                                  PENDING_PAYMENT,
                                                  CONFIRMED, CHECKED_IN,
                                                  CHECKED_OUT, CANCELLED,
                                                  NO_SHOW, EXPIRED

  currency                CHAR(3)                 

  subtotal_minor          BIGINT                  

  discount_minor          BIGINT                  Default 0

  tax_minor               BIGINT                  Default 0

  fee_minor               BIGINT                  Default 0

  total_minor             BIGINT                  

  amount_paid_minor       BIGINT                  Derived/maintained
                                                  transactionally

  amount_refunded_minor   BIGINT                  Derived/maintained
                                                  transactionally

  special_requests        TEXT                    

  internal_notes          TEXT                    Staff-only

  source_reference        VARCHAR                 Nullable external
                                                  source

  created_by_user_id      UUID                    Nullable for
                                                  customer/automation

  confirmed_at            TIMESTAMPTZ             Nullable

  cancelled_at            TIMESTAMPTZ             Nullable

  created_at              TIMESTAMPTZ             

  updated_at              TIMESTAMPTZ             
  -----------------------------------------------------------------------

Use a generated reference that is unique and does not expose sequential
database IDs.

#### `reservation_items`

Each reservation may contain multiple items.

Fields:

-   `id`
-   `reservation_id`
-   `resource_category_id`
-   `rate_plan_id`
-   `description_snapshot`
-   `booking_unit`
-   `quantity`
-   `start_at`
-   `end_at`
-   `guest_count`
-   `unit_amount_minor`
-   `subtotal_minor`
-   `tax_minor`
-   `total_minor`
-   timestamps

Store snapshots of commercial terms so later rate-plan edits do not
rewrite historical bookings.

#### `reservation_allocations`

Connects an item to actual resources.

Fields:

-   `id`
-   `reservation_item_id`
-   `resource_id`
-   `start_at`
-   `end_at`
-   `consumes_inventory`
-   `allocation_status`
-   timestamps

For exclusive inventory, one active allocation consumes one resource
over a time interval. This table is the key to preventing overlap.

#### `reservation_status_history`

`id`, `reservation_id`, `from_status`, `to_status`, `reason`,
`changed_by_user_id`, `created_at`.

#### `reservation_guests`

Join table for additional guests: `reservation_id`, `guest_id`,
`guest_role`, timestamps.

### 10.7 Payments and refunds

#### `payments`

-   `id`
-   `reservation_id`
-   `property_id`
-   `provider`
-   `provider_reference`
-   `idempotency_key`
-   `amount_minor`
-   `currency`
-   `status` (INITIATED, PENDING, SUCCEEDED, FAILED, CANCELLED,
    REVERSED)
-   `payment_method`
-   `paid_at`
-   `raw_provider_metadata` (restricted JSON; never include card
    secrets)
-   timestamps

Unique provider reference where present. Enforce idempotency for payment
initiation.

#### `refunds`

-   `id`
-   `payment_id`
-   `provider_reference`
-   `amount_minor`
-   `reason`
-   `status` (PENDING, SUCCEEDED, FAILED)
-   `created_by_user_id`
-   timestamps

#### `payment_webhook_events`

Store provider, provider event ID, signature verification result,
processing status, received timestamp and safe payload metadata. Unique
`(provider, provider_event_id)` to prevent duplicate processing.

### 10.8 Operations

#### `housekeeping_tasks`

`id`, `property_id`, `resource_id`, `assigned_to_user_id`, `task_type`,
`status`, `priority`, `due_at`, `started_at`, `completed_at`, `notes`,
timestamps.

#### `maintenance_tickets`

`id`, `property_id`, `resource_id`, `reported_by_user_id`,
`assigned_to_user_id`, `title`, `description`, `severity`, `status`,
`blocks_resource`, `start_at`, `end_at`, `resolved_at`, timestamps.

#### `notifications`

`id`, `user_id`, `property_id`, `channel`, `template_key`, `status`,
`payload`, `sent_at`, timestamps.

#### `audit_logs`

`id`, `organization_id`, `property_id`, `actor_user_id`, `action`,
`entity_type`, `entity_id`, `before_data`, `after_data`, `ip_address`,
`user_agent`, `created_at`.

Do not place passwords, access tokens, full payment credentials or
unnecessary identity data in audit JSON.

## 11. Prisma schema baseline

The following is a domain-model starting point. It is not a substitute
for the complete migrations, database constraints or application
validation described above. Use the Prisma version already selected by
the repository and verify generated-client compatibility.

``` prisma
enum PropertyType {
  HOTEL
  RESORT
  GUEST_HOUSE
  SERVICED_APARTMENT
  VENUE
}

enum BookingUnit {
  NIGHT
  HOUR
  DAY
  SESSION
  CUSTOM
}

enum ResourceLifecycleStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum ResourceOperationalStatus {
  READY
  DIRTY
  OCCUPIED
  INSPECTION
  MAINTENANCE
  OUT_OF_SERVICE
}

enum MarketplaceVisibility {
  PRIVATE
  UNLISTED
  PUBLIC
}

enum ReservationStatus {
  DRAFT
  HELD
  PENDING_PAYMENT
  CONFIRMED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  NO_SHOW
  EXPIRED
}

enum ReservationChannel {
  MARKETPLACE
  DIRECT
  WALK_IN
  STAFF
  OTA
}

model Organization {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  slug        String   @unique
  properties  Property[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("organizations")
}

model Property {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  name           String
  slug           String
  propertyType   PropertyType @map("property_type")
  timezone       String
  currency       String       @db.Char(3)
  countryCode    String       @db.Char(2) @map("country_code")
  resources      Resource[]
  categories     ResourceCategory[]
  reservations   Reservation[]
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, slug])
  @@index([organizationId])
  @@map("properties")
}

model ResourceType {
  id          String @id @default(uuid()) @db.Uuid
  code        String @unique
  name        String
  description String?
  categories  ResourceCategory[]

  @@map("resource_types")
}

model ResourceCategory {
  id             String @id @default(uuid()) @db.Uuid
  propertyId     String @map("property_id") @db.Uuid
  resourceTypeId String @map("resource_type_id") @db.Uuid
  name           String
  code           String
  defaultBookingUnit BookingUnit @map("default_booking_unit")
  isActive       Boolean @default(true) @map("is_active")
  resources      Resource[]
  property       Property @relation(fields: [propertyId], references: [id])
  resourceType   ResourceType @relation(fields: [resourceTypeId], references: [id])

  @@unique([propertyId, code])
  @@index([propertyId, resourceTypeId])
  @@map("resource_categories")
}

model Resource {
  id                   String @id @default(uuid()) @db.Uuid
  propertyId           String @map("property_id") @db.Uuid
  resourceCategoryId   String @map("resource_category_id") @db.Uuid
  name                 String
  code                 String
  bookingUnit          BookingUnit @map("booking_unit")
  isBookable            Boolean @default(true) @map("is_bookable")
  marketplaceVisibility MarketplaceVisibility @default(PRIVATE) @map("marketplace_visibility")
  lifecycleStatus      ResourceLifecycleStatus @default(ACTIVE) @map("lifecycle_status")
  operationalStatus    ResourceOperationalStatus @default(READY) @map("operational_status")
  capacity             Int?
  attributes           Json?
  property             Property @relation(fields: [propertyId], references: [id])
  category             ResourceCategory @relation(fields: [resourceCategoryId], references: [id])
  allocations           ReservationAllocation[]
  availabilityBlocks   AvailabilityBlock[]
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  @@unique([propertyId, code])
  @@index([propertyId, resourceCategoryId])
  @@index([propertyId, lifecycleStatus, isBookable])
  @@map("resources")
}

model Guest {
  id           String @id @default(uuid()) @db.Uuid
  propertyId   String @map("property_id") @db.Uuid
  firstName    String @map("first_name")
  lastName     String @map("last_name")
  email        String?
  phone        String?
  reservations Reservation[]
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([propertyId, email])
  @@index([propertyId, phone])
  @@map("guests")
}

model Reservation {
  id                 String @id @default(uuid()) @db.Uuid
  propertyId         String @map("property_id") @db.Uuid
  guestId            String @map("guest_id") @db.Uuid
  reservationReference String @unique @map("reservation_reference")
  channel            ReservationChannel
  status             ReservationStatus @default(DRAFT)
  currency           String @db.Char(3)
  subtotalMinor      BigInt @map("subtotal_minor")
  totalMinor         BigInt @map("total_minor")
  amountPaidMinor    BigInt @default(0) @map("amount_paid_minor")
  amountRefundedMinor BigInt @default(0) @map("amount_refunded_minor")
  property           Property @relation(fields: [propertyId], references: [id])
  guest              Guest @relation(fields: [guestId], references: [id])
  items              ReservationItem[]
  payments           Payment[]
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  @@index([propertyId, status, createdAt])
  @@index([propertyId, guestId])
  @@map("reservations")
}

model ReservationItem {
  id             String @id @default(uuid()) @db.Uuid
  reservationId  String @map("reservation_id") @db.Uuid
  bookingUnit    BookingUnit @map("booking_unit")
  quantity       Int
  startAt        DateTime @map("start_at") @db.Timestamptz
  endAt          DateTime @map("end_at") @db.Timestamptz
  totalMinor     BigInt @map("total_minor")
  reservation    Reservation @relation(fields: [reservationId], references: [id])
  allocations    ReservationAllocation[]

  @@index([reservationId])
  @@map("reservation_items")
}

model ReservationAllocation {
  id                String @id @default(uuid()) @db.Uuid
  reservationItemId String @map("reservation_item_id") @db.Uuid
  resourceId        String @map("resource_id") @db.Uuid
  startAt           DateTime @map("start_at") @db.Timestamptz
  endAt             DateTime @map("end_at") @db.Timestamptz
  consumesInventory Boolean @default(true) @map("consumes_inventory")
  reservationItem   ReservationItem @relation(fields: [reservationItemId], references: [id])
  resource          Resource @relation(fields: [resourceId], references: [id])

  @@index([resourceId, startAt, endAt])
  @@map("reservation_allocations")
}

model AvailabilityBlock {
  id         String @id @default(uuid()) @db.Uuid
  propertyId String @map("property_id") @db.Uuid
  resourceId String @map("resource_id") @db.Uuid
  startAt    DateTime @map("start_at") @db.Timestamptz
  endAt      DateTime @map("end_at") @db.Timestamptz
  reason     String
  notes      String?
  resource   Resource @relation(fields: [resourceId], references: [id])
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([resourceId, startAt, endAt])
  @@map("availability_blocks")
}

model Payment {
  id                String @id @default(uuid()) @db.Uuid
  reservationId     String @map("reservation_id") @db.Uuid
  provider          String
  providerReference String? @map("provider_reference")
  amountMinor       BigInt @map("amount_minor")
  currency          String @db.Char(3)
  status            String
  reservation       Reservation @relation(fields: [reservationId], references: [id])
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@index([reservationId, status])
  @@unique([provider, providerReference])
  @@map("payments")
}
```

Implementation notes:

-   Expand this baseline with the remaining tables in section 10 before
    production.
-   Add all enums, relations, indexes and delete behaviours
    deliberately.
-   Add property-consistency validation in services and, where
    practical, composite foreign keys or database constraints.
-   Add the PostgreSQL overlap exclusion constraint using a custom SQL
    migration.
-   Use `BigInt` consistently for minor currency units; serialize it as
    a string in JSON.
-   Do not use `onDelete: Cascade` for historical reservations,
    payments, audit logs or financial records.
-   Ensure the generated Prisma schema validates and migrations run
    against the actual PostgreSQL version.

------------------------------------------------------------------------

# PART IV --- API CONTRACTS

## 12. API conventions

Base path:

`/api/v1`

Format: JSON over HTTPS.

Authentication: secure session cookie or bearer token according to the
chosen auth implementation.

### 12.1 Standard success response

``` json
{
  "data": {},
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-11-14T09:00:00.000Z"
  }
}
```

### 12.2 Standard error response

``` json
{
  "error": {
    "code": "RESOURCE_UNAVAILABLE",
    "message": "The selected resource is unavailable for the requested period.",
    "details": [],
    "requestId": "req_123"
  }
}
```

### 12.3 Pagination

Use cursor pagination for large collections:

`?limit=20&cursor=<opaque-cursor>`

Response:

``` json
{
  "data": [],
  "meta": {
    "nextCursor": "opaque-cursor",
    "hasMore": true
  }
}
```

### 12.4 General API rules

-   Validate all inputs server-side.
-   Return appropriate HTTP status codes.
-   Use `409 Conflict` for inventory conflicts and invalid state
    transitions.
-   Use `422 Unprocessable Entity` for semantically invalid input.
-   Use `401` for unauthenticated requests and `403` for unauthorized
    requests.
-   Use idempotency keys for reservation creation/confirmation and
    payment operations.
-   Never trust price, total, payment status, organization or property
    ownership supplied by a client.
-   The server calculates quotes and totals.
-   Use ISO 8601 timestamps with timezone offsets in requests; normalize
    to UTC.
-   Use currency codes and integer minor units. Serialize large integer
    values as strings.

## 13. Authentication and organization APIs

  Method   Endpoint                                       Purpose
  -------- ---------------------------------------------- ------------------------------
  POST     `/auth/register`                               Register user
  POST     `/auth/login`                                  Authenticate
  POST     `/auth/logout`                                 End session
  GET      `/auth/me`                                     Current user and memberships
  POST     `/organizations`                               Create organization
  GET      `/organizations`                               List user's organizations
  GET      `/organizations/:organizationId`               Organization details
  PATCH    `/organizations/:organizationId`               Update organization
  POST     `/organizations/:organizationId/invitations`   Invite member
  GET      `/organizations/:organizationId/members`       List members

## 14. Property APIs

  Method   Endpoint                                      Purpose
  -------- --------------------------------------------- ----------------------------
  POST     `/organizations/:organizationId/properties`   Create property
  GET      `/properties`                                 List accessible properties
  GET      `/properties/:propertyId`                     Property details
  PATCH    `/properties/:propertyId`                     Update property
  GET      `/properties/:propertyId/settings`            Get settings
  PATCH    `/properties/:propertyId/settings`            Update settings
  POST     `/properties/:propertyId/publish`             Submit/publish listing

## 15. Resource APIs

  -----------------------------------------------------------------------------------------------
  Method                  Endpoint                                        Purpose
  ----------------------- ----------------------------------------------- -----------------------
  GET                     `/properties/:propertyId/resource-types`        List system resource
                                                                          types

  GET                     `/properties/:propertyId/resource-categories`   List categories

  POST                    `/properties/:propertyId/resource-categories`   Create category

  PATCH                   `/resource-categories/:categoryId`              Update category

  GET                     `/properties/:propertyId/resources`             List/filter resources

  POST                    `/properties/:propertyId/resources`             Create resource

  POST                    `/properties/:propertyId/resources/bulk`        Bulk-create resources

  GET                     `/resources/:resourceId`                        Resource details

  PATCH                   `/resources/:resourceId`                        Update resource

  POST                    `/resources/:resourceId/archive`                Archive resource

  PATCH                   `/resources/:resourceId/operational-status`     Update operational
                                                                          status

  POST                    `/resources/:resourceId/photos`                 Attach photo metadata

  POST                    `/resources/:resourceId/availability-blocks`    Block resource

  GET                     `/resources/:resourceId/availability-blocks`    List blocks

  DELETE                  `/availability-blocks/:blockId`                 Remove block
  -----------------------------------------------------------------------------------------------

### 15.1 Create resource request

`POST /api/v1/properties/{propertyId}/resources`

``` json
{
  "name": "Room 101",
  "code": "101",
  "resourceTypeCode": "ACCOMMODATION",
  "categoryId": "uuid",
  "bookingUnit": "NIGHT",
  "isBookable": true,
  "marketplaceVisibility": "PUBLIC",
  "capacity": 2,
  "buildingId": "uuid",
  "floorId": "uuid",
  "attributes": {
    "bedConfiguration": "KING",
    "bathroom": "PRIVATE"
  }
}
```

Response: `201 Created`, with the persisted resource. The server must
verify that the category, building and floor belong to the requested
property.

### 15.2 Bulk-create resources request

`POST /api/v1/properties/{propertyId}/resources/bulk`

``` json
{
  "categoryId": "uuid",
  "resourceTypeCode": "ACCOMMODATION",
  "bookingUnit": "NIGHT",
  "isBookable": true,
  "marketplaceVisibility": "PUBLIC",
  "resources": [
    { "name": "Room 101", "code": "101", "capacity": 2 },
    { "name": "Room 102", "code": "102", "capacity": 2 },
    { "name": "Room 103", "code": "103", "capacity": 2 }
  ]
}
```

Bulk-create requirements:

-   Validate all rows before insertion.
-   Detect duplicates within the request and existing property
    inventory.
-   Default to all-or-nothing transactional creation.
-   Return row-level validation errors without partially creating
    resources.
-   Support a preview/validation endpoint before commit if the UI needs
    it.

## 16. Availability and quote APIs

  Method   Endpoint                                 Purpose
  -------- ---------------------------------------- -------------------------------
  GET      `/properties/:propertyId/availability`   Search availability
  POST     `/availability/quote`                    Calculate authoritative quote
  POST     `/availability/holds`                    Create temporary hold
  GET      `/availability/holds/:holdId`            Get hold status
  DELETE   `/availability/holds/:holdId`            Release hold

### 16.1 Availability query

`GET /api/v1/properties/{propertyId}/availability?startAt=...&endAt=...&categoryId=...&guestCount=2`

The API returns only eligible resources/categories based on the caller's
visibility and booking rules. Public searches must not reveal private
operational notes or guest information.

### 16.2 Quote request

``` json
{
  "propertyId": "uuid",
  "items": [
    {
      "categoryId": "uuid",
      "resourceId": "uuid",
      "ratePlanId": "uuid",
      "startAt": "2026-12-01T14:00:00+01:00",
      "endAt": "2026-12-03T11:00:00+01:00",
      "quantity": 1,
      "guestCount": 2
    }
  ],
  "currency": "NGN"
}
```

The server returns a quote with line-item totals, taxes, fees,
discounts, currency and expiry. The client must not be allowed to choose
arbitrary prices.

## 17. Reservation APIs

  Method   Endpoint                                   Purpose
  -------- ------------------------------------------ ---------------------------------
  POST     `/reservations`                            Create staff/direct reservation
  GET      `/reservations`                            Search reservations
  GET      `/reservations/:reservationId`             Reservation details
  PATCH    `/reservations/:reservationId`             Modify permitted fields
  POST     `/reservations/:reservationId/confirm`     Confirm reservation
  POST     `/reservations/:reservationId/cancel`      Cancel reservation
  POST     `/reservations/:reservationId/check-in`    Check in
  POST     `/reservations/:reservationId/check-out`   Check out
  POST     `/reservations/:reservationId/no-show`     Mark no-show
  GET      `/reservations/:reservationId/history`     Status history

### 17.1 Create reservation request

``` json
{
  "propertyId": "uuid",
  "guest": {
    "firstName": "Ada",
    "lastName": "Okafor",
    "email": "ada@example.com",
    "phone": "+2348000000000"
  },
  "channel": "STAFF",
  "items": [
    {
      "resourceId": "uuid",
      "ratePlanId": "uuid",
      "startAt": "2026-12-01T14:00:00+01:00",
      "endAt": "2026-12-03T11:00:00+01:00",
      "guestCount": 2
    }
  ],
  "specialRequests": "Late arrival"
}
```

The server must:

1.  Authenticate and authorize the caller.
2.  Resolve the property and verify tenant access.
3.  Validate the guest and resource.
4.  Calculate price from the selected rate plan.
5.  Revalidate inventory inside a transaction.
6.  Create reservation, items and allocations.
7.  Record status history and audit information.
8.  Return the reservation reference and current state.

### 17.2 State-transition rules

-   `DRAFT` may become `HELD`, `PENDING_PAYMENT`, `CONFIRMED` or
    `CANCELLED`, subject to workflow.
-   `HELD` may become `PENDING_PAYMENT`, `CONFIRMED`, `EXPIRED` or
    `CANCELLED`.
-   `PENDING_PAYMENT` may become `CONFIRMED`, `CANCELLED` or `EXPIRED`.
-   `CONFIRMED` may become `CHECKED_IN`, `CANCELLED` or `NO_SHOW`.
-   `CHECKED_IN` may become `CHECKED_OUT`.
-   `CHECKED_OUT`, `CANCELLED`, `NO_SHOW` and `EXPIRED` are terminal for
    the initial release.

Any additional transition requires an explicit domain rule and audit
event. Do not let a generic PATCH endpoint arbitrarily set reservation
status.

## 18. Guest APIs

  Method   Endpoint                           Purpose
  -------- ---------------------------------- -----------------------
  POST     `/properties/:propertyId/guests`   Create guest
  GET      `/properties/:propertyId/guests`   Search guests
  GET      `/guests/:guestId`                 Guest profile
  PATCH    `/guests/:guestId`                 Update guest
  GET      `/guests/:guestId/reservations`    Guest booking history

Guest data must be property-scoped and permission-protected.

## 19. Payment APIs

  ----------------------------------------------------------------------------------------------------
  Method                  Endpoint                                             Purpose
  ----------------------- ---------------------------------------------------- -----------------------
  POST                    `/reservations/:reservationId/payments/initialize`   Initialize payment

  GET                     `/payments/:paymentId`                               Payment details

  POST                    `/payments/webhooks/:provider`                       Provider webhook

  POST                    `/payments/:paymentId/refunds`                       Initiate refund

  GET                     `/reservations/:reservationId/payments`              List payments
  ----------------------------------------------------------------------------------------------------

Payment initialization must be idempotent. A webhook must verify the
provider signature, validate amount/currency/reference and process an
event only once.

The server must never mark a payment successful based only on a browser
redirect.

## 20. Housekeeping and maintenance APIs

  Method   Endpoint                                        Purpose
  -------- ----------------------------------------------- ----------------
  POST     `/properties/:propertyId/housekeeping-tasks`    Create task
  GET      `/properties/:propertyId/housekeeping-tasks`    List tasks
  PATCH    `/housekeeping-tasks/:taskId`                   Update task
  POST     `/housekeeping-tasks/:taskId/complete`          Complete task
  POST     `/properties/:propertyId/maintenance-tickets`   Create ticket
  GET      `/properties/:propertyId/maintenance-tickets`   List tickets
  PATCH    `/maintenance-tickets/:ticketId`                Update ticket
  POST     `/maintenance-tickets/:ticketId/resolve`        Resolve ticket

## 21. Marketplace APIs

  -------------------------------------------------------------------------------------------
  Method                  Endpoint                                    Purpose
  ----------------------- ------------------------------------------- -----------------------
  GET                     `/marketplace/properties`                   Search published
                                                                      properties

  GET                     `/marketplace/properties/:slug`             Property details

  GET                     `/marketplace/properties/:slug/resources`   Public bookable
                                                                      inventory

  POST                    `/marketplace/quotes`                       Calculate booking quote

  POST                    `/marketplace/holds`                        Hold inventory

  POST                    `/marketplace/bookings`                     Create marketplace
                                                                      booking

  GET                     `/marketplace/my-bookings`                  Customer's bookings

  POST                    `/marketplace/bookings/:id/cancel`          Cancel own booking
  -------------------------------------------------------------------------------------------

Public endpoints must return only published information. Customer
booking endpoints must verify ownership or a valid guest-booking access
token.

------------------------------------------------------------------------

# PART V --- SECURITY, RELIABILITY AND QUALITY

## 22. Security requirements

-   Use secure, HTTP-only, same-site cookies for browser sessions where
    applicable.
-   Protect state-changing cookie-authenticated requests against CSRF.
-   Hash passwords with a modern password hashing algorithm if passwords
    are used.
-   Rate-limit authentication, booking, quote, payment and public search
    endpoints.
-   Validate and sanitize all input.
-   Enforce authorization at service/API level.
-   Use secrets management; never commit secrets.
-   Verify payment webhook signatures.
-   Use idempotency for retried operations.
-   Encrypt sensitive data at rest where appropriate.
-   Minimize personal data collection and restrict access to identity
    records.
-   Keep immutable audit trails for financial and booking changes.
-   Back up PostgreSQL and test restoration.
-   Apply dependency and vulnerability scanning.
-   Do not log passwords, tokens, card data or sensitive identity
    values.

## 23. Reliability and performance requirements

Initial targets, to be validated under load:

-   99.5% monthly application availability target for initial
    production.
-   Typical API reads under 500 ms at the 95th percentile under expected
    launch load.
-   Booking/availability operations under 1 second at the 95th
    percentile, excluding external payment-provider latency.
-   No confirmed overlapping allocations for exclusive resources.
-   Payment webhook processing must tolerate duplicate and delayed
    delivery.
-   Background notification failure must not roll back a confirmed
    reservation.
-   Database backups must be automated and restoration tested.
-   Critical errors must be observable through logs and alerting.

Do not promise zero downtime or a fixed scale ceiling before load
testing.

## 24. Testing strategy

### Unit tests

-   Resource validation.
-   Booking-unit duration rules.
-   Price calculation.
-   Cancellation policies.
-   Reservation state transitions.
-   Role and permission evaluation.
-   Timezone conversion.

### Integration tests

-   Resource creation and bulk creation.
-   Tenant isolation.
-   Availability against reservations and blocks.
-   Concurrent reservation attempts.
-   Hold expiry.
-   Payment webhook idempotency.
-   Refund state handling.
-   Audit log creation.

### End-to-end tests

1.  Organization owner creates a property.
2.  Manager creates Standard Room category.
3.  Manager bulk-creates Rooms 101--110.
4.  Manager creates VIP Lounge A as an hourly resource.
5.  Customer searches and books Room 101.
6.  Another customer attempts the same dates and cannot double-book Room
    101.
7.  Customer can still book Room 102.
8.  Receptionist checks in the Room 101 guest.
9.  Housekeeping receives a departure task.
10. Accountant sees the payment and reservation totals.
11. Manager blocks VIP Lounge A for maintenance and availability
    reflects the block.

------------------------------------------------------------------------

# PART VI --- PHASED IMPLEMENTATION BACKLOG

## 25. Development phases

### Phase 0 --- Repository and engineering foundation

**Priority:** P0

Tasks:

-   Audit existing repository and identify framework/runtime versions.
-   Document current architecture and dependencies.
-   Establish environment configuration and secret handling.
-   Configure PostgreSQL and Prisma.
-   Set up linting, formatting, type checking and test runner.
-   Establish API error format and request logging.
-   Set up CI checks and migration workflow.

Definition of done:

-   Project runs locally from documented instructions.
-   Database migrations run on a clean database.
-   CI runs lint, type-check and tests.
-   No secrets are committed.

### Phase 1 --- Identity, tenancy and property setup

**Priority:** P0

Tasks:

-   User registration/authentication.
-   Organization creation.
-   Organization membership and invitations.
-   Property creation and settings.
-   Property membership and role permissions.
-   Tenant-isolation middleware/policies.
-   Audit log foundation.

Definition of done:

-   Owner can create an organization and property.
-   Staff can be invited and assigned property roles.
-   Unauthorized cross-tenant requests fail.
-   Property timezone and currency are configured.

### Phase 2 --- Resource inventory

**Priority:** P0

Tasks:

-   Seed resource types.
-   Resource category CRUD.
-   Building and floor CRUD.
-   Resource CRUD.
-   Bulk resource creation with preview and validation.
-   Resource photos and amenities.
-   Lifecycle and operational status.
-   Bookability and marketplace visibility.
-   Availability blocks.
-   Resource list, filters and detail views.

Definition of done:

-   Hotel can create Standard Room category and Rooms 101--110.
-   Hotel can create VIP Lounge A as an hourly resource.
-   Resource codes are unique within the property.
-   Non-bookable resources cannot be booked.
-   Archiving preserves history.

### Phase 3 --- Availability and reservation engine

**Priority:** P0

Tasks:

-   Booking-unit rules.
-   Rate plans and quote calculation.
-   Availability query service.
-   Booking holds and expiration.
-   Reservation, item and allocation models.
-   Transactional resource allocation.
-   Database overlap protection.
-   Reservation status history.
-   Staff reservation creation.
-   Modification, cancellation and no-show workflows.

Definition of done:

-   Exclusive resources cannot be double-booked under concurrent
    requests.
-   Different resources in the same category can be booked
    independently.
-   Availability blocks are respected.
-   Expired holds release inventory.
-   All booking channels use the same domain service.

### Phase 4 --- Guest, payments and front desk

**Priority:** P0

Tasks:

-   Guest profiles and reservation guest links.
-   Payment provider adapter.
-   Payment initialization and webhook handling.
-   Payment reconciliation.
-   Refund workflow.
-   Receipts and notifications.
-   Arrivals/departures dashboard.
-   Check-in and check-out.
-   Outstanding balance view.

Definition of done:

-   A reservation can be paid and confirmed using verified provider
    events.
-   Duplicate webhooks do not duplicate financial effects.
-   Staff can check guests in/out according to reservation state.
-   Payment totals reconcile with reservation balances.

### Phase 5 --- Marketplace MVP

**Priority:** P0

Tasks:

-   Property listing management.
-   Marketplace property search.
-   Property detail pages.
-   Resource/category availability search.
-   Quote and booking checkout.
-   Customer booking history.
-   Cancellation flow.
-   Listing moderation and publication controls.

Definition of done:

-   Only eligible published inventory appears publicly.
-   Customer can complete a booking through the unified reservation
    engine.
-   Marketplace cannot bypass price or availability validation.

### Phase 6 --- Hotel operations

**Priority:** P1

Tasks:

-   Housekeeping task board.
-   Cleaning status and inspection.
-   Maintenance tickets.
-   Resource downtime.
-   Staff activity and operational notifications.

Definition of done:

-   Checkout can create a housekeeping task.
-   Room cannot be checked in as ready until operational rules are
    satisfied.
-   Maintenance blocks affect availability correctly.

### Phase 7 --- Reporting and optimization

**Priority:** P1/P2

Tasks:

-   Occupancy and resource utilization reports.
-   Revenue and payment reports.
-   Booking-channel reports.
-   ADR and RevPAR for accommodation.
-   Cancellation and no-show analysis.
-   Performance and query optimization.
-   Load and security testing.

Definition of done:

-   Reports reconcile against reservation/payment records.
-   Date ranges respect property timezone.
-   Expensive queries are indexed and measured.

### Phase 8 --- Advanced integrations

**Priority:** P2

Potential work:

-   OTA/channel-manager integrations.
-   Hotel website booking widgets.
-   Multi-property consolidated reporting.
-   Capacity-based inventory.
-   Advanced rate rules and promotions.
-   WhatsApp notifications and guest communication.
-   Accounting integrations.

------------------------------------------------------------------------

# PART VII --- KIRO IMPLEMENTATION SPECIFICATIONS

## 26. Recommended Kiro workspace layout

Create a `specs` directory in the repository:

``` text
.kiro/
  steering/
    product.md
    architecture.md
    engineering-standards.md

specs/
  00-platform-foundation/
    requirements.md
    design.md
    tasks.md

  01-identity-and-tenancy/
    requirements.md
    design.md
    tasks.md

  02-property-management/
    requirements.md
    design.md
    tasks.md

  03-resource-inventory/
    requirements.md
    design.md
    tasks.md

  04-availability-engine/
    requirements.md
    design.md
    tasks.md

  05-reservations/
    requirements.md
    design.md
    tasks.md

  06-guests-and-front-desk/
    requirements.md
    design.md
    tasks.md

  07-payments/
    requirements.md
    design.md
    tasks.md

  08-marketplace/
    requirements.md
    design.md
    tasks.md

  09-housekeeping-maintenance/
    requirements.md
    design.md
    tasks.md

  10-reporting/
    requirements.md
    design.md
    tasks.md
```

Use Kiro's spec-driven development workflow: requirements first, design
second, tasks third, implementation only after review.

## 27. Steering file: `.kiro/steering/product.md`

``` markdown
# Lodgen Product Steering

Lodgen is a Nigeria-first hybrid Hotel Operating System and
hospitality marketplace.

The platform has two primary surfaces:
1. Lodgen OS for hotel and property operations.
2. Lodgen Marketplace for customer discovery and booking.

Core product principle:
Lodgen uses a resource-based inventory model.

Resources include accommodation, hospitality spaces, event
spaces, scheduled facilities and non-bookable facilities.

A resource is not necessarily a room and is not necessarily
bookable.

Room 101 and Room 102 are separate physical resources even
when they share the same category and rate plan.

All booking channels must use one central availability and
reservation engine.

Initial market: Nigeria.
Initial currency default: NGN.
Property timezone must be configurable using IANA timezone IDs.

Build a modular, maintainable product. Avoid unnecessary
microservices and avoid generic, visually repetitive UI.
```

## 28. Steering file: `.kiro/steering/architecture.md`

``` markdown
# Lodgen Architecture Steering

- Use the existing repository stack unless an approved
  architecture decision changes it.
- Prefer a modular monolith for the initial product.
- PostgreSQL is the source of truth for inventory,
  reservations and financial records.
- Use Prisma for database access if already adopted.
- Use UUID identifiers for domain entities.
- Keep money in integer minor units with explicit currency.
- Store timestamps in UTC and apply property timezone rules
  in the domain layer.
- Enforce tenant isolation and RBAC on the server.
- Keep resource lifecycle, operational status and availability
  as separate concepts.
- Never implement room-only booking logic.
- Use reservation allocations to connect booking items to
  actual resources.
- Protect exclusive inventory against overlapping allocations
  at the database level.
- Make payment and webhook processing idempotent.
- Use provider adapters for payments, email, SMS and storage.
- Keep historical reservations and financial records auditable.
```

## 29. Steering file: `.kiro/steering/engineering-standards.md`

``` markdown
# Engineering Standards

- TypeScript strict mode.
- Validate external inputs at API boundaries.
- Keep domain rules out of React components.
- Use service/domain modules for business operations.
- Use database transactions for multi-record state changes.
- Use explicit API response and error contracts.
- Never trust client-supplied prices or payment states.
- Never expose secrets or sensitive guest data.
- Add unit tests for domain rules.
- Add integration tests for database behaviour.
- Add authorization and tenant-isolation tests.
- Add concurrency tests for reservation allocation.
- Document non-obvious architecture decisions.
- Do not silently change database semantics.
- Run lint, type-check, tests and migrations before marking
  a task complete.
```

## 30. Kiro spec: resource inventory

Create:

`specs/03-resource-inventory/requirements.md`

``` markdown
# Feature: Resource-Based Inventory Management

## Objective

Allow an authorized hotel user to manage all physical and
operational resources belonging to a property, whether or not
those resources are bookable.

## User stories

1. As a property manager, I want to create resource categories
   so that I can group similar inventory.
2. As a property manager, I want to create individual resources
   so that every physical space has its own identity.
3. As a property manager, I want to bulk-create resources
   using room-number ranges.
4. As a property manager, I want to configure booking units
   such as nightly, hourly, daily and scheduled sessions.
5. As a property manager, I want to mark a resource as
   non-bookable without deleting it.
6. As a receptionist, I want to see a resource's operational
   status separately from its reservation availability.
7. As a manager, I want to block resources for maintenance
   or private use.
8. As a manager, I want to archive resources without losing
   historical reservations.

## Acceptance criteria

- Every resource belongs to exactly one property.
- Resource code is unique within a property.
- Resource category belongs to the same property.
- Resource type is a valid system type.
- A resource may be bookable or non-bookable.
- A resource may be private, unlisted or public.
- Operational status does not replace availability calculation.
- Bulk creation validates all entries before committing.
- Duplicate codes are rejected.
- Archived resources cannot receive new bookings.
- Historical allocations remain accessible.
- All mutations create appropriate audit records.
```

Create:

`specs/03-resource-inventory/design.md`

``` markdown
# Resource Inventory Design

## Domain entities

- ResourceType
- ResourceCategory
- Resource
- Building
- Floor
- Amenity
- ResourcePhoto
- AvailabilityBlock

## Service boundaries

ResourceService:
- createResource
- updateResource
- archiveResource
- bulkCreateResources
- updateOperationalStatus
- listResources
- getResource

ResourceCategoryService:
- createCategory
- updateCategory
- listCategories

AvailabilityBlockService:
- createBlock
- removeBlock
- listBlocks

## Invariants

- Never permit cross-property relationships.
- Never permit duplicate resource codes within a property.
- Never delete historical booking allocations.
- Never calculate availability from a manually editable boolean.
- Never allow a non-bookable resource to be reserved.
- Use a transaction for bulk creation.

## UI

Provide:
- Resource list/table.
- Category filters.
- Building/floor filters.
- Operational status filters.
- Resource detail view.
- Create/edit resource form.
- Bulk-create wizard with preview.
- Availability calendar.
- Block-resource dialog.

Keep the interface responsive and accessible.
```

Create:

`specs/03-resource-inventory/tasks.md`

``` markdown
# Resource Inventory Tasks

- [ ] Add resource enums and database models.
- [ ] Add resource-type seed data.
- [ ] Add resource-category migrations.
- [ ] Add building and floor models.
- [ ] Add resource model and constraints.
- [ ] Add resource photo and amenity relations.
- [ ] Implement resource-category service.
- [ ] Implement resource CRUD service.
- [ ] Implement bulk-create validation and transaction.
- [ ] Implement operational-status updates.
- [ ] Implement archive behaviour.
- [ ] Implement availability-block service.
- [ ] Add API routes and schemas.
- [ ] Add RBAC and tenant-isolation checks.
- [ ] Build resource list and filters.
- [ ] Build resource create/edit interface.
- [ ] Build bulk-create wizard and preview.
- [ ] Build resource detail and status interface.
- [ ] Add unit and integration tests.
- [ ] Verify Room 101 and Room 102 are independent resources.
- [ ] Verify VIP Lounge can be hourly and bookable.
- [ ] Verify a gym can be non-bookable.
```

## 31. Kiro spec: availability and reservations

Create:

`specs/04-availability-engine/requirements.md`

``` markdown
# Feature: Unified Availability Engine

## Objective

Calculate availability consistently for every bookable resource
and prevent overlapping confirmed allocations.

## User stories

- A customer can search available resources for a period.
- A staff member can check availability before creating a booking.
- A customer can temporarily hold inventory during checkout.
- The system expires abandoned holds.
- The system rejects overlapping allocations.
- Maintenance and private-use blocks affect availability.
- Booking units determine duration validation.

## Acceptance criteria

- All channels call the same availability service.
- All date ranges are validated.
- Property timezone rules are applied.
- Availability includes active reservations, holds and blocks.
- Expired holds stop consuming inventory.
- Exclusive resources cannot be double-booked.
- Simultaneous booking requests are concurrency-safe.
- A failed transaction leaves no partial allocation.
```

Create:

`specs/04-availability-engine/design.md`

``` markdown
# Availability Engine Design

Core services:

- AvailabilityService
- BookingRulesService
- QuoteService
- HoldService
- AllocationService

Use half-open intervals [startAt, endAt).

Use database transactions and a PostgreSQL exclusion constraint
for exclusive resource allocations.

Do not depend only on application-level pre-checks.

Hold lifecycle:
ACTIVE -> CONVERTED
ACTIVE -> RELEASED
ACTIVE -> EXPIRED

A hold must have an expiry timestamp and a secure token verifier.

The server calculates quotes from rate plans. Client-supplied
totals are never authoritative.

The availability engine must be independent of the caller:
marketplace, direct website, staff dashboard or walk-in.
```

Create:

`specs/04-availability-engine/tasks.md`

``` markdown
# Availability Engine Tasks

- [ ] Implement booking-unit validation.
- [ ] Implement property timezone utilities.
- [ ] Implement availability query service.
- [ ] Implement reservation conflict checks.
- [ ] Implement availability block checks.
- [ ] Implement hold creation and expiry.
- [ ] Implement hold conversion/release.
- [ ] Implement rate-plan quote calculation.
- [ ] Add PostgreSQL overlap constraint migration.
- [ ] Add transaction-safe allocation service.
- [ ] Add concurrency integration tests.
- [ ] Add expired-hold tests.
- [ ] Add cross-channel consistency tests.
```

## 32. Kiro spec: reservations and payments

Create:

`specs/05-reservations/requirements.md`

``` markdown
# Feature: Unified Reservation Management

A reservation may contain multiple items. Each item may allocate
one or more resources.

The system must support marketplace, direct, walk-in, staff and
future OTA channels.

Requirements:
- Create reservations.
- Calculate authoritative prices.
- Allocate inventory transactionally.
- Modify reservations with revalidation.
- Cancel reservations with policy handling.
- Record state history.
- Support check-in, check-out and no-show where applicable.
- Maintain an audit trail.
- Use idempotency for retried writes.

Acceptance criteria:
- No overlapping active allocation for an exclusive resource.
- Reservation status transitions are validated.
- Cancellation releases inventory according to policy.
- Price snapshots remain unchanged after rate-plan edits.
- Every state transition is auditable.
```

Create:

`specs/07-payments/requirements.md`

``` markdown
# Feature: Payment Orchestration

Requirements:
- Initialize provider payments.
- Verify provider webhooks.
- Store provider references.
- Handle duplicate and delayed events.
- Reconcile payment and reservation amounts.
- Support partial payments where enabled.
- Support refunds with authorization.
- Maintain payment history.

Acceptance criteria:
- Browser redirects never determine payment success.
- Webhook signatures are verified.
- Duplicate provider events have no duplicate financial effect.
- Amount and currency must match the expected transaction.
- Payment operations are idempotent.
- Refunds cannot exceed refundable captured amounts.
- Raw card data is never stored.
```

## 33. Kiro spec: marketplace

Create:

`specs/08-marketplace/requirements.md`

``` markdown
# Feature: Lodgen Marketplace

Requirements:
- Search published properties.
- Filter by destination, dates, guests and category.
- View property and resource details.
- Request server-calculated quotes.
- Hold available resources.
- Complete a booking through the unified reservation engine.
- View and cancel the customer's own bookings.
- Enforce listing visibility and publication rules.

Acceptance criteria:
- Private and unlisted resources do not appear in public search.
- Public results contain no internal notes or guest data.
- Search results are revalidated before booking.
- Marketplace bookings use the same reservation service as staff bookings.
- A customer cannot view another customer's reservations.
```

## 34. Kiro execution prompt

Use this prompt after adding the steering files and relevant feature
specs:

``` text
You are the senior engineer implementing Lodgen.

Read all relevant files in:
- .kiro/steering/
- specs/

Treat these documents as the product and architecture source
of truth.

Before writing code:
1. Inspect the existing repository.
2. Identify the current stack and versions.
3. Identify existing models, routes, services and conventions.
4. Report conflicts between the repository and the specification.
5. Propose a minimal implementation plan.

Implementation rules:
- Follow the resource-based inventory architecture.
- Never introduce room-only inventory logic.
- Use one availability and reservation engine across channels.
- Enforce tenant isolation and server-side RBAC.
- Protect exclusive allocations against concurrent overlap.
- Use database transactions for critical workflows.
- Use integer minor units for money.
- Preserve reservation and financial history.
- Add tests for every business invariant.

Work only on the selected Kiro spec and its dependencies.
Do not implement unrelated features.
Do not silently change the database design.
Do not mark tasks complete unless code and tests exist.

After implementation:
- Run migrations.
- Run lint.
- Run type checks.
- Run unit and integration tests.
- Report changed files.
- Report unresolved risks.
- Update tasks.md accurately.
```

## 35. Implementation order and dependency rules

Do not ask an agent to implement all modules simultaneously. Use this
order:

    Order Spec                           Depends on
  ------- ------------------------------ --------------------------------------
        1 Platform foundation            None
        2 Identity and tenancy           Foundation
        3 Property management            Identity
        4 Resource inventory             Property
        5 Availability engine            Resource inventory
        6 Reservations                   Availability
        7 Guests and front desk          Reservations
        8 Payments                       Reservations
        9 Marketplace                    Availability, reservations, payments
       10 Housekeeping and maintenance   Resources, reservations
       11 Reporting                      All transactional modules

The inventory and booking domain must be stable before marketplace
checkout is built.

------------------------------------------------------------------------

# PART VIII --- RELEASE ACCEPTANCE AND OPEN DECISIONS

## 36. MVP launch checklist

### Product

-   [ ] Organization can register and create a property.
-   [ ] Property can configure timezone, address and currency.
-   [ ] Manager can create resource categories.
-   [ ] Manager can create individual and bulk resources.
-   [ ] Room 101, Room 102 and VIP Lounge are represented using the same
    resource foundation.
-   [ ] Non-bookable facilities can be registered.
-   [ ] Availability blocks work.
-   [ ] Reservations work across staff and marketplace channels.
-   [ ] Double-booking is prevented.
-   [ ] Guest profiles and booking history work.
-   [ ] Payment provider integration is verified.
-   [ ] Staff roles and permissions work.
-   [ ] Marketplace only displays eligible published inventory.

### Engineering

-   [ ] Database migrations are reproducible.
-   [ ] Tenant-isolation tests pass.
-   [ ] Authorization tests pass.
-   [ ] Concurrent booking tests pass.
-   [ ] Payment webhook idempotency tests pass.
-   [ ] Audit events exist for sensitive operations.
-   [ ] Backups and restore procedure are tested.
-   [ ] Logs and error monitoring are configured.
-   [ ] Production secrets are managed securely.
-   [ ] Load and security testing have been completed.

## 37. Product decisions to confirm before implementation

These decisions affect the detailed schema and workflow. Use sensible
defaults for development, but confirm before production:

1.  **Hotel onboarding:** Self-service registration, manual approval, or
    both.
2.  **Marketplace payments:** Lodgen collects and settles, hotels
    collect directly, or both.
3.  **Hotel pricing:** Simple base rates initially, or
    seasonal/day-of-week pricing in MVP.
4.  **Booking confirmation:** Instant confirmation after payment, or
    hotel approval for selected resources.
5.  **Guest checkout:** Account required, or allow booking without an
    account.
6.  **External OTAs:** Defer to a later phase or include a specific
    channel integration in the first release.
7.  **Capacity inventory:** Individual physical resources only for MVP,
    or shared capacity-based sessions too.

## 38. Final architectural decisions

The following are mandatory product invariants:

1.  Lodgen inventory is resource-based, not room-only.
2.  Resource type, category and individual resource are separate
    concepts.
3.  Resource operational status is separate from calculated
    availability.
4.  Bookability is separate from marketplace visibility.
5.  One central availability and reservation engine serves all channels.
6.  Reservation items and allocations are separate.
7.  Exclusive resources cannot have overlapping active allocations.
8.  Payments are independently tracked and reconciled.
9.  Every tenant-scoped operation is authorized server-side.
10. Historical reservations and financial records are preserved.

**The central test of the architecture:** Lodgen must be able to manage
Room 101, Room 102, a VIP Lounge, a Conference Hall and a non-bookable
Gym without creating separate booking systems for each.

------------------------------------------------------------------------

## Recommended next action

1.  Put this document in the repository root as
    `LODGEN-PRODUCT-SPECIFICATION.md`.
2.  Add the three Kiro steering files.
3.  Start with Phase 0 and Phase 1.
4.  Implement resource inventory only after tenancy and property
    ownership are enforced.
5.  Implement availability and reservations before marketplace checkout.
6.  Do not start payment or marketplace integrations until the
    reservation lifecycle and inventory concurrency tests pass.

**End of specification.**
