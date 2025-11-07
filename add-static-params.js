const fs = require('fs');
const path = require('path');

// Find all dynamic route page.tsx files
const dynamicRoutes = [
  'app/dashboard/payments/[id]/page.tsx',
  'app/owner/dashboard/announcements/[id]/page.tsx',
  'app/owner/dashboard/maintenance/[id]/page.tsx',
  'app/owner/dashboard/payments/[id]/page.tsx',
  'app/owner/dashboard/properties/[id]/page.tsx',
  'app/owner/dashboard/properties/[id]/edit/page.tsx',
  'app/owner/dashboard/tenants/[id]/page.tsx',
  'app/owner/dashboard/tenants/[id]/edit/page.tsx',
  'app/tenant/dashboard/announcements/[id]/page.tsx',
  'app/tenant/dashboard/maintenance/[id]/page.tsx',
  'app/tenant/dashboard/maintenance/[id]/edit/page.tsx',
  'app/tenant/dashboard/payments/[id]/page.tsx',
  'app/tenant/dashboard/properties/[id]/page.tsx',
  'app/tenant/dashboard/rental/[id]/page.tsx'
];

const generateStaticParamsCode = `
// Required for static export - returns empty array to skip pre-rendering
export async function generateStaticParams() {
  return [];
}
`;

dynamicRoutes.forEach(routePath => {
  const fullPath = path.join(__dirname, routePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if already has generateStaticParams
    if (!content.includes('generateStaticParams')) {
      // Add after 'use client' directive if it exists
      if (content.includes("'use client'")) {
        content = content.replace("'use client';", "'use client';" + generateStaticParamsCode);
      } else {
        // Add at the beginning
        content = generateStaticParamsCode + '\n' + content;
      }
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Added generateStaticParams to: ${routePath}`);
    } else {
      console.log(`⏭️  Skipped (already has generateStaticParams): ${routePath}`);
    }
  } else {
    console.log(`❌ Not found: ${routePath}`);
  }
});

console.log('\n✨ Done!');
