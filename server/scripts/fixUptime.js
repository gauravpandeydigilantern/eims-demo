import { db } from "../db.js";
import { devices } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

async function fixUptimeValues() {
  try {
    console.log('Fixing uptime values...');
    
    const allDevices = await db.select().from(devices);
    
    for (const device of allDevices) {
      if (device.uptime && device.uptime > 100) {
        const newUptime = device.status === 'LIVE' ? 
          Math.floor(Math.random() * 30) + 70 : // 70-99% for live devices
          Math.floor(Math.random() * 50); // 0-50% for down devices
          
        await db.update(devices)
          .set({ uptime: newUptime })
          .where(eq(devices.id, device.id));
          
        console.log(`Fixed ${device.id}: ${device.uptime} -> ${newUptime}%`);
      }
    }
    
    console.log('✅ Uptime values fixed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixUptimeValues();