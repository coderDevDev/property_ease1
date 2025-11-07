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

dynamicRoutes.forEach(routePath => {
  const fullPath = path.join(__dirname, routePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove generateStaticParams function
    content = content.replace(/\n\/\/ Required for static export.*?\n.*?export async function generateStaticParams\(\) \{[\s\S]*?\}\n/g, '');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Removed generateStaticParams from: ${routePath}`);
  } else {
    console.log(`❌ Not found: ${routePath}`);
  }
});

console.log('\n✨ Done!');
