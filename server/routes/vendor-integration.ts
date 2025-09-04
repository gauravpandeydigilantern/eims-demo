import { Router } from 'express';
import { storage } from '../storage';
import { isAuthenticated, hasAdminAccess } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Vendor configuration schema
const vendorConfigSchema = z.object({
  name: z.string(),
  type: z.enum(['NEC', 'NCR', 'Wincor', 'Diebold', 'Ingenico', 'Other']),
  apiEndpoint: z.string().url(),
  authentication: z.object({
    type: z.enum(['basic', 'bearer', 'api_key', 'oauth2']),
    credentials: z.record(z.string()),
  }),
  polling_interval: z.number().min(5).max(3600), // 5 seconds to 1 hour
  enabled: z.boolean().default(true),
  region: z.string().optional(),
});

const deviceSyncSchema = z.object({
  vendorId: z.string(),
  deviceIds: z.array(z.string()).optional(),
  syncType: z.enum(['full', 'incremental', 'status_only']).default('incremental'),
});

// Get all vendor configurations
router.get('/vendors', isAuthenticated, hasAdminAccess, async (req: any, res) => {
  try {
    const vendors = await storage.getVendorConfigurations();
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendor configurations:', error);
    res.status(500).json({ message: 'Failed to fetch vendor configurations' });
  }
});

// Get vendor configuration by ID
router.get('/vendors/:id', isAuthenticated, hasAdminAccess, async (req: any, res) => {
  try {
    const vendorId = req.params.id;
    const vendor = await storage.getVendorConfiguration(vendorId);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor configuration not found' });
    }
    
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor configuration:', error);
    res.status(500).json({ message: 'Failed to fetch vendor configuration' });
  }
});

// Create new vendor configuration
router.post('/vendors', isAuthenticated, hasAdminAccess, async (req: any, res) => {
  try {
    const vendorConfig = vendorConfigSchema.parse(req.body);
    const newVendor = await storage.createVendorConfiguration(vendorConfig);
    
    // Log admin action
    await storage.logAdminAction({
      adminId: req.user.id,
      action: 'create_vendor_config',
      targetId: newVendor.id,
      details: { vendorName: vendorConfig.name, vendorType: vendorConfig.type },
      timestamp: new Date(),
    });
    
    res.status(201).json(newVendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating vendor configuration:', error);
    res.status(500).json({ message: 'Failed to create vendor configuration' });
  }
});

// Update vendor configuration
router.put('/vendors/:id', isAuthenticated, hasAdminAccess, async (req: any, res) => {
  try {
    const vendorId = req.params.id;
    const updates = vendorConfigSchema.partial().parse(req.body);
    
    const updatedVendor = await storage.updateVendorConfiguration(vendorId, updates);
    
    if (!updatedVendor) {
      return res.status(404).json({ message: 'Vendor configuration not found' });
    }
    
    // Log admin action
    await storage.logAdminAction({
      adminId: req.user.id,
      action: 'update_vendor_config',
      targetId: vendorId,
      details: { updates },
      timestamp: new Date(),
    });
    
    res.json(updatedVendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating vendor configuration:', error);
    res.status(500).json({ message: 'Failed to update vendor configuration' });
  }
});

// Delete vendor configuration
router.delete('/vendors/:id', isAuthenticated, hasAdminAccess, async (req: any, res) => {
  try {
    const vendorId = req.params.id;
    const deleted = await storage.deleteVendorConfiguration(vendorId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Vendor configuration not found' });
    }
    
    // Log admin action
    await storage.logAdminAction({
      adminId: req.user.id,
      action: 'delete_vendor_config',
      targetId: vendorId,
      details: {},
      timestamp: new Date(),
    });
    
    res.json({ message: 'Vendor configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor configuration:', error);
    res.status(500).json({ message: 'Failed to delete vendor configuration' });
  }
});

// Test vendor connection
router.post('/vendors/:id/test', isAuthenticated, hasAdminAccess, async (req: any, res) => {
  try {
    const vendorId = req.params.id;
    const vendor = await storage.getVendorConfiguration(vendorId);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor configuration not found' });
    }
    
    const testResult = await testVendorConnection(vendor);
    
    // Log the test attempt
    await storage.logVendorActivity({
      vendorId,
      activity: 'connection_test',
      status: testResult.success ? 'success' : 'failed',
      details: testResult,
      timestamp: new Date(),
    });
    
    res.json(testResult);
  } catch (error) {
    console.error('Error testing vendor connection:', error);
    res.status(500).json({ message: 'Failed to test vendor connection' });
  }
});

// Sync devices from vendor
router.post('/vendors/:id/sync', isAuthenticated, hasAdminAccess, async (req: any, res) => {
  try {
    const vendorId = req.params.id;
    const syncConfig = deviceSyncSchema.parse(req.body);
    
    const vendor = await storage.getVendorConfiguration(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor configuration not found' });
    }
    
    if (!vendor.enabled) {
      return res.status(400).json({ message: 'Vendor integration is disabled' });
    }
    
    const syncResult = await syncDevicesFromVendor(vendor, syncConfig);
    
    // Log the sync activity
    await storage.logVendorActivity({
      vendorId,
      activity: 'device_sync',
      status: syncResult.success ? 'success' : 'failed',
      details: syncResult,
      timestamp: new Date(),
    });
    
    res.json(syncResult);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error syncing devices from vendor:', error);
    res.status(500).json({ message: 'Failed to sync devices from vendor' });
  }
});

// Get vendor sync status and statistics
router.get('/vendors/:id/status', isAuthenticated, hasAdminAccess, async (req: any, res) => {
  try {
    const vendorId = req.params.id;
    const status = await storage.getVendorSyncStatus(vendorId);
    
    if (!status) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    res.json(status);
  } catch (error) {
    console.error('Error fetching vendor status:', error);
    res.status(500).json({ message: 'Failed to fetch vendor status' });
  }
});

// Get vendor activity logs
router.get('/vendors/:id/activity', isAuthenticated, hasAdminAccess, async (req: any, res) => {
  try {
    const vendorId = req.params.id;
    const { page = 1, limit = 50 } = req.query;
    
    const activity = await storage.getVendorActivity(vendorId, {
      page: Number(page),
      limit: Number(limit),
    });
    
    res.json(activity);
  } catch (error) {
    console.error('Error fetching vendor activity:', error);
    res.status(500).json({ message: 'Failed to fetch vendor activity' });
  }
});

// Get integration overview statistics
router.get('/overview', isAuthenticated, hasAdminAccess, async (req: any, res) => {
  try {
    const overview = await storage.getVendorIntegrationOverview();
    res.json(overview);
  } catch (error) {
    console.error('Error fetching integration overview:', error);
    res.status(500).json({ message: 'Failed to fetch integration overview' });
  }
});

// Sync all enabled vendors
router.post('/sync-all', isAuthenticated, hasAdminAccess, async (req: any, res) => {
  try {
    const { syncType = 'incremental' } = req.body;
    const vendors = await storage.getVendorConfigurations();
    const enabledVendors = vendors.filter(v => v.enabled);
    
    const results = [];
    for (const vendor of enabledVendors) {
      try {
        const syncResult = await syncDevicesFromVendor(vendor, { 
          vendorId: vendor.id,
          syncType 
        });
        
        results.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          success: syncResult.success,
          ...syncResult
        });
        
        // Log the sync activity
        await storage.logVendorActivity({
          vendorId: vendor.id,
          activity: 'bulk_sync',
          status: syncResult.success ? 'success' : 'failed',
          details: syncResult,
          timestamp: new Date(),
        });
      } catch (error) {
        results.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const summary = {
      totalVendors: enabledVendors.length,
      successfulSyncs: results.filter(r => r.success).length,
      failedSyncs: results.filter(r => !r.success).length,
      results
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error during bulk vendor sync:', error);
    res.status(500).json({ message: 'Failed to sync vendors' });
  }
});

// Vendor-specific device management
router.get('/vendors/:id/devices', isAuthenticated, async (req: any, res) => {
  try {
    const vendorId = req.params.id;
    const { page = 1, limit = 100 } = req.query;
    
    const devices = await storage.getDevicesByVendor(vendorId, {
      page: Number(page),
      limit: Number(limit),
    });
    
    res.json(devices);
  } catch (error) {
    console.error('Error fetching vendor devices:', error);
    res.status(500).json({ message: 'Failed to fetch vendor devices' });
  }
});

// Core vendor integration functions
async function testVendorConnection(vendor: any): Promise<any> {
  try {
    const { apiEndpoint, authentication } = vendor;
    
    // Create request headers based on authentication type
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'EIMS-Integration/1.0',
    };
    
    switch (authentication.type) {
      case 'basic':
        const basicAuth = Buffer.from(`${authentication.credentials.username}:${authentication.credentials.password}`).toString('base64');
        headers['Authorization'] = `Basic ${basicAuth}`;
        break;
      case 'bearer':
        headers['Authorization'] = `Bearer ${authentication.credentials.token}`;
        break;
      case 'api_key':
        headers[authentication.credentials.header || 'X-API-Key'] = authentication.credentials.key;
        break;
      case 'oauth2':
        headers['Authorization'] = `Bearer ${authentication.credentials.access_token}`;
        break;
    }
    
    // Test endpoint (usually a health check or status endpoint)
    const testEndpoint = `${apiEndpoint}/health` || `${apiEndpoint}/status`;
    
    const startTime = Date.now();
    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      timestamp: new Date(),
      details: {
        endpoint: testEndpoint,
        headers: Object.keys(headers),
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

async function syncDevicesFromVendor(vendor: any, syncConfig: any): Promise<any> {
  try {
    const { apiEndpoint, authentication } = vendor;
    const { syncType, deviceIds } = syncConfig;
    
    // Create request headers
    const headers = await buildAuthHeaders(authentication);
    
    // Determine sync endpoint based on type
    let syncEndpoint = `${apiEndpoint}/devices`;
    if (syncType === 'status_only') {
      syncEndpoint = `${apiEndpoint}/devices/status`;
    } else if (deviceIds && deviceIds.length > 0) {
      syncEndpoint = `${apiEndpoint}/devices?ids=${deviceIds.join(',')}`;
    }
    
    const startTime = Date.now();
    const response = await fetch(syncEndpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(30000), // 30 second timeout for data sync
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    // Process and store the synchronized data
    const processed = await processVendorDeviceData(vendor, data, syncType);
    
    return {
      success: true,
      syncType,
      responseTime,
      devicesProcessed: processed.devicesProcessed,
      devicesUpdated: processed.devicesUpdated,
      devicesCreated: processed.devicesCreated,
      errors: processed.errors,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

async function buildAuthHeaders(authentication: any): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'EIMS-Integration/1.0',
  };
  
  switch (authentication.type) {
    case 'basic':
      const basicAuth = Buffer.from(`${authentication.credentials.username}:${authentication.credentials.password}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
      break;
    case 'bearer':
      headers['Authorization'] = `Bearer ${authentication.credentials.token}`;
      break;
    case 'api_key':
      headers[authentication.credentials.header || 'X-API-Key'] = authentication.credentials.key;
      break;
    case 'oauth2':
      headers['Authorization'] = `Bearer ${authentication.credentials.access_token}`;
      break;
  }
  
  return headers;
}

async function processVendorDeviceData(vendor: any, data: any, syncType: string): Promise<any> {
  let devicesProcessed = 0;
  let devicesUpdated = 0;
  let devicesCreated = 0;
  const errors: string[] = [];
  
  try {
    const devices = Array.isArray(data) ? data : data.devices || [];
    
    for (const deviceData of devices) {
      try {
        devicesProcessed++;
        
        // Normalize device data to EIMS format
        const normalizedDevice = normalizeDeviceData(vendor, deviceData);
        
        // Check if device exists
        const existingDevice = await storage.getDeviceByVendorId(vendor.id, normalizedDevice.vendorDeviceId);
        
        if (existingDevice) {
          // Update existing device
          if (syncType !== 'status_only') {
            await storage.updateDeviceFromVendor(existingDevice.id, normalizedDevice);
          } else {
            await storage.updateDeviceStatus(existingDevice.id, normalizedDevice.status);
          }
          devicesUpdated++;
        } else if (syncType === 'full') {
          // Create new device (only in full sync mode)
          await storage.createDeviceFromVendor(normalizedDevice);
          devicesCreated++;
        }
      } catch (error) {
        errors.push(`Device ${deviceData.id || 'unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return {
    devicesProcessed,
    devicesUpdated,
    devicesCreated,
    errors,
  };
}

function normalizeDeviceData(vendor: any, deviceData: any): any {
  // This function converts vendor-specific device data to EIMS format
  // Each vendor might have different field names and structures
  
  const baseDevice = {
    vendorId: vendor.id,
    vendorDeviceId: deviceData.id || deviceData.deviceId || deviceData.serial,
    type: deviceData.type || deviceData.deviceType || 'Unknown',
    status: mapVendorStatus(deviceData.status || deviceData.state),
    location: deviceData.location || deviceData.site || '',
    ip: deviceData.ip || deviceData.ipAddress || '',
    lastSeen: deviceData.lastSeen || deviceData.lastHeartbeat || new Date(),
    metadata: {
      vendor: vendor.name,
      originalData: deviceData,
      syncedAt: new Date(),
    }
  };
  
  // Vendor-specific mappings
  switch (vendor.type) {
    case 'NEC':
      return {
        ...baseDevice,
        model: deviceData.model || deviceData.productName,
        version: deviceData.firmwareVersion || deviceData.version,
        serialNumber: deviceData.serialNumber || deviceData.serial,
      };
    case 'NCR':
      return {
        ...baseDevice,
        model: deviceData.terminalModel || deviceData.model,
        version: deviceData.softwareVersion || deviceData.version,
        serialNumber: deviceData.terminalSerial || deviceData.serial,
      };
    case 'Wincor':
      return {
        ...baseDevice,
        model: deviceData.machineType || deviceData.model,
        version: deviceData.swVersion || deviceData.version,
        serialNumber: deviceData.machineSerial || deviceData.serial,
      };
    default:
      return baseDevice;
  }
}

function mapVendorStatus(vendorStatus: string): string {
  // Normalize different vendor status values to EIMS standard
  const statusMap: Record<string, string> = {
    // Common mappings
    'online': 'LIVE',
    'offline': 'DOWN',
    'active': 'LIVE',
    'inactive': 'DOWN',
    'running': 'LIVE',
    'stopped': 'DOWN',
    'error': 'DOWN',
    'warning': 'WARNING',
    'maintenance': 'MAINTENANCE',
    'service': 'MAINTENANCE',
    
    // NEC specific
    'operational': 'LIVE',
    'fault': 'DOWN',
    'diagnostic': 'WARNING',
    
    // NCR specific
    'in_service': 'LIVE',
    'out_of_service': 'DOWN',
    'supervisor': 'WARNING',
    
    // Wincor specific
    'ready': 'LIVE',
    'busy': 'LIVE',
    'failed': 'DOWN',
    'unknown': 'WARNING',
  };
  
  const normalized = vendorStatus?.toLowerCase();
  return statusMap[normalized] || 'WARNING';
}

export default router;
