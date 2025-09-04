import express from "express";
import { db } from "../db.js";
import { alerts, devices, users } from "../../shared/schema.js";
import { eq, desc, and, gte, count, isNull, or } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// Get all alerts with filtering
router.get("/", requireAuth, async (req, res) => {
  try {
    const { 
      page = "1", 
      limit = "20", 
      type, 
      category,
      isRead,
      isResolved,
      deviceId 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const user = req.user;
    
    // Build filter conditions
    const conditions: any[] = [];
    
    if (type && type !== 'all') {
      conditions.push(eq(alerts.type, type as any));
    }
    
    if (category && category !== 'all') {
      conditions.push(eq(alerts.category, category as any));
    }
    
    if (isRead === 'true') {
      conditions.push(eq(alerts.isRead, true));
    } else if (isRead === 'false') {
      conditions.push(eq(alerts.isRead, false));
    }
    
    if (isResolved === 'true') {
      conditions.push(eq(alerts.isResolved, true));
    } else if (isResolved === 'false') {
      conditions.push(eq(alerts.isResolved, false));
    }
    
    if (deviceId) {
      conditions.push(eq(alerts.deviceId, deviceId as string));
    }

    // Apply user role-based filtering for device access
    if (user?.role === 'NEC_ENGINEER' && user.region) {
      // Join with devices to filter by region
      const alertsWithDevices = await db
        .select({
          alert: alerts,
          device: devices
        })
        .from(alerts)
        .leftJoin(devices, eq(alerts.deviceId, devices.id))
        .where(
          and(
            ...(conditions.length > 0 ? conditions : []),
            or(
              isNull(devices.region), // System-wide alerts
              eq(devices.region, user.region)
            )
          )
        )
        .orderBy(desc(alerts.createdAt))
        .limit(limitNum)
        .offset(offset);

      const alertsList = alertsWithDevices.map(item => ({
        ...item.alert,
        device: item.device
      }));

      const totalResult = await db
        .select({ count: count() })
        .from(alerts)
        .leftJoin(devices, eq(alerts.deviceId, devices.id))
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
        data: alertsList,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    }

    // For non-regional users, get all alerts
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const alertsList = await db
      .select({
        alert: alerts,
        device: devices
      })
      .from(alerts)
      .leftJoin(devices, eq(alerts.deviceId, devices.id))
      .where(whereClause)
      .orderBy(desc(alerts.createdAt))
      .limit(limitNum)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(alerts)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;

    const formattedAlerts = alertsList.map(item => ({
      ...item.alert,
      device: item.device
    }));

    res.json({
      success: true,
      data: formattedAlerts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch alerts" 
    });
  }
});

// Get alert statistics
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Get alert counts by type and read status
    let alertStats;
    
    if (user?.role === 'NEC_ENGINEER' && user.region) {
      // Filter by user's region
      alertStats = await db
        .select({
          type: alerts.type,
          isRead: alerts.isRead,
          isResolved: alerts.isResolved,
          count: count()
        })
        .from(alerts)
        .leftJoin(devices, eq(alerts.deviceId, devices.id))
        .where(
          or(
            isNull(devices.region),
            eq(devices.region, user.region)
          )
        )
        .groupBy(alerts.type, alerts.isRead, alerts.isResolved);
    } else {
      alertStats = await db
        .select({
          type: alerts.type,
          isRead: alerts.isRead,
          isResolved: alerts.isResolved,
          count: count()
        })
        .from(alerts)
        .groupBy(alerts.type, alerts.isRead, alerts.isResolved);
    }

    // Calculate summary statistics
    const totalAlerts = alertStats.reduce((sum, stat) => sum + stat.count, 0);
    const unreadAlerts = alertStats
      .filter(stat => !stat.isRead)
      .reduce((sum, stat) => sum + stat.count, 0);
    const unresolvedAlerts = alertStats
      .filter(stat => !stat.isResolved)
      .reduce((sum, stat) => sum + stat.count, 0);
    const criticalAlerts = alertStats
      .filter(stat => stat.type === 'CRITICAL' && !stat.isResolved)
      .reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      success: true,
      data: {
        totalAlerts,
        unreadAlerts,
        unresolvedAlerts,
        criticalAlerts,
        breakdown: {
          byType: alertStats.reduce((acc: any, stat) => {
            acc[stat.type] = (acc[stat.type] || 0) + stat.count;
            return acc;
          }, {}),
          byStatus: {
            read: alertStats.filter(s => s.isRead).reduce((sum, s) => sum + s.count, 0),
            unread: unreadAlerts,
            resolved: alertStats.filter(s => s.isResolved).reduce((sum, s) => sum + s.count, 0),
            unresolved: unresolvedAlerts
          }
        }
      }
    });

  } catch (error) {
    console.error("Error fetching alert stats:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch alert statistics" 
    });
  }
});

// Mark alert as read
router.patch("/:alertId/read", requireAuth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    // Check if alert exists and user has access
    const alertData = await db
      .select({
        alert: alerts,
        device: devices
      })
      .from(alerts)
      .leftJoin(devices, eq(alerts.deviceId, devices.id))
      .where(eq(alerts.id, alertId))
      .limit(1);

    if (alertData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Alert not found" 
      });
    }

    const alert = alertData[0].alert;
    const device = alertData[0].device;

    // Check regional access for engineers
    if (user.role === 'NEC_ENGINEER' && user.region && device?.region && device.region !== user.region) {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Alert not in your assigned region" 
      });
    }

    // Update alert as read
    await db
      .update(alerts)
      .set({ 
        isRead: true,
        updatedAt: new Date()
      })
      .where(eq(alerts.id, alertId));

    res.json({
      success: true,
      message: "Alert marked as read"
    });

  } catch (error) {
    console.error("Error marking alert as read:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to mark alert as read" 
    });
  }
});

// Acknowledge alert
router.patch("/:alertId/acknowledge", requireAuth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    // Clients cannot acknowledge alerts
    if (user.role === 'CLIENT') {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Clients cannot acknowledge alerts" 
      });
    }

    // Check if alert exists and user has access
    const alertData = await db
      .select({
        alert: alerts,
        device: devices
      })
      .from(alerts)
      .leftJoin(devices, eq(alerts.deviceId, devices.id))
      .where(eq(alerts.id, alertId))
      .limit(1);

    if (alertData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Alert not found" 
      });
    }

    const alert = alertData[0].alert;
    const device = alertData[0].device;

    // Check regional access for engineers
    if (user.role === 'NEC_ENGINEER' && user.region && device?.region && device.region !== user.region) {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Alert not in your assigned region" 
      });
    }

    // Update alert as acknowledged
    await db
      .update(alerts)
      .set({ 
        isRead: true,
        acknowledgedBy: user.id,
        acknowledgedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(alerts.id, alertId));

    res.json({
      success: true,
      message: "Alert acknowledged successfully"
    });

  } catch (error) {
    console.error("Error acknowledging alert:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to acknowledge alert" 
    });
  }
});

// Resolve alert
router.patch("/:alertId/resolve", requireAuth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    // Clients cannot resolve alerts
    if (user.role === 'CLIENT') {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Clients cannot resolve alerts" 
      });
    }

    // Check if alert exists and user has access
    const alertData = await db
      .select({
        alert: alerts,
        device: devices
      })
      .from(alerts)
      .leftJoin(devices, eq(alerts.deviceId, devices.id))
      .where(eq(alerts.id, alertId))
      .limit(1);

    if (alertData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Alert not found" 
      });
    }

    const alert = alertData[0].alert;
    const device = alertData[0].device;

    // Check regional access for engineers
    if (user.role === 'NEC_ENGINEER' && user.region && device?.region && device.region !== user.region) {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied: Alert not in your assigned region" 
      });
    }

    // Update alert as resolved
    await db
      .update(alerts)
      .set({ 
        isRead: true,
        isResolved: true,
        resolvedBy: user.id,
        resolvedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...(alert.metadata as any || {}),
          resolution: resolution || 'Resolved by user'
        }
      })
      .where(eq(alerts.id, alertId));

    res.json({
      success: true,
      message: "Alert resolved successfully"
    });

  } catch (error) {
    console.error("Error resolving alert:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to resolve alert" 
    });
  }
});

// Get recent alerts for dashboard
router.get("/recent", requireAuth, async (req, res) => {
  try {
    const { limit = "10" } = req.query;
    const limitNum = parseInt(limit as string);
    const user = req.user;

    let recentAlerts;

    if (user?.role === 'NEC_ENGINEER' && user.region) {
      // Filter by user's region
      recentAlerts = await db
        .select({
          alert: alerts,
          device: devices
        })
        .from(alerts)
        .leftJoin(devices, eq(alerts.deviceId, devices.id))
        .where(
          and(
            eq(alerts.isResolved, false),
            or(
              isNull(devices.region),
              eq(devices.region, user.region)
            )
          )
        )
        .orderBy(desc(alerts.createdAt))
        .limit(limitNum);
    } else {
      recentAlerts = await db
        .select({
          alert: alerts,
          device: devices
        })
        .from(alerts)
        .leftJoin(devices, eq(alerts.deviceId, devices.id))
        .where(eq(alerts.isResolved, false))
        .orderBy(desc(alerts.createdAt))
        .limit(limitNum);
    }

    const formattedAlerts = recentAlerts.map(item => ({
      ...item.alert,
      device: item.device
    }));

    res.json({
      success: true,
      data: formattedAlerts
    });

  } catch (error) {
    console.error("Error fetching recent alerts:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch recent alerts" 
    });
  }
});

export default router;
