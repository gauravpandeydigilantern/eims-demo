import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(), // Hashed password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default('CLIENT'), // NEC_GENERAL, NEC_ENGINEER, NEC_ADMIN, CLIENT
  region: varchar("region"), // For NEC_ENGINEER geographic restrictions
  permissions: jsonb("permissions").default('{}'),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Device types and statuses
export const deviceTypeEnum = pgEnum('device_type', ['FIXED_READER', 'HANDHELD_DEVICE']);
export const deviceStatusEnum = pgEnum('device_status', ['LIVE', 'DOWN', 'MAINTENANCE', 'WARNING', 'SHUTDOWN']);
export const vendorEnum = pgEnum('vendor', ['BCIL', 'ZEBRA', 'IMP', 'ANJ']);

// Devices table
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey(), // e.g., FR_MUM_001, HHD_BLR_023
  macAddress: varchar("mac_address").unique(),
  serialNumber: varchar("serial_number"),
  deviceType: deviceTypeEnum("device_type").notNull(),
  vendor: vendorEnum("vendor").notNull(),
  model: varchar("model"),
  firmwareVersion: varchar("firmware_version"),
  status: deviceStatusEnum("status").notNull().default('DOWN'),
  subStatus: varchar("sub_status"), // active, standby, etc.
  location: varchar("location").notNull(),
  tollPlaza: varchar("toll_plaza").notNull(),
  region: varchar("region").notNull(),
  zone: varchar("zone").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  installDate: timestamp("install_date"),
  lastSeen: timestamp("last_seen"),
  lastTransaction: timestamp("last_transaction"),
  lastTagRead: timestamp("last_tag_read"),
  lastRegistration: timestamp("last_registration"),
  uptime: integer("uptime").default(0), // seconds
  transactionCount: integer("transaction_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Device health metrics
export const deviceMetrics = pgTable("device_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id),
  cpuUsage: integer("cpu_usage"), // percentage
  ramUsage: integer("ram_usage"), // percentage
  temperature: decimal("temperature", { precision: 5, scale: 2 }), // celsius
  antennaStatus: boolean("antenna_status").default(true),
  networkStatus: boolean("network_status").default(true),
  powerStatus: boolean("power_status").default(true),
  healthScore: integer("health_score"), // calculated overall health 0-100
  timestamp: timestamp("timestamp").defaultNow(),
});

// Alerts system
export const alertTypeEnum = pgEnum('alert_type', ['CRITICAL', 'WARNING', 'INFO']);
export const alertCategoryEnum = pgEnum('alert_category', ['DEVICE_OFFLINE', 'PERFORMANCE', 'WEATHER', 'MAINTENANCE', 'SECURITY']);

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").references(() => devices.id),
  type: alertTypeEnum("type").notNull(),
  category: alertCategoryEnum("category").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Device operations log
export const deviceOperations = pgTable("device_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  operation: varchar("operation").notNull(), // RESET_FULL, RESET_SERVICE, CONFIG_REFRESH, etc.
  status: varchar("status").notNull(), // PENDING, SUCCESS, FAILED
  parameters: jsonb("parameters").default('{}'),
  result: text("result"),
  errorMessage: text("error_message"),
  executedAt: timestamp("executed_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Weather data for regions
export const weatherData = pgTable("weather_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  region: varchar("region").notNull(),
  city: varchar("city").notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  humidity: integer("humidity"),
  condition: varchar("condition"), // sunny, rainy, cloudy, etc.
  windSpeed: decimal("wind_speed", { precision: 5, scale: 2 }),
  precipitation: decimal("precipitation", { precision: 5, scale: 2 }),
  alerts: jsonb("alerts").default('[]'), // weather alerts
  timestamp: timestamp("timestamp").defaultNow(),
});

// AI chat sessions
export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title"),
  messages: jsonb("messages").default('[]'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  alerts: many(alerts),
  operations: many(deviceOperations),
  chatSessions: many(aiChatSessions),
}));

export const devicesRelations = relations(devices, ({ many }) => ({
  metrics: many(deviceMetrics),
  alerts: many(alerts),
  operations: many(deviceOperations),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  device: one(devices, {
    fields: [alerts.deviceId],
    references: [devices.id],
  }),
  acknowledgedByUser: one(users, {
    fields: [alerts.acknowledgedBy],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [alerts.resolvedBy],
    references: [users.id],
  }),
}));

export const deviceMetricsRelations = relations(deviceMetrics, ({ one }) => ({
  device: one(devices, {
    fields: [deviceMetrics.deviceId],
    references: [devices.id],
  }),
}));

export const deviceOperationsRelations = relations(deviceOperations, ({ one }) => ({
  device: one(devices, {
    fields: [deviceOperations.deviceId],
    references: [devices.id],
  }),
  user: one(users, {
    fields: [deviceOperations.userId],
    references: [users.id],
  }),
}));

export const aiChatSessionsRelations = relations(aiChatSessions, ({ one }) => ({
  user: one(users, {
    fields: [aiChatSessions.userId],
    references: [users.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertDevice = typeof devices.$inferInsert;
export type Device = typeof devices.$inferSelect;

export type InsertDeviceMetrics = typeof deviceMetrics.$inferInsert;
export type DeviceMetrics = typeof deviceMetrics.$inferSelect;

export type InsertAlert = typeof alerts.$inferInsert;
export type Alert = typeof alerts.$inferSelect;

export type InsertDeviceOperation = typeof deviceOperations.$inferInsert;
export type DeviceOperation = typeof deviceOperations.$inferSelect;

export type InsertWeatherData = typeof weatherData.$inferInsert;
export type WeatherData = typeof weatherData.$inferSelect;

export type InsertAiChatSession = typeof aiChatSessions.$inferInsert;
export type AiChatSession = typeof aiChatSessions.$inferSelect;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDeviceSchema = createInsertSchema(devices);
export const insertAlertSchema = createInsertSchema(alerts);
export const insertDeviceOperationSchema = createInsertSchema(deviceOperations);
export const insertWeatherDataSchema = createInsertSchema(weatherData);
export const insertAiChatSessionSchema = createInsertSchema(aiChatSessions);

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// User role enum for validation
export const userRoleEnum = z.enum(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN', 'CLIENT']);
export type UserRole = z.infer<typeof userRoleEnum>;
