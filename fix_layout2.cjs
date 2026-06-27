const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let originalContent = content;

      // 1. Re-enable page scrollbar for `<main>`
      content = content.replace(/<main className="flex-1 overflow-hidden flex flex-col/g, '<main className="flex-1 overflow-y-auto');
      content = content.replace(/<main className="flex-1 overflow-hidden p-8/g, '<main className="flex-1 overflow-y-auto p-8');

      // 2. Set table-management card height to a stabilized h-[600px] instead of flex-1 or min-h-0
      // For split-screen panels (lg:col-span-3)
      content = content.replace(/col-span-1 lg:col-span-3 bg-\[#fdfbf7\] border-\[3px\] border-double border-\[#d4cbb3\] shadow-\[4px_4px_0px_#e5dfd3\] flex flex-col([^"]*?)(?:min-h-0)?/g, 'col-span-1 lg:col-span-3 bg-[#fdfbf7] border-[3px] border-double border-[#d4cbb3] shadow-[4px_4px_0px_#e5dfd3] flex flex-col h-[600px]$1');
      // Clean up duplicate declarations or double spacing in className
      content = content.replace(/h-\[600px\]\s+h-\[600px\]/g, 'h-[600px]');
      content = content.replace(/h-\[600px\] flex flex-col\s+min-w-0 rounded-3xl overflow-hidden relative min-h-0/g, 'flex flex-col min-w-0 rounded-3xl overflow-hidden relative h-[600px]');
      
      // For DepartmentsPanel (no split-screen)
      content = content.replace(/bg-\[#fdfbf7\] border-\[3px\] border-double border-\[#d4cbb3\] shadow-\[4px_4px_0px_#e5dfd3\] flex flex-col flex-1 rounded-3xl overflow-hidden relative min-h-0/g, 'bg-[#fdfbf7] border-[3px] border-double border-[#d4cbb3] shadow-[4px_4px_0px_#e5dfd3] flex flex-col rounded-3xl overflow-hidden relative h-[600px]');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir('src/components/modules');
