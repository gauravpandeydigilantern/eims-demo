import NavigationHeader from "@/components/NavigationHeader";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AIAssistant from "@/components/AIAssistant";

export default function AIAssistantPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavigationHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={false} activeTab="operations" onTabChange={() => {}} />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Assistant</CardTitle>
                <CardDescription>Ask questions, troubleshoot, and get insights</CardDescription>
              </CardHeader>
              <CardContent>
                <AIAssistant />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
