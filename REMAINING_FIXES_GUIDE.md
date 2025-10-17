# Remaining Bug Fixes Guide

## ✅ Completed (3/8)
1. ✅ Owner self-notifications - FIXED
2. ✅ Profile button redirect - FIXED  
3. ✅ Payment order - Already correct

## 🔧 Remaining Fixes (5/8)

---

### **Issue #4: Remove Cash Payment Option**

**Files to Modify:**

1. **Search for payment method constants:**
```bash
# Search command
grep -r "cash" --include="*.tsx" --include="*.ts" client/
```

2. **Key Files:**
- `client/app/owner/dashboard/payments/new/page.tsx`
- `client/app/tenant/dashboard/payments/page.tsx`
- Any payment form components

3. **What to Remove:**
```tsx
// Remove this option from payment method selects:
<SelectItem value="cash">Cash</SelectItem>

// Update payment method types to exclude cash:
type PaymentMethod = 'gcash' | 'maya' | 'bank_transfer' | 'check'; // Remove 'cash'
```

4. **Testing:**
- Verify cash option doesn't appear in any payment dropdowns
- Test creating payments with remaining methods
- Check if any existing "cash" payments still display correctly in history

---

### **Issue #5: Three Dots Menu Not Working**

**Location:** `/owner/dashboard/tenants/[id]`

**Steps to Fix:**

1. **Open file:**
```
client/app/owner/dashboard/tenants/[id]/page.tsx
```

2. **Check for DropdownMenu component:**
```tsx
// Should look like this:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreVertical className="w-4 h-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>
      <Edit className="w-4 h-4 mr-2" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete}>
      <Trash2 className="w-4 h-4 mr-2" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

3. **Common Issues:**
- Missing `DropdownMenuContent`
- Missing click handlers
- Z-index issues
- Missing imports

4. **Required Imports:**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
```

---

### **Issue #6: Emergency Contact Name Column Error**

**Error:** `could not find emergency_contact_name column`

**Solution Options:**

**Option A: Fix Column Name in Form**
```tsx
// In client/app/owner/dashboard/tenants/new/page.tsx
// Change from:
emergency_contact_name: formData.emergencyContactName

// To (check actual database column name):
emergency_contact: formData.emergencyContactName
// OR
emergency_name: formData.emergencyContactName
```

**Option B: Check Database Schema**
```sql
-- Run in Supabase SQL Editor:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name LIKE '%emergency%';
```

**Option C: Update Database (if column doesn't exist)**
```sql
-- Add column if missing:
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
```

**Steps:**
1. Check database schema first
2. Match form field names to actual database columns
3. Update form submission code accordingly

---

### **Issue #7: Replace Dollar Signs with Peso Signs**

**Quick Find & Replace:**

**Step 1: Find all DollarSign imports**
```bash
grep -r "DollarSign" client/ --include="*.tsx"
```

**Step 2: Common Locations:**
- Payment pages
- Dashboard statistics
- Maintenance cost displays
- Property rent displays
- Financial summaries

**Step 3: Replacement Options:**

**Option A: Use Text Symbol**
```tsx
// Before:
<DollarSign className="w-5 h-5" />

// After:
<span className="text-lg font-bold">₱</span>
```

**Option B: Create Custom Icon Component**
```tsx
// Create: client/components/icons/PhilippinePesoIcon.tsx
export function PhilippinePesoIcon({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold inline-flex items-center justify-center", className)}>
      ₱
    </span>
  );
}

// Usage:
<PhilippinePesoIcon className="w-5 h-5" />
```

**Step 4: Update Currency Formatting**
```tsx
// Add utility function:
export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount);
}

// Usage:
<p>{formatPHP(5000)}</p>  // Output: ₱5,000.00
```

**Files to Update:**
- All payment-related components
- Dashboard cards showing money
- Maintenance cost fields
- Property rent displays
- Financial reports
- Analytics pages

---

### **Issue #8: Add Camera Option for Image Upload**

**Location:** `client/components/ui/image-upload.tsx`

**Implementation:**

```tsx
export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  disabled = false
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      {/* Upload Options */}
      <div className="grid grid-cols-2 gap-3">
        {/* Take Photo Button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || images.length >= maxImages}
          className="border-blue-200">
          <Camera className="w-4 h-4 mr-2" />
          Take Photo
        </Button>

        {/* Choose Files Button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || images.length >= maxImages}
          className="border-blue-200">
          <ImageIcon className="w-4 h-4 mr-2" />
          Choose Files
        </Button>
      </div>

      {/* Camera Input (with capture attribute) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"  // Opens camera directly
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* File Input (regular gallery picker) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Rest of component... */}
    </div>
  );
}
```

**Key Points:**
- `capture="environment"` - Uses back camera (for photos)
- `capture="user"` - Uses front camera (for selfies)  
- Without `capture` - Opens file picker
- `multiple` only on file input, not camera input

**Add Camera Icon Import:**
```tsx
import { Camera, ImageIcon, X, AlertCircle } from 'lucide-react';
```

---

## 🎯 Implementation Priority

1. **Issue #6** (Critical) - Blocks tenant creation
2. **Issue #7** (Important) - Localization requirement
3. **Issue #4** (Important) - Business requirement
4. **Issue #8** (Enhancement) - UX improvement
5. **Issue #5** (Minor) - UI issue

---

## 🧪 Testing Checklist

After implementing each fix:

- [ ] Test in development environment
- [ ] Check console for errors
- [ ] Test on mobile device (for camera feature)
- [ ] Verify no regressions in other features
- [ ] Test with different user roles (owner/tenant)
- [ ] Check database operations work correctly

---

## 📝 Notes

- Always backup before making changes
- Test each fix independently
- Commit changes incrementally
- Document any database schema changes
- Update type definitions as needed

---

**Created:** October 17, 2025  
**Status:** Ready for implementation  
**Estimated Time:** 2-3 hours for all fixes
