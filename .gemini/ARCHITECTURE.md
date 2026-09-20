Event Booking System --- Architecture

1. Technology Stack

Layer Technology Purpose

Language TypeScript Type-safe backend
Framework NestJS Modular REST API
ORM Drizzle ORM Database access and schema
Database PostgreSQL / Supabase Persistent application data
Authentication JWT access + refresh tokens Authentication
Password hashing Argon2 Secure password storage
Queue BullMQ Background job processing
Redis Upstash Redis BullMQ backing store
Email Resend Real email delivery
API hosting Render Deployed NestJS application
Load testing k6 Performance testing
API testing Postman/Bruno/etc. Functional API demonstration

2.  High-Level Architecture

                         Internet
                            │
                            ▼
                     ┌──────────────┐
                     │    Render    │
                     │    NestJS    │
                     └──────┬───────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
          Auth API       Events API     Bookings API
             │              │              │
             └──────────────┼──────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Drizzle ORM  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Supabase    │
                    │  PostgreSQL   │
                    └───────────────┘

Bookings / Event Updates
│
▼
BullMQ Queue
│
▼
Upstash Redis
│
▼
BullMQ Worker
│
▼
EmailService
│ │
│ └── TestEmailService
│
└────────── ResendEmailService

3. User Roles

ORGANIZER

Can:

Create events.

Update events.

Delete/cancel events.

View their own events.

View bookings for their own events.

CUSTOMER

Can:

Browse events.

View event details.

Book tickets.

View their bookings.

Role enforcement occurs server-side through NestJS guards.

4. Authentication Architecture

Register
↓
Argon2 password hash
↓
PostgreSQL

Login
↓
Verify Argon2 hash
↓
Issue access token + refresh token

Protected request
↓
JWT authentication guard
↓
Role guard
↓
Controller

Access tokens authenticate requests.

Refresh tokens allow obtaining new access tokens without requiring the
user to log in again.

5. Core API Endpoints

Authentication

POST /auth/register
POST /auth/login
POST /auth/refresh

Events

GET /events
GET /events/:id
POST /events
PATCH /events/:id
DELETE /events/:id
GET /events/my
GET /events/:id/bookings

Bookings

POST /events/:id/bookings
GET /bookings
GET /bookings/:id

The exact response DTOs and validation schemas should be defined during
implementation.

6. Performance Experiment Endpoints

For the performance experiment, expose two booking
implementations within the same deployed application:

POST /api/initial/events/:eventId/bookings
POST /api/optimized/events/:eventId/bookings

Initial

Uses the baseline read-check-write strategy:

SELECT event
↓
Check capacity in application
↓
Create booking
↓
Update event inventory

Optimized

Uses an atomic inventory operation:

Atomic UPDATE
↓
Rows affected = 1
→ inventory reserved

Rows affected = 0
→ insufficient capacity

Both implementations must use the same:

Render deployment.

PostgreSQL environment/tier.

Redis.

BullMQ worker.

Email abstraction.

Test infrastructure.

The two benchmark endpoints are experimental comparison endpoints. The
optimized implementation is the final implementation to demonstrate.

7. Booking Flow

Customer booking

Customer
│
│ POST /events/:id/bookings
▼
JWT Guard
│
▼
Role Guard (CUSTOMER)
│
▼
BookingService
│
▼
Database transaction
│
├── Reserve capacity
└── Create booking
│
▼
Queue booking-confirmation job
│
▼
HTTP response

The email is not on the synchronous request critical path.

Background confirmation

BookingService
│
▼
BullMQ Queue
│
▼
Upstash Redis
│
▼
Worker
│
▼
EmailService
│
▼
Resend
│
▼
Customer inbox

8. Event Update Flow

Organizer
│
│ PATCH /events/:id
▼
JWT + ORGANIZER guard
│
▼
EventService
│
▼
Update event
│
▼
Find customers with active bookings
│
▼
Queue notification jobs
│
▼
Upstash Redis
│
▼
BullMQ Worker
│
▼
Resend
│
▼
Customers

Only customers with active/valid bookings are notified.

9. Database Model

Core entities:

User
├── id
├── name
├── email
├── passwordHash
├── role
├── createdAt
└── updatedAt

Event
├── id
├── organizerId
├── title
├── description
├── location
├── startAt
├── endAt
├── capacity
├── bookedTickets
├── createdAt
└── updatedAt

Booking
├── id
├── eventId
├── customerId
├── quantity
├── status
├── createdAt
└── updatedAt

Relationships:

User (Organizer)
│
│ 1:N
▼
Event
│
│ 1:N
▼
Booking
▲
│ N:1
│
User (Customer)

Recommended constraints:

User.email
UNIQUE

Booking(customerId, eventId)
UNIQUE for one active booking per customer/event

Exact Drizzle ORM constraints may use a composite unique constraint and
status strategy depending on the final schema.

10. Concurrency Strategy

Required invariant

bookedTickets <= capacity

Baseline

SELECT
→ application capacity check
→ INSERT
→ UPDATE

This is intentionally used to establish the initial performance
baseline.

Optimized

Use an atomic conditional update:

UPDATE events
SET booked_tickets = booked_tickets + $quantity
WHERE id = $eventId
AND booked_tickets + $quantity <= capacity;

If the update affects one row:

Capacity successfully reserved.

If it affects zero rows:

Insufficient capacity.

The booking record must be created transactionally with the reservation
so a partial success cannot leave inconsistent inventory.

11. Background Processing Architecture

BullMQ is used because background work should not block the API request.

Queue:

notificationQueue

Job types:

booking-confirmation
event-update-notification

Worker:

NotificationProcessor

Email abstraction:

EmailService
├── ResendEmailService
└── TestEmailService

Production/demo:

EMAIL_PROVIDER=resend

Load test:

EMAIL_PROVIDER=test

The test provider still processes jobs but does not consume external
Resend email quota.

12. Project Directory Structure

Target NestJS structure:

event-booking-api/
│
├── src/
│ │
│ ├── main.ts
│ ├── app.module.ts
│ │
│ ├── auth/
│ │ ├── auth.controller.ts
│ │ ├── auth.service.ts
│ │ ├── auth.module.ts
│ │ ├── dto/
│ │ ├── guards/
│ │ ├── strategies/
│ │ └── types/
│ │
│ ├── users/
│ │ ├── users.service.ts
│ │ ├── users.module.ts
│ │ └── ...
│ │
│ ├── events/
│ │ ├── events.controller.ts
│ │ ├── events.service.ts
│ │ ├── events.module.ts
│ │ ├── dto/
│ │ └── ...
│ │
│ ├── bookings/
│ │ ├── bookings.controller.ts
│ │ ├── bookings.service.ts
│ │ ├── bookings.module.ts
│ │ ├── dto/
│ │ └── ...
│ │
│ ├── notifications/
│ │ ├── notifications.module.ts
│ │ ├── notifications.service.ts
│ │ ├── processors/
│ │ │ └── notification.processor.ts
│ │ └── ...
│ │
│ ├── email/
│ │ ├── email.module.ts
│ │ ├── email.service.ts
│ │ ├── providers/
│ │ │ ├── resend-email.service.ts
│ │ │ └── test-email.service.ts
│ │ └── ...
│ │
│ ├── drizzle/
│ │ ├── drizzle.module.ts
│ │ ├── drizzle.service.ts
│ │ └── schema/
│ │
│ ├── common/
│ │ ├── decorators/
│ │ ├── guards/
│ │ ├── filters/
│ │ ├── interceptors/
│ │ └── ...
│ │
│ └── config/
│ └── ...
│
├── drizzle/
│ └── migrations/
│
├── test/
│
├── performance/
│ ├── initial.js
│ ├── optimized.js
│ └── results/
│
├── docs/
│ ├── REQUIREMENTS.md
│ ├── RULES.md
│ ├── ARCHITECTURE.md
│ └── MEMORY.md
│
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md

The exact directory structure can be simplified during implementation if
a folder does not need multiple files.

13. Deployment Architecture

GitHub
│
▼
Render
│
└── NestJS API + BullMQ Worker
│
├──────────► Supabase PostgreSQL
│
└──────────► Upstash Redis
│
▼
BullMQ Worker
│
▼
Resend

The worker may run within the same Render process for assignment
simplicity.

A production-scale architecture could separate API and worker processes
for independent scaling.

14. Performance Testing Architecture

Developer machine
│
│ k6 HTTPS requests
▼
Render
│
▼
NestJS
│
├── PostgreSQL
│
└── BullMQ → Upstash Redis → Worker

The performance benchmark must target the deployed URL, not localhost.

Primary test:

Concurrent users
↓
Booking endpoint
↓
Observe latency/errors/throughput

Secondary test:

Many users
↓
Same event
↓
Capacity correctness

Additional test:

Concurrent event updates
↓
Observe latency/errors

15. Performance Comparison

The baseline and optimized implementations should be tested using the
same k6 scenario.

Example:

50 VUs
100 VUs
200 VUs
500 VUs
1000 VUs

Stop/increase the workload based on actual observed behavior.

Record:

VUs
Requests
Successful requests
Failed requests
Error rate
Throughput
p95
p99

Never invent the breaking point.

16. Key Architecture Decisions

NestJS

Chosen for modular architecture, dependency injection, guards,
decorators, and maintainability.

PostgreSQL

Chosen because event inventory and booking consistency are
relational/concurrency-sensitive problems.

Supabase

Provides managed PostgreSQL suitable for a low-cost assignment
deployment.

BullMQ + Upstash

Chosen for real background job processing without introducing a paid
Redis server.

Resend

Chosen for simple transactional email delivery and easy integration.

Render

Chosen for simple and low-cost deployment.

k6

Chosen for reproducible concurrent API load testing.

One Render service with two benchmark endpoints

The baseline and optimized booking implementations are exposed in the
same deployment so infrastructure remains constant:

/api/initial/...
/api/optimized/...

This reduces experimental variables and makes the performance comparison
easier to explain.

17. Production Improvements Not Required for the Assignment

Potential future improvements:

Separate API and worker deployments.

Durable event/outbox pattern.

BullMQ retry/dead-letter strategy.

Idempotent notification jobs.

Rate limiting.

Distributed tracing.

Prometheus/Grafana metrics.

More advanced database partitioning/scaling.

Horizontal API scaling.

Dedicated Redis production tier.

Payment processing.

Ticket cancellation/refunds.

Event search/filtering.
