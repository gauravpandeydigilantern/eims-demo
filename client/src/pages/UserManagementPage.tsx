import NavigationHeader from "@/components/NavigationHeader";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import UserManagement from "@/components/UserManagement";

export default function UserManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavigationHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex">
                <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users, roles, and access</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
