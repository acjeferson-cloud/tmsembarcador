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
  
  const callExpressions = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  for (let i = callExpressions.length - 1; i >= 0; i--) {
    const callExpr = callExpressions[i];
    
    if (callExpr.wasForgotten()) continue;
    
    const expr = callExpr.getExpression();
    if (expr && expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const text = expr.getText();
      if (['console.log', 'console.warn', 'console.error', 'console.debug', 'console.info'].includes(text)) {
        const statement = callExpr.getFirstAncestorByKind(SyntaxKind.ExpressionStatement);
        if (statement) {
          statement.remove();
          fileChanged = true;
          removedCount++;
        } else {
           try {
             callExpr.replaceWithText('void 0');
             fileChanged = true;
             removedCount++;
           } catch(e) {}
        }
      }
    }
  }

  if (fileChanged) {
    sf.saveSync();
  }
});

console.log(`Successfully removed ${removedCount} console logs.`);
