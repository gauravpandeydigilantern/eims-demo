import { db } from "./db.js";
import { users, devices, deviceMetrics, alerts, deviceOperations, weatherData, maintenanceSchedules } from "../shared/schema.js";
import { populateEIMSDevices, populateWeatherData, createTestUsers } from "./services/dummyDataService.js";
import bcrypt from "bcryptjs";

export async function initializeDatabase() {
  try {
    console.log("🚀 Initializing database with EIMS data...");

    // Use existing functions to populate data
    await createTestUsers();
    console.log("✅ Demo users created successfully");

    await populateEIMSDevices();
    console.log("✅ Device data generated successfully");

    await populateWeatherData();
    console.log("✅ Weather data generated successfully");

    // Get counts for summary
    const allUsers = await db.select().from(users);
    const allDevices = await db.select().from(devices);
    const allMetrics = await db.select().from(deviceMetrics);
    const allAlerts = await db.select().from(alerts);
    const allOperations = await db.select().from(deviceOperations);
    const allMaintenance = await db.select().from(maintenanceSchedules);
    const allWeather = await db.select().from(weatherData);

    console.log("🎉 Database initialization completed successfully!");
    console.log("📊 Database Summary:");
    console.log(`   👥 Users: ${allUsers.length}`);
    console.log(`   🔧 Devices: ${allDevices.length}`);
    console.log(`   📈 Metrics: ${allMetrics.length}`);
    console.log(`   🚨 Alerts: ${allAlerts.length}`);
    console.log(`   ⚙️ Operations: ${allOperations.length}`);
    console.log(`   🔧 Maintenance: ${allMaintenance.length}`);
    console.log(`   🌤️ Weather: ${allWeather.length}`);
    
    return {
      success: true,
      summary: {
        users: allUsers.length,
        devices: allDevices.length,
        metrics: allMetrics.length,
        alerts: allAlerts.length,
        operations: allOperations.length,
        maintenance: allMaintenance.length,
        weather: allWeather.length
      }
    };

  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

// CLI execution
if (import.meta.url.endsWith(process.argv[1])) {
  initializeDatabase()
    .then(() => {
      console.log("✅ Database initialization completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Database initialization failed:", error);
      process.exit(1);
    });
}
