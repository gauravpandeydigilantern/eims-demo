import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Sidebar({ isOpen, onClose, isMobile, activeTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();
  
  const { data: alertsSummary } = useQuery<{ total: number; critical: number; warning: number; info: number }>({
    queryKey: ["/api/alerts/summary"],
    refetchInterval: 30 * 1000,
  });

  const canAccessUserManagement = user?.role === 'NEC_GENERAL' || user?.role === 'NEC_ADMIN';
  const canAccessAnalytics = user?.role !== 'CLIENT';

  // Map sidebar navigation to tab values based on user role
  const getSidebarToTabMap = (): Record<string, string> => {
    if (user?.role === 'NEC_GENERAL') {
      return {
        'overview': 'overview',
        'device-map': 'overview', // Device map is in Overview tab
        'alerts': 'alerts',
        'analytics': 'analytics',
        'reports': 'reports',
        'ai-assistant': 'operations', // AI Assistant is in Operations tab
        'user-management': 'operations', // User Management is in Operations tab  
        'settings': 'operations' // Settings is in Operations tab
      };
    } else if (user?.role === 'NEC_ENGINEER') {
      return {
        'overview': 'monitoring',
        'device-map': 'monitoring',
        'alerts': 'monitoring', 
        'analytics': 'analytics',
        'reports': 'reports',
        'ai-assistant': 'maintenance',
        'user-management': 'monitoring',
        'settings': 'monitoring'
      };
    } else if (user?.role === 'NEC_ADMIN') {
      return {
        'overview': 'devices',
        'device-map': 'devices',
        'alerts': 'devices',
        'analytics': 'analytics',
        'reports': 'logs',
        'ai-assistant': 'devices',
        'user-management': 'users',
        'settings': 'configuration'
      };
    } else { // CLIENT
      return {
        'overview': 'overview',
        'device-map': 'overview',
        'alerts': 'overview',
        'analytics': 'analytics',
        'reports': 'reports',
        'ai-assistant': 'overview',
        'user-management': 'overview',
        'settings': 'service'
      };
    }
  };

  const handleLinkClick = (sidebarTab?: string) => {
    return () => {
      if (sidebarTab && onTabChange) {
        const sidebarToTabMap = getSidebarToTabMap();
        const tabValue = sidebarToTabMap[sidebarTab] || sidebarTab;
        onTabChange(tabValue);
      }
      if (isMobile) {
        onClose();
      }
    };
  };

  // Function to check if a sidebar item should be active
  const isSidebarItemActive = (sidebarTab: string): boolean => {
    if (!activeTab) return false;
    const sidebarToTabMap = getSidebarToTabMap();
    const mappedTab = sidebarToTabMap[sidebarTab];
    return activeTab === mappedTab;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-card border-r border-border shadow-sm h-screen sticky top-0 flex-shrink-0 transition-transform duration-300 z-50",
        isMobile && "fixed left-0 top-0",
        isMobile && !isOpen && "-translate-x-full",
        !isMobile && "translate-x-0"
      )}>
        <div className="p-6">
          <nav className="space-y-2">
            <button 
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 font-medium w-full text-left transition-colors ${
                isSidebarItemActive('overview') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('overview')}
              data-testid="link-dashboard"
            >
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2H3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v6l3-3 3 3V5" />
              </svg>
              <span>Dashboard</span>
            </button>
            
            <button 
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 w-full text-left transition-colors ${
                isSidebarItemActive('device-map') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('device-map')}
              data-testid="link-device-map"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Device Map</span>
            </button>
            
            <button 
              className={`flex items-center justify-between rounded-lg px-3 py-2 w-full text-left transition-colors ${
                isSidebarItemActive('alerts') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('alerts')}
              data-testid="link-alerts"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Alerts</span>
              </div>
              {alertsSummary?.total && alertsSummary.total > 0 && (
                <Badge 
                  variant="destructive" 
                  className="text-xs"
                  data-testid="badge-alerts-count"
                >
                  {alertsSummary.total}
                </Badge>
              )}
            </button>
            
            {canAccessAnalytics && (
              <button 
                className={`flex items-center space-x-3 rounded-lg px-3 py-2 w-full text-left transition-colors ${
                  isSidebarItemActive('analytics') 
                    ? 'text-foreground bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={handleLinkClick('analytics')}
                data-testid="link-analytics"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
                </svg>
                <span>Analytics</span>
              </button>
            )}
            
            <button 
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 w-full text-left transition-colors ${
                isSidebarItemActive('reports') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('reports')}
              data-testid="link-reports"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Reports</span>
            </button>
            
            <button 
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 w-full text-left transition-colors ${
                isSidebarItemActive('ai-assistant') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('ai-assistant')}
              data-testid="link-ai-assistant"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>AI Assistant</span>
            </button>
            
            {canAccessUserManagement && (
              <button 
                className={`flex items-center space-x-3 rounded-lg px-3 py-2 w-full text-left transition-colors ${
                  isSidebarItemActive('user-management') 
                    ? 'text-foreground bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={handleLinkClick('user-management')}
                data-testid="link-user-management"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>User Management</span>
              </button>
            )}
            
            <button 
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 w-full text-left transition-colors ${
                isSidebarItemActive('settings') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('settings')}
              data-testid="link-settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Quick Stats */}
        <div className="px-6 py-4 border-t border-border mt-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">System Status</span>
              <span className="text-success font-medium" data-testid="status-system">Operational</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Update</span>
              <span className="text-foreground" data-testid="text-last-update">Live</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
