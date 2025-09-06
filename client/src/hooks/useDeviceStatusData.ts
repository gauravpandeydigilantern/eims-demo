import { useQuery } from "@tanstack/react-query";
import deviceStatusJson from "../../../device_status.json";

export interface DeviceStatus {
  MAC_ID: string;
  ASSET_ID: string;
  Success: number;
  Pending: number;
  LastSync: string;
  TimeDifference: string;
  DeviceStatus: number; // 2=DOWN, 3=STANDBY, 4=ACTIVE
}

export interface Location {
  LOCATION_NAME: string;
  Total: number;
  TimeDiff: number;
  DOWN: number;
  STANDBY: number;
  ACTIVE: number;
  DEVICES: DeviceStatus[];
}

export interface Category {
  CATTYPE: string;
  TimeDiff: number;
  DOWN: number;
  STANDBY: number;
  ACTIVE: number;
  LOC: Location[];
}

export interface DeviceStatusData {
  Total: number;
  TimeDiff: number;
  DOWN: number;
  STANDBY: number;
  ACTIVE: number;
  LastActive48H: number;
  LastActive1W: number;
  LastActive15D: number;
  LastActive1M: number;
  CAT: Category[];
}

export function useDeviceStatusData() {
  return useQuery({
    queryKey: ["/api/device-status"],
    queryFn: async (): Promise<DeviceStatusData> => {
      try {
        const res = await fetch('/api/device-status');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return json.data as DeviceStatusData;
      } catch (err) {
        // Fallback to bundled JSON
        return deviceStatusJson as DeviceStatusData;
      }
    },
    refetchInterval: 30 * 1000,
    staleTime: 10 * 1000,
  });
}

export function getStatusLabel(status: number): string {
  switch (status) {
    case 2: return 'DOWN';
    case 3: return 'STANDBY';
    case 4: return 'ACTIVE';
    default: return 'UNKNOWN';
  }
}

export function getStatusColor(status: number): string {
  switch (status) {
    case 2: return 'text-red-600 bg-red-100';
    case 3: return 'text-yellow-600 bg-yellow-100';
    case 4: return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}