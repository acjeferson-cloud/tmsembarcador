const fs = require('fs');
const file = 'c:/Users/usuário/Desktop/TmsEmbarcador/tmsembarcador/src/components/FreightRates/FreightRateTablesList.tsx';

let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useTranslation')) {
  content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useTranslation } from 'react-i18next';");
}

if (!content.includes('const { t } = useTranslation()')) {
  content = content.replace("export const FreightRateTablesList: React.FC<FreightRateTablesListProps> = ({ carrierId, carrierName }) => {", "export const FreightRateTablesList: React.FC<FreightRateTablesListProps> = ({ carrierId, carrierName }) => {\n  const { t } = useTranslation();");
}

const replacements = [
  ["if (window.confirm('Tem certeza que deseja excluir esta tabela de frete?'))", "if (window.confirm(t('carriers.freightRates.deleteConfirm')))"],
  ["alert('Tabela de frete excluída com sucesso!')", "alert(t('carriers.freightRates.deleteSuccess'))"],
  ["alert('Erro ao excluir tabela de frete.')", "alert(t('carriers.freightRates.deleteError'))"],
  ["carrierId ? `Tabelas de Frete - ${carrierName}` : 'Todas as Tabelas de Frete'", "carrierId ? `${t('carriers.freightRates.title')} - ${carrierName}` : t('carriers.freightRates.allTables')"],
  ["Gerencie as tabelas de frete e tarifas", "{t('carriers.freightRates.manageTariffs')}"],
  ["<span>Nova Tabela</span>", "<span>{t('carriers.freightRates.newTable')}</span>"],
  ["placeholder=\"Buscar por nome da tabela ou transportador...\"", "placeholder={t('carriers.freightRates.searchPlaceholder')}"],
  ["<option value=\"Todos\">Todos os Status</option>", "<option value=\"Todos\">{t('carriers.freightRates.allStatuses')}</option>"],
  ["<option value=\"ativo\">Ativo</option>", "<option value=\"ativo\">{t('carriers.freightRates.activeText')}</option>"],
  ["<option value=\"inativo\">Inativo</option>", "<option value=\"inativo\">{t('carriers.freightRates.inactiveText')}</option>"],
  ["<span>Exportar</span>", "<span>{t('carriers.freightRates.export')}</span>"],
  ["<span>Total: {filteredTables.length} tabelas</span>", "<span>{t('carriers.freightRates.totalTables', { count: filteredTables.length })}</span>"],
  ["<span>{tables.filter(t => t.status === 'ativo').length} ativas</span>", "<span>{t('carriers.freightRates.activeCount', { count: tables.filter(t => t.status === 'ativo').length })}</span>"],
  ["<span>{tables.filter(t => t.status === 'inativo').length} inativas</span>", "<span>{t('carriers.freightRates.inactiveCount', { count: tables.filter(t => t.status === 'inativo').length })}</span>"],
  ["title=\"Visualizar\"", "title={t('carriers.freightRates.viewAction')}"],
  ["title=\"Copiar Tabela\"", "title={t('carriers.freightRates.copyTable')}"],
  ["title=\"Editar\"", "title={t('carriers.freightRates.editAction')}"],
  ["title=\"Excluir\"", "title={t('carriers.freightRates.deleteAction')}"],
  ["<span>Vigência: {formatDate(table.data_inicio)} a {formatDate(table.data_fim)}</span>", "<span>{t('carriers.freightRates.validity', { start: formatDate(table.data_inicio), end: formatDate(table.data_fim) })}</span>"],
  ["<span>{table.tarifas.length} tarifas cadastradas</span>", "<span>{t('carriers.freightRates.registeredTariffs', { count: table.tarifas.length })}</span>"],
  ["<span>Criada em: {formatDate(table.created_at)}</span>", "<span>{t('carriers.freightRates.createdAt', { date: formatDate(table.created_at) })}</span>"],
  ["'Entrada (Frete de Compra)'", "t('carriers.freightRates.inbound')"],
  ["'Saída (Frete de Venda)'", "t('carriers.freightRates.outbound')"],
  ["<span className=\"text-gray-600 dark:text-gray-400\">Status:</span>", "<span className=\"text-gray-600 dark:text-gray-400\">{t('carriers.freightRates.statusLabel')}</span>"],
  ["{table.status === 'ativo' ? 'Ativo' : 'Inativo'}", "{table.status === 'ativo' ? t('carriers.freightRates.activeText') : t('carriers.freightRates.inactiveText')}"],
  ["{isTableActive(table) ? 'Vigente' : 'Fora de Vigência'}", "{isTableActive(table) ? t('carriers.freightRates.current') : t('carriers.freightRates.notCurrent')}"],
  ["<h3 className=\"text-lg font-medium text-gray-900 dark:text-white mb-2\">Nenhuma tabela de frete encontrada</h3>", "<h3 className=\"text-lg font-medium text-gray-900 dark:text-white mb-2\">{t('carriers.freightRates.notFound')}</h3>"],
  ["'Este transportador ainda não possui tabelas de frete cadastradas.'", "t('carriers.freightRates.noTablesCarrier')"],
  ["'Nenhuma tabela de frete corresponde aos filtros aplicados.'", "t('carriers.freightRates.noTablesFilter')"],
  ["<span>Criar Nova Tabela</span>", "<span>{t('carriers.freightRates.createTable')}</span>"]
];

for (const [find, replace] of replacements) {
  content = content.replace(find, replace);
}

// Special case for the modal texts
content = content.replace("table.modal === 'rodoviario' ? '🚛 Rodoviário' :", "table.modal === 'rodoviario' ? `🚛 ${t('carriers.modals.rodoviario')}` :");
content = content.replace("table.modal === 'aereo' ? '✈️ Aéreo' :", "table.modal === 'aereo' ? `✈️ ${t('carriers.modals.aereo')}` :");
content = content.replace("table.modal === 'aquaviario' ? '🚢 Aquaviário' :", "table.modal === 'aquaviario' ? `🚢 ${t('carriers.modals.aquaviario')}` :");
content = content.replace("table.modal === 'ferroviario' ? '🚂 Ferroviário' :", "table.modal === 'ferroviario' ? `🚂 ${t('carriers.modals.ferroviario')}` :");

fs.writeFileSync(file, content);
console.log('Update finished');
