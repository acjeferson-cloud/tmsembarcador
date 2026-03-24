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
  // Try pattern: export const Comp: React.FC...
  const regex1 = new RegExp(`(export\\s+const\\s+${compName}\\s*:\\s*React\\.FC<[^>]*>\\s*=\\s*\\([^)]*\\)\\s*=>\\s*{)`);
  if (content.match(regex1)) {
    return content.replace(regex1, `$1\n  const { t } = useTranslation();\n`);
  }
  // Try pattern: export const Comp = ({ ... }) => {
  const regex2 = new RegExp(`(export\\s+const\\s+${compName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*{)`);
  if (content.match(regex2)) {
    return content.replace(regex2, `$1\n  const { t } = useTranslation();\n`);
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

// --- PickupsActions.tsx ---
const pickupsActionsReps = [
  ["Coleta{selectedCount !== 1 ? 's' : ''} selecionada{selectedCount !== 1 ? 's' : ''}", "{selectedCount !== 1 ? t('pickups.actions.selectedPlural') : t('pickups.actions.selectedSingular')}"],
  ["title={selectedCount !== 1 ? 'Selecione apenas 1 coleta' : 'Solicitar coleta ao transportador'}", "title={selectedCount !== 1 ? t('pickups.actions.selectJustOne') : t('pickups.actions.requestPickupTooltip')}"],
  ["<span>Solicitar Coleta ao Transportador</span>", "<span>{t('pickups.actions.requestPickupBtn')}</span>"],
  ["<span>Marcar como Realizada</span>", "<span>{t('pickups.actions.markAsDone')}</span>"],
  ["<span>Imprimir</span>", "<span>{t('pickups.actions.print')}</span>"],
  ["<span>Exportar</span>", "<span>{t('pickups.actions.export')}</span>"],
  ["<span>Cancelar</span>", "<span>{t('pickups.actions.cancel')}</span>"]
];
processFile('src/components/Pickups/PickupsActions.tsx', pickupsActionsReps, 'PickupsActions');

// --- PickupsFilters.tsx ---
const pickupsFiltersReps = [
  ["placeholder=\"Buscar por número da coleta...\"", "placeholder={t('pickups.filters.searchPlaceholder')}"],
  ["<span>{isExpanded ? 'Ocultar Filtros' : 'Mostrar Filtros'}</span>", "<span>{isExpanded ? t('pickups.filters.hideFilters') : t('pickups.filters.showFilters')}</span>"],
  ["<span>Transportador</span>", "<span>{t('pickups.filters.carrier')}</span>"],
  ["placeholder=\"Nome do transportador...\"", "placeholder={t('pickups.filters.carrierPlaceholder')}"],
  ["<span>Usuário Responsável</span>", "<span>{t('pickups.filters.responsibleUser')}</span>"],
  ["placeholder=\"Nome do usuário...\"", "placeholder={t('pickups.filters.userPlaceholder')}"],
  ["<span>Endereço de Coleta</span>", "<span>{t('pickups.filters.pickupAddress')}</span>"],
  ["placeholder=\"Cidade - UF...\"", "placeholder={t('pickups.filters.addressPlaceholder')}"],
  ["<span>Período de Criação</span>", "<span>{t('pickups.filters.creationPeriod')}</span>"],
  ["placeholder=\"Data inicial\"", "placeholder={t('pickups.filters.startDate')}"],
  ["placeholder=\"Data final\"", "placeholder={t('pickups.filters.endDate')}"],
  ["<span>Status da Coleta</span>", "<span>{t('pickups.filters.pickupStatus')}</span>"],
  ["Emitida", "{t('pickups.status.emitida')}"],
  ["Solicitada", "{t('pickups.status.solicitada')}"],
  ["Realizada", "{t('pickups.status.realizada')}"],
  ["Cancelada", "{t('pickups.status.cancelada')}"],
  ["Limpar Filtros", "{t('pickups.filters.clearBtn')}"],
  ["Aplicar Filtros", "{t('pickups.filters.applyBtn')}"]
];
processFile('src/components/Pickups/PickupsFilters.tsx', pickupsFiltersReps, 'PickupsFilters');

// --- Pickups.tsx ---
const pickupsReps = [
  ["{ label: 'Documentos Operacionais' }", "{ label: t('pickups.breadcrumb.operationalDocs') }"],
  ["{ label: 'Coletas', current: true }", "{ label: t('pickups.breadcrumb.pickups'), current: true }"],
  ["Acessou a Gestão de Coletas", "Acessou a Gestão de Coletas"], // keep log internal maybe? or translated? let's ignore activity logger for now
  ["setToast({ message: 'Por favor, selecione pelo menos uma coleta para realizar esta ação.', type: 'warning' });", "setToast({ message: t('pickups.messages.selectAtLeastOneAction'), type: 'warning' });"],
  ["E-mail enviado, mas falha ao atualizar status.", "E-mail enviado, mas falha ao atualizar status."],
  ["Transportador sem e-mail", "Transportador sem e-mail"],
  ["Coleta(s) solicitada(s) ao transportador com sucesso!", "Coleta(s) solicitada(s) ao transportador com sucesso!"],
  ["title: 'Cancelar Coleta(s)'", "title: t('pickups.dialogs.cancelBulkTitle')"],
  ["message: \\`Deseja realmente cancelar \${selectedPickups.length} coleta(s)?\\`", "message: t('pickups.dialogs.cancelBulkMessage', { count: selectedPickups.length })"],
  ["title: 'Marcar como Realizada(s)'", "title: t('pickups.dialogs.doneBulkTitle')"],
  ["message: \\`Deseja marcar \${selectedPickups.length} coleta(s) como REALIZADA(s)?\\`", "message: t('pickups.dialogs.doneBulkMessage', { count: selectedPickups.length })"],
  ["message: 'Não foi possível recuperar os dados completos das coletas selecionadas.'", "message: t('pickups.messages.errorFetchData')"],
  ["message: 'Erro ao processar a ação solicitada.'", "message: t('pickups.messages.errorProcessAction')"],
  ["title: 'Marcar como Realizada'", "title: t('pickups.dialogs.doneSingleTitle')"],
  ["message: \\`Deseja marcar a coleta \${pickup.numeroColeta} como REALIZADA?\\`", "message: t('pickups.dialogs.doneSingleMessage', { num: pickup.numeroColeta })"],
  ["title: 'Cancelar Coleta'", "title: t('pickups.dialogs.cancelSingleTitle')"],
  ["message: \\`Deseja realmente cancelar a coleta \${pickup.numeroColeta}?\\`", "message: t('pickups.dialogs.cancelSingleMessage', { num: pickup.numeroColeta })"],
  ["title: 'Excluir Coleta'", "title: t('pickups.dialogs.deleteSingleTitle')"],
  ["message: \\`Tem certeza que deseja excluir a coleta \${pickup.numeroColeta}? Esta ação removerá a coleta e o vínculo com todas as respectivas Notas Fiscais.\\`", "message: t('pickups.dialogs.deleteSingleMessage', { num: pickup.numeroColeta })"],
  ["message: \\`\${successCount} coleta(s) excluída(s) com sucesso.\\`", "message: t('pickups.messages.deleteSuccess', { count: successCount })"],
  ["message: \\`Erro ao excluir coleta(s).\\`", "message: t('pickups.messages.deleteError')"],
  ["const actionMsg = confirmDialog.action === 'realizar' ? 'marcada(s) como realizada(s)' : 'cancelada(s)';", "const actionMsg = confirmDialog.action === 'realizar' ? t('pickups.messages.markedAsDone') : t('pickups.messages.markedAsCanceled');"],
  ["message: \\`\${successCount} coleta(s) \${actionMsg}.\\`", "message: t('pickups.messages.statusSuccess', { count: successCount, action: actionMsg })"],
  ["message: \\`Erro ao processar as coletas selecionadas.\\`", "message: t('pickups.messages.errorProcessAction')"],
  ["<h1 className=\"text-2xl font-bold text-gray-900 dark:text-white\">Coletas</h1>", "<h1 className=\"text-2xl font-bold text-gray-900 dark:text-white\">{t('pickups.header.title')}</h1>"],
  ["<p className=\"text-gray-600 dark:text-gray-400\">Acompanhe e gerencie todas as coletas por transportador</p>", "<p className=\"text-gray-600 dark:text-gray-400\">{t('pickups.header.subtitle')}</p>"],
  ["<span>{isLoading ? 'Carregando...' : 'Atualizar'}</span>", "<span>{isLoading ? t('pickups.actions.loading') : t('pickups.actions.refresh')}</span>"],
  ["<p className=\"text-sm font-medium text-gray-600 dark:text-gray-400\">Total de Coletas</p>", "<p className=\"text-sm font-medium text-gray-600 dark:text-gray-400\">{t('pickups.kpis.total')}</p>"],
  ["<p className=\"text-sm font-medium text-gray-600 dark:text-gray-400\">Emitidas</p>", "<p className=\"text-sm font-medium text-gray-600 dark:text-gray-400\">{t('pickups.status.emitida')}</p>"],
  ["<p className=\"text-sm font-medium text-gray-600 dark:text-gray-400\">Solicitadas</p>", "<p className=\"text-sm font-medium text-gray-600 dark:text-gray-400\">{t('pickups.status.solicitada')}</p>"],
  ["<p className=\"text-sm font-medium text-gray-600 dark:text-gray-400\">Realizadas</p>", "<p className=\"text-sm font-medium text-gray-600 dark:text-gray-400\">{t('pickups.status.realizada')}</p>"],
  ["<p className=\"text-sm font-medium text-gray-600 dark:text-gray-400\">Canceladas</p>", "<p className=\"text-sm font-medium text-gray-600 dark:text-gray-400\">{t('pickups.status.cancelada')}</p>"],
  ["confirmText={confirmDialog.action === 'cancelar' ? 'Sim, Cancelar' : confirmDialog.action === 'delete' ? 'Sim, Excluir' : 'Sim, Marcar como Realizada'}", "confirmText={confirmDialog.action === 'cancelar' ? t('pickups.dialogs.yesCancel') : confirmDialog.action === 'delete' ? t('pickups.dialogs.yesDelete') : t('pickups.dialogs.yesDone')}"],
  ["cancelText=\"Voltar\"", "cancelText={t('pickups.dialogs.back')}"]
];
processFile('src/components/Pickups/Pickups.tsx', pickupsReps, 'Pickups');

console.log('Pickups, PickupsActions, PickupsFilters refactored successfully.');
