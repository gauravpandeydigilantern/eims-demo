import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Filter, Download, Eye, Activity, AlertTriangle, Wifi } from "lucide-react";
import NavigationHeader from "@/components/NavigationHeader";
import Sidebar from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DeviceList() {
  const [, params] = useRoute("/devices/:filter?");
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("devices");
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const queryClient = useQueryClient();
  const [pendingDevices, setPendingDevices] = useState<Set<string>>(new Set());

  const touchDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      console.log('Starting ping for device:', deviceId);
      console.log('Current window location:', window.location.href);
      
      // Add device to pending set
      setPendingDevices(prev => {
        const newSet = new Set(prev);
        newSet.add(deviceId);
        return newSet;
      });
      
      const apiUrl = `/api/devices/${deviceId}/touch`;
      console.log('Making request to:', apiUrl);
      
      try {
        const response = await fetch(apiUrl, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${responseText}`);
        }
        
        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
        }
      } catch (fetchError) {
        console.error('Fetch error details:', fetchError);
        const error = fetchError as Error;
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        throw new Error(`Network error: ${error.message}`);
      }
    },
    onSuccess: (data, deviceId) => {
      console.log('Device ping successful:', data);
      setPendingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      // Show success message
      alert(`Device ${deviceId} pinged successfully!`);
    },
    onError: (error: Error, deviceId) => {
      console.error('Device ping failed:', error);
      setPendingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
      alert(`Failed to ping device ${deviceId}: ${error.message}`);
    },
  });

  // Auto-populate filters from URL parameters
  useEffect(() => {
    const filter = params?.filter;
    if (filter) {
      try {
        const decoded = decodeURIComponent(filter);
        const filterParams = new URLSearchParams(decoded);
        
        if (filterParams.get('status')) setStatusFilter(filterParams.get('status')!);
        if (filterParams.get('region')) setRegionFilter(filterParams.get('region')!);
        if (filterParams.get('vendor')) setVendorFilter(filterParams.get('vendor')!);
        if (filterParams.get('search')) setSearchTerm(filterParams.get('search')!);
      } catch (error) {
        console.error('Error parsing filter parameters:', error);
      }
    }
  }, [params?.filter]);

  const { data: devicesResponse, isLoading } = useQuery<{success: boolean, data: any[]}>({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  // Extract devices array from response
  const devices = devicesResponse?.data || [];

  // Filter devices based on current filters
  const filteredDevices = Array.isArray(devices) ? devices.filter((device: any) => {
    const matchesSearch = device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.tollPlaza.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || device.status === statusFilter;
    const matchesRegion = regionFilter === "all" || device.region === regionFilter;
    const matchesVendor = vendorFilter === "all" || device.vendor === vendorFilter;
    
    return matchesSearch && matchesStatus && matchesRegion && matchesVendor;
  }) : [];

  // Pagination
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

  // Get unique values for filter options
  const regions = Array.from(new Set(Array.isArray(devices) ? devices.map((d: any) => d.region) : []));
  const vendors = Array.from(new Set(Array.isArray(devices) ? devices.map((d: any) => d.vendor) : []));

  const getStatusBadge = (status: string) => {
    const colors = {
      'LIVE': 'bg-green-100 text-green-800',
      'DOWN': 'bg-red-100 text-red-800',
      'WARNING': 'bg-yellow-100 text-yellow-800',
      'MAINTENANCE': 'bg-blue-100 text-blue-800'
    };
    
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LIVE': return <Activity className="w-4 h-4 text-green-600" />;
      case 'DOWN': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'MAINTENANCE': return <Activity className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const viewDeviceDetail = (deviceId: string) => {
    setLocation(`/device/${deviceId}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setRegionFilter("all");
    setVendorFilter("all");
    setCurrentPage(1);
    setLocation("/devices");
  };

  const exportData = () => {
    const csvContent = [
      ['Device ID', 'Type', 'Status', 'Region', 'Vendor', 'Toll Plaza'],
      ...filteredDevices.map((device: any) => [
        device.id,
        device.deviceType,
        device.status,
        device.region,
        device.vendor,
        device.tollPlaza
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading devices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          activeTab={activeTab}
        />
        
        <main className="flex-1 overflow-hidden">
          {/* Header */}
          <div className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
        
                
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Device Management</h1>
                  <p className="text-muted-foreground">
                    {filteredDevices.length} of {Array.isArray(devices) ? devices.length : 0} devices
                  </p>
                </div>
              </div>
              
              <Button onClick={exportData} data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card border-b border-border p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="LIVE">Live</SelectItem>
                  <SelectItem value="DOWN">Down</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger data-testid="select-region">
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger data-testid="select-vendor">
                  <SelectValue placeholder="Filter by vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Device Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedDevices.map((device: any) => (
                <Card key={device.id} className="hover:shadow-lg transition-shadow" 
                      data-testid={`card-device-${device.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle 
                        className="text-lg cursor-pointer" 
                        onClick={() => viewDeviceDetail(device.id)}
                        data-testid={`title-device-${device.id}`}
                      >
                        {device.id}
                      </CardTitle>
                      <Badge className={getStatusBadge(device.status)}>
                        {getStatusIcon(device.status)}
                        <span className="ml-2">{device.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium">
                          {device.deviceType === 'FIXED_READER' ? 'Fixed Reader' : 'Handheld Device'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vendor</p>
                        <p className="font-medium">{device.vendor}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="font-medium">{device.tollPlaza}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Region</p>
                        <p className="font-medium">{device.region}</p>
                      </div>
                    </div>
                    
                    {/* <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className="font-bold text-green-600">{device.status}</span>
                    </div> */}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => viewDeviceDetail(device.id)}
                      data-testid={`button-view-${device.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Pinging device:', device.id);
                        touchDeviceMutation.mutate(device.id);
                      }}
                      disabled={pendingDevices.has(device.id)}
                      data-testid={`button-touch-${device.id}`}
                    >
                      <Wifi className="w-4 h-4 mr-2" />
                      {pendingDevices.has(device.id) ? 'Pinging...' : 'Ping Device'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDevices.length)} of {filteredDevices.length}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}