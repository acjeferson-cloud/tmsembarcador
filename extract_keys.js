const fs = require('fs');

const files = [
  './src/components/ImplementationCenter/ImplementationCenter.tsx',
  './src/components/DeployAgent/DeployAgent.tsx',
  './src/components/DeployAgent/DeployDashboard.tsx',
  './src/components/DeployAgent/DeployUploader.tsx'
];

let keys = new Set();
files.forEach(f => {
  if (fs.existsSync(f)) {
    const code = fs.readFileSync(f, 'utf8');
    const matches = code.match(/implementationCenter\.[a-zA-Z0-9_.]+/g);
    if (matches) {
      matches.forEach(m => keys.add(m));
    }
  }
});

const sortedKeys = Array.from(keys).sort();
console.log(sortedKeys.join('\n'));
