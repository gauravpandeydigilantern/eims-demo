import React from 'react';
import { Clock, Activity, TrendingUp, AlertCircle, Heart, BarChart3, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DeviceHealthStatusProps {
  activeDevices48H?: number;
  activeDevices1W?: number;
  activeDevices15D?: number;
  timeDiff?: number;
  loading?: boolean;
  lastUpdated?: string;
}

const DeviceHealthStatus: React.FC<DeviceHealthStatusProps> = ({
  activeDevices48H = 247,  // Realistic numbers for toll plaza system
  activeDevices1W = 312,
  activeDevices15D = 289,
  timeDiff = 3,
  loading = false,
  lastUpdated
}) => {
  const formatTimeDiff = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getTimeDiffColor = (seconds: number): string => {
    if (seconds <= 5) return 'text-green-600';
    if (seconds <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTimeDiffBadgeColor = (seconds: number): string => {
    if (seconds <= 5) return 'bg-green-100 text-green-800';
    if (seconds <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const metrics = [
    {
      label: 'Active 48H',
      value: activeDevices48H,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Devices active in last 48 hours'
    },
    {
      label: 'Active 1W',
      value: activeDevices1W,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Devices active in last week'
    },
    {
      label: 'Active 15D',
      value: activeDevices15D,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Devices active in last 15 days'
    },
    {
      label: 'Time Diff',
      value: formatTimeDiff(timeDiff),
      icon: AlertCircle,
      color: getTimeDiffColor(timeDiff),
      bgColor: timeDiff <= 5 ? 'bg-green-50' : timeDiff <= 30 ? 'bg-yellow-50' : 'bg-red-50',
      borderColor: timeDiff <= 5 ? 'border-green-200' : timeDiff <= 30 ? 'border-yellow-200' : 'border-red-200',
      description: 'Average sync time difference'
    }
  ];

  if (loading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center">Device Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Device Health Status</CardTitle>
          {lastUpdated && (
            <div className="text-xs text-gray-500">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <div
                key={index}
                className={`text-center p-4 rounded-lg ${metric.bgColor} border ${metric.borderColor} transition-all hover:shadow-md hover:scale-105`}
              >
                <div className="flex justify-center mb-2">
                  <IconComponent className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className={`text-3xl font-bold ${metric.color} mb-1`}>
                  {metric.value}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {metric.label}
                </div>
                <div className="text-xs text-gray-500">
                  {metric.description}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Heart className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600 mb-1">Device Health Score</div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((activeDevices48H / Math.max(activeDevices15D, 1)) * 100)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Based on 48H vs 15D activity
              </div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600 mb-1">Activity Trend</div>
              <div className="text-2xl font-bold flex items-center justify-center gap-2">
                <span className={activeDevices48H >= activeDevices1W ? 'text-green-600' : 'text-red-600'}>
                  {activeDevices48H >= activeDevices1W ? '↗' : '↘'}
                </span>
                <span className="text-gray-700">
                  {Math.abs(activeDevices48H - activeDevices1W)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Change from last week
              </div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <RefreshCw className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600 mb-1">Sync Status</div>
              <div className={`text-lg font-bold px-2 py-1 rounded-full text-xs inline-block ${
                timeDiff <= 5 ? 'bg-green-100 text-green-800' : 
                timeDiff <= 30 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
              }`}>
                {timeDiff <= 5 ? 'EXCELLENT' : timeDiff <= 30 ? 'GOOD' : 'NEEDS ATTENTION'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                System synchronization
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceHealthStatus;
