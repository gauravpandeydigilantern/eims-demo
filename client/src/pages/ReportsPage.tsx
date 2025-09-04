import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import NavigationHeader from "@/components/NavigationHeader";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, BarChart3, Users, Activity } from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const reportTypes = [
    {
      title: "Device Performance Report",
      description: "Comprehensive device health and performance metrics",
      icon: <BarChart3 className="w-5 h-5" />,
      available: true
    },
    {
      title: "System Activity Report",
      description: "User activities and system usage statistics",
      icon: <Activity className="w-5 h-5" />,
      available: true
    },
    {
      title: "User Management Report",
      description: "User access and role management summary",
      icon: <Users className="w-5 h-5" />,
      available: user?.role === 'NEC_ADMIN' || user?.role === 'NEC_GENERAL'
    },
    {
      title: "Analytics Summary Report",
      description: "Project-level analytics and insights",
      icon: <FileText className="w-5 h-5" />,
      available: user?.role !== 'CLIENT'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          activeTab="reports"
        />
        
        <main className="flex-1 overflow-hidden">
          <div className="bg-card border-b border-border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Reports & Analytics
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Generate and download system reports
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge 
                  variant="outline"
                  className="px-3 py-1 text-sm font-medium flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Reports</span>
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportTypes.filter(report => report.available).map((report, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {report.icon}
                      <span>{report.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" className="flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Schedule</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Custom Report</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Report Schedule</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
