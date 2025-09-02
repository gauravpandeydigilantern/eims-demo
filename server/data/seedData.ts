import { storage } from "../storage";
import type { InsertDevice, InsertDeviceMetrics, InsertAlert, InsertWeatherData } from "@shared/schema";

export async function seedDatabase() {
  console.log('Seeding database with EIMS data...');

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
        const status = Math.random() > 0.05 ? 'LIVE' : statuses[Math.floor(Math.random() * statuses.length)];
        
        const deviceId = deviceType === 'FIXED_READER' 
          ? `FR_${region.name.substring(0, 3).toUpperCase()}_${String(deviceCounter).padStart(3, '0')}`
          : `HHD_${region.name.substring(0, 3).toUpperCase()}_${String(deviceCounter).padStart(3, '0')}`;

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
          lastTransaction: status === 'LIVE' ? new Date(Date.now() - Math.random() * 60 * 60 * 1000) : undefined, // Random time in past hour for live devices
          lastTagRead: status === 'LIVE' ? new Date(Date.now() - Math.random() * 30 * 60 * 1000) : undefined, // Random time in past 30 min
          lastRegistration: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in past week
          uptime: status === 'LIVE' ? Math.floor(Math.random() * 100000) : 0,
          transactionCount: Math.floor(Math.random() * 10000),
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
    // Create current metrics for each device
    const metrics: InsertDeviceMetrics = {
      deviceId: device.id,
      cpuUsage: Math.floor(Math.random() * 100),
      ramUsage: Math.floor(Math.random() * 100),
      temperature: (25 + Math.random() * 30).toString(), // 25-55°C
      antennaStatus: Math.random() > 0.02, // 98% antenna success rate
      networkStatus: device.status === 'LIVE',
      powerStatus: device.status !== 'DOWN',
      healthScore: device.status === 'LIVE' ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 50),
    };

    try {
      await storage.recordDeviceMetrics(metrics);
    } catch (error) {
      console.error(`Failed to create metrics for device ${device.id}:`, error);
    }
  }
}

async function seedAlerts(devices: any[]) {
  const alertTypes = ['CRITICAL', 'WARNING', 'INFO'];
  const alertCategories = ['DEVICE_OFFLINE', 'PERFORMANCE', 'WEATHER', 'MAINTENANCE', 'SECURITY'];
  
  // Create some sample alerts
  const downDevices = devices.filter(d => d.status === 'DOWN');
  
  for (const device of downDevices.slice(0, 20)) { // Create alerts for first 20 down devices
    const alert: InsertAlert = {
      deviceId: device.id,
      type: 'CRITICAL' as any,
      category: 'DEVICE_OFFLINE' as any,
      title: 'Device Offline',
      message: `Device ${device.id} has been offline for more than 30 minutes`,
      metadata: {
        deviceLocation: device.location,
        lastSeen: device.lastSeen,
      },
    };

    try {
      await storage.createAlert(alert);
    } catch (error) {
      console.error(`Failed to create alert for device ${device.id}:`, error);
    }
  }

  // Create some performance alerts
  for (let i = 0; i < 15; i++) {
    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    const alert: InsertAlert = {
      deviceId: randomDevice.id,
      type: 'WARNING' as any,
      category: 'PERFORMANCE' as any,
      title: 'High CPU Usage',
      message: `Device CPU usage is above 85%`,
      metadata: {
        cpuUsage: Math.floor(Math.random() * 15) + 85,
        deviceLocation: randomDevice.location,
      },
    };

    try {
      await storage.createAlert(alert);
    } catch (error) {
      console.error(`Failed to create performance alert:`, error);
    }
  }

  // Create weather alerts
  const weatherAlert: InsertAlert = {
    type: 'WARNING' as any,
    category: 'WEATHER' as any,
    title: 'Weather Alert',
    message: 'Heavy rainfall expected in Maharashtra region',
    metadata: {
      region: 'Mumbai',
      weatherType: 'heavy_rain',
      expectedDuration: '6 hours',
    },
  };

  try {
    await storage.createAlert(weatherAlert);
  } catch (error) {
    console.error('Failed to create weather alert:', error);
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
