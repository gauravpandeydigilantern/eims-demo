import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeviceStatusData, getStatusLabel, getStatusColor } from "@/hooks/useDeviceStatusData";

interface TollPlazaGridProps {
  data?: DeviceStatusData;
  onDeviceSelect: (deviceId: string) => void;
}

export default function TollPlazaGrid({ data, onDeviceSelect }: TollPlazaGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const itemsPerPage = 12;

  if (!data?.CAT?.length) return null;

  const tollPlazaCategory = data.CAT.find(cat => cat.CATTYPE === "TOLLPLAZA");
  if (!tollPlazaCategory?.LOC?.length) return null;

  const totalPages = Math.ceil(tollPlazaCategory.LOC.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLocations = tollPlazaCategory.LOC.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Toll Plaza Status Overview</h3>
        <div className="text-sm text-muted-foreground">{tollPlazaCategory.LOC.length} total locations</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedLocations.map((location, index) => {
          const totalDevices = location.DEVICES?.length || 0;
          const activeDevices = location.ACTIVE;
          const downDevices = location.DOWN;
          const standbyDevices = location.STANDBY;

          const healthPercentage = totalDevices > 0
            ? Math.round(((activeDevices + standbyDevices) / totalDevices) * 100)
            : 0;

          const cardId = startIndex + index;
          const defaultPreview = 3;
          const isExpanded = expandedCards.has(cardId);
          const devicesToShow = isExpanded ? totalDevices : Math.min(defaultPreview, totalDevices);
          const hasMoreDevices = totalDevices > defaultPreview;

          return (
            <Card key={cardId} className="hover:shadow-lg transition-shadow h-80 flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium truncate">
                    {location.LOCATION_NAME || `Toll Plaza ${cardId + 1}`}
                  </CardTitle>
                  <Badge
                    variant={healthPercentage >= 80 ? "default" : healthPercentage >= 60 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {healthPercentage}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col space-y-3 overflow-hidden">
                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-2 text-center flex-shrink-0">
                  <div className="bg-green-50 rounded p-2">
                    <div className="text-lg font-bold text-green-600">{activeDevices}</div>
                    <div className="text-xs text-green-700">Active</div>
                  </div>
                  <div className="bg-yellow-50 rounded p-2">
                    <div className="text-lg font-bold text-yellow-600">{standbyDevices}</div>
                    <div className="text-xs text-yellow-700">Standby</div>
                  </div>
                  <div className="bg-red-50 rounded p-2">
                    <div className="text-lg font-bold text-red-600">{downDevices}</div>
                    <div className="text-xs text-red-700">Down</div>
                  </div>
                </div>

                {/* Device List */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="text-xs font-medium text-muted-foreground mb-2 flex-shrink-0">
                    Devices ({totalDevices})
                  </div>

                  <div className={`flex-1 space-y-1 pr-1 ${isExpanded ? 'overflow-y-auto max-h-32' : 'overflow-hidden'}`}>
                    {(location.DEVICES ?? []).slice(0, devicesToShow).map((device: any, deviceIndex: number) => (
                      <div
                        key={deviceIndex}
                        className="flex items-center justify-between text-xs p-1 rounded hover:bg-muted/50 cursor-pointer flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeviceSelect(device.MAC_ID);
                        }}
                      >
                        <span className="truncate flex-1">{device.ASSET_ID || device.MAC_ID}</span>
                        <Badge className={`text-xs px-1 py-0 ${getStatusColor(device.DeviceStatus)}`} variant="outline">
                          {getStatusLabel(device.DeviceStatus)}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Expand/Collapse Button */}
                  {hasMoreDevices && (
                    <div className="flex-shrink-0 mt-2">
                      <button
                        className="w-full text-xs text-blue-600 hover:text-blue-800 py-1 cursor-pointer text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newExpanded = new Set(expandedCards);
                          if (isExpanded) {
                            newExpanded.delete(cardId);
                          } else {
                            newExpanded.add(cardId);
                          }
                          setExpandedCards(newExpanded);
                        }}
                      >
                        {isExpanded ? 'Show less' : `Show all (${totalDevices})`}
                      </button>
                    </div>
                  )}
                </div>

                {/* Last Update */}
                <div className="text-xs text-muted-foreground border-t pt-2 flex-shrink-0">
                  Last Update: {location.DEVICES?.[0]?.LastSync ? new Date(location.DEVICES[0].LastSync).toLocaleString() : 'Unknown'}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, tollPlazaCategory.LOC.length)} of {tollPlazaCategory.LOC.length} toll plazas
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
              Previous
            </Button>
            <span className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded">{currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}