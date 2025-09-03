import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import passport from "passport";
import { setupAuth, isAuthenticated, hasRole, hasRegionalAccess } from "./auth";
import { loginSchema, type User } from "@shared/schema";
import { deviceService } from "./services/deviceService";
import { alertService } from "./services/alertService";
import { aiService } from "./services/aiService";
import { weatherService } from "./services/weatherService";
import { insertDeviceOperationSchema, insertAlertSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.post('/api/login', (req, res, next) => {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: validation.error.issues 
      });
    }

    passport.authenticate('local', (err: any, user: User, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ message: "Login successful", user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          region: user.region,
          profileImageUrl: user.profileImageUrl
        }});
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as User;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        region: user.region,
        profileImageUrl: user.profileImageUrl
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Device routes
  app.get('/api/devices', isAuthenticated, hasRegionalAccess, async (req: any, res) => {
    try {
      const user = req.user as User;
      let devices = await storage.getAllDevices();
      
      // Apply regional restrictions for NEC_ENGINEER
      if (user.role === 'NEC_ENGINEER' && user.region) {
        devices = devices.filter(d => d.region === user.region);
      }
      
      res.json(devices);
    } catch (error) {
      console.error("Error fetching devices:", error);
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  app.get('/api/devices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const deviceData = await deviceService.getDeviceWithMetrics(req.params.id);
      
      if (!deviceData.device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      res.json(deviceData);
    } catch (error) {
      console.error("Error fetching device:", error);
      res.status(500).json({ message: "Failed to fetch device" });
    }
  });

  app.get('/api/devices/stats', isAuthenticated, hasRegionalAccess, async (req: any, res) => {
    try {
      const user = req.user as User;
      let devices = await storage.getAllDevices();
      
      // Apply regional restrictions for NEC_ENGINEER
      if (user.role === 'NEC_ENGINEER' && user.region) {
        devices = devices.filter(d => d.region === user.region);
      }
      
      const stats = {
        total: devices.length,
        online: devices.filter(d => d.status === 'LIVE').length,
        offline: devices.filter(d => d.status === 'SHUTDOWN').length,
        maintenance: devices.filter(d => d.status === 'MAINTENANCE').length,
        avgUptime: devices.length > 0 ? devices.reduce((acc, d) => acc + (d.uptime || 0), 0) / devices.length : 0
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching device stats:", error);
      res.status(500).json({ message: "Failed to fetch device stats" });
    }
  });

  app.post('/api/devices/:id/operations', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN']), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { operation, parameters } = req.body;
      
      const result = await deviceService.executeDeviceOperation(
        req.params.id,
        operation,
        user.id,
        parameters
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error executing device operation:", error);
      res.status(500).json({ message: "Failed to execute operation" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/status-summary', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN', 'CLIENT']), async (req, res) => {
    try {
      const summary = await storage.getDeviceStatusSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching status summary:", error);
      res.status(500).json({ message: "Failed to fetch status summary" });
    }
  });

  app.get('/api/analytics/regional-performance', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN', 'CLIENT']), async (req: any, res) => {
    try {
      const user = req.user as User;
      const performance = await storage.getRegionalPerformance();
      
      // Apply regional restrictions for NEC_ENGINEER
      if (user.role === 'NEC_ENGINEER' && user.region) {
        // Filter performance data by user's region
        // This would need to be implemented in storage.getRegionalPerformance() with region parameter
      }
      
      res.json(performance);
    } catch (error) {
      console.error("Error fetching regional performance:", error);
      res.status(500).json({ message: "Failed to fetch regional performance" });
    }
  });

  app.get('/api/analytics/vendor-performance', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ADMIN', 'CLIENT']), async (req, res) => {
    try {
      const performance = await storage.getVendorPerformance();
      res.json(performance);
    } catch (error) {
      console.error("Error fetching vendor performance:", error);
      res.status(500).json({ message: "Failed to fetch vendor performance" });
    }
  });

  app.get('/api/analytics/system-overview', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ADMIN']), async (req, res) => {
    try {
      const devices = await storage.getAllDevices();
      const alerts = await storage.getActiveAlerts();
      const metrics = await storage.getLatestMetrics();
      
      const overview = {
        totalDevices: devices.length,
        onlineDevices: devices.filter(d => d.status === 'LIVE').length,
        criticalAlerts: alerts.filter((a: any) => a.severity === 'CRITICAL').length,
        avgPerformance: devices.reduce((acc, d) => acc + (d.uptime || 0), 0) / devices.length,
        lastUpdated: new Date().toISOString()
      };
      
      res.json(overview);
    } catch (error) {
      console.error("Error fetching system overview:", error);
      res.status(500).json({ message: "Failed to fetch system overview" });
    }
  });

  app.get('/api/analytics/regional-stats', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN', 'CLIENT']), async (req: any, res) => {
    try {
      const user = req.user as User;
      let region = req.query.region as string;
      
      // For NEC_ENGINEER, restrict to their assigned region only
      if (user.role === 'NEC_ENGINEER' && user.region) {
        region = user.region; // Override any requested region
      } else if (!region) {
        region = user.region || '';
      }
      
      const devices = await storage.getAllDevices();
      const filteredDevices = region ? devices.filter(d => d.region === region) : devices;
      
      const stats = {
        region: region,
        totalDevices: filteredDevices.length,
        onlineDevices: filteredDevices.filter(d => d.status === 'LIVE').length,
        avgPerformance: filteredDevices.reduce((acc, d) => acc + (d.uptime || 0), 0) / filteredDevices.length,
        lastUpdated: new Date().toISOString()
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching regional stats:", error);
      res.status(500).json({ message: "Failed to fetch regional stats" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, hasRole(['NEC_ADMIN', 'NEC_GENERAL']), async (req, res) => {
    try {
      const devices = await storage.getAllDevices();
      const users = await storage.getAllUsers();
      
      const stats = {
        totalDevices: devices.length,
        totalUsers: users.length,
        pendingConfigs: Math.floor(Math.random() * 50) + 10,
        firmwareUpdates: Math.floor(Math.random() * 200) + 100,
        lastUpdated: new Date().toISOString()
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Alerts routes
  app.get('/api/alerts', isAuthenticated, hasRegionalAccess, async (req: any, res) => {
    try {
      const user = req.user as User;
      let alerts = await storage.getActiveAlerts();
      
      // Apply regional restrictions for NEC_ENGINEER
      if (user.role === 'NEC_ENGINEER' && user.region) {
        alerts = alerts.filter((a: any) => a.region === user.region);
      }
      
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post('/api/alerts/:id/acknowledge', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN']), async (req: any, res) => {
    try {
      const alert = await storage.acknowledgeAlert(req.params.id, req.user.id);
      res.json(alert);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  app.post('/api/alerts/:id/resolve', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN']), async (req: any, res) => {
    try {
      const alert = await storage.resolveAlert(req.params.id, req.user.id);
      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  app.get('/api/alerts/summary', isAuthenticated, hasRegionalAccess, async (req: any, res) => {
    try {
      const user = req.user as User;
      const summary = await alertService.getAlertsSummary();
      
      // Apply regional restrictions for NEC_ENGINEER
      if (user.role === 'NEC_ENGINEER' && user.region) {
        // Filter summary data by region if needed
        // This would need to be implemented in alertService.getAlertsSummary() with region parameter
      }
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching alerts summary:", error);
      res.status(500).json({ message: "Failed to fetch alerts summary" });
    }
  });

  // Weather routes
  app.get('/api/weather', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN', 'CLIENT']), async (req, res) => {
    try {
      const weatherData = await storage.getLatestWeatherData();
      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  app.get('/api/weather/alerts', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN', 'CLIENT']), async (req, res) => {
    try {
      const alerts = await weatherService.getWeatherAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching weather alerts:", error);
      res.status(500).json({ message: "Failed to fetch weather alerts" });
    }
  });

  app.get('/api/weather/devices-at-risk', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN']), async (req, res) => {
    try {
      const devicesAtRisk = await weatherService.getDevicesAtRisk();
      res.json(devicesAtRisk);
    } catch (error) {
      console.error("Error fetching devices at risk:", error);
      res.status(500).json({ message: "Failed to fetch devices at risk" });
    }
  });

  // User Management routes (Admin only)
  app.get('/api/users', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ADMIN']), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't return password hashes
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        region: user.region,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ADMIN']), async (req: any, res) => {
    try {
      const { email, firstName, lastName, role, region, password } = req.body;
      
      // Validate required fields
      if (!email || !firstName || !lastName || !role || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      const newUser = await storage.createUser({
        email,
        firstName,
        lastName,
        role,
        region: role === 'NEC_ENGINEER' ? region : null,
        password // Will be hashed in storage
      });
      
      res.status(201).json({ 
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          region: newUser.region
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.put('/api/users/:id', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ADMIN']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, role, region, isActive } = req.body;
      
      const updatedUser = await storage.updateUser(id, {
        firstName,
        lastName,
        role,
        region: role === 'NEC_ENGINEER' ? region : null,
        isActive
      });
      
      res.json({ 
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          region: updatedUser.region,
          isActive: updatedUser.isActive
        }
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ADMIN']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user as User;
      
      // Prevent self-deletion
      if (id === currentUser.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      await storage.deleteUser(id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // AI Assistant routes
  app.post('/api/ai/chat', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN']), async (req: any, res) => {
    try {
      const { query, sessionId } = req.body;
      const result = await aiService.processQuery(req.user.id, query, sessionId);
      res.json(result);
    } catch (error) {
      console.error("Error processing AI query:", error);
      res.status(500).json({ message: "Failed to process query" });
    }
  });

  app.get('/api/ai/sessions', isAuthenticated, hasRole(['NEC_GENERAL', 'NEC_ENGINEER', 'NEC_ADMIN']), async (req: any, res) => {
    try {
      const sessions = await storage.getUserChatSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    // Send initial data
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to EIMS real-time updates',
      timestamp: new Date().toISOString(),
    }));

    // Handle WebSocket messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Broadcast real-time updates
  function broadcastUpdate(type: string, data: any) {
    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  function handleWebSocketMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'subscribe':
        // Handle subscription to specific data types
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  // Simulate real-time updates every 30 seconds
  setInterval(async () => {
    try {
      // Broadcast device status updates
      const devices = await storage.getAllDevices();
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];
      
      if (randomDevice) {
        const updatedMetrics = {
          deviceId: randomDevice.id,
          cpuUsage: Math.floor(Math.random() * 100),
          ramUsage: Math.floor(Math.random() * 100),
          temperature: 25 + Math.random() * 30,
          timestamp: new Date(),
        };

        broadcastUpdate('device_metrics', updatedMetrics);
      }

      // Broadcast alert updates
      const alertsSummary = await alertService.getAlertsSummary();
      broadcastUpdate('alerts_summary', alertsSummary);

    } catch (error) {
      console.error('Error in real-time update:', error);
    }
  }, 30000);

  // Update weather data every hour
  setInterval(async () => {
    try {
      await weatherService.updateWeatherData();
      const weatherData = await storage.getLatestWeatherData();
      broadcastUpdate('weather_update', weatherData);
    } catch (error) {
      console.error('Error updating weather data:', error);
    }
  }, 60 * 60 * 1000);

  return httpServer;
}
