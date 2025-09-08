import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { MapPin, Activity, AlertTriangle, CheckCircle } from "lucide-react"
import ConsolidatedDeviceTable from "./ConsolidatedDeviceTable"
import { useState } from "react"
import DeviceDetailModal from "./DeviceDetailModal"
import { useDeviceStatusData } from "@/hooks/useDeviceStatusData"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const STATUS_COLORS = {
  ACTIVE: "#10b981",
  DOWN: "#ef4444", 
  STANDBY: "#f59e0b"
}

export default function DeviceStatusDataView() {
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
  
  const { data: deviceStatusData, isLoading } = useDeviceStatusData();

  if (isLoading) {
    return <div className="p-6">Loading device status data...</div>
  }

  const data = (deviceStatusData as any)?.data || deviceStatusData
  const locations = data?.CAT?.[0]?.LOC || []

  // Regional data aggregation
  const regionalData = locations.map((loc: any) => ({
    region: loc.LOCATION_NAME,
    active: Number(loc.ACTIVE || 0),
    down: Number(loc.DOWN || 0), 
    standby: Number(loc.STANDBY || 0),
    total: Number(loc.ACTIVE || 0) + Number(loc.DOWN || 0) + Number(loc.STANDBY || 0)
  }))

  // Device-wise data
  const deviceData = locations.flatMap((loc: any) => 
    (loc.DEVICES || []).map((device: any) => ({
      ...device,
      region: loc.LOCATION_NAME,
      statusText: device.DeviceStatus === 4 ? 'ACTIVE' : device.DeviceStatus === 3 ? 'STANDBY' : 'DOWN'
    }))
  )

  // Summary stats
  const totalStats = {
    total: data?.Total || 0,
    active: data?.ACTIVE || 0,
    down: data?.DOWN || 0,
    standby: data?.STANDBY || 0
  }

  // Pie chart data
  const pieData = [
    { name: 'Active', value: totalStats.active, color: STATUS_COLORS.ACTIVE },
    { name: 'Down', value: totalStats.down, color: STATUS_COLORS.DOWN },
    { name: 'Standby', value: totalStats.standby, color: STATUS_COLORS.STANDBY }
  ]

  const openDeviceDetail = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

    const closeDeviceDetail = () => {
    setSelectedDeviceId(null);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Devices</p>
                <p className="text-2xl font-bold">{totalStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{totalStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Down</p>
                <p className="text-2xl font-bold text-red-600">{totalStats.down}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Standby</p>
                <p className="text-2xl font-bold text-yellow-600">{totalStats.standby}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Regional Device Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <XAxis dataKey="region" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="active" fill={STATUS_COLORS.ACTIVE} name="Active" />
                <Bar dataKey="down" fill={STATUS_COLORS.DOWN} name="Down" />
                <Bar dataKey="standby" fill={STATUS_COLORS.STANDBY} name="Standby" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  innerRadius={20}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} devices`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Regional Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Down</TableHead>
                <TableHead>Standby</TableHead>
                <TableHead>Uptime %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regionalData
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((region: any) => (
                <TableRow 
                  key={region.region} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedRegion(region.region)}
                >
                  <TableCell className="font-medium">{region.region}</TableCell>
                  <TableCell>{region.total}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {region.active}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      {region.down}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      {region.standby}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {region.total > 0 ? Math.min(99, Math.round((region.active / region.total) * 100)) : 0}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {regionalData.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, regionalData.length)} of {regionalData.length}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {Math.ceil(regionalData.length / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(Math.ceil(regionalData.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(regionalData.length / itemsPerPage)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regional Device Details Dialog */}
      <Dialog open={!!selectedRegion} onOpenChange={() => setSelectedRegion(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Devices in {selectedRegion}</span>
              <Badge variant="secondary">
                {selectedRegion ? deviceData.filter(device => device.region === selectedRegion).length : 0} devices
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedRegion && (
            <div className="mt-4">
              {deviceData.filter(device => device.region === selectedRegion).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No devices found for {selectedRegion}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Asset ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead>Success/Pending</TableHead>
                      <TableHead>Time Diff</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(deviceData as {
                      MAC_ID: string
                      ASSET_ID?: string
                      statusText?: 'ACTIVE' | 'DOWN' | 'STANDBY'
                      LastSync?: string
                      Success?: number
                      Pending?: number
                      TimeDifference?: string
                      region?: string
                    }[])
                      .filter((device) => device.region === selectedRegion)
                      .map((device, index: number) => (
                        <TableRow key={`${device.MAC_ID}-${index}`}>
                          <TableCell className="font-mono text-sm">{device.MAC_ID}</TableCell>
                          <TableCell>{device.ASSET_ID}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                device.statusText === 'ACTIVE' ? 'text-green-600 border-green-600' :
                                device.statusText === 'DOWN' ? 'text-red-600 border-red-600' :
                                'text-yellow-600 border-yellow-600'
                              }
                            >
                              {device.statusText}
                            </Badge>
                          </TableCell>
                          <TableCell>{device.LastSync || 'N/A'}</TableCell>
                          <TableCell>
                            <span className="text-green-600">{device.Success || 0}</span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-yellow-600">{device.Pending || 0}</span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {device.TimeDifference || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <div className="xl:col-span-2">
        <ConsolidatedDeviceTable 
          data={deviceStatusData as any}
          onDeviceSelect={openDeviceDetail}
        />
      </div>
    

        {selectedDeviceId && (
              <DeviceDetailModal
                deviceId={selectedDeviceId}
                onClose={closeDeviceDetail}
              />
            )}
    </div>
  )
}