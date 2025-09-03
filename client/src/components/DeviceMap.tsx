import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useLocation } from "wouter";

interface DeviceMapProps {
  onDeviceSelect: (deviceId: string) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function DeviceMap({ onDeviceSelect }: DeviceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [, setLocation] = useLocation();

  const { data: devices, isLoading } = useQuery({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  // Listen for real-time device updates
  useWebSocket((message) => {
    if (message.type === 'device_metrics' && mapInstanceRef.current) {
      updateDeviceMarker(message.data);
    }
  });

  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          initializeMap();
        };
        document.head.appendChild(script);
      } else if (window.L) {
        initializeMap();
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapLoaded && devices && mapInstanceRef.current) {
      updateMapMarkers();
    }
  }, [devices, mapLoaded, showClusters]);

  // Set up global function for device selection
  useEffect(() => {
    (window as any).selectDevice = (deviceId: string) => {
      setLocation(`/device/${deviceId}`);
    };
  }, [setLocation]);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;

    // Initialize map centered on India
    const map = window.L.map(mapRef.current).setView([20.5937, 78.9629], 5);

    // Add OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapLoaded(true);
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current || !devices) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    if (showClusters) {
      addClusteredMarkers();
    } else {
      addIndividualMarkers();
    }
  };

  const addIndividualMarkers = () => {
    if (!devices || !Array.isArray(devices)) return;

    devices.forEach((device: any) => {
      if (!device.latitude || !device.longitude) return;

      const color = getStatusColor(device.status);
      const icon = window.L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const marker = window.L.marker([parseFloat(device.latitude), parseFloat(device.longitude)], { icon })
        .bindPopup(`
          <div class="p-2">
            <div class="font-medium">${device.id}</div>
            <div class="text-sm text-gray-600">${device.tollPlaza}</div>
            <div class="text-sm capitalize">${device.status.toLowerCase()}</div>
            <button onclick="window.selectDevice('${device.id}')" class="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">View Details</button>
          </div>
        `)
        .addTo(mapInstanceRef.current);

      markersRef.current.push(marker);
    });
  };

  const addClusteredMarkers = () => {
    // Simple clustering by region for performance
    if (!devices || !Array.isArray(devices)) return;

    const regionGroups = devices.reduce((groups: any, device: any) => {
      const region = device.region;
      if (!groups[region]) groups[region] = [];
      groups[region].push(device);
      return groups;
    }, {});

    Object.entries(regionGroups).forEach(([region, regionDevices]: [string, any]) => {
      const deviceArray = regionDevices as any[];
      if (deviceArray.length === 0) return;

      // Calculate center point
      const avgLat = deviceArray.reduce((sum, d) => sum + parseFloat(d.latitude || '0'), 0) / deviceArray.length;
      const avgLng = deviceArray.reduce((sum, d) => sum + parseFloat(d.longitude || '0'), 0) / deviceArray.length;

      // Count devices by status
      const statusCounts = deviceArray.reduce((counts, device) => {
        counts[device.status] = (counts[device.status] || 0) + 1;
        return counts;
      }, {});

      const totalDevices = deviceArray.length;
      const onlineDevices = statusCounts.LIVE || 0;
      const offlineDevices = statusCounts.DOWN || 0;

      const clusterColor = offlineDevices > 0 ? '#ef4444' : onlineDevices > totalDevices * 0.9 ? '#22c55e' : '#f59e0b';

      const clusterIcon = window.L.divIcon({
        className: 'cluster-icon',
        html: `
          <div style="
            background: ${clusterColor}; 
            color: white; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold; 
            font-size: 12px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            ${totalDevices}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = window.L.marker([avgLat, avgLng], { icon: clusterIcon })
        .bindPopup(`
          <div class="p-3">
            <div class="font-bold text-center mb-2">${region}</div>
            <div class="space-y-1">
              <div class="flex justify-between">
                <span>Total:</span>
                <span class="font-medium">${totalDevices}</span>
              </div>
              <div class="flex justify-between">
                <span>Online:</span>
                <span class="text-green-600 font-medium">${onlineDevices}</span>
              </div>
              <div class="flex justify-between">
                <span>Offline:</span>
                <span class="text-red-600 font-medium">${offlineDevices}</span>
              </div>
            </div>
          </div>
        `)
        .addTo(mapInstanceRef.current);

      markersRef.current.push(marker);
    });
  };

  const updateDeviceMarker = (metricsData: any) => {
    // In a real implementation, this would update specific device markers
    console.log('Updating device marker:', metricsData);
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      'LIVE': '#22c55e',
      'DOWN': '#ef4444',
      'WARNING': '#f59e0b',
      'MAINTENANCE': '#3b82f6'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const statusCounts = devices && Array.isArray(devices) ? devices.reduce((counts: any, device: any) => {
    counts[device.status] = (counts[device.status] || 0) + 1;
    return counts;
  }, {}) : {};

  return (
    <Card>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Geographic Distribution</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="status-indicator status-live"></div>
                <span data-testid="count-live-devices">{statusCounts.LIVE || 0} Live</span>
              </div>
              <div className="flex items-center">
                <div className="status-indicator status-down"></div>
                <span data-testid="count-down-devices">{statusCounts.DOWN || 0} Down</span>
              </div>
              <div className="flex items-center">
                <div className="status-indicator status-warning"></div>
                <span data-testid="count-maintenance-devices">{statusCounts.MAINTENANCE || 0} Maintenance</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClusters(!showClusters)}
                data-testid="button-toggle-clusters"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2h0l0 0a2 2 0 012 2v2H5V9z" />
                </svg>
                {showClusters ? 'Individual' : 'Clusters'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="p-0">
        <div className="h-96 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-muted/20">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground text-sm">Loading map...</p>
              </div>
            </div>
          ) : (
            <div 
              ref={mapRef} 
              className="h-full w-full rounded-b-lg"
              data-testid="map-container"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
