import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL || '';

let connectionString = databaseUrl;
if (databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    url.searchParams.delete('sslmode');
    connectionString = url.toString();
  } catch {
    connectionString = databaseUrl;
  }
}

export const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
