import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { 
  Activity, 
  Users, 
  Shield, 
  Settings, 
  MapPin, 
  Cpu, 
  Thermometer, 
  Cloud, 
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  Database,
  Wifi,
  Battery
} from "lucide-react";

interface RoleStats {
  general?: {
    totalUsers: number;
    activeUsers: number;
    systemHealth: number;
    criticalAlerts: number;
    monthlyUptime: number;
    maintenanceReduction: number;
    responseTimeImprovement: number;
  };
  engineer?: {
    assignedDevices: number;
    regionalUptime: number;
    resolvedIssues: number;
    avgResponseTime: number;
    regionPerformance: number;
    pendingTasks: number;
    weeklyProgress: number;
  };
  admin?: {
    devicesManaged: number;
    configChanges: number;
    maintenanceScheduled: number;
    systemConfigScore: number;
    securityScore: number;
    automationLevel: number;
    performanceGains: number;
  };
  client?: {
    serviceAvailability: number;
    dataAccuracy: number;
    reportingHealth: number;
    dashboardUsage: number;
    alertsViewed: number;
    lastUpdateTime: string;
  };
}

export default function RoleSpecificStats() {
  const { user } = useAuth();
  
  const { data: roleStats, isLoading } = useQuery<RoleStats>({
    queryKey: ["/api/role-stats"],
    refetchInterval: 60 * 1000, // Update every minute
  });

  const { data: weatherImpact } = useQuery({
    queryKey: ["/api/weather-impact"],
    refetchInterval: 15 * 60 * 1000, // Update every 15 minutes
  });

  if (isLoading || !user) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // NEC General Role Statistics
  if (user.role === 'NEC_GENERAL' && roleStats?.general) {
    return (
      <div className="space-y-6">
        {/* Executive Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {roleStats.general.systemHealth}%
              </div>
              <div className="space-y-2">
                <Progress value={roleStats.general.systemHealth} className="h-2" />
                <p className="text-xs text-blue-600">
                  Optimal performance across all regions
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {roleStats.general.monthlyUptime}%
              </div>
              <div className="space-y-2">
                <Progress value={roleStats.general.monthlyUptime} className="h-2" />
                <p className="text-xs text-green-600">
                  +2.3% from last month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {roleStats.general.activeUsers}/{roleStats.general.totalUsers}
              </div>
              <p className="text-xs text-orange-600">
                {Math.round((roleStats.general.activeUsers / roleStats.general.totalUsers) * 100)}% user engagement
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {roleStats.general.criticalAlerts}
              </div>
              <p className="text-xs text-red-600">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Business Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Maintenance Reduction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-600">
                {roleStats.general.maintenanceReduction}%
              </div>
              <p className="text-xs text-muted-foreground">Fewer field visits required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-purple-600">
                {roleStats.general.responseTimeImprovement}%
              </div>
              <p className="text-xs text-muted-foreground">Faster issue resolution</p>
            </CardContent>
          </Card>
        </div>

        {/* Weather Impact Panel */}
        {weatherImpact && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-amber-600" />
                Weather Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-lg font-bold text-amber-700">
                    {weatherImpact.affectedRegions}
                  </div>
                  <p className="text-xs text-amber-600">Regions at risk</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-amber-700">
                    {weatherImpact.protectedDevices}
                  </div>
                  <p className="text-xs text-amber-600">Devices protected</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-amber-700">
                    {weatherImpact.alertsGenerated}
                  </div>
                  <p className="text-xs text-amber-600">Proactive alerts</p>
                </div>
                <div>
                  <Badge variant={weatherImpact.riskLevel === 'HIGH' ? 'destructive' : 'outline'}>
                    {weatherImpact.riskLevel} RISK
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // NEC Engineer Role Statistics
  if (user.role === 'NEC_ENGINEER' && roleStats?.engineer) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Devices</CardTitle>
              <MapPin className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {roleStats.engineer.assignedDevices}
              </div>
              <p className="text-xs text-blue-600">
                In your region
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regional Uptime</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {roleStats.engineer.regionalUptime}%
              </div>
              <div className="space-y-2">
                <Progress value={roleStats.engineer.regionalUptime} className="h-2" />
                <p className="text-xs text-green-600">
                  Above target (95%)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues Resolved</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {roleStats.engineer.resolvedIssues}
              </div>
              <p className="text-xs text-purple-600">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {roleStats.engineer.avgResponseTime}m
              </div>
              <p className="text-xs text-orange-600">
                -15% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Performance</span>
                  <span className="text-sm font-medium">{roleStats.engineer.weeklyProgress}%</span>
                </div>
                <Progress value={roleStats.engineer.weeklyProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {roleStats.engineer.pendingTasks}
              </div>
              <p className="text-xs text-muted-foreground">
                Tasks requiring attention
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // NEC Admin Role Statistics
  if (user.role === 'NEC_ADMIN' && roleStats?.admin) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-indigo-200 bg-indigo-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices Managed</CardTitle>
              <Database className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">
                {roleStats.admin.devicesManaged}
              </div>
              <p className="text-xs text-indigo-600">
                Under your control
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Config Changes</CardTitle>
              <Settings className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {roleStats.admin.configChanges}
              </div>
              <p className="text-xs text-green-600">
                This week
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {roleStats.admin.securityScore}%
              </div>
              <div className="space-y-2">
                <Progress value={roleStats.admin.securityScore} className="h-2" />
                <p className="text-xs text-blue-600">
                  Excellent security posture
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Automation Level</CardTitle>
              <Zap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {roleStats.admin.automationLevel}%
              </div>
              <p className="text-xs text-purple-600">
                Processes automated
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Health Score</span>
                  <span className="text-sm font-medium">{roleStats.admin.systemConfigScore}%</span>
                </div>
                <Progress value={roleStats.admin.systemConfigScore} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance Gains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                +{roleStats.admin.performanceGains}%
              </div>
              <p className="text-xs text-muted-foreground">
                From optimization
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Maintenance Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {roleStats.admin.maintenanceScheduled}
              </div>
              <p className="text-xs text-muted-foreground">
                Upcoming activities
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // CLIENT Role Statistics
  if (user.role === 'CLIENT' && roleStats?.client) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Availability</CardTitle>
              <Wifi className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {roleStats.client.serviceAvailability}%
              </div>
              <div className="space-y-2">
                <Progress value={roleStats.client.serviceAvailability} className="h-2" />
                <p className="text-xs text-green-600">
                  Excellent service level
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Accuracy</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {roleStats.client.dataAccuracy}%
              </div>
              <p className="text-xs text-blue-600">
                Reliable data quality
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dashboard Usage</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {roleStats.client.dashboardUsage}h
              </div>
              <p className="text-xs text-purple-600">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts Viewed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {roleStats.client.alertsViewed}
              </div>
              <p className="text-xs text-orange-600">
                Recent activity
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">System Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Reporting Health</span>
                  <span className="text-sm font-medium">{roleStats.client.reportingHealth}%</span>
                </div>
                <Progress value={roleStats.client.reportingHealth} className="h-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Last Updated: {new Date(roleStats.client.lastUpdateTime).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}