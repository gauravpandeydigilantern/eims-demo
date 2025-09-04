import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Download, 
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Target,
  Brain
} from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';

interface AnalyticsFilters {
  dateRange: string;
  region?: string;
  vendor?: string;
  deviceType?: string;
}

interface PredictiveInsight {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  probability: number;
  estimatedDate: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export default function AdvancedAnalyticsDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: 'last30days',
  });
  
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/analytics/advanced', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/analytics/advanced?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      return response.json();
    },
  });

  // Mock data for demonstration
  const devicePerformanceTrends = [
    { date: '2025-08-01', uptime: 99.5, transactions: 15420, failures: 12, efficiency: 97.8 },
    { date: '2025-08-08', uptime: 99.2, transactions: 16180, failures: 18, efficiency: 96.5 },
    { date: '2025-08-15', uptime: 99.7, transactions: 17250, failures: 8, efficiency: 98.2 },
    { date: '2025-08-22', uptime: 98.9, transactions: 16890, failures: 25, efficiency: 95.1 },
    { date: '2025-08-29', uptime: 99.4, transactions: 18340, failures: 15, efficiency: 97.5 },
    { date: '2025-09-05', uptime: 99.6, transactions: 19120, failures: 10, efficiency: 98.1 },
  ];

  const regionalPerformanceData = [
    { region: 'Maharashtra', devices: 2890, uptime: 98.9, avgResponse: 1.2, sla: 99.1 },
    { region: 'Gujarat', devices: 1580, uptime: 97.8, avgResponse: 1.5, sla: 98.2 },
    { region: 'Karnataka', devices: 1240, uptime: 99.2, avgResponse: 1.1, sla: 99.4 },
    { region: 'Tamil Nadu', devices: 980, uptime: 98.5, avgResponse: 1.3, sla: 98.8 },
    { region: 'Uttar Pradesh', devices: 2340, uptime: 97.9, avgResponse: 1.4, sla: 98.1 },
  ];

  const vendorComparisonData = [
    { vendor: 'BCIL', reliability: 98.9, performance: 96.2, cost: 85, satisfaction: 94 },
    { vendor: 'ZEBRA', reliability: 97.8, performance: 95.1, cost: 78, satisfaction: 92 },
    { vendor: 'IMP', reliability: 96.5, performance: 93.8, cost: 82, satisfaction: 89 },
    { vendor: 'ANJ', reliability: 95.2, performance: 91.5, cost: 79, satisfaction: 87 },
  ];

  const predictiveInsights: PredictiveInsight[] = [
    {
      id: '1',
      type: 'critical',
      title: 'High Failure Risk Detected',
      description: '23 devices in Mumbai zone showing degraded performance patterns',
      probability: 89,
      estimatedDate: '2025-09-12',
      impact: 'high',
      recommendation: 'Schedule preventive maintenance for affected devices'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Capacity Threshold Approaching',
      description: 'Transaction volume in Delhi region expected to exceed capacity',
      probability: 76,
      estimatedDate: '2025-09-20',
      impact: 'medium',
      recommendation: 'Deploy additional devices or optimize load balancing'
    },
    {
      id: '3',
      type: 'info',
      title: 'Maintenance Window Optimization',
      description: 'Optimal maintenance window identified for Karnataka region',
      probability: 95,
      estimatedDate: '2025-09-15',
      impact: 'low',
      recommendation: 'Schedule routine maintenance during low-traffic hours'
    },
  ];

  const anomalyDetectionData = [
    { time: '00:00', normal: 100, anomalies: 2, severity: 1 },
    { time: '04:00', normal: 98, anomalies: 5, severity: 2 },
    { time: '08:00', normal: 95, anomalies: 12, severity: 3 },
    { time: '12:00', normal: 92, anomalies: 18, severity: 4 },
    { time: '16:00', normal: 94, anomalies: 15, severity: 3 },
    { time: '20:00', normal: 97, anomalies: 8, severity: 2 },
  ];

  const kpiData = [
    { name: 'System Uptime', value: 99.2, target: 99.5, trend: 'up', color: '#22c55e' },
    { name: 'Transaction Success Rate', value: 97.8, target: 98.0, trend: 'down', color: '#f59e0b' },
    { name: 'Response Time', value: 1.2, target: 1.0, trend: 'down', color: '#ef4444' },
    { name: 'Device Availability', value: 98.9, target: 99.0, trend: 'up', color: '#3b82f6' },
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <Activity className="w-5 h-5 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportData = (type: string) => {
    // Implementation for data export
    console.log(`Exporting ${type} data...`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-pulse mx-auto mb-2" />
          <p>Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Advanced Analytics Dashboard
          </CardTitle>
          <CardDescription>
            AI-powered insights, predictive analytics, and performance forecasting
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
                <SelectItem value="last6months">Last 6 Months</SelectItem>
                <SelectItem value="lastyear">Last Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.region || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, region: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Regions</SelectItem>
                <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                <SelectItem value="Gujarat">Gujarat</SelectItem>
                <SelectItem value="Karnataka">Karnataka</SelectItem>
                <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.vendor || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, vendor: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Vendors</SelectItem>
                <SelectItem value="BCIL">BCIL</SelectItem>
                <SelectItem value="ZEBRA">ZEBRA</SelectItem>
                <SelectItem value="IMP">IMP</SelectItem>
                <SelectItem value="ANJ">ANJ</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={() => exportData('all')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map((kpi) => (
              <Card key={kpi.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{kpi.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{kpi.value}{kpi.name === 'Response Time' ? 's' : '%'}</p>
                        {kpi.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Target: {kpi.target}{kpi.name === 'Response Time' ? 's' : '%'}</p>
                    </div>
                    <div 
                      className="w-3 h-16 rounded"
                      style={{ backgroundColor: kpi.color }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>System performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={devicePerformanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="uptime" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="transactions" fill="#82ca9d" />
                  <Line yAxisId="left" type="monotone" dataKey="efficiency" stroke="#ff7300" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Regional Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Regional Performance Analysis</CardTitle>
              <CardDescription>Performance metrics by geographic region</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionalPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="uptime" fill="#3b82f6" />
                  <Bar dataKey="sla" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictive Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Predictive Insights
                </CardTitle>
                <CardDescription>AI-powered predictions and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {predictiveInsights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span>Probability: {insight.probability}%</span>
                          <span>Est. Date: {insight.estimatedDate}</span>
                        </div>
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Vendor Comparison Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Performance Radar</CardTitle>
                <CardDescription>Multi-dimensional vendor comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={vendorComparisonData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="vendor" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Reliability" dataKey="reliability" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Performance" dataKey="performance" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Radar name="Cost Efficiency" dataKey="cost" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                    <Radar name="Satisfaction" dataKey="satisfaction" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance scatter plot and other detailed analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance vs Reliability Analysis</CardTitle>
              <CardDescription>Correlation between device performance and reliability metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={vendorComparisonData}>
                  <CartesianGrid />
                  <XAxis dataKey="performance" name="Performance" unit="%" />
                  <YAxis dataKey="reliability" name="Reliability" unit="%" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Vendors" dataKey="satisfaction" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>Real-time anomaly detection and severity analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={anomalyDetectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="normal" stackId="1" stroke="#22c55e" fill="#22c55e" />
                  <Area type="monotone" dataKey="anomalies" stackId="2" stroke="#ef4444" fill="#ef4444" />
                  <Line type="monotone" dataKey="severity" stroke="#f59e0b" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Performance Forecasting
              </CardTitle>
              <CardDescription>
                Machine learning-based performance predictions for the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Forecasting Model Training</h3>
                <p className="text-muted-foreground">
                  Advanced forecasting capabilities are being trained on historical data.
                  Check back soon for predictive insights.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
