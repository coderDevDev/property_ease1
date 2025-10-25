# 🚀 Payment Features Implementation Plan
## Step-by-Step Per Role - Non-Breaking Changes

> **Date**: October 25, 2025  
> **Objective**: Implement missing payment features incrementally without breaking existing functionality  
> **Approach**: Role-by-role, feature-by-feature with backward compatibility

---

## 🎯 **Implementation Strategy**

### **Core Principles**:
1. ✅ **Non-Breaking** - All existing features continue to work
2. ✅ **Incremental** - Add features one at a time
3. ✅ **Role-Based** - Implement per role (Renter → Owner → Admin)
4. ✅ **Tested** - Test each feature before moving to next
5. ✅ **Documented** - Track all changes in this file

---

## 📋 **PHASE 1: SECURITY DEPOSITS**
**Timeline**: Week 1-2  
**Priority**: HIGH  
**Status**: 🟡 Planning

---

### **STEP 1.1: Database Schema (Non-Breaking)**
**Duration**: 1 hour  
**Status**: ⏳ Pending

#### **Migration File**: `012_security_deposits.sql`

```sql
-- Add new columns to existing payments table (non-breaking)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'rent',
ADD COLUMN IF NOT EXISTS is_deposit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deposit_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS linked_payment_id UUID REFERENCES payments(id);

-- Create new tables for deposit tracking
CREATE TABLE IF NOT EXISTS deposit_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  property_id UUID REFERENCES properties(id),
  deposit_amount DECIMAL(10,2) NOT NULL,
  deductions DECIMAL(10,2) DEFAULT 0,
  refundable_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'held', -- held, partially_refunded, fully_refunded, forfeited
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS move_out_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  property_id UUID REFERENCES properties(id),
  inspector_id UUID REFERENCES users(id),
  inspection_date TIMESTAMP,
  checklist JSONB,
  photos TEXT[],
  notes TEXT,
  total_deductions DECIMAL(10,2) DEFAULT 0,
  refundable_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, disputed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deposit_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES move_out_inspections(id),
  item_description TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  proof_photos TEXT[],
  notes TEXT,
  disputed BOOLEAN DEFAULT FALSE,
  dispute_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE deposit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE move_out_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_deductions ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own deposits
CREATE POLICY "Tenants can view own deposits"
  ON deposit_balances FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = auth.uid()
  ));

-- Owners can view deposits for their properties
CREATE POLICY "Owners can view property deposits"
  ON deposit_balances FOR SELECT
  USING (property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  ));

-- Owners can manage deposits
CREATE POLICY "Owners can manage deposits"
  ON deposit_balances FOR ALL
  USING (property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  ));

-- Similar policies for inspections and deductions
CREATE POLICY "Tenants view own inspections"
  ON move_out_inspections FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owners manage inspections"
  ON move_out_inspections FOR ALL
  USING (property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  ));

CREATE POLICY "View deductions"
  ON deposit_deductions FOR SELECT
  USING (inspection_id IN (
    SELECT id FROM move_out_inspections 
    WHERE tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid())
    OR property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())
  ));

CREATE POLICY "Owners manage deductions"
  ON deposit_deductions FOR ALL
  USING (inspection_id IN (
    SELECT id FROM move_out_inspections 
    WHERE property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())
  ));
```

**Testing**:
- [ ] Run migration in Supabase
- [ ] Verify existing payments table unchanged
- [ ] Verify new tables created
- [ ] Test RLS policies

---

### **STEP 1.2: API Methods (Backward Compatible)**
**Duration**: 2 hours  
**Status**: ⏳ Pending

#### **File**: `lib/api/deposits.ts` (NEW FILE)

```typescript
import { supabase } from '@/lib/supabase/client';

export interface DepositBalance {
  id: string;
  tenant_id: string;
  property_id: string;
  deposit_amount: number;
  deductions: number;
  refundable_amount: number;
  status: 'held' | 'partially_refunded' | 'fully_refunded' | 'forfeited';
  created_at: string;
  updated_at: string;
}

export interface MoveOutInspection {
  id: string;
  tenant_id: string;
  property_id: string;
  inspector_id: string;
  inspection_date: string;
  checklist: any;
  photos: string[];
  notes: string;
  total_deductions: number;
  refundable_amount: number;
  status: 'pending' | 'completed' | 'disputed';
  created_at: string;
  updated_at: string;
}

export interface DepositDeduction {
  id: string;
  inspection_id: string;
  item_description: string;
  cost: number;
  proof_photos: string[];
  notes: string;
  disputed: boolean;
  dispute_reason: string;
  created_at: string;
}

export class DepositsAPI {
  // TENANT METHODS
  
  /**
   * Get tenant's deposit balance
   */
  static async getTenantDeposit(tenantId: string): Promise<DepositBalance | null> {
    const { data, error } = await supabase
      .from('deposit_balances')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    
    if (error) {
      console.error('Error fetching deposit:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Get tenant's move-out inspection
   */
  static async getTenantInspection(tenantId: string): Promise<MoveOutInspection | null> {
    const { data, error } = await supabase
      .from('move_out_inspections')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching inspection:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Get deductions for an inspection
   */
  static async getInspectionDeductions(inspectionId: string): Promise<DepositDeduction[]> {
    const { data, error } = await supabase
      .from('deposit_deductions')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching deductions:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Dispute a deduction
   */
  static async disputeDeduction(
    deductionId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('deposit_deductions')
      .update({
        disputed: true,
        dispute_reason: reason
      })
      .eq('id', deductionId);
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true, message: 'Deduction disputed successfully' };
  }

  // OWNER METHODS
  
  /**
   * Create deposit balance when lease starts
   */
  static async createDepositBalance(
    tenantId: string,
    propertyId: string,
    depositAmount: number
  ): Promise<{ success: boolean; data?: DepositBalance; message: string }> {
    const { data, error } = await supabase
      .from('deposit_balances')
      .insert({
        tenant_id: tenantId,
        property_id: propertyId,
        deposit_amount: depositAmount,
        refundable_amount: depositAmount,
        status: 'held'
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true, data, message: 'Deposit balance created' };
  }

  /**
   * Create move-out inspection
   */
  static async createInspection(
    tenantId: string,
    propertyId: string,
    inspectorId: string,
    checklist: any,
    photos: string[],
    notes: string
  ): Promise<{ success: boolean; data?: MoveOutInspection; message: string }> {
    const { data, error } = await supabase
      .from('move_out_inspections')
      .insert({
        tenant_id: tenantId,
        property_id: propertyId,
        inspector_id: inspectorId,
        inspection_date: new Date().toISOString(),
        checklist,
        photos,
        notes,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true, data, message: 'Inspection created' };
  }

  /**
   * Add deduction to inspection
   */
  static async addDeduction(
    inspectionId: string,
    itemDescription: string,
    cost: number,
    proofPhotos: string[],
    notes: string
  ): Promise<{ success: boolean; data?: DepositDeduction; message: string }> {
    const { data, error } = await supabase
      .from('deposit_deductions')
      .insert({
        inspection_id: inspectionId,
        item_description: itemDescription,
        cost,
        proof_photos: proofPhotos,
        notes
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    // Update inspection total
    await this.updateInspectionTotal(inspectionId);
    
    return { success: true, data, message: 'Deduction added' };
  }

  /**
   * Update inspection total deductions
   */
  static async updateInspectionTotal(inspectionId: string): Promise<void> {
    // Get all deductions
    const deductions = await this.getInspectionDeductions(inspectionId);
    const total = deductions.reduce((sum, d) => sum + d.cost, 0);
    
    // Get inspection
    const { data: inspection } = await supabase
      .from('move_out_inspections')
      .select('*, deposit_balances(*)')
      .eq('id', inspectionId)
      .single();
    
    if (!inspection) return;
    
    // Calculate refundable amount
    const depositAmount = inspection.deposit_balances?.deposit_amount || 0;
    const refundable = Math.max(0, depositAmount - total);
    
    // Update inspection
    await supabase
      .from('move_out_inspections')
      .update({
        total_deductions: total,
        refundable_amount: refundable
      })
      .eq('id', inspectionId);
  }

  /**
   * Complete inspection and update deposit balance
   */
  static async completeInspection(
    inspectionId: string
  ): Promise<{ success: boolean; message: string }> {
    // Get inspection
    const { data: inspection } = await supabase
      .from('move_out_inspections')
      .select('*')
      .eq('id', inspectionId)
      .single();
    
    if (!inspection) {
      return { success: false, message: 'Inspection not found' };
    }
    
    // Update inspection status
    await supabase
      .from('move_out_inspections')
      .update({ status: 'completed' })
      .eq('id', inspectionId);
    
    // Update deposit balance
    const { error } = await supabase
      .from('deposit_balances')
      .update({
        deductions: inspection.total_deductions,
        refundable_amount: inspection.refundable_amount,
        status: inspection.refundable_amount === 0 ? 'forfeited' : 'held'
      })
      .eq('tenant_id', inspection.tenant_id)
      .eq('property_id', inspection.property_id);
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true, message: 'Inspection completed' };
  }

  /**
   * Process deposit refund
   */
  static async processDepositRefund(
    tenantId: string,
    propertyId: string
  ): Promise<{ success: boolean; message: string }> {
    // Get deposit balance
    const { data: deposit } = await supabase
      .from('deposit_balances')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .single();
    
    if (!deposit) {
      return { success: false, message: 'Deposit not found' };
    }
    
    if (deposit.refundable_amount <= 0) {
      return { success: false, message: 'No refundable amount' };
    }
    
    // Create refund payment record
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*, properties(*)')
      .eq('id', tenantId)
      .single();
    
    if (!tenant) {
      return { success: false, message: 'Tenant not found' };
    }
    
    // Create payment refund
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenantId,
        property_id: propertyId,
        owner_id: tenant.properties.owner_id,
        amount: deposit.refundable_amount,
        payment_type: 'deposit_refund',
        payment_status: 'pending',
        due_date: new Date().toISOString(),
        description: 'Security deposit refund'
      });
    
    if (paymentError) {
      return { success: false, message: paymentError.message };
    }
    
    // Update deposit status
    await supabase
      .from('deposit_balances')
      .update({
        status: 'fully_refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', deposit.id);
    
    return { success: true, message: 'Deposit refund processed' };
  }
}
```

**Testing**:
- [ ] Test tenant methods (read-only)
- [ ] Test owner methods (CRUD)
- [ ] Verify RLS policies work
- [ ] Test error handling

---

### **STEP 1.3: Renter UI - View Deposit**
**Duration**: 2 hours  
**Status**: ⏳ Pending

#### **File**: `app/tenant/dashboard/payments/page.tsx` (MODIFY - Add Deposit Section)

```typescript
// Add to existing tenant payments page (non-breaking)

import { DepositsAPI } from '@/lib/api/deposits';

// Add state for deposit
const [depositBalance, setDepositBalance] = useState<any>(null);
const [inspection, setInspection] = useState<any>(null);
const [deductions, setDeductions] = useState<any[]>([]);

// Fetch deposit data
useEffect(() => {
  async function fetchDeposit() {
    if (!currentTenant) return;
    
    const deposit = await DepositsAPI.getTenantDeposit(currentTenant.id);
    setDepositBalance(deposit);
    
    if (deposit) {
      const insp = await DepositsAPI.getTenantInspection(currentTenant.id);
      setInspection(insp);
      
      if (insp) {
        const deds = await DepositsAPI.getInspectionDeductions(insp.id);
        setDeductions(deds);
      }
    }
  }
  
  fetchDeposit();
}, [currentTenant]);

// Add deposit section to UI (after existing payment sections)
```

#### **New Component**: `components/tenant/DepositBalanceCard.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertCircle } from 'lucide-react';

interface DepositBalanceCardProps {
  deposit: any;
  inspection: any;
  deductions: any[];
}

export function DepositBalanceCard({ deposit, inspection, deductions }: DepositBalanceCardProps) {
  if (!deposit) return null;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'held': return 'bg-blue-500';
      case 'fully_refunded': return 'bg-green-500';
      case 'partially_refunded': return 'bg-yellow-500';
      case 'forfeited': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Deposit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge className={getStatusColor(deposit.status)}>
            {deposit.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Original Deposit</span>
            <span className="font-semibold">₱{deposit.deposit_amount.toLocaleString()}</span>
          </div>
          
          {deposit.deductions > 0 && (
            <div className="flex justify-between text-red-600">
              <span className="text-sm">Deductions</span>
              <span className="font-semibold">-₱{deposit.deductions.toLocaleString()}</span>
            </div>
          )}
          
          <div className="flex justify-between pt-2 border-t">
            <span className="font-medium">Refundable Amount</span>
            <span className="font-bold text-lg">₱{deposit.refundable_amount.toLocaleString()}</span>
          </div>
        </div>
        
        {inspection && inspection.status === 'completed' && deductions.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-yellow-800">Deductions Applied</p>
                <ul className="mt-2 space-y-1">
                  {deductions.map((ded) => (
                    <li key={ded.id} className="text-sm text-yellow-700">
                      • {ded.item_description}: ₱{ded.cost.toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Testing**:
- [ ] Verify deposit card displays correctly
- [ ] Test with no deposit (should not show)
- [ ] Test with deposit and no deductions
- [ ] Test with deposit and deductions
- [ ] Verify existing payment features still work

---

### **STEP 1.4: Owner UI - Manage Deposits**
**Duration**: 3 hours  
**Status**: ⏳ Pending

#### **New Page**: `app/owner/dashboard/deposits/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { DepositsAPI } from '@/lib/api/deposits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { MoveOutInspectionDialog } from '@/components/owner/MoveOutInspectionDialog';

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  
  // Fetch deposits
  useEffect(() => {
    fetchDeposits();
  }, []);
  
  async function fetchDeposits() {
    // Implementation
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Deposits</h1>
      </div>
      
      {/* Deposits list */}
      <div className="grid gap-4">
        {deposits.map((deposit) => (
          <Card key={deposit.id} className="p-6">
            {/* Deposit details */}
          </Card>
        ))}
      </div>
      
      {/* Move-out inspection dialog */}
      {showInspectionDialog && (
        <MoveOutInspectionDialog
          tenant={selectedTenant}
          onClose={() => setShowInspectionDialog(false)}
          onComplete={() => {
            setShowInspectionDialog(false);
            fetchDeposits();
          }}
        />
      )}
    </div>
  );
}
```

#### **New Component**: `components/owner/MoveOutInspectionDialog.tsx`

```typescript
// Full move-out inspection form with:
// - Inspection checklist
// - Photo upload
// - Deduction items
// - Calculate refundable amount
// - Process refund button
```

**Testing**:
- [ ] Test creating inspection
- [ ] Test adding deductions
- [ ] Test photo uploads
- [ ] Test refund processing
- [ ] Verify calculations correct

---

## 📊 **PROGRESS TRACKING**

### **Phase 1: Security Deposits**
- [ ] Step 1.1: Database Schema
- [ ] Step 1.2: API Methods
- [ ] Step 1.3: Renter UI
- [ ] Step 1.4: Owner UI
- [ ] Step 1.5: Testing & QA
- [ ] Step 1.6: Documentation

**Estimated Completion**: Week 2

---

## 📝 **CHANGE LOG**

### **October 25, 2025**
- ✅ Created implementation plan
- ⏳ Starting Phase 1: Security Deposits

---

## 🧪 **TESTING CHECKLIST**

### **Before Each Step**:
- [ ] Backup database
- [ ] Test existing features
- [ ] Document current state

### **After Each Step**:
- [ ] Run migration
- [ ] Test new feature
- [ ] Test existing features (regression)
- [ ] Update documentation

---

## 🚨 **ROLLBACK PLAN**

If anything breaks:
1. Revert database migration
2. Remove new API methods
3. Remove new UI components
4. Test existing features
5. Document issue

---

**Next Steps**: 
1. Review this plan
2. Approve to proceed
3. Start with Step 1.1 (Database Schema)

**Ready to begin implementation?**
