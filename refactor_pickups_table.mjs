import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function addUseTranslation(content) {
  if (content.includes('useTranslation')) return content;
  const reactImport = content.indexOf(`import React`);
  const i18nImport = `import { useTranslation } from 'react-i18next';\n`;
  if (reactImport !== -1) {
    const nextLine = content.indexOf('\n', reactImport) + 1;
    content = content.slice(0, nextLine) + i18nImport + content.slice(nextLine);
  } else {
    content = i18nImport + content;
  }
  return content;
}

function injectTHookComponent(content, compName) {
  if (content.match(/const\s*{\s*t\s*}\s*=\s*useTranslation\(\);/)) return content;
  const regex = new RegExp(`(export\\s+const\\s+${compName}\\s*:\\s*React\\.FC<[^>]*>\\s*=\\s*\\([^)]*\\)\\s*=>\\s*{)`);
  if (content.match(regex)) {
    return content.replace(regex, `$1\n  const { t } = useTranslation();\n`);
  }
  return content;
}

const replaceAll = (str, search, replacement) => str.split(search).join(replacement);

const processFile = (filePath, replacements, compName) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = addUseTranslation(content);
  content = injectTHookComponent(content, compName);
  for (const [s, r] of replacements) {
    content = replaceAll(content, s, r);
  }
  fs.writeFileSync(filePath, content);
};

// --- PickupsTable.tsx ---
const rep = [
  ["case 'emitida':\n        return 'Emitida';", "case 'emitida':\n        return t('pickups.status.emitida');"],
  ["case 'solicitada':\n        return 'Solicitada';", "case 'solicitada':\n        return t('pickups.status.solicitada');"],
  ["return 'Realizada';", "return t('pickups.status.realizada');"],
  ["return 'Cancelada';", "return t('pickups.status.cancelada');"],
  ["Ações", "{t('pickups.table.actions')}"],
  ["<span>Status</span>", "<span>{t('pickups.table.status')}</span>"],
  ["<span>Nº Coleta</span>", "<span>{t('pickups.table.pickupNumber')}</span>"],
  ["<span>Data Emissão</span>", "<span>{t('pickups.table.issueDate')}</span>"],
  ["<span>Qtd. NF-e(s)</span>", "<span>{t('pickups.table.nfeQty')}</span>"],
  ["<span>Valor NF-e(s)</span>", "<span>{t('pickups.table.nfeValue')}</span>"],
  ["<span>Transportador</span>", "<span>{t('pickups.table.carrier')}</span>"],
  ["<span>USUÁRIO CRIADOR</span>", "<span>{t('pickups.table.creatorUser')}</span>"],
  ["title=\"Ver Detalhes\"", "title={t('pickups.table.viewDetails')}"],
  ["title=\"Marcar como Realizada\"", "title={t('pickups.actions.markAsDone')}"],
  ["title=\"Mapa de Relações\"", "title={t('pickups.table.relationshipMap')}"],
  ["title=\"Mais Ações\"", "title={t('pickups.table.moreActions')}"],
  ["<span>Cancelar Coleta</span>", "<span>{t('pickups.actions.cancel')}</span>"],
  ["<span>Excluir Coleta</span>", "<span>{t('pickups.actions.delete')}</span>"],
  ["Página {currentPage} de {totalPages}", "{t('pickups.table.pageOf', { current: currentPage, total: totalPages })}"],
  ["Mostrando <span className=\"font-medium\">{(currentPage - 1) * rowsPerPage + 1}</span> até{' '}\n                <span className=\"font-medium\">{Math.min(currentPage * rowsPerPage, sortedPickups.length)}</span> de{' '}\n                <span className=\"font-medium\">{sortedPickups.length}</span> resultados", "{t('pickups.table.showingResults', { start: (currentPage - 1) * rowsPerPage + 1, end: Math.min(currentPage * rowsPerPage, sortedPickups.length), total: sortedPickups.length })}"],
  [">5 por página<", ">{t('pickups.table.rowsPerPage', { count: 5 })}<"],
  [">10 por página<", ">{t('pickups.table.rowsPerPage', { count: 10 })}<"],
  [">25 por página<", ">{t('pickups.table.rowsPerPage', { count: 25 })}<"],
  [">50 por página<", ">{t('pickups.table.rowsPerPage', { count: 50 })}<"],
  ["Anterior\n            </button>", "{t('pickups.table.previous')}\n            </button>"],
  ["Próxima\n            </button>", "{t('pickups.table.next')}\n            </button>"],
  ["Anterior\n                </button>", "{t('pickups.table.previous')}\n                </button>"],
  ["Próxima\n                </button>", "{t('pickups.table.next')}\n                </button>"]
];
processFile('src/components/Pickups/PickupsTable.tsx', rep, 'PickupsTable');

console.log('PickupsTable refactored successfully.');
