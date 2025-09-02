import { storage } from "../storage";
import { alertService } from "./alertService";
import type { InsertWeatherData } from "@shared/schema";

export class WeatherService {
  private weatherApiKey = process.env.WEATHER_API_KEY || process.env.OPENWEATHER_API_KEY || "default_key";

  async updateWeatherData(): Promise<void> {
    const regions = [
      { name: 'Mumbai', city: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      { name: 'Delhi', city: 'Delhi', lat: 28.7041, lon: 77.1025 },
      { name: 'Bangalore', city: 'Bangalore', lat: 12.9716, lon: 77.5946 },
      { name: 'Chennai', city: 'Chennai', lat: 13.0827, lon: 80.2707 },
      { name: 'Kolkata', city: 'Kolkata', lat: 22.5726, lon: 88.3639 },
      { name: 'Hyderabad', city: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
    ];

    for (const region of regions) {
      try {
        const weatherData = await this.fetchWeatherData(region.lat, region.lon);
        const processedData = this.processWeatherData(region.name, region.city, weatherData);
        
        await storage.updateWeatherData(processedData);
        
        // Check for weather alerts
        if (processedData.alerts && Array.isArray(processedData.alerts) && processedData.alerts.length > 0) {
          await alertService.processWeatherAlert(region.name, processedData);
        }
      } catch (error) {
        console.error(`Failed to update weather for ${region.name}:`, error);
      }
    }
  }

  private async fetchWeatherData(lat: number, lon: number): Promise<any> {
    // In a real implementation, this would call OpenWeatherMap API
    // For now, return simulated weather data
    return this.generateSimulatedWeatherData(lat, lon);
  }

  private generateSimulatedWeatherData(lat: number, lon: number): any {
    const conditions = ['sunny', 'cloudy', 'rainy', 'thunderstorm', 'clear'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    const baseTemp = lat > 20 ? 30 : 25; // Warmer in southern regions
    const temperature = baseTemp + (Math.random() * 10 - 5);
    
    const alerts = [];
    
    // Generate weather alerts based on conditions
    if (randomCondition === 'thunderstorm') {
      alerts.push({
        type: 'Thunderstorm',
        severity: 'high',
        description: 'Severe thunderstorm warning with heavy rainfall and strong winds',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      });
    }
    
    if (randomCondition === 'rainy') {
      alerts.push({
        type: 'Heavy Rain',
        severity: 'medium',
        description: 'Heavy rainfall expected, potential for flooding in low-lying areas',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      });
    }
    
    if (temperature > 40) {
      alerts.push({
        type: 'Heat Wave',
        severity: 'high',
        description: 'Extreme heat warning - temperatures above 40°C',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return {
      current: {
        temp: temperature,
        humidity: 60 + Math.random() * 30,
        condition: randomCondition,
        wind_speed: Math.random() * 20,
        precipitation: randomCondition === 'rainy' ? Math.random() * 50 : 0,
      },
      alerts,
    };
  }

  private processWeatherData(region: string, city: string, rawData: any): InsertWeatherData {
    return {
      region,
      city,
      temperature: rawData.current.temp.toString(),
      humidity: Math.round(rawData.current.humidity),
      condition: rawData.current.condition,
      windSpeed: rawData.current.wind_speed.toString(),
      precipitation: rawData.current.precipitation.toString(),
      alerts: rawData.alerts || [],
    };
  }

  async getWeatherAlerts(): Promise<any[]> {
    const weatherData = await storage.getLatestWeatherData();
    const alerts = [];

    for (const data of weatherData) {
      if (data.alerts && Array.isArray(data.alerts)) {
        for (const alert of data.alerts) {
          alerts.push({
            ...alert,
            region: data.region,
            city: data.city,
          });
        }
      }
    }

    return alerts;
  }

  async getDevicesAtRisk(): Promise<{
    region: string;
    devicesAtRisk: number;
    protectionActivated: number;
    alertsGenerated: number;
  }[]> {
    const weatherData = await storage.getLatestWeatherData();
    const results = [];

    for (const weather of weatherData) {
      const regionDevices = await storage.getDevicesByRegion(weather.region);
      let devicesAtRisk = 0;
      let protectionActivated = 0;

      // Calculate risk based on weather conditions
      if (weather.alerts && Array.isArray(weather.alerts) && weather.alerts.length > 0) {
        const highSeverityAlerts = weather.alerts.filter(a => a.severity === 'high');
        if (highSeverityAlerts.length > 0) {
          devicesAtRisk = Math.floor(regionDevices.length * 0.3); // 30% at risk
          protectionActivated = Math.floor(devicesAtRisk * 0.7); // 70% protection activated
        } else {
          devicesAtRisk = Math.floor(regionDevices.length * 0.1); // 10% at risk
          protectionActivated = Math.floor(devicesAtRisk * 0.8); // 80% protection activated
        }
      }

      results.push({
        region: weather.region,
        devicesAtRisk,
        protectionActivated,
        alertsGenerated: weather.alerts ? weather.alerts.length : 0,
      });
    }

    return results;
  }
}

export const weatherService = new WeatherService();
