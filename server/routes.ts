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
  app.get('/api/analytics/status-summary', isAuthenticated, async (req, res) => {
    try {
      const summary = await storage.getDeviceStatusSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching status summary:", error);
      res.status(500).json({ message: "Failed to fetch status summary" });
    }
  });

  app.get('/api/analytics/regional-performance', isAuthenticated, async (req, res) => {
    try {
      const performance = await storage.getRegionalPerformance();
      res.json(performance);
    } catch (error) {
      console.error("Error fetching regional performance:", error);
      res.status(500).json({ message: "Failed to fetch regional performance" });
    }
  });

  app.get('/api/analytics/vendor-performance', isAuthenticated, async (req, res) => {
    try {
      const performance = await storage.getVendorPerformance();
      res.json(performance);
    } catch (error) {
      console.error("Error fetching vendor performance:", error);
      res.status(500).json({ message: "Failed to fetch vendor performance" });
    }
  });

  // Alerts routes
  app.get('/api/alerts', isAuthenticated, async (req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post('/api/alerts/:id/acknowledge', isAuthenticated, async (req: any, res) => {
    try {
      const alert = await storage.acknowledgeAlert(req.params.id, req.user.claims.sub);
      res.json(alert);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  app.post('/api/alerts/:id/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const alert = await storage.resolveAlert(req.params.id, req.user.claims.sub);
      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  app.get('/api/alerts/summary', isAuthenticated, async (req, res) => {
    try {
      const summary = await alertService.getAlertsSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching alerts summary:", error);
      res.status(500).json({ message: "Failed to fetch alerts summary" });
    }
  });

  // Weather routes
  app.get('/api/weather', isAuthenticated, async (req, res) => {
    try {
      const weatherData = await storage.getLatestWeatherData();
      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  app.get('/api/weather/alerts', isAuthenticated, async (req, res) => {
    try {
      const alerts = await weatherService.getWeatherAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching weather alerts:", error);
      res.status(500).json({ message: "Failed to fetch weather alerts" });
    }
  });

  app.get('/api/weather/devices-at-risk', isAuthenticated, async (req, res) => {
    try {
      const devicesAtRisk = await weatherService.getDevicesAtRisk();
      res.json(devicesAtRisk);
    } catch (error) {
      console.error("Error fetching devices at risk:", error);
      res.status(500).json({ message: "Failed to fetch devices at risk" });
    }
  });

  // AI Assistant routes
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { query, sessionId } = req.body;
      const result = await aiService.processQuery(req.user.claims.sub, query, sessionId);
      res.json(result);
    } catch (error) {
      console.error("Error processing AI query:", error);
      res.status(500).json({ message: "Failed to process query" });
    }
  });

  app.get('/api/ai/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const sessions = await storage.getUserChatSessions(req.user.claims.sub);
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
