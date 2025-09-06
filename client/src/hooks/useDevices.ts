import { useQuery } from "@tanstack/react-query";
// Import local fallback JSON from repository root
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import deviceStatusFallback from "../../../device_status.json";

type Device = any;

export function normalizeResponse(data: any): Device[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

export default function useDevices() {
  const query = useQuery({
    queryKey: ["/api/devices"],
    queryFn: async () => {
      try {
        const res = await fetch('/api/devices');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return json;
      } catch (err) {
        // Fallback to local JSON bundled with the repo
        return deviceStatusFallback as any;
      }
    },
    refetchInterval: 30 * 1000,
    // keep the fallback available immediately while network resolves
    retry: 1,
  });

  const devices = normalizeResponse(query.data);

  return {
    devices,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
