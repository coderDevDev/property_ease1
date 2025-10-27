'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  Megaphone,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface AnnouncementFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onTypeChange: (value: string) => void;
  filterPriority: string;
  onPriorityChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  role: 'owner' | 'tenant';
  onRefresh?: () => void;
  className?: string;
}

export function AnnouncementFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onTypeChange,
  filterPriority,
  onPriorityChange,
  filterStatus,
  onStatusChange,
  role,
  onRefresh,
  className
}: AnnouncementFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const announcementTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'general', label: 'General' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'policy', label: 'Policy' },
    { value: 'event', label: 'Event' },
    { value: 'emergency', label: 'Emergency' }
  ];

  const priorityLevels = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const statusOptions =
    role === 'owner'
      ? [
          { value: 'all', label: 'All Status' },
          { value: 'published', label: 'Published' },
          { value: 'draft', label: 'Draft' },
          { value: 'expired', label: 'Expired' }
        ]
      : [
          { value: 'all', label: 'All Announcements' },
          { value: 'active', label: 'Active' },
          { value: 'expired', label: 'Expired' }
        ];

  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg',
        className
      )}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search and Main Controls */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={e => onSearchChange(e.target.value)}
                  className="pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-blue-200 text-blue-600 hover:bg-blue-50">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>

              {onRefresh && (
                <Button
                  variant="outline"
                  onClick={onRefresh}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-blue-200/50">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Type
                </label>
                <Select value={filterType} onValueChange={onTypeChange}>
                  <SelectTrigger className="bg-white/50 border-blue-200/50">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {announcementTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Priority
                </label>
                <Select value={filterPriority} onValueChange={onPriorityChange}>
                  <SelectTrigger className="bg-white/50 border-blue-200/50">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityLevels.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <Select value={filterStatus} onValueChange={onStatusChange}>
                  <SelectTrigger className="bg-white/50 border-blue-200/50">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTypeChange('all')}
              className={cn(
                filterType === 'all' &&
                  'bg-blue-100 text-blue-700 border-blue-200'
              )}>
              <Megaphone className="w-3 h-3 mr-1" />
              All Types
            </Button>

            <Button
              variant={filterPriority === 'urgent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPriorityChange('urgent')}
              className={cn(
                filterPriority === 'urgent' &&
                  'bg-red-100 text-red-700 border-red-200'
              )}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              Urgent
            </Button>

            {role === 'owner' && (
              <Button
                variant={filterStatus === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStatusChange('draft')}
                className={cn(
                  filterStatus === 'draft' &&
                    'bg-gray-100 text-gray-700 border-gray-200'
                )}>
                <Clock className="w-3 h-3 mr-1" />
                Drafts
              </Button>
            )}

            {role === 'owner' && (
              <Button
                variant={filterStatus === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStatusChange('published')}
                className={cn(
                  filterStatus === 'published' &&
                    'bg-green-100 text-green-700 border-green-200'
                )}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Published
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

