#!/usr/bin/env tsx
import dotenv from 'dotenv'; dotenv.config();
import { db } from './db';
import * as schema from '@shared/schema';

async function check() {
  try {
    console.log('Checking DB connectivity and users...');
    const res = await db.select().from(schema.users).limit(5);
    console.log('User rows:', res.length);
    console.log(res);
    process.exit(0);
  } catch (err) {
    console.error('DB check failed:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) check();
