import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  activeTab?: string;
}

export default function Sidebar({ isOpen, onClose, isMobile, activeTab }: SidebarProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: alertsSummary } = useQuery<{ total: number; critical: number; warning: number; info: number }>({
    queryKey: ["/api/alerts/summary"],
    refetchInterval: 30 * 1000,
  });

  const canAccessUserManagement = user?.role === 'NEC_GENERAL' || user?.role === 'NEC_ADMIN';
  const canAccessAnalytics = user?.role !== 'CLIENT';

  const handleLinkClick = (route: string) => {
    return () => {
      navigate(route);
      if (isMobile) {
        onClose();
      }
    };
  };

  // Function to check if a route should be active
  const isRouteActive = (route: string): boolean => {
    if (route === '/') {
      return window.location.pathname === '/';
    }
    return window.location.pathname === route;
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
                isRouteActive('/') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('/')}
              data-testid="link-dashboard"
            >
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2H3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v6l3-3 3 3V5" />
              </svg>
              <span>Dashboard</span>
            </button>

            <button 
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 font-medium w-full text-left transition-colors ${
                isRouteActive('/data') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('/data')}
              data-testid="link-data-view"
            >
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2H3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6m-6 3h6m-6 3h6" />
              </svg>
              <span>Data View</span>
            </button>
            
            <button 
              className={`flex items-center justify-between rounded-lg px-3 py-2 w-full text-left transition-colors ${
                isRouteActive('/alerts') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('/alerts')}
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
                  isRouteActive('/analytics') 
                    ? 'text-foreground bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={handleLinkClick('/analytics')}
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
                isRouteActive('/reports') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('/reports')}
              data-testid="link-reports"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Reports</span>
            </button>
            
            <button 
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 w-full text-left transition-colors ${
                isRouteActive('/ai-assistant') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('/ai-assistant')}
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
                  isRouteActive('/users') 
                    ? 'text-foreground bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={handleLinkClick('/users')}
                data-testid="link-user-management"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>User Management</span>
              </button>
            )}
            
            {/* Notifications - Only for NEC_ADMIN */}
            {user?.role === 'NEC_ADMIN' && (
              <button 
                className={`flex items-center space-x-3 rounded-lg px-3 py-2 w-full text-left transition-colors ${
                  isRouteActive('/notifications') 
                    ? 'text-foreground bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={handleLinkClick('/notifications')}
                data-testid="link-notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>Notifications</span>
              </button>
            )}
            
            {/* Vendor Integration - Only for NEC_ADMIN */}
            {user?.role === 'NEC_ADMIN' && (
              <button 
                className={`flex items-center space-x-3 rounded-lg px-3 py-2 w-full text-left transition-colors ${
                  isRouteActive('/vendor-integration') 
                    ? 'text-foreground bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={handleLinkClick('/vendor-integration')}
                data-testid="link-vendor-integration"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H5z" />
                </svg>
                <span>Vendor Integration</span>
              </button>
            )}
            
            <button 
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 w-full text-left transition-colors ${
                isRouteActive('/settings') 
                  ? 'text-foreground bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={handleLinkClick('/settings')}
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
