const fs = require('fs');
const file = 'c:/Users/usuário/Desktop/TmsEmbarcador/tmsembarcador/src/components/Carriers/CarrierForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const exceptions = [
  'messages.', 
  'view.', 
  'vision360.', 
  'newCarrier', 
  'backToCarriers', 
  'editAction', 
  'pageTitle', 
  'addCarrier', 
  'searchPlaceholder', 
  'filterBy', 
  'all', 
  'noCarriers', 
  'loading', 
  'deleteAction', 
  'viewAction'
];

content = content.replace(/t\('carriers\.([^']+)'\)/g, (match, p1) => {
  if (exceptions.some(ex => p1.startsWith(ex)) || p1.startsWith('form.')) {
     return match;
  }
  return `t('carriers.form.${p1}')`;
});

fs.writeFileSync(file, content);
console.log('Update finished');
