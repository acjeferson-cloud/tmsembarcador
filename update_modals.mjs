import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Update OrderDetailsModal.tsx
let orderDetails = fs.readFileSync('src/components/Orders/OrderDetailsModal.tsx', 'utf8');

const orderDetailsReplacements = [
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Data de Emissão</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t(\'orders.table.issueDate\')}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Data de Entrada</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t(\'orders.table.entryDate\')}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Previsão de Entrega</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t(\'orders.table.expectedDate\')}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Chave de Acesso</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t(\'orders.form.accessKey\')}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Transportador</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t(\'orders.table.carrier\')}</p>'],
  [/(<p className="text-sm text-gray-600 dark:text-gray-400">)Valor do Frete(<\/p>)/g, "$1{t('orders.table.freightValue')}$2"],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t(\'orders.table.customer\')}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Cidade de Destino</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t(\'orders.table.destCity\')}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">UF de Destino</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t(\'orders.table.destState\')}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Valor do Pedido</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t(\'orders.table.orderValue\')}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t(\'orders.form.totalPrice\')}</p>']
];

for (const [search, replace] of orderDetailsReplacements) {
  if (typeof search === 'string') {
    orderDetails = orderDetails.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
  } else {
    orderDetails = orderDetails.replace(search, replace);
  }
}
fs.writeFileSync('src/components/Orders/OrderDetailsModal.tsx', orderDetails);

// 2. Update RelationshipMapModal.tsx
let relationMap = fs.readFileSync('src/components/RelationshipMap/RelationshipMapModal.tsx', 'utf8');

// First replace the getDocumentTypeLabel function so it takes the `t` function
relationMap = relationMap.replace(
  'const getDocumentTypeLabel = (type: DocumentType) => {',
  'const getDocumentTypeLabel = (type: DocumentType, t: any) => {'
);
relationMap = relationMap.replace(/return 'Pedido';/, "return t('orders.relationshipMap.order');");
relationMap = relationMap.replace(/return 'Nota Fiscal';/, "return t('orders.relationshipMap.invoice');");
relationMap = relationMap.replace(/return 'Coleta';/, "return t('orders.relationshipMap.pickup');");
relationMap = relationMap.replace(/return 'CT-e';/, "return t('orders.relationshipMap.cte');");
relationMap = relationMap.replace(/return 'Fatura';/, "return t('orders.relationshipMap.bill');");

// In DocumentNode: add useTranslation
relationMap = relationMap.replace(
  "const DocumentNode: React.FC<{",
  "import { useTranslation } from 'react-i18next';\n\nconst DocumentNode: React.FC<{"
);
relationMap = relationMap.replace(
  "const colors = getDocumentColor(document.type);",
  "const { t } = useTranslation();\n  const colors = getDocumentColor(document.type);"
);

// In DocumentNode: call with t
relationMap = relationMap.replace(
  /getDocumentTypeLabel\(document\.type\)/g,
  "getDocumentTypeLabel(document.type, t)"
);
relationMap = relationMap.replace(
  /title="Abrir documento"/g,
  "title={t('orders.relationshipMap.openDoc')}"
);

// Now in RelationshipMapModal itself: add useTranslation before nodes state
relationMap = relationMap.replace(
  "const [nodes, setNodes",
  "const { t } = useTranslation();\n  const [nodes, setNodes"
);

// Fix getDocumentTypeLabel call in the main component
relationMap = relationMap.replace(
  /getDocumentTypeLabel\(sourceDocument\.type\)/g,
  "getDocumentTypeLabel(sourceDocument.type, t)"
);

// Replace raw texts
relationMap = relationMap.replace(
  '<h2 className="text-xl font-bold text-gray-900 dark:text-white">Mapa de Relações</h2>',
  '<h2 className="text-xl font-bold text-gray-900 dark:text-white">{t(\'orders.relationshipMap.title\')}</h2>'
);
relationMap = relationMap.replace(
  '<h2 className="text-xl font-semibold mb-4 shrink-0">Mapa de Relacionamentos</h2>',
  '<h2 className="text-xl font-semibold mb-4 shrink-0">{t(\'orders.relationshipMap.subtitle\')}</h2>'
);
relationMap = relationMap.replace(
  '<p className="text-gray-600 dark:text-gray-400">Carregando mapa de relações...</p>',
  '<p className="text-gray-600 dark:text-gray-400">{t(\'orders.relationshipMap.loading\')}</p>'
);
relationMap = relationMap.replace(
  '<p className="text-sm text-gray-500 dark:text-gray-400 mt-2 shrink-0">Visualização dos relacionamentos</p>',
  '<p className="text-sm text-gray-500 dark:text-gray-400 mt-2 shrink-0">{t(\'orders.relationshipMap.footer\')}</p>'
);

// Fix displayStatus translation if applicable. Just pass through t for status texts:
relationMap = relationMap.replace(
  `const displayStatus = document.status === 'processando' ? 'Emitido' : document.status.charAt(0).toUpperCase() + document.status.slice(1);`,
  `const displayStatus = document.status === 'processando' ? t('orders.relationshipMap.status.emitido', 'Emitido') : t('orders.relationshipMap.status.' + document.status.toLowerCase(), document.status.charAt(0).toUpperCase() + document.status.slice(1));`
);

fs.writeFileSync('src/components/RelationshipMap/RelationshipMapModal.tsx', relationMap);

// 3. Update Locales
const locales = ['pt', 'en', 'es'];
const ptMap = {
    title: "Mapa de Relações",
    subtitle: "Mapa de Relacionamentos",
    loading: "Carregando mapa de relações...",
    footer: "Visualização dos relacionamentos",
    openDoc: "Abrir documento",
    order: "Pedido",
    invoice: "Nota Fiscal",
    pickup: "Coleta",
    cte: "CT-e",
    bill: "Fatura",
    status: {
        emitido: "Emitido",
        emitida: "Emitida",
        coletado: "Coletado",
        coletada: "Coletada",
        importado: "Importado"
    }
};

const enMap = {
    title: "Relationship Map",
    subtitle: "Relationship Overview",
    loading: "Loading relationship map...",
    footer: "Relationship visualization",
    openDoc: "Open document",
    order: "Order",
    invoice: "Invoice",
    pickup: "Pickup",
    cte: "CTe",
    bill: "Bill",
    status: {
        emitido: "Issued",
        emitida: "Issued",
        coletado: "Collected",
        coletada: "Collected",
        importado: "Imported"
    }
};

const esMap = {
    title: "Mapa de Relaciones",
    subtitle: "Resumen de Relaciones",
    loading: "Cargando mapa de relaciones...",
    footer: "Visualización de relaciones",
    openDoc: "Abrir documento",
    order: "Pedido",
    invoice: "Factura",
    pickup: "Recolecta",
    cte: "CTe",
    bill: "Cobro",
    status: {
        emitido: "Emitido",
        emitida: "Emitida",
        coletado: "Recolectado",
        coletada: "Recolectada",
        importado: "Importado"
    }
};

const mappings = { pt: ptMap, en: enMap, es: esMap };

locales.forEach(lang => {
    const p = path.join(__dirname, 'src', 'locales', lang, 'translation.json');
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!data.orders.relationshipMap) {
        data.orders.relationshipMap = {};
    }
    for (const [key, value] of Object.entries(mappings[lang])) {
        data.orders.relationshipMap[key] = value;
    }
    // ensure accessKey exists
    if (!data.orders.form) data.orders.form = {};
    if (!data.orders.form.accessKey) {
        data.orders.form.accessKey = (lang === 'en') ? 'Access Key' : (lang === 'es' ? 'Clave de Acceso' : 'Chave de Acesso');
    }
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}`);
});
