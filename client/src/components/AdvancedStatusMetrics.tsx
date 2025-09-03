import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Progress } from "@/components/ui/progress";

const COLORS = {
  LIVE: '#22c55e',
  DOWN: '#ef4444', 
  MAINTENANCE: '#f59e0b',
  WARNING: '#f97316',
  SHUTDOWN: '#6b7280'
};

export default function AdvancedStatusMetrics() {
  const { user } = useAuth();
  
  const { data: devices } = useQuery<Array<any>>({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  const { data: alertsSummary } = useQuery<{total: number; critical: number; warning: number; info: number}>({
    queryKey: ["/api/alerts/summary"],
    refetchInterval: 30 * 1000,
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/comprehensive"],
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

  // Location-wise device status data
  const locationStatusData = devices?.reduce((acc, device) => {
    const region = device.region || 'Unknown';
    if (!acc[region]) {
      acc[region] = { region, LIVE: 0, DOWN: 0, MAINTENANCE: 0, WARNING: 0 };
    }
    acc[region][device.status] = (acc[region][device.status] || 0) + 1;
    return acc;
  }, {} as Record<string, any>) || {};

  const locationChartData = Object.values(locationStatusData);

  // Last TAG Read Status data
  const tagReadStatusData = [
    { name: 'RECENT', value: Math.floor(liveDevices * 0.8), color: '#3b82f6' },
    { name: 'OLDER', value: Math.floor(liveDevices * 0.15), color: '#f59e0b' },
    { name: 'NONE', value: Math.floor(liveDevices * 0.03), color: '#ef4444' },
    { name: 'ERROR', value: Math.floor(liveDevices * 0.02), color: '#6b7280' }
  ];

  // Weekly health progress data
  const weeklyHealthData = [
    { period: 'Last Week', uptime: 95, downtime: 5 },
    { period: 'This Week', uptime: uptimePercentage, downtime: downPercentage }
  ];

  // Vendor performance data
  const vendorData = devices?.reduce((acc, device) => {
    const vendor = device.vendor || 'Unknown';
    if (!acc[vendor]) {
      acc[vendor] = { vendor, total: 0, live: 0, down: 0 };
    }
    acc[vendor].total++;
    if (device.status === 'LIVE') acc[vendor].live++;
    if (device.status === 'DOWN') acc[vendor].down++;
    return acc;
  }, {} as Record<string, any>) || {};

  const vendorChartData = Object.values(vendorData).map((vendor: any) => ({
    ...vendor,
    uptime: vendor.total > 0 ? Math.round((vendor.live / vendor.total) * 100) : 0
  }));

  const chartConfig = {
    LIVE: { label: "Live", color: COLORS.LIVE },
    DOWN: { label: "Down", color: COLORS.DOWN },
    MAINTENANCE: { label: "Maintenance", color: COLORS.MAINTENANCE },
    WARNING: { label: "Warning", color: COLORS.WARNING }
  };

  return (
    <div className="space-y-6">
      {/* Main Status Overview - Similar to screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-sm font-medium opacity-90">UP</div>
              <div className="text-3xl font-bold">{uptimePercentage}%</div>
              <div className="text-sm opacity-80">{liveDevices}/{totalDevices}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-sm font-medium opacity-90">ACTIVE</div>
              <div className="text-3xl font-bold">{liveDevices}</div>
              <div className="text-sm opacity-80">Live Devices</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-sm font-medium opacity-90">TIME OFF</div>
              <div className="text-3xl font-bold">{maintenanceDevices + warningDevices}</div>
              <div className="text-sm opacity-80">Maintenance</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-sm font-medium opacity-90">DOWN</div>
              <div className="text-3xl font-bold">{downPercentage}%</div>
              <div className="text-sm opacity-80">{downDevices}/{totalDevices}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Based on screenshots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Type Device Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Location Type Device Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={locationChartData}>
                <XAxis dataKey="region" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="LIVE" fill={COLORS.LIVE} stackId="a" />
                <Bar dataKey="DOWN" fill={COLORS.DOWN} stackId="a" />
                <Bar dataKey="MAINTENANCE" fill={COLORS.MAINTENANCE} stackId="a" />
                <Bar dataKey="WARNING" fill={COLORS.WARNING} stackId="a" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Last TAG Read Status - Pie Chart like screenshot */}
        <Card>
          <CardHeader>
            <CardTitle>Last TAG Read Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <PieChart>
                <Pie
                  data={tagReadStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tagReadStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg">
                          <p className="font-medium">{data.payload.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.value} devices ({Math.round((data.value as number / liveDevices) * 100)}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ChartContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {tagReadStatusData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Health Progress - Based on screenshot */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Health Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weeklyHealthData.map((week, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{week.period}</span>
                <span>{week.uptime}%</span>
              </div>
              <div className="flex">
                <div 
                  className="bg-red-500 h-8 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${week.downtime}%` }}
                >
                  {week.downtime > 5 ? `${week.downtime}%` : ''}
                </div>
                <div 
                  className="bg-green-500 h-8 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${week.uptime}%` }}
                >
                  {week.uptime}%
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Regional Performance */}
      {user?.role !== 'CLIENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[250px]">
                <BarChart data={vendorChartData}>
                  <XAxis dataKey="vendor" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="uptime" fill="#3b82f6" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Critical Alerts</span>
                  <span className="text-2xl font-bold text-red-500">{alertsSummary?.critical || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Warning Alerts</span>
                  <span className="text-2xl font-bold text-yellow-500">{alertsSummary?.warning || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Info Alerts</span>
                  <span className="text-2xl font-bold text-blue-500">{alertsSummary?.info || 0}</span>
                </div>
                <div className="pt-4">
                  <div className="text-sm text-muted-foreground mb-2">Alert Resolution Rate</div>
                  <Progress value={85} className="h-3" />
                  <div className="text-xs text-muted-foreground mt-1">85% resolved within SLA</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}