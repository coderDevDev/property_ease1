/**
 * Script to Generate Missing Payments for Existing Lease
 * Run this once to create payment records for your lease
 */

import { PaymentGenerationAPI } from '@/lib/api/paymentGeneration';

async function generateMissingPayments() {
  console.log('🚀 Starting payment generation...\n');

  try {
    // STEP 1: Get your tenant and property IDs from database
    // You need to replace these with actual IDs from your Supabase database
    const TENANT_ID = 'YOUR_TENANT_ID_HERE'; // Get from tenants table
    const PROPERTY_ID = 'YOUR_PROPERTY_ID_HERE'; // Get from tenants table  
    const OWNER_USER_ID = 'YOUR_OWNER_USER_ID_HERE'; // Property owner's user ID
    
    // STEP 2: Configure lease details
    const leaseDetails = {
      tenant_id: TENANT_ID,
      property_id: PROPERTY_ID,
      monthly_rent: 5000, // Your monthly rent amount (adjust if needed)
      lease_start: '2025-08-01',
      lease_end: '2025-10-31',
      payment_due_day: 5, // Rent due on 5th of each month
      include_utilities: false, // Set to true if you want utility payments too
      utility_amount: 0 // Set amount if utilities are included
    };

    // STEP 3: Preview what will be generated
    console.log('📋 Preview of payments to be generated:\n');
    const preview = await PaymentGenerationAPI.previewLeasePayments(leaseDetails);
    
    if (preview.success && preview.payments) {
      preview.payments.forEach((payment, index) => {
        console.log(`${index + 1}. ${payment.month}`);
        console.log(`   Type: ${payment.type.toUpperCase()}`);
        console.log(`   Amount: ₱${payment.amount.toLocaleString()}`);
        console.log(`   Due: ${new Date(payment.due_date).toLocaleDateString()}\n`);
      });

      console.log('📊 Summary:');
      console.log(`   Total Months: ${preview.summary?.total_months}`);
      console.log(`   Total Rent: ₱${preview.summary?.total_rent.toLocaleString()}`);
      console.log(`   Total Payments: ${preview.summary?.payments_count}`);
      console.log(`   Grand Total: ₱${preview.summary?.grand_total.toLocaleString()}\n`);
    }

    // STEP 4: Generate the payments
    console.log('💳 Generating payment records...\n');
    const result = await PaymentGenerationAPI.generateLeasePayments(
      leaseDetails,
      OWNER_USER_ID
    );

    if (result.success) {
      console.log('✅ SUCCESS!\n');
      console.log(`${result.message}\n`);
      
      if (result.summary) {
        console.log('📈 Generation Summary:');
        console.log(`   Total Payments Created: ${result.summary.total_payments}`);
        console.log(`   Total Amount: ₱${result.summary.total_amount.toLocaleString()}`);
        console.log(`   Months Covered: ${result.summary.months_covered}\n`);
      }

      console.log('🎉 Payment records created successfully!');
      console.log('🏠 Check your tenant dashboard to see them!');
      console.log('💰 You can now pay via Xendit!\n');
    } else {
      console.error('❌ ERROR:', result.message);
    }

  } catch (error) {
    console.error('❌ Failed to generate payments:', error);
  }
}

// Run the script
generateMissingPayments();
