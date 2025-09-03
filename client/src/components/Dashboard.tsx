import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import NavigationHeader from "./NavigationHeader";
import Sidebar from "./Sidebar";
import RoleSpecificDashboard from "./RoleSpecificDashboard";
import DeviceDetailModal from "./DeviceDetailModal";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const openDeviceDetail = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

  const closeDeviceDetail = () => {
    setSelectedDeviceId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        onToggleSidebar={toggleSidebar}
        data-testid="navigation-header"
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
          isMobile={isMobile}
          data-testid="sidebar"
        />
        
        <main className="flex-1 overflow-hidden">
          {/* Dashboard Header */}
          <div className="bg-card border-b border-border p-6" data-testid="dashboard-header">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {user?.role === 'NEC_GENERAL' ? 'Executive Control Center' :
                   user?.role === 'NEC_ENGINEER' ? 'Regional Engineering Dashboard' :
                   user?.role === 'NEC_ADMIN' ? 'Device Management Center' :
                   user?.role === 'CLIENT' ? 'Client Dashboard' :
                   'Device Status Dashboard'}
                </h2>
                <p className="text-muted-foreground">
                  {user?.role === 'NEC_GENERAL' ? 'Complete system authority and oversight' :
                   user?.role === 'NEC_ENGINEER' ? `Regional operations management${user.region ? ` - ${user.region}` : ''}` :
                   user?.role === 'NEC_ADMIN' ? 'Advanced device control and configuration' :
                   user?.role === 'CLIENT' ? 'Real-time device status monitoring' :
                   'Real-time monitoring of RFID devices across toll plazas'}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button 
                  className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  data-testid="button-refresh"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
                
                <select 
                  className="bg-card border border-border text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-ring"
                  data-testid="select-timerange"
                >
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            <RoleSpecificDashboard onDeviceSelect={openDeviceDetail} />
          </div>
        </main>
      </div>

      {selectedDeviceId && (
        <DeviceDetailModal
          deviceId={selectedDeviceId}
          onClose={closeDeviceDetail}
          data-testid="device-detail-modal"
        />
      )}
    </div>
  );
}
