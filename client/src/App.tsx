import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Landing from "@/pages/Landing";
import DashboardPage from "@/pages/DashboardPage";
import DataViewPage from "@/pages/DataViewPage";
import AlertsPage from "@/pages/AlertsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ReportsPage from "@/pages/ReportsPage";
import DeviceDetail from "@/pages/DeviceDetail";
import DeviceList from "@/pages/DeviceList";
import AIAssistantPage from "./pages/AIAssistantPage";
import UserManagementPage from "./pages/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import VendorIntegrationPage from "./pages/VendorIntegrationPage";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={() => (
            <ErrorBoundary>
              <DashboardPage />
            </ErrorBoundary>
          )} />
          <Route path="/data" component={() => (
            <ErrorBoundary>
              <DataViewPage />
            </ErrorBoundary>
          )} />
          <Route path="/alerts" component={() => (
            <ErrorBoundary>
              <AlertsPage />
            </ErrorBoundary>
          )} />
          <Route path="/analytics" component={() => (
            <ErrorBoundary>
              <AnalyticsPage />
            </ErrorBoundary>
          )} />
          <Route path="/reports" component={() => (
            <ErrorBoundary>
              <ReportsPage />
            </ErrorBoundary>
          )} />
          <Route path="/ai-assistant" component={() => (
            <ErrorBoundary>
              <AIAssistantPage />
            </ErrorBoundary>
          )} />
          <Route path="/users" component={() => (
            <ErrorBoundary>
              <UserManagementPage />
            </ErrorBoundary>
          )} />
          <Route path="/settings" component={() => (
            <ErrorBoundary>
              <SettingsPage />
            </ErrorBoundary>
          )} />
          <Route path="/notifications" component={() => (
            <ErrorBoundary>
              <NotificationsPage />
            </ErrorBoundary>
          )} />
          <Route path="/vendor-integration" component={() => (
            <ErrorBoundary>
              <VendorIntegrationPage />
            </ErrorBoundary>
          )} />
          <Route path="/device/:deviceId" component={() => (
            <ErrorBoundary>
              <DeviceDetail />
            </ErrorBoundary>
          )} />
          <Route path="/devices/:filter?" component={() => (
            <ErrorBoundary>
              <DeviceList />
            </ErrorBoundary>
          )} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
