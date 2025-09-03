import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function StatusMetrics() {
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

  const metrics = [
    {
      title: "Total Devices",
      value: totalDevices.toLocaleString(),
      change: "+12 today",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    },
    {
      title: "Devices Live",
      value: liveDevices.toLocaleString(),
      change: `${totalDevices ? Math.round((liveDevices / totalDevices) * 100) : 0}% uptime`,
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Devices Down",
      value: downDevices.toLocaleString(),
      change: "Needs attention",
      changeType: "negative",
      icon: (
        <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Active Alerts",
      value: alertsSummary?.total?.toLocaleString() || "0",
      change: `${alertsSummary?.critical || 0} critical alerts`,
      changeType: (alertsSummary?.critical || 0) > 0 ? "negative" : "neutral",
      icon: (
        <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="metric-card hover:shadow-lg transition-all duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{metric.title}</p>
                <p className="text-3xl font-bold text-foreground" data-testid={`metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {metric.value}
                </p>
                <p className={`text-sm mt-1 ${
                  metric.changeType === 'positive' ? 'text-success' :
                  metric.changeType === 'negative' ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>
                  {metric.changeType === 'positive' && (
                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                  )}
                  {metric.change}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                {metric.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
