import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import NavigationHeader from "@/components/NavigationHeader";
import Sidebar from "@/components/Sidebar";
import DeviceListTable from "@/components/DeviceListTable";
import EnhancedDeviceDataView from "@/components/EnhancedDeviceDataView";
import NLDSDeviceTable from "@/components/NLDSDeviceTable";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Table } from "lucide-react";

export default function DataViewPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

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
          activeTab="data"
        />
        
        <main className="flex-1 overflow-hidden">
          <div className="bg-card border-b border-border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Data View
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Device Data Management & Analysis
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge 
                  variant="outline"
                  className="px-3 py-1 text-sm font-medium flex items-center space-x-2"
                >
                  <Database className="w-4 h-4" />
                  <span>Data Management</span>
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Device Data View based on role */}
            {user?.role === 'NEC_GENERAL' ? (
              <EnhancedDeviceDataView />
            ) : user?.role === 'NEC_ENGINEER' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Table className="w-5 h-5" />
                    <span>Device Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DeviceListTable onDeviceSelect={setSelectedDeviceId} />
                </CardContent>
              </Card>
            ) : user?.role === 'NEC_ADMIN' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Device Database Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DeviceListTable onDeviceSelect={setSelectedDeviceId} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Table className="w-5 h-5" />
                    <span>NLDS Device Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NLDSDeviceTable />
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
