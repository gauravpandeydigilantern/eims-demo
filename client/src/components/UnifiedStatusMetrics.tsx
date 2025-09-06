import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceStatusData } from "@/hooks/useDeviceStatusData";

interface UnifiedStatusMetricsProps {
  data?: DeviceStatusData;
}

export default function UnifiedStatusMetrics({ data }: UnifiedStatusMetricsProps) {
  if (!data) return null;

  const { Total, DOWN, STANDBY, ACTIVE } = data;
  const upPercentage = Total ? Math.round(((ACTIVE + STANDBY) / Total) * 100) : 0;
  const downPercentage = Total ? Math.round((DOWN / Total) * 100) : 0;

  return (
    <Card className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
      <CardHeader>
        <CardTitle className="text-center text-xl font-bold">Device Health Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* UP Status */}
          <div className="text-center bg-green-600 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold">{ACTIVE + STANDBY}/{Total}</div>
            <div className="text-sm font-medium mt-1">UP - {upPercentage}%</div>
          </div>

          {/* ACTIVE Status */}
          <div className="text-center bg-blue-500 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-2xl font-bold">{ACTIVE}/{Total}</div>
            <div className="text-sm font-medium mt-1">ACTIVE</div>
          </div>

          {/* STANDBY Status */}
          <div className="text-center bg-yellow-500 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold">{STANDBY}/{Total}</div>
            <div className="text-sm font-medium mt-1">STANDBY</div>
          </div>

          {/* DOWN Status */}
          <div className="text-center bg-red-600 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold">{DOWN}/{Total}</div>
            <div className="text-sm font-medium mt-1">DOWN - {downPercentage}%</div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-blue-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{data.LastActive48H}</div>
              <div className="text-xs opacity-80">Active 48H</div>
            </div>
            <div>
              <div className="text-lg font-bold">{data.LastActive1W}</div>
              <div className="text-xs opacity-80">Active 1W</div>
            </div>
            <div>
              <div className="text-lg font-bold">{data.LastActive15D}</div>
              <div className="text-xs opacity-80">Active 15D</div>
            </div>
            <div>
              <div className="text-lg font-bold">{data.TimeDiff}</div>
              <div className="text-xs opacity-80">Time Diff</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}