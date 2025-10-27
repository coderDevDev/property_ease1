'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { LeaseRenewalsAPI } from '@/lib/api/lease-renewals';

interface RequestRenewalDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
  propertyId: string;
  currentLeaseEnd: string;
  currentRent: number;
  propertyName: string;
}

export function RequestRenewalDialog({
  open,
  onClose,
  onSuccess,
  tenantId,
  propertyId,
  currentLeaseEnd,
  currentRent,
  propertyName,
}: RequestRenewalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    proposedLeaseStart: '',
    durationMonths: 12,
    proposedRent: currentRent,
    tenantNotes: '',
  });

  // Calculate proposed end date based on duration
  const calculateEndDate = () => {
    if (!formData.proposedLeaseStart) return '';
    const startDate = new Date(formData.proposedLeaseStart);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + formData.durationMonths);
    return endDate.toISOString().split('T')[0];
  };

  const proposedLeaseEnd = calculateEndDate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.proposedLeaseStart) {
      toast.error('Please select a start date');
      return;
    }

    setLoading(true);

    try {
      const result = await LeaseRenewalsAPI.createRenewal({
        tenantId,
        propertyId,
        currentLeaseEnd,
        proposedLeaseStart: formData.proposedLeaseStart,
        proposedLeaseEnd,
        proposedRent: formData.proposedRent,
        currentRent,
        durationMonths: formData.durationMonths,
        tenantNotes: formData.tenantNotes,
      });

      if (result.success) {
        toast.success('Renewal request submitted successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error submitting renewal:', error);
      toast.error(error.message || 'Failed to submit renewal request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Lease Renewal</DialogTitle>
          <DialogDescription>
            Submit a renewal request for {propertyName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Lease Info */}
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm text-blue-900">Current Lease</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-600">End Date:</p>
                <p className="font-medium text-blue-900">
                  {new Date(currentLeaseEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-blue-600">Monthly Rent:</p>
                <p className="font-medium text-blue-900">
                  ₱{currentRent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Proposed Lease Start */}
          <div className="space-y-2">
            <Label htmlFor="proposedLeaseStart">
              Proposed Start Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="proposedLeaseStart"
                type="date"
                value={formData.proposedLeaseStart}
                onChange={(e) =>
                  setFormData({ ...formData, proposedLeaseStart: e.target.value })
                }
                className="pl-10"
                required
                min={currentLeaseEnd}
              />
            </div>
            <p className="text-xs text-gray-500">
              Typically starts the day after current lease ends
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="durationMonths">
              Lease Duration (Months) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="durationMonths"
              type="number"
              min="1"
              max="60"
              value={formData.durationMonths}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  durationMonths: parseInt(e.target.value) || 12,
                })
              }
              required
            />
            {proposedLeaseEnd && (
              <p className="text-xs text-gray-500">
                Proposed end date: {new Date(proposedLeaseEnd).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Proposed Rent */}
          <div className="space-y-2">
            <Label htmlFor="proposedRent">
              Proposed Monthly Rent <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="proposedRent"
                type="number"
                step="0.01"
                min="0"
                value={formData.proposedRent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    proposedRent: parseFloat(e.target.value) || 0,
                  })
                }
                className="pl-10"
                required
              />
            </div>
            {formData.proposedRent !== currentRent && (
              <p className="text-xs text-amber-600">
                {formData.proposedRent > currentRent ? 'Increase' : 'Decrease'} of ₱
                {Math.abs(formData.proposedRent - currentRent).toLocaleString()} from
                current rent
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="tenantNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="tenantNotes"
              placeholder="Any additional comments or requests..."
              value={formData.tenantNotes}
              onChange={(e) =>
                setFormData({ ...formData, tenantNotes: e.target.value })
              }
              rows={4}
            />
          </div>

          {/* Summary */}
          {proposedLeaseEnd && (
            <div className="p-4 bg-green-50 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm text-green-900">
                Renewal Summary
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-600">Duration:</span>
                  <span className="font-medium text-green-900">
                    {formData.durationMonths} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">New Lease Period:</span>
                  <span className="font-medium text-green-900">
                    {new Date(formData.proposedLeaseStart).toLocaleDateString()} -{' '}
                    {new Date(proposedLeaseEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Monthly Rent:</span>
                  <span className="font-medium text-green-900">
                    ₱{formData.proposedRent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="font-semibold text-green-900">Total Cost:</span>
                  <span className="font-bold text-lg text-green-900">
                    ₱
                    {(formData.proposedRent * formData.durationMonths).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
