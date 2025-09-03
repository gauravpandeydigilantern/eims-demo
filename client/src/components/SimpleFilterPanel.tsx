import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter, RefreshCw, Download, Search, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface FilterOptions {
  searchTerm: string;
  regions: string[];
  vendors: string[];
  statuses: string[];
  deviceTypes: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
    preset?: string;
  };
  performanceFilters: {
    minUptime?: number;
    maxResponseTime?: number;
    minTransactions?: number;
  };
  healthFilters: {
    cpuThreshold?: number;
    temperatureThreshold?: number;
    batteryThreshold?: number;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SimpleFilterPanelProps {
  onFiltersChange: (filters: FilterOptions) => void;
  availableRegions: string[];
  availableVendors: string[];
  totalDevices: number;
  filteredCount: number;
}

export default function SimpleFilterPanel({ 
  onFiltersChange, 
  availableRegions, 
  availableVendors,
  totalDevices,
  filteredCount 
}: SimpleFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: "",
    regions: [],
    vendors: [],
    statuses: [],
    deviceTypes: [],
    dateRange: { from: null, to: null },
    performanceFilters: {},
    healthFilters: {},
    sortBy: "lastSeen",
    sortOrder: "desc"
  });

  const statusOptions = ["LIVE", "DOWN", "SHUTDOWN", "MAINTENANCE", "WARNING"];
  const deviceTypeOptions = ["FIXED_READER", "HANDHELD_DEVICE"];
  const sortOptions = [
    { value: "id", label: "Device ID" },
    { value: "lastSeen", label: "Last Seen" },
    { value: "lastTransaction", label: "Last Transaction" },
    { value: "uptime", label: "Uptime" },
    { value: "transactionCount", label: "Transaction Count" },
    { value: "region", label: "Region" },
    { value: "status", label: "Status" }
  ];

  const datePresets = [
    { label: "Last 24 hours", value: "24h" },
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 3 months", value: "3m" },
  ];

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateArrayFilter = (key: 'regions' | 'vendors' | 'statuses' | 'deviceTypes', value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: checked 
        ? [...prev[key], value]
        : prev[key].filter(item => item !== value)
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: "",
      regions: [],
      vendors: [],
      statuses: [],
      deviceTypes: [],
      dateRange: { from: null, to: null },
      performanceFilters: {},
      healthFilters: {},
      sortBy: "lastSeen",
      sortOrder: "desc"
    });
  };

  const handleDatePreset = (preset: string) => {
    const now = new Date();
    let from: Date;
    
    switch (preset) {
      case "24h":
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3m":
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    updateFilter('dateRange', { from, to: now, preset });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.regions.length > 0) count++;
    if (filters.vendors.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.deviceTypes.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (Object.keys(filters.performanceFilters).length > 0) count++;
    if (Object.keys(filters.healthFilters).length > 0) count++;
    return count;
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Device Filters
            </CardTitle>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()} active</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {filteredCount} of {totalDevices} devices
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Filters - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Search Devices</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ID, MAC, Asset ID..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={filters.statuses[0] || "all"} 
              onValueChange={(value) => updateFilter('statuses', value === "all" ? [] : [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Select 
              value={filters.sortOrder} 
              onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters - Expandable */}
        {isExpanded && (
          <>
            <Separator />
            
            {/* Location & Device Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Regions</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableRegions.map(region => (
                    <div key={region} className="flex items-center space-x-2">
                      <Checkbox
                        id={`region-${region}`}
                        checked={filters.regions.includes(region)}
                        onCheckedChange={(checked) => 
                          updateArrayFilter('regions', region, checked as boolean)
                        }
                      />
                      <Label htmlFor={`region-${region}`} className="text-sm">{region}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Vendors</Label>
                <div className="space-y-2">
                  {availableVendors.map(vendor => (
                    <div key={vendor} className="flex items-center space-x-2">
                      <Checkbox
                        id={`vendor-${vendor}`}
                        checked={filters.vendors.includes(vendor)}
                        onCheckedChange={(checked) => 
                          updateArrayFilter('vendors', vendor, checked as boolean)
                        }
                      />
                      <Label htmlFor={`vendor-${vendor}`} className="text-sm">{vendor}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Device Types</Label>
                <div className="space-y-2">
                  {deviceTypeOptions.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={filters.deviceTypes.includes(type)}
                        onCheckedChange={(checked) => 
                          updateArrayFilter('deviceTypes', type, checked as boolean)
                        }
                      />
                      <Label htmlFor={`type-${type}`} className="text-sm">
                        {type.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Date Range Filter - Simplified */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Date Range</Label>
              <div className="flex flex-wrap gap-2">
                {datePresets.map(preset => (
                  <Button
                    key={preset.label}
                    variant={filters.dateRange.preset === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDatePreset(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
                {(filters.dateRange.from || filters.dateRange.to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilter('dateRange', { from: null, to: null })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {filters.dateRange.from && (
                <p className="text-sm text-muted-foreground">
                  {filters.dateRange.from.toLocaleDateString()} - {" "}
                  {filters.dateRange.to ? filters.dateRange.to.toLocaleDateString() : "Present"}
                </p>
              )}
            </div>

            <Separator />

            {/* Performance Thresholds */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Min Uptime (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 95"
                  value={filters.performanceFilters.minUptime || ''}
                  onChange={(e) => updateFilter('performanceFilters', {
                    ...filters.performanceFilters,
                    minUptime: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Max CPU Usage (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 80"
                  value={filters.healthFilters.cpuThreshold || ''}
                  onChange={(e) => updateFilter('healthFilters', {
                    ...filters.healthFilters,
                    cpuThreshold: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Max Temperature (°C)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 65"
                  value={filters.healthFilters.temperatureThreshold || ''}
                  onChange={(e) => updateFilter('healthFilters', {
                    ...filters.healthFilters,
                    temperatureThreshold: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            {getActiveFilterCount() > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filteredCount === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export ({filteredCount})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
