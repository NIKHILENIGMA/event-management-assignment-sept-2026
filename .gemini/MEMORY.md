Event Booking System --- Project Memory
Purpose of this file
This file is a compact context file for AI coding agents.

Read this before making major project decisions.

The project is a backend assignment. The developer wants to
understand and defend the architecture rather than blindly accept
generated code.

Assignment
Build and deploy a backend API for an Event Booking System.

Two roles:

ORGANIZER
CUSTOMER
Organizers manage events.

Customers browse events and book tickets.

The assignment explicitly encourages AI usage and requires all design
decisions to be documented in README.

The final demo must use the deployed API.

Deadline / Priority
Deadline:

September 20, 2026 — approximately 5 PM IST
Therefore:

Keep scope focused.

Avoid unnecessary infrastructure.

Prefer strong, explainable architecture.

Do not introduce technologies that do not materially help the
assignment.

The performance experiment and video are high priority.

Target quality:

Strong production-style implementation
Not merely a minimum passing solution.

Developer Workflow Preference
The developer wants:

Design first
→ implement
→ review
→ continue
The developer will write/implement the code with AI guidance.

Do not dump an entire codebase without explaining the architecture.

Important decisions should be discussed before implementation.

Final Technology Decisions
Backend
NestJS
TypeScript
Drizzle ORM
PostgreSQL
Database
Supabase PostgreSQL
Authentication
JWT access token
JWT refresh token
Argon2 password hashing
Background processing
BullMQ
Upstash Redis
Do NOT use NestJS EventEmitter as the final background-job mechanism.

Reason:

BullMQ provides a real queue/worker architecture and is more appropriate
for demonstrating background processing in this assignment.

Email
Resend
Real emails must be sent for functional verification.

Deployment
Render
One Render service is preferred.

Load testing
k6
k6 runs from the developer's machine but targets the deployed Render
URL.

Cost Constraint
Developer does not want to spend more than ₹500 total.

Preferred infrastructure cost:

₹0 additional spend
Expected services:

Render → free/low-cost assignment deployment
Supabase → free tier
Upstash → free tier
Resend → free allowance
Do not purchase paid infrastructure unless explicitly discussed first.

Background Job Architecture
Use:

NestJS API
↓
BullMQ
↓
Upstash Redis
↓
BullMQ Worker
↓
EmailService
↓
Resend
Two important job types:

booking-confirmation
event-update-notification
The worker can run in the same Render process for this assignment.

Production improvement:

Separate API and worker processes
but this is not necessary for the assignment.

Email Quota Strategy
Do NOT send hundreds of real Resend emails during k6 tests.

Use:

EmailService
├── ResendEmailService
└── TestEmailService
Functional demo:

EMAIL_PROVIDER=resend
Load test:

EMAIL_PROVIDER=test
The test provider still lets BullMQ jobs be created and processed; it
only prevents external email delivery.

Functional demo must show at least:

Real booking confirmation email.

Real event-update notification email.

Booking Rules
Recommended business rule:

One active booking per customer per event.
Use a database-level uniqueness strategy where appropriate.

Example:

UNIQUE(customerId, eventId)
or an equivalent schema strategy if booking status requires historical
cancelled bookings.

Capacity Rule
Critical invariant:

bookedTickets <= capacity
This must hold even under concurrent requests.

Example:

capacity = 100
500 concurrent booking requests
The system must never produce:

bookedTickets = 101+
Correctness is more important than making a benchmark look good.

Performance Experiment
This is the central part of the assignment.

The evaluator wants to see:

Initial LLM implementation.

Actual performance degradation/breaking point.

Explanation of the bottleneck.

Optimization.

Final performance constraints.

Measurable delta.

The performance test must hit the deployed Render URL.

Do not use localhost as the primary evidence.

Benchmark Architecture
Use ONE Render deployment with two benchmark implementations:

POST /api/initial/events/:eventId/bookings
POST /api/optimized/events/:eventId/bookings
This is preferred over two separate Render servers.

Reason:

Both implementations share:

Same server.

Same CPU/memory environment.

Same network environment.

Same database tier.

Same Redis.

Same worker.

Same application infrastructure.

Only the booking implementation differs.

This makes the performance comparison easier to defend.

Baseline Implementation
Conceptually:

POST booking
↓
SELECT event
↓
Check capacity
↓
INSERT booking
↓
UPDATE event
↓
Queue email job
↓
Response
This represents the initial/LLM implementation.

Do not intentionally make it broken or fake. It must be a genuine
baseline implementation.

Optimized Implementation
Conceptually:

POST booking
↓
Atomic conditional inventory update
↓
Success?
┌──┴──┐
Yes No
│ │
▼ ▼
Create Reject
booking capacity
│
▼
Queue email
│
▼
Response
Conceptual SQL:

UPDATE events
SET booked_tickets = booked_tickets + $quantity
WHERE id = $eventId
AND booked_tickets + $quantity <= capacity;
Use the appropriate transaction strategy to keep inventory and booking
creation consistent.

Why Atomic Update Matters
Baseline:

READ
→ CHECK
→ WRITE
Multiple concurrent requests may contend around the same inventory
state.

Optimized:

DATABASE ATOMIC CONDITION
→ reservation succeeds or fails
The database enforces the capacity constraint.

This is the main optimization story.

Other optimizations should be based on actual measurements, such as:

Reducing query count.

Reducing transaction scope.

Correct indexes.

Connection pool configuration.

Removing unnecessary work from the request path.

Async email delivery.

Do not claim a bottleneck before measuring it.

Performance Scenarios
Primary
Concurrent users booking tickets.

Example progression:

50
100
200
500
1000
Actual breaking point must be discovered experimentally.

Same-event concurrency
Example:

Event capacity = 100
500 concurrent booking attempts
Expected:

Successful tickets <= 100
This is primarily a correctness/concurrency demonstration.

Event update concurrency
Run a smaller test against event update.

This does not need to be the primary optimization target.

The booking path is the main performance focus because it involves:

Database contention

- Inventory
- Race conditions
- Transactions
  Important Experimental Rule
  Do not compare:

Baseline with one workload
vs
Optimized with a different workload
Use the same:

k6 script.

concurrency.

number of requests.

event configuration.

ticket quantity.

database tier.

infrastructure.

Use separate test events or reset the test state between tests.

Video Plan
Target:

3–4 minutes
Maximum:

5 minutes
Minimum:

2 minutes
Must:

Show face.

Speak English.

Use deployed API.

Demonstrate API calls.

Recommended sequence:

0:00–0:20
Architecture diagram

0:20–0:45
Functional deployed API call

0:45–1:30
Initial k6 performance test
Show actual degradation

1:30–2:00
Explain bottleneck
Show Eraser before/after

2:00–2:30
Optimized k6 test
Show measured delta

2:30–3:05
Same-event concurrency/capacity correctness

3:05–3:30
Event update concurrency

3:30–4:00
BullMQ + real Resend email + final result
Eraser Diagram Strategy
Do not make one giant diagram.

Prefer three diagrams:

Diagram 1 --- System architecture
Client
↓
Render / NestJS
├── Auth
├── Events
└── Bookings
│
├── Supabase PostgreSQL
│
└── BullMQ → Upstash Redis → Worker → Resend
Diagram 2 --- Initial bottleneck
SELECT
↓
CHECK
↓
INSERT
↓
UPDATE
Diagram 3 --- Optimized path
Atomic UPDATE
│
┌────┴────┐
▼ ▼
Success Failure
│ │
▼ ▼
Booking Capacity exceeded
The video story should be:

Architecture
→ Baseline
→ Break/degrade
→ Diagnose
→ Optimize
→ Re-test
→ Improved result
API Shape
Authentication:

POST /auth/register
POST /auth/login
POST /auth/refresh
Events:

GET /events
GET /events/:id
POST /events
PATCH /events/:id
DELETE /events/:id
GET /events/my
GET /events/:id/bookings
Bookings:

POST /events/:id/bookings
GET /bookings
GET /bookings/:id
Benchmark booking endpoints:

POST /api/initial/events/:eventId/bookings
POST /api/optimized/events/:eventId/bookings
Only the performance-sensitive booking implementation needs the
initial/optimized split.

Do not duplicate the whole application API.

Database Entities
User
Event
Booking
User:

id
name
email
passwordHash
role
createdAt
updatedAt
Event:

id
organizerId
title
description
location
startAt
endAt
capacity
bookedTickets
createdAt
updatedAt
Booking:

id
eventId
customerId
quantity
status
createdAt
updatedAt
Relationships:

Organizer User
1
│
N
Events
1
│
N
Bookings
N
│
1
Customer User
Authorization
Organizer:

CREATE event
UPDATE own event
DELETE/cancel own event
VIEW own events
VIEW bookings for own events
Customer:

BROWSE events
VIEW event
BOOK tickets
VIEW own bookings
Never trust the client to enforce roles.

Use NestJS guards.

Architecture Principles
PostgreSQL is the source of truth for users, events, and bookings.

Redis is not the source of truth for ticket inventory.

BullMQ handles asynchronous work.

Email delivery is outside the API critical path.

Database constraints protect important invariants.

Authentication and authorization are server-side.

Performance claims must be measurement-based.

Baseline and optimized implementations must be experimentally
comparable.

The final optimized endpoint must remain a real production-quality
implementation.

Avoid unnecessary infrastructure.

Current Project Direction
The next implementation sequence should be:

1. Initialize NestJS
2. Configure Drizzle ORM/PostgreSQL
3. Define schema
4. Implement auth
5. Implement role guards
6. Implement event CRUD
7. Implement baseline booking
8. Implement optimized booking
9. Add BullMQ + Upstash
10. Add Resend/Test email providers
11. Add event-update notifications
12. Add tests
13. Deploy Render
14. Run baseline k6 tests
15. Measure bottleneck
16. Optimize
17. Run identical optimized tests
18. Record results
19. Finish README
20. Record demo video
    Do Not Forget
    The evaluator is not only checking whether endpoints exist.

The strongest part of this submission is:

Initial implementation
↓
Measured performance problem
↓
Technical diagnosis
↓
Specific optimization
↓
Measured improvement
The optimization must be real, measurable, and explainable.
