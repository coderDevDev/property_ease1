require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function setupApplicationStorage() {
  try {
    console.log('Setting up application documents storage...');

    // Create the bucket if it doesn't exist
    const { data: bucket, error: bucketError } =
      await supabaseAdmin.storage.createBucket('application-documents', {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        fileSizeLimit: 10485760 // 10MB
      });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('Bucket already exists, updating configuration...');

        // Update bucket configuration
        const { error: updateError } = await supabaseAdmin.storage.updateBucket(
          'application-documents',
          {
            public: false,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
            fileSizeLimit: 10485760 // 10MB
          }
        );

        if (updateError) {
          throw updateError;
        }
      } else {
        throw bucketError;
      }
    } else {
      console.log('Created application-documents bucket:', bucket);
    }

    // Create policies
    const policies = [
      {
        name: 'Authenticated users can upload application documents',
        definition: `bucket_id = 'application-documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM rental_applications WHERE user_id = auth.uid()
        )`,
        operation: 'INSERT'
      },
      {
        name: 'Users can read their own application documents',
        definition: `bucket_id = 'application-documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM rental_applications WHERE user_id = auth.uid()
        )`,
        operation: 'SELECT'
      },
      {
        name: 'Property owners can read application documents',
        definition: `bucket_id = 'application-documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] IN (
          SELECT ra.id::text FROM rental_applications ra
          JOIN properties p ON ra.property_id = p.id
          WHERE p.owner_id = auth.uid()
        )`,
        operation: 'SELECT'
      },
      {
        name: 'Users can delete their application documents',
        definition: `bucket_id = 'application-documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM rental_applications WHERE user_id = auth.uid() AND status = 'pending'
        )`,
        operation: 'DELETE'
      }
    ];

    console.log('Creating storage policies...');
    for (const policy of policies) {
      const { error: policyError } = await supabaseAdmin.storage
        .from('application-documents')
        .createPolicy(policy.name, {
          definition: policy.definition,
          operation: policy.operation
        });

      if (policyError) {
        if (policyError.message.includes('already exists')) {
          console.log(`Policy "${policy.name}" already exists, updating...`);

          const { error: updateError } = await supabaseAdmin.storage
            .from('application-documents')
            .updatePolicy(policy.name, {
              definition: policy.definition,
              operation: policy.operation
            });

          if (updateError) {
            throw updateError;
          }
        } else {
          throw policyError;
        }
      } else {
        console.log(`Created policy: ${policy.name}`);
      }
    }

    console.log('Storage setup completed successfully!');
  } catch (error) {
    console.error('Error setting up storage:', error);
    process.exit(1);
  }
}

setupApplicationStorage();
