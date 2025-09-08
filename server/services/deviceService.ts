import { storage } from "../storage";
import type { Device, DeviceMetrics, InsertDeviceOperation } from "@shared/schema";

export class DeviceService {
  async executeDeviceOperation(
    deviceId: string,
    operation: string,
    userId: string,
    parameters: Record<string, any> = {}
  ): Promise<{ success: boolean; message: string; operationId: string }> {
    // Create operation record
    const deviceOperation = await storage.createDeviceOperation({
      deviceId,
      userId,
      operation,
      status: 'PENDING',
      parameters,
    });

    try {
      let result = '';
      let success = true;

      switch (operation) {
        case 'RESET_FULL':
          result = await this.performFullReboot(deviceId);
          break;
        case 'RESET_SERVICE':
          result = await this.performServiceRestart(deviceId);
          break;
        case 'CONFIG_REFRESH':
          result = await this.performConfigRefresh(deviceId);
          break;
        case 'DIAGNOSTICS':
          result = await this.runDiagnostics(deviceId);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      // Update operation status
      await storage.updateDeviceOperation(deviceOperation.id, {
        status: 'SUCCESS',
        result,
        completedAt: new Date(),
      });

      // Update device last seen
      await storage.updateDevice(deviceId, {
        lastSeen: new Date(),
      });

      return {
        success: true,
        message: result,
        operationId: deviceOperation.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Operation failed';
      
      await storage.updateDeviceOperation(deviceOperation.id, {
        status: 'FAILED',
        errorMessage,
        completedAt: new Date(),
      });

      return {
        success: false,
        message: errorMessage,
        operationId: deviceOperation.id,
      };
    }
  }

  private async performFullReboot(deviceId: string): Promise<string> {
    // Simulate device reboot - in real implementation, this would call device API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update device status
    await storage.updateDevice(deviceId, {
      status: 'LIVE',
      lastSeen: new Date(),
    });

    return 'Device successfully rebooted and is now online';
  }

  private async performServiceRestart(deviceId: string): Promise<string> {
    // Simulate service restart
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await storage.updateDevice(deviceId, {
      lastSeen: new Date(),
    });

    return 'RFID services restarted successfully';
  }

  private async performConfigRefresh(deviceId: string): Promise<string> {
    // Simulate config refresh
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await storage.updateDevice(deviceId, {
      lastSeen: new Date(),
    });

    return 'Device configuration refreshed successfully';
  }

  private async runDiagnostics(deviceId: string): Promise<string> {
    // Simulate diagnostics
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return 'Diagnostics completed - all systems operational';
  }

  async getDeviceWithMetrics(deviceId: string): Promise<{
    device: Device | undefined;
    metrics: DeviceMetrics | undefined;
    recentAlerts: any[];
  }> {
    const device = await storage.getDeviceById(deviceId);
    const metrics = await storage.getLatestDeviceMetrics(deviceId);
    const recentAlerts = await storage.getAlertsByDevice(deviceId);

    return {
      device,
      metrics,
      recentAlerts: recentAlerts.slice(0, 5), // Last 5 alerts
    };
  }

  async updateDeviceStatus(deviceId: string, status: string, metrics?: Partial<DeviceMetrics>): Promise<void> {
    await storage.updateDevice(deviceId, {
      status: status as any,
      lastSeen: new Date(),
    });

    if (metrics) {
      await storage.recordDeviceMetrics({
        deviceId,
        ...metrics,
      });
    }
  }

  async touchDevice(deviceId: string): Promise<void> {
    await storage.updateDevice(deviceId, {
      lastTransaction: new Date(),
    });
  }
}

export const deviceService = new DeviceService();
