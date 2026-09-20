import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { users, events } from '../src/drizzle/schema';
import * as argon2 from 'argon2';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL is not set');

const sql = postgres(dbUrl);
const db = drizzle(sql, { schema: { users, events } });

async function main() {
  console.log('🌱 Seeding database for load tests...');
  
  // 1. Create an Organizer
  const passwordHash = await argon2.hash('password123');
  const [organizer] = await db.insert(users).values({
    name: 'Load Test Organizer',
    email: 'organizer_loadtest@example.com',
    passwordHash,
    role: 'ORGANIZER',
  }).returning().onConflictDoNothing();

  let orgId = organizer?.id;
  if (!orgId) {
    const org = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, 'organizer_loadtest@example.com') });
    orgId = org!.id;
  }

  // 2. Create the Benchmark Events (one for baseline, one for optimized)
  const [baselineEvent] = await db.insert(events).values({
    organizerId: orgId,
    title: 'Baseline Benchmark Event',
    description: 'Testing race conditions',
    location: 'Virtual',
    startAt: new Date(Date.now() + 86400000),
    endAt: new Date(Date.now() + 90000000),
    capacity: 100, // capacity is 100 for test
  }).returning();

  const [optimizedEvent] = await db.insert(events).values({
    organizerId: orgId,
    title: 'Optimized Benchmark Event',
    description: 'Testing atomic updates',
    location: 'Virtual',
    startAt: new Date(Date.now() + 86400000),
    endAt: new Date(Date.now() + 90000000),
    capacity: 100,
  }).returning();

  console.log(`✅ Events created! Baseline ID: ${baselineEvent.id}, Optimized ID: ${optimizedEvent.id}`);

  // 3. Create 1000 Customers and generate tokens
  const numUsers = 1000;
  console.log(`Generating ${numUsers} test customers...`);
  
  // Use a hardcoded hash to avoid CPU throttling during seed
  const dummyHash = await argon2.hash('testpass');
  const jwtSecret = process.env.JWT_SECRET || 'supersecret';
  
  const customerValues = Array.from({ length: numUsers }).map((_, i) => ({
    name: `Test User ${i}`,
    email: `testuser_${Date.now()}_${i}@example.com`,
    passwordHash: dummyHash,
    role: 'CUSTOMER',
  }));

  // Batch insert in chunks of 500
  const insertedCustomers = [];
  for (let i = 0; i < customerValues.length; i += 500) {
    const chunk = customerValues.slice(i, i + 500);
    const result = await db.insert(users).values(chunk).returning({ id: users.id, email: users.email, role: users.role });
    insertedCustomers.push(...result);
  }

  console.log(`✅ ${insertedCustomers.length} customers inserted.`);

  // 4. Generate CSV
  const csvLines = ['token'];
  for (const c of insertedCustomers) {
    const token = jwt.sign({ sub: c.id, email: c.email, role: c.role }, jwtSecret, { expiresIn: '7d' });
    csvLines.push(token);
  }

  const csvContent = csvLines.join('\n');
  const destDir = path.join(__dirname, '../performance');
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, 'tokens.csv'), csvContent);
  
  // Write env file for k6
  fs.writeFileSync(path.join(destDir, 'test-env.json'), JSON.stringify({
    BASELINE_EVENT_ID: baselineEvent.id,
    OPTIMIZED_EVENT_ID: optimizedEvent.id
  }, null, 2));

  console.log(`✅ Tokens saved to performance/tokens.csv`);
  console.log(`✅ Test config saved to performance/test-env.json`);
  
  await sql.end();
}

main().catch(console.error);
