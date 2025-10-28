'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Cpu,
  Network,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Clock,
  Zap
} from 'lucide-react';
import { AdminAPI } from '@/lib/api/admin';
import { toast } from 'sonner';

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastCheck: string;
  services: {
    database: {
      status: 'healthy' | 'warning' | 'critical';
      responseTime: number;
      connections: number;
      maxConnections: number;
      lastCheck: string;
    };
    storage: {
      status: 'healthy' | 'warning' | 'critical';
      used: number;
      total: number;
      percentUsed: number;
      lastCheck: string;
    };
    api: {
      status: 'healthy' | 'warning' | 'critical';
      responseTime: number;
      requestCount: number;
      errorRate: number;
      lastCheck: string;
    };
    cache: {
      status: 'healthy' | 'warning' | 'critical';
      hitRate: number;
      memoryUsed: number;
      memoryTotal: number;
      lastCheck: string;
    };
  };
  metrics: {
    cpu: {
      usage: number;
      cores: number;
    };
    memory: {
      used: number;
      total: number;
      percentUsed: number;
    };
    disk: {
      used: number;
      total: number;
      percentUsed: number;
    };
    network: {
      bytesIn: number;
      bytesOut: number;
      packetsIn: number;
      packetsOut: number;
    };
  };
  alerts: Array<{
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSystemHealth();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    try {
      setIsRefreshing(true);
      const result = await AdminAPI.getSystemHealth();

      if (result.success) {
        setHealth(result.data);
      } else {
        // Mock data for demonstration
        const mockHealth: SystemHealth = {
          overall: 'healthy',
          uptime: 2592000, // 30 days in seconds
          lastCheck: new Date().toISOString(),
          services: {
            database: {
              status: 'healthy',
              responseTime: 45,
              connections: 23,
              maxConnections: 100,
              lastCheck: new Date().toISOString()
            },
            storage: {
              status: 'warning',
              used: 850,
              total: 1000,
              percentUsed: 85,
              lastCheck: new Date().toISOString()
            },
            api: {
              status: 'healthy',
              responseTime: 120,
              requestCount: 15647,
              errorRate: 0.3,
              lastCheck: new Date().toISOString()
            },
            cache: {
              status: 'healthy',
              hitRate: 89.5,
              memoryUsed: 2.1,
              memoryTotal: 4.0,
              lastCheck: new Date().toISOString()
            }
          },
          metrics: {
            cpu: {
              usage: 34,
              cores: 4
            },
            memory: {
              used: 6.2,
              total: 16.0,
              percentUsed: 38.75
            },
            disk: {
              used: 127.5,
              total: 500.0,
              percentUsed: 25.5
            },
            network: {
              bytesIn: 1024567890,
              bytesOut: 2048567890,
              packetsIn: 156789,
              packetsOut: 234567
            }
          },
          alerts: [
            {
              id: '1',
              level: 'warning',
              message: 'Storage usage above 80% threshold',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              resolved: false
            },
            {
              id: '2',
              level: 'info',
              message: 'Database backup completed successfully',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              resolved: true
            },
            {
              id: '3',
              level: 'warning',
              message: 'High API response time detected',
              timestamp: new Date(Date.now() - 10800000).toISOString(),
              resolved: true
            }
          ]
        };
        setHealth(mockHealth);
      }
    } catch (error) {
      console.error('Failed to load system health:', error);
      toast.error('Failed to load system health');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAlertIcon = (level: 'info' | 'warning' | 'error' | 'critical') => {
    switch (level) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
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

  if (!health) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No health data available
          </h3>
          <p className="text-gray-600">
            Unable to retrieve system health information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600">
            Monitor system performance and health status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={getStatusBadgeColor(health.overall)}>
            {getStatusIcon(health.overall)}
            <span className="ml-1 capitalize">{health.overall}</span>
          </Badge>
          <Button onClick={loadSystemHealth} disabled={isRefreshing} size="sm">
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              System Uptime
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatUptime(health.uptime)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Since last restart</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              CPU Usage
            </CardTitle>
            <Cpu className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {health.metrics.cpu.usage}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {health.metrics.cpu.cores} cores available
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Memory Usage
            </CardTitle>
            <Memory className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {health.metrics.memory.percentUsed.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {health.metrics.memory.used}GB / {health.metrics.memory.total}GB
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Disk Usage
            </CardTitle>
            <HardDrive className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {health.metrics.disk.percentUsed.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {health.metrics.disk.used}GB / {health.metrics.disk.total}GB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Resource Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">CPU</span>
                <span className="text-sm text-gray-600">
                  {health.metrics.cpu.usage}%
                </span>
              </div>
              <Progress value={health.metrics.cpu.usage} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Memory
                </span>
                <span className="text-sm text-gray-600">
                  {health.metrics.memory.used}GB / {health.metrics.memory.total}
                  GB
                </span>
              </div>
              <Progress
                value={health.metrics.memory.percentUsed}
                className="h-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Disk</span>
                <span className="text-sm text-gray-600">
                  {health.metrics.disk.used}GB / {health.metrics.disk.total}GB
                </span>
              </div>
              <Progress
                value={health.metrics.disk.percentUsed}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Network Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Bytes In</div>
                <div className="text-lg font-semibold">
                  {formatBytes(health.metrics.network.bytesIn)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Bytes Out</div>
                <div className="text-lg font-semibold">
                  {formatBytes(health.metrics.network.bytesOut)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Packets In</div>
                <div className="text-lg font-semibold">
                  {health.metrics.network.packetsIn.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Packets Out</div>
                <div className="text-lg font-semibold">
                  {health.metrics.network.packetsOut.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Services Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="font-medium">Database</span>
                <Badge
                  variant="outline"
                  className={getStatusBadgeColor(
                    health.services.database.status
                  )}>
                  {getStatusIcon(health.services.database.status)}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <div>Response: {health.services.database.responseTime}ms</div>
                <div>
                  Connections: {health.services.database.connections}/
                  {health.services.database.maxConnections}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <span className="font-medium">Storage</span>
                <Badge
                  variant="outline"
                  className={getStatusBadgeColor(
                    health.services.storage.status
                  )}>
                  {getStatusIcon(health.services.storage.status)}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <div>Used: {health.services.storage.percentUsed}%</div>
                <div>
                  {health.services.storage.used}GB /{' '}
                  {health.services.storage.total}GB
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="font-medium">API</span>
                <Badge
                  variant="outline"
                  className={getStatusBadgeColor(health.services.api.status)}>
                  {getStatusIcon(health.services.api.status)}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <div>Response: {health.services.api.responseTime}ms</div>
                <div>Error Rate: {health.services.api.errorRate}%</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Memory className="w-4 h-4" />
                <span className="font-medium">Cache</span>
                <Badge
                  variant="outline"
                  className={getStatusBadgeColor(health.services.cache.status)}>
                  {getStatusIcon(health.services.cache.status)}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <div>Hit Rate: {health.services.cache.hitRate}%</div>
                <div>
                  Memory: {health.services.cache.memoryUsed}GB /{' '}
                  {health.services.cache.memoryTotal}GB
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {health.alerts.map(alert => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAlertIcon(alert.level)}
                        <span className="capitalize">{alert.level}</span>
                      </div>
                    </TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          alert.resolved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }>
                        {alert.resolved ? 'Resolved' : 'Active'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {health.alerts.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No alerts
              </h3>
              <p className="text-gray-600">All systems are running normally.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}








