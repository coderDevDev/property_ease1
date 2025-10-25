/**
 * Deposit Balance Card Component
 * Displays tenant's security deposit information
 * 
 * @component DepositBalanceCard
 * @created October 25, 2025
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { DisputeDeductionDialog } from './DisputeDeductionDialog';
import type { DepositBalance, MoveOutInspection, DepositDeduction } from '@/lib/api/deposits';

interface DepositBalanceCardProps {
  deposit: DepositBalance | null;
  inspection: MoveOutInspection | null;
  deductions: DepositDeduction[];
  onRefresh?: () => void;
}

export function DepositBalanceCard({ 
  deposit, 
  inspection, 
  deductions,
  onRefresh 
}: DepositBalanceCardProps) {
  const [selectedDeduction, setSelectedDeduction] = useState<DepositDeduction | null>(null);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);

  if (!deposit) {
    return null;
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'held': return 'bg-blue-500';
      case 'fully_refunded': return 'bg-green-500';
      case 'partially_refunded': return 'bg-yellow-500';
      case 'forfeited': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'held': return 'Held';
      case 'fully_refunded': return 'Fully Refunded';
      case 'partially_refunded': return 'Partially Refunded';
      case 'forfeited': return 'Forfeited';
      default: return status;
    }
  };

  const handleDisputeClick = (deduction: DepositDeduction) => {
    setSelectedDeduction(deduction);
    setShowDisputeDialog(true);
  };

  const handleDisputeSuccess = () => {
    setShowDisputeDialog(false);
    setSelectedDeduction(null);
    if (onRefresh) {
      onRefresh();
    }
  };
  
  return (
    <>
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="h-5 w-5 text-blue-600" />
            Security Deposit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Status</span>
            <Badge className={getStatusColor(deposit.status)}>
              {getStatusLabel(deposit.status)}
            </Badge>
          </div>
          
          {/* Deposit Amounts */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Original Deposit</span>
              <span className="font-semibold text-gray-900">
                ₱{deposit.deposit_amount.toLocaleString()}
              </span>
            </div>
            
            {deposit.deductions > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span className="text-sm">Deductions</span>
                <span className="font-semibold">
                  -₱{deposit.deductions.toLocaleString()}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-3 border-t border-blue-200">
              <span className="font-medium text-gray-900">Refundable Amount</span>
              <span className="font-bold text-xl text-blue-600">
                ₱{deposit.refundable_amount.toLocaleString()}
              </span>
            </div>
          </div>
          
          {/* Inspection Status */}
          {inspection && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Move-Out Inspection
                </span>
                <Badge variant="outline" className="text-xs">
                  {inspection.status}
                </Badge>
              </div>
              <p className="text-xs text-blue-700">
                Conducted on {new Date(inspection.inspection_date).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {/* Deductions List */}
          {inspection && inspection.status === 'completed' && deductions.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-yellow-900 mb-2">
                    Deductions Applied ({deductions.length})
                  </p>
                  <div className="space-y-3">
                    {deductions.map((deduction) => (
                      <div 
                        key={deduction.id} 
                        className="bg-white p-3 rounded border border-yellow-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
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
                          <p className="text-xs text-gray-600 mb-2">
                            {deduction.notes}
                          </p>
                        )}
                        
                        {deduction.proof_photos && deduction.proof_photos.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <ImageIcon className="h-3 w-3" />
                            <span>{deduction.proof_photos.length} photo(s) attached</span>
                          </div>
                        )}
                        
                        {deduction.disputed ? (
                          <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                            <p className="text-xs font-medium text-orange-900">
                              ⚠️ Disputed
                            </p>
                            {deduction.dispute_reason && (
                              <p className="text-xs text-orange-700 mt-1">
                                Reason: {deduction.dispute_reason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs h-7"
                            onClick={() => handleDisputeClick(deduction)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Dispute This Deduction
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Notes */}
          {deposit.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-1">Notes:</p>
              <p className="text-xs text-gray-600">{deposit.notes}</p>
            </div>
          )}
          
          {/* Info Message */}
          {deposit.status === 'held' && !inspection && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700">
                💡 Your security deposit is being held and will be refunded after your lease ends 
                and a move-out inspection is completed.
              </p>
            </div>
          )}
          
          {deposit.status === 'fully_refunded' && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700">
                ✅ Your security deposit has been fully refunded.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute Dialog */}
      {showDisputeDialog && selectedDeduction && (
        <DisputeDeductionDialog
          deduction={selectedDeduction}
          onClose={() => {
            setShowDisputeDialog(false);
            setSelectedDeduction(null);
          }}
          onSuccess={handleDisputeSuccess}
        />
      )}
    </>
  );
}
