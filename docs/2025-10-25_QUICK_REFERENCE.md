# 📋 Security Deposits - Quick Reference Card

## 🗂️ **FILE STRUCTURE**

```
client/
├── supabase/migrations/
│   └── 012_security_deposits.sql          # Database schema
│
├── lib/api/
│   └── deposits.ts                        # API methods (14 methods)
│
├── components/
│   ├── tenant/
│   │   ├── DepositBalanceCard.tsx         # View deposit
│   │   └── DisputeDeductionDialog.tsx     # Dispute form
│   │
│   └── owner/
│       ├── MoveOutInspectionDialog.tsx    # Create inspection
│       └── ViewInspectionDialog.tsx       # View inspection
│
├── app/
│   ├── tenant/dashboard/payments/
│   │   └── page.tsx                       # Modified: Added deposit card
│   │
│   └── owner/dashboard/deposits/
│       └── page.tsx                       # New: Deposits management
│
└── docs/
    ├── 2025-10-25_PAYMENT_IMPLEMENTATION_PLAN.md
    ├── 2025-10-25_CHANGES_LOG.md
    ├── 2025-10-25_SECURITY_DEPOSITS_COMPLETE.md
    ├── 2025-10-25_SETUP_GUIDE.md
    └── 2025-10-25_QUICK_REFERENCE.md      # This file
```

---

## 🗄️ **DATABASE TABLES**

### **deposit_balances**
```sql
id                  UUID PRIMARY KEY
tenant_id           UUID → tenants(id)
property_id         UUID → properties(id)
deposit_amount      DECIMAL(10,2)
deductions          DECIMAL(10,2)
refundable_amount   DECIMAL(10,2)
status              VARCHAR(20)  -- held, fully_refunded, partially_refunded, forfeited
payment_id          UUID → payments(id)
notes               TEXT
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### **move_out_inspections**
```sql
id                  UUID PRIMARY KEY
tenant_id           UUID → tenants(id)
property_id         UUID → properties(id)
inspector_id        UUID → users(id)
inspection_date     TIMESTAMP
checklist           JSONB
photos              TEXT[]
notes               TEXT
total_deductions    DECIMAL(10,2)
refundable_amount   DECIMAL(10,2)
status              VARCHAR(20)  -- pending, in_progress, completed, disputed
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### **deposit_deductions**
```sql
id                  UUID PRIMARY KEY
inspection_id       UUID → move_out_inspections(id)
item_description    TEXT
cost                DECIMAL(10,2)
proof_photos        TEXT[]
notes               TEXT
category            VARCHAR(50)
disputed            BOOLEAN
dispute_reason      TEXT
dispute_date        TIMESTAMP
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

---

## 🔌 **API METHODS**

### **Tenant Methods**
```typescript
// Get deposit balance
DepositsAPI.getTenantDeposit(tenantId: string)
  → Promise<DepositBalance | null>

// Get inspection
DepositsAPI.getTenantInspection(tenantId: string)
  → Promise<MoveOutInspection | null>

// Get deductions
DepositsAPI.getInspectionDeductions(inspectionId: string)
  → Promise<DepositDeduction[]>

// Dispute deduction
DepositsAPI.disputeDeduction(deductionId: string, reason: string)
  → Promise<ApiResponse>
```

### **Owner Methods**
```typescript
// Create deposit
DepositsAPI.createDepositBalance(
  tenantId: string,
  propertyId: string,
  depositAmount: number,
  paymentId?: string
) → Promise<ApiResponse<DepositBalance>>

// Get all deposits
DepositsAPI.getOwnerDeposits(ownerId: string)
  → Promise<any[]>

// Create inspection
DepositsAPI.createInspection({
  tenantId: string,
  propertyId: string,
  inspectorId: string,
  checklist: InspectionChecklist,
  photos?: string[],
  notes?: string
}) → Promise<ApiResponse<MoveOutInspection>>

// Update inspection status
DepositsAPI.updateInspectionStatus(
  inspectionId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'disputed'
) → Promise<ApiResponse>

// Add deduction
DepositsAPI.addDeduction({
  inspectionId: string,
  itemDescription: string,
  cost: number,
  proofPhotos?: string[],
  notes?: string,
  category?: string
}) → Promise<ApiResponse<DepositDeduction>>

// Update deduction
DepositsAPI.updateDeduction(
  deductionId: string,
  updates: Partial<DepositDeduction>
) → Promise<ApiResponse>

// Delete deduction
DepositsAPI.deleteDeduction(deductionId: string)
  → Promise<ApiResponse>

// Complete inspection
DepositsAPI.completeInspection(inspectionId: string)
  → Promise<ApiResponse>

// Process refund
DepositsAPI.processDepositRefund(
  tenantId: string,
  propertyId: string
) → Promise<ApiResponse>

// Get full inspection details
DepositsAPI.getInspectionWithDeductions(inspectionId: string)
  → Promise<{ inspection, deductions }>
```

---

## 🎨 **COMPONENTS**

### **DepositBalanceCard**
```tsx
import { DepositBalanceCard } from '@/components/tenant/DepositBalanceCard';

<DepositBalanceCard
  deposit={depositBalance}
  inspection={inspection}
  deductions={deductions}
  onRefresh={() => loadDepositData()}
/>
```

### **DisputeDeductionDialog**
```tsx
import { DisputeDeductionDialog } from '@/components/tenant/DisputeDeductionDialog';

<DisputeDeductionDialog
  deduction={selectedDeduction}
  onClose={() => setShowDialog(false)}
  onSuccess={() => handleSuccess()}
/>
```

### **MoveOutInspectionDialog**
```tsx
import { MoveOutInspectionDialog } from '@/components/owner/MoveOutInspectionDialog';

<MoveOutInspectionDialog
  tenant={selectedTenant}
  onClose={() => setShowDialog(false)}
  onComplete={() => handleComplete()}
/>
```

### **ViewInspectionDialog**
```tsx
import { ViewInspectionDialog } from '@/components/owner/ViewInspectionDialog';

<ViewInspectionDialog
  inspection={selectedInspection}
  onClose={() => setShowDialog(false)}
/>
```

---

## 🔐 **RLS POLICIES**

### **deposit_balances**
- Tenants can SELECT their own deposits
- Owners can SELECT deposits for their properties
- Owners can INSERT/UPDATE/DELETE for their properties
- Admins can SELECT all

### **move_out_inspections**
- Tenants can SELECT their own inspections
- Owners can SELECT/INSERT/UPDATE for their properties
- Admins can SELECT all

### **deposit_deductions**
- Tenants can SELECT their own deductions
- Tenants can UPDATE (dispute only)
- Owners can SELECT/INSERT/UPDATE/DELETE for their properties
- Admins can SELECT all

---

## 🔄 **WORKFLOWS**

### **Create Deposit (Owner)**
```typescript
// 1. Create deposit balance
const result = await DepositsAPI.createDepositBalance(
  tenantId,
  propertyId,
  10000
);

// 2. Verify created
if (result.success) {
  console.log('Deposit created:', result.data);
}
```

### **Conduct Inspection (Owner)**
```typescript
// 1. Create inspection
const inspection = await DepositsAPI.createInspection({
  tenantId,
  propertyId,
  inspectorId: ownerId,
  checklist: {
    walls: 'good',
    flooring: 'fair',
    appliances: 'good'
  },
  notes: 'Property in good condition'
});

// 2. Add deductions
await DepositsAPI.addDeduction({
  inspectionId: inspection.data.id,
  itemDescription: 'Broken window',
  cost: 2000,
  category: 'Damage'
});

// 3. Complete inspection
await DepositsAPI.completeInspection(inspection.data.id);
```

### **Process Refund (Owner)**
```typescript
// 1. Process refund
const result = await DepositsAPI.processDepositRefund(
  tenantId,
  propertyId
);

// 2. Check result
if (result.success) {
  toast.success(result.message);
}
```

### **Dispute Deduction (Tenant)**
```typescript
// 1. Dispute deduction
const result = await DepositsAPI.disputeDeduction(
  deductionId,
  'The window was already broken when I moved in'
);

// 2. Check result
if (result.success) {
  toast.success('Dispute submitted');
}
```

---

## 🗺️ **ROUTES**

### **Tenant Routes**
```
/tenant/dashboard/payments
  → View deposit card (if deposit exists)
```

### **Owner Routes**
```
/owner/dashboard/deposits
  → Manage all deposits
  → Create inspections
  → Process refunds
```

---

## 📊 **STATUS VALUES**

### **Deposit Status**
- `held` - Deposit is being held
- `fully_refunded` - Full deposit refunded
- `partially_refunded` - Partial refund processed
- `forfeited` - Deposit forfeited (no refund)

### **Inspection Status**
- `pending` - Inspection created, not started
- `in_progress` - Inspection in progress
- `completed` - Inspection completed
- `disputed` - Tenant disputed deductions

### **Condition Values**
- `good` - Good condition
- `fair` - Fair condition
- `poor` - Poor condition
- `damaged` - Damaged, needs repair

---

## 🎯 **COMMON QUERIES**

### **Get Tenant's Deposit**
```sql
SELECT * FROM deposit_balances
WHERE tenant_id = 'TENANT_ID';
```

### **Get All Deposits for Owner**
```sql
SELECT db.*, t.*, p.*
FROM deposit_balances db
JOIN tenants t ON t.id = db.tenant_id
JOIN properties p ON p.id = db.property_id
WHERE p.owner_id = 'OWNER_ID';
```

### **Get Inspection with Deductions**
```sql
SELECT 
  i.*,
  json_agg(d.*) as deductions
FROM move_out_inspections i
LEFT JOIN deposit_deductions d ON d.inspection_id = i.id
WHERE i.id = 'INSPECTION_ID'
GROUP BY i.id;
```

### **Get Disputed Deductions**
```sql
SELECT * FROM deposit_deductions
WHERE disputed = true;
```

---

## 🐛 **DEBUGGING**

### **Enable Logging**
```typescript
// In deposits.ts, add console.logs
console.log('Creating deposit:', { tenantId, propertyId, amount });
```

### **Check RLS**
```sql
-- Test as specific user
SET ROLE authenticated;
SET request.jwt.claims.sub = 'USER_ID';
SELECT * FROM deposit_balances;
```

### **Verify Triggers**
```sql
-- Check trigger fired
SELECT * FROM deposit_balances
WHERE updated_at > NOW() - INTERVAL '1 minute';
```

---

## 🚀 **PERFORMANCE TIPS**

1. **Use Indexes**: Already created on foreign keys
2. **Batch Queries**: Use `select('*')` to get related data
3. **Cache Results**: Store in state, refresh on change
4. **Lazy Load**: Only load when needed
5. **Optimize Images**: Compress before upload

---

## 📝 **QUICK COMMANDS**

```bash
# Restart dev server
npm run dev

# Check TypeScript errors
npx tsc --noEmit

# Format code
npx prettier --write .

# Run linter
npm run lint
```

---

## 🔗 **USEFUL LINKS**

- **Supabase Dashboard**: Check your project URL
- **API Docs**: `lib/api/deposits.ts`
- **Components**: `components/tenant/` & `components/owner/`
- **Full Docs**: `docs/2025-10-25_SECURITY_DEPOSITS_COMPLETE.md`

---

## 💡 **TIPS & TRICKS**

1. **Test with Real Data**: Create test deposits in Supabase
2. **Use Browser DevTools**: Check Network tab for API calls
3. **Check Console**: Look for errors and warnings
4. **Verify RLS**: Test with different user roles
5. **Read Docs**: All features documented thoroughly

---

**Need Help?** Check `2025-10-25_SETUP_GUIDE.md` for detailed testing instructions!

**Last Updated**: October 25, 2025
