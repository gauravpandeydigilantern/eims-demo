import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function AlertsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Alerts API may return either an array (legacy) or a paginated object { success, data, pagination }
  const { data: alerts, isLoading } = useQuery<{ success?: boolean; data?: any[]; pagination?: { total?: number } } | any[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 30 * 1000,
  });

  // Listen for real-time alert updates
  useWebSocket((message) => {
    if (message.type === 'alerts_summary') {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/summary"] });
    }
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("POST", `/api/alerts/${alertId}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/summary"] });
      toast({
        title: "Alert Acknowledged",
        description: "Alert has been marked as acknowledged",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("POST", `/api/alerts/${alertId}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/summary"] });
      toast({
        title: "Alert Resolved",
        description: "Alert has been marked as resolved",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    },
  });

  const getAlertIcon = (category: string) => {
    switch (category) {
      case 'DEVICE_OFFLINE':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'WEATHER':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
          </svg>
        );
      case 'PERFORMANCE':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return 'bg-destructive/5 border-l-destructive';
      case 'WARNING':
        return 'bg-warning/5 border-l-warning';
      case 'INFO':
        return 'bg-info/5 border-l-info';
      default:
        return 'bg-muted/5 border-l-muted';
    }
  };

  const getAlertIconColor = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return 'text-destructive bg-destructive/10';
      case 'WARNING':
        return 'text-warning bg-warning/10';
      case 'INFO':
        return 'text-info bg-info/10';
      default:
        return 'text-muted-foreground bg-muted/10';
    }
  };

  const formatAlertTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normalize alerts to an array regardless of API shape
  const alertsArray: any[] = Array.isArray(alerts)
    ? (alerts as any[])
    : (alerts?.data ?? []);

  const totalAlertsCount = Array.isArray(alerts)
    ? (alerts as any[]).length
    : (alerts?.pagination?.total ?? alertsArray.length ?? 0);

  const recentAlerts = alertsArray.slice(0, 5);

  return (
    <Card className="flex flex-col">
      <div className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Active Alerts</h3>
          <Button variant="ghost" size="sm" data-testid="button-alert-settings">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Button>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[1000px]">
        {recentAlerts.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-muted-foreground">No active alerts</p>
            <p className="text-sm text-muted-foreground mt-1">All systems are running normally</p>
          </div>
        ) : (
          recentAlerts.map((alert: any) => (
            <div 
              key={alert.id}
              className={`flex items-start space-x-3 p-4 border-l-4 rounded-lg ${getAlertStyle(alert.type)}`}
              data-testid={`alert-${alert.id}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${getAlertIconColor(alert.type)}`}>
                {getAlertIcon(alert.category)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">{alert.title}</div>
                <div className="text-sm text-muted-foreground">{alert.message}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge 
                    variant={alert.type === 'CRITICAL' ? 'destructive' : 
                            alert.type === 'WARNING' ? 'secondary' : 'default'}
                    className="text-xs"
                  >
                    {alert.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatAlertTime(alert.createdAt)}
                  </span>
                </div>
                
                {!alert.isRead && (
                  <div className="flex items-center space-x-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => acknowledgeMutation.mutate(alert.id)}
                      disabled={acknowledgeMutation.isPending}
                      data-testid={`button-acknowledge-${alert.id}`}
                    >
                      Acknowledge
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveMutation.mutate(alert.id)}
                      disabled={resolveMutation.isPending}
                      data-testid={`button-resolve-${alert.id}`}
                    >
                      Resolve
                    </Button>
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resolveMutation.mutate(alert.id)}
                disabled={resolveMutation.isPending}
                data-testid={`button-dismiss-${alert.id}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          ))
        )}
        
    {recentAlerts.length > 0 && (
          <Button 
            variant="ghost" 
            className="w-full text-primary hover:bg-primary/5"
            data-testid="button-view-all-alerts"
          >
      View All Alerts ({totalAlertsCount})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
