import { db } from "../db.js";
import { devices, deviceMetrics } from "../../shared/schema.js";

async function addTestDevice() {
  try {
    console.log('Adding test device with MAC address 24:30:29:75:c7:86...');
    
    // Insert test device
    await db.insert(devices).values({
      id: "FR_TEST_01_01",
      macAddress: "24:30:29:75:c7:86",
      assetId: "TEST-ASSET-001",
      location: "Test Location",
      tollPlaza: "Test Toll Plaza",
      region: "Mumbai",
      deviceType: "FIXED_READER",
      vendor: "NEC",
      model: "NEC-FR-X1",
      firmwareVersion: "1.2.3",
      installDate: new Date("2024-01-15"),
      status: "LIVE",
      lastSeen: new Date(),
      lastSync: new Date(),
      lastTransaction: new Date(Date.now() - 3600000), // 1 hour ago
      transactionCount: 1234,
      uptime: 99.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert test metrics
    await db.insert(deviceMetrics).values({
      deviceId: "FR_TEST_01_01",
      cpuUsage: 35,
      ramUsage: 62,
      temperature: 42.5,
      networkLatency: 15,
      diskUsage: 45,
      timestamp: new Date(),
    });

    console.log('✅ Test device added successfully!');
  } catch (error) {
    console.error('❌ Error adding test device:', error);
  }
}

addTestDevice();