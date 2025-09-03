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
import LocationWiseDeviceStatus from "./LocationWiseDeviceStatus";
import LastTagReadStatus from "./LastTagReadStatus";
import WeeklyHealthProgress from "./WeeklyHealthProgress";
import NLDSDeviceTable from "./NLDSDeviceTable";
import EnhancedDeviceDataView from "./EnhancedDeviceDataView";
import RoleSpecificStats from "./RoleSpecificStats";
import AdminActivityTracker from "./AdminActivityTracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Shield, MapPin, Users, Settings, Eye, Monitor, AlertTriangle, BarChart3, Activity, TrendingUp, Database, Zap, Cpu, Thermometer, Wifi, Battery, Globe, Download, FileText, Table, Calendar, Filter, Search, Edit, Trash2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CSVLink } from 'react-csv';

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
                <DeviceMap onDeviceSelect={setSelectedDeviceId} />
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
  { name: 'Jan', devices: 4800, uptime: 99.2, transactions: 2.1, efficiency: 94.5 },
  { name: 'Feb', devices: 4850, uptime: 99.5, transactions: 2.3, efficiency: 95.2 },
  { name: 'Mar', devices: 4920, uptime: 98.8, transactions: 2.8, efficiency: 96.1 },
  { name: 'Apr', devices: 5000, uptime: 99.1, transactions: 3.2, efficiency: 96.8 },
  { name: 'May', devices: 5080, uptime: 99.6, transactions: 3.5, efficiency: 97.1 },
  { name: 'Jun', devices: 5120, uptime: 99.3, transactions: 3.8, efficiency: 97.5 }
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
  const [activeTab, setActiveTab] = useState('overview');
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className={`grid ${user?.role === 'NEC_GENERAL' || user?.role === 'NEC_ADMIN' ? 'grid-cols-8' : 'grid-cols-7'} lg:w-fit`}>
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="data" data-testid="tab-data">Data View</TabsTrigger>
                <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
                <TabsTrigger value="alerts" data-testid="tab-alerts">Alerts</TabsTrigger>
                <TabsTrigger value="operations" data-testid="tab-operations">Operations</TabsTrigger>
                <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
                {(user?.role === 'NEC_GENERAL' || user?.role === 'NEC_ADMIN') && (
                  <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
                )}
              </TabsList>

              {/* Overview Tab - NLDS Style */}
              <TabsContent value="overview" className="space-y-6">
                <RoleSpecificStats />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <LocationWiseDeviceStatus />
                  <LastTagReadStatus />
                </div>
                
                <WeeklyHealthProgress />
                
                <NLDSDeviceTable />
              </TabsContent>

              {/* Data View Tab - Advanced Filtering */}
              <TabsContent value="data" className="space-y-6">
                <EnhancedDeviceDataView />
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
                      <CardTitle className="text-sm font-medium">System Efficiency</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">97.5%</div>
                      <div className="mt-2">
                        <Progress value={97.5} className="h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Overall system efficiency</p>
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
                        <Line type="monotone" dataKey="efficiency" stroke="#ffc658" strokeWidth={2} name="Efficiency %" />
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

                {/* AI Assistant */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="w-5 h-5" />
                      AI Operations Assistant
                    </CardTitle>
                    <CardDescription>Intelligent system management and troubleshooting support</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AIAssistant />
                  </CardContent>
                </Card>

                {/* User Management Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>Manage user accounts, roles, and access permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">247</div>
                          <p className="text-xs text-muted-foreground">+12 this month</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Active Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">89</div>
                          <p className="text-xs text-muted-foreground">Currently online</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Pending Approvals</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-600">7</div>
                          <p className="text-xs text-muted-foreground">Require review</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Recent User Activity</h4>
                        <Button variant="outline" size="sm" data-testid="button-manage-users">
                          Manage Users
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {[
                          { name: 'Rajesh Kumar', role: 'NEC_ENGINEER', action: 'Device Reset', time: '2 min ago' },
                          { name: 'Priya Sharma', role: 'NEC_ADMIN', action: 'User Created', time: '15 min ago' },
                          { name: 'Amit Singh', role: 'NEC_GENERAL', action: 'System Config', time: '1 hour ago' }
                        ].map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{activity.name}</p>
                                <p className="text-xs text-muted-foreground">{activity.role}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">{activity.action}</p>
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      System Settings
                    </CardTitle>
                    <CardDescription>Configure system-wide settings and preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Device Management</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Auto-restart failed devices</span>
                            <Button variant="outline" size="sm">Enabled</Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Health check interval</span>
                            <span className="text-sm text-muted-foreground">30 seconds</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Alert threshold</span>
                            <span className="text-sm text-muted-foreground">3 failures</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Security & Access</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Session timeout</span>
                            <span className="text-sm text-muted-foreground">4 hours</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Two-factor authentication</span>
                            <Button variant="outline" size="sm">Required</Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Audit logging</span>
                            <Button variant="outline" size="sm">Enabled</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">System Configuration</h4>
                          <p className="text-sm text-muted-foreground">Manage global system settings</p>
                        </div>
                        <Button data-testid="button-advanced-settings">
                          Advanced Settings
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                {/* Report Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Advanced Reporting & Analytics
                    </CardTitle>
                    <CardDescription>Generate comprehensive reports with advanced filtering and export capabilities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="space-y-2">
                        <Label htmlFor="report-type">Report Type</Label>
                        <Select>
                          <SelectTrigger data-testid="select-report-type">
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="performance">Performance Report</SelectItem>
                            <SelectItem value="device-health">Device Health Report</SelectItem>
                            <SelectItem value="uptime">Uptime Analysis</SelectItem>
                            <SelectItem value="vendor">Vendor Comparison</SelectItem>
                            <SelectItem value="regional">Regional Analysis</SelectItem>
                            <SelectItem value="custom">Custom Report</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date-range">Date Range</Label>
                        <Select>
                          <SelectTrigger data-testid="select-date-range">
                            <SelectValue placeholder="Select date range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">Last 30 Days</SelectItem>
                            <SelectItem value="quarter">Last Quarter</SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="region-filter">Region Filter</Label>
                        <Select>
                          <SelectTrigger data-testid="select-region-filter">
                            <SelectValue placeholder="All Regions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            <SelectItem value="north">North</SelectItem>
                            <SelectItem value="south">South</SelectItem>
                            <SelectItem value="east">East</SelectItem>
                            <SelectItem value="west">West</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vendor-filter">Vendor Filter</Label>
                        <Select>
                          <SelectTrigger data-testid="select-vendor-filter">
                            <SelectValue placeholder="All Vendors" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Vendors</SelectItem>
                            <SelectItem value="bcil">BCIL</SelectItem>
                            <SelectItem value="zebra">ZEBRA</SelectItem>
                            <SelectItem value="imp">IMP</SelectItem>
                            <SelectItem value="anj">ANJ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Export Options */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => {
                          const worksheet = XLSX.utils.json_to_sheet(detailedReportData);
                          const workbook = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(workbook, worksheet, 'Device Report');
                          XLSX.writeFile(workbook, 'device_report.xlsx');
                        }}
                        className="flex items-center gap-2"
                        data-testid="button-export-excel"
                      >
                        <Download className="w-4 h-4" />
                        Export to Excel
                      </Button>

                      <CSVLink
                        data={detailedReportData}
                        filename="device_report.csv"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                        data-testid="button-export-csv"
                      >
                        <Download className="w-4 h-4" />
                        Export to CSV
                      </CSVLink>

                      <Button
                        onClick={() => {
                          const doc = new jsPDF();
                          doc.text('Device Performance Report', 20, 20);
                          (doc as any).autoTable({
                            head: [['Device ID', 'Name', 'Vendor', 'Status', 'Uptime %', 'Transactions', 'Health Score']],
                            body: detailedReportData.map(device => [
                              device.id,
                              device.name,
                              device.vendor,
                              device.status,
                              device.uptime.toFixed(1),
                              device.transactions.toLocaleString(),
                              device.efficiency.toFixed(1)
                            ]),
                            startY: 30,
                          });
                          doc.save('device_report.pdf');
                        }}
                        variant="outline"
                        className="flex items-center gap-2"
                        data-testid="button-export-pdf"
                      >
                        <FileText className="w-4 h-4" />
                        Export to PDF
                      </Button>

                      <Button variant="outline" className="flex items-center gap-2" data-testid="button-schedule-report">
                        <Calendar className="w-4 h-4" />
                        Schedule Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Comprehensive Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Performance Comparison</CardTitle>
                      <CardDescription>Multi-metric analysis over 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={monthlyComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="totalDevices" fill="#8884d8" name="Total Devices" />
                          <Bar yAxisId="left" dataKey="activeDevices" fill="#82ca9d" name="Active Devices" />
                          <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#ff7300" strokeWidth={3} name="Efficiency %" />
                          <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#ffc658" strokeWidth={3} name="Transactions (M)" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Vendor Performance Matrix</CardTitle>
                      <CardDescription>Comprehensive vendor comparison metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={vendorPerformanceData} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="vendor" type="category" width={60} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="uptime" fill="#22c55e" name="Uptime %" />
                          <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
                          <Bar dataKey="satisfaction" fill="#f59e0b" name="Satisfaction %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Data Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Table className="w-5 h-5" />
                      Detailed Device Performance Report
                    </CardTitle>
                    <CardDescription>Interactive table with comprehensive device metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search devices..." className="pl-8" data-testid="input-search-devices" />
                      </div>
                      <Button variant="outline" size="sm" data-testid="button-filter-table">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </div>

                    <div className="rounded-md border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium">Device ID</th>
                              <th className="text-left p-3 font-medium">Name</th>
                              <th className="text-left p-3 font-medium">Vendor</th>
                              <th className="text-left p-3 font-medium">Region</th>
                              <th className="text-left p-3 font-medium">Status</th>
                              <th className="text-right p-3 font-medium">Uptime %</th>
                              <th className="text-right p-3 font-medium">Transactions</th>
                              <th className="text-right p-3 font-medium">Efficiency %</th>
                              <th className="text-right p-3 font-medium">Health Score</th>
                              <th className="text-left p-3 font-medium">Last Update</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailedReportData.map((device, index) => (
                              <tr key={device.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/25'} data-testid={`row-device-${device.id}`}>
                                <td className="p-3 font-mono text-xs">{device.id}</td>
                                <td className="p-3 font-medium">{device.name}</td>
                                <td className="p-3">
                                  <Badge variant="outline">{device.vendor}</Badge>
                                </td>
                                <td className="p-3">{device.region}</td>
                                <td className="p-3">
                                  <Badge 
                                    variant={device.status === 'Online' ? 'default' : device.status === 'Offline' ? 'destructive' : 'secondary'}
                                    className={device.status === 'Online' ? 'bg-green-600' : ''}
                                  >
                                    {device.status}
                                  </Badge>
                                </td>
                                <td className="p-3 text-right font-mono">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className={device.uptime >= 98 ? 'text-green-600' : device.uptime >= 95 ? 'text-yellow-600' : 'text-red-600'}>
                                      {device.uptime.toFixed(1)}%
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-right font-mono">{device.transactions.toLocaleString()}</td>
                                <td className="p-3 text-right font-mono text-green-600">{device.efficiency.toFixed(1)}%</td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Progress value={device.health} className="h-2 w-16" />
                                    <span className="font-mono text-xs">{device.health}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-xs text-muted-foreground">{device.lastUpdate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                      <span>Showing {detailedReportData.length} of {detailedReportData.length} devices</span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled data-testid="button-previous-page">Previous</Button>
                        <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs">1</span>
                        <Button variant="outline" size="sm" disabled data-testid="button-next-page">Next</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Trends</CardTitle>
                      <CardDescription>Daily alert patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={alertTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                          <Area type="monotone" dataKey="warning" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                          <Area type="monotone" dataKey="info" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Distribution</CardTitle>
                      <CardDescription>By vendor efficiency</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={vendorPerformanceData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="uptime"
                            label={({ vendor, percent }) => `${vendor} ${(percent * 100).toFixed(0)}%`}
                          >
                            {vendorPerformanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 90}, 70%, 50%)`} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}%`, 'Performance']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance KPIs</CardTitle>
                      <CardDescription>Key metrics overview</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>System Availability</span>
                          <span className="font-mono">99.3%</span>
                        </div>
                        <Progress value={99.3} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Transaction Success</span>
                          <span className="font-mono">97.8%</span>
                        </div>
                        <Progress value={97.8} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Performance Target</span>
                          <span className="font-mono">104.2%</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Customer Satisfaction</span>
                          <span className="font-mono">91.5%</span>
                        </div>
                        <Progress value={91.5} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Activity Tab - Admin Only */}
              {(user?.role === 'NEC_GENERAL' || user?.role === 'NEC_ADMIN') && (
                <TabsContent value="activity" className="space-y-6">
                  <AdminActivityTracker />
                </TabsContent>
              )}
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
  const [activeTab, setActiveTab] = useState('monitoring');
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                {/* Regional Report Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Regional Reporting & Analytics
                    </CardTitle>
                    <CardDescription>Generate detailed reports for your assigned region with export capabilities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="space-y-2">
                        <Label htmlFor="engineer-report-type">Report Type</Label>
                        <Select>
                          <SelectTrigger data-testid="select-engineer-report-type">
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regional-summary">Regional Summary</SelectItem>
                            <SelectItem value="device-health">Device Health Report</SelectItem>
                            <SelectItem value="maintenance">Maintenance Report</SelectItem>
                            <SelectItem value="performance">Performance Analysis</SelectItem>
                            <SelectItem value="alerts">Alert Analysis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="engineer-date-range">Time Period</Label>
                        <Select>
                          <SelectTrigger data-testid="select-engineer-date-range">
                            <SelectValue placeholder="Select time period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="quarter">This Quarter</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="engineer-location-filter">Location Filter</Label>
                        <Select>
                          <SelectTrigger data-testid="select-engineer-location-filter">
                            <SelectValue placeholder="All Locations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            <SelectItem value="mumbai-east">Mumbai East</SelectItem>
                            <SelectItem value="mumbai-west">Mumbai West</SelectItem>
                            <SelectItem value="mumbai-north">Mumbai North</SelectItem>
                            <SelectItem value="pune">Pune</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Regional Export Options */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => {
                          const regionalData = engineerRegionalData.map(location => ({
                            Location: location.name,
                            'Total Devices': location.devices,
                            'Online Devices': location.online,
                            'Offline Devices': location.offline,
                            'Performance Score': location.performance + '%'
                          }));
                          const worksheet = XLSX.utils.json_to_sheet(regionalData);
                          const workbook = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(workbook, worksheet, 'Regional Report');
                          XLSX.writeFile(workbook, 'regional_report.xlsx');
                        }}
                        className="flex items-center gap-2"
                        data-testid="button-export-regional-excel"
                      >
                        <Download className="w-4 h-4" />
                        Export to Excel
                      </Button>

                      <CSVLink
                        data={engineerRegionalData}
                        filename="regional_report.csv"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                        data-testid="button-export-regional-csv"
                      >
                        <Download className="w-4 h-4" />
                        Export to CSV
                      </CSVLink>

                      <Button
                        onClick={() => {
                          const doc = new jsPDF();
                          doc.text('Regional Performance Report', 20, 20);
                          (doc as any).autoTable({
                            head: [['Location', 'Total Devices', 'Online', 'Offline', 'Performance']],
                            body: engineerRegionalData.map(location => [
                              location.name,
                              location.devices,
                              location.online,
                              location.offline,
                              location.performance.toFixed(1) + '%'
                            ]),
                            startY: 30,
                          });
                          doc.save('regional_report.pdf');
                        }}
                        variant="outline"
                        className="flex items-center gap-2"
                        data-testid="button-export-regional-pdf"
                      >
                        <FileText className="w-4 h-4" />
                        Export to PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Regional Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Regional Summary Overview</CardTitle>
                      <CardDescription>Key metrics for your assigned region</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-6">
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
                          <Legend />
                          <Bar dataKey="online" fill="#22c55e" name="Online" />
                          <Bar dataKey="offline" fill="#ef4444" name="Offline" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Trends</CardTitle>
                      <CardDescription>Location performance over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={engineerRegionalData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="performance" stroke="#8884d8" strokeWidth={2} name="Performance Score" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Regional Data Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Table className="w-5 h-5" />
                      Regional Device Performance Details
                    </CardTitle>
                    <CardDescription>Comprehensive view of all devices in your region</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search locations..." className="pl-8" data-testid="input-search-regional" />
                      </div>
                      <Button variant="outline" size="sm" data-testid="button-filter-regional">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </div>

                    <div className="rounded-md border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium">Location</th>
                              <th className="text-right p-3 font-medium">Total Devices</th>
                              <th className="text-right p-3 font-medium">Online</th>
                              <th className="text-right p-3 font-medium">Offline</th>
                              <th className="text-right p-3 font-medium">Performance Score</th>
                              <th className="text-right p-3 font-medium">Uptime %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {engineerRegionalData.map((location, index) => (
                              <tr key={location.name} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/25'} data-testid={`row-location-${location.name.replace(/\s+/g, '-')}`}>
                                <td className="p-3 font-medium">{location.name}</td>
                                <td className="p-3 text-right font-mono">{location.devices}</td>
                                <td className="p-3 text-right">
                                  <span className="text-green-600 font-mono">{location.online}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <span className={`font-mono ${location.offline > 5 ? 'text-red-600' : 'text-gray-600'}`}>
                                    {location.offline}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Progress value={location.performance} className="h-2 w-16" />
                                    <span className="font-mono text-xs">{location.performance.toFixed(1)}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-right font-mono">
                                  <span className={location.performance >= 98 ? 'text-green-600' : location.performance >= 95 ? 'text-yellow-600' : 'text-red-600'}>
                                    {((location.online / location.devices) * 100).toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
const clientPerformanceData = [
  { month: 'Jan', uptime: 99.1, transactions: 2.8, efficiency: 94.2 },
  { month: 'Feb', uptime: 99.4, transactions: 3.1, efficiency: 95.1 },
  { month: 'Mar', uptime: 98.8, transactions: 3.5, efficiency: 96.3 },
  { month: 'Apr', uptime: 99.2, transactions: 3.8, efficiency: 97.1 },
  { month: 'May', uptime: 99.6, transactions: 4.2, efficiency: 97.8 },
  { month: 'Jun', uptime: 99.3, transactions: 4.6, efficiency: 98.2 }
];

// Advanced reporting data
const detailedReportData = [
  { id: 'FR_001', name: 'Mumbai Central FR', vendor: 'BCIL', region: 'West', status: 'Online', uptime: 99.8, transactions: 15420, efficiency: 96.2, lastUpdate: '2 min ago', health: 95 },
  { id: 'HHD_002', name: 'Pune Handheld 02', vendor: 'ZEBRA', region: 'West', status: 'Online', uptime: 98.5, transactions: 8950, efficiency: 94.7, lastUpdate: '5 min ago', health: 92 },
  { id: 'FR_003', name: 'Delhi North FR', vendor: 'IMP', region: 'North', status: 'Offline', uptime: 87.2, transactions: 12300, efficiency: 89.9, lastUpdate: '2 hrs ago', health: 78 },
  { id: 'FR_004', name: 'Chennai East FR', vendor: 'ANJ', region: 'South', status: 'Online', uptime: 97.3, transactions: 11200, efficiency: 95.8, lastUpdate: '1 min ago', health: 89 },
  { id: 'HHD_005', name: 'Kolkata Handheld 05', vendor: 'BCIL', region: 'East', status: 'Maintenance', uptime: 94.1, transactions: 7850, efficiency: 92.4, lastUpdate: '1 hr ago', health: 85 },
  { id: 'FR_006', name: 'Bangalore South FR', vendor: 'ZEBRA', region: 'South', status: 'Online', uptime: 99.1, transactions: 14800, efficiency: 97.2, lastUpdate: '3 min ago', health: 96 },
  { id: 'FR_007', name: 'Hyderabad Central FR', vendor: 'IMP', region: 'South', status: 'Online', uptime: 96.8, transactions: 13500, efficiency: 95.0, lastUpdate: '4 min ago', health: 91 },
  { id: 'HHD_008', name: 'Ahmedabad Handheld 08', vendor: 'ANJ', region: 'West', status: 'Online', uptime: 95.7, transactions: 9200, efficiency: 93.6, lastUpdate: '6 min ago', health: 88 }
];

const monthlyComparisonData = [
  { month: 'Jan', totalDevices: 4800, activeDevices: 4680, uptime: 94.1, transactions: 2.8, downtime: 4.2, alerts: 45 },
  { month: 'Feb', totalDevices: 4850, activeDevices: 4730, uptime: 94.8, transactions: 3.1, downtime: 3.8, alerts: 38 },
  { month: 'Mar', totalDevices: 4920, activeDevices: 4820, uptime: 95.7, transactions: 3.5, downtime: 2.9, alerts: 32 },
  { month: 'Apr', totalDevices: 5000, activeDevices: 4890, uptime: 96.1, transactions: 3.8, downtime: 3.1, alerts: 28 },
  { month: 'May', totalDevices: 5080, activeDevices: 4970, uptime: 96.8, transactions: 4.2, downtime: 2.2, alerts: 25 },
  { month: 'Jun', totalDevices: 5120, activeDevices: 5010, uptime: 97.3, transactions: 4.6, downtime: 2.1, alerts: 22 }
];

const vendorPerformanceData = [
  { vendor: 'BCIL', devices: 2890, uptime: 98.9, efficiency: 96.2, performance: 94.8, satisfaction: 94 },
  { vendor: 'ZEBRA', devices: 1234, uptime: 97.8, efficiency: 95.1, performance: 93.1, satisfaction: 92 },
  { vendor: 'IMP', devices: 756, uptime: 96.5, efficiency: 93.8, performance: 91.7, satisfaction: 89 },
  { vendor: 'ANJ', devices: 240, uptime: 95.2, efficiency: 91.5, performance: 89.4, satisfaction: 87 }
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
  const [activeTab, setActiveTab] = useState('devices');
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                <UserManagementInterface />
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
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                      <CardTitle className="text-sm font-medium">Monthly Performance</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">97.8%</div>
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
                        <DeviceMap onDeviceSelect={setSelectedDeviceId} />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance & Transaction Trends</CardTitle>
                        <CardDescription>6-month operational performance overview</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={clientPerformanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="efficiency" stroke="#22c55e" strokeWidth={3} name="Efficiency %" />
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
                            <span>System Uptime</span>
                            <span className="font-bold text-green-600">99.3%</span>
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
                        <AreaChart data={clientPerformanceData}>
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
                {/* Business Report Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Business Intelligence Reports
                    </CardTitle>
                    <CardDescription>Professional business reports with comprehensive data export capabilities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="space-y-2">
                        <Label htmlFor="client-report-type">Report Category</Label>
                        <Select>
                          <SelectTrigger data-testid="select-client-report-type">
                            <SelectValue placeholder="Select report category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="business-performance">Business Performance</SelectItem>
                            <SelectItem value="performance-summary">Performance Summary</SelectItem>
                            <SelectItem value="service-levels">Service Level Reports</SelectItem>
                            <SelectItem value="efficiency-analysis">Efficiency Analysis</SelectItem>
                            <SelectItem value="trends-forecast">Trends & Forecasting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client-date-range">Reporting Period</Label>
                        <Select>
                          <SelectTrigger data-testid="select-client-date-range">
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Annual</SelectItem>
                            <SelectItem value="custom">Custom Period</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client-format">Export Format</Label>
                        <Select>
                          <SelectTrigger data-testid="select-client-format">
                            <SelectValue placeholder="Choose format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="executive-summary">Executive Summary</SelectItem>
                            <SelectItem value="detailed-analysis">Detailed Analysis</SelectItem>
                            <SelectItem value="dashboard-view">Dashboard View</SelectItem>
                            <SelectItem value="raw-data">Raw Data Export</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Business Export Options */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => {
                          const businessData = clientPerformanceData.map(data => ({
                            Month: data.month,
                            'Uptime %': data.uptime,
                            'Transactions (M)': data.transactions,
                            'Efficiency (%)': data.efficiency
                          }));
                          const worksheet = XLSX.utils.json_to_sheet(businessData);
                          const workbook = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(workbook, worksheet, 'Business Report');
                          XLSX.writeFile(workbook, 'business_performance_report.xlsx');
                        }}
                        className="flex items-center gap-2"
                        data-testid="button-export-business-excel"
                      >
                        <Download className="w-4 h-4" />
                        Export Business Report
                      </Button>

                      <CSVLink
                        data={clientPerformanceData.map(data => ({
                          Month: data.month,
                          'Uptime %': data.uptime,
                          'Transactions (M)': data.transactions,
                          'Efficiency (%)': data.efficiency
                        }))}
                        filename="business_performance.csv"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                        data-testid="button-export-business-csv"
                      >
                        <Download className="w-4 h-4" />
                        Export to CSV
                      </CSVLink>

                      <Button
                        onClick={() => {
                          const doc = new jsPDF();
                          doc.text('Business Performance Report', 20, 20);
                          doc.text('Executive Summary', 20, 35);
                          (doc as any).autoTable({
                            head: [['Month', 'Efficiency %', 'Transactions (M)', 'Performance Score']],
                            body: clientPerformanceData.map(data => [
                              data.month,
                              data.uptime.toFixed(1) + '%',
                              data.transactions.toFixed(1) + 'M',
                              data.efficiency.toFixed(1) + '%'
                            ]),
                            startY: 45,
                          });
                          doc.save('business_performance_report.pdf');
                        }}
                        variant="outline"
                        className="flex items-center gap-2"
                        data-testid="button-export-business-pdf"
                      >
                        <FileText className="w-4 h-4" />
                        Executive Report (PDF)
                      </Button>

                      <Button variant="outline" className="flex items-center gap-2" data-testid="button-schedule-business">
                        <Calendar className="w-4 h-4" />
                        Schedule Reports
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Business Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Performance Trends</CardTitle>
                      <CardDescription>6-month comprehensive business metrics analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={clientPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="transactions" fill="#3b82f6" name="Transactions (M)" />
                          <Line yAxisId="right" type="monotone" dataKey="uptime" stroke="#22c55e" strokeWidth={3} name="Uptime %" />
                          <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={3} name="Efficiency %" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Key Performance Indicators</CardTitle>
                      <CardDescription>Current month vs targets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">System Efficiency</span>
                            <span className="text-2xl font-bold text-green-600">98.2%</span>
                          </div>
                          <Progress value={98.2} className="h-3" />
                          <div className="text-xs text-muted-foreground">Target: 95% | Current: Exceeding</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Monthly Transactions</span>
                            <span className="text-2xl font-bold text-blue-600">4.6M</span>
                          </div>
                          <Progress value={92} className="h-3" />
                          <div className="text-xs text-muted-foreground">Target: 5M | Current: 92% of target</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">System Uptime</span>
                            <span className="text-2xl font-bold text-green-600">97.5%</span>
                          </div>
                          <Progress value={103} className="h-3" />
                          <div className="text-xs text-muted-foreground">Target: 97.0% | Current: 100.5% of target</div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Growth Rate</span>
                            <span className="text-2xl font-bold text-green-600">+8.9%</span>
                          </div>
                          <Progress value={89} className="h-3" />
                          <div className="text-xs text-muted-foreground">YoY comparison | Steady growth trend</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Distribution</CardTitle>
                      <CardDescription>Monthly performance breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={clientPerformanceData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="uptime"
                            label={({ month, percent }) => `${month} ${(percent * 100).toFixed(0)}%`}
                          >
                            {clientPerformanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}%`, 'Performance']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction Volume Trends</CardTitle>
                      <CardDescription>6-month transaction analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={clientPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="transactions" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Business Insights</CardTitle>
                      <CardDescription>Key business metrics summary</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-sm font-medium text-green-800 dark:text-green-200">Performance Growth</div>
                        <div className="text-lg font-bold text-green-600">+8.9%</div>
                        <div className="text-xs text-green-600">vs last month</div>
                      </div>
                      
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Avg Efficiency</div>
                        <div className="text-lg font-bold text-blue-600">96.8%</div>
                        <div className="text-xs text-blue-600">6-month average</div>
                      </div>
                      
                      <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <div className="text-sm font-medium text-purple-800 dark:text-purple-200">Availability</div>
                        <div className="text-lg font-bold text-purple-600">99.7%</div>
                        <div className="text-xs text-purple-600">System availability</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Business Summary Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Table className="w-5 h-5" />
                      Executive Business Summary
                    </CardTitle>
                    <CardDescription>Comprehensive monthly business performance data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium">Period</th>
                              <th className="text-right p-3 font-medium">Efficiency %</th>
                              <th className="text-right p-3 font-medium">Transactions (M)</th>
                              <th className="text-right p-3 font-medium">Efficiency (%)</th>
                              <th className="text-right p-3 font-medium">Growth Rate</th>
                              <th className="text-center p-3 font-medium">Performance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientPerformanceData.map((data, index) => {
                              const prevData = index > 0 ? clientPerformanceData[index - 1] : null;
                              const growthRate = prevData ? ((data.uptime - prevData.uptime) / prevData.uptime * 100) : 0;
                              
                              return (
                                <tr key={data.month} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/25'} data-testid={`row-business-${data.month}`}>
                                  <td className="p-3 font-medium">{data.month} 2024</td>
                                  <td className="p-3 text-right font-mono text-green-600">{data.uptime.toFixed(1)}%</td>
                                  <td className="p-3 text-right font-mono">{data.transactions.toFixed(1)}M</td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Progress value={data.efficiency} className="h-2 w-16" />
                                      <span className="font-mono text-xs">{data.efficiency.toFixed(1)}%</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right font-mono">
                                    <span className={growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Badge variant={data.efficiency >= 97 ? "default" : data.efficiency >= 95 ? "secondary" : "destructive"}>
                                      {data.efficiency >= 97 ? "Excellent" : data.efficiency >= 95 ? "Good" : "Needs Attention"}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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

      {selectedDeviceId && (
        <DeviceDetailModal
          deviceId={selectedDeviceId}
          onClose={() => setSelectedDeviceId(null)}
        />
      )}
    </div>
  );
}

// User Management Interface Component
function UserManagementInterface() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'CLIENT',
    region: '',
    password: ''
  });

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest('POST', '/api/users', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowCreateModal(false);
      setNewUser({ email: '', firstName: '', lastName: '', role: 'CLIENT', region: '', password: '' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string, userData: any }) => {
      return await apiRequest('PUT', `/api/users/${id}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditingUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });

  const handleCreateUser = () => {
    if (newUser.email && newUser.firstName && newUser.lastName && newUser.password) {
      createUserMutation.mutate(newUser);
    }
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      updateUserMutation.mutate({ 
        id: editingUser.id, 
        userData: {
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          role: editingUser.role,
          region: editingUser.role === 'NEC_ENGINEER' ? editingUser.region : null,
          isActive: editingUser.isActive
        }
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">User Management</h3>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} data-testid="button-create-user">
          <Users className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{user.role}</Badge>
                      {user.region && <Badge variant="secondary">{user.region}</Badge>}
                      <Badge variant={user.isActive !== false ? "default" : "destructive"}>
                        {user.isActive !== false ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingUser(user)}
                    data-testid={`button-edit-user-${user.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`button-delete-user-${user.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded-md px-3 py-2"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  className="w-full border rounded-md px-3 py-2"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  data-testid="input-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  data-testid="select-role"
                >
                  <option value="CLIENT">Client</option>
                  <option value="NEC_ENGINEER">NEC Engineer</option>
                  <option value="NEC_ADMIN">NEC Admin</option>
                  <option value="NEC_GENERAL">NEC General</option>
                </select>
              </div>
              {newUser.role === 'NEC_ENGINEER' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Region</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={newUser.region}
                    onChange={(e) => setNewUser({ ...newUser, region: e.target.value })}
                    data-testid="select-region"
                  >
                    <option value="">Select Region</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={createUserMutation.isPending} data-testid="button-save-user">
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    data-testid="input-edit-first-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    data-testid="input-edit-last-name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  data-testid="select-edit-role"
                >
                  <option value="CLIENT">Client</option>
                  <option value="NEC_ENGINEER">NEC Engineer</option>
                  <option value="NEC_ADMIN">NEC Admin</option>
                  <option value="NEC_GENERAL">NEC General</option>
                </select>
              </div>
              {editingUser.role === 'NEC_ENGINEER' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Region</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={editingUser.region || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, region: e.target.value })}
                    data-testid="select-edit-region"
                  >
                    <option value="">Select Region</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingUser.isActive !== false}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                  data-testid="checkbox-active"
                />
                <label htmlFor="isActive" className="text-sm font-medium">Active Account</label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setEditingUser(null)} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending} data-testid="button-update-user">
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </div>
        </div>
      )}
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