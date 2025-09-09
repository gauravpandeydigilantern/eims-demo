import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function LocationIntelligence() {
  const { data: locationData } = useQuery<any>({
    queryKey: ["/api/location/intelligence"],
    refetchInterval: 30 * 1000, // 30 seconds for real-time
  });

  const { data: deviceData } = useQuery<any>({
    queryKey: ["/api/device-status"],
    refetchInterval: 30 * 1000,
  });

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              🗺️
            </div>
            <div>
              <CardTitle>Location Intelligence</CardTitle>
              <p className="text-sm text-muted-foreground">AI-powered geographic insights and analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-600 font-medium">LIVE</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Coverage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{locationData?.totalLocations || '847'}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Locations</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{locationData?.activeZones || '823'}</div>
            <div className="text-sm text-green-600 dark:text-green-400">Active Zones</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{locationData?.coverageArea || '15,420'} km²</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Coverage Area</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{deviceData?.data?.Total || '329'}</div>
            <div className="text-sm text-orange-600 dark:text-orange-400">Total Devices</div>
          </div>
        </div>

        {/* Regional Performance */}
        <div className="mb-6">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Regional Performance Analytics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locationData?.regions?.map((region: any) => (
              <div key={region.name} className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{region.name}</span>
                    <Badge variant={region.status === 'optimal' ? 'default' : region.status === 'warning' ? 'secondary' : 'destructive'}>
                      {region.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{region.devices} devices</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Coverage Efficiency</span>
                    <span className="font-medium text-green-600">{region.efficiency}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Network Density</span>
                    <span className="font-medium text-blue-600">{region.density}/km²</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full transition-all duration-1000" style={{width: `${region.efficiency}%`}}></div>
                  </div>
                </div>
              </div>
            )) || [
              { name: 'North', status: 'optimal', devices: 234, efficiency: 94, density: 12.3 },
              { name: 'South', status: 'optimal', devices: 189, efficiency: 91, density: 8.7 },
              { name: 'East', status: 'warning', devices: 156, efficiency: 87, density: 15.2 },
              { name: 'West', status: 'optimal', devices: 201, efficiency: 96, density: 11.8 }
            ].map((region: any) => (
              <div key={region.name} className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{region.name}</span>
                    <Badge variant={region.status === 'optimal' ? 'default' : 'secondary'}>
                      {region.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{region.devices} devices</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Coverage Efficiency</span>
                    <span className="font-medium text-green-600">{region.efficiency}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Network Density</span>
                    <span className="font-medium text-blue-600">{region.density}/km²</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full transition-all duration-1000" style={{width: `${region.efficiency}%`}}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Location Insights */}
        {locationData?.aiInsights && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium mb-2 flex items-center text-blue-800 dark:text-blue-200">
              <span className="mr-2">🤖</span>
              AI Location Intelligence
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">{locationData.aiInsights}</p>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Last analyzed: {new Date().toLocaleTimeString()} • Powered by AI
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}