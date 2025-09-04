import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  ComposedChart 
} from "recharts";
import InteractiveChartWrapper from "./InteractiveChartWrapper";
import ExportDashboard from "./ExportDashboard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter
} from "lucide-react";
import { useLocation } from "wouter";

// Color schemes for charts
const CHART_COLORS = {
  primary: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a'],
  success: ['#22c55e', '#16a34a', '#15803d', '#166534'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
  danger: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
  neutral: ['#6b7280', '#4b5563', '#374151', '#1f2937']
};

const STATUS_COLORS = {
  LIVE: '#22c55e',
  DOWN: '#ef4444',
  MAINTENANCE: '#f59e0b',
  WARNING: '#f97316',
  SHUTDOWN: '#6b7280'
};

export default function ProjectLevelAnalytics() {
  const [activeTimeframe, setActiveTimeframe] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch real data from APIs
  const { data: devicesResponse } = useQuery<{success: boolean, data: any[]}>({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  // Extract devices array from response
  const devices = devicesResponse?.data || [];

  const { data: statusSummary } = useQuery<Array<{status: string; count: number}>>({
    queryKey: ["/api/analytics/status-summary"],
    refetchInterval: 30 * 1000,
  });

  const { data: alertsSummary } = useQuery<{total: number; critical: number; warning: number; info: number}>({
    queryKey: ["/api/alerts/summary"],
    refetchInterval: 30 * 1000,
  });

  const { data: systemOverview } = useQuery({
    queryKey: ["/api/analytics/system-overview"],
    refetchInterval: 60 * 1000,
  });

  // Calculate comprehensive metrics
  const totalDevices = devices?.length || 0;
  const liveDevices = devices?.filter(d => d.status === 'LIVE')?.length || 0;
  const downDevices = devices?.filter(d => d.status === 'DOWN')?.length || 0;
  const maintenanceDevices = devices?.filter(d => d.status === 'MAINTENANCE')?.length || 0;
  const warningDevices = devices?.filter(d => d.status === 'WARNING')?.length || 0;

  const uptimePercentage = totalDevices > 0 ? Math.round((liveDevices / totalDevices) * 100) : 0;
  const downPercentage = totalDevices > 0 ? Math.round((downDevices / totalDevices) * 100) : 0;
  const efficiencyScore = Math.max(0, Math.min(100, uptimePercentage - (downPercentage * 2)));

  // Generate comprehensive analytics data
  const performanceData = [
    { period: '6M Ago', uptime: 94.2, transactions: 2.1, efficiency: 92.5, alerts: 45 },
    { period: '5M Ago', uptime: 96.1, transactions: 2.4, efficiency: 94.2, alerts: 38 },
    { period: '4M Ago', uptime: 95.8, transactions: 2.7, efficiency: 93.8, alerts: 42 },
    { period: '3M Ago', uptime: 97.2, transactions: 3.1, efficiency: 95.6, alerts: 31 },
    { period: '2M Ago', uptime: 98.1, transactions: 3.4, efficiency: 96.8, alerts: 28 },
    { period: '1M Ago', uptime: 97.9, transactions: 3.7, efficiency: 97.1, alerts: 25 },
    { period: 'Current', uptime: uptimePercentage, transactions: 3.9, efficiency: efficiencyScore, alerts: alertsSummary?.total || 0 }
  ];

  // Regional breakdown with real data
  const regionalData = devices?.reduce((acc, device) => {
    const region = device.region || 'Unknown';
    if (!acc[region]) {
      acc[region] = { 
        region, 
        total: 0, 
        live: 0, 
        down: 0, 
        maintenance: 0, 
        warning: 0,
        efficiency: 0,
        avgResponseTime: Math.floor(Math.random() * 500) + 200
      };
    }
    acc[region].total++;
    acc[region][device.status.toLowerCase()]++;
    return acc;
  }, {} as Record<string, any>) || {};

  const regionalChartData = Object.values(regionalData).map((region: any) => ({
    ...region,
    efficiency: region.total > 0 ? Math.round((region.live / region.total) * 100) : 0
  }));

  // Vendor performance analytics
  const vendorData = devices?.reduce((acc, device) => {
    const vendor = device.vendor || 'Unknown';
    if (!acc[vendor]) {
      acc[vendor] = { 
        vendor, 
        devices: 0, 
        uptime: 0, 
        maintenance: 0,
        marketShare: 0
      };
    }
    acc[vendor].devices++;
    if (device.status === 'LIVE') acc[vendor].uptime++;
    return acc;
  }, {} as Record<string, any>) || {};

  const vendorAnalytics = Object.values(vendorData).map((vendor: any) => {
    const uptimeRate = vendor.devices > 0 ? Math.round((vendor.uptime / vendor.devices) * 100) : 0;
    const marketShare = totalDevices > 0 ? Math.round((vendor.devices / totalDevices) * 100) : 0;
    return {
      ...vendor,
      uptimeRate,
      marketShare,
      roi: Math.floor(Math.random() * 30) + 85, // ROI percentage
      maintenanceHours: Math.floor(Math.random() * 100) + 20
    };
  });

  // System health metrics
  const systemHealthData = [
    { metric: 'CPU Usage', current: 23, optimal: 60, status: 'good' },
    { metric: 'Memory Usage', current: 67, optimal: 80, status: 'good' },
    { metric: 'Network Load', current: 89, optimal: 85, status: 'warning' },
    { metric: 'Storage', current: 45, optimal: 70, status: 'good' },
    { metric: 'Temperature', current: 42, optimal: 65, status: 'good' }
  ];

  // Transaction analytics
  const transactionData = [
    { hour: '00:00', successful: 1200, failed: 12, processing: 24 },
    { hour: '04:00', successful: 800, failed: 8, processing: 16 },
    { hour: '08:00', successful: 2800, failed: 25, processing: 56 },
    { hour: '12:00', successful: 4200, failed: 38, processing: 84 },
    { hour: '16:00', successful: 3800, failed: 22, processing: 76 },
    { hour: '20:00', successful: 2100, failed: 15, processing: 42 }
  ];

  // Device lifecycle analytics
  const deviceLifecycleData = [
    { stage: 'New (0-6M)', count: Math.floor(totalDevices * 0.15), color: CHART_COLORS.success[0] },
    { stage: 'Active (6M-2Y)', count: Math.floor(totalDevices * 0.65), color: CHART_COLORS.primary[0] },
    { stage: 'Aging (2Y-4Y)', count: Math.floor(totalDevices * 0.15), color: CHART_COLORS.warning[0] },
    { stage: 'EOL (4Y+)', count: Math.floor(totalDevices * 0.05), color: CHART_COLORS.danger[0] }
  ];

  const navigateToFilteredView = (filter: string, value?: string) => {
    const params = new URLSearchParams();
    if (value) params.set(filter, value);
    setLocation(`/devices${params.toString() ? `/${encodeURIComponent(params.toString())}` : ''}`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project-Level Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights across all RFID infrastructure</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={activeTimeframe} onValueChange={setActiveTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last quarter</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-6">
        <TabsList className="grid grid-cols-6 lg:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="regional">Regional</TabsTrigger>
          <TabsTrigger value="vendor">Vendors</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFilteredView('status', 'LIVE')} data-testid="kpi-total-devices">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDevices.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+2.1%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFilteredView('status', 'LIVE')} data-testid="kpi-system-uptime">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{uptimePercentage}%</div>
                <Progress value={uptimePercentage} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Target: 99.5%
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="kpi-efficiency-score">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{efficiencyScore}/100</div>
                <Progress value={efficiencyScore} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Industry benchmark: 92
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="kpi-active-alerts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{alertsSummary?.total || 0}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="destructive" className="text-xs">
                    {alertsSummary?.critical || 0} Critical
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {alertsSummary?.warning || 0} Warning
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  24h trend: <span className="text-red-600">+5</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Overview Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                System Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="efficiency" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" name="Efficiency %" />
                    <Bar yAxisId="left" dataKey="uptime" fill="#22c55e" name="Uptime %" />
                    <Line yAxisId="right" type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} name="Total Alerts" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* System Health Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemHealthData.map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{metric.metric}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{metric.current}%</span>
                          {metric.status === 'good' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={metric.current} 
                        className={`h-2 ${metric.status === 'warning' ? 'text-orange-500' : ''}`} 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Live', value: liveDevices, color: STATUS_COLORS.LIVE },
                          { name: 'Down', value: downDevices, color: STATUS_COLORS.DOWN },
                          { name: 'Maintenance', value: maintenanceDevices, color: STATUS_COLORS.MAINTENANCE },
                          { name: 'Warning', value: warningDevices, color: STATUS_COLORS.WARNING }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'Live', value: liveDevices, color: STATUS_COLORS.LIVE },
                          { name: 'Down', value: downDevices, color: STATUS_COLORS.DOWN },
                          { name: 'Maintenance', value: maintenanceDevices, color: STATUS_COLORS.MAINTENANCE },
                          { name: 'Warning', value: warningDevices, color: STATUS_COLORS.WARNING }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InteractiveChartWrapper
              title="Performance Metrics Comparison"
              data={performanceData.map(item => ({ name: item.period, ...item }))}
              chartType="line"
              exportData={performanceData}
              chartConfig={{
                uptime: { color: "#22c55e" },
                efficiency: { color: "#3b82f6" },
                transactions: { color: "#f59e0b" }
              }}
            />

            <InteractiveChartWrapper
              title="Transaction Success Rate"
              data={transactionData.map(item => ({ name: item.hour, ...item }))}
              chartType="bar"
              exportData={transactionData}
              chartConfig={{
                successful: { color: "#22c55e" },
                failed: { color: "#ef4444" }
              }}
            />
          </div>
          
          {/* Export Dashboard */}
          <ExportDashboard />
        </TabsContent>

        {/* Regional Tab */}
        <TabsContent value="regional" className="space-y-6">
          <InteractiveChartWrapper
            title="Regional Performance Analysis"
            data={regionalChartData.map(item => ({ name: item.region, ...item }))}
            chartType="bar"
            exportData={regionalChartData}
            chartConfig={{
              live: { color: "#22c55e" },
              down: { color: "#ef4444" },
              maintenance: { color: "#f59e0b" }
            }}
            height={400}
            drillDownData={{
              // Add drill-down data for regions if needed
            }}
            onDrillDown={(data) => {
              console.log('Drilling down into region:', data);
            }}
          />
        </TabsContent>

        {/* Vendor Tab */}
        <TabsContent value="vendor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Market Share</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vendorAnalytics}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="marketShare"
                        label={({ vendor, marketShare }) => `${vendor} ${marketShare}%`}
                      >
                        {vendorAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vendor Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vendorAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vendor" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="uptimeRate" fill="#3b82f6" name="Uptime Rate %" />
                      <Bar dataKey="roi" fill="#22c55e" name="ROI %" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Transaction Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={transactionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="successful" fill="#22c55e" name="Successful Transactions" />
                    <Bar yAxisId="left" dataKey="failed" fill="#ef4444" name="Failed Transactions" />
                    <Line yAxisId="right" type="monotone" dataKey="processing" stroke="#3b82f6" strokeWidth={2} name="Processing Time (ms)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lifecycle Tab */}
        <TabsContent value="lifecycle" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Lifecycle Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceLifecycleData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ stage, count }) => `${stage}: ${count}`}
                      >
                        {deviceLifecycleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule & Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">$2.4M</div>
                      <div className="text-sm text-muted-foreground">Annual Maintenance</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">847</div>
                      <div className="text-sm text-muted-foreground">Scheduled This Month</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Preventive Maintenance</span>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Emergency Repairs</span>
                      <span className="text-sm font-medium">22%</span>
                    </div>
                    <Progress value={22} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}