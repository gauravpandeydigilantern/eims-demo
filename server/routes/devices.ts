import express from "express";
import { db } from "../db.js";
import { devices, deviceMetrics, alerts, weatherData, deviceOperations } from "../../shared/schema.js";
import { eq, desc, and, gte, count, sql, ilike, or } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";
import { isAuthenticated } from "../auth.js";
import { populateEIMSDevices, populateWeatherData, createTestUsers } from "../services/dummyDataService.js";

const router = express.Router();

// Test endpoint to verify router is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Devices router is working!' });
});

// Initialize dummy data (development only)
router.post("/init-data", async (req, res) => {
  try {
    console.log("🚀 Initializing EIMS dummy data...");
    
    await createTestUsers();
    await populateEIMSDevices();
    await populateWeatherData();
    
    res.json({ 
      success: true, 
      message: "EIMS dummy data initialized successfully" 
    });
  } catch (error) {
    console.error("Error initializing data:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to initialize data",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get all devices with filtering and pagination
router.get("/", requireAuth, async (req, res) => {
  try {
    const { 
      page = "1", 
      limit = "50", 
      status, 
      region, 
      vendor, 
      deviceType,
      search 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build filter conditions
    const conditions: any[] = [];
    
    if (status && status !== 'all') {
      conditions.push(eq(devices.status, status as any));
    }
    
    if (region && region !== 'all') {
      conditions.push(eq(devices.region, region as string));
    }
    
    if (vendor && vendor !== 'all') {
      conditions.push(eq(devices.vendor, vendor as any));
    }
    
    if (deviceType && deviceType !== 'all') {
      conditions.push(eq(devices.deviceType, deviceType as any));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(devices.id, searchTerm),
          ilike(devices.location, searchTerm),
          ilike(devices.tollPlaza, searchTerm),
          ilike(devices.macAddress, searchTerm)
        )
      );
    }

    // Apply user role-based filtering
    const user = req.user;
    if (user?.role === 'NEC_ENGINEER' && user.region) {
      conditions.push(eq(devices.region, user.region));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get devices with latest metrics
    const devicesList = await db
      .select({
        device: devices,
        metrics: deviceMetrics,
      })
      .from(devices)
      .leftJoin(
        deviceMetrics,
        eq(devices.id, deviceMetrics.deviceId)
      )
      .where(whereClause)
      .orderBy(desc(devices.lastSeen))
      .limit(limitNum)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(devices)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;

    // Group devices with their latest metrics
    const devicesWithMetrics = devicesList.reduce((acc: any[], item) => {
      const existingDevice = acc.find(d => d.id === item.device.id);
      if (existingDevice) {
        // Keep the latest metrics
        if (item.metrics && (!existingDevice.metrics || 
            (item.metrics.timestamp && existingDevice.metrics.timestamp &&
            new Date(item.metrics.timestamp) > new Date(existingDevice.metrics.timestamp)))) {
          existingDevice.metrics = item.metrics;
        }
      } else {
        acc.push({
          ...item.device,
          metrics: item.metrics
        });
      }
      return acc;
    }, []);

    res.json({
      success: true,
      data: devicesWithMetrics,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch devices" 
    });
  }
});

// Get device statistics
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Build base query conditions based on user role
    const baseConditions: any[] = [];
    if (user?.role === 'NEC_ENGINEER' && user.region) {
      baseConditions.push(eq(devices.region, user.region));
    }
    
    const whereClause = baseConditions.length > 0 ? and(...baseConditions) : undefined;

    // Get overall statistics
    const stats = await db
      .select({
        status: devices.status,
        deviceType: devices.deviceType,
        vendor: devices.vendor,
        region: devices.region,
        count: count()
      })
      .from(devices)
      .where(whereClause)
      .groupBy(devices.status, devices.deviceType, devices.vendor, devices.region);

    // Calculate summary statistics
    const totalDevices = stats.reduce((sum, stat) => sum + stat.count, 0);
    const liveDevices = stats
      .filter(stat => stat.status === 'LIVE')
      .reduce((sum, stat) => sum + stat.count, 0);
    const downDevices = stats
      .filter(stat => stat.status === 'DOWN')
      .reduce((sum, stat) => sum + stat.count, 0);
    const warningDevices = stats
      .filter(stat => stat.status === 'WARNING')
      .reduce((sum, stat) => sum + stat.count, 0);
    const maintenanceDevices = stats
      .filter(stat => stat.status === 'MAINTENANCE')
      .reduce((sum, stat) => sum + stat.count, 0);

    // Get recent alerts count
    const recentAlertsResult = await db
      .select({ count: count() })
      .from(alerts)
      .innerJoin(devices, eq(alerts.deviceId, devices.id))
      .where(
        and(
          gte(alerts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)), // Last 24 hours
          eq(alerts.isResolved, false),
          whereClause
        )
      );

    const recentAlerts = recentAlertsResult[0]?.count || 0;

    // Calculate uptime percentage
    const uptimePercentage = totalDevices > 0 ? 
      ((liveDevices / totalDevices) * 100).toFixed(1) : "0.0";

    res.json({
      success: true,
      data: {
        totalDevices,
        liveDevices,
        downDevices,
        warningDevices,
        maintenanceDevices,
        recentAlerts,
        uptimePercentage: parseFloat(uptimePercentage),
        breakdown: {
          byStatus: stats.reduce((acc: any, stat) => {
            acc[stat.status] = (acc[stat.status] || 0) + stat.count;
            return acc;
          }, {}),
          byType: stats.reduce((acc: any, stat) => {
            acc[stat.deviceType] = (acc[stat.deviceType] || 0) + stat.count;
            return acc;
          }, {}),
          byVendor: stats.reduce((acc: any, stat) => {
            acc[stat.vendor] = (acc[stat.vendor] || 0) + stat.count;
            return acc;
          }, {}),
          byRegion: stats.reduce((acc: any, stat) => {
            acc[stat.region] = (acc[stat.region] || 0) + stat.count;
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    console.error("Error fetching device stats:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch device statistics" 
    });
  }
});

// Get specific device details
router.get("/:deviceId", requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = req.user;

    // Get device with latest metrics (support both ID and MAC address)
    const deviceResult = await db
      .select({
        device: devices,
        metrics: deviceMetrics,
      })
      .from(devices)
      .leftJoin(
        deviceMetrics,
        eq(devices.id, deviceMetrics.deviceId)
      )
      .where(
        or(
          eq(devices.id, deviceId),
          eq(devices.macAddress, deviceId)
        )
      )
      .orderBy(desc(deviceMetrics.timestamp))
      .limit(1);

    if (deviceResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Device not found" 
      });
    }

    const device = deviceResult[0].device;
    const metrics = deviceResult[0].metrics;

    // Check user access permissions
    if (user?.role === 'NEC_ENGINEER' && user.region && device.region !== user.region) {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Device not in your assigned region" 
      });
    }

    // Get device alerts
    const deviceAlerts = await db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.deviceId, deviceId),
          eq(alerts.isResolved, false)
        )
      )
      .orderBy(desc(alerts.createdAt))
      .limit(10);

    // Get historical metrics (last 24 hours)
    const historicalMetrics = await db
      .select()
      .from(deviceMetrics)
      .where(
        and(
          eq(deviceMetrics.deviceId, deviceId),
          gte(deviceMetrics.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(deviceMetrics.timestamp))
      .limit(24);

    res.json({
      success: true,
      data: {
        ...device,
        metrics,
        alerts: deviceAlerts,
        historicalMetrics
      }
    });
  } catch (error) {
    console.error("Error fetching device details:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch device details" 
    });
  }
});

// Execute device operations (reset, restart, diagnostics, etc.)
router.post("/:deviceId/operations", requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { operation, parameters = {} } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    // Validate operation
    const validOperations = ['RESET_FULL', 'RESET_SERVICE', 'CONFIG_REFRESH', 'DIAGNOSTICS', 'EMERGENCY_CONFIG'];
    if (!validOperations.includes(operation)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid operation" 
      });
    }

    // Check if device exists and user has access (support both ID and MAC address)
    const device = await db
      .select()
      .from(devices)
      .where(
        or(
          eq(devices.id, deviceId),
          eq(devices.macAddress, deviceId)
        )
      )
      .limit(1);

    if (device.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Device not found" 
      });
    }

    // Check user permissions
    const deviceData = device[0];
    if (user.role === 'NEC_ENGINEER' && user.region && deviceData.region !== user.region) {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Device not in your assigned region" 
      });
    }

    if (user.role === 'CLIENT') {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Clients cannot execute device operations" 
      });
    }

    // Simulate operation execution
    const operationResult = await simulateDeviceOperation(deviceId, operation, parameters);

    // Log the operation
    await db.insert(deviceOperations).values({
      deviceId,
      userId: user.id,
      operation,
      status: operationResult.success ? 'SUCCESS' : 'FAILED',
      parameters,
      result: operationResult.message,
      errorMessage: operationResult.success ? null : operationResult.error,
      executedAt: new Date(),
      completedAt: new Date(),
    });

    res.json({
      success: true,
      message: operationResult.message,
      data: {
        deviceId,
        operation,
        result: operationResult
      }
    });
  } catch (error) {
    console.error("Error executing device operation:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to execute device operation" 
    });
  }
});

// Execute device command (reset, restart, etc.) - Legacy endpoint
router.post("/:deviceId/command", requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { command, parameters = {} } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    // Validate command
    const validCommands = ['RESET_FULL', 'RESET_SERVICE', 'CONFIG_REFRESH', 'EMERGENCY_CONFIG'];
    if (!validCommands.includes(command)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid command" 
      });
    }

    // Check if device exists and user has access
    const device = await db
      .select()
      .from(devices)
      .where(eq(devices.id, deviceId))
      .limit(1);

    if (device.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Device not found" 
      });
    }

    // Check user permissions
    const deviceData = device[0];
    if (user.role === 'NEC_ENGINEER' && user.region && deviceData.region !== user.region) {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Device not in your assigned region" 
      });
    }

    if (user.role === 'CLIENT') {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Clients cannot execute device commands" 
      });
    }

    // Simulate command execution (in real implementation, this would call vendor APIs)
    const commandResult = await simulateDeviceCommand(deviceId, command, parameters);

    // Log the operation
    await db.insert(deviceOperations).values({
      deviceId,
      userId: user.id,
      operation: command,
      status: commandResult.success ? 'SUCCESS' : 'FAILED',
      parameters,
      result: commandResult.message,
      errorMessage: commandResult.success ? null : commandResult.error,
      executedAt: new Date(),
      completedAt: new Date(),
    });

    res.json({
      success: true,
      data: {
        deviceId,
        command,
        result: commandResult
      }
    });
  } catch (error) {
    console.error("Error executing device command:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to execute device command" 
    });
  }
});

// Get device regions (for filtering)
router.get("/meta/regions", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    let regions;
    
    // Filter by user's assigned region if NEC_ENGINEER
    if (user?.role === 'NEC_ENGINEER' && user.region) {
      regions = await db
        .select({ region: devices.region })
        .from(devices)
        .where(eq(devices.region, user.region))
        .groupBy(devices.region);
    } else {
      regions = await db
        .select({ region: devices.region })
        .from(devices)
        .groupBy(devices.region);
    }

    res.json({
      success: true,
      data: regions.map(r => r.region).filter(Boolean).sort()
    });
  } catch (error) {
    console.error("Error fetching regions:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch regions" 
    });
  }
});

// Simulate device operation execution
async function simulateDeviceOperation(deviceId: string, operation: string, parameters: any) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Simulate success/failure (95% success rate)
  const success = Math.random() > 0.05;
  
  if (success) {
    // Update device status based on operation (support both ID and MAC address)
    if (operation === 'RESET_FULL' || operation === 'RESET_SERVICE') {
      await db
        .update(devices)
        .set({ 
          lastSeen: new Date(),
          lastSync: new Date(),
          status: 'LIVE',
          updatedAt: new Date()
        })
        .where(
          or(
            eq(devices.id, deviceId),
            eq(devices.macAddress, deviceId)
          )
        );
    }
    
    const messages = {
      'RESET_FULL': 'Full device reboot completed successfully. Device is now online.',
      'RESET_SERVICE': 'RFID services restarted successfully. Device is operational.',
      'CONFIG_REFRESH': 'Configuration refreshed successfully. New settings applied.',
      'DIAGNOSTICS': 'Diagnostic scan completed. All systems functioning normally.',
      'EMERGENCY_CONFIG': 'Emergency configuration applied successfully.'
    };
    
    return {
      success: true,
      message: messages[operation as keyof typeof messages] || `Operation ${operation} completed successfully`,
      timestamp: new Date().toISOString()
    };
  } else {
    return {
      success: false,
      message: `Operation ${operation} failed to execute`,
      error: "Device not responding or network timeout",
      timestamp: new Date().toISOString()
    };
  }
}

// Simulate device command execution - Legacy function
async function simulateDeviceCommand(deviceId: string, command: string, parameters: any) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Simulate success/failure (90% success rate)
  const success = Math.random() > 0.1;
  
  if (success) {
    // Update device status based on command
    if (command === 'RESET_FULL' || command === 'RESET_SERVICE') {
      await db
        .update(devices)
        .set({ 
          lastSeen: new Date(),
          lastSync: new Date(),
          status: 'LIVE',
          updatedAt: new Date()
        })
        .where(eq(devices.id, deviceId));
    }
    
    return {
      success: true,
      message: `Command ${command} executed successfully`,
      timestamp: new Date().toISOString()
    };
  } else {
    return {
      success: false,
      message: `Command ${command} failed to execute`,
      error: "Device not responding or network timeout",
      timestamp: new Date().toISOString()
    };
  }
}

// Fix uptime values for all devices
router.post('/fix-uptime', requireAuth, async (req, res) => {
  try {
    const allDevices = await db.select().from(devices);
    let fixed = 0;
    
    for (const device of allDevices) {
      if (device.uptime && device.uptime > 100) {
        const newUptime = device.status === 'LIVE' ? 
          Math.floor(Math.random() * 30) + 70 : 
          Math.floor(Math.random() * 50);
          
        await db.update(devices)
          .set({ uptime: newUptime })
          .where(eq(devices.id, device.id));
          
        fixed++;
      }
    }
    
    res.json({ success: true, message: `Fixed ${fixed} devices` });
  } catch (error) {
    console.error('Error fixing uptime:', error);
    res.status(500).json({ success: false, error: 'Failed to fix uptime' });
  }
});

// Route to update a device's last transaction time, making it "Active"
router.post('/:deviceId/touch', isAuthenticated, async (req: any, res) => {
    try {
        const { deviceId } = req.params;
        const user = req.user;

        console.log('Touch endpoint called for device:', deviceId);
        console.log('User:', user ? user.email : 'No user');

        if (!user) {
            return res.status(401).json({ success: false, error: "Authentication required" });
        }

        // Check if device exists and user has access
        const device = await db
            .select()
            .from(devices)
            .where(eq(devices.id, deviceId))
            .limit(1);

        if (device.length === 0) {
            return res.status(404).json({ success: false, error: "Device not found" });
        }

        const deviceData = device[0];
        if (user.role === 'NEC_ENGINEER' && user.region && deviceData.region !== user.region) {
            return res.status(403).json({ success: false, error: "Access denied: Device not in your assigned region" });
        }

        await db.update(devices).set({ 
            lastTransaction: new Date(),
            status: 'LIVE',
            lastSeen: new Date(),
            updatedAt: new Date()
        }).where(eq(devices.id, deviceId));
        
        console.log('Device touched successfully:', deviceId);
        res.json({ success: true, message: `Device ${deviceId} transaction time updated.` });
    } catch (error) {
        console.error(`Error touching device ${req.params.deviceId}:`, error);
        res.status(500).json({ success: false, message: "Failed to update device transaction time.", error: error.message });
    }
});

export default router;
