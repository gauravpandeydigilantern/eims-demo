import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import NavigationHeader from "./NavigationHeader";
import Sidebar from "./Sidebar";
import DeviceDetailModal from "./DeviceDetailModal";
import { useDeviceStatusData } from "@/hooks/useDeviceStatusData";
import UnifiedStatusMetrics from "./UnifiedStatusMetrics";
import TollPlazaGrid from "./TollPlazaGrid";
import ConsolidatedDeviceTable from "./ConsolidatedDeviceTable";
import AlertsPanel from "./AlertsPanel";

export default function OptimizedDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: deviceStatusData, isLoading } = useDeviceStatusData();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const openDeviceDetail = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

  const closeDeviceDetail = () => {
    setSelectedDeviceId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
   
        
        <main className="flex-1 overflow-hidden">
       

          <div className="space-y-6 max-w-full overflow-x-hidden">
            {/* Unified Status Overview */}
            <UnifiedStatusMetrics data={deviceStatusData} />
            
            {/* Toll Plaza Grid */}
            <TollPlazaGrid 
              data={deviceStatusData} 
              onDeviceSelect={openDeviceDetail}
            />
            
            {/* Device Table and Alerts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <ConsolidatedDeviceTable 
                  data={deviceStatusData}
                  onDeviceSelect={openDeviceDetail}
                />
              </div>
              <div>
                <AlertsPanel />
              </div>
            </div>
          </div>
        </main>

      {selectedDeviceId && (
        <DeviceDetailModal
          deviceId={selectedDeviceId}
          onClose={closeDeviceDetail}
        />
      )}
    </div>
  );
}