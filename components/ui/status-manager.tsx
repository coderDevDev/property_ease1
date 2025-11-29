'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  X,
  Save,
  PhilippinePeso
} from 'lucide-react';

interface StatusManagerProps {
  currentStatus: string;
  onStatusChange: (newStatus: string, data?: any) => Promise<void>;
  isLoading?: boolean;
  className?: string;
  feedbackRating?: number;
}

const STATUS_OPTIONS = [
  {
    value: 'pending',
    label: 'Pending',
    description: 'Request is waiting for assignment',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: Clock,
    nextStatuses: ['in_progress', 'cancelled']
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    description: 'Work has started on the request',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: AlertTriangle,
    nextStatuses: ['completed', 'cancelled']
  },
  {
    value: 'completed',
    label: 'Completed',
    description: 'Request has been resolved',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    nextStatuses: []
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    description: 'Request has been cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: X,
    nextStatuses: []
  }
];

export function StatusManager({
  currentStatus,
  onStatusChange,
  isLoading = false,
  className,
  feedbackRating
}: StatusManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [formData, setFormData] = useState({
    assignedTo: '',
    scheduledDate: '',
    actualCost: '',
    notes: '',
    cancellationReason: ''
  });

  const currentStatusConfig = STATUS_OPTIONS.find(
    s => s.value === currentStatus
  );
  const availableNextStatuses = currentStatusConfig?.nextStatuses || [];

  const handleStatusChange = async () => {
    if (!selectedStatus) return;

    const updateData: any = {
      status: selectedStatus,
      timestamp: new Date().toISOString()
    };

    // Add specific data based on status
    if (selectedStatus === 'in_progress') {
      if (formData.assignedTo)
        updateData.assignedTo = formData.assignedTo.trim();
      if (formData.scheduledDate)
        updateData.scheduledDate = formData.scheduledDate;
    }

    if (selectedStatus === 'completed') {
      if (formData.actualCost)
        updateData.actualCost = parseFloat(formData.actualCost);
      if (formData.notes) updateData.notes = formData.notes;
    }

    if (selectedStatus === 'cancelled') {
      if (formData.cancellationReason)
        updateData.cancellationReason = formData.cancellationReason;
    }

    try {
      await onStatusChange(selectedStatus, updateData);
      setIsDialogOpen(false);
      setFormData({
        assignedTo: '',
        scheduledDate: '',
        actualCost: '',
        notes: '',
        cancellationReason: ''
      });
    } catch (error) {
      console.error('Status change error:', error);
    }
  };

  const openStatusDialog = (status: string) => {
    setSelectedStatus(status);
    setIsDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    const config = STATUS_OPTIONS.find(s => s.value === status);
    return config?.icon || Clock;
  };

  const getStatusColor = (status: string) => {
    const config = STATUS_OPTIONS.find(s => s.value === status);
    return config?.color || 'text-gray-600';
  };

  const getStatusBgColor = (status: string) => {
    const config = STATUS_OPTIONS.find(s => s.value === status);
    return config?.bgColor || 'bg-gray-100';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Status Display */}
      <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            currentStatusConfig?.bgColor || 'bg-gray-100'
          )}>
          {currentStatusConfig && (
            <currentStatusConfig.icon
              className={cn('w-5 h-5', currentStatusConfig.color)}
            />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">
            Current Status: {currentStatusConfig?.label || currentStatus}
          </p>
          <p className="text-sm text-gray-600">
            {currentStatusConfig?.description}
          </p>
        </div>
      </div>

      {/* Available Actions */}
      {availableNextStatuses.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Available Actions</h4>
          <div className="flex flex-wrap gap-2">
            {availableNextStatuses.map(status => {
              const config = STATUS_OPTIONS.find(s => s.value === status);
              if (!config) return null;

              const isCompletionDisabled =
                status === 'completed' && !feedbackRating;

              return (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => openStatusDialog(status)}
                  disabled={isLoading || isCompletionDisabled}
                  title={
                    status === 'completed' && !feedbackRating
                      ? '🔒 Disabled: Tenant feedback is required before completion'
                      : status === 'completed'
                      ? 'Complete maintenance request'
                      : status === 'cancelled'
                      ? 'Provide a reason for cancellation - will be notified to tenant'
                      : ''
                  }
                  className={cn(
                    'border-blue-200 text-blue-600 hover:bg-blue-50',
                    config.color,
                    isCompletionDisabled && 'opacity-50 cursor-not-allowed'
                  )}>
                  <config.icon className="w-4 h-4 mr-2" />
                  {config.label}
                  {isCompletionDisabled && (
                    <span className="ml-1 text-xs">🔒</span>
                  )}
                </Button>
              );
            })}
          </div>
          {availableNextStatuses.includes('completed') && !feedbackRating && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              ⚠️ <strong>Feedback Required:</strong> Tenant feedback must be
              submitted before you can complete this request.
            </div>
          )}
        </div>
      )}

      {/* Status Change Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStatus && (
                <>
                  {(() => {
                    const Icon = getStatusIcon(selectedStatus);
                    return (
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          getStatusColor(selectedStatus)
                        )}
                      />
                    );
                  })()}
                  Change Status to{' '}
                  {STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {
                STATUS_OPTIONS.find(s => s.value === selectedStatus)
                  ?.description
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Assignment Fields for In Progress */}
            {selectedStatus === 'in_progress' && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="assignedTo"
                    className="text-gray-700 font-medium">
                    Assign To (Optional)
                  </Label>
                  <Input
                    id="assignedTo"
                    value={formData.assignedTo}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        assignedTo: e.target.value
                      }))
                    }
                    placeholder="Enter personnel name or contact"
                    className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="scheduledDate"
                    className="text-gray-700 font-medium">
                    Scheduled Date (Optional)
                  </Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        scheduledDate: e.target.value
                      }))
                    }
                    className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                  />
                </div>
              </>
            )}

            {/* Completion Fields */}
            {selectedStatus === 'completed' && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="actualCost"
                    className="text-gray-700 font-medium">
                    Actual Cost (Optional)
                  </Label>
                  <div className="relative">
                    <PhilippinePeso className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="actualCost"
                      type="number"
                      value={formData.actualCost}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          actualCost: e.target.value
                        }))
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-gray-700 font-medium">
                    Completion Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Add completion notes or details..."
                    rows={3}
                    className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                  />
                </div>
              </>
            )}

            {/* Cancellation Fields */}
            {selectedStatus === 'cancelled' && (
              <>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>⚠️ Important:</strong> Providing a reason for
                    cancellation helps tenants understand why their request was
                    cancelled. This will be notified to them.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="cancellationReason"
                    className="text-gray-700 font-medium">
                    Why are you cancelling?{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="cancellationReason"
                    value={formData.cancellationReason}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        cancellationReason: e.target.value
                      }))
                    }
                    placeholder="Example: Work is no longer needed, tenant request, property issue resolved, etc."
                    rows={3}
                    className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This reason will be communicated to the tenant.
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50">
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={
                isLoading ||
                (selectedStatus === 'cancelled' &&
                  !formData.cancellationReason.trim())
              }
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
