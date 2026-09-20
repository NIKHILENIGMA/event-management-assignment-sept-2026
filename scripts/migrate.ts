import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL is not set');

const sql = postgres(dbUrl, { max: 1 });
const db = drizzle(sql);

async function main() {
  console.log('Migrating database...');
  await migrate(db, { migrationsFolder: 'drizzle/migrations' });
  console.log('Database migrated successfully!');
  await sql.end();
}

main().catch(console.error);
