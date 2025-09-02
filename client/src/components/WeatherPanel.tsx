import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function WeatherPanel() {
  const { data: weatherData, isLoading } = useQuery({
    queryKey: ["/api/weather"],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const { data: weatherAlerts } = useQuery({
    queryKey: ["/api/weather/alerts"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: devicesAtRisk } = useQuery({
    queryKey: ["/api/weather/devices-at-risk"],
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

  const latestWeatherData = weatherData?.slice(0, 6) || [];
  const activeWeatherAlerts = weatherAlerts?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Regional Weather Summary */}
      <Card>
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Regional Performance</h3>
          </div>
        </div>
        
        <CardContent className="p-6 space-y-4">
          {latestWeatherData.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No weather data available</p>
            </div>
          ) : (
            latestWeatherData.map((region: any) => (
              <div key={region.region} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                  <span className="text-foreground" data-testid={`text-region-${region.region}`}>
                    {region.region}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground">
                    95.2%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 1000 + 800)} devices
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Vendor Performance */}
      <Card>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Vendor Performance</h3>
        </div>
        
        <CardContent className="p-6 space-y-4">
          {[
            { vendor: 'BCIL', uptime: 96.2, devices: 2156, color: 'bg-blue-100 text-blue-600' },
            { vendor: 'ZEBRA', uptime: 94.1, devices: 1891, color: 'bg-gray-100 text-gray-600' },
            { vendor: 'IMP', uptime: 91.7, devices: 892, color: 'bg-green-100 text-green-600' },
            { vendor: 'ANJ', uptime: 97.5, devices: 308, color: 'bg-purple-100 text-purple-600' },
          ].map((vendor) => (
            <div key={vendor.vendor} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${vendor.color}`}>
                  <span className="text-xs font-bold">
                    {vendor.vendor.substring(0, 2)}
                  </span>
                </div>
                <span className="text-foreground" data-testid={`text-vendor-${vendor.vendor}`}>
                  {vendor.vendor}
                </span>
              </div>
              <div className="text-right">
                <div className={`font-medium ${
                  vendor.uptime > 95 ? 'text-success' :
                  vendor.uptime > 90 ? 'text-warning' : 'text-destructive'
                }`}>
                  {vendor.uptime}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {vendor.devices.toLocaleString()} devices
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Weather & Environmental Monitoring */}
      <Card>
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Weather Monitoring</h3>
            <Button variant="ghost" size="sm" data-testid="button-expand-weather">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </Button>
          </div>
        </div>
        
        <CardContent className="p-6 space-y-4">
          {/* Current Conditions */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Current Conditions</h4>
            <div className="space-y-2">
              {latestWeatherData.slice(0, 3).map((weather: any) => (
                <div key={weather.region} className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm" data-testid={`weather-city-${weather.city}`}>
                    {weather.city}
                  </span>
                  <div className="flex items-center space-x-2">
                    {getWeatherIcon(weather.condition)}
                    <span className="text-sm" data-testid={`weather-temp-${weather.city}`}>
                      {weather.temperature ? `${parseFloat(weather.temperature).toFixed(0)}°C` : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weather Alerts */}
          {activeWeatherAlerts.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-3">Weather Alerts</h4>
              <div className="space-y-2">
                {activeWeatherAlerts.map((alert: any, index: number) => (
                  <div 
                    key={index}
                    className={`border rounded-lg p-3 ${getAlertSeverityColor(alert.severity)}`}
                    data-testid={`weather-alert-${index}`}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-sm font-medium">{alert.type}</span>
                    </div>
                    <div className="text-xs mt-1">
                      {alert.region} - {alert.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Environmental Impact Summary */}
          {devicesAtRisk && devicesAtRisk.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-3">Environmental Impact</h4>
              <div className="space-y-2">
                {devicesAtRisk.slice(0, 1).map((risk: any) => (
                  <div key={risk.region} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Devices at Risk</span>
                      <span className="font-medium text-warning" data-testid="text-devices-at-risk">
                        {risk.devicesAtRisk}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Protection Activated</span>
                      <span className="font-medium text-success" data-testid="text-protection-activated">
                        {risk.protectionActivated}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Alerts Generated</span>
                      <span className="font-medium text-info" data-testid="text-alerts-generated">
                        {risk.alertsGenerated}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
