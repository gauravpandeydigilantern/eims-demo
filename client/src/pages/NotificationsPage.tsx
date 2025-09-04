import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import NavigationHeader from "@/components/NavigationHeader";
import Sidebar from "@/components/Sidebar";
import NotificationManagement from "@/components/NotificationManagement";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
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
          activeTab="notifications"
        />
        
        <main className="flex-1 overflow-hidden">
          <div className="bg-card border-b border-border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Notification Management
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Configure and manage system notifications
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge 
                  variant="secondary"
                  className="px-3 py-1 text-sm font-medium flex items-center space-x-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-6">
            <NotificationManagement />
          </div>
        </main>
      </div>
    </div>
  );
}
