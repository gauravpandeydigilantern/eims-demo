import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import NavigationHeader from "@/components/NavigationHeader";
import Sidebar from "@/components/Sidebar";
import StatusMetrics from "@/components/StatusMetrics";
import AdvancedStatusMetrics from "@/components/AdvancedStatusMetrics";
import DeviceMap from "@/components/DeviceMap";
import DeviceListTable from "@/components/DeviceListTable";
import DeviceRegistrationTable from "@/components/DeviceRegistrationTable";
import LocationWiseDeviceStatus from "@/components/LocationWiseDeviceStatus";
import LastTagReadStatus from "@/components/LastTagReadStatus";
import WeeklyHealthProgress from "@/components/WeeklyHealthProgress";
import AlertsPanel from "@/components/AlertsPanel";
import AIAssistantPanel from "@/components/AIAssistantPanel";
import WeatherPanel from "@/components/WeatherPanel";
import AIAssistant from "@/components/AIAssistant";
import LocationIntelligence from "@/components/LocationIntelligence";
import RoleSpecificStats from "@/components/RoleSpecificStats";
import AdminActivityTracker from "@/components/AdminActivityTracker";
import ProjectLevelAnalytics from "@/components/ProjectLevelAnalytics";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Monitor, Users, BarChart3, Activity, Settings, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import OptimizedDashboard from "@/components/OptimizedDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const { data: userStats } = useQuery<{
    totalDevices: number;
    totalUsers: number;
    pendingAlerts: number;
    activeDevices: number;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === 'NEC_GENERAL' || user?.role === 'NEC_ADMIN',
    refetchInterval: 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          activeTab="overview"
        />
        
        <main className="flex-1 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Complete Role-specific Dashboard Content (like original overview tab) */}
            {renderCompleteDashboard()}
          </div>
        </main>
      </div>
    </div>
  );

  function renderNECGeneralCompleteDashboard() {
    return (
      <Tabs defaultValue="device-info" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="device-info">Device Status</TabsTrigger>
          <TabsTrigger value="weather">Weather & Environment</TabsTrigger>
          <TabsTrigger value="geolocation">Location Intelligence</TabsTrigger>
          <TabsTrigger value="activity">System Activity</TabsTrigger>
          <TabsTrigger value="project-analytics">Project Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="device-info" className="space-y-6">
          {/* <AdvancedStatusMetrics /> */}
          
       <OptimizedDashboard />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   
            <LocationWiseDeviceStatus />
            <LastTagReadStatus />
          </div>

        </TabsContent>
        
        <TabsContent value="weather" className="space-y-6">
            <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  🌱
                </div>
                Environmental Impact Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time environmental monitoring and impact assessment
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-green-600">☀️</div>
                    <div className="text-xs font-medium text-green-700">UPTIME</div>
                  </div>
                  <div className="text-2xl font-bold text-green-700">98.5%</div>
                  <div className="text-sm text-green-600">Clear Weather Uptime</div>
                  <div className="mt-2 h-2 bg-green-200 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{width: '98.5%'}}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-yellow-600">⚠️</div>
                    <div className="text-xs font-medium text-yellow-700">ISSUES</div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-700">2.1%</div>
                  <div className="text-sm text-yellow-600">Weather-Related Issues</div>
                  <div className="mt-2 h-2 bg-yellow-200 rounded-full">
                    <div className="h-2 bg-yellow-500 rounded-full" style={{width: '2.1%'}}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-blue-600">🌡️</div>
                    <div className="text-xs font-medium text-blue-700">TEMPERATURE</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">24°C</div>
                  <div className="text-sm text-blue-600">Optimal Temperature</div>
                  <div className="mt-2 h-2 bg-blue-200 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-purple-600">💨</div>
                    <div className="text-xs font-medium text-purple-700">HUMIDITY</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-700">65%</div>
                  <div className="text-sm text-purple-600">Optimal Humidity</div>
                  <div className="mt-2 h-2 bg-purple-200 rounded-full">
                    <div className="h-2 bg-purple-500 rounded-full" style={{width: '65%'}}></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Environmental Benefits
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>CO₂ Reduction</span>
                      <span className="font-medium text-green-600">12.5 tons</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paper Saved</span>
                      <span className="font-medium text-green-600">8,450 sheets</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Energy Efficiency</span>
                      <span className="font-medium text-green-600">94.2%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    System Resilience
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Weather Adaptation</span>
                      <span className="font-medium text-blue-600">98.7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auto-Recovery Rate</span>
                      <span className="font-medium text-blue-600">99.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Environmental Alerts</span>
                      <span className="font-medium text-blue-600">24/7</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <WeatherPanel />
        
        </TabsContent>
        
        <TabsContent value="geolocation" className="space-y-6">
          <LocationIntelligence />
          <Card>
            <CardHeader>
              <CardTitle>Device Network Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceMap onDeviceSelect={setSelectedDeviceId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1">
            <AdminActivityTracker />
          </div>
          <WeeklyHealthProgress />
          <Card>
            <CardHeader>
              <CardTitle>Executive Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">1,247</div>
                  <div className="text-sm text-muted-foreground">Daily Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">99.2%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">156ms</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{userStats?.pendingAlerts || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project-analytics" className="space-y-6">
          <ProjectLevelAnalytics />
        </TabsContent>


      </Tabs>
    );
  }

  function renderNECEngineerCompleteDashboard() {
    return (
      <Tabs defaultValue="device-info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="device-info">Device Status</TabsTrigger>
          <TabsTrigger value="weather">Weather & Environment</TabsTrigger>
          <TabsTrigger value="geolocation">Location Intelligence</TabsTrigger>
          <TabsTrigger value="activity">System Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="device-info" className="space-y-6">
          <StatusMetrics />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LocationWiseDeviceStatus />
            <LastTagReadStatus />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Device Management</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceListTable onDeviceSelect={setSelectedDeviceId} />
            </CardContent>
          </Card>
          <RoleSpecificStats />
        </TabsContent>
        
        <TabsContent value="weather" className="space-y-6">
          <WeatherPanel />
        </TabsContent>
        
        <TabsContent value="geolocation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Device Map</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceMap onDeviceSelect={setSelectedDeviceId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Device Status Table</CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto">
                  <DeviceListTable onDeviceSelect={setSelectedDeviceId} />
                </CardContent>
              </Card>
              <AlertsPanel />
            </div>
            <AIAssistant />
          </div>
          <WeeklyHealthProgress />
        </TabsContent>
      </Tabs>
    );
  }

  function renderNECAdminCompleteDashboard() {
    return (
      <Tabs defaultValue="device-info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="device-info">Device Management</TabsTrigger>
          <TabsTrigger value="weather">Weather & Environment</TabsTrigger>
          <TabsTrigger value="geolocation">Location Intelligence</TabsTrigger>
          <TabsTrigger value="activity">System Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="device-info" className="space-y-6">
          <AdvancedStatusMetrics />
          
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LastTagReadStatus />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Administrative Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Bulk Config</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>Health Check</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Sync Status</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Security Audit</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          <RoleSpecificStats />
        </TabsContent>
        
        <TabsContent value="weather" className="space-y-6">
          <WeatherPanel />
        </TabsContent>
        
        <TabsContent value="geolocation" className="space-y-6">
                      <LocationWiseDeviceStatus />

          <Card>
            <CardHeader>
              <CardTitle>System Device Map</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceMap onDeviceSelect={setSelectedDeviceId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AlertsPanel />
            <AIAssistant />
          </div>
          <AdminActivityTracker />
          <WeeklyHealthProgress />
        </TabsContent>
      </Tabs>
    );
  }

  function renderClientCompleteDashboard() {
    return (
      <Tabs defaultValue="device-info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="device-info">Service Status</TabsTrigger>
          <TabsTrigger value="weather">Weather Conditions</TabsTrigger>
          <TabsTrigger value="geolocation">Coverage Map</TabsTrigger>
          <TabsTrigger value="activity">Service Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="device-info" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-green-600">99.2%</div>
                <div className="text-sm text-muted-foreground">Service Uptime</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-blue-600">88</div>
                <div className="text-sm text-muted-foreground">Active Devices</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-green-600">99.8%</div>
                <div className="text-sm text-muted-foreground">Data Accuracy</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-purple-600">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoring</div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LocationWiseDeviceStatus />
            <LastTagReadStatus />
          </div>
          <RoleSpecificStats />
        </TabsContent>
        
        <TabsContent value="weather" className="space-y-6">
          <WeatherPanel />
        </TabsContent>
        
        <TabsContent value="geolocation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Coverage Map</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceMap onDeviceSelect={setSelectedDeviceId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <WeeklyHealthProgress />
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Last Update:</span>
                  <span className="font-medium">Live</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Quality:</span>
                  <span className="font-medium text-green-600">Excellent</span>
                </div>
                <div className="flex justify-between">
                  <span>Coverage:</span>
                  <span className="font-medium">800+ Locations</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  }

  function renderCompleteDashboard() {
    switch (user?.role) {
      case 'NEC_GENERAL':
        return renderNECGeneralCompleteDashboard();
      case 'NEC_ENGINEER':
        return renderNECEngineerCompleteDashboard();
      case 'NEC_ADMIN':
        return renderNECAdminCompleteDashboard();
      case 'CLIENT':
        return renderClientCompleteDashboard();
      default:
        return (
          <div className="space-y-6">
            <StatusMetrics />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Device Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DeviceMap onDeviceSelect={setSelectedDeviceId} />
                  </CardContent>
                </Card>
                <RoleSpecificStats />
              </div>
              <div className="space-y-6">
                <LocationWiseDeviceStatus />
                <LastTagReadStatus />
                <WeeklyHealthProgress />
              </div>
            </div>
          </div>
        );
    }
  }
}
