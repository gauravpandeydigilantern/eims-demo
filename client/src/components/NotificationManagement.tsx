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
  History, 
  BarChart, 
  Send, 
  Bell, 
  Mail, 
  MessageSquare, 
  Phone,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Users
} from 'lucide-react';

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  categories: {
    critical_alerts: boolean;
    device_down: boolean;
    maintenance_due: boolean;
    performance_issues: boolean;
    system_updates: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationHistory {
  id: string;
  type: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  sentAt: string;
  readAt?: string;
}

interface NotificationStats {
  totalSent: number;
  totalRead: number;
  totalUnread: number;
  byType: {
    email: number;
    push: number;
    sms: number;
  };
  byCategory: {
    [key: string]: number;
  };
  readRate: number;
  responseTime: string;
}

const NotificationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("settings");
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    sms: false,
    push: true,
    categories: {
      critical_alerts: true,
      device_down: true,
      maintenance_due: true,
      performance_issues: false,
      system_updates: false,
    },
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [customNotification, setCustomNotification] = useState({
    recipients: '',
    subject: '',
    message: '',
    type: 'email',
    priority: 'medium',
  });

  useEffect(() => {
    fetchPreferences();
    fetchHistory();
    fetchStats();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      showMessage('Failed to load preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/notifications/history?limit=20');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/notifications/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        showMessage('Preferences saved successfully', 'success');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showMessage('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async (type: string) => {
    try {
      setTestLoading(type);
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        showMessage(`Test ${type} notification sent`, 'success');
        fetchHistory();
      } else {
        throw new Error(`Failed to send test ${type}`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      showMessage(`Failed to send test ${type}`, 'error');
    } finally {
      setTestLoading('');
    }
  };

  const sendCustomNotification = async () => {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customNotification,
          recipients: customNotification.recipients.split(',').map(r => r.trim()),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(`Notification sent to ${result.totalSent} recipients`, 'success');
        setCustomNotification({ recipients: '', subject: '', message: '', type: 'email', priority: 'medium' });
        fetchHistory();
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      showMessage('Failed to send notification', 'error');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        fetchHistory();
        fetchStats();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handlePreferenceChange = (path: string, value: boolean | string) => {
    setPreferences(prev => {
      const newPrefs = { ...prev };
      const keys = path.split('.');
      let current: any = newPrefs;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newPrefs;
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      critical_alerts: 'Critical Alerts',
      device_down: 'Device Down',
      maintenance_due: 'Maintenance Due',
      performance_issues: 'Performance Issues',
      system_updates: 'System Updates',
    };
    return labels[category] || category;
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || colors.medium;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'push': return <Phone className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
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
      <div className="flex items-center gap-2">
        <Bell className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Notification Management</h1>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message.text}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <Label>Email Notifications</Label>
                  </div>
                  <Switch
                    checked={preferences.email}
                    onCheckedChange={(checked) => handlePreferenceChange('email', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <Label>SMS Notifications</Label>
                  </div>
                  <Switch
                    checked={preferences.sms}
                    onCheckedChange={(checked) => handlePreferenceChange('sms', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <Label>Push Notifications</Label>
                  </div>
                  <Switch
                    checked={preferences.push}
                    onCheckedChange={(checked) => handlePreferenceChange('push', checked)}
                  />
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendTestNotification('email')}
                      disabled={!preferences.email || testLoading === 'email'}
                    >
                      {testLoading === 'email' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      Test Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendTestNotification('push')}
                      disabled={!preferences.push || testLoading === 'push'}
                    >
                      {testLoading === 'push' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                      Test Push
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(preferences.categories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <Label>{getCategoryLabel(category)}</Label>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => handlePreferenceChange(`categories.${category}`, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Quiet Hours (Critical alerts will still be sent)</Label>
                <Switch
                  checked={preferences.quiet_hours.enabled}
                  onCheckedChange={(checked) => handlePreferenceChange('quiet_hours.enabled', checked)}
                />
              </div>
              
              {preferences.quiet_hours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={preferences.quiet_hours.start}
                      onChange={(e) => handlePreferenceChange('quiet_hours.start', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={preferences.quiet_hours.end}
                      onChange={(e) => handlePreferenceChange('quiet_hours.end', e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button onClick={savePreferences} disabled={saving}>
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{notification.subject}</h4>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        {!notification.readAt && (
                          <Badge variant="secondary">Unread</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="text-xs text-muted-foreground">
                        Sent: {new Date(notification.sentAt).toLocaleString()}
                        {notification.readAt && ` • Read: ${new Date(notification.readAt).toLocaleString()}`}
                      </div>
                    </div>
                    {!notification.readAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No notifications found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.totalSent}</div>
                  <p className="text-xs text-muted-foreground">Total Sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.readRate}%</div>
                  <p className="text-xs text-muted-foreground">Read Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{stats.totalUnread}</div>
                  <p className="text-xs text-muted-foreground">Unread</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.responseTime}</div>
                  <p className="text-xs text-muted-foreground">Avg Response Time</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>By Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type)}
                          <span className="capitalize">{type}</span>
                        </div>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>By Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span>{getCategoryLabel(category)}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Send Notification Tab */}
        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Custom Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
                <Input
                  id="recipients"
                  value={customNotification.recipients}
                  onChange={(e) => setCustomNotification(prev => ({ ...prev, recipients: e.target.value }))}
                  placeholder="user1@company.com, user2@company.com"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={customNotification.subject}
                  onChange={(e) => setCustomNotification(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={4}
                  value={customNotification.message}
                  onChange={(e) => setCustomNotification(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={customNotification.type}
                    onChange={(e) => setCustomNotification(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="email">Email</option>
                    <option value="push">Push Notification</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={customNotification.priority}
                    onChange={(e) => setCustomNotification(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={sendCustomNotification}
                disabled={!customNotification.recipients || !customNotification.subject || !customNotification.message}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationManagement;
