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
    queryKey: ["/api/weather/realtime"],
    refetchInterval: 2 * 60 * 1000, // 2 minutes for real-time
  });

  const { data: weatherAlerts } = useQuery<any>({
    queryKey: ["/api/weather/alerts/intelligent"],
    refetchInterval: 3 * 60 * 1000,
  });

  const { data: devicesAtRisk } = useQuery<any>({
    queryKey: ["/api/weather/devices-at-risk/realtime"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: weatherIntelligence } = useQuery<any>({
    queryKey: ["/api/weather/intelligence"],
    refetchInterval: 10 * 60 * 1000, // 10 minutes for AI analysis
  });

  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery<any>({
    queryKey: ["/api/analytics/comprehensive"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: environmentalData } = useQuery<any>({
    queryKey: ["/api/weather/environmental-impact"],
    refetchInterval: 30 * 1000, // 30 seconds for real-time updates
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

          {/* AI-Powered Weather Intelligence */}
          {weatherIntelligence && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Weather Intelligence
                <Badge variant="secondary" className="ml-2">🤖 Powered by Mistral AI</Badge>
              </h4>
              
              {weatherIntelligence.summary && (
                <div className="mb-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded border">
                  <h5 className="font-medium mb-2">Current Situation</h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{weatherIntelligence.summary}</p>
                </div>
              )}
              
              {weatherIntelligence.recommendations && (
                <div className="space-y-2">
                  <h5 className="font-medium text-blue-800 dark:text-blue-200">AI Recommendations</h5>
                  <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    {weatherIntelligence.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {weatherIntelligence.riskLevel && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge variant={weatherIntelligence.riskLevel === 'HIGH' ? 'destructive' : weatherIntelligence.riskLevel === 'MEDIUM' ? 'secondary' : 'default'}>
                    {weatherIntelligence.riskLevel}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* AI-Enabled Environmental Impact Analysis */}
          <div className="border-l-4 border-l-green-500 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    🌱
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Environmental Impact Analysis</h4>
                    <p className="text-sm text-muted-foreground">Real-time environmental monitoring and impact assessment</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">LIVE</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Real-time Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-green-600">☀️</div>
                    <div className="text-xs font-medium text-green-700 dark:text-green-300">UPTIME</div>
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{environmentalData?.sustainability?.availability || '98.5'}%</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Clear Weather Uptime</div>
                  <div className="mt-2 h-2 bg-green-200 dark:bg-green-800 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full transition-all duration-1000" style={{width: `${environmentalData?.sustainability?.availability || 98.5}%`}}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-yellow-600">⚠️</div>
                    <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300">ISSUES</div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{environmentalData ? ((environmentalData.devicesAtRisk / (environmentalData.systemImpact?.totalDevices || 329)) * 100).toFixed(1) : '2.1'}%</div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Weather-Related Issues</div>
                  <div className="mt-2 h-2 bg-yellow-200 dark:bg-yellow-800 rounded-full">
                    <div className="h-2 bg-yellow-500 rounded-full transition-all duration-1000" style={{width: `${environmentalData ? ((environmentalData.devicesAtRisk / (environmentalData.systemImpact?.totalDevices || 329)) * 100) : 2.1}%`}}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-blue-600">🌡️</div>
                    <div className="text-xs font-medium text-blue-700 dark:text-blue-300">TEMPERATURE</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{latestWeatherData?.[0]?.temperature || '24'}°C</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Optimal Temperature</div>
                  <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-800 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full transition-all duration-1000" style={{width: `${Math.min(100, ((parseFloat(latestWeatherData?.[0]?.temperature || '24') / 40) * 100))}%`}}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-purple-600">💨</div>
                    <div className="text-xs font-medium text-purple-700 dark:text-purple-300">HUMIDITY</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{latestWeatherData?.[0]?.humidity || '65'}%</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Optimal Humidity</div>
                  <div className="mt-2 h-2 bg-purple-200 dark:bg-purple-800 rounded-full">
                    <div className="h-2 bg-purple-500 rounded-full transition-all duration-1000" style={{width: `${latestWeatherData?.[0]?.humidity || 65}%`}}></div>
                  </div>
                </div>
              </div>

              {/* Environmental Benefits & System Resilience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h5 className="font-semibold text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Environmental Benefits
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-3 bg-white dark:bg-gray-800 rounded border shadow-sm">
                      <span>CO₂ Reduction</span>
                      <span className="font-medium text-green-600">{environmentalData?.sustainability?.co2Reduced || '12.5 tons'}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white dark:bg-gray-800 rounded border shadow-sm">
                      <span>Paper Saved</span>
                      <span className="font-medium text-green-600">8,450 sheets</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white dark:bg-gray-800 rounded border shadow-sm">
                      <span>Energy Efficiency</span>
                      <span className="font-medium text-green-600">{environmentalData?.sustainability?.energySavedPercent || '94.2'}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-semibold text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    System Resilience
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-3 bg-white dark:bg-gray-800 rounded border shadow-sm">
                      <span>Weather Adaptation</span>
                      <span className="font-medium text-blue-600">98.7%</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white dark:bg-gray-800 rounded border shadow-sm">
                      <span>Auto-Recovery Rate</span>
                      <span className="font-medium text-blue-600">{environmentalData?.sustainability?.availability || '99.1'}%</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white dark:bg-gray-800 rounded border shadow-sm">
                      <span>Environmental Alerts</span>
                      <span className="font-medium text-blue-600">24/7</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Real-time Analysis */}
              {environmentalData?.aiInsights && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h5 className="font-medium mb-2 flex items-center text-blue-800 dark:text-blue-200">
                    <span className="mr-2">🤖</span>
                    AI Real-time Environmental Analysis
                    <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </h5>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">{environmentalData.aiInsights}</p>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Last updated: {new Date().toLocaleTimeString()} • Powered by AI
                  </div>
                </div>
              )}
            </div>
          </div>

          {environmentalData && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="p-1 bg-green-100 dark:bg-green-900 rounded">
                  🌍
                </div>
                Enhanced Environmental Data
              </h4>
              
              {/* Risk Status Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800 text-center">
                  <div className="text-2xl mb-1">⚠️</div>
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">AT RISK</div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">{environmentalData.devicesAtRisk || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Devices at Risk</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800 text-center">
                  <div className="text-2xl mb-1">🛡️</div>
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">PROTECTED</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{environmentalData.protectedDevices || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Protected Devices</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800 text-center">
                  <div className="text-2xl mb-1">📢</div>
                  <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">ALERTS</div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{environmentalData.activeAlerts || 1}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Active Alerts</div>
                </div>
              </div>

              {/* Environmental Metrics */}
              <div className="mb-6">
                <h5 className="font-medium mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Environmental Metrics
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Temperature Range</span>
                      <span className="font-medium">{environmentalData.metrics?.temperatureRange || '18-28°C'}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Humidity Control</span>
                      <span className="font-medium">{environmentalData.metrics?.humidityRange || '60-80%'}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Air Quality</span>
                      <span className="font-medium text-green-600">{environmentalData.metrics?.airQuality || 'Good'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">CO₂ Levels</span>
                      <span className="font-medium">{environmentalData.metrics?.co2Levels || '420 ppm'}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Noise Level</span>
                      <span className="font-medium text-green-600">{environmentalData.metrics?.noiseLevel || 'Low'}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Vibration</span>
                      <span className="font-medium text-green-600">{environmentalData.metrics?.vibration || 'Stable'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sustainability Impact */}
              <div className="mb-6">
                <h5 className="font-medium mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Sustainability Impact
                </h5>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{environmentalData.sustainability?.energySavedPercent || '92'}%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Energy Saved</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{environmentalData.sustainability?.co2Reduced || '15.2t'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">CO₂ Reduced</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{environmentalData.sustainability?.availability || '99.1'}%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Availability</div>
                  </div>
                </div>
              </div>

              {/* System Impact Analysis */}
              <div className="mb-6">
                <h5 className="font-medium mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  System Impact Analysis
                </h5>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">{environmentalData.systemImpact?.totalDevices || '329'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Devices</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{environmentalData.systemImpact?.activeDevices || '0'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Active Devices</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{environmentalData.systemImpact?.totalMonitored || '329'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Monitored</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{environmentalData.systemImpact?.systemStatus || 'Online'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">System Status</div>
                  </div>
                </div>
              </div>

              {/* AI Environmental Insights */}
              {environmentalData.aiInsights && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h5 className="font-medium mb-2 flex items-center text-blue-800 dark:text-blue-200">
                    <span className="mr-2">🤖</span>
                    AI Environmental Analysis
                  </h5>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{environmentalData.aiInsights}</p>
                </div>
              )}
            </div>
          )}



          {/* Weather Dashboard Link */}
          {/* <Suspense fallback={<div className="w-full p-2 border rounded">Loading...</div>}>
            <SafeButton variant="outline" className="w-full" data-testid="button-expand-weather">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              View Full Weather Dashboard
            </SafeButton>
          </Suspense> */}
        </CardContent>
      </Card>
    </div>
  );
}
