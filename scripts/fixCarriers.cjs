const fs = require('fs');
const files = [
  'c:/Users/usuário/Desktop/TmsEmbarcador/tmsembarcador/src/components/Carriers/CarrierForm.tsx',
  'c:/Users/usuário/Desktop/TmsEmbarcador/tmsembarcador/src/components/Carriers/CarrierView.tsx',
  'c:/Users/usuário/Desktop/TmsEmbarcador/tmsembarcador/src/components/Carriers/Carriers.tsx'
];

const exceptions = [
  'messages.', 
  'view.', 
  'vision360.', 
  'newCarrier', 
  'backToCarriers', 
  'editAction', 
  'pageTitle', 
  'subtitle',
  'addCarrier', 
  'searchPlaceholder', 
  'searchPlaceholderExtended',
  'filterBy', 
  'all', 
  'noCarriers', 
  'loading', 
  'deleteAction', 
  'viewAction'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/t\('carriers\.([^']+)'\)/g, (match, p1) => {
    if (exceptions.some(ex => p1.startsWith(ex)) || p1.startsWith('form.')) {
       return match;
    }
    return `t('carriers.form.${p1}')`;
  });

  fs.writeFileSync(file, content);
  console.log('Fixed ' + file);
}
console.log('Update finished');
