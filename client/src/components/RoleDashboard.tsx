import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import NavigationHeader from "./NavigationHeader";
import Sidebar from "./Sidebar";
import StatusMetrics from "./StatusMetrics";
import DeviceMap from "./DeviceMap";
import DeviceListTable from "./DeviceListTable";
import AlertsPanel from "./AlertsPanel";
import AIAssistant from "./AIAssistant";
import WeatherPanel from "./WeatherPanel";
import DeviceDetailModal from "./DeviceDetailModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Shield, MapPin, Users, Settings, Eye, Monitor, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  badge: {
    text: string;
    variant: "default" | "outline" | "secondary";
    color?: string;
    icon: React.ReactNode;
  };
  showLogout?: boolean;
}

function DashboardLayout({ title, subtitle, badge, showLogout = false }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/logout", "POST");
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        data-testid="navigation-header"
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          data-testid="sidebar"
        />
        
        <main className="flex-1 overflow-hidden">
          <div className="bg-card border-b border-border p-6" data-testid="dashboard-header">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                  <Badge variant={badge.variant} className={badge.color}>
                    {badge.icon}
                    {badge.text}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{subtitle}</p>
              </div>
              
              {showLogout && (
                <Button 
                  variant="outline" 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                >
                  Sign Out
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <StatusMetrics />
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <DeviceMap />
                <DeviceListTable />
              </div>
              
              <div className="space-y-6">
                <AlertsPanel />
                <WeatherPanel />
                <AIAssistant />
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedDeviceId && (
        <DeviceDetailModal
          deviceId={selectedDeviceId}
          onClose={() => setSelectedDeviceId(null)}
        />
      )}
    </div>
  );
}

// NEC General Dashboard - Complete system access
function NECGeneralDashboard() {
  return (
    <DashboardLayout
      title="NEC General Dashboard"
      subtitle="Full system access - All regions and emergency operations"
      badge={{
        text: "Complete Authority",
        variant: "default",
        color: "bg-purple-600",
        icon: <Shield className="w-3 h-3 mr-1" />
      }}
    />
  );
}

// NEC Engineer Dashboard - Regional access only
function NECEngineerDashboard() {
  const { user } = useAuth();
  
  return (
    <DashboardLayout
      title="Engineer Dashboard"
      subtitle="Regional device monitoring and basic operations"
      badge={{
        text: `Region: ${user?.region || 'All'}`,
        variant: "outline",
        color: "border-blue-500 text-blue-600",
        icon: <MapPin className="w-3 h-3 mr-1" />
      }}
    />
  );
}

// NEC Admin Dashboard - Device management focus
function NECAdminDashboard() {
  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Advanced device management and system configuration"
      badge={{
        text: "Device Management",
        variant: "outline",
        color: "border-green-500 text-green-600",
        icon: <Settings className="w-3 h-3 mr-1" />
      }}
    />
  );
}

// Client Dashboard - Read-only view
function ClientDashboard() {
  const { data: statusSummary } = useQuery({
    queryKey: ["/api/analytics/status-summary"],
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        onToggleSidebar={() => {}}
        data-testid="navigation-header"
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={false} 
          onClose={() => {}}
          isMobile={false}
          data-testid="sidebar"
        />
        
        <main className="flex-1 overflow-hidden">
          <div className="bg-card border-b border-border p-6" data-testid="dashboard-header">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-3xl font-bold tracking-tight">Client Dashboard</h2>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    <Eye className="w-3 h-3 mr-1" />
                    Read-Only Access
                  </Badge>
                </div>
                <p className="text-muted-foreground">Infrastructure monitoring and status overview</p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Client-specific status overview */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">OPERATIONAL</div>
                  <p className="text-xs text-muted-foreground">All systems functioning normally</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Array.isArray(statusSummary) ? statusSummary.find((s: any) => s.status === 'LIVE')?.count || 0 : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Devices online and processing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Service Level</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">99.8%</div>
                  <p className="text-xs text-muted-foreground">System uptime this month</p>
                </CardContent>
              </Card>
            </div>

            <StatusMetrics />
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <DeviceMap />
                <Card>
                  <CardHeader>
                    <CardTitle>Device Status Overview</CardTitle>
                    <CardDescription>Real-time status of RFID devices across all locations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DeviceListTable />
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <AlertsPanel />
                <WeatherPanel />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Main role-based dashboard component
export default function RoleDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case 'NEC_GENERAL':
      return <NECGeneralDashboard />;
    case 'NEC_ENGINEER':
      return <NECEngineerDashboard />;
    case 'NEC_ADMIN':
      return <NECAdminDashboard />;
    case 'CLIENT':
      return <ClientDashboard />;
    default:
      return <ClientDashboard />; // Default to most restrictive view
  }
}