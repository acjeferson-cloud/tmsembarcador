const fs = require('fs');
const paths = ['pt', 'en', 'es'].map(lang => './src/locales/' + lang + '/translation.json');

paths.forEach(path => {
  const json = JSON.parse(fs.readFileSync(path, 'utf8'));
  const lang = path.includes('/pt/') ? 'pt' : path.includes('/en/') ? 'en' : 'es';
  
  if (!json.electronicDocs.stats) json.electronicDocs.stats = {};
  if (!json.electronicDocs.stats.totalDocuments) {
    json.electronicDocs.stats.totalDocuments = lang === 'en' ? 'Total Documents' : lang === 'es' ? 'Total Documentos' : 'Total de Documentos';
  }
  
  if (!json.electronicDocs.view) json.electronicDocs.view = {};
  
  json.electronicDocs.view = {
    ...json.electronicDocs.view,
    companyName: lang === 'pt' ? 'Razão Social' : lang === 'en' ? 'Company Name' : 'Razón Social',
    transportInfo: lang === 'pt' ? 'Informações de Transporte (CTe)' : lang === 'en' ? 'Transport Information (CTe)' : 'Información de Transporte (CTe)',
    totalWeight: lang === 'pt' ? 'Peso Total' : lang === 'en' ? 'Total Weight' : 'Peso Total',
    transportMode: lang === 'pt' ? 'Modal de Transporte' : lang === 'en' ? 'Transport Mode' : 'Modo de Transporte',
    xmlContent: lang === 'pt' ? 'Conteúdo XML' : lang === 'en' ? 'XML Content' : 'Contenido XML',
    hideXml: lang === 'pt' ? 'Ocultar XML' : lang === 'en' ? 'Hide XML' : 'Ocultar XML',
    showXml: lang === 'pt' ? 'Mostrar XML' : lang === 'en' ? 'Show XML' : 'Mostrar XML',
    clickShowXml: lang === 'pt' ? 'Clique em "Mostrar XML" para visualizar o conteúdo completo do XML' : lang === 'en' ? 'Click "Show XML" to view the complete XML content' : 'Haga clic en "Mostrar XML" para ver el contenido completo del XML'
  };
  
  fs.writeFileSync(path, JSON.stringify(json, null, 2));
});
