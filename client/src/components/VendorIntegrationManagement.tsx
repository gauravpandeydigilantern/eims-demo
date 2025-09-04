import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Database,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  Wifi,
  WifiOff
} from 'lucide-react';

interface VendorConfig {
  id: string;
  name: string;
  type: string;
  apiEndpoint: string;
  authentication: {
    type: string;
    credentials: Record<string, string>;
  };
  polling_interval: number;
  enabled: boolean;
  region?: string;
  lastSync?: string;
  status: string;
}

interface VendorStats {
  vendorId: string;
  lastSyncAt: string;
  nextSyncAt: string;
  status: string;
  devicesManaged: number;
  successfulSyncs: number;
  failedSyncs: number;
  avgSyncTime: string;
  lastError?: string;
}

const VendorIntegrationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [vendors, setVendors] = useState<VendorConfig[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [vendorStats, setVendorStats] = useState<Record<string, VendorStats>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingVendor, setEditingVendor] = useState<VendorConfig | null>(null);
  const [newVendor, setNewVendor] = useState({
    name: '',
    type: 'NEC',
    apiEndpoint: '',
    authentication: {
      type: 'api_key',
      credentials: { key: '' }
    },
    polling_interval: 300,
    enabled: true,
    region: ''
  });

  useEffect(() => {
    fetchOverview();
    fetchVendors();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/vendor-integration/overview');
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (error) {
      console.error('Error fetching integration overview:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vendor-integration/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
        
        // Fetch stats for each vendor
        for (const vendor of data) {
          fetchVendorStats(vendor.id);
        }
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      showMessage('Failed to load vendor configurations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorStats = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/vendor-integration/vendors/${vendorId}/status`);
      if (response.ok) {
        const data = await response.json();
        setVendorStats(prev => ({ ...prev, [vendorId]: data }));
      }
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
    }
  };

  const createVendor = async () => {
    try {
      const response = await fetch('/api/vendor-integration/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVendor),
      });

      if (response.ok) {
        showMessage('Vendor configuration created successfully', 'success');
        setNewVendor({
          name: '',
          type: 'NEC',
          apiEndpoint: '',
          authentication: { type: 'api_key', credentials: { key: '' } },
          polling_interval: 300,
          enabled: true,
          region: ''
        });
        fetchVendors();
        fetchOverview();
      } else {
        throw new Error('Failed to create vendor');
      }
    } catch (error) {
      console.error('Error creating vendor:', error);
      showMessage('Failed to create vendor configuration', 'error');
    }
  };

  const updateVendor = async (vendorId: string, updates: any) => {
    try {
      const response = await fetch(`/api/vendor-integration/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        showMessage('Vendor configuration updated successfully', 'success');
        setEditingVendor(null);
        fetchVendors();
      } else {
        throw new Error('Failed to update vendor');
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      showMessage('Failed to update vendor configuration', 'error');
    }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/vendor-integration/vendors/${vendorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showMessage('Vendor configuration deleted successfully', 'success');
        fetchVendors();
        fetchOverview();
      } else {
        throw new Error('Failed to delete vendor');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      showMessage('Failed to delete vendor configuration', 'error');
    }
  };

  const testConnection = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/vendor-integration/vendors/${vendorId}/test`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(
          result.success 
            ? `Connection test successful (${result.responseTime}ms)` 
            : `Connection test failed: ${result.error}`,
          result.success ? 'success' : 'error'
        );
      } else {
        throw new Error('Failed to test connection');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      showMessage('Failed to test vendor connection', 'error');
    }
  };

  const syncVendor = async (vendorId: string, syncType = 'incremental') => {
    try {
      const response = await fetch(`/api/vendor-integration/vendors/${vendorId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, syncType }),
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(
          result.success 
            ? `Sync completed: ${result.devicesProcessed} devices processed, ${result.devicesUpdated} updated`
            : `Sync failed: ${result.error}`,
          result.success ? 'success' : 'error'
        );
        fetchVendorStats(vendorId);
      } else {
        throw new Error('Failed to sync vendor');
      }
    } catch (error) {
      console.error('Error syncing vendor:', error);
      showMessage('Failed to sync vendor devices', 'error');
    }
  };

  const syncAllVendors = async () => {
    try {
      const response = await fetch('/api/vendor-integration/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType: 'incremental' }),
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(
          `Bulk sync completed: ${result.successfulSyncs}/${result.totalVendors} vendors synced successfully`,
          result.successfulSyncs === result.totalVendors ? 'success' : 'error'
        );
        fetchVendors();
        fetchOverview();
      } else {
        throw new Error('Failed to sync all vendors');
      }
    } catch (error) {
      console.error('Error syncing all vendors:', error);
      showMessage('Failed to sync all vendors', 'error');
    }
  };

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      healthy: 'bg-green-100 text-green-800',
    };
    
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <Wifi className="w-4 h-4 text-green-600" />;
      case 'disconnected':
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Vendor Integration</h1>
        </div>
        <Button onClick={syncAllVendors} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Sync All Vendors
        </Button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message.text}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="add-vendor" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Vendor
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{overview.totalVendors}</div>
                  <p className="text-xs text-muted-foreground">Total Vendors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{overview.activeVendors}</div>
                  <p className="text-xs text-muted-foreground">Active Vendors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{overview.connectedVendors}</div>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{overview.totalDevicesManaged}</div>
                  <p className="text-xs text-muted-foreground">Devices Managed</p>
                </CardContent>
              </Card>
            </div>
          )}

          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(overview.vendorTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="font-medium">{type}</span>
                        <span className="text-lg font-bold">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Last Sync Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Successful</span>
                      </div>
                      <span className="text-lg font-bold">{overview.lastSyncStatus.successful}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Failed</span>
                      </div>
                      <span className="text-lg font-bold">{overview.lastSyncStatus.failed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span>Pending</span>
                      </div>
                      <span className="text-lg font-bold">{overview.lastSyncStatus.pending}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => {
              const stats = vendorStats[vendor.id];
              return (
                <Card key={vendor.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(vendor.status)}
                        {getStatusBadge(vendor.status)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {vendor.type} • {vendor.region || 'All Regions'}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>API Endpoint:</span>
                        <span className="text-muted-foreground">{vendor.apiEndpoint}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Polling Interval:</span>
                        <span className="text-muted-foreground">{vendor.polling_interval}s</span>
                      </div>
                      {stats && (
                        <>
                          <div className="flex justify-between">
                            <span>Devices Managed:</span>
                            <span className="font-medium">{stats.devicesManaged}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="font-medium">
                              {Math.round((stats.successfulSyncs / (stats.successfulSyncs + stats.failedSyncs)) * 100)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Sync:</span>
                            <span className="text-muted-foreground">
                              {new Date(stats.lastSyncAt).toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Enabled:</span>
                        <Switch
                          checked={vendor.enabled}
                          onCheckedChange={(checked) => updateVendor(vendor.id, { enabled: checked })}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(vendor.id)}
                        className="flex-1"
                      >
                        <Wifi className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncVendor(vendor.id)}
                        disabled={!vendor.enabled}
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Sync
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingVendor(vendor)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteVendor(vendor.id)}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {vendors.map((vendor) => {
              const stats = vendorStats[vendor.id];
              if (!stats) return null;

              return (
                <Card key={vendor.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(stats.status)}
                      {vendor.name} - Monitoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.devicesManaged}</div>
                        <div className="text-sm text-muted-foreground">Devices</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.successfulSyncs}</div>
                        <div className="text-sm text-muted-foreground">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.failedSyncs}</div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.avgSyncTime}</div>
                        <div className="text-sm text-muted-foreground">Avg Time</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Last Sync:</span>
                        <div className="text-muted-foreground">{new Date(stats.lastSyncAt).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="font-medium">Next Sync:</span>
                        <div className="text-muted-foreground">{new Date(stats.nextSyncAt).toLocaleString()}</div>
                      </div>
                    </div>

                    {stats.lastError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">Last Error:</span>
                        </div>
                        <div className="text-red-700 text-sm mt-1">{stats.lastError}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Add Vendor Tab */}
        <TabsContent value="add-vendor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Vendor Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor-name">Vendor Name</Label>
                  <Input
                    id="vendor-name"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., NEC Primary"
                  />
                </div>
                <div>
                  <Label htmlFor="vendor-type">Vendor Type</Label>
                  <select
                    id="vendor-type"
                    value={newVendor.type}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="NEC">NEC</option>
                    <option value="NCR">NCR</option>
                    <option value="Wincor">Wincor</option>
                    <option value="Diebold">Diebold</option>
                    <option value="Ingenico">Ingenico</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="api-endpoint">API Endpoint</Label>
                <Input
                  id="api-endpoint"
                  value={newVendor.apiEndpoint}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                  placeholder="https://api.vendor.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="auth-type">Authentication Type</Label>
                  <select
                    id="auth-type"
                    value={newVendor.authentication.type}
                    onChange={(e) => setNewVendor(prev => ({ 
                      ...prev, 
                      authentication: { ...prev.authentication, type: e.target.value }
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="api_key">API Key</option>
                    <option value="basic">Basic Auth</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="oauth2">OAuth 2.0</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="polling-interval">Polling Interval (seconds)</Label>
                  <Input
                    id="polling-interval"
                    type="number"
                    min="5"
                    max="3600"
                    value={newVendor.polling_interval}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, polling_interval: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="api-credentials">API Credentials</Label>
                {newVendor.authentication.type === 'api_key' && (
                  <Input
                    id="api-credentials"
                    type="password"
                    value={newVendor.authentication.credentials.key}
                    onChange={(e) => setNewVendor(prev => ({ 
                      ...prev, 
                      authentication: { 
                        ...prev.authentication, 
                        credentials: { key: e.target.value }
                      }
                    }))}
                    placeholder="Enter API key"
                  />
                )}
                {newVendor.authentication.type === 'basic' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Username"
                      value={newVendor.authentication.credentials.username || ''}
                      onChange={(e) => setNewVendor(prev => ({ 
                        ...prev, 
                        authentication: { 
                          ...prev.authentication, 
                          credentials: { ...prev.authentication.credentials, username: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={newVendor.authentication.credentials.password || ''}
                      onChange={(e) => setNewVendor(prev => ({ 
                        ...prev, 
                        authentication: { 
                          ...prev.authentication, 
                          credentials: { ...prev.authentication.credentials, password: e.target.value }
                        }
                      }))}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="region">Region (Optional)</Label>
                <Input
                  id="region"
                  value={newVendor.region}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="e.g., Mumbai, Delhi"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="enabled">Enable Integration:</Label>
                  <Switch
                    id="enabled"
                    checked={newVendor.enabled}
                    onCheckedChange={(checked) => setNewVendor(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>
                <Button
                  onClick={createVendor}
                  disabled={!newVendor.name || !newVendor.apiEndpoint}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Vendor Integration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorIntegrationManagement;
