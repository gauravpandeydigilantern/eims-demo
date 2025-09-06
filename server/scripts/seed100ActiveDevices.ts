import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
dotenv.config();

import { storage } from '../storage';
import type { InsertDevice, InsertDeviceMetrics } from '../../shared/schema';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMacAddress(): string {
  const chars = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    if (i > 0) mac += ':';
    mac += chars[Math.floor(Math.random() * 16)];
    mac += chars[Math.floor(Math.random() * 16)];
  }
  return mac;
}

function getDeviceModel(vendor: string, deviceType: string): string {
  const models: Record<string, Record<string, string[]>> = {
    'BCIL': {
      'FIXED_READER': ['FR-2000X', 'FR-2500', 'FR-3000'],
      'HANDHELD_DEVICE': ['HH-100', 'HH-200', 'HH-300'],
    },
    'ZEBRA': {
      'FIXED_READER': ['FX9600', 'FX7500', 'FX9500'],
      'HANDHELD_DEVICE': ['MC3300', 'MC9300', 'TC21'],
    },
    'IMP': {
      'FIXED_READER': ['R700', 'R2000', 'R4300'],
      'HANDHELD_DEVICE': ['H100', 'H200', 'H300'],
    },
    'ANJ': {
      'FIXED_READER': ['AF-1000', 'AF-2000', 'AF-3000'],
      'HANDHELD_DEVICE': ['AH-100', 'AH-200', 'AH-300'],
    },
  };

  const vendorModels = models[vendor]?.[deviceType] || ['Generic-Model'];
  return vendorModels[Math.floor(Math.random() * vendorModels.length)];
}

function getFirmwareVersion(): string {
  const major = Math.floor(Math.random() * 3) + 1; // 1-3
  const minor = Math.floor(Math.random() * 10); // 0-9
  const patch = Math.floor(Math.random() * 10); // 0-9
  return `v${major}.${minor}.${patch}`;
}

async function seed100ActiveDevices() {
  console.log('Seeding 100 active devices...');

  const regions = [
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, zone: 'Zone 4' },
    { name: 'Delhi', lat: 28.7041, lng: 77.1025, zone: 'Zone 1' },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946, zone: 'Zone 2' },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707, zone: 'Zone 3' },
  ];

  const vendors = ['BCIL', 'ZEBRA', 'IMP', 'ANJ'];
  const deviceTypes = ['FIXED_READER', 'HANDHELD_DEVICE'];

  const devices = [];
  const totalDevices = 100;

  for (let i = 1; i <= totalDevices; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const deviceId = deviceType === 'FIXED_READER'
      ? `FR_${region.name.substring(0, 3).toUpperCase()}_${String(i).padStart(3, '0')}_${randomSuffix}`
      : `HHD_${region.name.substring(0, 3).toUpperCase()}_${String(i).padStart(3, '0')}_${randomSuffix}`;

    // Add some geographic variation around the main location
    const latVariation = (Math.random() - 0.5) * 0.5; // ±0.25 degrees
    const lngVariation = (Math.random() - 0.5) * 0.5;

    const deviceData: InsertDevice = {
      id: deviceId,
      macAddress: deviceType === 'FIXED_READER' ? generateMacAddress() : undefined,
      serialNumber: deviceType === 'HANDHELD_DEVICE' ? `${vendor}${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}` : undefined,
      deviceType: deviceType as any,
      vendor: vendor as any,
      model: getDeviceModel(vendor, deviceType),
      firmwareVersion: getFirmwareVersion(),
      status: 'LIVE' as any,
      subStatus: Math.random() > 0.3 ? 'active' : 'standby',
      location: `${region.name} Toll Plaza ${getRandomInt(1, 50)}`,
      tollPlaza: `${region.name} Toll Plaza ${getRandomInt(1, 50)}`,
      region: region.name,
      zone: region.zone,
      latitude: (region.lat + latVariation).toString(),
      longitude: (region.lng + lngVariation).toString(),
      installDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in past year
      lastSeen: new Date(),
      lastSync: new Date(Date.now() - Math.random() * 10 * 60 * 1000), // Recent sync
      lastTransaction: new Date(Date.now() - Math.random() * 60 * 60 * 1000), // Random time in past hour
      lastTagRead: new Date(Date.now() - Math.random() * 30 * 60 * 1000), // Random time in past 30 min
      lastRegistration: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in past week
      uptime: Math.floor(Math.random() * 100000),
      transactionCount: Math.floor(Math.random() * 10000),
      pendingCount: Math.floor(Math.random() * 20),
      successCount: Math.floor(Math.random() * 8000) + 1000,
      timeDifference: '0 Min',
      isActive: true,
    };

    try {
      const createdDevice = await storage.createDevice(deviceData);
      devices.push(createdDevice);

      // Create metrics for each device
      const metrics: InsertDeviceMetrics = {
        deviceId: deviceId,
        cpuUsage: Math.floor(Math.random() * 40) + 20, // 20-60%
        ramUsage: Math.floor(Math.random() * 50) + 30, // 30-80%
        temperature: (25 + Math.random() * 20).toString(), // 25-45°C
        antennaStatus: Math.random() > 0.05,
        networkStatus: true,
        powerStatus: true,
        healthScore: Math.floor(Math.random() * 20) + 80, // 80-100
        timestamp: new Date(),
      };

      await storage.recordDeviceMetrics(metrics);

      console.log(`Created active device: ${deviceId}`);
    } catch (error) {
      console.error(`Failed to create device ${deviceId}:`, error);
    }
  }

  console.log(`Successfully seeded ${devices.length} active devices.`);
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  seed100ActiveDevices().then(() => process.exit(0)).catch(() => process.exit(1));
}
