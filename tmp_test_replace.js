const fs = require('fs');

let content = fs.readFileSync('src/components/ImplementationCenter/ImplementationCenter.tsx', 'utf8');

// 1. Change placeholder of invoiceTransitoryAccount to "1"
content = content.replace(
  /placeholder="1\.1\.02\.001"\s+className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"([^>]*)>\s*<\/div>\s*<div>\s*<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">\s*\{t\('implementationCenter\.erpIntegration\.invoice\.outboundItem'\)\}/s,
  function(match) {
    // We just want to replace the placeholder string within invoiceTransitoryAccount 
    // without using massive regex that breaks. Let's use string split and replace
    return match;
  }
);
