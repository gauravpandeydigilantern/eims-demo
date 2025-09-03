import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  ChevronLeft, 
  Download, 
  ExternalLink, 
  Filter,
  Maximize2
} from "lucide-react";
import { useLocation } from "wouter";

interface InteractiveChartWrapperProps {
  title: string;
  data: any[];
  chartType: 'bar' | 'pie' | 'line';
  drillDownData?: { [key: string]: any[] };
  onDrillDown?: (item: any) => void;
  exportData?: any[];
  chartConfig?: any;
  height?: number;
}

export default function InteractiveChartWrapper({
  title,
  data,
  chartType,
  drillDownData,
  onDrillDown,
  exportData,
  chartConfig = {},
  height = 300
}: InteractiveChartWrapperProps) {
  const [drillLevel, setDrillLevel] = useState(0);
  const [currentData, setCurrentData] = useState(data);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [, setLocation] = useLocation();

  const handleBarClick = (data: any) => {
    if (drillDownData && data && onDrillDown) {
      const drillKey = Object.keys(data).find(key => drillDownData[data[key]]);
      if (drillKey && drillDownData[data[drillKey]]) {
        setCurrentData(drillDownData[data[drillKey]]);
        setCurrentTitle(`${title} - ${data[drillKey]} Details`);
        setDrillPath([...drillPath, data[drillKey]]);
        setDrillLevel(drillLevel + 1);
        onDrillDown(data);
      }
    }
  };

  const handleGoBack = () => {
    if (drillLevel > 0) {
      setDrillLevel(drillLevel - 1);
      setDrillPath(drillPath.slice(0, -1));
      
      if (drillLevel === 1) {
        setCurrentData(data);
        setCurrentTitle(title);
      } else {
        // Navigate to previous drill level
        const prevPath = drillPath.slice(0, -1);
        const prevKey = prevPath[prevPath.length - 1];
        if (drillDownData && drillDownData[prevKey]) {
          setCurrentData(drillDownData[prevKey]);
          setCurrentTitle(`${title} - ${prevKey} Details`);
        }
      }
    }
  };

  const exportToCSV = () => {
    const csvData = exportData || currentData;
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTitle.replace(/\s+/g, '_')}_data.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const navigateToDetails = () => {
    setLocation('/devices');
  };

  const renderChart = () => {
    const commonProps = {
      width: "100%",
      height: isExpanded ? height * 1.5 : height
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={currentData} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                          </p>
                        ))}
                        {drillDownData && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Click to drill down
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              {Object.keys(currentData[0] || {}).filter(key => key !== 'name').map((key, index) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  fill={chartConfig[key]?.color || `hsl(${index * 60}, 70%, 50%)`}
                  cursor={drillDownData ? 'pointer' : 'default'}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                outerRadius={isExpanded ? 120 : 80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                onClick={handleBarClick}
              >
                {currentData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || `hsl(${index * 60}, 70%, 50%)`}
                    style={{ cursor: drillDownData ? 'pointer' : 'default' }}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(currentData[0] || {}).filter(key => key !== 'name').map((key, index) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={chartConfig[key]?.color || `hsl(${index * 60}, 70%, 50%)`}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`transition-all duration-300 ${isExpanded ? 'col-span-full' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {drillLevel > 0 && (
              <Button variant="outline" size="sm" onClick={handleGoBack}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <CardTitle className="text-lg">{currentTitle}</CardTitle>
            {drillPath.length > 0 && (
              <div className="flex gap-1">
                {drillPath.map((path, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {path}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToDetails}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
        
        {/* Interactive Controls */}
        {drillLevel === 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
            <span>
              {drillDownData ? 'Click on chart elements to drill down' : 'Static chart view'}
            </span>
            <div className="flex gap-2">
              <Badge variant="outline">
                {currentData.length} items
              </Badge>
              {drillDownData && (
                <Badge variant="outline">
                  Interactive
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}