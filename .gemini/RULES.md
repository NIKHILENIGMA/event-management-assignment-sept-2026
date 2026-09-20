Antigravity Rules --- Event Booking System
This file defines the rules for AI-assisted development of this
assignment.

1. Primary Goal
   Build a strong, understandable, production-style backend while
   preserving the ability of the developer to explain every important
   design decision.

The agent must optimize for:

Correctness.

Security.

Concurrency safety.

Measurable performance.

Clear architecture.

Maintainability.

Fast execution within the assignment deadline.

Do not optimize for unnecessary complexity.

2. General Rules
   DO
   Read REQUIREMENTS.md, ARCHITECTURE.md, and MEMORY.md before
   making major changes.

Follow the documented architecture unless a concrete reason requires
changing it.

Prefer small, reviewable changes.

Explain important architectural changes before implementing them.

Preserve existing working functionality.

Run tests/lint/type checks after meaningful changes.

Use environment variables for secrets and external configuration.

Keep production credentials out of source control.

Use proper error handling.

Validate request input.

Enforce authorization on the server.

Use database constraints where they protect important invariants.

Measure performance instead of guessing.

Record baseline performance before optimizing.

Compare baseline and optimized implementations using the same
workload.

Keep benchmark evidence and results.

Keep the final optimized implementation clean and
production-oriented.

DO NOT
Do not invent benchmark numbers.

Do not claim an optimization improved performance without
measurement.

Do not fake email delivery with a console statement for the
functional requirement.

Do not bypass authentication/authorization for convenience.

Do not expose secrets in code, logs, commits, screenshots, or video.

Do not add unnecessary libraries.

Do not introduce microservices for this assignment.

Do not introduce Kubernetes.

Do not add paid infrastructure unless explicitly approved.

Do not replace PostgreSQL with an in-memory database.

Do not remove capacity enforcement to make load tests look better.

Do not make the optimized endpoint artificially faster by returning
fake responses.

Do not change the workload between baseline and optimized tests in a
way that invalidates the comparison.

Do not send hundreds of real Resend emails during load testing.

3. AI Coding Rules
   AI may generate code, but generated code must be reviewed.

Before accepting generated code:

Understand what it does.

Check security implications.

Check transaction behavior.

Check error handling.

Check database queries.

Check concurrency behavior.

Check whether it matches the documented architecture.

The agent must not silently make major architecture changes.

If a major change is proposed, explain:

Problem
→ Proposed change
→ Why
→ Trade-offs
→ Expected effect
Then implement it.

4. Booking Rules
   Booking capacity is a critical invariant.

Never implement booking as an unsafe read-check-write flow in the
optimized version.

The optimized implementation must use database-level
atomicity/transaction semantics.

Invariant:

bookedTickets <= capacity
must always hold.

Do not solve concurrency by simply adding arbitrary delays, retries, or
artificial locks without understanding the database behavior.

5. Performance Rules
   The performance experiment is part of the assignment, not an optional
   benchmark.

Baseline
Preserve a genuine baseline implementation.

Test
Use k6 against the deployed Render URL.

Compare
Use equivalent:

workload,

concurrency,

request mix,

event configuration,

database tier,

infrastructure.

Measure
At minimum:

VUs/concurrency.

Requests.

Successes.

Failures.

Error rate.

Throughput.

p95 latency.

Optimize
Only optimize based on measured bottlenecks.

Potential optimization areas:

Atomic database operations.

Transaction scope.

Query count.

Database indexes.

Connection pooling.

Unnecessary application work.

Async processing of non-critical work.

Do not optimize based only on theoretical assumptions.

6. Background Job Rules
   Use:

BullMQ.

Upstash Redis.

NestJS worker.

Booking and event-update emails must be asynchronous.

The API should not wait for external email delivery before responding to
the booking/update request.

The queue/worker must remain active during load testing, but the
external email provider should be replaceable with a test provider.

7. Email Rules
   Use an interface/abstraction:

EmailService
Implement:

ResendEmailService
TestEmailService
Use Resend for real functional verification.

Use TestEmailService for high-volume performance tests.

Never claim that a test email was sent externally when it was only
processed by the test provider.

8. Deployment Rules
   The final system must work through the deployed Render URL.

Localhost testing is useful during development but does not count as the
primary performance evidence for the assignment.

Before the final demo:

Verify deployment.

Verify database connectivity.

Verify Redis connectivity.

Verify worker processing.

Verify real Resend delivery.

Verify all demo endpoints.

Verify k6 points to the deployed URL.

9. Code Organization Rules
   Keep responsibilities separated:

Controller
↓
Service
↓
Repository/Drizzle
Background work:

Service
↓
Queue
↓
Worker
↓
Email service
Do not put database logic directly into controllers.

Do not put large business workflows directly into controllers.

10. Demo Rules
    The demo must show real deployed behavior.

Do not:

Show only localhost.

Show fabricated benchmark output.

Show only screenshots of results.

Claim a breaking point without actually running the workload.

Hide failures during the baseline test.

Pretend a local result is a deployed result.

The evaluator should be able to see the progression:

Initial
→ Break/degrade
→ Diagnose
→ Optimize
→ Re-test
→ Improved result 11. Token/Context Efficiency
The agent should avoid repeatedly rediscovering project context.

Use these files as persistent project context:

REQUIREMENTS.md
RULES.md
ARCHITECTURE.md
MEMORY.md
Before asking the developer to repeat information, check these files.

Keep explanations focused and avoid unnecessary long outputs when a
concise implementation plan is sufficient.

12. Change Discipline
    For every major change:

State what is changing.

State why.

Implement it.

Test it.

Record important decisions in documentation.

Do not silently rewrite unrelated parts of the project.

13. Final Quality Gate
    Before declaring the project complete, verify:

Authentication works.

Refresh tokens work.

Argon2 password hashing works.

Role authorization works.

Organizer CRUD works.

Customer booking works.

Capacity cannot be exceeded.

Duplicate active booking rule is enforced.

Booking confirmation job works.

Real Resend email works.

Event update notification job works.

Active booked customers receive notifications.

Baseline benchmark exists.

Optimized benchmark exists.

Tests target deployed API.

Benchmark numbers are real.

README documents decisions.

Demo video covers all mandatory requirements.


Q3J1B7QnnfkjTkxk