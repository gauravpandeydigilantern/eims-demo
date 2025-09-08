import { storage } from "../storage.js";

async function addSpecificDevice() {
  try {
    console.log('Adding device with MAC address 24:30:29:75:c7:86...');
    
    const deviceData = {
      id: "FR_MUM_01_01",
      macAddress: "24:30:29:75:c7:86",
      deviceType: "FIXED_READER",
      vendor: "NEC",
      model: "NEC-FR-X1",
      firmwareVersion: "v1.2.3",
      status: "LIVE",
      location: "Mumbai Toll Plaza 1",
      tollPlaza: "Mumbai Toll Plaza 1",
      region: "Mumbai",
      zone: "Zone 4",
      latitude: "19.0760",
      longitude: "72.8777",
      installDate: new Date("2024-01-15"),
      lastSeen: new Date(),
      lastSync: new Date(),
      lastTransaction: new Date(Date.now() - 3600000), // 1 hour ago
      transactionCount: 1234,
      uptime: 99.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const device = await storage.createDevice(deviceData);
    console.log('✅ Device created successfully:', device.id);
    
    // Add metrics
    const metricsData = {
      deviceId: device.id,
      cpuUsage: 35,
      ramUsage: 62,
      temperature: "42.5",
      antennaStatus: true,
      networkStatus: true,
      powerStatus: true,
      healthScore: 95,
    };
    
    await storage.recordDeviceMetrics(metricsData);
    console.log('✅ Device metrics added successfully');
    
  } catch (error) {
    console.error('❌ Error adding device:', error);
  }
}

addSpecificDevice();