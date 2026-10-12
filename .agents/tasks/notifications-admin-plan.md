# Implementation Plan: Notifications & Admin Modules

> **Backend root:** `c:\Users\Pkaka\music\hotel-os-api`  
> All paths below are relative to that root unless stated otherwise.

---

## Verified Facts from Source Reading

### Existing infrastructure (already wired in app.module.ts)

- `ReviewsModule` and `SubscriptionsModule` are already imported — `app.module.ts` is complete; no module imports needed.
- `@nestjs/bull`, `@nestjs/schedule`, `bullmq`, `nodemailer`, `@nestjs-modules/mailer`, `handlebars` are all present in `package.json`.
- `ScheduleModule` and `BullModule` are NOT yet imported in `app.module.ts` — they must be added there.
- `PrismaModule` is globally available; inject `PrismaService` directly without adding it to module imports.
- ESM rule: **all relative imports must end in `.js`**.

### Key import paths (from a new `src/<module>/` file)

| Symbol | Import path |
|---|---|
| `JwtAuthGuard` | `../auth/guards/jwt-auth.guard.js` |
| `RolesGuard` | `../auth/guards/roles.guard.js` |
| `Roles` | `../auth/decorators/roles.decorator.js` |
| `CurrentUser` | `../auth/decorators/current-user.decorator.js` |
| `JwtUser` | `../auth/strategies/jwt.strategy.js` |
| `PrismaService` | `../prisma/prisma.service.js` |
| `BookingsService` | `../bookings/bookings.service.js` |
| `SubscriptionsService` | `../subscriptions/subscriptions.service.js` |

### BullMQ consumer pattern (per constraints)
```ts
import { Processor, WorkerHost } from '@nestjs/bull';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  async process(job: Job<NotificationPayload>): Promise<void> { ... }
}
```

### Mailer setup pattern
```ts
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter.js';
import { join } from 'node:path';

MailerModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    transport: { host: config.get('SMTP_HOST'), ... },
    defaults: { from: config.get('SMTP_FROM') },
    template: {
      dir: join(process.cwd(), 'src/notifications/templates'),
      adapter: new HandlebarsAdapter(),
      options: { strict: true },
    },
  }),
  inject: [ConfigService],
})
```

### Existing cron pattern (subscriptions.service.ts)
`checkExpiredSubscriptions()` is already written. A scheduler service will call it via `@Cron` from `@nestjs/schedule`.

### Admin scope (from spec and README)
Admin module provides `SUPER_ADMIN`-only dashboard endpoints: platform stats, user management (list/suspend), hotel management (list/approve), booking oversight, subscription oversight, payout management.

---

## Decisions

| Decision | Rationale |
|---|---|
| One `NotificationsModule` handles both email (MailerModule + templates) and the BullMQ queue for async delivery. | All the notification packages are installed together; splitting into two modules adds wiring with no benefit. |
| `NotificationsService` enqueues jobs; `NotificationsProcessor` (WorkerHost) sends them. | Keeps the producer/consumer separation BullMQ requires; callers enqueue without waiting on SMTP. |
| `NotificationsModule` is imported by `BookingsModule`, `PaymentsModule`, and `AuthModule` — services already call points that need email (booking confirmed, payment success, registration). | Follows the one-way dependency direction already established; NotificationsModule exports only NotificationsService. |
| Admin module owns a single `AdminController` and `AdminService`. No sub-modules. | Admin endpoints are thin — they mostly call existing services from other modules. A flat structure matches the rest of the codebase (bookings, payments, etc. are each one controller + service). |
| Scheduler (`TasksService`) lives in a dedicated `SchedulerModule` alongside `AppModule` wiring, not inside Notifications. | Cron jobs span multiple modules (hold expiry, subscription checks, future billing) — a shared scheduler service is cleaner than cross-module dependencies on NotificationsModule. |
| `ScheduleModule.forRoot()` and `BullModule.forRoot()` are added to `AppModule` — both are global setup calls. | This is the standard NestJS pattern; child modules use `BullModule.registerQueue()` locally. |
| Redis connection config comes from `REDIS_HOST` + `REDIS_PORT` env vars via `ConfigService`. | Consistent with the no-`process.env` rule already enforced across the codebase. |
| Email templates: `booking-confirmation.hbs`, `payment-success.hbs`, `booking-cancelled.hbs`, `welcome.hbs`. | These cover every email trigger present in existing services; more can be added without touching the processor. |

---

## File Creation Order

### STEP 1 — Env & App-level wiring

- [ ] 1. Update `.env.example` and `.env` with Redis and SMTP variables.  
      Add to both files:
      ```
      # Redis (BullMQ)
      REDIS_HOST=localhost
      REDIS_PORT=6379

      # SMTP (Nodemailer)
      SMTP_HOST=smtp.mailtrap.io
      SMTP_PORT=587
      SMTP_USER=your_mailtrap_user
      SMTP_PASS=your_mailtrap_password
      SMTP_FROM="Hotel OS <noreply@hotel-os.com>"
      ```
      Files: `.env.example`, `.env`  
      Verify: `npm run build` — compiles without errors.

---

### STEP 2 — Notifications Module

- [ ] 2. Create `src/notifications/dto/notification-job.dto.ts`  
      TypeScript interface (not a class-validator DTO — this is an internal queue payload, not an HTTP body) describing the jobs the queue carries:
      ```ts
      export type NotificationJobType =
        | 'booking-confirmation'
        | 'payment-success'
        | 'booking-cancelled'
        | 'welcome-email';

      export interface NotificationJobPayload {
        type: NotificationJobType;
        recipientEmail: string;
        recipientName: string;
        data: Record<string, unknown>;
      }
      ```
      Files: `src/notifications/dto/notification-job.dto.ts`  
      Verify: `npm run build` — compiles without errors.

- [ ] 3. Create Handlebars email templates (four `.hbs` files).  
      Directory: `src/notifications/templates/`  
      Templates to create:

      **`booking-confirmation.hbs`** — Include: guest name, booking reference, hotel name, room type, check-in/check-out dates, total price in ₦. Use `{{guestName}}`, `{{reference}}`, `{{hotelName}}`, `{{roomType}}`, `{{checkIn}}`, `{{checkOut}}`, `{{totalNgn}}` variables.

      **`payment-success.hbs`** — Include: guest name, booking reference, amount paid, payment date. Variables: `{{guestName}}`, `{{reference}}`, `{{amountNgn}}`, `{{paidAt}}`.

      **`booking-cancelled.hbs`** — Include: guest name, booking reference, hotel name, cancellation reason. Variables: `{{guestName}}`, `{{reference}}`, `{{hotelName}}`, `{{reason}}`.

      **`welcome.hbs`** — Include: user's first name, login URL. Variables: `{{firstName}}`, `{{loginUrl}}`.

      Files:  
      - `src/notifications/templates/booking-confirmation.hbs`  
      - `src/notifications/templates/payment-success.hbs`  
      - `src/notifications/templates/booking-cancelled.hbs`  
      - `src/notifications/templates/welcome.hbs`  
      Verify: `npm run build` — compiles without errors (non-TS files don't block build; check files exist).

- [ ] 4. Create `src/notifications/notifications.service.ts`  
      Injects `InjectQueue('notifications')` from `@nestjs/bull`.  
      Exposes one method per notification type that enqueues a `NotificationJobPayload` job:
      - `sendBookingConfirmation(booking: { reference, guestEmail, guestFirstName, hotelName, roomTypeName, checkIn, checkOut, totalNgn })`
      - `sendPaymentSuccess(payment: { bookingRef, guestEmail, guestFirstName, amountNgn, paidAt })`
      - `sendBookingCancelled(booking: { reference, guestEmail, guestFirstName, hotelName, reason })`
      - `sendWelcomeEmail(user: { email, firstName, loginUrl })`
      Each method calls `this.queue.add(type, payload)` where `payload` is a `NotificationJobPayload`.  
      Logger: `private readonly logger = new Logger(NotificationsService.name)`.  
      Files: `src/notifications/notifications.service.ts`  
      Verify: `npm run build` — compiles without errors.

- [ ] 5. Create `src/notifications/notifications.processor.ts`  
      Class extends `WorkerHost`, decorated with `@Processor('notifications')` (both from `@nestjs/bull`).  
      Injects `MailerService` from `@nestjs-modules/mailer`.  
      Implements `async process(job: Job<NotificationJobPayload>)`:
      - Switch on `job.data.type`.
      - Each branch calls `this.mailerService.sendMail({ to, subject, template, context })`.
      - Template names match the `.hbs` file names without extension.
      - Unknown type: log a warning and return.
      - Wrap entire method body in try/catch; log errors with `this.logger.error(...)` but do not rethrow (prevents job retry loops during dev).
      Logger: `private readonly logger = new Logger(NotificationsProcessor.name)`.  
      Files: `src/notifications/notifications.processor.ts`  
      Verify: `npm run build` — compiles without errors.

- [ ] 6. Create `src/notifications/notifications.module.ts`  
      Imports:
      - `BullModule.registerQueue({ name: 'notifications' })` — from `@nestjs/bull`.
      - `MailerModule.forRootAsync(...)` using the pattern in the Decisions section above. Inject `ConfigService`. Use `HandlebarsAdapter` from `@nestjs-modules/mailer/dist/adapters/handlebars.adapter.js`. Template dir: `join(process.cwd(), 'src/notifications/templates')` — import join from `node:path`.
      providers: `[NotificationsService, NotificationsProcessor]`  
      exports: `[NotificationsService]`  
      Files: `src/notifications/notifications.module.ts`  
      Verify: `npm run build` — compiles without errors.

---

### STEP 3 — Scheduler Module (cron jobs)

- [ ] 7. Create `src/common/scheduler/tasks.service.ts`  
      `@Injectable()` class. Injects `BookingsService` and `SubscriptionsService`.  
      Two `@Cron` methods (import from `@nestjs/schedule`):
      - `@Cron('*/5 * * * *')` — `handleExpiredHolds()`: calls `this.bookingsService.releaseExpiredHolds()`; logs result count.
      - `@Cron('0 * * * *')` — `handleExpiredSubscriptions()`: calls `this.subscriptionsService.checkExpiredSubscriptions()`; logs result count.
      Logger: `private readonly logger = new Logger(TasksService.name)`.  
      Files: `src/common/scheduler/tasks.service.ts`  
      Verify: `npm run build` — compiles without errors.

- [ ] 8. Create `src/common/scheduler/scheduler.module.ts`  
      Imports: `BookingsModule`, `SubscriptionsModule`.  
      providers: `[TasksService]`  
      exports: `[]` (no consumer needs TasksService externally).  
      Files: `src/common/scheduler/scheduler.module.ts`  
      Verify: `npm run build` — compiles without errors.

---

### STEP 4 — Admin Module

- [ ] 9. Create `src/admin/dto/admin-query.dto.ts`  
      Fields (all `@IsOptional()`):
      - `page?: number` — `@IsInt() @Min(1) @Type(() => Number)`
      - `limit?: number` — `@IsInt() @Min(1) @Max(100) @Type(() => Number)`
      - `search?: string` — `@IsString()`
      - `status?: string` — `@IsString()` (used for hotel verification status or booking status filtering)
      Files: `src/admin/dto/admin-query.dto.ts`  
      Verify: `npm run build` — compiles without errors.

- [ ] 10. Create `src/admin/admin.service.ts`  
       `@Injectable()`, `private readonly logger = new Logger(AdminService.name)`.  
       Injects `PrismaService`.  
       Methods:

       **Platform stats**
       - `getPlatformStats()` — returns counts: `{ totalHotels, activeHotels, pendingHotels, totalUsers, totalBookings, confirmedBookings, totalRevenueNgn, activeSubscriptions }`. Use `prisma.$transaction([prisma.hotel.count(...), ...])` with appropriate `where` clauses.

       **Hotels**
       - `listHotels(query: AdminQueryDto)` — paginated list of all hotels with `verificationStatus` filter, includes `owner` (select firstName, lastName, email) and `subscription`. Defaults: page 1, limit 20.
       - `getHotelDetail(hotelId: string)` — full hotel with owner, staff, verification, subscription, roomTypes, `_count: { bookings: true, reviews: true }`.
       - `approveHotel(hotelId: string, dto: { status: VerificationStatus; notes?: string })` — wraps `HotelsService.approveHotel` — **decision:** import `HotelsService` from `hotels.service.js` rather than duplicating logic; requires `HotelsModule` in AdminModule imports.

       **Users**
       - `listUsers(query: AdminQueryDto)` — paginated list; exclude `passwordHash`; optional `search` on firstName/lastName/email using Prisma `contains insensitive`.
       - `suspendUser(userId: string)` — set `user.isActive = false`.
       - `unsuspendUser(userId: string)` — set `user.isActive = true`.

       **Bookings**
       - `listAllBookings(query: AdminQueryDto)` — paginated with optional `status` filter; include hotel name and user name. Defaults: page 1, limit 20.

       **Payouts**
       - `listPayouts(query: AdminQueryDto)` — paginated Payout list, include hotel name and item count.
       - `processPayoutRequest(payoutId: string)` — set payout status to `PROCESSING`, set `processedAt = new Date()`.

       **Subscriptions**
       - `listAllSubscriptions(query: AdminQueryDto)` — delegates to `SubscriptionsModule` — **decision:** inject `SubscriptionsService`; requires `SubscriptionsModule` in AdminModule imports. Call a simple `prisma.subscription.findMany(...)` with pagination directly (avoid circular import — `SubscriptionsService` doesn't export a paginated-list method, so use PrismaService directly here).

       ESM import constraint: all relative imports end in `.js`.  
       Files: `src/admin/admin.service.ts`  
       Verify: `npm run build` — compiles without errors.

- [ ] 11. Create `src/admin/admin.controller.ts`  
       `@ApiTags('admin') @Controller('admin')`.  
       All routes use `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.SUPER_ADMIN)`.  
       Static routes before parameterized:

       | Method | Path | Handler |
       |---|---|---|
       | `GET` | `/admin/stats` | `getPlatformStats()` |
       | `GET` | `/admin/hotels` | `listHotels(query)` |
       | `GET` | `/admin/hotels/:id` | `getHotelDetail(id)` |
       | `PATCH` | `/admin/hotels/:id/verify` | `approveHotel(id, dto)` |
       | `GET` | `/admin/users` | `listUsers(query)` |
       | `PATCH` | `/admin/users/:id/suspend` | `suspendUser(id)` |
       | `PATCH` | `/admin/users/:id/unsuspend` | `unsuspendUser(id)` |
       | `GET` | `/admin/bookings` | `listAllBookings(query)` |
       | `GET` | `/admin/payouts` | `listPayouts(query)` |
       | `PATCH` | `/admin/payouts/:id/process` | `processPayoutRequest(id)` |
       | `GET` | `/admin/subscriptions` | `listAllSubscriptions(query)` |

       Use `@Query()` for `AdminQueryDto`, `@Param()` for ids, `@Body()` for approve DTO.  
       Files: `src/admin/admin.controller.ts`  
       Verify: `npm run build` — compiles without errors.

- [ ] 12. Create `src/admin/admin.module.ts`  
       imports: `[PrismaModule, HotelsModule]`  
       (`HotelsModule` exports `HotelsService` — needed for `approveHotel`.)  
       controllers: `[AdminController]`  
       providers: `[AdminService]`  
       exports: `[]`  
       Files: `src/admin/admin.module.ts`  
       Verify: `npm run build` — compiles without errors.

---

### STEP 5 — Wire everything into AppModule

- [ ] 13. Update `src/app.module.ts`  
       Add these imports at the top:
       ```ts
       import { ScheduleModule } from '@nestjs/schedule';
       import { BullModule } from '@nestjs/bull';
       import { NotificationsModule } from './notifications/notifications.module.js';
       import { SchedulerModule } from './common/scheduler/scheduler.module.js';
       import { AdminModule } from './admin/admin.module.js';
       ```
       Add to the `imports` array (order: after existing modules, before closing bracket):
       ```ts
       ScheduleModule.forRoot(),
       BullModule.forRootAsync({
         useFactory: (config: ConfigService) => ({
           connection: {
             host: config.get<string>('REDIS_HOST') ?? 'localhost',
             port: config.get<number>('REDIS_PORT') ?? 6379,
           },
         }),
         inject: [ConfigService],
       }),
       NotificationsModule,
       SchedulerModule,
       AdminModule,
       ```
       Also add `import { ConfigService } from '@nestjs/config';` if not already present.  
       Files: `src/app.module.ts`  
       Verify: `npm run build` — compiles without errors.

---

### STEP 6 — Wire notifications into existing modules

- [ ] 14. Update `src/bookings/bookings.module.ts` — add `NotificationsModule` to `imports`.  
       Update `src/bookings/bookings.service.ts` — inject `NotificationsService`; call it in:
       - `confirmBooking()`: after the booking status is set to `CONFIRMED`, call `this.notificationsService.sendBookingConfirmation({ reference, guestEmail, guestFirstName, hotelName, roomTypeName, checkIn, checkOut, totalNgn })`. Hotel and roomType are already included in that query via `include: { hotel: true, roomType: true }`.
       - `cancelBooking()`: after the booking is updated to `CANCELLED`, call `this.notificationsService.sendBookingCancelled({ reference, guestEmail, guestFirstName, hotelName, reason })`.
       
       ESM imports: `NotificationsService` import path from `bookings.service.ts` is `'../notifications/notifications.service.js'`.  
       Files: `src/bookings/bookings.service.ts`, `src/bookings/bookings.module.ts`  
       Verify: `npm run build` — compiles without errors.

- [ ] 15. Update `src/payments/payments.service.ts` — inject `NotificationsService`; call it in the payment confirmation path (where booking moves to `CONFIRMED` after webhook). The exact place is the `handleWebhookEvent` / `verifyAndConfirmPayment` method — read the file first to find the exact method name and the point where `booking.status` becomes `CONFIRMED`.  
       Update `src/payments/payments.module.ts` — add `NotificationsModule` to `imports`.  
       Files: `src/payments/payments.service.ts`, `src/payments/payments.module.ts`  
       Verify: `npm run build` — compiles without errors.

- [ ] 16. Update `src/auth/auth.service.ts` — inject `NotificationsService`; call `sendWelcomeEmail` at the end of `register()` after the user is created. Read `auth.service.ts` first to confirm method name and the user object shape returned.  
       Update `src/auth/auth.module.ts` — add `NotificationsModule` to `imports`.  
       Files: `src/auth/auth.service.ts`, `src/auth/auth.module.ts`  
       Verify: `npm run build` — compiles without errors.

---

### STEP 7 — README update

- [ ] 17. Update `README.md` in `hotel-os-api/`  
       Changes:
       - Change `notifications/` status from `⬜ Pending` to `✅ Complete` in the Project Structure section.
       - Change `admin/` status from `⬜ Pending` to `✅ Complete`.
       - Add `common/scheduler/` entry (new) as `✅ Complete`.
       - Add the Notifications endpoint table documenting that notifications are internal/queue-based (no HTTP endpoints — processing is async via BullMQ).
       - Add the Admin endpoint table (all 11 endpoints listed in Step 11 above).
       - Update the Module Build Order (Roadmap) section to mark both modules complete.
       - Add new env variables to the Environment Variables table: `REDIS_HOST`, `REDIS_PORT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
       Files: `README.md`  
       Verify: `npm run build` — build unaffected; README renders correctly in a Markdown previewer.

---

## ESM Import Checklist (apply to every new file)

- All relative imports end in `.js` — not `.ts`, not extension-less.
- Enum and Prisma type imports from `@prisma/client`, never from a local file.
- Type-only imports use `import { type Foo }` syntax.
- `HandlebarsAdapter` import path: `@nestjs-modules/mailer/dist/adapters/handlebars.adapter.js` (not `.ts`).
- `join` for path construction: `import { join } from 'node:path'`.

## Build & Test Commands

```bash
cd c:\Users\Pkaka\music\hotel-os-api

npm run build          # tsc compile — primary correctness check
npm run test           # Vitest unit tests
npm run start:dev      # dev server on :3001
```

Swagger verification after `npm run start:dev`:  
→ `http://localhost:3001/api/docs` — `admin` tag group must appear with all 11 endpoints.  
→ Queue verification: check Redis is running (`redis-cli ping` → `PONG`) before starting the dev server.

## Potential Issues & Resolutions

| Issue | Resolution |
|---|---|
| `HotelsModule` may not export `HotelsService` | Read `src/hotels/hotels.module.ts` before writing `admin.module.ts`; if not exported, add `HotelsService` to the exports array there, OR implement `approveHotel` logic directly in `AdminService` using `PrismaService`. |
| `MailerModule` and `BullModule` each require Redis / SMTP to be reachable at startup in prod | Both modules use `forRootAsync` with `useFactory` — they will bootstrap without error even if the remote host is down; jobs will fail at dequeue time, not at startup. |
| Circular dependency: `AdminModule` → `HotelsModule` → anything that imports `AdminModule` | `HotelsModule` currently imports only `PrismaModule` — no circular risk. Confirm before wiring. |
| `NotificationsProcessor` needs `MailerService` but `MailerModule` is declared in `NotificationsModule` | Both are in the same module — `MailerModule` in imports, `NotificationsProcessor` in providers. `MailerService` is injected directly. |
| `process.cwd()` in `join(process.cwd(), 'src/notifications/templates')` at module load time | Works correctly because `nest start` and `nest build` both run from the project root. No `ConfigService` needed for this path. |
