/**
 * Create Bill Dialog Component
 * Form to create new utility bills
 * 
 * @component CreateBillDialog
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { UtilitiesAPI } from '@/lib/api/utilities';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CreateBillDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

const BILL_TYPES = [
  'electricity',
  'water',
  'gas',
  'internet',
  'cable',
  'garbage',
  'maintenance',
  'other',
];

const UNITS = {
  electricity: 'kWh',
  water: 'm³',
  gas: 'm³',
  internet: 'month',
  cable: 'month',
  garbage: 'month',
  maintenance: 'month',
  other: 'unit',
};

export function CreateBillDialog({ onClose, onSuccess }: CreateBillDialogProps) {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantId: '',
    billType: 'electricity',
    billingPeriodStart: '',
    billingPeriodEnd: '',
    dueDate: '',
    previousReading: '',
    currentReading: '',
    ratePerUnit: '',
    baseCharge: '',
    additionalCharges: '',
    notes: '',
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    // This would fetch owner's properties - simplified for now
    // In real implementation, fetch from properties API
  };

  const loadTenants = async (propertyId: string) => {
    // This would fetch tenants for selected property
    // In real implementation, fetch from tenants API
  };

  const handlePropertyChange = (propertyId: string) => {
    setFormData({ ...formData, propertyId, tenantId: '' });
    loadTenants(propertyId);
  };

  const calculateTotal = () => {
    const previous = parseFloat(formData.previousReading) || 0;
    const current = parseFloat(formData.currentReading) || 0;
    const rate = parseFloat(formData.ratePerUnit) || 0;
    const base = parseFloat(formData.baseCharge) || 0;
    const additional = parseFloat(formData.additionalCharges) || 0;

    const consumption = current - previous;
    const consumptionCharge = consumption * rate;
    const total = base + consumptionCharge + additional;

    return {
      consumption: consumption > 0 ? consumption : 0,
      consumptionCharge: consumptionCharge > 0 ? consumptionCharge : 0,
      total: total > 0 ? total : 0,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authState.user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (!formData.propertyId || !formData.billType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const result = await UtilitiesAPI.createBill({
        propertyId: formData.propertyId,
        tenantId: formData.tenantId || null,
        createdBy: authState.user.id,
        billType: formData.billType,
        billingPeriodStart: formData.billingPeriodStart,
        billingPeriodEnd: formData.billingPeriodEnd,
        dueDate: formData.dueDate,
        previousReading: parseFloat(formData.previousReading) || undefined,
        currentReading: parseFloat(formData.currentReading) || undefined,
        unit: UNITS[formData.billType as keyof typeof UNITS],
        ratePerUnit: parseFloat(formData.ratePerUnit) || undefined,
        baseCharge: parseFloat(formData.baseCharge) || undefined,
        additionalCharges: parseFloat(formData.additionalCharges) || undefined,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        toast.success('Utility bill created successfully');
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error creating bill:', error);
      toast.error(error.message || 'Failed to create utility bill');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotal();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Utility Bill</DialogTitle>
          <DialogDescription>
            Create a new utility bill for your property
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property & Tenant */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Property *</Label>
              <Select
                value={formData.propertyId}
                onValueChange={handlePropertyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prop1">Property 1</SelectItem>
                  <SelectItem value="prop2">Property 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tenant (Optional)</Label>
              <Select
                value={formData.tenantId}
                onValueChange={(value) =>
                  setFormData({ ...formData, tenantId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant1">Tenant 1</SelectItem>
                  <SelectItem value="tenant2">Tenant 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bill Type */}
          <div className="space-y-2">
            <Label>Bill Type *</Label>
            <Select
              value={formData.billType}
              onValueChange={(value) =>
                setFormData({ ...formData, billType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILL_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Billing Period */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Period Start *</Label>
              <Input
                type="date"
                value={formData.billingPeriodStart}
                onChange={(e) =>
                  setFormData({ ...formData, billingPeriodStart: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Period End *</Label>
              <Input
                type="date"
                value={formData.billingPeriodEnd}
                onChange={(e) =>
                  setFormData({ ...formData, billingPeriodEnd: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Meter Readings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Previous Reading</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.previousReading}
                onChange={(e) =>
                  setFormData({ ...formData, previousReading: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Current Reading</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.currentReading}
                onChange={(e) =>
                  setFormData({ ...formData, currentReading: e.target.value })
                }
              />
            </div>
          </div>

          {/* Charges */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Rate per Unit</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.ratePerUnit}
                onChange={(e) =>
                  setFormData({ ...formData, ratePerUnit: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Base Charge</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.baseCharge}
                onChange={(e) =>
                  setFormData({ ...formData, baseCharge: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Charges</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.additionalCharges}
                onChange={(e) =>
                  setFormData({ ...formData, additionalCharges: e.target.value })
                }
              />
            </div>
          </div>

          {/* Calculation Summary */}
          {totals.consumption > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Calculation Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Consumption:</span>
                  <span className="font-medium">
                    {totals.consumption.toFixed(2)} {UNITS[formData.billType as keyof typeof UNITS]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Consumption Charge:</span>
                  <span className="font-medium">
                    ₱{totals.consumptionCharge.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-bold text-lg text-blue-600">
                    ₱{totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Bill
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
