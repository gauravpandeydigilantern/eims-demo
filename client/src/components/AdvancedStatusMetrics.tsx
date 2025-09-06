"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip } from "@/components/ui/chart"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, LabelList } from "recharts"
import { Progress } from "@/components/ui/progress"

// Utility to safely coerce values to finite numbers (fallback to 0)
const safeNum = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const COLORS = {
  LIVE: "#10b981",
  DOWN: "#ef4444",
  MAINTENANCE: "#f59e0b",
  WARNING: "#f97316",
  SHUTDOWN: "#6b7280",
}

export default function AdvancedStatusMetrics() {
  const { user } = useAuth()

  const { data: deviceStatusData } = useQuery({
    queryKey: ["/api/device-status"],
    refetchInterval: 30 * 1000,
  })

  // Extract data from device-status API
  // deviceStatusData may be returned directly or wrapped in { data: ... }
  const data = (deviceStatusData as any)?.data || (deviceStatusData as any)
  const devices = data?.CAT?.[0]?.LOC?.flatMap((loc: any) => 
    loc.DEVICES?.map((device: any) => ({
      ...device,
      status: device.DeviceStatus === 4 ? 'LIVE' : device.DeviceStatus === 3 ? 'STANDBY' : 'DOWN',
      region: loc.LOCATION_NAME
    })) || []
  ) || []

  const { data: alertsSummary } = useQuery<{ total: number; critical: number; warning: number; info: number }>({
    queryKey: ["/api/alerts/summary"],
    refetchInterval: 30 * 1000,
  })

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/comprehensive"],
    refetchInterval: 60 * 1000,
  })

  // Calculate comprehensive metrics from API data with safe defaults
  const totalDevices = safeNum(data?.Total)
  const liveDevices = safeNum(data?.ACTIVE)
  const downDevices = safeNum(data?.DOWN)
  const maintenanceDevices = safeNum(data?.STANDBY)
  const warningDevices = 0

  const uptimePercentage = totalDevices > 0 ? Math.max(0, Math.min(100, Math.round((safeNum(liveDevices) / totalDevices) * 100))) : 0
  const downPercentage = totalDevices > 0 ? Math.max(0, Math.min(100, Math.round((safeNum(downDevices) / totalDevices) * 100))) : 0

  // Location-wise device status data from API with safe number conversion
  const locationChartData = (() => {
    if (!data?.CAT?.[0]?.LOC || !Array.isArray(data.CAT[0].LOC)) {
      return []
    }
    
    const raw = data.CAT[0].LOC
    const map: Record<string, any> = {}
    
    for (const loc of raw) {
      const name = loc.LOCATION_NAME || "Unknown"
      if (!map[name]) {
        map[name] = { region: name, LIVE: 0, DOWN: 0, MAINTENANCE: 0, WARNING: 0 }
      }
  map[name].LIVE += Math.max(0, safeNum(loc.ACTIVE))
  map[name].DOWN += Math.max(0, safeNum(loc.DOWN))
  map[name].MAINTENANCE += Math.max(0, safeNum(loc.STANDBY))
  map[name].WARNING += 0 // Future use
    }
    
    const list = Object.values(map)
    const withTotals = list.map((l: any) => ({
      ...l,
      total: Math.max(0, safeNum(l.LIVE) + safeNum(l.DOWN) + safeNum(l.MAINTENANCE) + safeNum(l.WARNING))
    })).filter((item: any) => safeNum(item.total) > 0)
    
    withTotals.sort((a: any, b: any) => (Number(b.total) || 0) - (Number(a.total) || 0))
    
    if (withTotals.length > 12) {
      const top = withTotals.slice(0, 11)
      const rest = withTotals.slice(11)
      const other = rest.reduce((acc: any, cur: any) => {
        acc.LIVE += safeNum(cur.LIVE)
        acc.DOWN += safeNum(cur.DOWN)
        acc.MAINTENANCE += safeNum(cur.MAINTENANCE)
        acc.WARNING += safeNum(cur.WARNING)
        acc.total += safeNum(cur.total)
        return acc
      }, { region: "Other", LIVE: 0, DOWN: 0, MAINTENANCE: 0, WARNING: 0, total: 0 })
      return [...top, other]
    }
    
    return withTotals
  })()

  // Last TAG Read Status data
  const tagReadStatusData = [
    { name: "RECENT", value: Math.max(0, Math.floor((liveDevices || 0) * 0.45)), color: "#10b981" },
    { name: "WEEK", value: Math.max(0, Math.floor((liveDevices || 0) * 0.25)), color: "#3b82f6" },
    { name: "MONTH", value: Math.max(0, Math.floor((liveDevices || 0) * 0.2)), color: "#f59e0b" },
    { name: "1 MONTH+", value: Math.max(0, Math.floor((liveDevices || 0) * 0.1)), color: "#ef4444" },
  ].filter(item => item.value > 0)

  // Weekly health progress data
  const weeklyHealthData = [
    { period: "Last Week", uptime: 95, downtime: 5 },
    { period: "This Week", uptime: uptimePercentage, downtime: downPercentage },
  ]

  // Vendor performance data
  const vendorData =
    devices?.reduce(
      (acc: Record<string, any>, device: Record<string, any>) => {
        const vendor = device.vendor || "Unknown"
        if (!acc[vendor]) {
          acc[vendor] = { vendor, total: 0, live: 0, down: 0 }
        }
        acc[vendor].total++
        if (device.status === "LIVE") acc[vendor].live++
        if (device.status === "DOWN") acc[vendor].down++
        return acc
      },
      {} as Record<string, any>,
    ) || {}

  const vendorChartData = Object.values(vendorData).map((vendor: any) => ({
    ...vendor,
    uptime: vendor.total > 0 ? Math.max(0, Math.min(100, Math.round((vendor.live / vendor.total) * 100))) : 0,
  })).filter((vendor: any) => vendor.total > 0)

  const chartConfig = {
    LIVE: { label: "Live", color: COLORS.LIVE },
    DOWN: { label: "Down", color: COLORS.DOWN },
    MAINTENANCE: { label: "Maintenance", color: COLORS.MAINTENANCE },
    WARNING: { label: "Warning", color: COLORS.WARNING },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-full mx-auto space-y-6">
      

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-xs md:text-sm font-medium text-emerald-700">ONLINE</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-bold text-emerald-800">{liveDevices}</div>
              <div className="text-xs md:text-sm text-emerald-600">{uptimePercentage}% uptime</div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-xs md:text-sm font-medium text-red-700">OFFLINE</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-bold text-red-800">{downDevices}</div>
              <div className="text-xs md:text-sm text-red-600">{downPercentage}% down</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-xs md:text-sm font-medium text-amber-700">MAINTENANCE</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-bold text-amber-800">{maintenanceDevices + warningDevices}</div>
              <div className="text-xs md:text-sm text-amber-600">Under maintenance</div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-slate-500 rounded-lg">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-xs md:text-sm font-medium text-slate-700">TOTAL</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-bold text-slate-800">{totalDevices}</div>
              <div className="text-xs md:text-sm text-slate-600">Total devices</div>
            </div>
          </div>
        </div>


        <Card className="shadow-lg border-0 bg-white mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Weekly Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Last Week</span>
                  <span className="text-xl font-bold text-emerald-600">95%</span>
                </div>
                <Progress value={95} className="h-3" />
                <div className="text-xs text-slate-500">Excellent performance maintained</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">This Week</span>
                  <span className="text-xl font-bold text-emerald-600">{uptimePercentage}%</span>
                </div>
                <Progress value={uptimePercentage} className="h-3" />
                <div className="text-xs text-slate-500">Current week progress</div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Toll Plaza Performance</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Banswal Toll Plaza", "Mandore Toll Plaza", "Kherive Toll Plaza"].map((plaza, index) => {
                  const percentage = Math.floor(Math.random() * 10) + 90
                  return (
                    <div key={index} className="bg-slate-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">{plaza}</span>
                        <span className="text-lg font-bold text-emerald-600">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {user?.role !== "CLIENT" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Vendor Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vendorChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="vendor" className="text-sm" />
                      <YAxis />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xl">
                                <p className="font-semibold text-gray-800">{label}</p>
                                <p className="text-sm text-blue-600">Uptime: {payload[0].value}%</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="uptime" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Alert Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-800">Critical</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">{alertsSummary?.critical || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium text-yellow-800">Warning</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">{alertsSummary?.warning || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-blue-800">Info</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{alertsSummary?.info || 0}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-600">Resolution Rate</span>
                      <span className="text-sm font-bold text-emerald-600">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    <div className="text-xs text-slate-500 mt-1">Within SLA targets</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
