# 🔧 Supabase Storage Setup Instructions

## The Issue

You're getting this error because the Supabase Storage bucket `property-images` either doesn't exist or doesn't have proper RLS policies set up.

```
Error: new row violates row-level security policy
POST https://[your-supabase-url]/storage/v1/object/property-images/... 400 (Bad Request)
```

## 🛠️ Solution: Set Up Storage Bucket

### **Step 1: Go to Supabase Dashboard**

1. Open your Supabase project dashboard
2. Go to **SQL Editor**

### **Step 2: Create the Storage Bucket**

Run this SQL in the SQL Editor:

```sql
-- 1. Create the storage bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies for property images storage

-- Allow public read access to property images
CREATE POLICY "Property images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Allow authenticated users to upload property images
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images'
  AND auth.role() = 'authenticated'
);

-- Allow property owners to update their property images
CREATE POLICY "Property owners can update their images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images'
  AND auth.role() = 'authenticated'
);

-- Allow property owners to delete their property images
CREATE POLICY "Property owners can delete their images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images'
  AND auth.role() = 'authenticated'
);

-- 3. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### **Step 3: Verify Setup**

After running the SQL, verify the bucket was created:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'property-images';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

### **Step 4: Alternative - Use Supabase Dashboard**

If SQL doesn't work, you can also create the bucket via the Dashboard:

1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name: `property-images`
4. Make it **Public**
5. Set file size limit to **10MB**
6. Allow image types: **JPEG, PNG, WebP, GIF**

### **Step 5: Test the Fix**

After setting up the bucket and policies, try uploading a property image again. The error should be resolved!

## 🔍 **Troubleshooting**

### If you still get errors:

1. **Check Authentication**: Make sure you're logged in when uploading
2. **Check Environment Variables**: Ensure your `.env.local` has correct Supabase keys
3. **Check Bucket Name**: Verify the bucket is named exactly `property-images`
4. **Check File Size**: Ensure images are under 10MB

### Debug Commands:

```javascript
// In browser console, check if user is authenticated:
console.log(supabase.auth.getUser());

// Check if bucket exists:
console.log(await supabase.storage.listBuckets());
```

## ✅ **Expected Result**

After proper setup, you should see:

- ✅ Storage bucket `property-images` exists
- ✅ Images upload successfully to Supabase Storage
- ✅ Property cards display uploaded thumbnails
- ✅ No more RLS policy errors

## 📞 **Need Help?**

If you're still having issues after following these steps, the problem might be:

1. Incorrect Supabase project URL/keys
2. User authentication issues
3. Different bucket naming requirements

Let me know if you need additional assistance!
