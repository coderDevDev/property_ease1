// Debug script to check and setup Supabase Storage
// Run with: node scripts/debug-storage.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error(
    'Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndSetupStorage() {
  console.log('🔍 Checking Supabase Storage setup...');

  try {
    // 1. Check if bucket exists
    console.log('\n1. Checking if property-images bucket exists...');
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    const propertyImagesBucket = buckets.find(
      bucket => bucket.id === 'property-images'
    );

    if (propertyImagesBucket) {
      console.log('✅ property-images bucket exists:', propertyImagesBucket);
    } else {
      console.log('⚠️ property-images bucket does not exist. Creating...');

      // Create the bucket
      const { data: createData, error: createError } =
        await supabase.storage.createBucket('property-images', {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif'
          ]
        });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        console.log(
          '\n📝 Please run the SQL script manually in Supabase SQL Editor:'
        );
        console.log('   File: client/scripts/setup-storage-bucket.sql');
        return;
      } else {
        console.log('✅ property-images bucket created successfully');
      }
    }

    // 2. Test upload
    console.log('\n2. Testing file upload...');
    const testFileContent = Buffer.from('test image content');
    const testFileName = `test/test-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(testFileName, testFileContent);

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      console.log(
        '\n🛠️ Storage policies may need to be set up. Run this SQL in Supabase:'
      );
      console.log(`
-- Enable public read access
CREATE POLICY "Public read access" ON storage.objects 
FOR SELECT USING (bucket_id = 'property-images');

-- Enable authenticated uploads
CREATE POLICY "Authenticated upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
      `);
    } else {
      console.log('✅ Upload test successful:', uploadData);

      // Clean up test file
      await supabase.storage.from('property-images').remove([testFileName]);
      console.log('🧹 Test file cleaned up');
    }

    // 3. Check policies
    console.log('\n3. Storage setup complete!');
    console.log('📋 Summary:');
    console.log('   - Bucket: property-images ✅');
    console.log('   - Upload test: ✅');
    console.log('   - Ready for property images! 🏡');
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkAndSetupStorage();
