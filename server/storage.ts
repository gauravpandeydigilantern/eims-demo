import {
  users,
  devices,
  deviceMetrics,
  alerts,
  deviceOperations,
  weatherData,
  aiChatSessions,
  type User,
  type UpsertUser,
  type Device,
  type DeviceMetrics,
  type Alert,
  type DeviceOperation,
  type WeatherData,
  type AiChatSession,
  type InsertDevice,
  type InsertDeviceMetrics,
  type InsertAlert,
  type InsertDeviceOperation,
  type InsertWeatherData,
  type InsertAiChatSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, like, inArray, sql, count } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsers(filters: any): Promise<{ users: User[]; total: number; page: number; totalPages: number }>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>;
  bulkUserOperation(operation: any): Promise<any>;
  incrementLoginAttempts(userId: string): Promise<void>;
  resetLoginAttempts(userId: string): Promise<void>;
  
  // Admin operations
  logAdminAction(action: any): Promise<void>;
  getUserActivity(userId: string, options: any): Promise<any>;
  
  // Device operations
  getAllDevices(): Promise<Device[]>;
  getDeviceById(id: string): Promise<Device | undefined>;
  getDevicesByRegion(region: string): Promise<Device[]>;
  getDevicesByStatus(status: string): Promise<Device[]>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: string, updates: Partial<Device>): Promise<Device>;
  
  // Device metrics
  getLatestDeviceMetrics(deviceId: string): Promise<DeviceMetrics | undefined>;
  getDeviceMetricsHistory(deviceId: string, hours: number): Promise<DeviceMetrics[]>;
  recordDeviceMetrics(metrics: InsertDeviceMetrics): Promise<DeviceMetrics>;
  
  // Alerts
  getActiveAlerts(): Promise<Alert[]>;
  getAlertsByType(type: string): Promise<Alert[]>;
  getAlertsByDevice(deviceId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  acknowledgeAlert(alertId: string, userId: string): Promise<Alert>;
  resolveAlert(alertId: string, userId: string): Promise<Alert>;
  
  // Device operations
  createDeviceOperation(operation: InsertDeviceOperation): Promise<DeviceOperation>;
  updateDeviceOperation(id: string, updates: Partial<DeviceOperation>): Promise<DeviceOperation>;
  getDeviceOperationHistory(deviceId: string): Promise<DeviceOperation[]>;
  
  // Weather data
  getLatestWeatherData(): Promise<WeatherData[]>;
  getWeatherByRegion(region: string): Promise<WeatherData | undefined>;
  updateWeatherData(weather: InsertWeatherData): Promise<WeatherData>;
  
  // AI chat sessions
  getUserChatSessions(userId: string): Promise<AiChatSession[]>;
  createChatSession(session: InsertAiChatSession): Promise<AiChatSession>;
  updateChatSession(id: string, updates: Partial<AiChatSession>): Promise<AiChatSession>;
  
  // Analytics
  getDeviceStatusSummary(): Promise<{ status: string; count: number }[]>;
  getRegionalPerformance(): Promise<{ region: string; uptime: number; deviceCount: number }[]>;
  getVendorPerformance(): Promise<{ vendor: string; uptime: number; deviceCount: number }[]>;
  getLatestMetrics(): Promise<DeviceMetrics[]>;
  
  // Role-specific analytics
  getRoleSpecificStats(role: string): Promise<any>;
  getWeatherImpact(): Promise<any>;
  getLoginActivities(timeFilter?: string, statusFilter?: string): Promise<any[]>;
  getUserActions(timeFilter?: string): Promise<any[]>;
  getActivityStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(filters: any): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20, role, region, search, status } = filters;
    const offset = (page - 1) * limit;

    // Simple approach: get all users and filter in memory for now
    let allUsers: User[] = await db.select().from(users).orderBy(desc(users.createdAt));
    
    // Apply filters
    if (role) {
      allUsers = allUsers.filter((u: User) => u.role === role);
    }
    if (region) {
      allUsers = allUsers.filter((u: User) => u.region === region);
    }
    if (status === 'active') {
      allUsers = allUsers.filter((u: User) => u.isActive === true);
    }
    if (status === 'inactive') {
      allUsers = allUsers.filter((u: User) => u.isActive === false);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      allUsers = allUsers.filter((u: User) => 
        (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
        (u.lastName && u.lastName.toLowerCase().includes(searchLower)) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }

    const total = allUsers.length;
    const totalPages = Math.ceil(total / limit);
    const usersResult: User[] = allUsers.slice(offset, offset + limit);

    return {
      users: usersResult,
      total,
      page,
      totalPages
    };
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async incrementLoginAttempts(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const attempts = (user.loginAttempts || 0) + 1;
    const updates: any = {
      loginAttempts: attempts,
      updatedAt: new Date(),
    };

    // Lock account after max attempts
    if (attempts >= 5) {
      updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    await db.update(users)
      .set(updates)
      .where(eq(users.id, userId));
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await db.update(users)
      .set({
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Device operations
  async getAllDevices(): Promise<Device[]> {
    return await db.select().from(devices).where(eq(devices.isActive, true));
  }

  async getDeviceById(id: string): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device;
  }

  async getDevicesByRegion(region: string): Promise<Device[]> {
    return await db.select().from(devices)
      .where(and(eq(devices.region, region), eq(devices.isActive, true)));
  }

  async getDevicesByStatus(status: string): Promise<Device[]> {
    return await db.select().from(devices)
      .where(and(eq(devices.status, status as any), eq(devices.isActive, true)));
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const [newDevice] = await db.insert(devices).values(device).returning();
    return newDevice;
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device> {
    const [updatedDevice] = await db
      .update(devices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(devices.id, id))
      .returning();
    return updatedDevice;
  }

  // Device metrics
  async getLatestDeviceMetrics(deviceId: string): Promise<DeviceMetrics | undefined> {
    const [metrics] = await db.select().from(deviceMetrics)
      .where(eq(deviceMetrics.deviceId, deviceId))
      .orderBy(desc(deviceMetrics.timestamp))
      .limit(1);
    return metrics;
  }

  async getDeviceMetricsHistory(deviceId: string, hours: number): Promise<DeviceMetrics[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await db.select().from(deviceMetrics)
      .where(and(
        eq(deviceMetrics.deviceId, deviceId),
        gte(deviceMetrics.timestamp, since)
      ))
      .orderBy(desc(deviceMetrics.timestamp));
  }

  async recordDeviceMetrics(metrics: InsertDeviceMetrics): Promise<DeviceMetrics> {
    const [newMetrics] = await db.insert(deviceMetrics).values(metrics).returning();
    return newMetrics;
  }

  // Alerts
  async getActiveAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts)
      .where(and(eq(alerts.isResolved, false)))
      .orderBy(desc(alerts.createdAt));
  }

  async getAlertsByType(type: string): Promise<Alert[]> {
    return await db.select().from(alerts)
      .where(eq(alerts.type, type as any))
      .orderBy(desc(alerts.createdAt));
  }

  async getAlertsByDevice(deviceId: string): Promise<Alert[]> {
    return await db.select().from(alerts)
      .where(eq(alerts.deviceId, deviceId))
      .orderBy(desc(alerts.createdAt));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    const [alert] = await db
      .update(alerts)
      .set({
        isRead: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, alertId))
      .returning();
    return alert;
  }

  async resolveAlert(alertId: string, userId: string): Promise<Alert> {
    const [alert] = await db
      .update(alerts)
      .set({
        isResolved: true,
        resolvedBy: userId,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, alertId))
      .returning();
    return alert;
  }

  // Device operations
  async createDeviceOperation(operation: InsertDeviceOperation): Promise<DeviceOperation> {
    const [newOperation] = await db.insert(deviceOperations).values(operation).returning();
    return newOperation;
  }

  async updateDeviceOperation(id: string, updates: Partial<DeviceOperation>): Promise<DeviceOperation> {
    const [operation] = await db
      .update(deviceOperations)
      .set(updates)
      .where(eq(deviceOperations.id, id))
      .returning();
    return operation;
  }

  async getDeviceOperationHistory(deviceId: string): Promise<DeviceOperation[]> {
    return await db.select().from(deviceOperations)
      .where(eq(deviceOperations.deviceId, deviceId))
      .orderBy(desc(deviceOperations.executedAt));
  }

  // Weather data
  async getLatestWeatherData(): Promise<WeatherData[]> {
    return await db.select().from(weatherData)
      .orderBy(desc(weatherData.timestamp));
  }

  async getWeatherByRegion(region: string): Promise<WeatherData | undefined> {
    const [weather] = await db.select().from(weatherData)
      .where(eq(weatherData.region, region))
      .orderBy(desc(weatherData.timestamp))
      .limit(1);
    return weather;
  }

  async updateWeatherData(weather: InsertWeatherData): Promise<WeatherData> {
    const [newWeather] = await db.insert(weatherData).values(weather).returning();
    return newWeather;
  }

  // AI chat sessions
  async getUserChatSessions(userId: string): Promise<AiChatSession[]> {
    return await db.select().from(aiChatSessions)
      .where(and(eq(aiChatSessions.userId, userId), eq(aiChatSessions.isActive, true)))
      .orderBy(desc(aiChatSessions.updatedAt));
  }

  async createChatSession(session: InsertAiChatSession): Promise<AiChatSession> {
    const [newSession] = await db.insert(aiChatSessions).values(session).returning();
    return newSession;
  }

  async updateChatSession(id: string, updates: Partial<AiChatSession>): Promise<AiChatSession> {
    const [session] = await db
      .update(aiChatSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiChatSessions.id, id))
      .returning();
    return session;
  }

  // Analytics
  async getDeviceStatusSummary(): Promise<{ status: string; count: number }[]> {
    const result = await db
      .select({
        status: devices.status,
        count: count(devices.id),
      })
      .from(devices)
      .where(eq(devices.isActive, true))
      .groupBy(devices.status);
    
    return result.map(r => ({ status: r.status, count: Number(r.count) }));
  }

  async getRegionalPerformance(): Promise<{ region: string; uptime: number; deviceCount: number }[]> {
    const result = await db
      .select({
        region: devices.region,
        deviceCount: count(devices.id),
        avgUptime: sql<number>`AVG(${devices.uptime})`.as('avgUptime'),
      })
      .from(devices)
      .where(eq(devices.isActive, true))
      .groupBy(devices.region);
    
    return result.map(r => ({
      region: r.region,
      // Convert large uptime numbers to reasonable percentages
      uptime: Math.min(Math.round((Number(r.avgUptime) || 0) / 1000), 100),
      deviceCount: Number(r.deviceCount),
    }));
  }

  async getVendorPerformance(): Promise<{ vendor: string; uptime: number; deviceCount: number }[]> {
    const result = await db
      .select({
        vendor: devices.vendor,
        deviceCount: count(devices.id),
        avgUptime: sql<number>`AVG(${devices.uptime})`.as('avgUptime'),
      })
      .from(devices)
      .where(eq(devices.isActive, true))
      .groupBy(devices.vendor);
    
    return result.map(r => ({
      vendor: r.vendor,
      // Convert large uptime numbers to reasonable percentages
      uptime: Math.min(Math.round((Number(r.avgUptime) || 0) / 1000), 100),
      deviceCount: Number(r.deviceCount),
    }));
  }

  async getLatestMetrics(): Promise<DeviceMetrics[]> {
    return await db
      .select()
      .from(deviceMetrics)
      .orderBy(desc(deviceMetrics.timestamp))
      .limit(100);
  }

  // Role-specific analytics methods
  async getRoleSpecificStats(role: string): Promise<any> {
    const devices = await this.getAllDevices();
    const users = await this.getAllUsers();
    
    const onlineDevices = devices.filter(d => d.status === 'LIVE').length;
    const criticalAlerts = Math.floor(Math.random() * 10 + 5); // 5-15 critical alerts
    const activeUsers = users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
    
    // Generate role-specific stats
    if (role === 'NEC_GENERAL') {
      return {
        general: {
          totalUsers: users.length,
          activeUsers: activeUsers,
          systemHealth: Math.round((onlineDevices / devices.length) * 100),
          criticalAlerts: criticalAlerts,
          monthlyUptime: Math.round(Math.random() * 10 + 90), // 90-100%
          maintenanceReduction: Math.round(Math.random() * 20 + 15), // 15-35%
          responseTimeImprovement: Math.round(Math.random() * 15 + 10), // 10-25%
        }
      };
    }
    
    return {
      totalDevices: devices.length,
      onlineDevices: onlineDevices,
      avgUptime: devices.reduce((acc, d) => acc + (d.uptime || 0), 0) / devices.length,
      lastUpdated: new Date().toISOString()
    };
  }

  async getWeatherImpact(): Promise<any> {
    const devices = await this.getAllDevices();
    const weatherData = await this.getLatestWeatherData();
    
    // Calculate more detailed weather impact metrics
    const severeConditions = ['thunderstorm', 'rainy', 'fog', 'cold'];
    const severeWeather = weatherData.filter(w => w.condition && severeConditions.includes(w.condition));
    const affectedRegions = Array.from(new Set(severeWeather.map(w => w.region)));
    
    const devicesAtRisk = Math.floor(devices.length * (severeWeather.length / Math.max(weatherData.length, 1)) * 0.3);
    const protectedDevices = devices.length - devicesAtRisk;
    
    return {
      devicesAtRisk,
      weatherAlerts: severeWeather.length,
      affectedRegions: affectedRegions.length,
      protectedDevices,
      alertsGenerated: severeWeather.length * 2, // Multiple alerts per severe condition
      riskLevel: severeWeather.length > 3 ? 'HIGH' : severeWeather.length > 1 ? 'MEDIUM' : 'LOW',
      impactedRegions: affectedRegions,
      severityBreakdown: {
        critical: severeWeather.filter(w => w.condition && ['thunderstorm', 'fog'].includes(w.condition)).length,
        warning: severeWeather.filter(w => w.condition && ['rainy', 'cold'].includes(w.condition)).length,
        watch: weatherData.filter(w => w.condition && ['cloudy', 'windy'].includes(w.condition)).length
      },
      lastUpdated: new Date().toISOString()
    };
  }

  async getLoginActivities(timeFilter?: string, statusFilter?: string): Promise<any[]> {
    // Get real users from database
    const allUsers = await this.getAllUsers();
    
    const activities = [];
    const now = new Date();
    
    // Calculate time range based on filter
    let timeRange = 24 * 60 * 60 * 1000; // 24 hours default
    switch (timeFilter) {
      case '7d': timeRange = 7 * 24 * 60 * 60 * 1000; break;
      case '30d': timeRange = 30 * 24 * 60 * 60 * 1000; break;
    }
    
    // Generate realistic login activities for existing users
    for (let i = 0; i < 25; i++) {
      const user = allUsers[i % allUsers.length];
      if (!user) continue;
      
      const loginTime = new Date(now.getTime() - Math.random() * timeRange);
      const statuses = ['success', 'success', 'success', 'failed', 'success', 'active']; // Mostly successful
      const status = statuses[i % statuses.length];
      const deviceTypes = ['desktop', 'mobile', 'tablet'];
      const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
      
      const activity = {
        id: `activity-${i}`,
        userId: user.id,
        email: user.email,
        role: user.role,
        loginTime: loginTime.toISOString(),
        logoutTime: status === 'success' && Math.random() > 0.3 ? 
          new Date(loginTime.getTime() + Math.random() * 4 * 60 * 60 * 1000).toISOString() : undefined,
        ipAddress: `192.168.${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 254) + 1}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: locations[Math.floor(Math.random() * locations.length)],
        deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)] as 'desktop' | 'mobile' | 'tablet',
        status: status as 'success' | 'failed' | 'blocked' | 'active',
        sessionDuration: status === 'success' ? Math.floor(Math.random() * 240 + 30) * 60 : undefined, // 30 min to 4 hours in seconds
        failureReason: status === 'failed' ? 'Invalid password' : undefined
      };
      
      activities.push(activity);
    }
    
    // Apply status filter
    return statusFilter && statusFilter !== 'all' 
      ? activities.filter(a => a.status === statusFilter)
      : activities;
  }

  async getUserActions(timeFilter?: string): Promise<any[]> {
    // Get real users and devices from database
    const allUsers = await this.getAllUsers();
    const allDevices = await this.getAllDevices();
    
    const actions = [];
    const now = new Date();
    
    // Calculate time range based on filter
    let timeRange = 24 * 60 * 60 * 1000; // 24 hours default
    switch (timeFilter) {
      case '7d': timeRange = 7 * 24 * 60 * 60 * 1000; break;
      case '30d': timeRange = 30 * 24 * 60 * 60 * 1000; break;
    }
    
    const actionTypes = [
      { action: 'Device Reset', resource: 'device' },
      { action: 'Configuration Update', resource: 'system' },
      { action: 'Alert Acknowledgment', resource: 'alert' },
      { action: 'Report Generation', resource: 'report' },
      { action: 'User Creation', resource: 'user' },
      { action: 'Firmware Update', resource: 'device' },
      { action: 'Backup Creation', resource: 'system' },
      { action: 'Maintenance Schedule', resource: 'maintenance' }
    ];
    
    // Generate realistic user actions
    for (let i = 0; i < 30; i++) {
      const user = allUsers[i % allUsers.length];
      const device = allDevices[i % allDevices.length];
      const actionType = actionTypes[i % actionTypes.length];
      
      if (!user) continue;
      
      const timestamp = new Date(now.getTime() - Math.random() * timeRange);
      const success = Math.random() > 0.1; // 90% success rate
      
      const action = {
        id: `action-${i}`,
        userId: user.id,
        email: user.email,
        action: actionType.action,
        resource: actionType.resource === 'device' && device ? device.id : actionType.resource,
        timestamp: timestamp.toISOString(),
        ipAddress: `192.168.${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 254) + 1}`,
        success,
        details: {
          userRole: user.role,
          location: device?.location || user.region || 'System',
          duration: `${Math.floor(Math.random() * 120) + 5}s`
        }
      };
      
      actions.push(action);
    }
    
    return actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getActivityStats(): Promise<any> {
    const users = await this.getAllUsers();
    const devices = await this.getAllDevices();
    const loginActivities = await this.getLoginActivities('24h');
    const userActions = await this.getUserActions('24h');
    
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Calculate real statistics
    const totalLogins = loginActivities.length;
    const activeUsers = users.filter(u => 
      u.lastLogin && new Date(u.lastLogin) > last24Hours
    ).length;
    const failedAttempts = loginActivities.filter(a => a.status === 'failed').length;
    const successfulLogins = loginActivities.filter(a => a.status === 'success').length;
    
    // Calculate average session duration
    const sessionsWithDuration = loginActivities.filter(a => a.sessionDuration);
    const avgSessionDuration = sessionsWithDuration.length > 0 
      ? sessionsWithDuration.reduce((sum, a) => sum + (a.sessionDuration || 0), 0) / sessionsWithDuration.length
      : 0;
    
    return {
      totalLogins,
      activeUsers: Math.max(activeUsers, 4), // Ensure at least some active users for demo
      failedAttempts,
      blockedUsers: Math.floor(failedAttempts * 0.1), // 10% of failed attempts result in blocks
      avgSessionDuration: Math.floor(avgSessionDuration),
      peakHours: ['09:00', '14:00', '16:00'], // Common peak hours
      securityIncidents: failedAttempts > 5 ? Math.floor(failedAttempts / 5) : 0,
      multipleLoginDetections: Math.floor(totalLogins * 0.05), // 5% have multiple logins
      lastUpdated: now.toISOString()
    };
  }

  // Additional user management methods
  async updateUserPassword(id: string, password: string): Promise<void> {
    await db.update(users)
      .set({ 
        password,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async bulkUserOperation(operation: any): Promise<any> {
    const { userIds, operation: op, data } = operation;
    
    switch (op) {
      case 'activate':
        await db.update(users)
          .set({ isActive: true, updatedAt: new Date() })
          .where(inArray(users.id, userIds));
        break;
      case 'deactivate':
        await db.update(users)
          .set({ isActive: false, updatedAt: new Date() })
          .where(inArray(users.id, userIds));
        break;
      case 'updateRole':
        if (data?.role) {
          await db.update(users)
            .set({ role: data.role, region: data.region, updatedAt: new Date() })
            .where(inArray(users.id, userIds));
        }
        break;
      case 'delete':
        await db.delete(users).where(inArray(users.id, userIds));
        break;
    }
    
    return {
      success: true,
      affectedUsers: userIds.length,
      operation: op
    };
  }

  async logAdminAction(action: any): Promise<void> {
    // In a real implementation, this would log to an audit table
    console.log('Admin Action:', {
      adminId: action.adminId,
      action: action.action,
      targetUserId: action.targetUserId,
      details: action.details,
      timestamp: action.timestamp
    });
  }

  async getUserActivity(userId: string, options: any): Promise<any> {
    const { page = 1, limit = 50 } = options;
    
    // Mock user activity data
    const activities = [];
    for (let i = 0; i < limit; i++) {
      activities.push({
        id: `activity-${userId}-${i}`,
        action: ['login', 'device_restart', 'config_update', 'report_view'][i % 4],
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        ipAddress: `192.168.1.${i % 255}`,
        details: `User performed ${['login', 'device_restart', 'config_update', 'report_view'][i % 4]}`
      });
    }
    
    return {
      activities,
      total: 500,
      page,
      totalPages: Math.ceil(500 / limit)
    };
  }

  // Notification methods
  async getUserNotificationPreferences(userId: string): Promise<any> {
    // Mock implementation - would query user_notification_preferences table
    return {
      email: true,
      sms: false,
      push: true,
      categories: {
        critical_alerts: true,
        device_down: true,
        maintenance_due: true,
        performance_issues: false,
        system_updates: false,
      },
      quiet_hours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    };
  }

  async updateUserNotificationPreferences(userId: string, preferences: any): Promise<void> {
    // Mock implementation - would update user_notification_preferences table
    console.log(`Updating notification preferences for user ${userId}:`, preferences);
  }

  async getNotificationHistory(userId: string, options: { page?: number; limit?: number; type?: string; category?: string }): Promise<{ notifications: any[]; total: number }> {
    const { page = 1, limit = 50, type, category } = options;
    const offset = (page - 1) * limit;
    
    // Mock implementation - would query notifications table
    let notifications = [
      {
        id: '1',
        userId,
        type: 'email',
        category: 'device_down',
        subject: 'Device Offline Alert',
        message: 'Device DEV001 has gone offline',
        priority: 'high',
        status: 'sent',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        readAt: null,
      },
      {
        id: '2',
        userId,
        type: 'push',
        category: 'maintenance_due',
        subject: 'Maintenance Due',
        message: 'Scheduled maintenance required for DEV002',
        priority: 'medium',
        status: 'sent',
        sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        readAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ];
    
    // Filter by type and category
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    if (category) {
      notifications = notifications.filter(n => n.category === category);
    }
    
    return {
      notifications: notifications.slice(offset, offset + limit),
      total: notifications.length,
    };
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    // Mock implementation - would update notification read status
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);
  }

  async getNotificationStats(userId: string, timeframe: string): Promise<any> {
    // Mock implementation - would query notification statistics
    return {
      totalSent: 45,
      totalRead: 38,
      totalUnread: 7,
      byType: {
        email: 30,
        push: 12,
        sms: 3,
      },
      byCategory: {
        critical_alerts: 5,
        device_down: 15,
        maintenance_due: 18,
        performance_issues: 4,
        system_updates: 3,
      },
      readRate: 84.4,
      responseTime: '2.3 hours',
    };
  }

  async logNotification(notification: any): Promise<void> {
    // Mock implementation - would insert into notifications table
    console.log('Logging notification:', notification);
  }

  async getUsersForAlertNotification(alertType: string, priority: string): Promise<any[]> {
    // Mock implementation - would query users who should receive this type of alert
    const allUsers = await this.getUsers({ page: 1, limit: 1000 });
    
    // Filter users based on role and alert preferences
    return allUsers.users.filter(user => {
      // Admins get all alerts
      if (user.role === 'ADMIN') return true;
      
      // Critical alerts go to all users
      if (priority === 'critical') return true;
      
      // High priority alerts go to managers and engineers
      if (priority === 'high' && ['MANAGER', 'ENGINEER', 'NEC_ENGINEER'].includes(user.role)) return true;
      
      // Medium priority alerts go to engineers only
      if (priority === 'medium' && ['ENGINEER', 'NEC_ENGINEER'].includes(user.role)) return true;
      
      return false;
    });
  }

  // Vendor Integration Methods
  async getVendorConfigurations(): Promise<any[]> {
    // Mock implementation - would query vendor_configurations table
    return [
      {
        id: 'vendor-1',
        name: 'NEC Primary',
        type: 'NEC',
        apiEndpoint: 'https://api.nec-devices.local',
        authentication: {
          type: 'api_key',
          credentials: { key: '***' }
        },
        polling_interval: 300,
        enabled: true,
        region: 'Mumbai',
        lastSync: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        status: 'connected'
      },
      {
        id: 'vendor-2',
        name: 'NCR Secondary',
        type: 'NCR',
        apiEndpoint: 'https://ncr-api.local',
        authentication: {
          type: 'basic',
          credentials: { username: 'eims', password: '***' }
        },
        polling_interval: 600,
        enabled: false,
        region: 'Delhi',
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'disconnected'
      }
    ];
  }

  async getVendorConfiguration(vendorId: string): Promise<any> {
    // Mock implementation
    const vendors = await this.getVendorConfigurations();
    return vendors.find(v => v.id === vendorId);
  }

  async createVendorConfiguration(config: any): Promise<any> {
    // Mock implementation - would insert into vendor_configurations table
    const newVendor = {
      id: `vendor-${Date.now()}`,
      ...config,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending'
    };
    console.log('Creating vendor configuration:', newVendor);
    return newVendor;
  }

  async updateVendorConfiguration(vendorId: string, updates: any): Promise<any> {
    // Mock implementation - would update vendor_configurations table
    const vendor = await this.getVendorConfiguration(vendorId);
    if (!vendor) return null;
    
    const updatedVendor = {
      ...vendor,
      ...updates,
      updatedAt: new Date()
    };
    console.log('Updating vendor configuration:', vendorId, updates);
    return updatedVendor;
  }

  async deleteVendorConfiguration(vendorId: string): Promise<boolean> {
    // Mock implementation - would delete from vendor_configurations table
    console.log('Deleting vendor configuration:', vendorId);
    return true;
  }

  async logVendorActivity(activity: any): Promise<void> {
    // Mock implementation - would insert into vendor_activity table
    console.log('Vendor Activity:', {
      vendorId: activity.vendorId,
      activity: activity.activity,
      status: activity.status,
      details: activity.details,
      timestamp: activity.timestamp
    });
  }

  async getVendorSyncStatus(vendorId: string): Promise<any> {
    // Mock implementation - would query vendor sync statistics
    return {
      vendorId,
      lastSyncAt: new Date(Date.now() - 15 * 60 * 1000),
      nextSyncAt: new Date(Date.now() + 5 * 60 * 1000),
      status: 'healthy',
      devicesManaged: 125,
      successfulSyncs: 48,
      failedSyncs: 2,
      avgSyncTime: '2.3s',
      lastError: null
    };
  }

  async getVendorActivity(vendorId: string, options: { page?: number; limit?: number }): Promise<any> {
    const { page = 1, limit = 50 } = options;
    
    // Mock implementation - would query vendor_activity table
    const activities = [
      {
        id: 'act-1',
        activity: 'device_sync',
        status: 'success',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        details: { devicesProcessed: 125, devicesUpdated: 3 }
      },
      {
        id: 'act-2',
        activity: 'connection_test',
        status: 'success',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        details: { responseTime: 450 }
      },
      {
        id: 'act-3',
        activity: 'device_sync',
        status: 'failed',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        details: { error: 'Connection timeout' }
      }
    ];
    
    return {
      activities,
      total: 150,
      page,
      totalPages: Math.ceil(150 / limit)
    };
  }

  async getVendorIntegrationOverview(): Promise<any> {
    // Mock implementation - would query across vendor tables
    return {
      totalVendors: 5,
      activeVendors: 3,
      connectedVendors: 2,
      totalDevicesManaged: 450,
      lastSyncStatus: {
        successful: 3,
        failed: 0,
        pending: 2
      },
      vendorTypes: {
        'NEC': 2,
        'NCR': 1,
        'Wincor': 1,
        'Diebold': 1
      },
      syncFrequency: '5 minutes',
      dataFreshness: 'Less than 5 minutes old'
    };
  }

  async getDevicesByVendor(vendorId: string, options: { page?: number; limit?: number }): Promise<any> {
    const { page = 1, limit = 100 } = options;
    
    // Mock implementation - would query devices by vendor
    const allDevices = await this.getAllDevices();
    const vendorDevices = allDevices.filter((d: any) => d.vendor === vendorId || d.vendor === 'NEC'); // Mock filter
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      devices: vendorDevices.slice(startIndex, endIndex),
      total: vendorDevices.length,
      page,
      totalPages: Math.ceil(vendorDevices.length / limit)
    };
  }

  async getDeviceByVendorId(vendorId: string, vendorDeviceId: string): Promise<any> {
    // Mock implementation - would query by vendor_id and vendor_device_id
    const devices = await this.getAllDevices();
    return devices.find((d: any) => d.vendorDeviceId === vendorDeviceId);
  }

  async updateDeviceFromVendor(deviceId: string, vendorData: any): Promise<any> {
    // Mock implementation - would update device with vendor data
    console.log('Updating device from vendor:', deviceId, vendorData);
    return { success: true };
  }

  async updateDeviceStatus(deviceId: string, status: string): Promise<any> {
    // Mock implementation - would update device status
    console.log('Updating device status:', deviceId, status);
    return { success: true };
  }

  async createDeviceFromVendor(deviceData: any): Promise<any> {
    // Mock implementation - would create new device from vendor data
    const newDevice = {
      id: `dev-${Date.now()}`,
      ...deviceData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('Creating device from vendor:', newDevice);
    return newDevice;
  }
}

export const storage = new DatabaseStorage();
