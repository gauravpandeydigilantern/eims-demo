import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface DeviceListTableProps {
  onDeviceSelect: (deviceId: string) => void;
}

export default function DeviceListTable({ onDeviceSelect }: DeviceListTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [, setLocation] = useLocation();

  const { user } = useAuth();
  const { data: devices, isLoading } = useQuery<any[]>({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  const filteredDevices = (devices || []).filter((device: any) => {
    const matchesSearch = device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.tollPlaza.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || device.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string, subStatus?: string) => {
    const variants: Record<string, string> = {
      'LIVE': 'default',
      'DOWN': 'destructive',
      'WARNING': 'secondary',
      'MAINTENANCE': 'outline'
    };

    const colors: Record<string, string> = {
      'LIVE': 'text-success',
      'DOWN': 'text-destructive', 
      'WARNING': 'text-warning',
      'MAINTENANCE': 'text-info'
    };

    return (
      <div className="flex items-center space-x-2">
        <div className={`status-indicator status-${status.toLowerCase()}`}></div>
        <span className={`font-medium ${colors[status] || 'text-foreground'}`}>
          {status === 'LIVE' ? 'Live' : status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
        {subStatus && (
          <span className="text-xs text-muted-foreground">({subStatus})</span>
        )}
      </div>
    );
  };

  const getDeviceIcon = (deviceType: string, status: string) => {
    const iconColor = status === 'LIVE' ? 'text-success' : 
                     status === 'DOWN' ? 'text-destructive' : 
                     status === 'WARNING' ? 'text-warning' : 'text-info';

    if (deviceType === 'HANDHELD_DEVICE') {
      return (
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }

    return (
      <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  const formatLastSeen = (lastSeen: string) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMinutes % 60}m ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Device Status Overview</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-devices"
              />
              <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="LIVE">Live Only</SelectItem>
                <SelectItem value="DOWN">Down Only</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-6 text-muted-foreground font-medium">Device ID</th>
                <th className="text-left py-3 px-6 text-muted-foreground font-medium">Location</th>
                <th className="text-left py-3 px-6 text-muted-foreground font-medium">Type</th>
                <th className="text-left py-3 px-6 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-6 text-muted-foreground font-medium">Last Update</th>
                <th className="text-left py-3 px-6 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDevices.map((device: any) => (
                <tr 
                  key={device.id}
                  className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/device/${device.id}`)}
                  data-testid={`row-device-${device.id}`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(device.deviceType, device.status)}
                      <div>
                        <div className="font-medium text-foreground">{device.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {device.deviceType === 'HANDHELD_DEVICE' ? `Serial: ${device.serialNumber}` : `MAC: ${device.macAddress}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-foreground">{device.tollPlaza}</div>
                    <div className="text-sm text-muted-foreground">{device.region}, {device.zone}</div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge 
                      variant={device.deviceType === 'FIXED_READER' ? 'default' : 'secondary'}
                      data-testid={`badge-device-type-${device.id}`}
                    >
                      {device.deviceType === 'FIXED_READER' ? 'Fixed Reader' : 'Handheld Device'}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(device.status, device.subStatus)}
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">
                    {formatLastSeen(device.lastSeen)}
                  </td>
                  <td className="py-4 px-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeviceSelect(device.id);
                      }}
                      data-testid={`button-device-actions-${device.id}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {paginatedDevices.length === 0 && (
            <div className="py-12 text-center">
              <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-muted-foreground">No devices found matching your criteria</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {filteredDevices.length > 0 && (
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDevices.length)} of {filteredDevices.length} devices
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                
                <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm" data-testid="text-current-page">
                  {currentPage}
                </span>
                
                {currentPage < totalPages && (
                  <span className="px-3 py-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-pointer text-sm">
                    {currentPage + 1}
                  </span>
                )}
                
                {currentPage + 1 < totalPages && (
                  <span className="px-3 py-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-pointer text-sm">
                    {currentPage + 2}
                  </span>
                )}
                
                {totalPages > currentPage + 2 && (
                  <span className="text-muted-foreground text-sm">...</span>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
