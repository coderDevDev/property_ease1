/**
 * Create Deposit Dialog Component
 * Allows owner to create a new security deposit for a tenant
 *
 * @component CreateDepositDialog
 * @created October 25, 2025
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DepositsAPI } from '@/lib/api/deposits';
import { TenantsAPI } from '@/lib/api/tenants';
import { PropertiesAPI } from '@/lib/api/properties';

interface CreateDepositDialogProps {
  ownerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Tenant {
  id: string;
  user_id: string;
  property_id: string;
  monthly_rent: number;
  user: {
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
  };
  property: {
    id: string;
    name: string;
    address: string;
  };
}

interface Property {
  id: string;
  name: string;
  address: string;
}

export function CreateDepositDialog({
  ownerId,
  onClose,
  onSuccess
}: CreateDepositDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [formData, setFormData] = useState({
    tenantId: '',
    propertyId: '',
    depositAmount: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [ownerId]);

  const loadData = async () => {
    try {
      setLoadingData(true);

      const [tenantsResult, propertiesResult] = await Promise.all([
        TenantsAPI.getTenants(ownerId),
        PropertiesAPI.getProperties(ownerId)
      ]);

      if (tenantsResult.success) {
        // Filter tenants who don't have deposits yet
        const tenantsWithoutDeposits = [];
        for (const tenant of tenantsResult.data) {
          const existingDeposit = await DepositsAPI.getTenantDeposit(tenant.id);
          if (!existingDeposit) {
            tenantsWithoutDeposits.push(tenant);
          }
        }
        setTenants(tenantsWithoutDeposits);
      }

      if (propertiesResult.success) {
        setProperties(propertiesResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load tenants and properties');
    } finally {
      setLoadingData(false);
    }
  };

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    setFormData({
      ...formData,
      tenantId,
      propertyId: tenant?.property_id || ''
    });
  };

  // Get selected tenant's monthly rent for validation
  const getSelectedTenantMonthlyRent = (): number => {
    const tenant = tenants.find(t => t.id === formData.tenantId);
    return tenant?.monthly_rent || 0;
  };

  // Calculate maximum allowed security deposit (2 months rent per RA 9653)
  const getMaxAllowedDeposit = (): number => {
    const monthlyRent = getSelectedTenantMonthlyRent();
    return monthlyRent * 2; // Philippine Rent Control Act (RA 9653): Max 2 months
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tenantId || !formData.propertyId || !formData.depositAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }

    // Validate against Philippine Rent Control Act (RA 9653)
    const maxAllowed = getMaxAllowedDeposit();
    const monthlyRent = getSelectedTenantMonthlyRent();
    if (monthlyRent > 0 && amount > maxAllowed) {
      toast.error(
        `Security deposit cannot exceed ₱${maxAllowed.toLocaleString()}`,
        {
          description: `Philippine Rent Control Act (RA 9653) limits security deposits to 2 months rent (₱${monthlyRent.toLocaleString()} × 2)`
        }
      );
      return;
    }

    try {
      setLoading(true);

      const result = await DepositsAPI.createDepositBalance(
        formData.tenantId,
        formData.propertyId,
        amount
      );

      if (result.success) {
        toast.success('Security deposit created successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Failed to create deposit');
      }
    } catch (error: any) {
      console.error('Error creating deposit:', error);
      toast.error(error.message || 'Failed to create deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Create Security Deposit
          </DialogTitle>
          <DialogDescription>
            Create a new security deposit record for a tenant
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No tenants available without existing deposits
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tenant Selection */}
            <div className="space-y-2">
              <Label htmlFor="tenant">
                Tenant <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tenantId}
                onValueChange={handleTenantChange}
                required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.user?.first_name} {tenant.user?.last_name}-{' '}
                      {tenant.property?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Property (Auto-filled) */}
            {formData.propertyId && (
              <div className="space-y-2">
                <Label>Property</Label>
                <Input
                  value={
                    properties.find(p => p.id === formData.propertyId)?.name ||
                    'N/A'
                  }
                  disabled
                  className="bg-gray-50"
                />
              </div>
            )}

            {/* Legal Compliance Banner */}
            {formData.tenantId && getSelectedTenantMonthlyRent() > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">
                      Philippine Rent Control Act (RA 9653)
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Security deposits are limited to a maximum of 2 months rent.
                    </p>
                    <div className="text-sm text-blue-800 font-medium">
                      Maximum allowed: ₱{getMaxAllowedDeposit().toLocaleString()}
                      <span className="text-blue-600 font-normal ml-1">
                        (₱{getSelectedTenantMonthlyRent().toLocaleString()} × 2 months)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Deposit Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Security Deposit Amount (₱) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={getMaxAllowedDeposit() || undefined}
                placeholder="10000.00"
                value={formData.depositAmount}
                onChange={e =>
                  setFormData({ ...formData, depositAmount: e.target.value })
                }
                required
              />
              {formData.tenantId && getSelectedTenantMonthlyRent() > 0 && (
                <p className="text-xs text-gray-500">
                  Legal maximum: ₱{getMaxAllowedDeposit().toLocaleString()} (2 months rent)
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this deposit..."
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Deposit'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
