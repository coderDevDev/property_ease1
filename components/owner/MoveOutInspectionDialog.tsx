/**
 * Move-Out Inspection Dialog
 * Create and manage move-out inspections with deductions
 * 
 * @component MoveOutInspectionDialog
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2, Upload } from 'lucide-react';
import { DepositsAPI, type InspectionChecklist } from '@/lib/api/deposits';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface MoveOutInspectionDialogProps {
  tenant: any;
  onClose: () => void;
  onComplete: () => void;
}

interface DeductionItem {
  id: string;
  item_description: string;
  cost: number;
  category: string;
  notes: string;
  proof_photos: string[];
}

const INSPECTION_ITEMS = [
  'walls',
  'flooring',
  'appliances',
  'plumbing',
  'electrical',
  'windows',
  'doors',
  'kitchen',
  'bathroom',
  'cleanliness',
];

const CONDITION_OPTIONS = ['good', 'fair', 'poor', 'damaged'] as const;

const DEDUCTION_CATEGORIES = [
  'Damage',
  'Cleaning',
  'Repairs',
  'Missing Items',
  'Unpaid Bills',
  'Other',
];

export function MoveOutInspectionDialog({
  tenant,
  onClose,
  onComplete,
}: MoveOutInspectionDialogProps) {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'checklist' | 'deductions' | 'review'>(
    'checklist'
  );

  // Checklist state
  const [checklist, setChecklist] = useState<InspectionChecklist>({});
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([]);

  // Deductions state
  const [deductions, setDeductions] = useState<DeductionItem[]>([]);
  const [newDeduction, setNewDeduction] = useState<DeductionItem>({
    id: '',
    item_description: '',
    cost: 0,
    category: 'Damage',
    notes: '',
    proof_photos: [],
  });

  const handleChecklistChange = (item: string, value: string) => {
    setChecklist((prev) => ({ ...prev, [item]: value }));
  };

  const handleAddDeduction = () => {
    if (!newDeduction.item_description || newDeduction.cost <= 0) {
      toast.error('Please fill in item description and cost');
      return;
    }

    setDeductions([
      ...deductions,
      { ...newDeduction, id: Date.now().toString() },
    ]);

    // Reset form
    setNewDeduction({
      id: '',
      item_description: '',
      cost: 0,
      category: 'Damage',
      notes: '',
      proof_photos: [],
    });
  };

  const handleRemoveDeduction = (id: string) => {
    setDeductions(deductions.filter((d) => d.id !== id));
  };

  const calculateTotals = () => {
    const totalDeductions = deductions.reduce((sum, d) => sum + d.cost, 0);
    const depositAmount = Number(tenant.deposit_amount) || 0;
    const refundable = Math.max(0, depositAmount - totalDeductions);

    return { totalDeductions, depositAmount, refundable };
  };

  const handleSubmit = async () => {
    if (!authState.user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create inspection
      const inspectionResult = await DepositsAPI.createInspection({
        tenantId: tenant.tenant_id,
        propertyId: tenant.property_id,
        inspectorId: authState.user.id,
        checklist,
        photos: inspectionPhotos,
        notes: inspectionNotes,
      });

      if (!inspectionResult.success || !inspectionResult.data) {
        throw new Error(inspectionResult.message);
      }

      const inspectionId = inspectionResult.data.id;

      // Step 2: Add deductions
      for (const deduction of deductions) {
        const deductionResult = await DepositsAPI.addDeduction({
          inspectionId,
          itemDescription: deduction.item_description,
          cost: deduction.cost,
          proofPhotos: deduction.proof_photos,
          notes: deduction.notes,
          category: deduction.category,
        });

        if (!deductionResult.success) {
          console.error('Failed to add deduction:', deductionResult.message);
        }
      }

      // Step 3: Complete inspection
      const completeResult = await DepositsAPI.completeInspection(inspectionId);

      if (completeResult.success) {
        toast.success('Inspection completed successfully');
        onComplete();
      } else {
        throw new Error(completeResult.message);
      }
    } catch (error: any) {
      console.error('Error submitting inspection:', error);
      toast.error(error.message || 'Failed to submit inspection');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Move-Out Inspection</DialogTitle>
          <DialogDescription>
            Conduct property inspection for {tenant.tenants?.users?.full_name}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Button
            variant={step === 'checklist' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStep('checklist')}
          >
            1. Checklist
          </Button>
          <div className="w-8 h-px bg-gray-300" />
          <Button
            variant={step === 'deductions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStep('deductions')}
          >
            2. Deductions
          </Button>
          <div className="w-8 h-px bg-gray-300" />
          <Button
            variant={step === 'review' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStep('review')}
          >
            3. Review
          </Button>
        </div>

        {/* Step 1: Inspection Checklist */}
        {step === 'checklist' && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Property Condition</h3>
              <div className="grid grid-cols-2 gap-4">
                {INSPECTION_ITEMS.map((item) => (
                  <div key={item} className="space-y-2">
                    <Label className="capitalize">{item}</Label>
                    <Select
                      value={checklist[item] || ''}
                      onValueChange={(value) =>
                        handleChecklistChange(item, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {condition.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-2">
              <Label>Inspection Notes</Label>
              <Textarea
                placeholder="Add any additional notes about the property condition..."
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep('deductions')}>
                Next: Add Deductions
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Deductions */}
        {step === 'deductions' && (
          <div className="space-y-4">
            {/* Add Deduction Form */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Add Deduction</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Item Description *</Label>
                  <Input
                    placeholder="e.g., Broken window, Wall damage"
                    value={newDeduction.item_description}
                    onChange={(e) =>
                      setNewDeduction({
                        ...newDeduction,
                        item_description: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Cost *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newDeduction.cost || ''}
                    onChange={(e) =>
                      setNewDeduction({
                        ...newDeduction,
                        cost: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Select
                    value={newDeduction.category}
                    onValueChange={(value) =>
                      setNewDeduction({ ...newDeduction, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEDUCTION_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional details about this deduction..."
                    value={newDeduction.notes}
                    onChange={(e) =>
                      setNewDeduction({ ...newDeduction, notes: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="col-span-2">
                  <Button
                    type="button"
                    onClick={handleAddDeduction}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deduction
                  </Button>
                </div>
              </div>
            </Card>

            {/* Deductions List */}
            {deductions.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-4">
                  Deductions ({deductions.length})
                </h3>
                <div className="space-y-2">
                  {deductions.map((deduction) => (
                    <div
                      key={deduction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{deduction.item_description}</p>
                        <p className="text-sm text-gray-600">
                          {deduction.category}
                          {deduction.notes && ` • ${deduction.notes}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-red-600">
                          ₱{deduction.cost.toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDeduction(deduction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('checklist')}>
                Back
              </Button>
              <Button onClick={() => setStep('review')}>
                Next: Review
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-4">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Original Deposit:</span>
                  <span className="font-semibold">
                    ₱{totals.depositAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Total Deductions:</span>
                  <span className="font-semibold">
                    -₱{totals.totalDeductions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-300">
                  <span className="font-semibold">Refundable Amount:</span>
                  <span className="font-bold text-lg text-green-600">
                    ₱{totals.refundable.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('deductions')}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Inspection
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
