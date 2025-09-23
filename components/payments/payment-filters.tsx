'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, Table2, LayoutGrid } from 'lucide-react';

interface PaymentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterType: string;
  onTypeChange: (value: string) => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  className?: string;
}

export function PaymentFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterType,
  onTypeChange,
  viewMode,
  onViewModeChange,
  className
}: PaymentFiltersProps) {
  return (
    <Card className={cn(
      'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg',
      className
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={filterStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-40 bg-white/50 border-blue-200/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-40 bg-white/50 border-blue-200/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="security_deposit">Security Deposit</SelectItem>
                <SelectItem value="utility">Utility</SelectItem>
                <SelectItem value="penalty">Penalty</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-white/50 border border-blue-200/50 rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('table')}
                className={cn(
                  viewMode === 'table' && 'bg-blue-100 text-blue-700'
                )}>
                <Table2 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  viewMode === 'grid' && 'bg-blue-100 text-blue-700'
                )}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
