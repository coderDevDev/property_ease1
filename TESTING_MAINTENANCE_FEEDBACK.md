# 🧪 Testing Guide: Maintenance Feedback Feature

## Prerequisites

### Step 1: Run Database Migration

Before testing, you need to add the new fields to your database:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration script: `scripts/migration-add-feedback-fields.sql`

Or run it via command line if you have Supabase CLI:

```bash
supabase db push
```

**Verify the migration:**

- Check that these columns exist in `maintenance_requests` table:
  - `assigned_personnel_phone` (TEXT)
  - `feedback_rating` (INTEGER, 1-5)
  - `feedback_comment` (TEXT)
  - `feedback_submitted_at` (TIMESTAMP)
  - `feedback_required` (BOOLEAN, default FALSE)

---

## 🧪 Testing Scenarios

### **Test 1: Owner Assigns Personnel with Contact Number**

**Steps:**

1. Login as **Owner**
2. Navigate to: `/owner/dashboard/maintenance`
3. Find a maintenance request with status "Pending"
4. Click on the request to view details
5. Click **"Assign Personnel"** button
6. Fill in:
   - **Personnel Name**: e.g., "Juan Dela Cruz"
   - **Contact Number**: e.g., "09123456789" ⭐ (NEW - Required field)
   - **Schedule Date**: (Optional)
7. Click **"Assign Personnel"**

**Expected Results:**

- ✅ Success toast: "Personnel assigned successfully!"
- ✅ Request status changes to "In Progress"
- ✅ Personnel name and contact number are saved

---

### **Test 2: Tenant Views Assigned Personnel Contact**

**Steps:**

1. Login as **Tenant**
2. Navigate to: `/tenant/dashboard/maintenance`
3. Find the maintenance request that was just assigned
4. Click to view details
5. Look for **"Assigned Personnel"** card in the right column

**Expected Results:**

- ✅ Personnel name is displayed
- ✅ Contact number is shown in a highlighted box ⭐ (NEW)
- ✅ **"Call"** button appears that opens phone dialer ⭐ (NEW)
- ✅ Clicking "Call" should open: `tel:09123456789`

---

### **Test 3: Owner Tries to Complete (Triggers Feedback Request)**

**Steps:**

1. Login as **Owner**
2. Navigate to the maintenance request (status: "In Progress")
3. Click **"Complete Request"** button

**Expected Results:**

- ✅ Success toast: "Feedback request sent to tenant. Please wait for feedback before completing."
- ✅ Request status stays "In Progress"
- ✅ `feedback_required` is set to `true`
- ✅ The "Complete Request" button becomes disabled until feedback is received

---

### **Test 4: Tenant Sees Feedback Request**

**Steps:**

1. Login as **Tenant**
2. Navigate to the maintenance request
3. Check the **"Feedback"** section (should appear when status is "completed" or feedback_required is true)

**Expected Results:**

- ✅ Yellow box appears with message: "Feedback is required for this maintenance request..."
- ✅ **"Provide Feedback"** button is visible
- ✅ Section only appears when:
  - Status is "completed", OR
  - `feedback_required` is true

---

### **Test 5: Tenant Submits Feedback**

**Steps:**

1. Click **"Provide Feedback"** button
2. Dialog opens with:
   - **Star Rating**: Click stars 1-5 (5 is highest) ⭐
   - **Comment**: Text area for feedback
3. Try submitting without rating → Should show error
4. Try submitting without comment → Should show error
5. Fill both:
   - Select **5 stars** (highest rating)
   - Enter comment: "Excellent service! Very professional."
6. Click **"Submit Feedback"**

**Expected Results:**

- ✅ Success toast: "Feedback submitted successfully!"
- ✅ Dialog closes
- ✅ Feedback section updates to show:
  - Green box with submitted rating (5 yellow stars)
  - Comment displayed
  - Submission timestamp
- ✅ `feedback_rating` = 5
- ✅ `feedback_comment` = "Excellent service! Very professional."
- ✅ `feedback_submitted_at` = current timestamp

---

### **Test 6: Owner Views Tenant Feedback**

**Steps:**

1. Login as **Owner**
2. Navigate to the maintenance request
3. Check the request details section

**Expected Results:**

- ✅ Green box showing:
  - "Tenant Feedback Received:"
  - Rating: 5 stars displayed
  - Comment: "Excellent service! Very professional."
- ✅ Feedback appears in the request information card

---

### **Test 7: Owner Completes Request (After Feedback)**

**Steps:**

1. Owner is still on the maintenance request page
2. Click **"Complete Request"** button (should now be enabled)
3. Fill in:
   - **Actual Cost**: (Optional)
   - **Completion Notes**: (Optional)
4. Click **"Complete Request"**

**Expected Results:**

- ✅ Success toast: "Maintenance request completed successfully!"
- ✅ Request status changes to "Completed"
- ✅ `completed_date` is set
- ✅ Owner can see the completed request in the list

---

### **Test 8: Complete End-to-End Workflow**

**Full Flow Test:**

1. **Tenant** creates maintenance request
2. **Owner** assigns personnel with phone number
3. **Tenant** sees personnel contact and can call
4. **Owner** tries to complete → Feedback is automatically requested
5. **Tenant** submits feedback (rating + comment)
6. **Owner** views feedback
7. **Owner** completes the request

**Expected Results:**

- ✅ All steps work smoothly
- ✅ No errors in console
- ✅ All data is saved correctly in database

---

## 🐛 Troubleshooting

### Issue: Feedback section not showing

**Solution:**

- Check that status is "completed" OR `feedback_required` is true
- Check browser console for errors
- Verify database migration ran successfully

### Issue: Cannot submit feedback

**Solution:**

- Ensure both rating (1-5) and comment are filled
- Check browser console for API errors
- Verify `feedback_rating` and `feedback_comment` fields exist in database

### Issue: Owner cannot complete request

**Solution:**

- Check that `feedback_required` is true
- Verify that `feedback_rating` is not null
- Check browser console for error messages

### Issue: Personnel phone not showing

**Solution:**

- Verify `assigned_personnel_phone` field exists in database
- Check that phone number was entered when assigning personnel
- Refresh the page to reload data

---

## ✅ Checklist

- [ ] Database migration completed
- [ ] Owner can assign personnel with phone number
- [ ] Tenant can see personnel contact number
- [ ] Tenant can click "Call" button (opens phone dialer)
- [ ] Owner can request feedback (automatic when trying to complete)
- [ ] Tenant sees feedback request
- [ ] Tenant can submit feedback (rating + comment)
- [ ] Both rating and comment are required
- [ ] Owner can view tenant feedback
- [ ] Owner can complete request after feedback is received
- [ ] Owner cannot complete without feedback when required
- [ ] All data is saved correctly in database

---

## 📊 Database Verification

After testing, verify data in Supabase:

```sql
-- Check a maintenance request with feedback
SELECT
  id,
  title,
  status,
  assigned_to,
  assigned_personnel_phone,
  feedback_required,
  feedback_rating,
  feedback_comment,
  feedback_submitted_at,
  completed_date
FROM maintenance_requests
WHERE feedback_rating IS NOT NULL
LIMIT 5;
```

**Expected:**

- `assigned_personnel_phone` has a phone number
- `feedback_required` = true
- `feedback_rating` = 1-5
- `feedback_comment` has text
- `feedback_submitted_at` has timestamp
- `completed_date` has timestamp (if completed)

---

## 🎯 Quick Test Script

**Fastest way to test:**

1. **As Owner:**

   - Assign personnel: Name + Phone
   - Try to complete → Auto-requests feedback

2. **As Tenant:**

   - See personnel contact
   - Click "Provide Feedback"
   - Submit: 5 stars + comment

3. **As Owner:**
   - See feedback
   - Complete request

**Total time: ~5 minutes** ⏱️

---

## 📝 Notes

- Feedback is only required when owner tries to complete
- Rating must be 1-5 (5 is highest)
- Comment is required (cannot be empty)
- Personnel phone is required when assigning
- Feedback section only shows when status is "completed" or feedback_required is true

---

Happy Testing! 🚀
