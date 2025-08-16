'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Settings,
  Database,
  Mail,
  Bell,
  Shield,
  Server,
  Globe,
  CreditCard,
  FileText,
  Save,
  RefreshCw
} from 'lucide-react';
import { AdminAPI } from '@/lib/api/admin';
import { toast } from 'sonner';

interface SystemSetting {
  id: string;
  category:
    | 'general'
    | 'email'
    | 'notifications'
    | 'security'
    | 'payments'
    | 'storage';
  key: string;
  value: string;
  description?: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  is_public: boolean;
  updated_at: string;
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [modifiedSettings, setModifiedSettings] = useState<Record<string, any>>(
    {}
  );

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      setIsLoading(true);
      const result = await AdminAPI.getSystemSettings();
      if (result.success) {
        setSettings(result.data);
      } else {
        toast.error('Failed to load system settings');
      }
    } catch (error) {
      console.error('Failed to load system settings:', error);
      toast.error('Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setModifiedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async (category: string) => {
    try {
      setIsSaving(true);

      const categorySettings = settings.filter(s => s.category === category);
      const promises = categorySettings.map(setting => {
        if (modifiedSettings[setting.key] !== undefined) {
          return AdminAPI.updateSystemSetting(
            setting.key,
            modifiedSettings[setting.key]
          );
        }
        return Promise.resolve({ success: true });
      });

      const results = await Promise.all(promises);
      const hasErrors = results.some(r => !r.success);

      if (!hasErrors) {
        toast.success('Settings saved successfully');
        setModifiedSettings({});
        loadSystemSettings();
      } else {
        toast.error('Some settings failed to save');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingValue = (setting: SystemSetting) => {
    if (modifiedSettings[setting.key] !== undefined) {
      return modifiedSettings[setting.key];
    }

    switch (setting.data_type) {
      case 'boolean':
        return setting.value === 'true';
      case 'number':
        return Number(setting.value);
      case 'json':
        try {
          return JSON.parse(setting.value);
        } catch {
          return setting.value;
        }
      default:
        return setting.value;
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = getSettingValue(setting);

    switch (setting.data_type) {
      case 'boolean':
        return (
          <Switch
            checked={value}
            onCheckedChange={checked =>
              handleSettingChange(setting.key, checked)
            }
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={e =>
              handleSettingChange(setting.key, Number(e.target.value))
            }
            className="max-w-xs"
          />
        );
      default:
        if (
          setting.key.includes('password') ||
          setting.key.includes('secret')
        ) {
          return (
            <Input
              type="password"
              value={value}
              onChange={e => handleSettingChange(setting.key, e.target.value)}
              placeholder="••••••••"
            />
          );
        }
        if (setting.description && setting.description.includes('large text')) {
          return (
            <Textarea
              value={value}
              onChange={e => handleSettingChange(setting.key, e.target.value)}
              rows={4}
            />
          );
        }
        return (
          <Input
            type="text"
            value={value}
            onChange={e => handleSettingChange(setting.key, e.target.value)}
          />
        );
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(s => s.category === category);
  };

  const hasModifiedSettings = (category: string) => {
    const categorySettings = getSettingsByCategory(category);
    return categorySettings.some(
      setting => modifiedSettings[setting.key] !== undefined
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            System Configuration
          </h1>
          <p className="text-gray-600">
            Manage system settings and configuration
          </p>
        </div>
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          {Object.keys(modifiedSettings).length} Modified
        </Badge>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Storage
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  General Settings
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Basic system configuration and application settings
                </p>
              </div>
              {hasModifiedSettings('general') && (
                <Button
                  onClick={() => handleSaveSettings('general')}
                  disabled={isSaving}>
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory('general').map(setting => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor={setting.key}
                        className="text-sm font-medium">
                        {setting.key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {setting.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    {!setting.is_public && (
                      <Badge variant="outline" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Configuration
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  SMTP settings and email templates
                </p>
              </div>
              {hasModifiedSettings('email') && (
                <Button
                  onClick={() => handleSaveSettings('email')}
                  disabled={isSaving}>
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory('email').map(setting => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor={setting.key}
                        className="text-sm font-medium">
                        {setting.key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {setting.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    {!setting.is_public && (
                      <Badge variant="outline" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Push notifications and alert configuration
                </p>
              </div>
              {hasModifiedSettings('notifications') && (
                <Button
                  onClick={() => handleSaveSettings('notifications')}
                  disabled={isSaving}>
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory('notifications').map(setting => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor={setting.key}
                        className="text-sm font-medium">
                        {setting.key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {setting.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    {!setting.is_public && (
                      <Badge variant="outline" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Configuration
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Authentication and security policies
                </p>
              </div>
              {hasModifiedSettings('security') && (
                <Button
                  onClick={() => handleSaveSettings('security')}
                  disabled={isSaving}>
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory('security').map(setting => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor={setting.key}
                        className="text-sm font-medium">
                        {setting.key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {setting.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    {!setting.is_public && (
                      <Badge variant="outline" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Settings */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Configuration
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Payment gateway and processing settings
                </p>
              </div>
              {hasModifiedSettings('payments') && (
                <Button
                  onClick={() => handleSaveSettings('payments')}
                  disabled={isSaving}>
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory('payments').map(setting => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor={setting.key}
                        className="text-sm font-medium">
                        {setting.key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {setting.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    {!setting.is_public && (
                      <Badge variant="outline" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Settings */}
        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Storage Configuration
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  File storage and database settings
                </p>
              </div>
              {hasModifiedSettings('storage') && (
                <Button
                  onClick={() => handleSaveSettings('storage')}
                  disabled={isSaving}>
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory('storage').map(setting => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor={setting.key}
                        className="text-sm font-medium">
                        {setting.key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {setting.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    {!setting.is_public && (
                      <Badge variant="outline" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Global Actions */}
      {Object.keys(modifiedSettings).length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-orange-900">Unsaved Changes</h3>
                <p className="text-sm text-orange-700">
                  You have {Object.keys(modifiedSettings).length} unsaved
                  setting(s)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setModifiedSettings({})}
                  disabled={isSaving}>
                  Discard Changes
                </Button>
                <Button
                  onClick={() => handleSaveSettings(activeTab)}
                  disabled={isSaving}
                  className="bg-orange-600 hover:bg-orange-700">
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save All Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
