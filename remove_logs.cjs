const { Project, SyntaxKind } = require('ts-morph');
const project = new Project();

const files = [
  'src/components/Establishments/**/*.tsx', 'src/services/establishmentsService.ts',
  'src/components/Users/**/*.tsx', 'src/services/usersService.ts',
  'src/components/Countries/**/*.tsx', 'src/services/countriesService.ts',
  'src/components/States/**/*.tsx', 'src/services/statesService.ts',
  'src/components/Cities/**/*.tsx', 'src/services/citiesService.ts',
  'src/components/Holidays/**/*.tsx', 'src/services/holidaysService.ts',
  'src/components/Occurrences/**/*.tsx', 'src/services/occurrencesService.ts',
  'src/components/Rejections/**/*.tsx', 'src/services/rejectionReasonsService.ts',
  'src/components/DeployAgent/**/*.tsx', 'src/services/deployAgentService.ts',
  'src/components/SystemLogs/**/*.tsx', 'src/services/logsService.ts',
  'src/components/Licenses/**/*.tsx', 'src/services/licenseService.ts',
  'src/components/ApiKeys/**/*.tsx', 'src/services/apiKeyService.ts',
  'src/components/Innovations/**/*.tsx', 'src/services/innovationsService.ts',
  'src/components/WhatsApp/**/*.tsx', 'src/services/whatsappConfigService.ts',
  'src/components/GoogleMaps/**/*.tsx', 'src/services/googleMapsService.ts',
  'src/components/OpenAI/**/*.tsx', 'src/services/openaiService.ts',
  'src/components/Carriers/**/*.tsx', 'src/services/carriersService.ts'
];

project.addSourceFilesAtPaths(files);

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

console.log(`Successfully removed ${removedCount} console logs.`);
