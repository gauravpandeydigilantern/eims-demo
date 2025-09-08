import { storage } from "../storage";
import type { InsertDevice, InsertDeviceMetrics, InsertAlert, InsertWeatherData } from "@shared/schema";

export async function seedDatabase() {
  console.log('Seeding database with EIMS data...');

  // Check if devices already exist
  try {
    const existingDevices = await storage.getAllDevices();
    if (existingDevices && existingDevices.length > 0) {
      console.log(`Database already has ${existingDevices.length} devices. Skipping seeding.`);
      return;
    }
  } catch (error) {
    console.log('No existing devices found. Proceeding with seeding...');
  }

  // Seed devices
  const devices = await seedDevices();
  console.log(`Seeded ${devices.length} devices`);

  // Seed device metrics
  await seedDeviceMetrics(devices);
  console.log('Seeded device metrics');

  // Seed alerts
  await seedAlerts(devices);
  console.log('Seeded alerts');

  // Seed weather data
  await seedWeatherData();
  console.log('Seeded weather data');

  console.log('Database seeding completed!');
}

async function seedDevices(): Promise<any[]> {
  const regions = [
    { name: 'Mumbai', tollPlazas: 145, lat: 19.0760, lng: 72.8777, zone: 'Zone 4' },
    { name: 'Delhi', tollPlazas: 98, lat: 28.7041, lng: 77.1025, zone: 'Zone 1' },
    { name: 'Bangalore', tollPlazas: 87, lat: 12.9716, lng: 77.5946, zone: 'Zone 2' },
    { name: 'Chennai', tollPlazas: 76, lat: 13.0827, lng: 80.2707, zone: 'Zone 3' },
    { name: 'Kolkata', tollPlazas: 89, lat: 22.5726, lng: 88.3639, zone: 'Zone 5' },
    { name: 'Hyderabad', tollPlazas: 65, lat: 17.3850, lng: 78.4867, zone: 'Zone 2' },
    { name: 'Pune', tollPlazas: 54, lat: 18.5204, lng: 73.8567, zone: 'Zone 4' },
    { name: 'Ahmedabad', tollPlazas: 67, lat: 23.0225, lng: 72.5714, zone: 'Zone 6' },
  ];

  const vendors = ['BCIL', 'ZEBRA', 'IMP', 'ANJ'];
  const deviceTypes = ['FIXED_READER', 'HANDHELD_DEVICE'];
  const statuses = ['LIVE', 'DOWN', 'MAINTENANCE', 'WARNING'];

  const devices = [];
  let deviceCounter = 1;

  for (const region of regions) {
    for (let plaza = 1; plaza <= region.tollPlazas; plaza++) {
      // Each toll plaza has 6-8 devices (4-6 Fixed Readers + 2 Handheld Devices)
      const devicesPerPlaza = Math.floor(Math.random() * 3) + 6; // 6-8 devices
      
      for (let device = 1; device <= devicesPerPlaza; device++) {
        const deviceType = device <= devicesPerPlaza - 2 ? 'FIXED_READER' : 'HANDHELD_DEVICE';
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        // Fixed status: First 10 devices always LIVE for demo
        const status = deviceCounter <= 10 ? 'LIVE' : 
                      Math.random() < 0.7 ? 'LIVE' : 
                      Math.random() < 0.9 ? 'DOWN' : 'MAINTENANCE';
        
        const deviceId = deviceType === 'FIXED_READER' 
          ? `FR_${region.name.substring(0, 3).toUpperCase()}_${String(plaza).padStart(2, '0')}_${String(device).padStart(2, '0')}`
          : `HHD_${region.name.substring(0, 3).toUpperCase()}_${String(plaza).padStart(2, '0')}_${String(device).padStart(2, '0')}`;

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
          status: status as any,
          subStatus: status === 'LIVE' ? (Math.random() > 0.3 ? 'active' : 'standby') : undefined,
          location: `${region.name} Toll Plaza ${plaza}`,
          tollPlaza: `${region.name} Toll Plaza ${plaza}`,
          region: region.name,
          zone: region.zone,
          latitude: (region.lat + latVariation).toString(),
          longitude: (region.lng + lngVariation).toString(),
          installDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in past year
          lastSeen: status === 'DOWN' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : new Date(), // Random time for down devices
          lastSync: status === 'DOWN' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : new Date(Date.now() - Math.random() * 10 * 60 * 1000), // Recent sync for active devices
          lastTransaction: status === 'LIVE' ? new Date(Date.now() - Math.random() * 60 * 60 * 1000) : undefined, // Random time in past hour for live devices
          lastTagRead: status === 'LIVE' ? new Date(Date.now() - Math.random() * 30 * 60 * 1000) : undefined, // Random time in past 30 min
          lastRegistration: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in past week
          uptime: status === 'LIVE' ? Math.floor(Math.random() * 30) + 70 : 0, // 70-99% uptime
          transactionCount: Math.floor(Math.random() * 10000),
          pendingCount: status === 'LIVE' ? Math.floor(Math.random() * 20) : 0, // Pending transactions for live devices
          successCount: status === 'LIVE' ? Math.floor(Math.random() * 8000) + 1000 : 0, // Success count for live devices
          timeDifference: status === 'LIVE' ? '0 Min' : status === 'MAINTENANCE' ? '5 Min' : '30+ Min', // Time difference indicator
        };

        try {
          const createdDevice = await storage.createDevice(deviceData);
          devices.push(createdDevice);
        } catch (error) {
          console.error(`Failed to create device ${deviceId}:`, error);
        }

        deviceCounter++;
      }
    }
  }

  return devices;
}

async function seedDeviceMetrics(devices: any[]) {
  for (const device of devices) {
    // Create current metrics for each device with realistic values
    const metrics: InsertDeviceMetrics = {
      deviceId: device.id,
      cpuUsage: device.status === 'LIVE' ? Math.floor(Math.random() * 40) + 20 : Math.floor(Math.random() * 100), // 20-60% for live devices
      ramUsage: device.status === 'LIVE' ? Math.floor(Math.random() * 50) + 30 : Math.floor(Math.random() * 100), // 30-80% for live devices
      temperature: device.status === 'LIVE' ? (25 + Math.random() * 20).toString() : (25 + Math.random() * 30).toString(), // Cooler for live devices
      antennaStatus: device.status === 'LIVE' ? Math.random() > 0.05 : Math.random() > 0.3, // Better antenna for live devices
      networkStatus: device.status === 'LIVE' || device.status === 'MAINTENANCE',
      powerStatus: device.status !== 'DOWN',
      healthScore: device.status === 'LIVE' ? Math.floor(Math.random() * 20) + 80 : // 80-100 for live
                  device.status === 'MAINTENANCE' ? Math.floor(Math.random() * 30) + 50 : // 50-80 for maintenance
                  device.status === 'WARNING' ? Math.floor(Math.random() * 20) + 60 : // 60-80 for warning
                  Math.floor(Math.random() * 50), // 0-50 for down
    };

    try {
      await storage.recordDeviceMetrics(metrics);
    } catch (error) {
      console.error(`Failed to create metrics for device ${device.id}:`, error);
    }
  }
}

async function seedAlerts(devices: any[]) {
  const downDevices = devices.filter(d => d.status === 'DOWN');
  const maintenanceDevices = devices.filter(d => d.status === 'MAINTENANCE');
  
  // Create critical alerts only for DOWN devices (limited number)
  for (const device of downDevices.slice(0, Math.min(10, downDevices.length))) { // Increased to 10 for 20% down
    const alert: InsertAlert = {
      deviceId: device.id,
      type: 'CRITICAL' as any,
      category: 'DEVICE_OFFLINE' as any,
      title: 'Device Offline',
      message: `Device ${device.id} has been offline for more than 30 minutes`,
      metadata: {
        deviceLocation: device.location,
        lastSeen: device.lastSeen,
        region: device.region,
      },
    };

    try {
      await storage.createAlert(alert);
    } catch (error) {
      console.error(`Failed to create alert for device ${device.id}:`, error);
    }
  }

  // Create info alerts for maintenance devices
  for (const device of maintenanceDevices.slice(0, Math.min(5, maintenanceDevices.length))) { // Limited to 5 for 10% maintenance
    const alert: InsertAlert = {
      deviceId: device.id,
      type: 'INFO' as any,
      category: 'MAINTENANCE' as any,
      title: 'Scheduled Maintenance',
      message: `Device ${device.id} is under scheduled maintenance`,
      metadata: {
        deviceLocation: device.location,
        maintenanceType: 'routine_check',
        region: device.region,
      },
    };

    try {
      await storage.createAlert(alert);
    } catch (error) {
      console.error(`Failed to create maintenance alert for device ${device.id}:`, error);
    }
  }

  // Create regional weather alerts based on device statuses
  const regionsWithIssues = Array.from(new Set(downDevices.concat(maintenanceDevices).map(d => d.region)));
  for (const region of regionsWithIssues.slice(0, 3)) { // Up to 3 weather alerts
    const weatherAlert: InsertAlert = {
      type: 'WARNING' as any,
      category: 'WEATHER' as any,
      title: 'Weather Impact Alert',
      message: `Weather conditions may be affecting device performance in ${region}`,
      metadata: {
        region: region,
        weatherType: 'adverse_conditions',
        expectedDuration: '2-4 hours',
        affectedDevices: devices.filter(d => d.region === region && (d.status === 'DOWN' || d.status === 'MAINTENANCE')).length,
      },
    };

    try {
      await storage.createAlert(weatherAlert);
    } catch (error) {
      console.error(`Failed to create weather alert for ${region}:`, error);
    }
  }
}

async function seedWeatherData() {
  const weatherRegions = [
    { region: 'Mumbai', city: 'Mumbai' },
    { region: 'Delhi', city: 'Delhi' },
    { region: 'Bangalore', city: 'Bangalore' },
    { region: 'Chennai', city: 'Chennai' },
    { region: 'Kolkata', city: 'Kolkata' },
    { region: 'Hyderabad', city: 'Hyderabad' },
    { region: 'Pune', city: 'Pune' },
    { region: 'Ahmedabad', city: 'Ahmedabad' },
  ];

  const conditions = ['sunny', 'cloudy', 'rainy', 'clear'];

  for (const location of weatherRegions) {
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const weatherData: InsertWeatherData = {
      region: location.region,
      city: location.city,
      temperature: (20 + Math.random() * 25).toString(), // 20-45°C
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      condition,
      windSpeed: (Math.random() * 20).toString(), // 0-20 km/h
      precipitation: condition === 'rainy' ? (Math.random() * 50).toString() : '0',
      alerts: condition === 'rainy' && Math.random() > 0.5 ? [{
        type: 'Heavy Rain',
        severity: 'medium',
        description: 'Heavy rainfall expected in the next 6 hours',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      }] : [],
    };

    try {
      await storage.updateWeatherData(weatherData);
    } catch (error) {
      console.error(`Failed to create weather data for ${location.city}:`, error);
    }
  }
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
