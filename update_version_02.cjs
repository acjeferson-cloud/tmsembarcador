const fs = require('fs');

const files = [
  'src/components/Auth/Login.tsx',
  'src/components/Layout/Header.tsx',
  'src/components/SaasAdmin/SaasAdminLogin.tsx'
];

let changedAny = false;
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('V1.01')) {
       content = content.replace(/V1\.01/g, 'V1.02');
       fs.writeFileSync(file, content, 'utf8');
       console.log(`Updated version to V1.02 in ${file}`);
       changedAny = true;
    }
  }
});
if (!changedAny) console.log("No V1.01 found to replace.");
