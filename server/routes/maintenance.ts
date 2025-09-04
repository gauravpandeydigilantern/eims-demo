import express from "express";
import { db } from "../db.js";
import { maintenanceSchedules, devices, users } from "../../shared/schema.js";
import { eq, desc, and, gte, lte, count, or, isNull } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// Get all maintenance schedules
router.get("/", requireAuth, async (req, res) => {
  try {
    const { 
      page = "1", 
      limit = "20", 
      status,
      priority,
      deviceId,
      type,
      startDate,
      endDate 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const user = req.user;
    
    // Build filter conditions
    const conditions: any[] = [];
    
    if (status && status !== 'all') {
      conditions.push(eq(maintenanceSchedules.status, status as any));
    }
    
    if (priority && priority !== 'all') {
      conditions.push(eq(maintenanceSchedules.priority, priority as any));
    }
    
    if (type && type !== 'all') {
      conditions.push(eq(maintenanceSchedules.type, type as any));
    }
    
    if (deviceId) {
      conditions.push(eq(maintenanceSchedules.deviceId, deviceId as string));
    }

    if (startDate) {
      conditions.push(gte(maintenanceSchedules.scheduledDate, new Date(startDate as string)));
    }

    if (endDate) {
      conditions.push(lte(maintenanceSchedules.scheduledDate, new Date(endDate as string)));
    }

    // Apply user role-based filtering
    if (user?.role === 'NEC_ENGINEER' && user.region) {
      // Join with devices to filter by region
      const maintenanceWithDevices = await db
        .select({
          maintenance: maintenanceSchedules,
          device: devices,
          assignedUser: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
        .from(maintenanceSchedules)
        .leftJoin(devices, eq(maintenanceSchedules.deviceId, devices.id))
        .leftJoin(users, eq(maintenanceSchedules.assignedTo, users.id))
        .where(
          and(
            ...(conditions.length > 0 ? conditions : []),
            or(
              isNull(devices.region),
              eq(devices.region, user.region)
            )
          )
        )
        .orderBy(desc(maintenanceSchedules.scheduledDate))
        .limit(limitNum)
        .offset(offset);

      const maintenanceList = maintenanceWithDevices.map(item => ({
        ...item.maintenance,
        device: item.device,
        assignedUser: item.assignedUser
      }));

      const totalResult = await db
        .select({ count: count() })
        .from(maintenanceSchedules)
        .leftJoin(devices, eq(maintenanceSchedules.deviceId, devices.id))
        .where(
          and(
            ...(conditions.length > 0 ? conditions : []),
            or(
              isNull(devices.region),
              eq(devices.region, user.region)
            )
          )
        );

      const total = totalResult[0]?.count || 0;

      return res.json({
        success: true,
        data: maintenanceList,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    }

    // For non-regional users, get all maintenance schedules
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const maintenanceList = await db
      .select({
        maintenance: maintenanceSchedules,
        device: devices,
        assignedUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(maintenanceSchedules)
      .leftJoin(devices, eq(maintenanceSchedules.deviceId, devices.id))
      .leftJoin(users, eq(maintenanceSchedules.assignedTo, users.id))
      .where(whereClause)
      .orderBy(desc(maintenanceSchedules.scheduledDate))
      .limit(limitNum)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(maintenanceSchedules)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;

    const formattedMaintenance = maintenanceList.map(item => ({
      ...item.maintenance,
      device: item.device,
      assignedUser: item.assignedUser
    }));

    res.json({
      success: true,
      data: formattedMaintenance,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error("Error fetching maintenance schedules:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch maintenance schedules" 
    });
  }
});

// Get maintenance statistics
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Get maintenance counts by status and priority
    let maintenanceStats;
    
    if (user?.role === 'NEC_ENGINEER' && user.region) {
      // Filter by user's region
      maintenanceStats = await db
        .select({
          status: maintenanceSchedules.status,
          priority: maintenanceSchedules.priority,
          type: maintenanceSchedules.type,
          count: count()
        })
        .from(maintenanceSchedules)
        .leftJoin(devices, eq(maintenanceSchedules.deviceId, devices.id))
        .where(
          or(
            isNull(devices.region),
            eq(devices.region, user.region)
          )
        )
        .groupBy(maintenanceSchedules.status, maintenanceSchedules.priority, maintenanceSchedules.type);
    } else {
      maintenanceStats = await db
        .select({
          status: maintenanceSchedules.status,
          priority: maintenanceSchedules.priority,
          type: maintenanceSchedules.type,
          count: count()
        })
        .from(maintenanceSchedules)
        .groupBy(maintenanceSchedules.status, maintenanceSchedules.priority, maintenanceSchedules.type);
    }

    // Calculate summary statistics
    const totalMaintenance = maintenanceStats.reduce((sum, stat) => sum + stat.count, 0);
    const pendingMaintenance = maintenanceStats
      .filter(stat => stat.status === 'SCHEDULED')
      .reduce((sum, stat) => sum + stat.count, 0);
    const inProgressMaintenance = maintenanceStats
      .filter(stat => stat.status === 'IN_PROGRESS')
      .reduce((sum, stat) => sum + stat.count, 0);
    const overdueMaintenance = maintenanceStats
      .filter(stat => stat.status === 'OVERDUE')
      .reduce((sum, stat) => sum + stat.count, 0);

    // Get upcoming maintenance (next 7 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7);

    let upcomingMaintenanceQuery;
    if (user?.role === 'NEC_ENGINEER' && user.region) {
      upcomingMaintenanceQuery = await db
        .select({ count: count() })
        .from(maintenanceSchedules)
        .leftJoin(devices, eq(maintenanceSchedules.deviceId, devices.id))
        .where(
          and(
            eq(maintenanceSchedules.status, 'SCHEDULED'),
            lte(maintenanceSchedules.scheduledDate, upcomingDate),
            gte(maintenanceSchedules.scheduledDate, new Date()),
            or(
              isNull(devices.region),
              eq(devices.region, user.region)
            )
          )
        );
    } else {
      upcomingMaintenanceQuery = await db
        .select({ count: count() })
        .from(maintenanceSchedules)
        .where(
          and(
            eq(maintenanceSchedules.status, 'SCHEDULED'),
            lte(maintenanceSchedules.scheduledDate, upcomingDate),
            gte(maintenanceSchedules.scheduledDate, new Date())
          )
        );
    }

    const upcomingMaintenance = upcomingMaintenanceQuery[0]?.count || 0;

    res.json({
      success: true,
      data: {
        totalMaintenance,
        pendingMaintenance,
        inProgressMaintenance,
        overdueMaintenance,
        upcomingMaintenance,
        breakdown: {
          byStatus: maintenanceStats.reduce((acc: any, stat) => {
            acc[stat.status] = (acc[stat.status] || 0) + stat.count;
            return acc;
          }, {}),
          byPriority: maintenanceStats.reduce((acc: any, stat) => {
            acc[stat.priority] = (acc[stat.priority] || 0) + stat.count;
            return acc;
          }, {}),
          byType: maintenanceStats.reduce((acc: any, stat) => {
            acc[stat.type] = (acc[stat.type] || 0) + stat.count;
            return acc;
          }, {})
        }
      }
    });

  } catch (error) {
    console.error("Error fetching maintenance stats:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch maintenance statistics" 
    });
  }
});

// Create new maintenance schedule
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    // Only NEC staff can create maintenance schedules
    if (user.role === 'CLIENT') {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Clients cannot create maintenance schedules" 
      });
    }

    const {
      deviceId,
      type,
      priority,
      scheduledDate,
      description,
      assignedTo,
      estimatedDuration,
      requiredParts,
      title
    } = req.body;

    // Validate required fields
    if (!deviceId || !type || !priority || !scheduledDate || !description || !title) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: deviceId, type, priority, scheduledDate, description, title"
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

    // Check regional access for engineers
    if (user.role === 'NEC_ENGINEER' && user.region && device[0].region !== user.region) {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Device not in your assigned region" 
      });
    }

    // Create maintenance schedule
    const maintenanceData = {
      deviceId,
      type,
      priority,
      status: 'SCHEDULED' as const,
      title,
      scheduledDate: new Date(scheduledDate),
      description,
      assignedTo: assignedTo || user.id,
      createdBy: user.id,
      estimatedDuration: estimatedDuration || 60, // Default 1 hour
      requiredParts: requiredParts || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newMaintenance] = await db
      .insert(maintenanceSchedules)
      .values(maintenanceData)
      .returning();

    res.status(201).json({
      success: true,
      data: newMaintenance,
      message: "Maintenance schedule created successfully"
    });

  } catch (error) {
    console.error("Error creating maintenance schedule:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create maintenance schedule" 
    });
  }
});

// Update maintenance schedule status
router.patch("/:maintenanceId/status", requireAuth, async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    const { status, notes } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    // Only NEC staff can update maintenance
    if (user.role === 'CLIENT') {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Clients cannot update maintenance schedules" 
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required"
      });
    }

    // Check if maintenance exists and user has access
    const maintenanceData = await db
      .select({
        maintenance: maintenanceSchedules,
        device: devices
      })
      .from(maintenanceSchedules)
      .leftJoin(devices, eq(maintenanceSchedules.deviceId, devices.id))
      .where(eq(maintenanceSchedules.id, maintenanceId))
      .limit(1);

    if (maintenanceData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Maintenance schedule not found" 
      });
    }

    const maintenance = maintenanceData[0].maintenance;
    const device = maintenanceData[0].device;

    // Check regional access for engineers
    if (user.role === 'NEC_ENGINEER' && user.region && device?.region && device.region !== user.region) {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Maintenance not in your assigned region" 
      });
    }

    // Update maintenance status
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'IN_PROGRESS' && maintenance.status === 'SCHEDULED') {
      updateData.startedAt = new Date();
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.completedBy = user.id;
    }

    if (notes) {
      updateData.notes = notes;
    }

    await db
      .update(maintenanceSchedules)
      .set(updateData)
      .where(eq(maintenanceSchedules.id, maintenanceId));

    res.json({
      success: true,
      message: "Maintenance status updated successfully"
    });

  } catch (error) {
    console.error("Error updating maintenance status:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update maintenance status" 
    });
  }
});

// Get upcoming maintenance for dashboard
router.get("/upcoming", requireAuth, async (req, res) => {
  try {
    const { limit = "10", days = "7" } = req.query;
    const limitNum = parseInt(limit as string);
    const daysNum = parseInt(days as string);
    const user = req.user;

    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + daysNum);

    let upcomingMaintenance;

    if (user?.role === 'NEC_ENGINEER' && user.region) {
      // Filter by user's region
      upcomingMaintenance = await db
        .select({
          maintenance: maintenanceSchedules,
          device: devices
        })
        .from(maintenanceSchedules)
        .leftJoin(devices, eq(maintenanceSchedules.deviceId, devices.id))
        .where(
          and(
            eq(maintenanceSchedules.status, 'SCHEDULED'),
            lte(maintenanceSchedules.scheduledDate, upcomingDate),
            gte(maintenanceSchedules.scheduledDate, new Date()),
            or(
              isNull(devices.region),
              eq(devices.region, user.region)
            )
          )
        )
        .orderBy(maintenanceSchedules.scheduledDate)
        .limit(limitNum);
    } else {
      upcomingMaintenance = await db
        .select({
          maintenance: maintenanceSchedules,
          device: devices
        })
        .from(maintenanceSchedules)
        .leftJoin(devices, eq(maintenanceSchedules.deviceId, devices.id))
        .where(
          and(
            eq(maintenanceSchedules.status, 'SCHEDULED'),
            lte(maintenanceSchedules.scheduledDate, upcomingDate),
            gte(maintenanceSchedules.scheduledDate, new Date())
          )
        )
        .orderBy(maintenanceSchedules.scheduledDate)
        .limit(limitNum);
    }

    const formattedMaintenance = upcomingMaintenance.map(item => ({
      ...item.maintenance,
      device: item.device
    }));

    res.json({
      success: true,
      data: formattedMaintenance
    });

  } catch (error) {
    console.error("Error fetching upcoming maintenance:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch upcoming maintenance" 
    });
  }
});

export default router;
