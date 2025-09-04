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
import RoleSpecificStats from "@/components/RoleSpecificStats";
import AdminActivityTracker from "@/components/AdminActivityTracker";
import ProjectLevelAnalytics from "@/components/ProjectLevelAnalytics";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Monitor, Users, BarChart3, Activity, Settings, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

  // Complete Unified Dashboard for NEC General (like the screenshot)
  function renderNECGeneralCompleteDashboard() {
    return (
      <div className="space-y-6">
        {/* Status Metrics Row */}
        <StatusMetrics />

        {/* Location and Tag Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LocationWiseDeviceStatus />
          <LastTagReadStatus />
        </div>

        {/* Weekly Health Progress */}
        <WeeklyHealthProgress />

        {/* Two-Column Layout: Main Content + Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* Device Network Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Device Network Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceMap onDeviceSelect={setSelectedDeviceId} />
              </CardContent>
            </Card>

            {/* Project Level Analytics */}
            <ProjectLevelAnalytics />

            {/* Executive KPI Dashboard */}
            <RoleSpecificStats />
          </div>

          <div className="space-y-6">
            {/* Active Alerts */}
            <AlertsPanel />

            {/* Weekly Health Progress */}
            <WeeklyHealthProgress />

            {/* Admin Activity Tracker */}
            <AdminActivityTracker />

            {/* Weather Panel */}
            <WeatherPanel />
          </div>
        </div>
      </div>
    );
  }

  // Complete Unified Dashboard for NEC Engineer
  function renderNECEngineerCompleteDashboard() {
    return (
      <div className="space-y-6">
        <StatusMetrics />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LocationWiseDeviceStatus />
          <LastTagReadStatus />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Regional Device Map</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceMap onDeviceSelect={setSelectedDeviceId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Management</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceListTable onDeviceSelect={setSelectedDeviceId} />
              </CardContent>
            </Card>

            <RoleSpecificStats />
          </div>

          <div className="space-y-6">
            <AlertsPanel />
            <WeeklyHealthProgress />
            <WeatherPanel />
          </div>
        </div>
      </div>
    );
  }

  // Complete Unified Dashboard for NEC Admin
  function renderNECAdminCompleteDashboard() {
    return (
      <div className="space-y-6">
        <AdvancedStatusMetrics />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LocationWiseDeviceStatus />
          <LastTagReadStatus />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Device Map</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceMap onDeviceSelect={setSelectedDeviceId} />
              </CardContent>
            </Card>

            {/* Admin Tools */}
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

            <AdminActivityTracker />
            <RoleSpecificStats />
          </div>

          <div className="space-y-6">
            <AlertsPanel />
            <WeeklyHealthProgress />
            <WeatherPanel />
          </div>
        </div>
      </div>
    );
  }

  // Complete Unified Dashboard for Client
  function renderClientCompleteDashboard() {
    return (
      <div className="space-y-6">
        {/* Simplified Status Cards */}
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Coverage Map</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceMap onDeviceSelect={setSelectedDeviceId} />
              </CardContent>
            </Card>

            <RoleSpecificStats />
          </div>

          <div className="space-y-6">
            <WeeklyHealthProgress />
            <WeatherPanel />
          </div>
        </div>
      </div>
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
