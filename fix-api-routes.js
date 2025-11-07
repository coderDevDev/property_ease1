const fs = require('fs');
const path = require('path');

const apiRoutes = [
  'app/api/auth/register/route.ts',
  'app/api/auth/reset-password/route.ts',
  'app/api/payments/confirm-dev/route.ts',
  'app/api/payments/create/route.ts',
  'app/api/test/auth/route.ts',
  'app/api/xendit/create-invoice/route.ts',
  'app/api/xendit/create-payment-link/route.ts',
  'app/api/xendit/webhook/route.ts'
];

apiRoutes.forEach(routePath => {
  const fullPath = path.join(__dirname, routePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if already has the export
    if (!content.includes("export const dynamic = 'force-static'")) {
      // Find the last import statement
      const lines = content.split('\n');
      let lastImportIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex !== -1) {
        // Insert after the last import and any blank lines
        let insertIndex = lastImportIndex + 1;
        while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
          insertIndex++;
        }
        
        lines.splice(insertIndex, 0, '', "export const dynamic = 'force-static';");
        content = lines.join('\n');
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed: ${routePath}`);
      }
    } else {
      console.log(`⏭️  Skipped (already fixed): ${routePath}`);
    }
  } else {
    console.log(`❌ Not found: ${routePath}`);
  }
});

console.log('\n✨ Done!');
