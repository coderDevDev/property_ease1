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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { LeaseRenewalsAPI } from '@/lib/api/lease-renewals';

interface ReviewRenewalDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  renewal: any;
  ownerId: string;
}

export function ReviewRenewalDialog({
  open,
  onClose,
  onSuccess,
  renewal,
  ownerId,
}: ReviewRenewalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await LeaseRenewalsAPI.approveRenewal(
        renewal.id,
        ownerId,
        notes
      );

      if (result.success) {
        toast.success('Renewal approved! Tenant lease dates have been updated.');
        onSuccess();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error approving renewal:', error);
      toast.error(error.message || 'Failed to approve renewal');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const result = await LeaseRenewalsAPI.rejectRenewal(
        renewal.id,
        ownerId,
        notes
      );

      if (result.success) {
        toast.success('Renewal rejected');
        onSuccess();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error rejecting renewal:', error);
      toast.error(error.message || 'Failed to reject renewal');
    } finally {
      setLoading(false);
    }
  };

  const rentChange = renewal.proposed_rent - renewal.current_rent;
  const rentChangePercent = (rentChange / renewal.current_rent) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Lease Renewal Request</DialogTitle>
          <DialogDescription>
            Review and approve or reject this renewal request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property & Tenant Info */}
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <h4 className="font-semibold text-blue-900">Request Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-600">Property:</p>
                <p className="font-medium text-blue-900">
                  {renewal.property?.name}
                </p>
              </div>
              <div>
                <p className="text-blue-600">Tenant:</p>
                <p className="font-medium text-blue-900">
                  {renewal.tenant?.user?.first_name} {renewal.tenant?.user?.last_name}
                </p>
              </div>
            </div>
          </div>

          {/* Current vs Proposed */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Current Lease */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h4 className="font-semibold text-gray-900">Current Lease</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">End Date:</p>
                  <p className="font-medium text-gray-900">
                    {new Date(renewal.current_lease_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Monthly Rent:</p>
                  <p className="font-medium text-gray-900">
                    ₱{renewal.current_rent.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Proposed Lease */}
            <div className="p-4 bg-green-50 rounded-lg space-y-3">
              <h4 className="font-semibold text-green-900">Proposed Renewal</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-green-600">Duration:</p>
                  <p className="font-medium text-green-900">
                    {renewal.duration_months} months
                  </p>
                </div>
                <div>
                  <p className="text-green-600">Start Date:</p>
                  <p className="font-medium text-green-900">
                    {new Date(renewal.proposed_lease_start).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-green-600">End Date:</p>
                  <p className="font-medium text-green-900">
                    {new Date(renewal.proposed_lease_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-green-600">Monthly Rent:</p>
                  <p className={`font-medium ${
                    rentChange > 0 ? 'text-green-700' : rentChange < 0 ? 'text-red-700' : 'text-green-900'
                  }`}>
                    ₱{renewal.proposed_rent.toLocaleString()}
                    {rentChange !== 0 && (
                      <span className="text-xs ml-2">
                        ({rentChange > 0 ? '+' : ''}₱{Math.abs(rentChange).toLocaleString()} / 
                        {rentChangePercent > 0 ? '+' : ''}{rentChangePercent.toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Notes */}
          {renewal.tenant_notes && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Tenant's Notes:</h4>
              <p className="text-sm text-blue-700">{renewal.tenant_notes}</p>
            </div>
          )}

          {/* Financial Summary */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-3">Financial Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-600">Total Contract Value:</span>
                <span className="font-medium text-purple-900">
                  ₱{(renewal.proposed_rent * renewal.duration_months).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-600">Monthly Income:</span>
                <span className="font-medium text-purple-900">
                  ₱{renewal.proposed_rent.toLocaleString()}
                </span>
              </div>
              {rentChange !== 0 && (
                <div className="flex justify-between pt-2 border-t border-purple-200">
                  <span className="text-purple-600">Income Change:</span>
                  <span className={`font-medium ${
                    rentChange > 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {rentChange > 0 ? '+' : ''}₱{rentChange.toLocaleString()}/month
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Selection */}
          {!action && (
            <div className="flex gap-3">
              <Button
                onClick={() => setAction('approve')}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Renewal
              </Button>
              <Button
                onClick={() => setAction('reject')}
                variant="outline"
                className="flex-1 border-red-200 text-red-700 hover:bg-red-50">
                <XCircle className="w-4 h-4 mr-2" />
                Reject Renewal
              </Button>
            </div>
          )}

          {/* Notes Input */}
          {action && (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${
                action === 'approve' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {action === 'approve' ? (
                    <CheckCircle className="w-5 h-5 text-green-700" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-700" />
                  )}
                  <h4 className={`font-semibold ${
                    action === 'approve' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {action === 'approve' ? 'Approving Renewal' : 'Rejecting Renewal'}
                  </h4>
                </div>
                <p className={`text-sm ${
                  action === 'approve' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {action === 'approve'
                    ? 'The tenant\'s lease dates will be automatically updated upon approval.'
                    : 'Please provide a reason for rejection. The tenant will be notified.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {action === 'approve' ? 'Notes (Optional)' : 'Reason for Rejection *'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    action === 'approve'
                      ? 'Add any notes or conditions...'
                      : 'Explain why this renewal is being rejected...'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  required={action === 'reject'}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAction(null);
                    setNotes('');
                  }}
                  className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={action === 'approve' ? handleApprove : handleReject}
                  disabled={loading || (action === 'reject' && !notes.trim())}
                  className={`flex-1 ${
                    action === 'approve'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  } text-white`}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {!action && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
