import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
dotenv.config();

import { db } from '../db.js';
import { devices, deviceMetrics } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomMac() {
  return Array.from({ length: 6 })
    .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();
}

const locations = [
  { region: 'Maharashtra', zone: 'West', city: 'Mumbai', tollPlaza: 'Mumbai-Pune Expressway Plaza 1', lat: 19.0760, lng: 72.8777 },
  { region: 'Karnataka', zone: 'South', city: 'Bangalore', tollPlaza: 'Bangalore-Chennai Highway Plaza', lat: 12.9716, lng: 77.5946 },
  { region: 'Delhi', zone: 'North', city: 'New Delhi', tollPlaza: 'Delhi-Gurgaon Expressway Plaza', lat: 28.6139, lng: 77.2090 },
  { region: 'Gujarat', zone: 'West', city: 'Ahmedabad', tollPlaza: 'Ahmedabad-Vadodara Expressway Plaza', lat: 23.0225, lng: 72.5714 },
  { region: 'Tamil Nadu', zone: 'South', city: 'Chennai', tollPlaza: 'Chennai-Bangalore Highway Plaza', lat: 13.0827, lng: 80.2707 },
];

const vendors = ['BCIL', 'ZEBRA', 'IMP', 'ANJ'];
const deviceTypes = ['FIXED_READER', 'HANDHELD_DEVICE'];
const statuses = ['LIVE', 'DOWN', 'MAINTENANCE', 'WARNING', 'SHUTDOWN'];

function genDeviceId(prefix: string, city: string, idx: number) {
  return `${prefix}_${city.substring(0,3).toUpperCase()}_${String(idx).padStart(3,'0')}`;
}

async function seed() {
  console.log('Updating ~100 devices with new status distribution...');
  try {
    // Get existing devices
    const existingDevices = await db.select().from(devices).limit(100);
    if (existingDevices.length === 0) {
      console.log('No existing devices found. Please run seedData.ts first.');
      return;
    }

    const updatedDevices = [];
    const updatedMetrics = [];

    for (const device of existingDevices) {
      const statusRand = Math.random();
      const newStatus = statusRand < 0.7 ? 'LIVE' : statusRand < 0.9 ? 'DOWN' : 'MAINTENANCE';

      updatedDevices.push({
        status: newStatus as any,
        subStatus: newStatus === 'LIVE' ? 'active' : 'down',
        lastSeen: newStatus === 'DOWN' ? new Date(Date.now() - getRandomInt(0, 24 * 60) * 60 * 1000) : new Date(),
        uptime: newStatus === 'LIVE' ? getRandomInt(80, 99) : getRandomInt(0, 50),
        timeDifference: newStatus === 'LIVE' ? `${getRandomInt(0,5)} Min` : '> 30 Min',
        isActive: newStatus === 'LIVE',
      });

      updatedMetrics.push({
        deviceId: device.id,
        cpuUsage: getRandomInt(1, 95),
        ramUsage: getRandomInt(1, 95),
        temperature: String(getRandomInt(20, 85)),
        antennaStatus: Math.random() > 0.05,
        networkStatus: Math.random() > 0.05,
        powerStatus: Math.random() > 0.01,
        healthScore: getRandomInt(0, 100),
        timestamp: new Date(),
      });
    }

    console.log(`Updating ${updatedDevices.length} devices...`);
    for (let i = 0; i < updatedDevices.length; i++) {
      const deviceUpdate = updatedDevices[i];
      const deviceId = existingDevices[i].id;
      await db.update(devices).set(deviceUpdate).where(eq(devices.id, deviceId));
    }

    console.log(`Inserting ${updatedMetrics.length} device metrics...`);
    for (let i = 0; i < updatedMetrics.length; i += 50) {
      const batch = updatedMetrics.slice(i, i + 50);
      await db.insert(deviceMetrics).values(batch);
    }

    console.log('Update complete');
  } catch (err) {
    console.error('Updater error', err);
    process.exit(1);
  }
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}
