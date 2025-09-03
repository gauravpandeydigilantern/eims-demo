import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function StatusMetrics() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const { data: statusSummary, isLoading } = useQuery<Array<{status: string; count: number}>>({
    queryKey: ["/api/analytics/status-summary"],
    refetchInterval: 30 * 1000,
  });

  const { data: devices } = useQuery<Array<any>>({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  const { data: alertsSummary } = useQuery<{total: number; critical: number; warning: number; info: number}>({
    queryKey: ["/api/alerts/summary"],
    refetchInterval: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalDevices = devices?.length || 0;
  const liveDevices = statusSummary?.find(s => s.status === 'LIVE')?.count || 0;
  const downDevices = statusSummary?.find(s => s.status === 'DOWN')?.count || 0;
  const shutdownDevices = statusSummary?.find(s => s.status === 'SHUTDOWN')?.count || 0;
  const maintenanceDevices = statusSummary?.find(s => s.status === 'MAINTENANCE')?.count || 0;
  
  // Calculate UP = LIVE + any other active statuses
  const upDevices = liveDevices + (statusSummary?.find(s => s.status === 'MAINTENANCE')?.count || 0);
  const upPercentage = totalDevices ? Math.round((upDevices / totalDevices) * 100) : 0;
  const downPercentage = totalDevices ? Math.round(((downDevices + shutdownDevices) / totalDevices) * 100) : 0;
  
  // Status filter buttons like NLDS
  const statusFilters = [
    { label: 'ACTIVE', count: liveDevices, color: 'bg-green-100 text-green-800 border-green-200' },
    { label: 'LIVE', count: liveDevices, color: 'bg-green-100 text-green-800 border-green-200' },
    { label: 'TIME OFF', count: maintenanceDevices, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { label: 'DOWN', count: downDevices + shutdownDevices, color: 'bg-red-100 text-red-800 border-red-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Main Device Health Status - NLDS Style */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-center w-full">Device Health Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* UP Status */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600">{upDevices}/{totalDevices}</div>
              <div className="text-sm text-muted-foreground">UP - {upPercentage}%</div>
            </div>
            
            {/* Live Status */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-lg mb-2">
                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600">{liveDevices}/{totalDevices}</div>
              <div className="text-sm text-muted-foreground">LIVE</div>
            </div>
            
            {/* Time Off */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-lg mb-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-600">{maintenanceDevices}/{totalDevices}</div>
              <div className="text-sm text-muted-foreground">TIME OFF</div>
            </div>
            
            {/* DOWN Status */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-lg mb-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600">{downDevices + shutdownDevices}/{totalDevices}</div>
              <div className="text-sm text-muted-foreground">DOWN - {downPercentage}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Search and Filter Controls - NLDS Style */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-700 text-white p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-blue-600 text-white hover:bg-blue-700 gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-blue-600 text-white hover:bg-blue-700 gap-2"
          >
            <MapPin className="w-4 h-4" />
            With Location
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-blue-600 text-white hover:bg-blue-700 gap-2"
          >
            <Filter className="w-4 h-4" />
            With Mac ID
          </Button>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((filter) => (
            <Button
              key={filter.label}
              variant={activeFilter === filter.label ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(activeFilter === filter.label ? null : filter.label)}
              className={`${filter.color} hover:opacity-80`}
            >
              {filter.label}
              <Badge variant="secondary" className="ml-2">{filter.count}</Badge>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
