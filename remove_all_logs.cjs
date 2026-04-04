const { Project, SyntaxKind } = require('ts-morph');
const project = new Project();
project.addSourceFilesAtPaths('src/**/*.ts');
project.addSourceFilesAtPaths('src/**/*.tsx');

let removedCount = 0;

project.getSourceFiles().forEach(sf => {
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
             // Instead of replacing with void 0 which can break boolean expressions like '&& console.log()',
             // replace with 'null' or just remove the statement
             const statement = callExpr.getFirstAncestorByKind(SyntaxKind.ExpressionStatement);
             if (statement && !statement.wasForgotten() && statement.getExpression() === callExpr) {
               statement.remove();
             } else {
               callExpr.replaceWithText('null');
             }
             
             hasMore = true;
             fileChanged = true;
             removedCount++;
             break;
          } catch(e) {
             console.log("Failed to remove node, replacing with null");
             try {
                callExpr.replaceWithText('null');
                hasMore = true;
                fileChanged = true;
                removedCount++;
                break;
             } catch(e2) {
                console.log("Completely failed to replace.");
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

console.log(`Successfully removed ${removedCount} console logs.`);
