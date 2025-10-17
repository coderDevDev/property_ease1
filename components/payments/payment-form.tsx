'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  Calendar,
  User,
  Home,
  Save,
  X,
  PhilippinePeso
} from 'lucide-react';
import type { PaymentFormData } from '@/lib/api/payments';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
}

interface Tenant {
  id: string;
  property_id: string;
  unit_number: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface PaymentFormProps {
  initialData?: Partial<PaymentFormData>;
  properties: Property[];
  tenants: Tenant[];
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  role: 'owner' | 'tenant';
  className?: string;
}

export function PaymentForm({
  initialData,
  properties,
  tenants,
  onSubmit,
  onCancel,
  isLoading = false,
  role,
  className
}: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    tenant_id: initialData?.tenant_id || '',
    property_id: initialData?.property_id || '',
    amount: initialData?.amount || 0,
    payment_type: initialData?.payment_type || 'rent',
    payment_method: initialData?.payment_method || 'gcash',
    due_date: initialData?.due_date || '',
    late_fee: initialData?.late_fee || 0,
    reference_number: initialData?.reference_number || '',
    notes: initialData?.notes || '',
    sendXenditLink: initialData?.sendXenditLink || false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter tenants based on selected property
  const filteredTenants =
    properties.length > 0 && formData.property_id
      ? tenants.filter(tenant => tenant.property_id === formData.property_id)
      : tenants;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tenant_id) {
      newErrors.tenant_id = 'Tenant is required';
    }
    if (!formData.property_id) {
      newErrors.property_id = 'Property is required';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.payment_type) {
      newErrors.payment_type = 'Payment type is required';
    }
    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }
    if (formData.late_fee && formData.late_fee < 0) {
      newErrors.late_fee = 'Late fee cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  };

  const handleInputChange = (field: keyof PaymentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg',
        className
      )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <PhilippinePeso className="w-5 h-5" />
          {initialData ? 'Edit Payment' : 'Create New Payment'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="property_id"
                className="text-gray-700 font-medium">
                Property *
              </Label>
              <Select
                value={formData.property_id}
                onValueChange={value =>
                  handleInputChange('property_id', value)
                }>
                <SelectTrigger
                  className={cn(
                    'bg-white/50 border-blue-200/50 focus:border-blue-400',
                    errors.property_id && 'border-red-300 focus:border-red-400'
                  )}>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        <span>{property.name}</span>
                        <span className="text-gray-500">({property.city})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.property_id && (
                <p className="text-red-600 text-sm">{errors.property_id}</p>
              )}
            </div>

            {/* Tenant Selection */}
            <div className="space-y-2">
              <Label htmlFor="tenant_id" className="text-gray-700 font-medium">
                Tenant *
              </Label>
              <Select
                value={formData.tenant_id}
                onValueChange={value => handleInputChange('tenant_id', value)}>
                <SelectTrigger
                  className={cn(
                    'bg-white/50 border-blue-200/50 focus:border-blue-400',
                    errors.tenant_id && 'border-red-300 focus:border-red-400'
                  )}>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          {tenant.user.first_name} {tenant.user.last_name}
                        </span>
                        {tenant.unit_number && (
                          <span className="text-gray-500">
                            (Unit {tenant.unit_number})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenant_id && (
                <p className="text-red-600 text-sm">{errors.tenant_id}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-700 font-medium">
                Amount *
              </Label>
              <div className="relative">
                <PhilippinePeso className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={e =>
                    handleInputChange('amount', parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={cn(
                    'pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400',
                    errors.amount && 'border-red-300 focus:border-red-400'
                  )}
                />
              </div>
              {errors.amount && (
                <p className="text-red-600 text-sm">{errors.amount}</p>
              )}
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label
                htmlFor="payment_type"
                className="text-gray-700 font-medium">
                Payment Type *
              </Label>
              <Select
                value={formData.payment_type}
                onValueChange={value =>
                  handleInputChange('payment_type', value)
                }>
                <SelectTrigger
                  className={cn(
                    'bg-white/50 border-blue-200/50 focus:border-blue-400',
                    errors.payment_type && 'border-red-300 focus:border-red-400'
                  )}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="security_deposit">
                    Security Deposit
                  </SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="penalty">Penalty</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment_type && (
                <p className="text-red-600 text-sm">{errors.payment_type}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Method */}
            <div className="space-y-2">
              <Label
                htmlFor="payment_method"
                className="text-gray-700 font-medium">
                Payment Method *
              </Label>
              <Select
                value={formData.payment_method}
                onValueChange={value =>
                  handleInputChange('payment_method', value)
                }>
                <SelectTrigger
                  className={cn(
                    'bg-white/50 border-blue-200/50 focus:border-blue-400',
                    errors.payment_method &&
                      'border-red-300 focus:border-red-400'
                  )}>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="maya">Maya</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment_method && (
                <p className="text-red-600 text-sm">{errors.payment_method}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-gray-700 font-medium">
                Due Date *
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={e => handleInputChange('due_date', e.target.value)}
                  className={cn(
                    'pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400',
                    errors.due_date && 'border-red-300 focus:border-red-400'
                  )}
                />
              </div>
              {errors.due_date && (
                <p className="text-red-600 text-sm">{errors.due_date}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Late Fee */}
            <div className="space-y-2">
              <Label htmlFor="late_fee" className="text-gray-700 font-medium">
                Late Fee
              </Label>
              <div className="relative">
                <PhilippinePeso className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="late_fee"
                  type="number"
                  value={formData.late_fee}
                  onChange={e =>
                    handleInputChange(
                      'late_fee',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={cn(
                    'pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400',
                    errors.late_fee && 'border-red-300 focus:border-red-400'
                  )}
                />
              </div>
              {errors.late_fee && (
                <p className="text-red-600 text-sm">{errors.late_fee}</p>
              )}
            </div>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label
                htmlFor="reference_number"
                className="text-gray-700 font-medium">
                Reference Number
              </Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={e =>
                  handleInputChange('reference_number', e.target.value)
                }
                placeholder="Optional reference number"
                className="bg-white/50 border-blue-200/50 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-700 font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="bg-white/50 border-blue-200/50 focus:border-blue-400"
            />
          </div>

          {/* Xendit Payment Link Option */}
          {role === 'owner' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                <input
                  type="checkbox"
                  id="sendXenditLink"
                  checked={formData.sendXenditLink || false}
                  onChange={e =>
                    handleInputChange('sendXenditLink', e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                />
                <Label
                  htmlFor="sendXenditLink"
                  className="text-gray-700 font-medium cursor-pointer">
                  Send Xendit Payment Link
                </Label>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Generate a secure payment link that tenants can use to pay
                online via GCash, Maya, or bank transfer.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {initialData ? 'Update Payment' : 'Create Payment'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
