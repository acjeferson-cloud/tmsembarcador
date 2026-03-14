const fs = require('fs');
const path = require('path');

const locales = ['pt', 'en', 'es'];
const baseDir = path.join(__dirname, '../src');

const addKeysToJson = (locale, keyData) => {
  const jsonPath = path.join(baseDir, 'locales', locale, 'translation.json');
  let data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  if (!data.establishments.view) data.establishments.view = {};
  
  // merge into view
  Object.assign(data.establishments.view, keyData);

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.log(`Updated ${locale}/translation.json`);
};

addKeysToJson('pt', { fullAddress: "Endereço completo:", noLogo: "Sem logo" });
addKeysToJson('en', { fullAddress: "Full Address:", noLogo: "No logo" });
addKeysToJson('es', { fullAddress: "Dirección completa:", noLogo: "Sin logotipo" });

// Replace in EstablishmentView.tsx
const viewPath = path.join(baseDir, 'components', 'establishments', 'EstablishmentView.tsx');
let viewContent = fs.readFileSync(viewPath, 'utf8');

const replacements = [
  ["<span>E-mail de Saída</span>", "<span>{t('establishments.form.tabs.emailOutgoing')}</span>"],
  ["<strong>Endereço completo:</strong>", "<strong>{t('establishments.view.fullAddress')}</strong>"],
  [">Sem logo<", ">{t('establishments.view.noLogo')}<"]
];

for (const [search, replace] of replacements) {
    viewContent = viewContent.split(search).join(replace);
}

fs.writeFileSync(viewPath, viewContent, 'utf8');
console.log('✅ EstablishmentView.tsx updated successfully!');
