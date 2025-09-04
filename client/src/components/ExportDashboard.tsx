import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { 
  Download, 
  FileText, 
  Table, 
  Image, 
  Mail,
  Calendar,
  Filter,
  Settings
} from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  includeCharts: boolean;
  includeSummary: boolean;
  dateRange: string;
  regions: string[];
  vendors: string[];
}

export default function ExportDashboard() {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'xlsx',
    includeCharts: false,
    includeSummary: true,
    dateRange: '30d',
    regions: [],
    vendors: []
  });

  const [isExporting, setIsExporting] = useState(false);

  const { data: devicesResponse } = useQuery<{success: boolean, data: any[]}>({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  // Extract devices array from response
  const devices = devicesResponse?.data || [];

  const { data: statusSummary } = useQuery<Array<{status: string; count: number}>>({
    queryKey: ["/api/analytics/status-summary"],
  });

  const { data: alertsSummary } = useQuery<{total: number; critical: number; warning: number; info: number}>({
    queryKey: ["/api/alerts/summary"],
  });

  // Generate comprehensive data for export
  const generateExportData = () => {
    const now = new Date();
    const totalDevices = devices?.length || 0;
    const liveDevices = devices?.filter(d => d.status === 'LIVE')?.length || 0;
    const downDevices = devices?.filter(d => d.status === 'DOWN')?.length || 0;
    const uptimePercentage = totalDevices > 0 ? Math.round((liveDevices / totalDevices) * 100) : 0;

    return {
      summary: {
        generatedAt: now.toISOString(),
        totalDevices,
        liveDevices,
        downDevices,
        uptimePercentage,
        alertsSummary: alertsSummary || { total: 0, critical: 0, warning: 0, info: 0 }
      },
      devices: devices || [],
      statusBreakdown: statusSummary || [],
      regionalData: devices?.reduce((acc, device) => {
        const region = device.region || 'Unknown';
        if (!acc[region]) {
          acc[region] = { total: 0, live: 0, down: 0, maintenance: 0 };
        }
        acc[region].total++;
        acc[region][device.status.toLowerCase()]++;
        return acc;
      }, {} as Record<string, any>) || {},
      vendorData: devices?.reduce((acc, device) => {
        const vendor = device.vendor || 'Unknown';
        if (!acc[vendor]) {
          acc[vendor] = { total: 0, live: 0, down: 0, uptime: 0 };
        }
        acc[vendor].total++;
        if (device.status === 'LIVE') acc[vendor].live++;
        if (device.status === 'DOWN') acc[vendor].down++;
        acc[vendor].uptime = acc[vendor].total > 0 ? Math.round((acc[vendor].live / acc[vendor].total) * 100) : 0;
        return acc;
      }, {} as Record<string, any>) || {}
    };
  };

  const exportToCSV = (data: any) => {
    const csvRows = [];
    
    // Add summary section
    if (exportOptions.includeSummary) {
      csvRows.push(['EIMS Dashboard Export Summary']);
      csvRows.push(['Generated At', data.summary.generatedAt]);
      csvRows.push(['Total Devices', data.summary.totalDevices]);
      csvRows.push(['Live Devices', data.summary.liveDevices]);
      csvRows.push(['Down Devices', data.summary.downDevices]);
      csvRows.push(['Uptime Percentage', `${data.summary.uptimePercentage}%`]);
      csvRows.push([]);
    }

    // Add device data
    csvRows.push(['Device Details']);
    if (data.devices.length > 0) {
      const headers = Object.keys(data.devices[0]);
      csvRows.push(headers);
      data.devices.forEach((device: any) => {
        csvRows.push(headers.map(header => device[header] || ''));
      });
    }

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EIMS_Dashboard_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = (data: any) => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    if (exportOptions.includeSummary) {
      const summaryData = [
        ['EIMS Dashboard Export Summary'],
        ['Generated At', data.summary.generatedAt],
        ['Total Devices', data.summary.totalDevices],
        ['Live Devices', data.summary.liveDevices],
        ['Down Devices', data.summary.downDevices],
        ['Uptime Percentage', `${data.summary.uptimePercentage}%`],
        [''],
        ['Alert Summary'],
        ['Total Alerts', data.summary.alertsSummary.total],
        ['Critical Alerts', data.summary.alertsSummary.critical],
        ['Warning Alerts', data.summary.alertsSummary.warning],
        ['Info Alerts', data.summary.alertsSummary.info]
      ];
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
    }

    // Devices sheet
    if (data.devices.length > 0) {
      const devicesWS = XLSX.utils.json_to_sheet(data.devices);
      XLSX.utils.book_append_sheet(wb, devicesWS, 'Devices');
    }

    // Regional analysis sheet
    const regionalArray = Object.entries(data.regionalData).map(([region, stats]: [string, any]) => ({
      Region: region,
      Total: stats.total,
      Live: stats.live,
      Down: stats.down,
      Maintenance: stats.maintenance,
      'Uptime %': stats.total > 0 ? Math.round((stats.live / stats.total) * 100) : 0
    }));
    const regionalWS = XLSX.utils.json_to_sheet(regionalArray);
    XLSX.utils.book_append_sheet(wb, regionalWS, 'Regional Analysis');

    // Vendor analysis sheet
    const vendorArray = Object.entries(data.vendorData).map(([vendor, stats]: [string, any]) => ({
      Vendor: vendor,
      Total: stats.total,
      Live: stats.live,
      Down: stats.down,
      'Uptime %': stats.uptime
    }));
    const vendorWS = XLSX.utils.json_to_sheet(vendorArray);
    XLSX.utils.book_append_sheet(wb, vendorWS, 'Vendor Analysis');

    XLSX.writeFile(wb, `EIMS_Dashboard_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = (data: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.text('EIMS Dashboard Export Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    // Summary section
    if (exportOptions.includeSummary) {
      doc.setFontSize(16);
      doc.text('Executive Summary', 20, yPos);
      yPos += 10;

      doc.setFontSize(12);
      const summaryLines = [
        `Generated: ${new Date(data.summary.generatedAt).toLocaleString()}`,
        `Total Devices: ${data.summary.totalDevices}`,
        `Live Devices: ${data.summary.liveDevices}`,
        `Down Devices: ${data.summary.downDevices}`,
        `System Uptime: ${data.summary.uptimePercentage}%`,
        `Active Alerts: ${data.summary.alertsSummary.total}`
      ];

      summaryLines.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 8;
      });
      yPos += 10;
    }

    // Device status table
    if (data.devices.length > 0) {
      doc.setFontSize(14);
      doc.text('Device Status Overview', 20, yPos);
      yPos += 10;

      const tableHeaders = ['Device ID', 'Status', 'Region', 'Vendor', 'Last Seen'];
      const tableData = data.devices.slice(0, 50).map((device: any) => [
        device.id || '',
        device.status || '',
        device.region || '',
        device.vendor || '',
        device.lastSeen ? new Date(device.lastSeen).toLocaleDateString() : 'N/A'
      ]);

      (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;
    }

    // Regional analysis
    if (Object.keys(data.regionalData).length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Regional Analysis', 20, yPos);
      yPos += 10;

      const regionalHeaders = ['Region', 'Total', 'Live', 'Down', 'Uptime %'];
      const regionalData = Object.entries(data.regionalData).map(([region, stats]: [string, any]) => [
        region,
        stats.total.toString(),
        stats.live.toString(),
        stats.down.toString(),
        `${stats.total > 0 ? Math.round((stats.live / stats.total) * 100) : 0}%`
      ]);

      (doc as any).autoTable({
        head: [regionalHeaders],
        body: regionalData,
        startY: yPos,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [39, 174, 96] }
      });
    }

    doc.save(`EIMS_Dashboard_Export_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToJSON = (data: any) => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EIMS_Dashboard_Export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = generateExportData();

      switch (exportOptions.format) {
        case 'csv':
          exportToCSV(data);
          break;
        case 'xlsx':
          exportToExcel(data);
          break;
        case 'pdf':
          exportToPDF(data);
          break;
        case 'json':
          exportToJSON(data);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
      case 'xlsx':
        return <Table className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'json':
        return <Settings className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Dashboard Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Format Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: 'xlsx', label: 'Excel (XLSX)', description: 'Multiple sheets with detailed data' },
              { value: 'csv', label: 'CSV', description: 'Simple comma-separated values' },
              { value: 'pdf', label: 'PDF Report', description: 'Formatted business report' },
              { value: 'json', label: 'JSON', description: 'Raw data for developers' }
            ].map((format) => (
              <Button
                key={format.value}
                variant={exportOptions.format === format.value ? "default" : "outline"}
                className="h-auto p-3 flex flex-col items-center gap-2"
                onClick={() => setExportOptions({ ...exportOptions, format: format.value as any })}
              >
                {getFormatIcon(format.value)}
                <div className="text-center">
                  <div className="font-medium">{format.label}</div>
                  <div className="text-xs text-muted-foreground">{format.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <Label>Export Options</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-summary"
                checked={exportOptions.includeSummary}
                onCheckedChange={(checked) => 
                  setExportOptions({ ...exportOptions, includeSummary: !!checked })
                }
              />
              <Label htmlFor="include-summary">Include executive summary</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-charts"
                checked={exportOptions.includeCharts}
                onCheckedChange={(checked) => 
                  setExportOptions({ ...exportOptions, includeCharts: !!checked })
                }
              />
              <Label htmlFor="include-charts">Include chart images (PDF only)</Label>
            </div>
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="space-y-2">
          <Label>Data Range</Label>
          <Select 
            value={exportOptions.dateRange} 
            onValueChange={(value) => setExportOptions({ ...exportOptions, dateRange: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last quarter</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Export Preview</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Format</div>
              <div className="font-medium">{exportOptions.format.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Device Count</div>
              <div className="font-medium">{devices?.length || 0} devices</div>
            </div>
            <div>
              <div className="text-muted-foreground">Date Range</div>
              <div className="font-medium">{exportOptions.dateRange}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Estimated Size</div>
              <div className="font-medium">
                {exportOptions.format === 'pdf' ? '~2-5 MB' : '~500 KB - 2 MB'}
              </div>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating Export...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate Export
            </>
          )}
        </Button>

        {/* Quick Export Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setExportOptions({ ...exportOptions, format: 'xlsx' });
              setTimeout(handleExport, 100);
            }}
          >
            <Table className="w-4 h-4 mr-1" />
            Quick Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setExportOptions({ ...exportOptions, format: 'pdf' });
              setTimeout(handleExport, 100);
            }}
          >
            <FileText className="w-4 h-4 mr-1" />
            Quick PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setExportOptions({ ...exportOptions, format: 'csv' });
              setTimeout(handleExport, 100);
            }}
          >
            <Download className="w-4 h-4 mr-1" />
            Quick CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}