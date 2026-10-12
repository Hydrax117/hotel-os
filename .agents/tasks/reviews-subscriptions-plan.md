# Implementation Plan: Reviews & Subscriptions Modules

> Backend lives at `c:\Users\Pkaka\music\hotel-os-api`
> All paths below are relative to that root unless stated otherwise.

---

## Verified Facts from Source Reading

### Auth import paths (exact)

All relative imports use `.js` extension (ESM rule).

| What | Import path from a new `src/<module>/` file |
|---|---|
| `JwtAuthGuard` | `../auth/guards/jwt-auth.guard.js` |
| `RolesGuard` | `../auth/guards/roles.guard.js` |
| `Roles` decorator | `../auth/decorators/roles.decorator.js` |
| `CurrentUser` decorator | `../auth/decorators/current-user.decorator.js` |
| `JwtUser` type | `../auth/strategies/jwt.strategy.js` |
| `PrismaService` | `../prisma/prisma.service.js` |
| `BookingsService` | `../bookings/bookings.service.js` |

### Enum import paths

All Prisma enums come from `@prisma/client` â€” never from relative files.

```ts
import { UserRole, SubscriptionPlan, SubscriptionStatus, BookingStatus } from '@prisma/client';
```

### Prisma model fields â€” Review

```
id               String   (cuid)
bookingId        String   @unique  â† one review per booking
userId           String
hotelId          String
overallRating    Int
cleanlinessRating Int
locationRating   Int
serviceRating    Int
valueRating      Int
facilitiesRating Int
title            String
body             String
isVerified       Boolean  @default(true)
isApproved       Boolean  @default(false)
isFlagged        Boolean  @default(false)
hotelResponse    String?
respondedAt      DateTime?
createdAt        DateTime
updatedAt        DateTime
```

Relations: `booking` â†’ `Booking`, `user` â†’ `User`, `hotel` â†’ `Hotel`

### Prisma model fields â€” Subscription

```
id             String             (cuid)
hotelId        String   @unique  â† one subscription per hotel
plan           SubscriptionPlan   (STARTER | PROFESSIONAL | ENTERPRISE)
status         SubscriptionStatus (ACTIVE | GRACE_PERIOD | SUSPENDED | ARCHIVED)
priceNgn       Decimal  @db.Decimal(12,2)
startDate      DateTime
nextBilling    DateTime
gracePeriodEnd DateTime?
createdAt      DateTime
updatedAt      DateTime
```

Relation: `hotel` â†’ `Hotel`

### Patterns to replicate from bookings module

1. `@Injectable()` service with `private readonly logger = new Logger(XxxService.name)`.
2. Constructor injects dependencies via `private readonly`.
3. Dynamic Prisma filters typed as `Prisma.XxxWhereInput`.
4. Permission checks: compare record's `userId` / `ownerId` against caller; throw `ForbiddenException`.
5. Not-found: throw `NotFoundException('Entity not found')` after any null `findUnique`.
6. Pagination: `page`/`limit` defaults `1`/`10`; `skip: (page-1)*limit`; return `{ items, total }`.
7. No `process.env` â€” use `ConfigService` for any config values.
8. Static literal routes before wildcard routes to avoid NestJS route conflicts.
9. Module exports its service so other modules can inject it.

---

## Potential Issues & Decisions

| Issue | Decision |
|---|---|
| Review only for CHECKED_OUT booking | Service verifies `booking.status === BookingStatus.CHECKED_OUT`; import from `@prisma/client`. |
| One review per booking (`bookingId @unique`) | Catch Prisma unique constraint (P2002) and rethrow as `ConflictException`. |
| Only booking owner may review | Check `booking.userId === userId`; throw `ForbiddenException` otherwise. |
| Hotel owner responds to own hotel's review | Fetch review with `hotel` include; check `hotel.ownerId === userId`. |
| `SubscriptionPlan` on both Hotel and Subscription | Creating/upgrading subscription must also update `hotel.subscriptionPlan` atomically via `prisma.$transaction`. |
| One subscription per hotel | Check existence before create; if a non-ARCHIVED subscription exists, throw `ConflictException`. |
| Admin-only status management | `PATCH /subscriptions/:id/status` uses `@Roles(UserRole.SUPER_ADMIN)`. |
| ReviewsModule needs BookingsService | Import `BookingsModule` in `ReviewsModule.imports` â€” safe, one-way dependency. |
| No circular dependencies | Reviews â†’ Bookings â†’ Inventory (one-way). Subscriptions uses PrismaService only. |

---

## File Creation Order (dependency-safe)

Create files in this exact order — each file's imports already exist when it is written.

---

### Reviews module

- [ ] 1. Create src/reviews/dto/create-review.dto.ts
      Fields: ookingId: string, overallRating, cleanlinessRating, locationRating,
      serviceRating, alueRating, acilitiesRating (each @IsInt() @Min(1) @Max(5)),
      	itle: string (@IsString() @MinLength(2)), ody: string (@IsString() @MinLength(10)).
      Files: src/reviews/dto/create-review.dto.ts
      Verify: 
pm run build — compiles without errors.

- [ ] 2. Create src/reviews/dto/review-query.dto.ts
      Optional fields: hotelId?: string, page?: number, limit?: number.
      Use @IsOptional() with @IsString() / @IsInt() @Type(() => Number).
      Files: src/reviews/dto/review-query.dto.ts
      Verify: 
pm run build — compiles without errors.

- [ ] 3. Create src/reviews/dto/respond-review.dto.ts
      Single field: esponse: string (@IsString() @MinLength(1)).
      Files: src/reviews/dto/respond-review.dto.ts
      Verify: 
pm run build — compiles without errors.

- [ ] 4. Create src/reviews/reviews.service.ts
      Inject PrismaService. Import BookingStatus, type Review, type Prisma from @prisma/client.
      Methods:
        createReview(userId, dto) — verify booking CHECKED_OUT and userId match; create Review.
        getHotelReviews(hotelId, query) — paginate isApproved=true reviews, include user name.
        getMyReviews(userId) — all reviews by caller.
        respondToReview(reviewId, userId, dto) — verify hotel ownership, set hotelResponse + respondedAt.
        approveReview(reviewId) — set isApproved = true (admin).
        flagReview(reviewId) — set isFlagged = true (admin).
      Files: src/reviews/reviews.service.ts
      Verify: 
pm run build — compiles without errors.

- [ ] 5. Create src/reviews/reviews.controller.ts
      Decorator: @ApiTags('reviews') @Controller('reviews').
      Endpoints (place static routes before :id):
        POST   /reviews            — JwtAuthGuard — createReview
        GET    /reviews/my         — JwtAuthGuard — getMyReviews
        GET    /reviews/hotel/:hotelId — public — getHotelReviews
        POST   /reviews/:id/respond — JwtAuthGuard + RolesGuard + Roles(HOTEL_OWNER) — respondToReview
        PATCH  /reviews/:id/approve — JwtAuthGuard + RolesGuard + Roles(SUPER_ADMIN) — approveReview
        PATCH  /reviews/:id/flag    — JwtAuthGuard + RolesGuard + Roles(SUPER_ADMIN) — flagReview
      Files: src/reviews/reviews.controller.ts
      Verify: 
pm run build — compiles without errors.

- [ ] 6. Create src/reviews/reviews.module.ts
      imports: [PrismaModule, BookingsModule]
      controllers: [ReviewsController]
      providers: [ReviewsService]
      exports: [ReviewsService]
      Files: src/reviews/reviews.module.ts
      Verify: 
pm run build — compiles without errors.

---

### Subscriptions module

- [ ] 7. Create src/subscriptions/dto/create-subscription.dto.ts
      Fields: hotelId: string, plan: SubscriptionPlan (@IsEnum(SubscriptionPlan)),
      priceNgn: number (@IsNumber()), startDate: string (@IsDateString()).
      Files: src/subscriptions/dto/create-subscription.dto.ts
      Verify: 
pm run build — compiles without errors.

- [ ] 8. Create src/subscriptions/dto/update-subscription.dto.ts
      Fields: plan?: SubscriptionPlan (@IsEnum @IsOptional),
      status?: SubscriptionStatus (@IsEnum @IsOptional),
      gracePeriodEnd?: string (@IsDateString @IsOptional).
      Files: src/subscriptions/dto/update-subscription.dto.ts
      Verify: 
pm run build — compiles without errors.

- [ ] 9. Create src/subscriptions/subscriptions.service.ts
      Inject PrismaService. Import SubscriptionPlan, SubscriptionStatus, type Subscription
      from @prisma/client.
      Methods:
        createSubscription(dto) — admin only; check no existing non-ARCHIVED subscription for hotel;
          use prisma. to create Subscription AND update hotel.subscriptionPlan.
        getHotelSubscription(hotelId, userId) — fetch subscription; verify hotel.ownerId === userId
          or caller is SUPER_ADMIN (pass role as param).
        updateSubscription(subId, dto) — admin only; update plan/status/gracePeriodEnd;
          if plan changes, also update hotel.subscriptionPlan in same transaction.
        listSubscriptions(query) — admin only; paginated list with optional status filter.
      Files: src/subscriptions/subscriptions.service.ts
      Verify: 
pm run build — compiles without errors.

- [ ] 10. Create src/subscriptions/subscriptions.controller.ts
       Decorator: @ApiTags('subscriptions') @Controller('subscriptions').
       Endpoints (static before :id):
         POST  /subscriptions         — JwtAuthGuard + RolesGuard + Roles(SUPER_ADMIN) — createSubscription
         GET   /subscriptions         — JwtAuthGuard + RolesGuard + Roles(SUPER_ADMIN) — listSubscriptions
         GET   /subscriptions/hotel/:hotelId — JwtAuthGuard — getHotelSubscription
         PATCH /subscriptions/:id     — JwtAuthGuard + RolesGuard + Roles(SUPER_ADMIN) — updateSubscription
       Files: src/subscriptions/subscriptions.controller.ts
       Verify: 
pm run build — compiles without errors.

- [ ] 11. Create src/subscriptions/subscriptions.module.ts
       imports: [PrismaModule]
       controllers: [SubscriptionsController]
       providers: [SubscriptionsService]
       exports: [SubscriptionsService]
       Files: src/subscriptions/subscriptions.module.ts
       Verify: 
pm run build — compiles without errors.

---

### Wire up AppModule

- [ ] 12. Edit src/app.module.ts
       Add two imports:
         import { ReviewsModule } from './reviews/reviews.module.js';
         import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
       Add both to the imports array after PaymentsModule.
       Files: src/app.module.ts
       Verify: 
pm run build then 
pm run test — all existing tests still pass and build succeeds.

---

## ESM Import Checklist (apply to every new file)

- All relative imports end in .js (not .ts, not extension-less).
- Enum and Prisma type imports use @prisma/client — never a local file.
- Type-only imports use import { type Foo } syntax.

## Build & Test Commands

`ash
cd c:\Users\Pkaka\music\hotel-os-api

npm run build          # tsc compile check
npm run test           # Vitest unit tests
npm run start:dev      # dev server on :3001
`

Swagger verification: http://localhost:3001/api/docs — both eviews and subscriptions
tag groups must appear with all documented endpoints.
