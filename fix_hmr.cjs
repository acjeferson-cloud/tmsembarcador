const fs = require('fs');
const path = require('path');

const contextFile = 'src/contexts/InnovationsContext.tsx';
let contextContent = fs.readFileSync(contextFile, 'utf8');

if (!contextContent.includes('export const InnovationsContext')) {
  contextContent = contextContent.replace(
    'const InnovationsContext = createContext<InnovationsContextType | undefined>(undefined);',
    'export const InnovationsContext = createContext<InnovationsContextType | undefined>(undefined);'
  );
  
  const hookRegex = /export const useInnovations = \(\) => \{[\s\S]*?\};\n/g;
  contextContent = contextContent.replace(hookRegex, '');
  
  fs.writeFileSync(contextFile, contextContent);
  console.log('Updated InnovationsContext.tsx');
}

const hookFile = 'src/hooks/useInnovations.ts';
if (!fs.existsSync(hookFile)) {
  const hookContent = `import { useContext } from 'react';
import { InnovationsContext } from '../contexts/InnovationsContext';

export const useInnovations = () => {
  const context = useContext(InnovationsContext);
  if (context === undefined) {
    throw new Error('useInnovations must be used within an InnovationsProvider');
  }
  return context;
};
`;
  fs.writeFileSync(hookFile, hookContent);
  console.log('Created useInnovations.ts');
}

function updateImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      updateImports(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('useInnovations') && content.includes('InnovationsContext') && !fullPath.includes('InnovationsContext.tsx') && !fullPath.includes('useInnovations.ts')) {
        let changed = false;
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('useInnovations') && lines[i].includes('contexts/InnovationsContext')) {
            if (lines[i].match(/import\s*\{\s*useInnovations\s*\}\s*from/)) {
              lines[i] = lines[i].replace('contexts/InnovationsContext', 'hooks/useInnovations');
              changed = true;
            } else if (lines[i].includes('InnovationsProvider')) {
              const match = lines[i].match(/from\s+['"](.*?)['"]/);
              if (match) {
                const importPath = match[1];
                const hookPath = importPath.replace('contexts/InnovationsContext', 'hooks/useInnovations');
                lines[i] = lines[i].replace(/,\s*useInnovations\s*/, '').replace(/\s*useInnovations\s*,/, '');
                lines.splice(i + 1, 0, `import { useInnovations } from '${hookPath}';`);
                changed = true;
              }
            }
          }
        }
        
        if (changed) {
          fs.writeFileSync(fullPath, lines.join('\n'));
          console.log('Updated imports in', fullPath);
        }
      }
    }
  }
}

updateImports('src');
console.log('Done.');
