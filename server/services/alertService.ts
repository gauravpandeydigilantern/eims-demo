import { storage } from "../storage";
import type { InsertAlert, Alert } from "@shared/schema";

export class AlertService {
  async createDeviceAlert(
    deviceId: string,
    type: 'CRITICAL' | 'WARNING' | 'INFO',
    category: string,
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): Promise<Alert> {
    const alert = await storage.createAlert({
      deviceId,
      type,
      category: category as any,
      title,
      message,
      metadata,
    });

    // In a real implementation, this would trigger notifications
    // via WebSocket, email, SMS, etc.
    this.triggerAlertNotifications(alert);

    return alert;
  }

  async createSystemAlert(
    type: 'CRITICAL' | 'WARNING' | 'INFO',
    category: string,
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): Promise<Alert> {
    const alert = await storage.createAlert({
      type,
      category: category as any,
      title,
      message,
      metadata,
    });

    this.triggerAlertNotifications(alert);
    return alert;
  }

  async processDeviceMetrics(deviceId: string, metrics: any): Promise<void> {
    // Check for alert conditions
    if (metrics.cpuUsage > 90) {
      await this.createDeviceAlert(
        deviceId,
        'WARNING',
        'PERFORMANCE',
        'High CPU Usage',
        `Device CPU usage is at ${metrics.cpuUsage}%`,
        { cpuUsage: metrics.cpuUsage }
      );
    }

    if (metrics.temperature > 80) {
      await this.createDeviceAlert(
        deviceId,
        'CRITICAL',
        'PERFORMANCE',
        'High Temperature',
        `Device temperature is ${metrics.temperature}°C`,
        { temperature: metrics.temperature }
      );
    }

    if (!metrics.networkStatus) {
      await this.createDeviceAlert(
        deviceId,
        'CRITICAL',
        'DEVICE_OFFLINE',
        'Network Connection Lost',
        'Device has lost network connectivity',
        { networkStatus: false }
      );
    }
  }

  async checkDeviceOffline(deviceId: string, lastSeen: Date): Promise<void> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    if (lastSeen < thirtyMinutesAgo) {
      await this.createDeviceAlert(
        deviceId,
        'CRITICAL',
        'DEVICE_OFFLINE',
        'Device Offline',
        `Device has been offline for more than 30 minutes. Last seen: ${lastSeen.toISOString()}`,
        { lastSeen: lastSeen.toISOString(), offlineDuration: Date.now() - lastSeen.getTime() }
      );
    }
  }

  async processWeatherAlert(region: string, weatherData: any): Promise<void> {
    if (weatherData.alerts && weatherData.alerts.length > 0) {
      for (const alert of weatherData.alerts) {
        await this.createSystemAlert(
          alert.severity === 'high' ? 'CRITICAL' : 'WARNING',
          'WEATHER',
          `Weather Alert: ${alert.type}`,
          `${alert.description} in ${region}`,
          { region, weatherAlert: alert }
        );
      }
    }
  }

  private triggerAlertNotifications(alert: Alert): void {
    // In a real implementation, this would:
    // 1. Send WebSocket notifications to connected clients
    // 2. Send email notifications based on alert severity
    // 3. Send SMS for critical alerts
    // 4. Update external monitoring systems
    console.log(`Alert triggered: ${alert.type} - ${alert.title}`);
  }

  async getAlertsSummary(): Promise<{
    total: number;
    critical: number;
    warning: number;
    info: number;
    unread: number;
  }> {
    const alerts = await storage.getActiveAlerts();
    
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.type === 'CRITICAL').length,
      warning: alerts.filter(a => a.type === 'WARNING').length,
      info: alerts.filter(a => a.type === 'INFO').length,
      unread: alerts.filter(a => !a.isRead).length,
    };
  }
}

export const alertService = new AlertService();
