import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface NavigationHeaderProps {
  onToggleSidebar: () => void;
}

export default function NavigationHeader({ onToggleSidebar }: NavigationHeaderProps) {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationName, setLocationName] = useState<string>('Location');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          
          // Get location name from coordinates
          fetch(`/api/weather/location?lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(data => {
              setLocationName(data.name || 'Your Location');
            })
            .catch(() => setLocationName('Your Location'));
        },
        () => setLocationName('Location')
      );
    }
  }, []);
  
  const { data: weatherAlerts } = useQuery({
    queryKey: ["/api/weather/alerts"],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const { data: alertsSummary } = useQuery<{ unread: number } | null>({
    queryKey: ["/api/alerts/summary"],
    refetchInterval: 30 * 1000, // 30 seconds
  });

  const { data: weatherData } = useQuery<Array<{ city?: string; temperature?: number | string }>>({
    queryKey: ["/api/weather"],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const { data: currentLocationWeather } = useQuery({
    queryKey: ["current-location-weather", userLocation],
    queryFn: async () => {
      if (!userLocation) return null;
      const response = await fetch(
        `/api/weather/current?lat=${userLocation.lat}&lon=${userLocation.lon}`
      );
      if (!response.ok) throw new Error('Weather fetch failed');
      return response.json();
    },
    enabled: !!userLocation,
    refetchInterval: 5 * 60 * 1000,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };


  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={onToggleSidebar}
              data-testid="button-toggle-sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground">EIMS</h1>
              <span className="text-sm text-muted-foreground">Electronic Infrastructure Management</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Current Location Weather */}
            {currentLocationWeather ? (
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {locationName}: {Math.round(currentLocationWeather?.temperature || currentLocationWeather?.main?.temp || 0)}°C
                  </span>
                </div>
              </div>
            ) : weatherData && weatherData.length > 0 && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {weatherData[0]?.city}: {Math.round(Number(weatherData[0]?.temperature) || 0)}°C
                  </span>
                </div>
              </div>
            )}
            
            
            {/* Notifications */}
            <div className="relative">
              <button 
                className="relative text-muted-foreground hover:text-foreground"
                data-testid="button-notifications"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {(alertsSummary?.unread ?? 0) > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0"
                    data-testid="badge-notifications"
                  >
                    {alertsSummary?.unread ?? 0}
                  </Badge>
                )}
              </button>
            </div>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium" data-testid="text-username">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-muted-foreground" data-testid="text-userrole">
                  {user?.role?.replace(/_/g, ' ')}
                </div>
              </div>
              
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover"
                      data-testid="img-avatar"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-medium">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button 
                      className="w-full text-left px-4 py-2 text-foreground hover:bg-accent transition-colors"
                      data-testid="button-profile"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile</span>
                      </div>
                    </button>
                    
                    <button 
                      className="w-full text-left px-4 py-2 text-foreground hover:bg-accent transition-colors"
                      data-testid="button-settings"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Settings</span>
                      </div>
                    </button>
                    
                    <div className="border-t border-border my-1"></div>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start px-4 py-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                      data-testid="button-logout"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
