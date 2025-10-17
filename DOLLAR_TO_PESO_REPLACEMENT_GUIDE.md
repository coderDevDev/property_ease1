# Dollar Sign to Peso Sign Replacement Guide

## ✅ Quick Reference

### **Import Statement**
```tsx
// BEFORE:
import { DollarSign } from 'lucide-react';

// AFTER:
import { PhilippinePeso } from 'lucide-react';
```

### **Icon Usage**
```tsx
// BEFORE:
<DollarSign className="w-5 h-5 text-blue-600" />

// AFTER:
<PhilippinePeso className="w-5 h-5 text-blue-600" />
```

### **Text Display**
Always use ₱ symbol with proper formatting:
```tsx
₱{amount.toLocaleString()}
// Example: ₱5,000.00
```

---

## 📝 Files That Need Updates

### **High Priority - Payment Related**

1. **app/tenant/dashboard/payments/page.tsx**
   - Lines 19, 194, 469 - Replace DollarSign imports and usage

2. **app/tenant/dashboard/payments/[id]/page.tsx**
   - Lines 13, 111, 115, 236, 274 - Replace DollarSign

3. **app/owner/dashboard/payments/page.tsx**
   - Line 28 onwards - Replace all DollarSign usage

4. **app/owner/dashboard/payments/[id]/page.tsx**
   - Lines 13, 108, 112, 306 - Replace DollarSign

5. **components/payments/payment-card.tsx**
   - Lines 14, 92, 96, 170 - Replace DollarSign

6. **components/payments/payment-form.tsx**
   - Line 18 - Replace DollarSign (NOTE: This file may already be fixed)

### **Medium Priority - Maintenance & Analytics**

7. **app/tenant/dashboard/maintenance/page.tsx**
   - Lines 46, 701 - Replace DollarSign

8. **app/tenant/dashboard/maintenance/[id]/edit/page.tsx**
   - Lines 27, 498 - Replace DollarSign

9. **components/analytics/analytics-dashboard.tsx**
   - Lines 23, 208, 232, 238 - Replace DollarSign

### **Low Priority - Progress/Status Components**

10. **components/ui/progress-timeline.tsx**
    - Lines 13, 101, 237 - Keep using ₱ symbol (already correct), replace icon

11. **components/ui/status-manager.tsx**
    - Line 31 - Replace DollarSign import

---

## 🔄 Search & Replace Commands

### **For VS Code:**
1. Press `Ctrl+Shift+H` (Windows) or `Cmd+Shift+H` (Mac)
2. Search: `import.*DollarSign`
3. Check "Use Regular Expression"
4. Replace with imports that include PhilippinePeso

### **Manual Replacement Steps:**

**Step 1: Update Imports**
```tsx
// Find this pattern:
import { ..., DollarSign, ... } from 'lucide-react';

// Replace with:
import { ..., PhilippinePeso, ... } from 'lucide-react';
```

**Step 2: Update Icon Usage**
```tsx
// Find:
<DollarSign className="..." />

// Replace:
<PhilippinePeso className="..." />
```

**Step 3: Verify Symbol Display**
Make sure currency amounts show ₱ symbol:
```tsx
// Correct:
₱{amount.toLocaleString()}

// Also correct:
<PhilippinePeso className="w-4 h-4" />
<span>₱{amount.toLocaleString()}</span>
```

---

## ✅ Already Fixed Files

These files already use PhilippinePeso correctly:
- ✅ `components/payments/payment-form.tsx` (Line 229)
- ✅ `app/owner/dashboard/tenants/[id]/page.tsx` (Line 38, 709)

---

## 🧪 Testing Checklist

After making replacements, test these areas:

### **Payment Pages**
- [ ] Tenant payment list shows ₱ icons
- [ ] Tenant payment details shows ₱ icons
- [ ] Owner payment list shows ₱ icons  
- [ ] Owner payment details shows ₱ icons
- [ ] Payment creation form shows ₱ icon

### **Dashboard Stats**
- [ ] Owner dashboard revenue cards show ₱
- [ ] Tenant dashboard payment summary shows ₱
- [ ] Analytics page revenue shows ₱

### **Maintenance Pages**
- [ ] Maintenance cost fields show ₱
- [ ] Cost displays in maintenance lists show ₱

### **Property/Tenant Pages**
- [ ] Rent amounts show ₱
- [ ] Deposit amounts show ₱
- [ ] Financial summaries show ₱

---

## 💡 Best Practices

1. **Always use PhilippinePeso icon** for money-related icons
2. **Always use ₱ symbol** for currency amounts in text
3. **Use toLocaleString()** for proper number formatting
4. **Maintain consistency** across all pages

### **Formatting Examples:**
```tsx
// Good:
₱{amount.toLocaleString()}           // ₱5,000
₱{amount.toFixed(2)}                 // ₱5000.00
₱{amount.toLocaleString('en-PH')}    // ₱5,000.00

// Avoid:
${amount}                             // Wrong currency
PHP {amount}                          // Verbose
{amount} PHP                          // Wrong order
```

---

## 📊 Summary

**Total Files to Update:** ~11 files  
**Estimated Time:** 15-20 minutes  
**Complexity:** Low (mostly find & replace)

**Priority Order:**
1. Payment-related files (highest visibility)
2. Dashboard and analytics
3. Maintenance and property pages  
4. Utility components

---

## 🚀 Quick Batch Fix Script

If you want to do bulk replacements (use with caution):

```bash
# Search for all DollarSign imports
grep -r "DollarSign" client/ --include="*.tsx" --include="*.ts"

# After reviewing, you can use sed or manual replacement
# Example (test first!):
# find client/ -name "*.tsx" -exec sed -i 's/DollarSign/PhilippinePeso/g' {} \;
```

---

**Note:** Some files use DollarSign for payment method icons (cash payments). Since cash payments are removed, those can be deleted entirely instead of replaced.

**Last Updated:** October 17, 2025  
**Status:** Guide created, selective fixes applied
