# Lease Renewal & Advance Payment Implementation

**Date**: October 26, 2025  
**Status**: 🚧 In Progress  
**Priority**: High

---

## ✅ Completed

### 1. Lease Renewal API
- ✅ Created `lib/api/lease-renewals.ts`
- ✅ Created migration `021_lease_renewals.sql`
- ✅ Functions:
  - `getTenantRenewals()` - Tenant views their requests
  - `getOwnerRenewals()` - Owner views all requests
  - `createRenewal()` - Tenant creates request
  - `approveRenewal()` - Owner approves (updates tenant lease dates)
  - `rejectRenewal()` - Owner rejects
  - `cancelRenewal()` - Tenant cancels pending request
  - Stats functions for both sides

---

## 📋 TODO: UI Components

### Lease Renewal UI Components Needed:

#### 1. Tenant Side (`/tenant/dashboard/lease`)
```
Files to create:
- app/tenant/dashboard/lease/page.tsx (Main page)
- components/tenant/RequestRenewalDialog.tsx (Create request)
- components/tenant/RenewalRequestCard.tsx (Display request)
```

**Features**:
- View current lease details
- See lease expiration countdown
- Create renewal request button
- View pending/approved/rejected requests
- Cancel pending requests

#### 2. Owner Side (`/owner/dashboard/renewals`)
```
Files to create:
- app/owner/dashboard/renewals/page.tsx (Main page)
- components/owner/ReviewRenewalDialog.tsx (Approve/Reject)
- components/owner/RenewalDetailsDialog.tsx (View details)
```

**Features**:
- View all renewal requests
- Filter by status (pending/approved/rejected)
- Approve with notes
- Reject with reason
- View tenant history

---

### Advance Payment UI Components Needed:

#### 1. Tenant Side (Add to `/tenant/dashboard/payments`)
```
Files to create:
- components/tenant/CreateAdvancePaymentDialog.tsx
```

**Features**:
- Calculate months covered
- Show breakdown
- Create advance payment
- Link to payment

**Note**: Advance payment API already exists in `lib/api/advance-payments.ts`

---

## 🎨 Design System Match

All components will use:
- ✅ Gradient backgrounds (`bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100`)
- ✅ Gradient headers (`bg-gradient-to-r from-white to-blue-50/50`)
- ✅ Icon-based stats cards with gradients
- ✅ Hover effects (`hover:shadow-xl transition-all duration-200`)
- ✅ Responsive design (sm/md/lg breakpoints)
- ✅ Consistent with applications page style

---

## 📊 Database Schema

### lease_renewals Table:
```sql
CREATE TABLE lease_renewals (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  property_id UUID REFERENCES properties(id),
  current_lease_end DATE,
  current_rent DECIMAL(10,2),
  proposed_lease_start DATE,
  proposed_lease_end DATE,
  proposed_rent DECIMAL(10,2),
  duration_months INTEGER,
  tenant_notes TEXT,
  owner_notes TEXT,
  status VARCHAR(20), -- pending, approved, rejected, cancelled
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔄 Workflow

### Lease Renewal Flow:

```
1. Tenant views /tenant/dashboard/lease
   ↓
2. Sees: "Lease expires in 45 days"
   ↓
3. Clicks "Request Renewal"
   ↓
4. Dialog opens:
   - Current lease end: Dec 31, 2025
   - Proposed start: Jan 1, 2026
   - Proposed end: Dec 31, 2026 (12 months)
   - Current rent: ₱5,000
   - Proposed rent: ₱5,000 (or negotiate)
   - Notes: (optional)
   ↓
5. Submits request
   ↓
6. Status: PENDING
   ↓
7. Owner sees in /owner/dashboard/renewals
   ↓
8. Owner reviews:
   - Tenant history
   - Payment record
   - Current lease details
   ↓
9. Owner decides:
   - APPROVE → Tenant lease dates updated automatically
   - REJECT → Tenant notified with reason
   ↓
10. Tenant sees result in /tenant/dashboard/lease
```

---

### Advance Payment Flow:

```
1. Tenant views /tenant/dashboard/payments
   ↓
2. Clicks "Create Advance Payment" (new button)
   ↓
3. Dialog opens:
   - Select property
   - Monthly rent: ₱5,000
   - Months to pay: 3
   - Total: ₱15,000
   - Start month: January 2026
   - End month: March 2026
   ↓
4. Submits
   ↓
5. Advance payment record created
   ↓
6. Payment record created (₱15,000)
   ↓
7. Tenant pays via Xendit
   ↓
8. System tracks allocation:
   - Jan rent: ₱5,000 (allocated)
   - Feb rent: ₱5,000 (allocated)
   - Mar rent: ₱5,000 (allocated)
   - Remaining: ₱0
```

---

## 🚀 Implementation Steps

### Step 1: Database Setup
```sql
-- Run in Supabase SQL Editor:
-- Migration 021: Lease Renewals
```

### Step 2: Create Tenant Lease Page
- Create main page with lease info
- Add renewal request dialog
- Display pending/approved requests
- Add cancel functionality

### Step 3: Create Owner Renewals Page
- Create main page with all requests
- Add review dialog (approve/reject)
- Add filters and search
- Show tenant details

### Step 4: Add Advance Payment UI
- Add button to payments page
- Create dialog component
- Integrate with existing API
- Test payment flow

### Step 5: Testing
- Test complete renewal flow
- Test advance payment creation
- Verify all auto-updates work
- Check responsive design

---

## 📝 Next Actions

1. ✅ Create lease renewal API (DONE)
2. ✅ Create database migration (DONE)
3. ⏳ Create tenant lease page
4. ⏳ Create owner renewals page
5. ⏳ Add advance payment UI
6. ⏳ Test everything

---

**Status**: API Ready, UI Pending  
**Estimated Time**: 2-3 hours for all UI  
**Complexity**: Medium  
**Breaking Changes**: None - All new features
