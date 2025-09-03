import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const COLORS = {
  RECENT: '#3b82f6',
  WEEK_OLD: '#10b981', 
  MONTH_OLD: '#f59e0b',
  OLD: '#ef4444',
  NONE: '#6b7280'
};

const REGISTRATION_COLORS = {
  SUCCESS: '#22c55e',
  FAILED: '#ef4444',
  PENDING: '#f59e0b',
  EXPIRED: '#6b7280'
};

export default function LastTagStatus() {
  const [timeFrame, setTimeFrame] = useState("12"); // 12 or 18 months
  const [view, setView] = useState("tag"); // tag or registration

  // Fetch Last TAG Read Status data
  const { data: tagStatusData, isLoading: tagLoading } = useQuery({
    queryKey: [`/api/analytics/tag-status/${timeFrame}`],
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch Last Registration Status data
  const { data: registrationData, isLoading: regLoading } = useQuery({
    queryKey: [`/api/analytics/registration-status/${timeFrame}`],
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch historical trends
  const { data: historicalData } = useQuery({
    queryKey: [`/api/analytics/tag-trends/${timeFrame}`],
    refetchInterval: 10 * 60 * 1000,
  });

  const isLoading = tagLoading || regLoading;

  // Process TAG Read Status data for pie chart
  const tagPieData = tagStatusData ? [
    { name: 'RECENT', label: 'Recent (< 24h)', value: tagStatusData.recent || 0, color: COLORS.RECENT },
    { name: 'WEEK_OLD', label: 'Week Old', value: tagStatusData.weekOld || 0, color: COLORS.WEEK_OLD },
    { name: 'MONTH_OLD', label: 'Month Old', value: tagStatusData.monthOld || 0, color: COLORS.MONTH_OLD },
    { name: 'OLD', label: `Old (>${timeFrame}mo)`, value: tagStatusData.old || 0, color: COLORS.OLD },
    { name: 'NONE', label: 'No Reads', value: tagStatusData.none || 0, color: COLORS.NONE }
  ] : [];

  // Process Registration Status data
  const registrationPieData = registrationData ? [
    { name: 'SUCCESS', label: 'Successful', value: registrationData.success || 0, color: REGISTRATION_COLORS.SUCCESS },
    { name: 'FAILED', label: 'Failed', value: registrationData.failed || 0, color: REGISTRATION_COLORS.FAILED },
    { name: 'PENDING', label: 'Pending', value: registrationData.pending || 0, color: REGISTRATION_COLORS.PENDING },
    { name: 'EXPIRED', label: 'Expired', value: registrationData.expired || 0, color: REGISTRATION_COLORS.EXPIRED }
  ] : [];

  // Regional breakdown data
  const regionalData = tagStatusData?.byRegion ? Object.entries(tagStatusData.byRegion).map(([region, data]: [string, any]) => ({
    region,
    recent: data.recent || 0,
    weekOld: data.weekOld || 0,
    monthOld: data.monthOld || 0,
    old: data.old || 0
  })) : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last TAG Read & Registration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentData = view === "tag" ? tagPieData : registrationPieData;
  const currentColors = view === "tag" ? COLORS : REGISTRATION_COLORS;

  const total = currentData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Last TAG Read & Registration Status</CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={view} onValueChange={setView}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tag">TAG Reads</SelectItem>
                  <SelectItem value="registration">Registrations</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFrame} onValueChange={setTimeFrame}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 Months</SelectItem>
                  <SelectItem value="18">18 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <ChartContainer config={{}} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={currentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {currentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        const percentage = total > 0 ? Math.round((data.value as number / total) * 100) : 0;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.payload.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.value} devices ({percentage}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ChartContainer>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium">
                {view === "tag" ? "TAG Read" : "Registration"} Status Breakdown
              </h4>
              <div className="space-y-3">
                {currentData.map((item, index) => {
                  const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Total Count */}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Devices</span>
                  <span className="text-xl font-bold">{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Breakdown */}
      {view === "tag" && regionalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Regional TAG Read Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              recent: { label: "Recent", color: COLORS.RECENT },
              weekOld: { label: "Week Old", color: COLORS.WEEK_OLD },
              monthOld: { label: "Month Old", color: COLORS.MONTH_OLD },
              old: { label: "Old", color: COLORS.OLD }
            }} className="h-[300px]">
              <BarChart data={regionalData}>
                <XAxis dataKey="region" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="recent" fill={COLORS.RECENT} stackId="a" />
                <Bar dataKey="weekOld" fill={COLORS.WEEK_OLD} stackId="a" />
                <Bar dataKey="monthOld" fill={COLORS.MONTH_OLD} stackId="a" />
                <Bar dataKey="old" fill={COLORS.OLD} stackId="a" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Historical Trends */}
      {historicalData && historicalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {view === "tag" ? "TAG Read" : "Registration"} Trends (Last {timeFrame} Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              recent: { label: "Recent Reads", color: "#22c55e" },
              old: { label: "Old/No Reads", color: "#ef4444" }
            }} className="h-[250px]">
              <AreaChart data={historicalData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="recent" 
                  stackId="1" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="old" 
                  stackId="1" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {view === "tag" && tagStatusData && (tagStatusData.old > 0 || tagStatusData.none > 0) && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tagStatusData.old > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Devices with old TAG reads need attention</span>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    {tagStatusData.old} devices
                  </Badge>
                </div>
              )}
              {tagStatusData.none > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Devices with no TAG reads require investigation</span>
                  <Badge variant="destructive">
                    {tagStatusData.none} devices
                  </Badge>
                </div>
              )}
              <div className="flex space-x-2 pt-2">
                <Button size="sm" variant="outline">
                  Generate Report
                </Button>
                <Button size="sm" variant="outline">
                  Schedule Maintenance
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}