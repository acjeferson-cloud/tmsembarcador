import fs from 'fs';
import path from 'path';

const servicesDir = path.join(process.cwd(), 'src', 'services');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // We need to inject the import for TenantContextHelper if it's not there.
  if (!content.includes('TenantContextHelper') && content.includes('localStorage.getItem(\'tms-user\')')) {
    // Add import after the last import
    const importRegex = /^import .+?;/gm;
    let match;
    let lastIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
      lastIndex = match.index + match[0].length;
    }
    const importStr = "\nimport { TenantContextHelper } from '../utils/tenantContext';\n";
    content = content.slice(0, lastIndex) + importStr + content.slice(lastIndex);
  }

  // Regex to match the typical local storage block:
  // const savedUser = localStorage.getItem('tms-user');
  // if (!savedUser) { ... }
  // const userData = JSON.parse(savedUser);
  const blockRegex = /const\s+savedUser\s*=\s*localStorage\.getItem\('tms-user'\);[\s\S]*?const\s+userData\s*=\s*JSON\.parse\(savedUser\);/g;

  if (blockRegex.test(content)) {
    content = content.replace(blockRegex, `const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId || !ctx.environmentId) {
        throw new Error('Sessão inválida ou contexto não selecionado.');
      }
      const userData = {
        organization_id: ctx.organizationId,
        environment_id: ctx.environmentId,
        establishment_id: ctx.establishmentId || null
      };`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.basename(filePath)}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      if (!fullPath.includes('ordersService') && !fullPath.includes('authService') && !fullPath.includes('usersService')) {
        fixFile(fullPath);
      }
    }
  }
}

walk(servicesDir);
console.log('Done scanning services.');
