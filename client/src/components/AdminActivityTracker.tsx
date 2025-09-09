import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserCheck, 
  UserX, 
  Activity, 
  Search, 
  Download, 
  RefreshCw,
  Shield,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format, subDays, subHours } from "date-fns";

interface LoginActivity {
  id: string;
  userId: string;
  email: string;
  role: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  status: 'success' | 'failed' | 'blocked' | 'active';
  sessionDuration?: number;
  failureReason?: string;
}

interface UserAction {
  id: string;
  userId: string;
  email: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  success: boolean;
  details?: any;
}

interface ActivityStats {
  totalLogins: number;
  activeUsers: number;
  failedAttempts: number;
  blockedUsers: number;
  avgSessionDuration: number;
  peakHours: string[];
  securityIncidents: number;
  multipleLoginDetections: number;
}

export default function AdminActivityTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("24h");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: loginActivities, isLoading: loginLoading, refetch: refetchLogins } = useQuery<LoginActivity[]>({
    queryKey: ["/api/admin/login-activities", { timeFilter, statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        timeFilter: timeFilter || "24h", 
        statusFilter: statusFilter || "all" 
      });
      const response = await fetch(`/api/admin/login-activities?${params}`);
      if (!response.ok) throw new Error('Failed to fetch login activities');
      return response.json();
    },
    refetchInterval: 30 * 1000,
  });

  const { data: userActions, isLoading: actionsLoading, refetch: refetchActions } = useQuery<UserAction[]>({
    queryKey: ["/api/admin/user-actions", { timeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({ timeFilter: timeFilter || "24h" });
      const response = await fetch(`/api/admin/user-actions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch user actions');
      return response.json();
    },
    refetchInterval: 30 * 1000,
  });

  const { data: activityStats, isLoading: statsLoading } = useQuery<ActivityStats>({
    queryKey: ["/api/admin/activity-stats"],
    refetchInterval: 60 * 1000,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'success': { variant: 'default' as const, className: 'bg-green-600 text-white', icon: CheckCircle },
      'active': { variant: 'default' as const, className: 'bg-blue-600 text-white', icon: Activity },
      'failed': { variant: 'destructive' as const, className: '', icon: XCircle },
      'blocked': { variant: 'destructive' as const, className: 'bg-red-800 text-white', icon: Shield }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      variant: 'outline' as const, 
      className: '', 
      icon: AlertTriangle 
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Smartphone className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'NEC_GENERAL': 'bg-purple-100 text-purple-800',
      'NEC_ADMIN': 'bg-blue-100 text-blue-800',
      'NEC_ENGINEER': 'bg-green-100 text-green-800',
      'CLIENT': 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredLoginActivities = loginActivities?.filter(activity => {
    if (searchTerm && !activity.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && activity.status !== statusFilter) {
      return false;
    }
    return true;
  }) || [];

  const filteredUserActions = userActions?.filter(action => {
    if (searchTerm && !action.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  // Debug logging
  console.log('AdminActivityTracker Debug:', {
    loginActivities: loginActivities?.length || 0,
    userActions: userActions?.length || 0,
    activityStats: activityStats,
    filteredLoginActivities: filteredLoginActivities.length,
    filteredUserActions: filteredUserActions.length,
    timeFilter,
    statusFilter,
    searchTerm
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Statistics */}
      {activityStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {activityStats.totalLogins}
              </div>
              <p className="text-xs text-blue-600">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {activityStats.activeUsers}
              </div>
              <p className="text-xs text-green-600">
                Currently online
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {activityStats.failedAttempts}
              </div>
              <p className="text-xs text-red-600">
                Security incidents: {activityStats.securityIncidents}
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {Math.round(activityStats.avgSessionDuration / 60)}m
              </div>
              <p className="text-xs text-orange-600">
                Multiple logins: {activityStats.multipleLoginDetections}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Activity Monitoring</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => {
                refetchLogins();
                refetchActions();
              }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 mb-4">
            <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="logins" className="space-y-4">
            <TabsList>
              <TabsTrigger value="logins">Login Activity</TabsTrigger>
              <TabsTrigger value="actions">User Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="logins" className="space-y-4">
              <div className="overflow-x-auto min-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">User</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[140px]">Login Time</TableHead>
                      <TableHead className="min-w-[100px]">Duration</TableHead>
                      <TableHead className="min-w-[120px]">Location</TableHead>
                      <TableHead className="min-w-[100px]">Device</TableHead>
                      <TableHead className="min-w-[130px]">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : !filteredLoginActivities || filteredLoginActivities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No login activities found for the selected timeframe
                          {loginActivities === undefined && <div className="text-xs mt-2">Check console for API errors</div>}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLoginActivities
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((activity) => (
                        <TableRow key={activity.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-sm">{activity.email}</div>
                              <Badge variant="outline" className={getRoleColor(activity.role)}>
                                {activity.role.replace('_', ' ')}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(activity.status)}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(activity.loginTime), "MMM dd, HH:mm")}
                          </TableCell>
                          <TableCell className="text-sm">
                            {activity.sessionDuration 
                              ? `${Math.round(activity.sessionDuration / 60)}m`
                              : activity.status === 'active' ? 'Active' : 'N/A'
                            }
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              {activity.location || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getDeviceIcon(activity.deviceType)}
                              <span className="text-sm capitalize">{activity.deviceType}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {activity.ipAddress}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {filteredLoginActivities.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredLoginActivities.length)} of {filteredLoginActivities.length}
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
                      Page {currentPage} of {Math.ceil(filteredLoginActivities.length / itemsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredLoginActivities.length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage === Math.ceil(filteredLoginActivities.length / itemsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div className="overflow-x-auto min-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">User</TableHead>
                      <TableHead className="min-w-[160px]">Action</TableHead>
                      <TableHead className="min-w-[120px]">Resource</TableHead>
                      <TableHead className="min-w-[140px]">Time</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[130px]">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : !filteredUserActions || filteredUserActions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No user actions found for the selected timeframe
                          {userActions === undefined && <div className="text-xs mt-2">Check console for API errors</div>}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUserActions.map((action) => (
                        <TableRow key={action.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-sm">{action.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {action.action.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono">{action.resource}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(action.timestamp), "MMM dd, HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            {action.success ? (
                              <Badge variant="default" className="bg-green-600 text-white">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                SUCCESS
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                FAILED
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-mono">{action.ipAddress}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}