"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  ComposedChart,
} from "recharts"
import InteractiveChartWrapper from "./InteractiveChartWrapper"
import ExportDashboard from "./ExportDashboard"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  TrendingUp,
  Activity,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChartIcon,
  Download,
  Info,
  RefreshCw,
  Eye,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MapPin,
} from "lucide-react"
import { useLocation } from "wouter"

const CHART_COLORS = {
  primary: ["#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a"],
  success: ["#16a34a", "#15803d", "#166534", "#14532d"],
  warning: ["#ea580c", "#dc2626", "#b91c1c", "#991b1b"],
  danger: ["#dc2626", "#b91c1c", "#991b1b", "#7f1d1d"],
  neutral: ["#64748b", "#475569", "#334155", "#1e293b"],
  info: ["#0ea5e9", "#0284c7", "#0369a1", "#075985"],
}

const STATUS_COLORS = {
  LIVE: "#16a34a",
  DOWN: "#dc2626",
  MAINTENANCE: "#ea580c",
  WARNING: "#f59e0b",
  SHUTDOWN: "#64748b",
}

const STATUS_CONFIG = {
  LIVE: { color: "#16a34a", bgColor: "#dcfce7", icon: CheckCircle, label: "Online" },
  DOWN: { color: "#dc2626", bgColor: "#fef2f2", icon: AlertTriangle, label: "Offline" },
  MAINTENANCE: { color: "#ea580c", bgColor: "#fff7ed", icon: Settings, label: "Maintenance" },
  WARNING: { color: "#f59e0b", bgColor: "#fefce8", icon: AlertTriangle, label: "Warning" },
  SHUTDOWN: { color: "#64748b", bgColor: "#f8fafc", icon: Minus, label: "Shutdown" },
}

export default function ProjectLevelAnalytics() {
  const [activeTimeframe, setActiveTimeframe] = useState("7d")
  const [selectedMetric, setSelectedMetric] = useState("overview")
  const [, setLocation] = useLocation()
  const { user } = useAuth()

  // Fetch real data from APIs
  // const { data: devicesResponse, isLoading: devicesLoading } = useQuery<{ success: boolean; data: any[] }>({
  //   queryKey: ["/api/devices"],
  //   refetchInterval: 30 * 1000,
  // })

  
   const { data: devicesResponse, isLoading: devicesLoading } = useQuery<{ success: boolean; data: any[] }>({

    queryKey: ["/api/device-status"],
    refetchInterval: 30 * 1000,
  })


  // Extract devices array from response - check if it's nested
  // const devices = devicesResponse?.success ? devicesResponse.data : devicesResponse?.data || devicesResponse || []

    const data = (devicesResponse as any)?.data || (devicesResponse as any)
  const devices = data?.CAT?.[0]?.LOC?.flatMap((loc: any) => 
    loc.DEVICES?.map((device: any) => ({
      ...device,
      status: device.DeviceStatus === 4 ? 'LIVE' : device.DeviceStatus === 3 ? 'STANDBY' : 'DOWN',
      region: loc.LOCATION_NAME
    })) || []
  ) || []


  const { data: statusSummary, isLoading: statusLoading } = useQuery<Array<{ status: string; count: number }>>({
    queryKey: ["/api/analytics/status-summary"],
    refetchInterval: 30 * 1000,
  })

  const { data: alertsSummary, isLoading: alertsLoading } = useQuery<{
    total: number
    critical: number
    warning: number
    info: number
  }>({
    queryKey: ["/api/alerts/summary"],
    refetchInterval: 30 * 1000,
  })

  const { data: systemOverview, isLoading: systemLoading } = useQuery({
    queryKey: ["/api/analytics/system-overview"],
    refetchInterval: 60 * 1000,
  })

  const isLoading = devicesLoading || statusLoading || alertsLoading || systemLoading

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-muted rounded animate-pulse"></div>
            <div className="h-9 w-24 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                  <div className="h-8 w-16 bg-muted rounded"></div>
                  <div className="h-2 w-full bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-80 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Calculate comprehensive metrics - ensure we're counting actual devices
  const actualDevices = Array.isArray(devices) ? devices : []
  const totalDevices = actualDevices.length
  const liveDevices = actualDevices.filter((d) => d.status === "LIVE").length
  const downDevices = actualDevices.filter((d) => d.status === "DOWN").length
  const maintenanceDevices = actualDevices.filter((d) => d.status === "MAINTENANCE").length
  const warningDevices = actualDevices.filter((d) => d.status === "WARNING").length

  const uptimePercentage = totalDevices > 0 ? Math.round((liveDevices / totalDevices) * 100) : 0
  const downPercentage = totalDevices > 0 ? Math.round((downDevices / totalDevices) * 100) : 0
  const efficiencyScore = Math.max(0, Math.min(100, uptimePercentage - downPercentage * 2))

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, direction: "neutral" as const }
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change),
      direction: change > 0 ? ("up" as const) : change < 0 ? ("down" as const) : ("neutral" as const),
    }
  }

  // Generate comprehensive analytics data with better defaults
  const performanceData = [
    { period: "6M Ago", uptime: 94.2, transactions: 2100, efficiency: 92.5, alerts: 45 },
    { period: "5M Ago", uptime: 96.1, transactions: 2400, efficiency: 94.2, alerts: 38 },
    { period: "4M Ago", uptime: 95.8, transactions: 2700, efficiency: 93.8, alerts: 42 },
    { period: "3M Ago", uptime: 97.2, transactions: 3100, efficiency: 95.6, alerts: 31 },
    { period: "2M Ago", uptime: 98.1, transactions: 3400, efficiency: 96.8, alerts: 28 },
    { period: "1M Ago", uptime: 97.9, transactions: 3700, efficiency: 97.1, alerts: 25 },
    {
      period: "Current",
      uptime: uptimePercentage,
      transactions: 3900,
      efficiency: efficiencyScore,
      alerts: alertsSummary?.total || 32,
    },
  ]

  const uptimeTrend = calculateTrend(uptimePercentage, performanceData[performanceData.length - 2]?.uptime || 0)
  const efficiencyTrend = calculateTrend(efficiencyScore, performanceData[performanceData.length - 2]?.efficiency || 0)
  const alertsTrend = calculateTrend(
    alertsSummary?.total || 0,
    performanceData[performanceData.length - 2]?.alerts || 0,
  )

  // Regional breakdown by NEWS (North, East, West, South)
  const regionalChartData = [
    {
      region: 'North',
      total: 1234,
      live: 1219,
      down: 8,
      maintenance: 7,
      warning: 0,
      efficiency: 98.8,
      uptime: 98.8,
      alerts: 8,
      performance: 95.4
    },
    {
      region: 'East', 
      total: 474,
      live: 464,
      down: 7,
      maintenance: 3,
      warning: 0,
      efficiency: 97.9,
      uptime: 97.9,
      alerts: 15,
      performance: 94.1
    },
    {
      region: 'West',
      total: 1845,
      live: 1830,
      down: 10,
      maintenance: 5,
      warning: 0,
      efficiency: 99.2,
      uptime: 99.2,
      alerts: 12,
      performance: 96.8
    },
    {
      region: 'South',
      total: 1567,
      live: 1559,
      down: 5,
      maintenance: 3,
      warning: 0,
      efficiency: 99.5,
      uptime: 99.5,
      alerts: 5,
      performance: 97.2
    }
  ]

  // Vendor performance analytics with dummy data
  const vendorAnalytics = [
    {
      vendor: "BCIL",
      devices: 2890,
      uptime: 98.9,
      performance: 94.8,
      satisfaction: 94,
      marketShare: 58,
      uptimeRate: 98.9,
      roi: 95
    },
    {
      vendor: "ZEBRA", 
      devices: 1234,
      uptime: 97.8,
      performance: 93.1,
      satisfaction: 92,
      marketShare: 25,
      uptimeRate: 97.8,
      roi: 92
    },
    {
      vendor: "IMP",
      devices: 756,
      uptime: 96.5,
      performance: 91.7,
      satisfaction: 89,
      marketShare: 15,
      uptimeRate: 96.5,
      roi: 89
    },
    {
      vendor: "ANJ",
      devices: 240,
      uptime: 95.2,
      performance: 89.4,
      satisfaction: 87,
      marketShare: 5,
      uptimeRate: 95.2,
      roi: 87
    }
  ]

  // System health metrics with dynamic data
  const systemHealthData = [
    {
      metric: "CPU Usage",
      current: Math.min(95, 20 + downDevices * 5),
      optimal: 60,
      status: downDevices > 5 ? "warning" : "good",
    },
    {
      metric: "Memory Usage",
      current: Math.min(90, 55 + totalDevices / 10),
      optimal: 80,
      status: totalDevices > 70 ? "warning" : "good",
    },
    {
      metric: "Network Load",
      current: Math.min(95, 60 + liveDevices / 5),
      optimal: 85,
      status: liveDevices > 60 ? "warning" : "good",
    },
    { metric: "Storage Usage", current: Math.min(85, 35 + actualDevices.length / 10), optimal: 70, status: "good" },
    {
      metric: "Temperature",
      current: Math.min(75, 35 + warningDevices * 2),
      optimal: 65,
      status: warningDevices > 10 ? "warning" : "good",
    },
    {
      metric: "Network Latency",
      current: Math.max(15, 45 - uptimePercentage / 3),
      optimal: 30,
      status: uptimePercentage > 95 ? "good" : "warning",
    },
  ]

  // Transaction analytics
  const transactionData = [
    { hour: "00:00", successful: 1200, failed: 12, processing: 24 },
    { hour: "04:00", successful: 800, failed: 8, processing: 16 },
    { hour: "08:00", successful: 2800, failed: 25, processing: 56 },
    { hour: "12:00", successful: 4200, failed: 38, processing: 84 },
    { hour: "16:00", successful: 3800, failed: 22, processing: 76 },
    { hour: "20:00", successful: 2100, failed: 15, processing: 42 },
  ]

  // Device lifecycle analytics
  const deviceLifecycleData = [
    { stage: "New (0-6M)", count: Math.floor(totalDevices * 0.15), color: CHART_COLORS.success[0] },
    { stage: "Active (6M-2Y)", count: Math.floor(totalDevices * 0.65), color: CHART_COLORS.primary[0] },
    { stage: "Aging (2Y-4Y)", count: Math.floor(totalDevices * 0.15), color: CHART_COLORS.warning[0] },
    { stage: "EOL (4Y+)", count: Math.floor(totalDevices * 0.05), color: CHART_COLORS.danger[0] },
  ]

  const navigateToFilteredView = (filter: string, value?: string) => {
    const params = new URLSearchParams()
    if (value) params.set(filter, value)
    setLocation(`/devices${params.toString() ? `/${encodeURIComponent(params.toString())}` : ""}`)
  }

  const KPICard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "blue",
    onClick,
    tooltip,
    progress,
  }: {
    title: string
    value: string | number
    subtitle?: string
    icon: any
    trend?: { value: number; direction: "up" | "down" | "neutral" }
    color?: string
    onClick?: () => void
    tooltip?: string
    progress?: number
  }) => (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
        color === "green"
          ? "border-l-green-500 hover:border-l-green-600"
          : color === "red"
            ? "border-l-red-500 hover:border-l-red-600"
            : color === "orange"
              ? "border-l-orange-500 hover:border-l-orange-600"
              : "border-l-blue-500 hover:border-l-blue-600"
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {tooltip && (
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-balance">{tooltip}</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          )}
        </div>
        <Icon
          className={`h-5 w-5 ${
            color === "green"
              ? "text-green-500"
              : color === "red"
                ? "text-red-500"
                : color === "orange"
                  ? "text-orange-500"
                  : "text-blue-500"
          }`}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <div
            className={`text-3xl font-bold ${
              color === "green"
                ? "text-green-600"
                : color === "red"
                  ? "text-red-600"
                  : color === "orange"
                    ? "text-orange-600"
                    : "text-blue-600"
            }`}
          >
            {value}
          </div>
          {trend && trend.direction !== "neutral" && (
            <div
              className={`flex items-center text-sm ${trend.direction === "up" ? "text-green-600" : "text-red-600"}`}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {trend.value.toFixed(1)}%
            </div>
          )}
        </div>

        {progress !== undefined && (
          <Progress
            value={progress}
            className={`h-2 ${
              color === "green"
                ? "[&>div]:bg-green-500"
                : color === "red"
                  ? "[&>div]:bg-red-500"
                  : color === "orange"
                    ? "[&>div]:bg-orange-500"
                    : "[&>div]:bg-blue-500"
            }`}
          />
        )}

        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">Comprehensive insights across your RFID infrastructure</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last updated: {new Date().toLocaleTimeString()}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select value={activeTimeframe} onValueChange={setActiveTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last quarter</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Eye className="w-4 h-4" />
            View Details
          </Button>

          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 lg:w-fit bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Performance
          </TabsTrigger>
          <TabsTrigger value="regional" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Regional
          </TabsTrigger>
          <TabsTrigger value="vendor" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Vendors
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Lifecycle
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Devices"
              value={totalDevices.toLocaleString()}
              subtitle={`${liveDevices} online • ${Math.round((liveDevices / totalDevices) * 100)}% uptime`}
              icon={Database}
              color="blue"
              onClick={() => navigateToFilteredView("status", "LIVE")}
              tooltip="Total number of RFID devices deployed across all regions"
            />

            <KPICard
              title="System Health"
              value={`${uptimePercentage}%`}
              subtitle="Target: 99.5%"
              icon={CheckCircle}
              color="green"
              trend={uptimeTrend}
              progress={uptimePercentage}
              onClick={() => navigateToFilteredView("status", "LIVE")}
              tooltip="Percentage of devices currently online and operational"
            />

            <KPICard
              title="Efficiency Score"
              value={`${efficiencyScore}/100`}
              subtitle="Industry benchmark: 92"
              icon={Activity}
              color="blue"
              trend={efficiencyTrend}
              progress={efficiencyScore}
              tooltip="Overall system performance score based on uptime and incident response"
            />

            <KPICard
              title="Active Alerts"
              value={alertsSummary?.total || 0}
              subtitle={`${alertsSummary?.critical || 0} critical • ${alertsSummary?.warning || 0} warning`}
              icon={AlertTriangle}
              color={alertsSummary?.critical ? "red" : "orange"}
              trend={alertsTrend}
              tooltip="Number of unresolved alerts requiring immediate attention"
            />
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">System Performance Trends</CardTitle>
                    <p className="text-sm text-muted-foreground">Historical performance metrics over time</p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Trending Up
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[400px] min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="efficiency"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Efficiency %"
                    />
                    <Bar yAxisId="left" dataKey="uptime" fill="#16a34a" name="Health %" radius={[2, 2, 0, 0]} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="alerts"
                      stroke="#dc2626"
                      strokeWidth={3}
                      dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
                      name="Total Alerts"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Real-time System Health</CardTitle>
                    <p className="text-sm text-muted-foreground">Current system resource utilization</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {systemHealthData.map((metric, index) => (
                    <div key={index} className="space-y-3 p-4 rounded-lg bg-muted/30">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{metric.metric}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{metric.current}%</span>
                          {metric.status === "good" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                      <Progress
                        value={metric.current}
                        className={`h-2 ${metric.status === "warning" ? "[&>div]:bg-orange-500" : "[&>div]:bg-green-500"}`}
                      />
                      <div className="text-xs text-muted-foreground">Optimal: {metric.optimal}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <PieChartIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Device Status</CardTitle>
                    <p className="text-sm text-muted-foreground">Current distribution</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Live", value: liveDevices, color: STATUS_COLORS.LIVE },
                    { name: "Down", value: downDevices, color: STATUS_COLORS.DOWN },
                    { name: "Maintenance", value: maintenanceDevices, color: STATUS_COLORS.MAINTENANCE },
                    { name: "Warning", value: warningDevices, color: STATUS_COLORS.WARNING },
                  ].filter(item => item.value > 0).map((item, index) => {
                    const total = liveDevices + downDevices + maintenanceDevices + warningDevices;
                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.value}</span>
                            <span className="text-muted-foreground">({percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              backgroundColor: item.color, 
                              width: `${percentage}%` 
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance Over Time</CardTitle>
                <p className="text-sm text-muted-foreground">Monthly system health and efficiency trends</p>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="left" domain={[90, 100]} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 50]} />
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          name === 'alerts' ? `${value} alerts` : `${value}%`,
                          name === 'uptime' ? 'System Uptime' :
                          name === 'efficiency' ? 'Efficiency Score' :
                          name === 'alerts' ? 'Active Alerts' : name
                        ]}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="uptime" stroke="#22c55e" strokeWidth={3} name="Uptime %" />
                      <Line yAxisId="left" type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={3} name="Efficiency %" />
                      <Bar yAxisId="right" dataKey="alerts" fill="#ef4444" name="Alerts" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{uptimePercentage}%</div>
                    <div className="text-sm text-muted-foreground">Current Uptime</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{efficiencyScore}%</div>
                    <div className="text-sm text-muted-foreground">Efficiency Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{alertsSummary?.total || 0}</div>
                    <div className="text-sm text-muted-foreground">Active Alerts</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Transaction Pattern</CardTitle>
                <p className="text-sm text-muted-foreground">24-hour transaction success vs failure rates</p>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transactionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          `${value.toLocaleString()} transactions`,
                          name === 'successful' ? 'Successful' :
                          name === 'failed' ? 'Failed' : 'Processing'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="successful" stackId="a" fill="#22c55e" name="Successful" />
                      <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
                      <Bar dataKey="processing" stackId="a" fill="#f59e0b" name="Processing" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">96.8%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">2.1%</div>
                    <div className="text-sm text-muted-foreground">Failure Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">1.1%</div>
                    <div className="text-sm text-muted-foreground">Processing</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Dashboard */}
          <ExportDashboard />
        </TabsContent>

        {/* Regional Tab */}
        <TabsContent value="regional" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Regional Performance (NEWS)
                </CardTitle>
                <p className="text-sm text-muted-foreground">Performance metrics by geographic region</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionalChartData.map((region) => (
                    <div key={region.region} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium text-lg">{region.region}</div>
                        <div className="text-sm text-muted-foreground">{region.total.toLocaleString()} devices</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{region.uptime}%</div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{region.performance}%</div>
                        <div className="text-sm text-muted-foreground">Performance</div>
                      </div>
                      <Badge variant={region.alerts < 10 ? "default" : "destructive"}>
                        {region.alerts} alerts
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          <InteractiveChartWrapper
            title="Regional Performance Analysis"
            data={regionalChartData.map((item) => ({ name: item.region, ...item }))}
            chartType="bar"
            exportData={regionalChartData}
            chartConfig={{
              live: { color: "#22c55e" },
              down: { color: "#ef4444" },
              maintenance: { color: "#f59e0b" },
            }}
            height={400}
            drillDownData={
              {
                // Add drill-down data for regions if needed
              }
            }
            onDrillDown={(data) => {
              console.log("Drilling down into region:", data)
            }}
          />
        </TabsContent>

        {/* Vendor Tab */}
        <TabsContent value="vendor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Performance</CardTitle>
                <p className="text-sm text-muted-foreground">Performance comparison by vendor</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { vendor: 'BCIL', devices: 2890, uptime: 98.9, efficiency: 96.2, performance: 94.8, satisfaction: 94 },
                    { vendor: 'ZEBRA', devices: 1234, uptime: 97.8, efficiency: 95.1, performance: 93.1, satisfaction: 92 },
                    { vendor: 'IMP', devices: 756, uptime: 96.5, efficiency: 93.8, performance: 91.7, satisfaction: 89 },
                    { vendor: 'ANJ', devices: 240, uptime: 95.2, efficiency: 91.5, performance: 89.4, satisfaction: 87 }
                  ].map((vendor) => (
                    <div key={vendor.vendor} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{vendor.vendor}</div>
                        <div className="text-sm text-muted-foreground">{vendor.devices} devices</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{vendor.uptime}%</div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{vendor.performance}%</div>
                        <div className="text-sm text-muted-foreground">Performance</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">{vendor.satisfaction}%</div>
                        <div className="text-sm text-muted-foreground">Satisfaction</div>
                      </div>
                    </div>
                  ))}
                </div>
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
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="uptime" fill="#22c55e" name="Uptime %" />
                      <Bar dataKey="performance" fill="#3b82f6" name="Performance %" />
                      <Bar dataKey="satisfaction" fill="#8b5cf6" name="Satisfaction %" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
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
                    <RechartsTooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="successful" fill="#22c55e" name="Successful Transactions" />
                    <Bar yAxisId="left" dataKey="failed" fill="#ef4444" name="Failed Transactions" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="processing"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Processing Time (ms)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lifecycle Tab */}
        <TabsContent value="lifecycle" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      <RechartsTooltip />
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
  )
}
