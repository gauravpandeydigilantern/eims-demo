import dotenv from "dotenv";
dotenv.config();

import { neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool: PgPool } = pkg as any;
import { Pool as NeonPool } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Only use the Neon WebSocket constructor when the DATABASE_URL explicitly points to a Neon-hosted DB.
// Avoid relying on PGHOST (which may be present for other reasons) to reduce false positives.
const dbUrl = process.env.DATABASE_URL || '';
const isNeon = dbUrl && (dbUrl.includes('neon.tech') || dbUrl.includes('neondatabase') || dbUrl.includes('ep-'));

if (isNeon) {
  neonConfig.webSocketConstructor = ws;
  console.log('Neon WebSocket constructor enabled (DATABASE_URL indicates Neon)');
} else {
  console.log('Neon WebSocket constructor NOT enabled (using local or non-Neon DATABASE_URL)');
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// If the DATABASE_URL is a local Postgres instance use the standard 'pg' Pool.
// For remote non-Neon Postgres providers (for example Aiven) we also use the pg Pool.
// Only use the @neondatabase/serverless Pool when the URL is a Neon serverless DB.
const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

// Determine if the remote DB may use a self-signed cert (Aiven, some managed providers).
const likelySelfSigned = dbUrl.includes('sslmode=require') || dbUrl.includes('aiven') || dbUrl.includes('domainsdigilantern');

// Create a single pool instance and export it.
let poolInstance: any;
if (isLocal || !isNeon) {
  if (likelySelfSigned) {
  // Allow self-signed certs in development for providers like Aiven by disabling strict TLS validation.
  // Note: this is acceptable for local development but not recommended for production.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';
    // Pass ssl option to pg Pool to accept self-signed certificates used by some providers.
    poolInstance = new PgPool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  } else {
    poolInstance = new PgPool({ connectionString: process.env.DATABASE_URL });
  }
} else {
  poolInstance = new NeonPool({ connectionString: process.env.DATABASE_URL });
}
console.log('DB pool created; isNeon=', isNeon, 'likelySelfSigned=', likelySelfSigned, 'NODE_TLS_REJECT_UNAUTHORIZED=', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
export const pool = poolInstance;
export const db = isNeon ? drizzleNeon(pool as any, { schema }) : drizzlePg(pool as any, { schema });