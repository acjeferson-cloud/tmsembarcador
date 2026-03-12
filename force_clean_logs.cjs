const fs = require('fs');
const path = require('path');

const directoriesToClean = [
  'src/components/Cities',
  'src/components/DeployAgent',
  'src/components/ChangeLog',
  'src/components/Licenses',
  'src/components/ApiKeys',
  'src/components/Innovations',
  'src/components/WhatsApp',
  'src/components/GoogleMaps',
  'src/components/OpenAI',
  'src/components/Establishments',
  'src/components/Countries',
  'src/components/States',
  'src/components/Holidays',
  'src/components/Occurrences',
  'src/components/RejectionReasons',
  'src/components/Carriers',
  'src/components/SystemLogs',
  'src/services',
  'src/hooks',
  'src/utils'
];

function processDirectory(directory) {
  if (!fs.existsSync(directory)) return;

  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;

      // Regex para encontrar e remover console.(log|error|warn|info|debug)(...);
      // Pega chamadas de uma linha
      content = content.replace(/^[ \t]*console\.(log|error|warn|info|debug)\s*\([^;]*\)[;\n]/gm, '');
      
      // Pega chamadas no meio da linha
      content = content.replace(/console\.(log|error|warn|info|debug)\s*\([^;]*\);?/g, '/*log_removed*/');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Cleaned: ${fullPath}`);
      }
    }
  }
}

console.log("Starting forced literal cleanup...");
directoriesToClean.forEach(dir => {
  const fullDirPath = path.resolve(__dirname, dir);
  processDirectory(fullDirPath);
});
console.log("Cleanup complete!");
