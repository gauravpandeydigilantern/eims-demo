import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Cpu, Thermometer, Wifi, Battery, Clock, MapPin } from "lucide-react";
import NavigationHeader from "@/components/NavigationHeader";
import Sidebar from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DeviceDetail() {
  const [, params] = useRoute("/device/:deviceId");
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  const deviceId = params?.deviceId;

  const { data: deviceResponse, isLoading, error } = useQuery<{success: boolean; data: any}>({
    queryKey: [`/api/devices/${deviceId}`],
    enabled: !!deviceId,
  });

  const deviceData = deviceResponse?.data;
  const device = deviceData;
  const metrics = deviceData?.metrics;
  const recentAlerts = deviceData?.alerts || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading device details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Device Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested device could not be found.</p>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-green-500';
      case 'DOWN': return 'bg-red-500';
      case 'WARNING': return 'bg-yellow-500';
      case 'MAINTENANCE': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'LIVE': 'bg-green-100 text-green-800',
      'DOWN': 'bg-red-100 text-red-800',
      'WARNING': 'bg-yellow-100 text-yellow-800',
      'MAINTENANCE': 'bg-blue-100 text-blue-800'
    };
    
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Mock historical data for charts
  const historicalData = [
    { time: '00:00', uptime: 99.2, transactions: 245, temperature: 28 },
    { time: '04:00', uptime: 99.1, transactions: 189, temperature: 27 },
    { time: '08:00', uptime: 98.9, transactions: 356, temperature: 31 },
    { time: '12:00', uptime: 99.5, transactions: 445, temperature: 33 },
    { time: '16:00', uptime: 99.3, transactions: 389, temperature: 32 },
    { time: '20:00', uptime: 99.4, transactions: 267, temperature: 29 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <main className="flex-1 overflow-hidden">
          {/* Header */}
          <div className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/")}
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground" data-testid="text-device-id">
                      {device.id}
                    </h1>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span data-testid="text-device-location">
                        {device.tollPlaza} • {device.region}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Badge className={getStatusBadge(device.status)} data-testid="badge-device-status">
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(device.status)}`}></div>
                {device.status}
              </Badge>
            </div>
          </div>

          {/* Device Details Content */}
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{device.uptime?.toFixed(1) || 99.2}%</div>
                  <div className="mt-2">
                    <Progress value={device.uptime || 99.2} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">32°C</div>
                  <p className="text-xs text-muted-foreground mt-2">Normal range</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Signal Strength</CardTitle>
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-65 dBm</div>
                  <p className="text-xs text-muted-foreground mt-2">Excellent</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Contact</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2 min</div>
                  <p className="text-xs text-muted-foreground mt-2">ago</p>
                </CardContent>
              </Card>
            </div>

            {/* Device Information and Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Device Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Device Type</p>
                      <p className="font-medium">{device.deviceType === 'FIXED_READER' ? 'Fixed Reader' : 'Handheld Device'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vendor</p>
                      <p className="font-medium">{device.vendor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="font-medium">{device.model || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Firmware</p>
                      <p className="font-medium">{device.firmwareVersion || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">MAC Address</p>
                      <p className="font-mono text-sm">{device.macAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">IP Address</p>
                      <p className="font-mono text-sm">{device.ipAddress || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>24 Hour Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2} name="Uptime %" />
                      <Line type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2} name="Transactions" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            {recentAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAlerts.slice(0, 5).map((alert: any) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            alert.severity === 'CRITICAL' ? 'bg-red-500' :
                            alert.severity === 'WARNING' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}></div>
                          <div>
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}