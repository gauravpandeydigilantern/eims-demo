import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import NavigationHeader from "@/components/NavigationHeader";
import Sidebar from "@/components/Sidebar";
import VendorIntegrationManagement from "@/components/VendorIntegrationManagement";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";

export default function VendorIntegrationPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          activeTab="vendor-integration"
        />
        
        <main className="flex-1 overflow-hidden">
          <div className="bg-card border-b border-border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Vendor Integration Management
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Manage third-party vendor integrations and APIs
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge 
                  variant="outline"
                  className="px-3 py-1 text-sm font-medium flex items-center space-x-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>Vendor Integration</span>
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-6">
            <VendorIntegrationManagement />
          </div>
        </main>
      </div>
    </div>
  );
}
