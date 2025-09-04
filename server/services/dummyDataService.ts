import { db } from '../db.js';
import { devices, deviceMetrics, alerts, weatherData, users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

// Real Indian toll plaza locations for authentic EIMS data
const tollPlazaData = [
  // Maharashtra
  { region: 'Maharashtra', zone: 'West', city: 'Mumbai', tollPlaza: 'Mumbai-Pune Expressway Plaza 1', lat: 19.0760, lng: 72.8777 },
  { region: 'Maharashtra', zone: 'West', city: 'Mumbai', tollPlaza: 'Mumbai-Pune Expressway Plaza 2', lat: 19.1136, lng: 72.8697 },
  { region: 'Maharashtra', zone: 'West', city: 'Pune', tollPlaza: 'Pune-Bangalore Highway Plaza', lat: 18.5204, lng: 73.8567 },
  { region: 'Maharashtra', zone: 'West', city: 'Nashik', tollPlaza: 'Nashik-Mumbai Highway Plaza', lat: 19.9975, lng: 73.7898 },
  { region: 'Maharashtra', zone: 'West', city: 'Aurangabad', tollPlaza: 'Aurangabad-Pune Plaza', lat: 19.8762, lng: 75.3433 },

  // Gujarat
  { region: 'Gujarat', zone: 'West', city: 'Ahmedabad', tollPlaza: 'Ahmedabad-Vadodara Expressway Plaza', lat: 23.0225, lng: 72.5714 },
  { region: 'Gujarat', zone: 'West', city: 'Surat', tollPlaza: 'Surat-Mumbai Highway Plaza', lat: 21.1702, lng: 72.8311 },
  { region: 'Gujarat', zone: 'West', city: 'Vadodara', tollPlaza: 'Vadodara-Ahmedabad Plaza', lat: 22.3072, lng: 73.1812 },
  { region: 'Gujarat', zone: 'West', city: 'Rajkot', tollPlaza: 'Rajkot-Jamnagar Highway Plaza', lat: 22.3039, lng: 70.8022 },

  // Uttar Pradesh
  { region: 'Uttar Pradesh', zone: 'North', city: 'Lucknow', tollPlaza: 'Lucknow-Kanpur Expressway Plaza', lat: 26.8467, lng: 80.9462 },
  { region: 'Uttar Pradesh', zone: 'North', city: 'Agra', tollPlaza: 'Agra-Delhi Highway Plaza', lat: 27.1767, lng: 78.0081 },
  { region: 'Uttar Pradesh', zone: 'North', city: 'Varanasi', tollPlaza: 'Varanasi-Allahabad Plaza', lat: 25.3176, lng: 82.9739 },
  { region: 'Uttar Pradesh', zone: 'North', city: 'Kanpur', tollPlaza: 'Kanpur-Lucknow Plaza', lat: 26.4499, lng: 80.3319 },

  // Karnataka
  { region: 'Karnataka', zone: 'South', city: 'Bangalore', tollPlaza: 'Bangalore-Chennai Highway Plaza', lat: 12.9716, lng: 77.5946 },
  { region: 'Karnataka', zone: 'South', city: 'Mysore', tollPlaza: 'Mysore-Bangalore Plaza', lat: 12.2958, lng: 76.6394 },
  { region: 'Karnataka', zone: 'South', city: 'Hubli', tollPlaza: 'Hubli-Pune Highway Plaza', lat: 15.3647, lng: 75.1240 },

  // Tamil Nadu
  { region: 'Tamil Nadu', zone: 'South', city: 'Chennai', tollPlaza: 'Chennai-Bangalore Highway Plaza', lat: 13.0827, lng: 80.2707 },
  { region: 'Tamil Nadu', zone: 'South', city: 'Coimbatore', tollPlaza: 'Coimbatore-Bangalore Plaza', lat: 11.0168, lng: 76.9558 },
  { region: 'Tamil Nadu', zone: 'South', city: 'Madurai', tollPlaza: 'Madurai-Chennai Plaza', lat: 9.9252, lng: 78.1198 },

  // Delhi NCR
  { region: 'Delhi', zone: 'North', city: 'New Delhi', tollPlaza: 'Delhi-Gurgaon Expressway Plaza', lat: 28.6139, lng: 77.2090 },
  { region: 'Delhi', zone: 'North', city: 'Gurgaon', tollPlaza: 'Gurgaon-Jaipur Highway Plaza', lat: 28.4595, lng: 77.0266 },
  { region: 'Delhi', zone: 'North', city: 'Noida', tollPlaza: 'Noida-Agra Expressway Plaza', lat: 28.5355, lng: 77.3910 },

  // Rajasthan
  { region: 'Rajasthan', zone: 'North', city: 'Jaipur', tollPlaza: 'Jaipur-Delhi Highway Plaza', lat: 26.9124, lng: 75.7873 },
  { region: 'Rajasthan', zone: 'North', city: 'Udaipur', tollPlaza: 'Udaipur-Ahmedabad Plaza', lat: 24.5854, lng: 73.7125 },

  // West Bengal
  { region: 'West Bengal', zone: 'East', city: 'Kolkata', tollPlaza: 'Kolkata-Durgapur Expressway Plaza', lat: 22.5726, lng: 88.3639 },
  { region: 'West Bengal', zone: 'East', city: 'Durgapur', tollPlaza: 'Durgapur-Asansol Plaza', lat: 23.5204, lng: 87.3119 },

  // Odisha
  { region: 'Odisha', zone: 'East', city: 'Bhubaneswar', tollPlaza: 'Bhubaneswar-Cuttack Plaza', lat: 20.2961, lng: 85.8245 },

  // Andhra Pradesh
  { region: 'Andhra Pradesh', zone: 'South', city: 'Hyderabad', tollPlaza: 'Hyderabad-Bangalore Plaza', lat: 17.3850, lng: 78.4867 },
  { region: 'Andhra Pradesh', zone: 'South', city: 'Visakhapatnam', tollPlaza: 'Visakhapatnam-Vijayawada Plaza', lat: 17.6868, lng: 83.2185 },

  // Kerala
  { region: 'Kerala', zone: 'South', city: 'Kochi', tollPlaza: 'Kochi-Trivandrum Highway Plaza', lat: 9.9312, lng: 76.2673 },
  { region: 'Kerala', zone: 'South', city: 'Trivandrum', tollPlaza: 'Trivandrum-Kochi Plaza', lat: 8.5241, lng: 76.9366 },

  // Haryana
  { region: 'Haryana', zone: 'North', city: 'Chandigarh', tollPlaza: 'Chandigarh-Delhi Highway Plaza', lat: 30.7333, lng: 76.7794 },
  { region: 'Haryana', zone: 'North', city: 'Faridabad', tollPlaza: 'Faridabad-Agra Plaza', lat: 28.4089, lng: 77.3178 },

  // Punjab
  { region: 'Punjab', zone: 'North', city: 'Amritsar', tollPlaza: 'Amritsar-Delhi Highway Plaza', lat: 31.6340, lng: 74.8723 },
  { region: 'Punjab', zone: 'North', city: 'Ludhiana', tollPlaza: 'Ludhiana-Chandigarh Plaza', lat: 30.9010, lng: 75.8573 },
];

const vendors = ['BCIL', 'ZEBRA', 'IMP', 'ANJ'] as const;
const deviceTypes = ['FIXED_READER', 'HANDHELD_DEVICE'] as const;
const deviceStatuses = ['LIVE', 'DOWN', 'MAINTENANCE', 'WARNING', 'SHUTDOWN'] as const;

function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDeviceId(location: any, index: number, deviceType: string): string {
  const prefix = deviceType === 'FIXED_READER' ? 'FR' : 'HHD';
  const cityCode = location.city.substring(0, 3).toUpperCase();
  const suffix = String(index).padStart(3, '0');
  return `${prefix}_${cityCode}_${suffix}`;
}

function generateHealthScore(status: string): number {
  switch (status) {
    case 'LIVE': return getRandomInRange(80, 100);
    case 'WARNING': return getRandomInRange(60, 79);
    case 'MAINTENANCE': return getRandomInRange(40, 70);
    case 'DOWN': return getRandomInRange(0, 30);
    case 'SHUTDOWN': return 0;
    default: return getRandomInRange(50, 90);
  }
}

function generateLastSeen(status: string): Date {
  const now = new Date();
  switch (status) {
    case 'LIVE':
      // Last seen within 30 minutes
      return new Date(now.getTime() - getRandomInRange(1, 30) * 60 * 1000);
    case 'WARNING':
      // Last seen 30-60 minutes ago
      return new Date(now.getTime() - getRandomInRange(30, 60) * 60 * 1000);
    case 'DOWN':
      // Last seen more than 60 minutes ago
      return new Date(now.getTime() - getRandomInRange(60, 720) * 60 * 1000);
    case 'MAINTENANCE':
      // Could be seen recently or not
      return new Date(now.getTime() - getRandomInRange(10, 120) * 60 * 1000);
    case 'SHUTDOWN':
      // Not seen for hours/days
      return new Date(now.getTime() - getRandomInRange(120, 2880) * 60 * 1000);
    default:
      return new Date(now.getTime() - getRandomInRange(5, 60) * 60 * 1000);
  }
}

export async function populateEIMSDevices(): Promise<void> {
  console.log('🚀 Starting EIMS device population...');
  
  try {
    // Clear existing data
    await db.delete(deviceMetrics);
    await db.delete(alerts);
    await db.delete(devices);
    console.log('✅ Cleared existing device data');

    const allDevices: any[] = [];
    const allMetrics: any[] = [];
    const allAlerts: any[] = [];

    let deviceCounter = 1;

    // Generate devices for each toll plaza
    for (const location of tollPlazaData) {
      // 15-25 Fixed Readers per toll plaza
      const frCount = getRandomInRange(15, 25);
      for (let i = 1; i <= frCount; i++) {
        const status = getRandomElement(deviceStatuses);
        const deviceId = generateDeviceId(location, deviceCounter++, 'FIXED_READER');
        const lastSeen = generateLastSeen(status);
        const vendor = getRandomElement(vendors);

        const device = {
          id: deviceId,
          macAddress: `${Math.random().toString(16).substr(2, 2)}:${Math.random().toString(16).substr(2, 2)}:${Math.random().toString(16).substr(2, 2)}:${Math.random().toString(16).substr(2, 2)}:${Math.random().toString(16).substr(2, 2)}:${Math.random().toString(16).substr(2, 2)}`.toUpperCase(),
          assetId: `ASSET_${deviceId}`,
          serialNumber: `SN${vendor}${String(deviceCounter).padStart(6, '0')}`,
          deviceType: 'FIXED_READER' as const,
          vendor,
          model: vendor === 'BCIL' ? 'BCL-RF2000' : vendor === 'ZEBRA' ? 'ZEB-RFD40' : vendor === 'IMP' ? 'IMP-RFID500' : 'ANJ-RF300',
          firmwareVersion: `${getRandomInRange(1, 3)}.${getRandomInRange(0, 9)}.${getRandomInRange(0, 9)}`,
          status,
          subStatus: status === 'LIVE' ? (Math.random() > 0.7 ? 'active' : 'standby') : 'down',
          location: `${location.tollPlaza}, ${location.city}, ${location.region}`,
          tollPlaza: location.tollPlaza,
          region: location.region,
          zone: location.zone,
          latitude: String(location.lat + (Math.random() - 0.5) * 0.01), // Small variance for multiple devices
          longitude: String(location.lng + (Math.random() - 0.5) * 0.01),
          installDate: new Date(2020 + getRandomInRange(0, 4), getRandomInRange(0, 11), getRandomInRange(1, 28)),
          lastSeen,
          lastSync: lastSeen,
          lastTransaction: status === 'LIVE' ? new Date(lastSeen.getTime() + getRandomInRange(1, 300) * 1000) : lastSeen,
          lastTagRead: status === 'LIVE' ? new Date(lastSeen.getTime() + getRandomInRange(1, 600) * 1000) : null,
          lastRegistration: status === 'LIVE' ? new Date(lastSeen.getTime() + getRandomInRange(1, 300) * 1000) : null,
          uptime: getRandomInRange(85, 99),
          transactionCount: getRandomInRange(1000, 50000),
          pendingCount: status === 'LIVE' ? getRandomInRange(0, 5) : getRandomInRange(0, 20),
          successCount: getRandomInRange(5000, 45000),
          timeDifference: status === 'LIVE' ? `${getRandomInRange(0, 2)} Min` : '> 30 Min',
          isActive: status !== 'SHUTDOWN',
        };

        allDevices.push(device);

        // Generate health metrics
        const healthScore = generateHealthScore(status);
        const metrics = {
          deviceId: deviceId,
          cpuUsage: getRandomInRange(10, status === 'DOWN' ? 100 : 80),
          ramUsage: getRandomInRange(20, status === 'DOWN' ? 95 : 70),
          temperature: String(getRandomInRange(25, status === 'WARNING' ? 80 : 65)),
          antennaStatus: status !== 'DOWN',
          networkStatus: status !== 'DOWN',
          powerStatus: status !== 'SHUTDOWN',
          healthScore,
          timestamp: new Date(),
        };

        allMetrics.push(metrics);

        // Generate alerts for problematic devices
        if (status === 'DOWN' || status === 'WARNING') {
          const alert = {
            deviceId: deviceId,
            type: status === 'DOWN' ? 'CRITICAL' as const : 'WARNING' as const,
            category: 'DEVICE_OFFLINE' as const,
            title: `Device ${status === 'DOWN' ? 'Offline' : 'Performance Issues'}`,
            message: status === 'DOWN' 
              ? `Fixed Reader ${deviceId} has been offline for more than 30 minutes. Last seen: ${lastSeen.toLocaleString()}`
              : `Fixed Reader ${deviceId} is experiencing performance issues. CPU: ${metrics.cpuUsage}%, RAM: ${metrics.ramUsage}%`,
            isRead: Math.random() > 0.6,
            isResolved: false,
            metadata: {
              deviceLocation: device.location,
              vendor: device.vendor,
              lastMetrics: {
                cpu: metrics.cpuUsage,
                ram: metrics.ramUsage,
                temperature: metrics.temperature
              }
            },
          };

          allAlerts.push(alert);
        }
      }

      // 5-10 Handheld Devices per toll plaza
      const hhdCount = getRandomInRange(5, 10);
      for (let i = 1; i <= hhdCount; i++) {
        const status = getRandomElement(deviceStatuses);
        const deviceId = generateDeviceId(location, deviceCounter++, 'HANDHELD_DEVICE');
        const lastSeen = generateLastSeen(status);
        const vendor = getRandomElement(vendors);

        const device = {
          id: deviceId,
          macAddress: `${Math.random().toString(16).substr(2, 2)}:${Math.random().toString(16).substr(2, 2)}:${Math.random().toString(16).substr(2, 2)}:${Math.random().toString(16).substr(2, 2)}:${Math.random().toString(16).substr(2, 2)}:${Math.random().toString(16).substr(2, 2)}`.toUpperCase(),
          assetId: `ASSET_${deviceId}`,
          serialNumber: `SN${vendor}${String(deviceCounter).padStart(6, '0')}`,
          deviceType: 'HANDHELD_DEVICE' as const,
          vendor,
          model: vendor === 'BCIL' ? 'BCL-HH1000' : vendor === 'ZEBRA' ? 'ZEB-TC21' : vendor === 'IMP' ? 'IMP-MOBILE200' : 'ANJ-HH150',
          firmwareVersion: `${getRandomInRange(1, 3)}.${getRandomInRange(0, 9)}.${getRandomInRange(0, 9)}`,
          status,
          subStatus: status === 'LIVE' ? (Math.random() > 0.5 ? 'active' : 'standby') : 'down',
          location: `${location.tollPlaza}, ${location.city}, ${location.region}`,
          tollPlaza: location.tollPlaza,
          region: location.region,
          zone: location.zone,
          latitude: String(location.lat + (Math.random() - 0.5) * 0.005),
          longitude: String(location.lng + (Math.random() - 0.5) * 0.005),
          installDate: new Date(2021 + getRandomInRange(0, 3), getRandomInRange(0, 11), getRandomInRange(1, 28)),
          lastSeen,
          lastSync: lastSeen,
          lastTransaction: status === 'LIVE' ? new Date(lastSeen.getTime() + getRandomInRange(1, 300) * 1000) : lastSeen,
          lastTagRead: status === 'LIVE' ? new Date(lastSeen.getTime() + getRandomInRange(1, 600) * 1000) : null,
          lastRegistration: null, // Handhelds don't do registrations typically
          uptime: getRandomInRange(80, 98),
          transactionCount: getRandomInRange(100, 5000),
          pendingCount: status === 'LIVE' ? getRandomInRange(0, 3) : getRandomInRange(0, 15),
          successCount: getRandomInRange(500, 4500),
          timeDifference: status === 'LIVE' ? `${getRandomInRange(0, 5)} Min` : '> 30 Min',
          isActive: status !== 'SHUTDOWN',
        };

        allDevices.push(device);

        // Generate health metrics for handhelds
        const healthScore = generateHealthScore(status);
        const metrics = {
          deviceId: deviceId,
          cpuUsage: getRandomInRange(5, status === 'DOWN' ? 90 : 60),
          ramUsage: getRandomInRange(15, status === 'DOWN' ? 85 : 60),
          temperature: String(getRandomInRange(20, status === 'WARNING' ? 70 : 55)),
          antennaStatus: status !== 'DOWN',
          networkStatus: status !== 'DOWN',
          powerStatus: status !== 'SHUTDOWN',
          healthScore,
          timestamp: new Date(),
        };

        allMetrics.push(metrics);
      }
    }

    // Insert devices in batches
    console.log(`📱 Inserting ${allDevices.length} devices...`);
    for (let i = 0; i < allDevices.length; i += 100) {
      const batch = allDevices.slice(i, i + 100);
      await db.insert(devices).values(batch);
    }

    // Insert metrics in batches
    console.log(`📊 Inserting ${allMetrics.length} device metrics...`);
    for (let i = 0; i < allMetrics.length; i += 100) {
      const batch = allMetrics.slice(i, i + 100);
      await db.insert(deviceMetrics).values(batch);
    }

    // Insert alerts
    if (allAlerts.length > 0) {
      console.log(`🚨 Inserting ${allAlerts.length} alerts...`);
      await db.insert(alerts).values(allAlerts);
    }

    console.log('✅ EIMS device population completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • ${allDevices.length} devices created`);
    console.log(`   • ${allDevices.filter(d => d.deviceType === 'FIXED_READER').length} Fixed Readers`);
    console.log(`   • ${allDevices.filter(d => d.deviceType === 'HANDHELD_DEVICE').length} Handheld Devices`);
    console.log(`   • ${allDevices.filter(d => d.status === 'LIVE').length} Live devices`);
    console.log(`   • ${allDevices.filter(d => d.status === 'DOWN').length} Down devices`);
    console.log(`   • ${allAlerts.length} alerts generated`);

  } catch (error) {
    console.error('❌ Error populating EIMS devices:', error);
    throw error;
  }
}

export async function populateWeatherData(): Promise<void> {
  console.log('🌤️ Populating weather data...');
  
  try {
    await db.delete(weatherData);

    const weatherConditions = ['sunny', 'cloudy', 'rainy', 'stormy', 'foggy', 'clear'];
    const uniqueRegions = Array.from(new Set(tollPlazaData.map(t => `${t.region}|${t.city}`)))
      .map(combined => {
        const [region, city] = combined.split('|');
        return { region, city };
      });

    const weatherEntries = uniqueRegions.map(loc => ({
      region: loc.region,
      city: loc.city,
      temperature: String(getRandomInRange(15, 45)),
      humidity: getRandomInRange(30, 90),
      condition: getRandomElement(weatherConditions),
      windSpeed: String(getRandomInRange(5, 25)),
      precipitation: String(Math.random() * 10),
      alerts: loc.region === 'Maharashtra' && Math.random() > 0.7 ? 
        ['Heavy rainfall expected in next 24 hours'] : 
        loc.region === 'Rajasthan' && Math.random() > 0.8 ?
        ['High temperature alert - above 40°C'] : [],
      timestamp: new Date(),
    }));

    await db.insert(weatherData).values(weatherEntries);
    console.log(`✅ Inserted weather data for ${weatherEntries.length} locations`);
    
  } catch (error) {
    console.error('❌ Error populating weather data:', error);
    throw error;
  }
}

export async function createTestUsers(): Promise<void> {
  console.log('👥 Creating test users...');
  
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('✅ Test users already exist, skipping creation');
      return;
    }

    const testUsers = [
      {
        email: 'general@nec.com',
        password: '$2b$10$rBTEv4wNd4VjD4VTd6x8COqyIbG7E/6eYJfKPrPAw7xo5vCrHZuoa', // password: admin123
        firstName: 'System',
        lastName: 'Administrator',
        role: 'NEC_GENERAL',
        region: null,
        permissions: { all: true },
        isActive: true,
      },
      {
        email: 'engineer.mumbai@nec.com',
        password: '$2b$10$rBTEv4wNd4VjD4VTd6x8COqyIbG7E/6eYJfKPrPAw7xo5vCrHZuoa', // password: admin123
        firstName: 'Rajesh',
        lastName: 'Kumar',
        role: 'NEC_ENGINEER',
        region: 'Maharashtra',
        permissions: { regional: ['Maharashtra'] },
        isActive: true,
      },
      {
        email: 'engineer.delhi@nec.com',
        password: '$2b$10$rBTEv4wNd4VjD4VTd6x8COqyIbG7E/6eYJfKPrPAw7xo5vCrHZuoa', // password: admin123
        firstName: 'Priya',
        lastName: 'Sharma',
        role: 'NEC_ENGINEER',
        region: 'Delhi',
        permissions: { regional: ['Delhi', 'Haryana'] },
        isActive: true,
      },
      {
        email: 'admin@nec.com',
        password: '$2b$10$rBTEv4wNd4VjD4VTd6x8COqyIbG7E/6eYJfKPrPAw7xo5vCrHZuoa', // password: admin123
        firstName: 'Admin',
        lastName: 'User',
        role: 'NEC_ADMIN',
        region: null,
        permissions: { admin: true, device_management: true },
        isActive: true,
      },
      {
        email: 'client@company.com',
        password: '$2b$10$rBTEv4wNd4VjD4VTd6x8COqyIbG7E/6eYJfKPrPAw7xo5vCrHZuoa', // password: admin123
        firstName: 'Client',
        lastName: 'User',
        role: 'CLIENT',
        region: null,
        permissions: { readonly: true },
        isActive: true,
      }
    ];

    await db.insert(users).values(testUsers);
    console.log('✅ Test users created successfully');
    console.log('📧 Login credentials (all use password: admin123):');
    testUsers.forEach(user => {
      console.log(`   • ${user.email} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  }
}
