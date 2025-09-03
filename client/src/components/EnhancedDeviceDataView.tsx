import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdvancedFilterPanel, { FilterOptions } from "./AdvancedFilterPanel";
import { format } from "date-fns";
import { Eye, Download, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface Device {
  id: string;
  macAddress: string;
  assetId?: string;
  serialNumber?: string;
  deviceType: string;
  vendor: string;
  model?: string;
  firmwareVersion?: string;
  status: string;
  subStatus?: string;
  location: string;
  tollPlaza: string;
  region: string;
  zone: string;
  latitude?: number;
  longitude?: number;
  installDate?: string;
  lastSeen?: string;
  lastSync?: string;
  lastTransaction?: string;
  lastTagRead?: string;
  lastRegistration?: string;
  uptime: number;
  transactionCount: number;
  pendingCount: number;
  successCount: number;
  timeDifference?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DeviceMetrics {
  deviceId: string;
  cpuUsage?: number;
  ramUsage?: number;
  temperature?: number;
  antennaStatus?: boolean;
  networkStatus?: boolean;
  powerStatus?: boolean;
  healthScore?: number;
  timestamp: string;
}

export default function EnhancedDeviceDataView() {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: "",
    regions: [],
    vendors: [],
    statuses: [],
    deviceTypes: [],
    dateRange: { from: null, to: null },
    performanceFilters: {},
    healthFilters: {},
    sortBy: "lastSeen",
    sortOrder: "desc"
  });

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const { data: devices, isLoading, refetch } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  const { data: deviceMetrics } = useQuery<DeviceMetrics[]>({
    queryKey: ["/api/device-metrics"],
    refetchInterval: 30 * 1000,
  });

  // Get unique values for filter options
  const { availableRegions, availableVendors } = useMemo(() => {
    if (!devices) return { availableRegions: [], availableVendors: [] };
    
    return {
      availableRegions: Array.from(new Set(devices.map(d => d.region))).sort(),
      availableVendors: Array.from(new Set(devices.map(d => d.vendor))).sort()
    };
  }, [devices]);

  // Apply filters to devices
  const filteredDevices = useMemo(() => {
    if (!devices) return [];

    return devices.filter(device => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const searchFields = [
          device.id,
          device.macAddress,
          device.assetId,
          device.serialNumber,
          device.location,
          device.tollPlaza
        ].filter(Boolean);
        
        if (!searchFields.some(field => field?.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Region filter
      if (filters.regions.length > 0 && !filters.regions.includes(device.region)) {
        return false;
      }

      // Vendor filter
      if (filters.vendors.length > 0 && !filters.vendors.includes(device.vendor)) {
        return false;
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(device.status)) {
        return false;
      }

      // Device type filter
      if (filters.deviceTypes.length > 0 && !filters.deviceTypes.includes(device.deviceType)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const deviceDate = device.lastSeen ? new Date(device.lastSeen) : new Date(device.createdAt);
        if (filters.dateRange.from && deviceDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && deviceDate > filters.dateRange.to) return false;
      }

      // Performance filters
      if (filters.performanceFilters.minUptime && device.uptime < filters.performanceFilters.minUptime * 36000) {
        return false;
      }

      // Health filters - would need to join with metrics data
      const metrics = deviceMetrics?.find(m => m.deviceId === device.id);
      if (filters.healthFilters.cpuThreshold && metrics?.cpuUsage && metrics.cpuUsage > filters.healthFilters.cpuThreshold) {
        return false;
      }
      if (filters.healthFilters.temperatureThreshold && metrics?.temperature && metrics.temperature > filters.healthFilters.temperatureThreshold) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const getValue = (device: Device, field: string) => {
        switch (field) {
          case 'id': return device.id;
          case 'lastSeen': return device.lastSeen || '';
          case 'lastTransaction': return device.lastTransaction || '';
          case 'uptime': return device.uptime;
          case 'transactionCount': return device.transactionCount;
          case 'region': return device.region;
          case 'status': return device.status;
          default: return device.id;
        }
      };

      const aVal = getValue(a, filters.sortBy);
      const bVal = getValue(b, filters.sortBy);

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return filters.sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [devices, deviceMetrics, filters]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'LIVE': { variant: 'default' as const, className: 'bg-green-600 text-white' },
      'DOWN': { variant: 'destructive' as const, className: '' },
      'SHUTDOWN': { variant: 'destructive' as const, className: '' },
      'MAINTENANCE': { variant: 'secondary' as const, className: 'bg-yellow-600 text-white' },
      'WARNING': { variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, className: '' };

    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const getDeviceHealthScore = (deviceId: string) => {
    const metrics = deviceMetrics?.find(m => m.deviceId === deviceId);
    return metrics?.healthScore || 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdvancedFilterPanel
        onFiltersChange={setFilters}
        availableRegions={availableRegions}
        availableVendors={availableVendors}
        totalDevices={devices?.length || 0}
        filteredCount={filteredDevices.length}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Device Data Overview</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" disabled={filteredDevices.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Health Score</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No devices found matching the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device) => (
                    <TableRow key={device.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{device.id}</TableCell>
                      <TableCell className="font-mono text-xs">{device.macAddress || "N/A"}</TableCell>
                      <TableCell className="font-mono text-sm">{device.assetId || device.id}</TableCell>
                      <TableCell>{getStatusBadge(device.status)}</TableCell>
                      <TableCell>{device.region}</TableCell>
                      <TableCell>{device.vendor}</TableCell>
                      <TableCell className="text-sm">
                        {device.lastSeen ? format(new Date(device.lastSeen), "MMM dd, HH:mm") : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={getDeviceHealthScore(device.id)} className="h-2 w-16" />
                          <span className="text-xs">{getDeviceHealthScore(device.id)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{device.transactionCount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDevice(device)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Device Details - {device.id}</DialogTitle>
                            </DialogHeader>
                            {selectedDevice && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground">Basic Information</h4>
                                    <div className="space-y-2 mt-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm">Device ID:</span>
                                        <span className="text-sm font-mono">{selectedDevice.id}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">MAC Address:</span>
                                        <span className="text-sm font-mono">{selectedDevice.macAddress}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Asset ID:</span>
                                        <span className="text-sm font-mono">{selectedDevice.assetId}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Serial Number:</span>
                                        <span className="text-sm font-mono">{selectedDevice.serialNumber}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Status:</span>
                                        {getStatusBadge(selectedDevice.status)}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground">Location</h4>
                                    <div className="space-y-2 mt-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm">Region:</span>
                                        <span className="text-sm">{selectedDevice.region}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Toll Plaza:</span>
                                        <span className="text-sm">{selectedDevice.tollPlaza}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Zone:</span>
                                        <span className="text-sm">{selectedDevice.zone}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Location:</span>
                                        <span className="text-sm">{selectedDevice.location}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground">Performance</h4>
                                    <div className="space-y-2 mt-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm">Uptime:</span>
                                        <span className="text-sm">{Math.round(selectedDevice.uptime / 3600)} hours</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Transactions:</span>
                                        <span className="text-sm">{selectedDevice.transactionCount.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Success Count:</span>
                                        <span className="text-sm text-green-600">{selectedDevice.successCount}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Pending:</span>
                                        <span className="text-sm text-yellow-600">{selectedDevice.pendingCount}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground">Timestamps</h4>
                                    <div className="space-y-2 mt-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm">Last Seen:</span>
                                        <span className="text-sm">{selectedDevice.lastSeen ? format(new Date(selectedDevice.lastSeen), "MMM dd, yyyy HH:mm") : "Never"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Last Transaction:</span>
                                        <span className="text-sm">{selectedDevice.lastTransaction ? format(new Date(selectedDevice.lastTransaction), "MMM dd, yyyy HH:mm") : "Never"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Last Tag Read:</span>
                                        <span className="text-sm">{selectedDevice.lastTagRead ? format(new Date(selectedDevice.lastTagRead), "MMM dd, yyyy HH:mm") : "Never"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Install Date:</span>
                                        <span className="text-sm">{selectedDevice.installDate ? format(new Date(selectedDevice.installDate), "MMM dd, yyyy") : "Unknown"}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}