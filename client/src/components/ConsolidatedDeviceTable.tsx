import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeviceStatusData, DeviceStatus, getStatusLabel, getStatusColor } from "@/hooks/useDeviceStatusData";

interface ConsolidatedDeviceTableProps {
  data?: DeviceStatusData;
  onDeviceSelect: (deviceId: string) => void;
}

export default function ConsolidatedDeviceTable({ data, onDeviceSelect }: ConsolidatedDeviceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Flatten all devices from all locations
  const allDevices = useMemo(() => {
    if (!data?.CAT?.length) return [];
    
    const devices: (DeviceStatus & { locationName: string })[] = [];
    
    data.CAT.forEach(category => {
      category.LOC?.forEach(location => {
        location.DEVICES?.forEach(device => {
          devices.push({
            ...device,
            locationName: location.LOCATION_NAME
          });
        });
      });
    });
    
    return devices;
  }, [data]);

  // Get unique locations for filter
  const locations = useMemo(() => {
    return Array.from(new Set(allDevices.map(d => d.locationName).filter(Boolean)));
  }, [allDevices]);

  // Filter devices
  const filteredDevices = useMemo(() => {
    return allDevices.filter(device => {
      const matchesSearch = 
        (device.MAC_ID || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.ASSET_ID || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.locationName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        getStatusLabel(device.DeviceStatus).toLowerCase() === statusFilter.toLowerCase();
      
      const matchesLocation = locationFilter === "all" || 
        device.locationName === locationFilter;
      
      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [allDevices, searchTerm, statusFilter, locationFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

  const formatLastSync = (lastSync: string) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Device Status Table</span>
          <span className="text-sm font-normal text-muted-foreground">
            {filteredDevices.length} of {allDevices.length} devices
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search devices, assets, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="standby">Standby</SelectItem>
              <SelectItem value="down">Down</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(location => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {(searchTerm || statusFilter !== 'all' || locationFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setLocationFilter('all');
                setCurrentPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Device</th>
                  <th className="text-left py-3 px-4 font-medium">Location</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Last Sync</th>
                  <th className="text-left py-3 px-4 font-medium">Activity</th>
                  <th className="text-left py-3 px-4 font-medium">Time Diff</th>
                  <th className="text-left py-3 px-4 font-medium">Device Type</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDevices.map((device, index) => (
                  <tr 
                    key={device.MAC_ID}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => onDeviceSelect(device.MAC_ID)}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-sm">
                          {device.ASSET_ID || 'Unnamed Device'}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {device.MAC_ID}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">{device.locationName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        className={`text-xs ${getStatusColor(device.DeviceStatus)}`}
                        variant="outline"
                      >
                        {getStatusLabel(device.DeviceStatus)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">{formatLastSync(device.LastSync)}</div>
                      <div className="text-xs text-muted-foreground">
                        {device.TimeDifference}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm">
                          <span className="text-green-600">{device.Success}</span>
                          <span className="text-muted-foreground mx-1">/</span>
                          <span className="text-yellow-600">{device.Pending}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-muted-foreground">
                        {device.TimeDifference}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {device.DeviceStatus === 4 ? 'Reader' : device.DeviceStatus === 3 ? 'Controller' : 'Gateway'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {paginatedDevices.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No devices found matching your criteria
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDevices.length)} of {filteredDevices.length}
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
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}