import NavigationHeader from "@/components/NavigationHeader";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
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
          <div className="max-w-6xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>System configuration and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                {/* System Settings content migrated from RoleDashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Device Management</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-restart failed devices</span>
                        <Button variant="outline" size="sm">Enabled</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Health check interval</span>
                        <span className="text-sm text-muted-foreground">30 seconds</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Alert threshold</span>
                        <span className="text-sm text-muted-foreground">3 failures</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Security & Access</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Session timeout</span>
                        <span className="text-sm text-muted-foreground">4 hours</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Two-factor authentication</span>
                        <Button variant="outline" size="sm">Required</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Audit logging</span>
                        <Button variant="outline" size="sm">Enabled</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">System Configuration</h4>
                      <p className="text-sm text-muted-foreground">Manage global system settings</p>
                    </div>
                    <Button data-testid="button-advanced-settings">Advanced Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
