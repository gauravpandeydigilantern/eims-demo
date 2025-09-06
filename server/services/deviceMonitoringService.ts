import { storage } from "../storage";
import { AlertService } from "./alertService";

/**
 * Critical Device Monitoring Service
 * Implements 30-minute threshold monitoring as specified in Workflow 1
 * 
 * Status Logic:
 * - LIVE: Data received within 30 minutes
 * - WARNING: No data for 30-60 minutes  
 * - DOWN: No data for 60+ minutes
 * - MAINTENANCE/SHUTDOWN: Manual overrides
 */
export class DeviceMonitoringService {
  private alertService: AlertService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL_MS = 30 * 1000; // 30 seconds
  private readonly LIVE_THRESHOLD_MINUTES = 30;
  private readonly WARNING_THRESHOLD_MINUTES = 60;
  private readonly DOWN_THRESHOLD_MINUTES = 120;

  constructor() {
    this.alertService = new AlertService();
  }

  /**
   * Start the monitoring service
   */
  start(): void {
    console.log("🔄 Starting Device Monitoring Service with 30-minute threshold logic");
    
    // Run initial check
    this.performMonitoringCheck();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCheck();
    }, this.MONITORING_INTERVAL_MS);
  }

  /**
   * Stop the monitoring service
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log("⏹️ Device Monitoring Service stopped");
    }
  }

  /**
   * Core monitoring logic - checks all devices and updates statuses
   */
  private async performMonitoringCheck(): Promise<void> {
    try {
      const devices = await storage.getAllDevices();
      const now = new Date();
      let statusChanges = 0;

      for (const device of devices) {
        // Skip devices in manual override status (MAINTENANCE, SHUTDOWN)
        if (device.status === 'MAINTENANCE' || device.status === 'SHUTDOWN') {
          continue;
        }

        const newStatus = this.calculateDeviceStatus(device.lastTransaction, now);
        const newSubStatus = this.calculateSubStatus(device.lastTransaction, now);

        // Update device if status changed
        if (device.status !== newStatus || device.subStatus !== newSubStatus) {
          await storage.updateDevice(device.id, {
            status: newStatus,
            subStatus: newSubStatus,
          });

          // Generate alert for status degradation
          if (this.shouldGenerateAlert(device.status, newStatus)) {
            await this.generateStatusAlert(device, newStatus);
          }

          statusChanges++;
        }
      }

      if (statusChanges > 0) {
        console.log(`📊 Device Monitoring: Updated ${statusChanges} device status(es)`);
      }

    } catch (error) {
      console.error("❌ Error in device monitoring check:", error);
    }
  }

  /**
   * Calculate device status based on last transaction time
   */
  private calculateDeviceStatus(lastTransaction: Date | null, now: Date): "LIVE" | "WARNING" | "DOWN" {
    if (!lastTransaction) {
      return 'DOWN';
    }

    const minutesSinceLastTransaction = (now.getTime() - lastTransaction.getTime()) / (1000 * 60);

    if (minutesSinceLastTransaction <= this.LIVE_THRESHOLD_MINUTES) {
      return 'LIVE';
    } else if (minutesSinceLastTransaction <= this.WARNING_THRESHOLD_MINUTES) {
      return 'WARNING';
    } else {
      return 'DOWN';
    }
  }

  /**
   * Calculate sub-status for LIVE devices (Active/Standby)
   */
  private calculateSubStatus(lastTransaction: Date | null, now: Date): string | null {
    if (!lastTransaction) {
      return null;
    }

    const minutesSinceLastTransaction = (now.getTime() - lastTransaction.getTime()) / (1000 * 60);

    if (minutesSinceLastTransaction <= this.LIVE_THRESHOLD_MINUTES) {
      // Active if recent transaction (within 10 minutes), otherwise Standby
      return minutesSinceLastTransaction <= 10 ? 'active' : 'standby';
    }

    return null;
  }

  /**
   * Determine if we should generate an alert for status change
   */
  private shouldGenerateAlert(oldStatus: string, newStatus: string): boolean {
    // Alert on status degradation
    const statusPriority = {
      'LIVE': 3,
      'WARNING': 2, 
      'DOWN': 1,
      'MAINTENANCE': 0,
      'SHUTDOWN': 0
    };

    const oldPriority = statusPriority[oldStatus as keyof typeof statusPriority] || 0;
    const newPriority = statusPriority[newStatus as keyof typeof statusPriority] || 0;

    return newPriority < oldPriority;
  }

  /**
   * Generate appropriate alert for status change
   */
  private async generateStatusAlert(device: any, newStatus: string): Promise<void> {
    try {
      let alertType: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO';
      let category: 'DEVICE_OFFLINE' | 'PERFORMANCE' = 'PERFORMANCE';
      let title = '';
      let message = '';

      switch (newStatus) {
        case 'WARNING':
          alertType = 'WARNING';
          category = 'PERFORMANCE';
          title = `Device Communication Warning`;
          message = `Device ${device.id} at ${device.tollPlaza} has not transmitted data for 30+ minutes. Status changed to WARNING.`;
          break;

        case 'DOWN':
          alertType = 'CRITICAL';
          category = 'DEVICE_OFFLINE';
          title = `Device Offline`;
          message = `Device ${device.id} at ${device.tollPlaza} has been offline for 60+ minutes. Immediate attention required.`;
          break;
      }

      if (title && message) {
        await this.alertService.createDeviceAlert(
          device.id,
          alertType,
          category,
          title,
          message,
          {
            previousStatus: device.status,
            newStatus,
            lastTransaction: device.lastTransaction,
            autoGenerated: true,
            monitoringServiceAlert: true
          }
        );

        // console.log(`🚨 Generated ${alertType} alert for device ${device.id}: ${title}`);
      }

    } catch (error) {
      console.error(`❌ Error generating alert for device ${device.id}:`, error);
    }
  }

  /**
   * Manually override device status (for MAINTENANCE/SHUTDOWN)
   */
  async setDeviceMaintenanceMode(deviceId: string, userId: string, reason?: string): Promise<void> {
    await storage.updateDevice(deviceId, {
      status: 'MAINTENANCE',
      subStatus: 'manual_override',
    });

    await this.alertService.createDeviceAlert(
      deviceId,
      'INFO',
      'MAINTENANCE',
      'Device Set to Maintenance Mode',
      `Device has been manually set to maintenance mode. ${reason || ''}`,
      {
        userId,
        reason,
        timestamp: new Date().toISOString(),
        manualOverride: true
      }
    );
  }

  /**
   * Manually set device to shutdown status
   */
  async setDeviceShutdown(deviceId: string, userId: string, reason?: string): Promise<void> {
    await storage.updateDevice(deviceId, {
      status: 'SHUTDOWN',
      subStatus: 'site_shutdown',
    });

    await this.alertService.createDeviceAlert(
      deviceId,
      'WARNING',
      'MAINTENANCE',
      'Device Site Shutdown',
      `Device site has been shut down due to external factors. ${reason || ''}`,
      {
        userId,
        reason,
        timestamp: new Date().toISOString(),
        siteShutdown: true
      }
    );
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats(): Promise<{
    totalDevices: number;
    liveDevices: number;
    warningDevices: number;
    downDevices: number;
    maintenanceDevices: number;
    shutdownDevices: number;
    lastCheckTime: Date;
  }> {
    const devices = await storage.getAllDevices();
    
    return {
      totalDevices: devices.length,
      liveDevices: devices.filter(d => d.status === 'LIVE').length,
      warningDevices: devices.filter(d => d.status === 'WARNING').length,
      downDevices: devices.filter(d => d.status === 'DOWN').length,
      maintenanceDevices: devices.filter(d => d.status === 'MAINTENANCE').length,
      shutdownDevices: devices.filter(d => d.status === 'SHUTDOWN').length,
      lastCheckTime: new Date()
    };
  }
}

// Export singleton instance
export const deviceMonitoringService = new DeviceMonitoringService();