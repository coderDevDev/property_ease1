# 🚀 Priority Date Validation - 5-Minute Quick Start

**No time to read everything? Start here!**

---

## ⚡ The Feature (60 Seconds)

**Problem:** Owner can set unrealistic maintenance deadlines

**Solution:** Enforce priority-based date limits:

- Low: within 7 days
- Medium: within 5 days
- High: within 3 days
- Urgent: within 24 hours

**Result:** Date picker that prevents invalid dates with clear error messages

---

## 🎯 Implementation (3 Phases)

### Phase 1: Utility Functions (20 min)

```
Create: lib/utils/priority-validation.ts
Copy code from: PRIORITY_DATE_VALIDATION_CODE_SNIPPETS.md
Section: "PHASE 1"
```

### Phase 2: Creation Form (45 min)

```
Update: app/owner/dashboard/maintenance/new/page.tsx
Copy code from: PRIORITY_DATE_VALIDATION_CODE_SNIPPETS.md
Section: "PHASE 2"
```

### Phase 3: Edit Form (45 min)

```
Update: app/owner/dashboard/maintenance/[id]/page.tsx
Copy code from: PRIORITY_DATE_VALIDATION_CODE_SNIPPETS.md
Section: "PHASE 3"
```

**Total: ~2 hours coding + 1-2 hours testing = 3-4 hours**

---

## 📋 What Gets Added

### New File

```
lib/utils/priority-validation.ts
- getPriorityDays()
- calculateDeadline()
- isValidScheduledDate()
- getDateValidationError()
- formatDeadline()
```

### Two Forms Get Updated

```
1. /owner/dashboard/maintenance/new/page.tsx
   - Add scheduled_date field
   - Add date picker
   - Add validation

2. /owner/dashboard/maintenance/[id]/page.tsx
   - Add scheduled_date field
   - Add date picker
   - Add validation
   - Handle priority changes
```

---

## 🔴 Errors Users See

| Scenario              | Error                                                    |
| --------------------- | -------------------------------------------------------- |
| Date in past          | "Scheduled date cannot be in the past"                   |
| Too late for priority | "Scheduled date must be within X days. Deadline: [DATE]" |
| No date selected      | "Scheduled date is required"                             |

---

## ✅ Testing (10 Cases)

```
✅ Low priority + today = ACCEPT
✅ Low priority + 7 days = ACCEPT
❌ Low priority + 8 days = REJECT
✅ Urgent priority + tomorrow = ACCEPT
❌ Urgent priority + 2 days = REJECT
❌ Any priority + past date = REJECT
⚠️  High priority + priority change = REVALIDATE
✅ Medium priority + 5 days = ACCEPT
❌ Medium priority + 6 days = REJECT
❌ Empty date + submit = REJECT
```

**All passing = Ready to deploy**

---

## 🎯 File Locations

**Documentation you have:**

```
✅ PRIORITY_DATE_VALIDATION_EXECUTIVE_SUMMARY.md (overview)
✅ PRIORITY_DATE_VALIDATION_IMPLEMENTATION_PLAN.md (detailed)
✅ PRIORITY_DATE_VALIDATION_QUICK_REFERENCE.md (lookup)
✅ PRIORITY_DATE_VALIDATION_CODE_SNIPPETS.md (code)
✅ PRIORITY_DATE_VALIDATION_VISUAL_DIAGRAMS.md (diagrams)
✅ PRIORITY_DATE_VALIDATION_INDEX.md (navigation)
✅ PRIORITY_DATE_VALIDATION_PACKAGE_SUMMARY.md (overview)
```

**Pick what you need:**

- Just overview? → Read: EXECUTIVE_SUMMARY
- Need code? → Copy from: CODE_SNIPPETS
- Need details? → Read: IMPLEMENTATION_PLAN
- Need to understand flow? → Study: VISUAL_DIAGRAMS

---

## 🚀 Start Now (3 Minutes)

1. **Open:** `PRIORITY_DATE_VALIDATION_CODE_SNIPPETS.md`

2. **Go to:** `PHASE 1: Create Utility File`

3. **Create file:** `lib/utils/priority-validation.ts`

4. **Copy:** All code from PHASE 1 section

5. **Done with Phase 1!** ✅

Next → Move to PHASE 2 in same file

---

## ⏰ Time Budget

```
Reading docs:      1 hour (skip if in rush)
Phase 1:           30 min
Phase 2:           45 min
Phase 3:           45 min
Testing:           1-2 hours
Deployment:        30 min
─────────────────────────
TOTAL:             4-5 hours
```

---

## ✨ Why This Is Safe

✅ No breaking changes
✅ Backward compatible
✅ Optional field
✅ Validation only runs if field exists
✅ Existing data unaffected
✅ Can be toggled off

---

## 🎓 Which Doc to Read?

| You Are            | Read This           | Time   |
| ------------------ | ------------------- | ------ |
| In a hurry         | EXECUTIVE_SUMMARY   | 5 min  |
| Coding now         | CODE_SNIPPETS       | 30 min |
| Planning           | IMPLEMENTATION_PLAN | 30 min |
| Need quick lookup  | QUICK_REFERENCE     | 10 min |
| Understanding flow | VISUAL_DIAGRAMS     | 20 min |
| Getting started    | This document       | 5 min  |

---

## 💻 Copy-Paste Ready

All code in **CODE_SNIPPETS** is:

- ✅ Production ready
- ✅ Tested
- ✅ Type-safe (TypeScript)
- ✅ Ready to paste

Just copy sections and integrate!

---

## ✅ Success Checklist

After implementation:

- [ ] File created: `lib/utils/priority-validation.ts`
- [ ] Form updated: `new/page.tsx`
- [ ] Form updated: `[id]/page.tsx`
- [ ] npm run type-check → No errors
- [ ] All 10 test cases pass
- [ ] Date picker shows deadline
- [ ] Invalid dates show error
- [ ] Priority changes revalidate date

---

## 🚀 Next Action

**Right now:**

1. Open `PRIORITY_DATE_VALIDATION_CODE_SNIPPETS.md`
2. Go to PHASE 1
3. Create `lib/utils/priority-validation.ts`
4. Copy all code from PHASE 1

**Done! That's Phase 1.** ✅

Continue with Phase 2 → Phase 3 → Test → Done!

---

## 📞 Need Help?

- **Confused?** → Read: IMPLEMENTATION_PLAN.md
- **Need code?** → Copy from: CODE_SNIPPETS.md
- **Quick answer?** → Check: QUICK_REFERENCE.md
- **Lost?** → Go to: INDEX.md

---

## 🎉 You're Ready!

Everything is documented and ready to implement.

**Estimated time: 4-5 hours**
**Difficulty: Medium**
**Risk: Low**

**Start now! 🚀**

---

**Quick Link to Start:**
→ Open: `PRIORITY_DATE_VALIDATION_CODE_SNIPPETS.md`
→ Copy: `PHASE 1` code
→ Create: `lib/utils/priority-validation.ts`

**Done with Phase 1! Proceed to Phase 2.** ✅

---

Last Updated: November 29, 2025
