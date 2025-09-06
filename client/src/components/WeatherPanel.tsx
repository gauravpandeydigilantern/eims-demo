import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BarChart3, MapPin } from "lucide-react";

// Lazy load the Button component as a fallback
const LazyButton = lazy(() => import("@/components/ui/button").then(module => ({ default: module.Button })));

// Safe Button component that falls back if import fails
const SafeButton = ({ children, ...props }: any) => {
  try {
    return Button ? <Button {...props}>{children}</Button> : <LazyButton {...props}>{children}</LazyButton>;
  } catch (error) {
    console.warn('Button component failed to load:', error);
    return <button {...props} className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium ${props.className || ''}`}>{children}</button>;
  }
};

export default function WeatherPanel() {
  const { data: weatherData, isLoading } = useQuery<any>({
    queryKey: ["/api/weather"],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const { data: weatherAlerts } = useQuery<any>({
    queryKey: ["/api/weather/alerts"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: devicesAtRisk } = useQuery<any>({
    queryKey: ["/api/weather/devices-at-risk"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery<any>({
    queryKey: ["/api/analytics/comprehensive"],
    refetchInterval: 5 * 60 * 1000,
  });

  const getWeatherIcon = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'rainy':
      case 'thunderstorm':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
          </svg>
        );
      case 'cloudy':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        );
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'medium':
        return 'bg-warning/10 border-warning/20 text-warning';
      case 'low':
        return 'bg-info/10 border-info/20 text-info';
      default:
        return 'bg-muted/10 border-muted/20 text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Debug analytics data
  console.log('Analytics Data:', analyticsData);
  console.log('Analytics Loading:', analyticsLoading);
  console.log('Analytics Error:', analyticsError);

  const latestWeatherData = Array.isArray(weatherData) ? weatherData.slice(0, 6) : [];
  const activeWeatherAlerts = Array.isArray(weatherAlerts) ? weatherAlerts.slice(0, 3) : [];

  return (
    <div className="space-y-6">
         {/* Regional Performance and Vendor Performance in same row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Regional Performance
                </CardTitle>
                <CardDescription>Performance metrics by geographic region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'West', devices: 1845, uptime: 99.2, alerts: 12, performance: 96.8 },
                    { name: 'North', devices: 1234, uptime: 98.8, alerts: 8, performance: 95.4 },
                    { name: 'South', devices: 1567, uptime: 99.5, alerts: 5, performance: 97.2 },
                    { name: 'East', devices: 474, uptime: 97.9, alerts: 15, performance: 94.1 }
                  ].map((region) => (
                    <div key={region.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{region.name}</div>
                        <div className="text-sm text-muted-foreground">{region.devices} devices</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{region.uptime}%</div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{region.performance}%</div>
                        <div className="text-sm text-muted-foreground">Performance</div>
                      </div>
                      <Badge variant={region.alerts < 10 ? "default" : "destructive"}>
                        {region.alerts} alerts
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Vendor Performance
                </CardTitle>
                <CardDescription>Performance comparison by vendor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { vendor: 'BCIL', devices: 2890, uptime: 98.9, efficiency: 96.2, performance: 94.8, satisfaction: 94 },
                    { vendor: 'ZEBRA', devices: 1234, uptime: 97.8, efficiency: 95.1, performance: 93.1, satisfaction: 92 },
                    { vendor: 'IMP', devices: 756, uptime: 96.5, efficiency: 93.8, performance: 91.7, satisfaction: 89 },
                    { vendor: 'ANJ', devices: 240, uptime: 95.2, efficiency: 91.5, performance: 89.4, satisfaction: 87 }
                  ].map((vendor) => (
                    <div key={vendor.vendor} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{vendor.vendor}</div>
                        <div className="text-sm text-muted-foreground">{vendor.devices} devices</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{vendor.uptime}%</div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{vendor.performance}%</div>
                        <div className="text-sm text-muted-foreground">Performance</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">{vendor.satisfaction}%</div>
                        <div className="text-sm text-muted-foreground">Satisfaction</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

      {/* Enhanced Weather Intelligence */}
      <Card>
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Weather Intelligence</h3>
            {activeWeatherAlerts.length > 0 && (
              <Badge variant="destructive">{activeWeatherAlerts.length} Alerts</Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-6 space-y-4">
          {/* Critical Weather Alerts */}
          {activeWeatherAlerts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center">
                <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Active Weather Alerts
              </h4>
              {activeWeatherAlerts.map((alert: any, index: number) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-3 ${getAlertSeverityColor(alert.severity)}`}
                  data-testid={`weather-alert-${index}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">{alert.type}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {alert.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        📍 {alert.region}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regional Weather Conditions */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Regional Conditions</h4>
            <div className="grid grid-cols-2 gap-3">
              {latestWeatherData.slice(0, 4).map((weather: any) => (
                <div key={weather.region} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" data-testid={`weather-city-${weather.city}`}>
                      {weather.city}
                    </span>
                    {getWeatherIcon(weather.condition)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Temperature:</span>
                      <span className="font-medium" data-testid={`weather-temp-${weather.city}`}>
                        {weather.temperature ? `${parseFloat(weather.temperature).toFixed(0)}°C` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Humidity:</span>
                      <span className="font-medium">{weather.humidity || 'N/A'}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Wind:</span>
                      <span className="font-medium">{weather.windSpeed || 'N/A'} km/h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proactive Weather Recommendations */}
          {activeWeatherAlerts.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Recommended Actions
              </h4>
              <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <div>🔧 Monitor device performance closely</div>
                <div>⚡ Activate backup power systems</div>
                <div>📡 Check communication systems</div>
                <div>👥 Alert regional maintenance teams</div>
              </div>
            </div>
          )}

          {/* Enhanced Environmental Impact Summary */}
          {Array.isArray(devicesAtRisk) && devicesAtRisk.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="p-1 bg-green-100 dark:bg-green-900 rounded">
                  🌿
                </div>
                Environmental Impact Assessment
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {devicesAtRisk.slice(0, 1).map((risk: any) => (
                  <div key={risk.region} className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-warning text-lg">⚠️</div>
                        <div className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded">AT RISK</div>
                      </div>
                      <div className="text-3xl font-bold text-warning" data-testid="text-devices-at-risk">
                        {risk.devicesAtRisk}
                      </div>
                      <div className="text-sm text-muted-foreground">Devices at Risk</div>
                      <div className="mt-2 h-2 bg-warning/20 rounded-full">
                        <div className="h-2 bg-warning rounded-full" style={{width: `${Math.min((risk.devicesAtRisk / 100) * 100, 100)}%`}}></div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-success text-lg">🛡️</div>
                        <div className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded">PROTECTED</div>
                      </div>
                      <div className="text-3xl font-bold text-success" data-testid="text-protection-activated">
                        {risk.protectionActivated}
                      </div>
                      <div className="text-sm text-muted-foreground">Protected Devices</div>
                      <div className="mt-2 h-2 bg-success/20 rounded-full">
                        <div className="h-2 bg-success rounded-full" style={{width: `${Math.min((risk.protectionActivated / 100) * 100, 100)}%`}}></div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-info text-lg">📢</div>
                        <div className="text-xs font-medium text-info bg-info/10 px-2 py-1 rounded">ALERTS</div>
                      </div>
                      <div className="text-3xl font-bold text-info" data-testid="text-alerts-generated">
                        {risk.alertsGenerated}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Alerts</div>
                      <div className="mt-2 h-2 bg-info/20 rounded-full">
                        <div className="h-2 bg-info rounded-full" style={{width: `${Math.min((risk.alertsGenerated / 50) * 100, 100)}%`}}></div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="md:col-span-2 space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Environmental Metrics
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Temperature Range</span>
                          <span className="font-medium">18-28°C</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Humidity Control</span>
                          <span className="font-medium">60-80%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Air Quality</span>
                          <span className="font-medium text-green-600">Good</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>CO₂ Levels</span>
                          <span className="font-medium">420 ppm</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Noise Level</span>
                          <span className="font-medium text-green-600">Low</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Vibration</span>
                          <span className="font-medium text-green-600">Stable</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Sustainability Impact
                    </h5>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">92%</div>
                        <div className="text-xs text-muted-foreground">Energy Saved</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">15.2t</div>
                        <div className="text-xs text-muted-foreground">CO₂ Reduced</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">99.1%</div>
                        <div className="text-xs text-muted-foreground">Uptime</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Weather Impact Summary */}
          {analyticsData && typeof analyticsData === 'object' && (
            <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                System Impact Analysis
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    {(analyticsData as any)?.totalDevices || 0}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">Total Devices</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    {(analyticsData as any)?.deviceStatus?.find((s: any) => s.status === 'LIVE')?.count || 0}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">Active Devices</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {(analyticsData as any)?.deviceStatus?.reduce((acc: number, s: any) => acc + (s.count || 0), 0) || 0}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">Total Monitored</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    Online
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">System Status</div>
                </div>
              </div>
            </div>
          )}

          {/* Weather Dashboard Link */}
          <Suspense fallback={<div className="w-full p-2 border rounded">Loading...</div>}>
            <SafeButton variant="outline" className="w-full" data-testid="button-expand-weather">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              View Full Weather Dashboard
            </SafeButton>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
