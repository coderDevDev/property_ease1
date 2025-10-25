/**
 * View Inspection Dialog
 * Display completed inspection details
 * 
 * @component ViewInspectionDialog
 * @created October 25, 2025
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, AlertCircle } from 'lucide-react';
import { DepositsAPI, type MoveOutInspection, type DepositDeduction } from '@/lib/api/deposits';

interface ViewInspectionDialogProps {
  inspection: MoveOutInspection;
  onClose: () => void;
}

export function ViewInspectionDialog({
  inspection,
  onClose,
}: ViewInspectionDialogProps) {
  const [deductions, setDeductions] = useState<DepositDeduction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeductions();
  }, [inspection.id]);

  const loadDeductions = async () => {
    try {
      const data = await DepositsAPI.getInspectionDeductions(inspection.id);
      setDeductions(data);
    } catch (error) {
      console.error('Error loading deductions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'disputed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return 'text-green-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'damaged': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Move-Out Inspection Details</DialogTitle>
          <DialogDescription>
            Inspection conducted on{' '}
            {new Date(inspection.inspection_date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {new Date(inspection.inspection_date).toLocaleString()}
              </span>
            </div>
            <Badge className={getStatusColor(inspection.status)}>
              {inspection.status.toUpperCase()}
            </Badge>
          </div>

          {/* Property Condition Checklist */}
          {inspection.checklist && Object.keys(inspection.checklist).length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Property Condition
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(inspection.checklist).map(([item, condition]) => (
                  <div key={item} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm capitalize">{item}:</span>
                    <span className={`text-sm font-medium capitalize ${getConditionColor(condition as string)}`}>
                      {condition}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Inspection Notes */}
          {inspection.notes && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Inspection Notes</h3>
              <p className="text-sm text-gray-600">{inspection.notes}</p>
            </Card>
          )}

          {/* Deductions */}
          {deductions.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">
                Deductions ({deductions.length})
              </h3>
              <div className="space-y-3">
                {deductions.map((deduction) => (
                  <div
                    key={deduction.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{deduction.item_description}</p>
                        {deduction.category && (
                          <p className="text-xs text-gray-500 mt-1">
                            Category: {deduction.category}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold text-red-600">
                        ₱{deduction.cost.toLocaleString()}
                      </span>
                    </div>

                    {deduction.notes && (
                      <p className="text-sm text-gray-600 mb-2">{deduction.notes}</p>
                    )}

                    {deduction.proof_photos && deduction.proof_photos.length > 0 && (
                      <p className="text-xs text-gray-500">
                        📷 {deduction.proof_photos.length} photo(s) attached
                      </p>
                    )}

                    {deduction.disputed && (
                      <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-orange-900">
                              Disputed by Tenant
                            </p>
                            {deduction.dispute_reason && (
                              <p className="text-xs text-orange-700 mt-1">
                                Reason: {deduction.dispute_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Summary */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-3">Financial Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Deductions:</span>
                <span className="font-semibold text-red-600">
                  ₱{inspection.total_deductions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-300">
                <span className="font-medium">Refundable Amount:</span>
                <span className="font-bold text-lg text-green-600">
                  ₱{inspection.refundable_amount.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
