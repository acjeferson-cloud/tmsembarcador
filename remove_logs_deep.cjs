const { Project, SyntaxKind } = require('ts-morph');
const project = new Project();

// Varrer absolutamente todo o source code para pegar ganchos e páginas extras
const files = [
  'src/**/*.ts',
  'src/**/*.tsx'
];

project.addSourceFilesAtPaths(files);

let removedCount = 0;

// Palavras-chave dos arquivos do Menu Configurações que o usuário citou
const targetPaths = [
  'Cities', 'cities',
  'DeployAgent', 'deployAgent',
  'Logs', 'logs',
  'Licenses', 'license',
  'ApiKeys', 'apiKey',
  'Innovations', 'innovations',
  'WhatsApp', 'whatsapp',
  'GoogleMaps', 'googleMaps',
  'OpenAI', 'openai'
];

project.getSourceFiles().forEach(sf => {
  const filePath = sf.getFilePath().toLowerCase();
  
  // Só processamos o arquivo se ele tiver relação com as categorias listadas
  const isTargetFile = targetPaths.some(p => filePath.includes(p.toLowerCase()));
  if (!isTargetFile) return;

  let fileChanged = false;
  let hasMore = true;
  
  while (hasMore) {
    hasMore = false;
    const callExpressions = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
    
    for (const callExpr of callExpressions) {
      if (callExpr.wasForgotten()) continue;
      
      const expr = callExpr.getExpression();
      if (expr && expr.getKind() === SyntaxKind.PropertyAccessExpression) {
        const text = expr.getText();
        if (['console.log', 'console.warn', 'console.error', 'console.debug', 'console.info'].includes(text)) {
          console.log(`Removing ${text} in ${sf.getFilePath()}`);
          
          try {
             const statement = callExpr.getFirstAncestorByKind(SyntaxKind.ExpressionStatement);
             if (statement && !statement.wasForgotten()) {
               statement.remove();
             } else {
               callExpr.replaceWithText('void 0');
             }
             
             hasMore = true;
             fileChanged = true;
             removedCount++;
             break;
          } catch(e) {
             console.log("Failed to remove node, replacing with void 0 instead");
             try {
                callExpr.replaceWithText('void 0');
                hasMore = true;
                fileChanged = true;
                removedCount++;
                break;
             } catch(e2) {
                console.log("Completely failed to remove/replace this node.");
             }
          }
        }
      }
    }
  }

  if (fileChanged) {
    sf.saveSync();
  }
});

console.log(`Successfully removed ${removedCount} console logs in deep configs.`);
