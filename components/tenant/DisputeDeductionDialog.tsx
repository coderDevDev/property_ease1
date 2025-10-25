/**
 * Dispute Deduction Dialog Component
 * Allows tenants to dispute deposit deductions
 * 
 * @component DisputeDeductionDialog
 * @created October 25, 2025
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { DepositsAPI, type DepositDeduction } from '@/lib/api/deposits';
import { toast } from 'sonner';

interface DisputeDeductionDialogProps {
  deduction: DepositDeduction;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisputeDeductionDialog({
  deduction,
  onClose,
  onSuccess,
}: DisputeDeductionDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a reason for disputing this deduction');
      return;
    }

    setLoading(true);

    try {
      const result = await DepositsAPI.disputeDeduction(deduction.id, reason);

      if (result.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dispute Deduction</DialogTitle>
          <DialogDescription>
            Explain why you believe this deduction is incorrect or unfair.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Deduction Details */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">
                  {deduction.item_description}
                </p>
                {deduction.category && (
                  <p className="text-xs text-gray-500 mt-1">
                    Category: {deduction.category}
                  </p>
                )}
              </div>
              <span className="text-sm font-semibold text-red-600 ml-2">
                ₱{deduction.cost.toLocaleString()}
              </span>
            </div>
            
            {deduction.notes && (
              <p className="text-xs text-gray-600 pt-2 border-t">
                Owner's notes: {deduction.notes}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium mb-1">Before disputing:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Review the inspection photos if available</li>
                <li>Provide specific reasons for your dispute</li>
                <li>The owner will be notified and may respond</li>
                <li>Admin may review if dispute cannot be resolved</li>
              </ul>
            </div>
          </div>

          {/* Dispute Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Dispute <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why you disagree with this deduction. Be specific and provide details..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              required
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Minimum 20 characters. Be clear and professional.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || reason.trim().length < 20}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Dispute
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
