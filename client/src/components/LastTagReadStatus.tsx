import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function LastTagReadStatus() {
  const { data: devices, isLoading } = useQuery<Array<any>>({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last TAG Read Status</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate time-based categories for TAG reads
  const now = new Date();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;

  const tagReadCategories = devices?.reduce((acc: any, device: any) => {
    const lastRead = device.lastTagRead ? new Date(device.lastTagRead) : null;
    
    if (!lastRead) {
      acc.noReads += 1;
      return acc;
    }

    const timeDiff = now.getTime() - lastRead.getTime();
    
    if (timeDiff < oneHour) {
      acc.recent += 1; // < 1 hour
    } else if (timeDiff < oneDay) {
      acc.withinDay += 1; // 1-24 hours
    } else if (timeDiff < oneWeek) {
      acc.withinWeek += 1; // 1-7 days
    } else if (timeDiff < oneMonth) {
      acc.withinMonth += 1; // 1-30 days
    } else {
      acc.old += 1; // > 30 days
    }
    
    return acc;
  }, {
    recent: 0,      // < 1 hour
    withinDay: 0,   // 1-24 hours  
    withinWeek: 0,  // 1-7 days
    withinMonth: 0, // 1-30 days
    old: 0,         // > 30 days
    noReads: 0      // No reads
  }) || {
    recent: 0,
    withinDay: 0,
    withinWeek: 0,
    withinMonth: 0,
    old: 0,
    noReads: 0
  };

  const pieData = [
    { name: "Recent (< 1h)", value: tagReadCategories.recent, color: "#22c55e", percentage: 0 },
    { name: "1-24 Hours", value: tagReadCategories.withinDay, color: "#3b82f6", percentage: 0 },
    { name: "1-7 Days", value: tagReadCategories.withinWeek, color: "#f59e0b", percentage: 0 },
    { name: "1-30 Days", value: tagReadCategories.withinMonth, color: "#ef4444", percentage: 0 },
    { name: "Old (>30d)", value: tagReadCategories.old, color: "#6b7280", percentage: 0 },
    { name: "No Reads", value: tagReadCategories.noReads, color: "#dc2626", percentage: 0 }
  ].map(item => {
    const total = Object.values(tagReadCategories).reduce((sum: number, val: number) => sum + val, 0);
    return {
      ...item,
      percentage: total ? Math.round((item.value / total) * 100) : 0
    };
  }).filter(item => item.value > 0);

  const renderCustomLabel = ({ name, percent }: any) => {
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold bg-slate-700 text-white p-3 -mx-6 -mt-6 mb-4 rounded-t-lg">
          Last TAG Read Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    `${value} devices (${pieData.find(d => d.name === name)?.percentage}%)`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend with color squares */}
          <div className="w-full lg:w-1/2 space-y-2 mt-4 lg:mt-0">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Summary at bottom */}
        <div className="mt-4 pt-4 border-t text-center">
          <div className="text-sm text-muted-foreground">
            Total Devices: {Object.values(tagReadCategories).reduce((sum: number, val: number) => sum + val, 0)}
          </div>
          <div className="text-lg font-bold text-green-600 mt-1">
            Active Reading: {tagReadCategories.recent + tagReadCategories.withinDay} devices
          </div>
        </div>
      </CardContent>
    </Card>
  );
}