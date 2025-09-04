import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function LocationWiseDeviceStatus() {
  const { data: devicesResponse, isLoading } = useQuery<{success: boolean, data: any[]}>({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  // Extract devices array from response
  const devices = devicesResponse?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Type Wise Device Status</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
        </CardContent>
      </Card>
    );
  }

  // Group devices by region and status
  const locationData = devices?.reduce((acc: any, device: any) => {
    const region = device.region || 'Unknown';
    if (!acc[region]) {
      acc[region] = {
        name: region,
        total: 0,
        live: 0,
        down: 0,
        maintenance: 0,
        timeOff: 0
      };
    }
    
    acc[region].total += 1;
    
    switch (device.status) {
      case 'LIVE':
        acc[region].live += 1;
        break;
      case 'DOWN':
      case 'SHUTDOWN':
        acc[region].down += 1;
        break;
      case 'MAINTENANCE':
        acc[region].maintenance += 1;
        break;
      case 'WARNING':
        acc[region].timeOff += 1;
        break;
    }
    
    return acc;
  }, {}) || {};

  const chartData = Object.values(locationData).map((location: any) => ({
    ...location,
    // Add percentage calculations
    livePercentage: location.total ? Math.round((location.live / location.total) * 100) : 0,
    downPercentage: location.total ? Math.round((location.down / location.total) * 100) : 0,
  }));

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold bg-slate-700 text-white p-3 -mx-6 -mt-6 mb-4 rounded-t-lg">
          Location Type Wise Device Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => {
                const colorMap: any = {
                  live: '#22c55e',
                  down: '#ef4444',
                  maintenance: '#f59e0b',
                  timeOff: '#6b7280'
                };
                return [
                  <span style={{ color: colorMap[name] || '#000' }}>
                    {value} devices
                  </span>,
                  String(name).charAt(0).toUpperCase() + String(name).slice(1)
                ];
              }}
              labelFormatter={(label) => `Region: ${label}`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar dataKey="live" fill="#22c55e" name="Live" radius={[2, 2, 0, 0]} />
            <Bar dataKey="down" fill="#ef4444" name="Down" radius={[2, 2, 0, 0]} />
            <Bar dataKey="maintenance" fill="#f59e0b" name="Maintenance" radius={[2, 2, 0, 0]} />
            <Bar dataKey="timeOff" fill="#6b7280" name="Time Off" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Summary Stats below chart */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {chartData.map((location: any) => (
              <div key={location.name} className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">{location.name}</div>
                <div className="text-lg font-bold">{location.total}</div>
                <div className="text-xs text-green-600">
                  Live: {location.livePercentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}