import { useAuth } from "@/hooks/useAuth";
import StatusMetrics from "./StatusMetrics";
import AdvancedStatusMetrics from "./AdvancedStatusMetrics";
import DeviceMap from "./DeviceMap";
import DeviceListTable from "./DeviceListTable";
import DeviceRegistrationTable from "./DeviceRegistrationTable";
import AlertsPanel from "./AlertsPanel";
import AIAssistantPanel from "./AIAssistantPanel";
import WeatherPanel from "./WeatherPanel";
import NotificationManagement from "./NotificationManagement";
import VendorIntegrationManagement from "./VendorIntegrationManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface RoleSpecificDashboardProps {
  onDeviceSelect: (deviceId: string) => void;
}

export default function RoleSpecificDashboard({ onDeviceSelect }: RoleSpecificDashboardProps) {
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

  // NEC General - Complete Authority Dashboard
  if (user?.role === 'NEC_GENERAL') {
    return (
      <div className="space-y-6">
        {/* Executive Summary */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
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

        <AdvancedStatusMetrics />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <DeviceMap onDeviceSelect={onDeviceSelect} />
            <DeviceRegistrationTable />
          </div>
          
          <div className="space-y-6">
            <AlertsPanel />
            <AIAssistantPanel />
            <WeatherPanel />
          </div>
        </div>
      </div>
    );
  }

  // NEC Engineer - Regional Access Dashboard
  if (user?.role === 'NEC_ENGINEER') {
    return (
      <div className="space-y-6">
        {/* Regional Control Header */}
        <Card className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
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

        <StatusMetrics />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <DeviceMap onDeviceSelect={onDeviceSelect} />
            <DeviceRegistrationTable />
          </div>
          
          <div className="space-y-6">
            <AlertsPanel />
            <AIAssistantPanel />
            <WeatherPanel />
          </div>
        </div>
      </div>
    );
  }

  // NEC Admin - Device Management Dashboard
  if (user?.role === 'NEC_ADMIN') {
    return (
      <div className="space-y-6">
        {/* Admin Control Header */}
        <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
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

        <AdvancedStatusMetrics />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <DeviceMap onDeviceSelect={onDeviceSelect} />
            
            {/* Admin-specific Device Management Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Device Management Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" size="sm" data-testid="button-bulk-reset">
                    Bulk Reset
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-config-sync">
                    Config Sync
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-health-check">
                    Health Check
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-firmware-update">
                    Update Firmware
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <DeviceRegistrationTable />
          </div>
          
          <div className="space-y-6">
            <AlertsPanel />
            <AIAssistantPanel />
            <WeatherPanel />
          </div>
        </div>
      </div>
    );
  }

  // CLIENT - Read-Only Dashboard
  if (user?.role === 'CLIENT') {
    return (
      <div className="space-y-6">
        {/* Client Dashboard Header */}
        <Card className="bg-gradient-to-r from-slate-500 to-gray-600 text-white">
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

        {/* Simplified Status Metrics for Clients */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">95.2%</div>
              <div className="text-sm text-muted-foreground">System Uptime</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">4,793</div>
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
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* Read-only Device Map */}
            <Card>
              <CardHeader>
                <CardTitle>Device Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceMap onDeviceSelect={onDeviceSelect} />
              </CardContent>
            </Card>
            
            {/* Simplified Device Status Table */}
            <Card>
              <CardHeader>
                <CardTitle>Device Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceListTable onDeviceSelect={onDeviceSelect} />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {/* Read-only Alerts Panel */}
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertsPanel />
              </CardContent>
            </Card>
            
            {/* Client-specific AI Assistant (Read-only) */}
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
            
            <WeatherPanel />
          </div>
        </div>
      </div>
    );
  }

  // Default dashboard for unknown roles
  return (
    <div className="space-y-6">
      <StatusMetrics />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <DeviceMap onDeviceSelect={onDeviceSelect} />
          <DeviceListTable onDeviceSelect={onDeviceSelect} />
        </div>
        <div className="space-y-6">
          <AlertsPanel />
          <WeatherPanel />
        </div>
      </div>
    </div>
  );
}