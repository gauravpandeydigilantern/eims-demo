import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

// Import existing components
import StatusMetrics from "./StatusMetrics";
import AdvancedStatusMetrics from "./AdvancedStatusMetrics";
import DeviceMap from "./DeviceMap";
import DeviceListTable from "./DeviceListTable";
import DeviceRegistrationTable from "./DeviceRegistrationTable";
import AlertsPanel from "./AlertsPanel";
import AIAssistantPanel from "./AIAssistantPanel";
import WeatherPanel from "./WeatherPanel";

interface TabbedDashboardProps {
  onDeviceSelect: (deviceId: string) => void;
}

export default function TabbedDashboard({ onDeviceSelect }: TabbedDashboardProps) {
  const { user } = useAuth();

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

  // Role-specific header
  const renderRoleHeader = () => {
    if (user?.role === 'NEC_GENERAL') {
      return (
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Executive Control Center</h2>
                <p className="opacity-90">Complete system authority and oversight</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{userStats?.totalDevices || 0}</div>
                <div className="text-sm opacity-80">Total Devices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (user?.role === 'NEC_ENGINEER') {
      return (
        <Card className="bg-gradient-to-r from-green-500 to-teal-600 text-white mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Regional Engineering Dashboard</h2>
                <p className="opacity-90">
                  {user.region ? `${user.region} Region Management` : 'Regional Operations'}
                </p>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {user.region || 'All Regions'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (user?.role === 'NEC_ADMIN') {
      return (
        <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Device Management Center</h2>
                <p className="opacity-90">Advanced device control and configuration</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-xl font-bold">{userStats?.totalUsers || 0}</div>
                  <div className="text-xs opacity-80">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{userStats?.pendingAlerts || 0}</div>
                  <div className="text-xs opacity-80">Pending</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (user?.role === 'CLIENT') {
      return (
        <Card className="bg-gradient-to-r from-slate-500 to-gray-600 text-white mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Client Dashboard</h2>
                <p className="opacity-90">Real-time device status monitoring</p>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                Read-Only Access
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  // Device Info Tab Content
  const renderDeviceInfoTab = () => (
    <div className="space-y-6">
      {user?.role === 'NEC_GENERAL' || user?.role === 'NEC_ADMIN' ? (
        <AdvancedStatusMetrics />
      ) : (
        <StatusMetrics />
      )}
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DeviceListTable onDeviceSelect={onDeviceSelect} />
        {(user?.role === 'NEC_GENERAL' || user?.role === 'NEC_ADMIN' || user?.role === 'NEC_ENGINEER') && (
          <DeviceRegistrationTable />
        )}
      </div>

      {user?.role === 'NEC_ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle>Device Management Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" size="sm">Bulk Reset</Button>
              <Button variant="outline" size="sm">Config Sync</Button>
              <Button variant="outline" size="sm">Health Check</Button>
              <Button variant="outline" size="sm">Update Firmware</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Weather & Environment Tab Content
  const renderWeatherTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeatherPanel />
        <Card>
          <CardHeader>
            <CardTitle>Environmental Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Temperature Impact</span>
                <Badge variant="secondary">Normal</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Humidity Levels</span>
                <Badge variant="secondary">Optimal</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Wind Conditions</span>
                <Badge variant="secondary">Stable</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Weather Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">98.5%</div>
              <div className="text-sm text-muted-foreground">Clear Weather Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">2.1%</div>
              <div className="text-sm text-muted-foreground">Weather-Related Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24°C</div>
              <div className="text-sm text-muted-foreground">Optimal Temperature</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Geolocation Tab Content
  const renderGeolocationTab = () => (
    <div className="space-y-6">
      <DeviceMap onDeviceSelect={onDeviceSelect} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Location Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Locations</span>
                <span className="font-bold">847</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Active Zones</span>
                <span className="font-bold text-green-600">823</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Coverage Area</span>
                <span className="font-bold">15,420 km²</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>North Region</span>
                <Badge>245 devices</Badge>
              </div>
              <div className="flex justify-between">
                <span>South Region</span>
                <Badge>198 devices</Badge>
              </div>
              <div className="flex justify-between">
                <span>East Region</span>
                <Badge>221 devices</Badge>
              </div>
              <div className="flex justify-between">
                <span>West Region</span>
                <Badge>183 devices</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Activity Tab Content
  const renderActivityTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsPanel />
        <AIAssistantPanel />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity Overview</CardTitle>
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
              <div className="text-2xl font-bold text-orange-600">23</div>
              <div className="text-sm text-muted-foreground">Active Alerts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {user?.role === 'CLIENT' && (
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
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
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {renderRoleHeader()}
      
      <Tabs defaultValue="device-info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="device-info">Device Status</TabsTrigger>
          <TabsTrigger value="weather">Weather & Environment</TabsTrigger>
          <TabsTrigger value="geolocation">Location Intelligence</TabsTrigger>
          <TabsTrigger value="activity">System Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="device-info" className="space-y-6">
          {renderDeviceInfoTab()}
        </TabsContent>
        
        <TabsContent value="weather" className="space-y-6">
          {renderWeatherTab()}
        </TabsContent>
        
        <TabsContent value="geolocation" className="space-y-6">
          {renderGeolocationTab()}
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          {renderActivityTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}