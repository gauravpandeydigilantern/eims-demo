import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";

interface Device {
  id: string;
  macAddress: string;
  assetId?: string;
  status: string;
  lastSync?: string;
  pendingCount?: number;
  successCount?: number;
  timeDifference?: string;
  region: string;
  tollPlaza: string;
  vendor: string;
}

export default function NLDSDeviceTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const { data: devicesResponse, isLoading } = useQuery<{success: boolean, data: Device[]}>({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  // Extract devices array from response
  const devices = devicesResponse?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Details</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading device data...</div>
        </CardContent>
      </Card>
    );
  }

  // Filter devices based on search and status
  const filteredDevices = devices?.filter(device => {
    const matchesSearch = !searchTerm || 
      device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.macAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.assetId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || device.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return <Badge variant="default" className="bg-green-600">LIVE</Badge>;
      case 'DOWN':
      case 'SHUTDOWN':
        return <Badge variant="destructive">DOWN</Badge>;
      case 'MAINTENANCE':
        return <Badge variant="secondary" className="bg-yellow-600 text-white">MAINTENANCE</Badge>;
      case 'WARNING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">WARNING</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTimeDifference = (lastSync?: string, timeDiff?: string) => {
    if (timeDiff) return timeDiff;
    if (!lastSync) return "N/A";
    
    const now = new Date();
    const syncTime = new Date(lastSync);
    const diffMs = now.getTime() - syncTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "0 Min";
    if (diffMins < 60) return `${diffMins} Min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} Hr`;
    return `${Math.floor(diffMins / 1440)} Day`;
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <CardTitle className="text-lg font-semibold bg-slate-700 text-white p-3 -mx-6 -mt-6 mb-4 rounded-t-lg">
            Device Status Table
          </CardTitle>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Device ID, MAC Address, or Asset ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(null)}
              >
                All ({devices?.length || 0})
              </Button>
              <Button
                variant={statusFilter === "LIVE" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(statusFilter === "LIVE" ? null : "LIVE")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Live ({devices?.filter(d => d.status === "LIVE").length || 0})
              </Button>
              <Button
                variant={statusFilter === "DOWN" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(statusFilter === "DOWN" ? null : "DOWN")}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Down ({devices?.filter(d => d.status === "DOWN" || d.status === "SHUTDOWN").length || 0})
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">S.N.</TableHead>
                <TableHead className="font-semibold">MAC ID</TableHead>
                <TableHead className="font-semibold">ASSET ID</TableHead>
                <TableHead className="font-semibold">LAST SYNC</TableHead>
                <TableHead className="font-semibold">PENDING</TableHead>
                <TableHead className="font-semibold">SUCCESS</TableHead>
                <TableHead className="font-semibold">TIME DIFFERENCE</TableHead>
                <TableHead className="font-semibold">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm || statusFilter ? "No devices found matching the criteria" : "No devices available"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.slice(0, 50).map((device, index) => ( // Limit to 50 rows for performance
                  <TableRow key={device.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{device.macAddress || "N/A"}</TableCell>
                    <TableCell className="font-mono text-sm">{device.assetId || device.id}</TableCell>
                    <TableCell className="text-sm">
                      {device.lastSync ? new Date(device.lastSync).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-6 bg-gray-100 rounded text-sm">
                        {device.pendingCount || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-6 bg-gray-100 rounded text-sm">
                        {device.successCount || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatTimeDifference(device.lastSync, device.timeDifference)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(device.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Show more indicator if there are more than 50 devices */}
        {filteredDevices.length > 50 && (
          <div className="p-4 text-center text-sm text-muted-foreground border-t">
            Showing first 50 of {filteredDevices.length} devices. Use search to narrow results.
          </div>
        )}
        
        {/* Summary Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                {filteredDevices.filter(d => d.status === "LIVE").length}
              </div>
              <div className="text-xs text-muted-foreground">Live Devices</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {filteredDevices.filter(d => d.status === "DOWN" || d.status === "SHUTDOWN").length}
              </div>
              <div className="text-xs text-muted-foreground">Down Devices</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {filteredDevices.reduce((sum, d) => sum + (d.successCount || 0), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Success</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {filteredDevices.reduce((sum, d) => sum + (d.pendingCount || 0), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Pending</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}