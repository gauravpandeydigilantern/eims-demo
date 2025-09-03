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
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  incrementLoginAttempts(userId: string): Promise<void>;
  resetLoginAttempts(userId: string): Promise<void>;
  
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
  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
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
      uptime: Number(r.avgUptime) || 0,
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
      uptime: Number(r.avgUptime) || 0,
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

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isActive, true));
  }
}

export const storage = new DatabaseStorage();
