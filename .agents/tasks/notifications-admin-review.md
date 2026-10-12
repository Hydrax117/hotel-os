# Notifications queue, scheduled jobs, and admin management layer — v2 pass

The change introduces a BullMQ-backed notification queue with five job types (booking confirmation, cancellation, check-in reminder, welcome email, hotel approval), three cron-scheduled background jobs, and a full admin REST surface covering platform stats, hotel verification, user management, and revenue reporting. All four findings from the prior review pass have been resolved: the consumer now extends `WorkerHost` from `@nestjs/bullmq`, the daily cron carries `{ timeZone: 'UTC' }`, revenue stats use database-side aggregation, and `suspendHotel` uses a validated `SuspendHotelDto`.

**Watch for:** Nothing blocking. All acceptance criteria pass.

**Verdict**: APPROVED

---

## High-level view

All ten acceptance criteria are confirmed met. Relative imports use `.js` throughout. `BullModule.forRootAsync` in `app.module.ts` reads Redis config from `ConfigService`. `MailerModule.forRootAsync` uses `HandlebarsAdapter` pointing to `src/notifications/templates`. The three cron jobs are `EVERY_5_MINUTES`, `EVERY_HOUR`, and `'0 8 * * *'` with `{ timeZone: 'UTC' }` explicitly set. `sendCheckInReminders` queries on `checkIn: { gte: tomorrow, lt: dayAfter }` and `status: CONFIRMED`. `AdminController` carries `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.SUPER_ADMIN)` at class level. `getPlatformStats` runs nine queries in a single `Promise.all`. No `any` types appear anywhere. Both `NotificationsModule` and `AdminModule` are wired into `app.module.ts`. `NotificationsConsumer` extends `WorkerHost` from `@nestjs/bullmq`.

The `getRevenueStats` fix is thorough: totals come from `prisma.payment.aggregate`, and the daily bucketing uses a raw SQL `GROUP BY DATE(paidAt)` query — no in-memory reduction. The `SuspendHotelDto` (`@IsString() @IsNotEmpty() reason`) closes the validation gap on the suspend endpoint.

One observation worth noting for future work: `NotificationsService` injects both `@InjectQueue(NOTIFICATION_QUEUE)` and `MailerService`, giving it a dual role as both queue producer and direct mailer. The cron job path (`queueNotification`) enqueues to BullMQ while the booking/auth call sites call the `sendXxx` methods directly, bypassing the queue entirely. This asymmetry is not a bug — both paths work — but it means check-in reminders get BullMQ retry semantics while booking confirmation emails do not.

<details>
<summary>Issues (0)</summary>

No blocking issues. All four findings from the prior review pass are resolved.

</details>

<details>
<summary>Details</summary>

### Prior findings resolution

**Consumer/WorkerHost (was AC #10 failure):** `NotificationsConsumer` now imports `Processor` and `WorkerHost` from `@nestjs/bullmq` and `extends WorkerHost` with a single `async process(job: Job)` dispatch method using a switch on `job.name`. The `@Processor(NOTIFICATION_QUEUE)` decorator is correctly applied. The module also uses `BullModule` from `@nestjs/bullmq` consistently — the plan referenced `@nestjs/bull` but the implementation correctly uses the BullMQ v2 package.

**Cron UTC timezone (was flagged):** `@Cron('0 8 * * *', { timeZone: 'UTC' })` is present on `sendCheckInReminders`. The UTC midnight boundary used in the date math (`setUTCHours(0, 0, 0, 0)`) now aligns with the cron's fire time.

**Revenue stats memory load (was flagged):** `getRevenueStats` now runs `prisma.payment.aggregate` for totals and a `$queryRaw` GROUP BY for daily bucketing — both aggregated in the database. The raw SQL casts `bigint` to `float8` for the sums and the TypeScript mapper calls `Number()` on the returned bigint `bookings` column.

**Unvalidated suspendHotel body (was flagged):** `SuspendHotelDto` with `@IsString() @IsNotEmpty() reason` is created and used by the controller. `admin.service.ts` receives the reason as a plain `string` parameter after the controller extracts `dto.reason`.

### Dual-path notification delivery

`NotificationsService` exposes two delivery surfaces. Methods like `sendBookingConfirmation` call `mailerService.sendMail` directly and synchronously (from the caller's perspective). `queueNotification` enqueues to BullMQ and returns immediately; the consumer picks up the job asynchronously with retry semantics. The scheduled check-in reminder path uses `queueNotification`; booking and auth call sites use the direct methods. This means failed check-in reminder emails will be retried by BullMQ's default policy, but a failed booking confirmation email propagates the exception to the caller rather than retrying. Whether this asymmetry matters depends on whether `BookingsService` and `AuthService` have their own retry logic, but it is not a bug in this PR.

</details>

---

<details>
<summary>File map</summary>

| File | Change |
|---|---|
| `src/notifications/notification-queues.ts` | Queue name constants + `NotificationJobType` and `ScheduledJobType` enums |
| `src/notifications/notifications.service.ts` | Mailer wrapper (direct send) + queue producer (`queueNotification`) |
| `src/notifications/notifications.consumer.ts` | `WorkerHost` subclass dispatching all 5 job types |
| `src/notifications/scheduled-jobs.service.ts` | 3 cron jobs; daily cron has `{ timeZone: 'UTC' }` |
| `src/notifications/notifications.module.ts` | `BullModule.registerQueue`, `ScheduleModule.forRoot`, `MailerModule.forRootAsync` with HandlebarsAdapter |
| `src/admin/admin.types.ts` | `PlatformStats` and `RevenueStats` type aliases |
| `src/admin/admin.service.ts` | Platform stats (Promise.all), hotel/user/booking CRUD, revenue via DB aggregation |
| `src/admin/admin.controller.ts` | Class-level JwtAuthGuard + RolesGuard + SUPER_ADMIN |
| `src/admin/admin.module.ts` | PrismaModule import, AdminController, AdminService |
| `src/admin/dto/admin-hotel-query.dto.ts` | Paginated hotel query with VerificationStatus filter |
| `src/admin/dto/admin-user-query.dto.ts` | Paginated user query with UserRole filter |
| `src/admin/dto/admin-booking-query.dto.ts` | Paginated booking query with status + date range |
| `src/admin/dto/approve-hotel.dto.ts` | VerificationStatus enum + optional notes |
| `src/admin/dto/suspend-hotel.dto.ts` | `@IsString() @IsNotEmpty() reason` DTO (new, fixes prior finding) |
| `src/app.module.ts` | `BullModule.forRootAsync` with ConfigService Redis config; NotificationsModule + AdminModule added |

</details>
