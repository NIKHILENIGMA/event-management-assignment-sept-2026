<!-- REQUIREMENTS -->

Event Booking System --- Requirements

1. Assignment Objective
   Build and deploy a backend API for an Event Booking System.

The system supports two user roles:

Event Organizer --- creates and manages events.

Customer --- browses events and books tickets.

The API must enforce role-based access control.

AI tools are explicitly allowed. All important design decisions must be
documented in the README.

The deployed system must be demonstrated through API calls to the
deployed URL.

2. Functional Requirements
   2.1 Authentication
   User registration.

User login.

JWT-based authentication.

Access token + refresh token strategy.

Passwords hashed using Argon2.

Authenticated routes must reject unauthenticated requests.

Role-protected routes must reject users with insufficient
permissions.

2.2 Event Organizer
Organizers can:

Create events.

Update events.

Delete/cancel events.

View their own events.

View bookings for their own events.

2.3 Customer
Customers can:

Browse available events.

View event details.

Book tickets.

View their bookings.

2.4 Booking Capacity
Event capacity must be enforced as a hard invariant.

For an event:

bookedTickets <= capacity
must always hold, including under concurrent booking requests.

The system must prevent overselling caused by race conditions.

Recommended booking model:

One active booking per customer per event.

Database-level uniqueness should enforce this where appropriate.

2.5 Background Task --- Booking Confirmation
When a customer successfully books tickets:

The booking must be persisted.

A background job must be created.

A worker must process the job asynchronously.

A real booking confirmation email must be sent.

A console log pretending to send an email does not satisfy the
requirement.

Technology:

BullMQ

Redis hosted by Upstash

Resend for real email delivery

2.6 Background Task --- Event Update Notification
When an organizer updates an event:

The event must be updated.

Customers with active bookings for that event must be identified.

Notification jobs must be queued.

A worker must process the jobs asynchronously.

Real notification emails must be sent.

Only customers with active/valid bookings are notified.

3. Performance Requirements
   The assignment requires a stress scenario against the deployed API.

The performance experiment must demonstrate:

The breaking/degradation point of the initial implementation.

The bottleneck or reason for degradation.

The optimization performed.

The final constraints after optimization.

The measurable delta between the initial and optimized
implementations.

Primary performance scenario
Concurrent users booking tickets.

Example progression:

50 → 100 → 200 → 500 → 1000 concurrent users
The actual breaking point must be discovered experimentally. Do not
invent it beforehand.

Measure at minimum:

Concurrent virtual users.

Total requests.

Successful requests.

Failed requests.

Error rate.

Requests per second / throughput.

p95 latency.

p99 latency where useful.

Concurrent booking correctness
Also test many users booking the same event.

Example:

Event capacity = 100
500 concurrent booking attempts
Expected invariant:

Successful tickets <= 100
Final bookedTickets <= 100
The exact success/failure distribution depends on the test.

Event update performance
Run a smaller concurrent test against event update endpoints.

This does not need to be the primary optimization target; the booking
path is the main performance focus because it contains inventory
contention and concurrency-sensitive database operations.

4. Performance Comparison Design
   Use one deployed Render service with two benchmark implementations:

POST /api/initial/events/:eventId/bookings
POST /api/optimized/events/:eventId/bookings
The initial endpoint represents the baseline implementation.

The optimized endpoint represents the improved implementation.

Both run inside the same NestJS deployment so infrastructure remains
constant.

The two implementations should use:

Same Render service/resources.

Same PostgreSQL tier/configuration.

Same BullMQ/Redis infrastructure.

Same k6 workload.

Same request count.

Same concurrency levels.

Equivalent test data.

Use separate test events (or reset data) so the first experiment does
not contaminate the second.

The primary optimization should focus on replacing a read-check-write
inventory flow with an atomic database operation.

5. Baseline Booking Strategy
   Baseline concept:

SELECT event
↓
Read bookedTickets/capacity
↓
Application checks availability
↓
INSERT booking
↓
UPDATE event
This is intentionally retained as the initial implementation for the
performance experiment.

The experiment should identify its actual behavior under concurrency.

6. Optimized Booking Strategy
   Optimized concept:

Atomic inventory update
↓
affected rows = 1 → capacity reserved
↓
create booking

affected rows = 0 → insufficient capacity
Conceptual SQL:

UPDATE events
SET booked_tickets = booked_tickets + $quantity
WHERE id = $eventId
AND booked_tickets + $quantity <= capacity;
The implementation must use the appropriate transaction strategy so
booking creation and inventory reservation remain consistent.

7. Email and Load Testing
   Resend has a limited free sending allowance, so performance testing must
   not attempt to send hundreds of real emails.

Use an email abstraction:

EmailService
├── ResendEmailService
└── TestEmailService
Functional/demo environment:

EMAIL_PROVIDER=resend
Performance environment:

EMAIL_PROVIDER=test
The test provider must still allow the BullMQ job to be created and
processed. It should only avoid external email delivery.

The actual functional demo must demonstrate real emails through Resend.

8. Deployment
   Target deployment:

Render --- NestJS API/worker process.

Supabase --- PostgreSQL.

Upstash --- Redis.

Resend --- transactional email.

k6 --- load testing from the developer machine against the
deployed Render URL.

Target additional infrastructure cost: approximately ₹0 for the
assignment, staying comfortably below the ₹500 budget.

9. Demo Video Requirements
   One video is required.

Target duration:

Minimum: 2 minutes.

Maximum: 5 minutes.

Ideal: approximately 3--4 minutes.

The presenter must:

Show their face.

Speak in English.

Demonstrate API calls against the deployed URL.

The video must show:

Initial implementation's performance degradation/breaking point.

Actual requests/results, not just verbal claims.

Explanation of the bottleneck.

Optimization.

Same/similar workload against the optimized implementation.

Final measured constraints/delta.

Functional background task demonstration with real email.

Recommended video structure:

Architecture
↓
Functional deployed API demo
↓
Initial performance test
↓
Observed degradation
↓
Optimization explanation
↓
Optimized performance test
↓
Concurrent booking correctness
↓
Real email / BullMQ demonstration
↓
Final comparison 10. Documentation Requirements
README must document all important design decisions, including:

Architecture.

Technology choices.

Authentication.

Authorization.

Database design.

Booking concurrency strategy.

Capacity enforcement.

BullMQ/Redis architecture.

Email architecture.

Performance methodology.

Baseline implementation.

Bottleneck discovered.

Optimization.

Benchmark results.

Trade-offs.

Deployment.

Future improvements.

All benchmark numbers must come from actual tests.
