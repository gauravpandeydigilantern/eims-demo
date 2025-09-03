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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Shield, MapPin, Users, Settings, Eye, Monitor, AlertTriangle, BarChart3, Activity, TrendingUp, Database, Zap, Cpu, Thermometer, Wifi, Battery, Globe } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
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
                <DeviceMap onDeviceSelect={(id) => {}} />
                <DeviceListTable onDeviceSelect={(id) => {}} />
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

// Mock data for charts
const performanceData = [
  { name: 'Jan', devices: 4800, uptime: 99.2, transactions: 2.1, revenue: 1.8 },
  { name: 'Feb', devices: 4850, uptime: 99.5, transactions: 2.3, revenue: 2.1 },
  { name: 'Mar', devices: 4920, uptime: 98.8, transactions: 2.8, revenue: 2.4 },
  { name: 'Apr', devices: 5000, uptime: 99.1, transactions: 3.2, revenue: 2.8 },
  { name: 'May', devices: 5080, uptime: 99.6, transactions: 3.5, revenue: 3.1 },
  { name: 'Jun', devices: 5120, uptime: 99.3, transactions: 3.8, revenue: 3.4 }
];

const regionData = [
  { name: 'West', devices: 1845, uptime: 99.2, alerts: 12, color: '#8884d8' },
  { name: 'North', devices: 1234, uptime: 98.8, alerts: 8, color: '#82ca9d' },
  { name: 'South', devices: 1567, uptime: 99.5, alerts: 5, color: '#ffc658' },
  { name: 'East', devices: 474, uptime: 97.9, alerts: 15, color: '#ff7300' }
];

const vendorData = [
  { name: 'BCIL', value: 2890, color: '#0088FE' },
  { name: 'ZEBRA', value: 1234, color: '#00C49F' },
  { name: 'IMP', value: 756, color: '#FFBB28' },
  { name: 'ANJ', value: 240, color: '#FF8042' }
];

const alertTrends = [
  { time: '00:00', critical: 5, warning: 12, info: 8 },
  { time: '04:00', critical: 3, warning: 8, info: 15 },
  { time: '08:00', critical: 8, warning: 25, info: 18 },
  { time: '12:00', critical: 12, warning: 35, info: 22 },
  { time: '16:00', critical: 7, warning: 18, info: 12 },
  { time: '20:00', critical: 4, warning: 10, info: 8 }
];

// NEC General Dashboard - Complete system access
function NECGeneralDashboard() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: systemStats } = useQuery({
    queryKey: ['/api/analytics/system-overview'],
  });

  const { data: deviceStats } = useQuery({
    queryKey: ['/api/devices/stats'],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/logout");
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
          {/* Dashboard Header */}
          <div className="bg-card border-b border-border p-6" data-testid="dashboard-header">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-3xl font-bold tracking-tight">NEC General Dashboard</h2>
                  <Badge variant="default" className="bg-purple-600">
                    <Shield className="w-3 h-3 mr-1" />
                    Complete Authority
                  </Badge>
                </div>
                <p className="text-muted-foreground">Full system access - All regions and emergency operations</p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Multi-tab Dashboard Content */}
          <div className="p-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid grid-cols-6 lg:w-fit">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
                <TabsTrigger value="alerts" data-testid="tab-alerts">Alerts</TabsTrigger>
                <TabsTrigger value="operations" data-testid="tab-operations">Operations</TabsTrigger>
                <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <StatusMetrics />
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Geographic Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DeviceMap onDeviceSelect={setSelectedDeviceId} />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Regional Performance Overview</CardTitle>
                        <CardDescription>Device status and uptime by region</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={regionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="devices" fill="#8884d8" name="Total Devices" />
                            <Bar dataKey="alerts" fill="#ff7300" name="Active Alerts" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-6">
                    <AlertsPanel />
                    <WeatherPanel />
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Vendor Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={vendorData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {vendorData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">99.3%</div>
                      <div className="mt-2">
                        <Progress value={99.3} className="h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">+0.2% from last month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Transaction Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">3.2M/day</div>
                      <div className="mt-2">
                        <Progress value={85} className="h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">+12% from last week</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">87/100</div>
                      <div className="mt-2">
                        <Progress value={87} className="h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Good overall health</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">₹3.4Cr</div>
                      <div className="mt-2">
                        <Progress value={92} className="h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Monthly revenue</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends (6 Months)</CardTitle>
                    <CardDescription>Device count, uptime, and transaction volume over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="uptime" stroke="#8884d8" strokeWidth={2} name="Uptime %" />
                        <Line type="monotone" dataKey="transactions" stroke="#82ca9d" strokeWidth={2} name="Transactions (M)" />
                        <Line type="monotone" dataKey="revenue" stroke="#ffc658" strokeWidth={2} name="Revenue (Cr)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Real-time System Load</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2"><Cpu className="w-4 h-4" />CPU Usage</span>
                          <span className="font-mono">23%</span>
                        </div>
                        <Progress value={23} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2"><Database className="w-4 h-4" />Memory</span>
                          <span className="font-mono">67%</span>
                        </div>
                        <Progress value={67} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2"><Wifi className="w-4 h-4" />Network</span>
                          <span className="font-mono">89%</span>
                        </div>
                        <Progress value={89} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2"><Thermometer className="w-4 h-4" />Temperature</span>
                          <span className="font-mono">42°C</span>
                        </div>
                        <Progress value={70} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={performanceData.slice(-6)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="transactions" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Device Health Analytics</CardTitle>
                      <CardDescription>Comprehensive health scoring across all devices</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={regionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="uptime" fill="#82ca9d" name="Uptime %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Patterns (24h)</CardTitle>
                      <CardDescription>Alert distribution throughout the day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={alertTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="critical" stroke="#ff4444" strokeWidth={2} name="Critical" />
                          <Line type="monotone" dataKey="warning" stroke="#ff8800" strokeWidth={2} name="Warning" />
                          <Line type="monotone" dataKey="info" stroke="#4444ff" strokeWidth={2} name="Info" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <DeviceListTable onDeviceSelect={setSelectedDeviceId} />
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="space-y-6">
                <AlertsPanel />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Response Times</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Average Response Time</span>
                          <span className="font-bold text-green-600">4.2 min</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Critical Alerts Resolved</span>
                          <span className="font-bold">89%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Escalated to Emergency</span>
                          <span className="font-bold text-red-600">3</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Emergency Operations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button className="w-full bg-red-600 hover:bg-red-700" data-testid="button-emergency-shutdown">
                          <Zap className="w-4 h-4 mr-2" />
                          Emergency Shutdown
                        </Button>
                        <Button variant="outline" className="w-full" data-testid="button-system-reset">
                          <Monitor className="w-4 h-4 mr-2" />
                          System-wide Reset
                        </Button>
                        <Button variant="outline" className="w-full" data-testid="button-maintenance-mode">
                          <Settings className="w-4 h-4 mr-2" />
                          Maintenance Mode
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Operations Tab */}
              <TabsContent value="operations" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Operations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">47</div>
                      <p className="text-sm text-muted-foreground">Currently running</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">96.8%</div>
                      <p className="text-sm text-muted-foreground">Last 30 days</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Failed Operations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">12</div>
                      <p className="text-sm text-muted-foreground">Require attention</p>
                    </CardContent>
                  </Card>
                </div>

                <AIAssistant />
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Performance Report</CardTitle>
                    <CardDescription>Comprehensive system metrics and trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="devices" stroke="#8884d8" strokeWidth={3} name="Active Devices" />
                        <Line type="monotone" dataKey="uptime" stroke="#82ca9d" strokeWidth={3} name="Uptime %" />
                        <Line type="monotone" dataKey="transactions" stroke="#ffc658" strokeWidth={3} name="Transactions (M)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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

// Engineer regional data
const engineerRegionalData = [
  { name: 'Mumbai East', devices: 245, online: 238, offline: 7, performance: 97.1 },
  { name: 'Mumbai West', devices: 189, online: 185, offline: 4, performance: 97.9 },
  { name: 'Mumbai North', devices: 156, online: 149, offline: 7, performance: 95.5 },
  { name: 'Pune', devices: 98, online: 96, offline: 2, performance: 97.9 }
];

const dailyTransactions = [
  { hour: '00', transactions: 1200 },
  { hour: '02', transactions: 890 },
  { hour: '04', transactions: 650 },
  { hour: '06', transactions: 1800 },
  { hour: '08', transactions: 3200 },
  { hour: '10', transactions: 2800 },
  { hour: '12', transactions: 3500 },
  { hour: '14', transactions: 3100 },
  { hour: '16', transactions: 2900 },
  { hour: '18', transactions: 3800 },
  { hour: '20', transactions: 2400 },
  { hour: '22', transactions: 1600 }
];

// NEC Engineer Dashboard - Regional access only
function NECEngineerDashboard() {
  const { user } = useAuth();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: regionalStats } = useQuery({
    queryKey: ['/api/analytics/regional-stats', user?.region],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/logout");
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
                  <h2 className="text-3xl font-bold tracking-tight">Engineer Dashboard</h2>
                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                    <MapPin className="w-3 h-3 mr-1" />
                    Region: {user?.region || 'West'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">Regional device monitoring and operational management</p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                Sign Out
              </Button>
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="monitoring" className="space-y-6">
              <TabsList className="grid grid-cols-5 lg:w-fit">
                <TabsTrigger value="monitoring" data-testid="tab-monitoring">Monitoring</TabsTrigger>
                <TabsTrigger value="devices" data-testid="tab-devices">Devices</TabsTrigger>
                <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="monitoring" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Regional Devices</CardTitle>
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">688</div>
                      <Progress value={97} className="h-2 mt-2" />
                      <p className="text-xs text-muted-foreground mt-2">97% operational</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">28,450</div>
                      <Progress value={78} className="h-2 mt-2" />
                      <p className="text-xs text-muted-foreground mt-2">+8% vs yesterday</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">23</div>
                      <div className="text-sm text-red-600">3 Critical</div>
                      <p className="text-xs text-muted-foreground mt-2">Immediate attention</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">3.2m</div>
                      <Progress value={92} className="h-2 mt-2" />
                      <p className="text-xs text-muted-foreground mt-2">Within SLA</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Regional Device Map</CardTitle>
                        <CardDescription>Your assigned region: {user?.region || 'West'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DeviceMap onDeviceSelect={setSelectedDeviceId} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Transaction Trends (24h)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={dailyTransactions}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="transactions" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-6">
                    <AlertsPanel />
                    <WeatherPanel />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="devices" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Performance by Location</CardTitle>
                    <CardDescription>Performance metrics for your assigned region</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={engineerRegionalData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="online" fill="#22c55e" name="Online" />
                        <Bar dataKey="offline" fill="#ef4444" name="Offline" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <DeviceListTable onDeviceSelect={setSelectedDeviceId} />
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Scheduled Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">8</div>
                      <p className="text-sm text-muted-foreground">This week</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Repairs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">12</div>
                      <p className="text-sm text-muted-foreground">Awaiting parts</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Completed Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">5</div>
                      <p className="text-sm text-muted-foreground">On schedule</p>
                    </CardContent>
                  </Card>
                </div>

                <AIAssistant />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Device Performance Analytics</CardTitle>
                    <CardDescription>Performance trends for your region over the past month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={engineerRegionalData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="performance" stroke="#8884d8" strokeWidth={2} name="Performance Score" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Summary Report</CardTitle>
                    <CardDescription>Comprehensive overview of your assigned region</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">688</div>
                        <div className="text-sm text-muted-foreground">Total Devices</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">97.1%</div>
                        <div className="text-sm text-muted-foreground">Avg Performance</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">23</div>
                        <div className="text-sm text-muted-foreground">Open Alerts</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">28.4K</div>
                        <div className="text-sm text-muted-foreground">Daily Transactions</div>
                      </div>
                    </div>
                    
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={engineerRegionalData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="devices" fill="#3b82f6" name="Total Devices" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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

// Admin data
const deviceTypeData = [
  { name: 'Fixed Readers', count: 3845, health: 94.2, efficiency: 97.1 },
  { name: 'Handheld Devices', count: 1275, health: 89.5, efficiency: 91.8 }
];

const userActivityData = [
  { role: 'NEC_GENERAL', active: 8, total: 12, lastLogin: '2 hours ago' },
  { role: 'NEC_ENGINEER', active: 45, total: 67, lastLogin: '15 minutes ago' },
  { role: 'NEC_ADMIN', active: 12, total: 15, lastLogin: '5 minutes ago' },
  { role: 'CLIENT', active: 23, total: 89, lastLogin: '1 hour ago' }
];

// Client data
const clientRevenueData = [
  { month: 'Jan', revenue: 2.1, transactions: 2.8, efficiency: 94.2 },
  { month: 'Feb', revenue: 2.4, transactions: 3.1, efficiency: 95.1 },
  { month: 'Mar', revenue: 2.8, transactions: 3.5, efficiency: 96.3 },
  { month: 'Apr', revenue: 3.1, transactions: 3.8, efficiency: 97.1 },
  { month: 'May', revenue: 3.4, transactions: 4.2, efficiency: 97.8 },
  { month: 'Jun', revenue: 3.7, transactions: 4.6, efficiency: 98.2 }
];

const serviceMetrics = [
  { service: 'RFID Processing', uptime: 99.8, performance: 97.5, satisfaction: 98.2 },
  { service: 'Transaction Processing', uptime: 99.5, performance: 96.8, satisfaction: 97.9 },
  { service: 'Data Analytics', uptime: 99.9, performance: 98.1, satisfaction: 98.8 },
  { service: 'Alert System', uptime: 99.7, performance: 97.2, satisfaction: 97.5 }
];

// NEC Admin Dashboard - Device management focus
function NECAdminDashboard() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: adminStats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/logout");
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
                  <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    <Settings className="w-3 h-3 mr-1" />
                    Device Management
                  </Badge>
                </div>
                <p className="text-muted-foreground">Advanced device management and system configuration</p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                Sign Out
              </Button>
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="devices" className="space-y-6">
              <TabsList className="grid grid-cols-5 lg:w-fit">
                <TabsTrigger value="devices" data-testid="tab-devices">Device Management</TabsTrigger>
                <TabsTrigger value="users" data-testid="tab-users">User Management</TabsTrigger>
                <TabsTrigger value="configuration" data-testid="tab-configuration">Configuration</TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
                <TabsTrigger value="logs" data-testid="tab-logs">System Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="devices" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">5,120</div>
                      <p className="text-xs text-muted-foreground">Across all regions</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Configs</CardTitle>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">47</div>
                      <p className="text-xs text-muted-foreground">Require deployment</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Firmware Updates</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">156</div>
                      <p className="text-xs text-muted-foreground">Available updates</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">91.8%</div>
                      <Progress value={91.8} className="h-2 mt-2" />
                      <p className="text-xs text-muted-foreground mt-2">Overall system health</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Device Type Distribution & Health</CardTitle>
                    <CardDescription>Performance comparison between Fixed Readers and Handheld Devices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={deviceTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" name="Device Count" />
                        <Bar dataKey="health" fill="#82ca9d" name="Health Score" />
                        <Bar dataKey="efficiency" fill="#ffc658" name="Efficiency %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <DeviceListTable onDeviceSelect={setSelectedDeviceId} />
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Activity Overview</CardTitle>
                    <CardDescription>Active users and access patterns by role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userActivityData.map((roleData, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{roleData.role}</Badge>
                            <div>
                              <div className="font-medium">{roleData.active}/{roleData.total} Active</div>
                              <div className="text-sm text-muted-foreground">Last login: {roleData.lastLogin}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{((roleData.active / roleData.total) * 100).toFixed(1)}%</div>
                            <Progress value={(roleData.active / roleData.total) * 100} className="h-1 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Management Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start" variant="outline" data-testid="button-add-user">
                        <Users className="w-4 h-4 mr-2" />
                        Add New User
                      </Button>
                      <Button className="w-full justify-start" variant="outline" data-testid="button-manage-roles">
                        <Shield className="w-4 h-4 mr-2" />
                        Manage Roles
                      </Button>
                      <Button className="w-full justify-start" variant="outline" data-testid="button-audit-logs">
                        <Activity className="w-4 h-4 mr-2" />
                        View Audit Logs
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent User Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>engineer@nec.com logged in</span>
                          <span className="text-muted-foreground">15m ago</span>
                        </div>
                        <div className="flex justify-between">
                          <span>admin@nec.com updated config</span>
                          <span className="text-muted-foreground">1h ago</span>
                        </div>
                        <div className="flex justify-between">
                          <span>general@nec.com emergency reset</span>
                          <span className="text-muted-foreground">2h ago</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="configuration" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start" variant="outline" data-testid="button-device-config">
                        <Monitor className="w-4 h-4 mr-2" />
                        Device Configuration
                      </Button>
                      <Button className="w-full justify-start" variant="outline" data-testid="button-network-config">
                        <Wifi className="w-4 h-4 mr-2" />
                        Network Settings
                      </Button>
                      <Button className="w-full justify-start" variant="outline" data-testid="button-alert-config">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Alert Configuration
                      </Button>
                      <Button className="w-full justify-start" variant="outline" data-testid="button-backup-config">
                        <Database className="w-4 h-4 mr-2" />
                        Backup & Recovery
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Configuration Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Device Configs</span>
                          <span className="font-bold text-green-600">98.5% Applied</span>
                        </div>
                        <Progress value={98.5} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span>Firmware Updates</span>
                          <span className="font-bold text-blue-600">87.2% Updated</span>
                        </div>
                        <Progress value={87.2} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span>Network Compliance</span>
                          <span className="font-bold text-green-600">100% Compliant</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <AIAssistant />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Device Type Performance Comparison</CardTitle>
                    <CardDescription>Health and efficiency metrics by device type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={deviceTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="health" fill="#22c55e" name="Health Score" />
                        <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Configuration Deployment Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="devices" stroke="#8884d8" strokeWidth={2} name="Configured Devices" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Operation Logs</CardTitle>
                    <CardDescription>Recent system changes and operations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-green-50 text-green-700">SUCCESS</Badge>
                          <span className="text-sm">Device FR_MUM_001 firmware updated to v3.2.1</span>
                        </div>
                        <span className="text-xs text-muted-foreground">2 minutes ago</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">WARNING</Badge>
                          <span className="text-sm">Configuration deployment failed for HHD_CHE_001</span>
                        </div>
                        <span className="text-xs text-muted-foreground">8 minutes ago</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">INFO</Badge>
                          <span className="text-sm">Bulk configuration applied to 245 devices</span>
                        </div>
                        <span className="text-xs text-muted-foreground">15 minutes ago</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-red-50 text-red-700">ERROR</Badge>
                          <span className="text-sm">Network timeout for FR_KOL_002</span>
                        </div>
                        <span className="text-xs text-muted-foreground">1 hour ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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

// Client Dashboard - Read-only view
function ClientDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: statusSummary } = useQuery({
    queryKey: ["/api/analytics/status-summary"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/logout");
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
                  <h2 className="text-3xl font-bold tracking-tight">Client Dashboard</h2>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    <Eye className="w-3 h-3 mr-1" />
                    Read-Only Access
                  </Badge>
                </div>
                <p className="text-muted-foreground">Infrastructure monitoring and business analytics</p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                Sign Out
              </Button>
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid grid-cols-4 lg:w-fit">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
                <TabsTrigger value="service" data-testid="tab-service">Service Levels</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">System Status</CardTitle>
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">OPERATIONAL</div>
                      <p className="text-xs text-muted-foreground">All systems functioning</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">4,967</div>
                      <p className="text-xs text-muted-foreground">97% online and processing</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Service Level</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">99.8%</div>
                      <Progress value={99.8} className="h-2 mt-2" />
                      <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">₹3.7Cr</div>
                      <Progress value={89} className="h-2 mt-2" />
                      <p className="text-xs text-muted-foreground">+8.9% vs last month</p>
                    </CardContent>
                  </Card>
                </div>

                <StatusMetrics />
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Device Distribution Map
                        </CardTitle>
                        <CardDescription>Real-time view of your infrastructure</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DeviceMap onDeviceSelect={(id) => {}} />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue & Transaction Trends</CardTitle>
                        <CardDescription>6-month business performance overview</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={clientRevenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} name="Revenue (Cr)" />
                            <Line type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={3} name="Transactions (M)" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-6">
                    <AlertsPanel />
                    <WeatherPanel />
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Business Impact Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span>Cost Savings</span>
                            <span className="font-bold text-green-600">₹24.5L</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Efficiency Gain</span>
                            <span className="font-bold text-blue-600">+18%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing Speed</span>
                            <span className="font-bold text-green-600">2.3x faster</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Error Reduction</span>
                            <span className="font-bold text-green-600">-76%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Performance Analysis</CardTitle>
                    <CardDescription>Performance breakdown by geographic region</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={regionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="devices" fill="#3b82f6" name="Total Devices" />
                        <Bar dataKey="uptime" fill="#22c55e" name="Uptime %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vendor Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={vendorData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {vendorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Efficiency Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={clientRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="efficiency" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Performance Report</CardTitle>
                    <CardDescription>Comprehensive view of infrastructure impact on business metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={clientRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} name="Revenue (Cr)" />
                        <Line type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={3} name="Transactions (M)" />
                        <Line type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={3} name="Efficiency %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Performance Indicators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">98.2%</div>
                          <div className="text-sm text-muted-foreground">System Efficiency</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">4.6M</div>
                          <div className="text-sm text-muted-foreground">Monthly Transactions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">₹3.7Cr</div>
                          <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Device Status Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DeviceListTable onDeviceSelect={(id) => {}} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="service" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Level Agreement Status</CardTitle>
                    <CardDescription>Performance against agreed service levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {serviceMetrics.map((service, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{service.service}</span>
                            <Badge variant={service.uptime >= 99.5 ? "default" : "destructive"}>
                              {service.uptime >= 99.5 ? "Meeting SLA" : "Below SLA"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Uptime</div>
                              <div className="font-bold text-green-600">{service.uptime}%</div>
                              <Progress value={service.uptime} className="h-1 mt-1" />
                            </div>
                            <div>
                              <div className="text-muted-foreground">Performance</div>
                              <div className="font-bold text-blue-600">{service.performance}%</div>
                              <Progress value={service.performance} className="h-1 mt-1" />
                            </div>
                            <div>
                              <div className="text-muted-foreground">Satisfaction</div>
                              <div className="font-bold text-green-600">{service.satisfaction}%</div>
                              <Progress value={service.satisfaction} className="h-1 mt-1" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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