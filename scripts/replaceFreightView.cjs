const fs = require('fs');
const file = 'c:/Users/usuário/Desktop/TmsEmbarcador/tmsembarcador/src/components/FreightRates/FreightRateTableView.tsx';

let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useTranslation')) {
  content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useTranslation } from 'react-i18next';");
}

if (!content.includes('const { t } = useTranslation()')) {
  content = content.replace("export const FreightRateTableView: React.FC<FreightRateTableViewProps> = ({ onBack, onEdit, table }) => {", "export const FreightRateTableView: React.FC<FreightRateTableViewProps> = ({ onBack, onEdit, table }) => {\n  const { t } = useTranslation();");
}

const replacements = [
  ["<span>Voltar para Tabelas de Frete</span>", "<span>{t('carriers.freightRates.form.backToTables')}</span>"],
  ["Visualizar Tabela de Frete", "{t('carriers.freightRates.view.title')}"],
  ["Detalhes completos da tabela e suas tarifas", "{t('carriers.freightRates.view.subtitle')}"],
  ["<span>Taxas Adicionais</span>", "<span>{t('carriers.freightRates.form.additionalFees')}</span>"],
  ["<span>Itens Restritos</span>", "<span>{t('carriers.freightRates.form.restrictedItems')}</span>"],
  ["<span>Nova Tarifa</span>", "<span>{t('carriers.freightRates.form.newRate')}</span>"],
  ["<span>Editar Tabela</span>", "<span>{t('carriers.freightRates.view.editTable')}</span>"],
  ["Transportador: ", "{t('carriers.freightRates.view.carrier')} "],
  ["<p className=\"text-sm text-gray-600 dark:text-gray-400\">Vigência</p>", "<p className=\"text-sm text-gray-600 dark:text-gray-400\">{t('carriers.freightRates.view.validity')}</p>"],
  ["{formatDate(table.dataInicio)} a {formatDate(table.dataFim)}", "{formatDate(table.dataInicio)} {t('carriers.freightRates.view.to')} {formatDate(table.dataFim)}"],
  ["<p className=\"text-sm text-gray-600 dark:text-gray-400\">Status</p>", "<p className=\"text-sm text-gray-600 dark:text-gray-400\">{t('carriers.freightRates.view.status')}</p>"],
  ["{table.status === 'ativo' ? 'Ativo' : 'Inativo'}", "{table.status === 'ativo' ? t('carriers.freightRates.view.statusActive') : t('carriers.freightRates.view.statusInactive')}"],
  ["<p className=\"text-sm text-gray-600 dark:text-gray-400\">Tarifas</p>", "<p className=\"text-sm text-gray-600 dark:text-gray-400\">{t('carriers.freightRates.view.ratesCount')}</p>"],
  ["tarifas cadastradas", "{t('carriers.freightRates.view.registeredRates')}"],
  ["<p className=\"text-sm text-gray-600 dark:text-gray-400\">Situação</p>", "<p className=\"text-sm text-gray-600 dark:text-gray-400\">{t('carriers.freightRates.view.situation')}</p>"],
  ["{isTableActive() ? 'Vigente' : 'Fora de Vigência'}", "{isTableActive() ? t('carriers.freightRates.view.current') : t('carriers.freightRates.view.notCurrent')}"],
  ["<p className=\"text-sm text-gray-600 dark:text-gray-400\">Modal de Transporte</p>", "<p className=\"text-sm text-gray-600 dark:text-gray-400\">{t('carriers.freightRates.view.transportModal')}</p>"],
  ["<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">Tarifas</h3>", "<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">{t('carriers.freightRates.form.rates')}</h3>"],
  ["<span>Adicionar Tarifa</span>", "<span>{t('carriers.freightRates.form.addRate')}</span>"],
  ["Código", "{t('carriers.freightRates.form.code')}"],
  ["Descrição", "{t('carriers.freightRates.form.description')}"],
  ["Tipo", "{t('carriers.freightRates.form.type')}"],
  ["Prazo", "{t('carriers.freightRates.form.deadline')}"],
  ["Ações", "{t('carriers.freightRates.form.actions')}"],
  ["<p className=\"text-gray-600 dark:text-gray-400 mb-4\">Nenhuma tarifa cadastrada nesta tabela</p>", "<p className=\"text-gray-600 dark:text-gray-400 mb-4\">{t('carriers.freightRates.view.noRates')}</p>"],
  ["<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">Resumo por Tipo de Aplicação</h3>", "<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">{t('carriers.freightRates.view.summaryByApplication')}</h3>"],
  ["<h4 className=\"font-medium text-blue-800\">Por Cidade</h4>", "<h4 className=\"font-medium text-blue-800\">{t('carriers.freightRates.view.byCity')}</h4>"],
  ["<h4 className=\"font-medium text-green-800\">Por Cliente</h4>", "<h4 className=\"font-medium text-green-800\">{t('carriers.freightRates.view.byClient')}</h4>"],
  ["<h4 className=\"font-medium text-purple-800\">Por Produto</h4>", "<h4 className=\"font-medium text-purple-800\">{t('carriers.freightRates.view.byProduct')}</h4>"],
  ["<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">Informações de Auditoria</h3>", "<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">{t('carriers.freightRates.view.auditInfo')}</h3>"],
  ["<p className=\"text-sm text-gray-600 dark:text-gray-400\">Criado por</p>", "<p className=\"text-sm text-gray-600 dark:text-gray-400\">{t('carriers.freightRates.view.createdBy')}</p>"],
  ["Usuário #{table.criadoPor}", "{t('carriers.freightRates.view.user')}{table.criadoPor}"],
  ["<p className=\"text-sm text-gray-600 dark:text-gray-400\">Data de Criação</p>", "<p className=\"text-sm text-gray-600 dark:text-gray-400\">{t('carriers.freightRates.view.creationDate')}</p>"],
  ["<p className=\"text-sm text-gray-600 dark:text-gray-400\">Última alteração por</p>", "<p className=\"text-sm text-gray-600 dark:text-gray-400\">{t('carriers.freightRates.view.lastAlteredBy')}</p>"],
  ["Usuário #{table.alteradoPor}", "{t('carriers.freightRates.view.user')}{table.alteradoPor}"],
  ["<p className=\"text-sm text-gray-600 dark:text-gray-400\">Data da última alteração</p>", "<p className=\"text-sm text-gray-600 dark:text-gray-400\">{t('carriers.freightRates.view.lastAlteredDate')}</p>"],
  ["<h3 className=\"text-lg font-semibold text-blue-900 mb-2\">Sobre Tarifas</h3>", "<h3 className=\"text-lg font-semibold text-blue-900 mb-2\">{t('carriers.freightRates.view.aboutRatesTitle')}</h3>"],
  ["As tarifas definem os valores e prazos de entrega para diferentes aplicações. Cada tarifa possui um código \\n                único e pode ser aplicada por cidade, cliente ou produto.", "{t('carriers.freightRates.view.aboutRatesDesc')}"],
  ["<p className=\"font-semibold text-blue-900\">Por Cidade</p>", "<p className=\"font-semibold text-blue-900\">{t('carriers.freightRates.view.byCity')}</p>"],
  ["Baseado na origem e destino", "{t('carriers.freightRates.view.aboutCityDesc')}"],
  ["<p className=\"font-semibold text-blue-900\">Por Cliente</p>", "<p className=\"font-semibold text-blue-900\">{t('carriers.freightRates.view.byClient')}</p>"],
  ["Específico para um cliente", "{t('carriers.freightRates.view.aboutClientDesc')}"],
  ["<p className=\"font-semibold text-blue-900\">Por Produto</p>", "<p className=\"font-semibold text-blue-900\">{t('carriers.freightRates.view.byProduct')}</p>"],
  ["Baseado no tipo de produto", "{t('carriers.freightRates.view.aboutProductDesc')}"]
];

for (const [find, replace] of replacements) {
  content = content.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
}

// Special Cases
content = content.replace("table.modal === 'rodoviario' ? '🚛 Rodoviário' :", "table.modal === 'rodoviario' ? `🚛 ${t('carriers.freightRates.view.road')}` :");
content = content.replace("table.modal === 'aereo' ? '✈️ Aéreo' :", "table.modal === 'aereo' ? `✈️ ${t('carriers.freightRates.view.air')}` :");
content = content.replace("table.modal === 'aquaviario' ? '🚢 Aquaviário' :", "table.modal === 'aquaviario' ? `🚢 ${t('carriers.freightRates.view.water')}` :");
content = content.replace("table.modal === 'ferroviario' ? '🚂 Ferroviário' :", "table.modal === 'ferroviario' ? `🚂 ${t('carriers.freightRates.view.rail')}` :");

// JS alerts 
content = content.replace("window.confirm('Tem certeza que deseja excluir esta tarifa?')", "window.confirm(t('carriers.freightRates.view.confirmDelete'))");
content = content.replace("alert('Tarifa excluída com sucesso!')", "alert(t('carriers.freightRates.view.deleteSuccess'))");
content = content.replace("alert('Erro ao excluir tarifa.')", "alert(t('carriers.freightRates.view.deleteError'))");
content = content.replace("alert('Tarifa atualizada com sucesso!')", "alert(t('carriers.freightRates.view.updateSuccess'))");
content = content.replace("alert('Erro ao atualizar tarifa.')", "alert(t('carriers.freightRates.view.updateError'))");
content = content.replace("alert('Tarifa adicionada com sucesso!')", "alert(t('carriers.freightRates.view.addSuccess'))");
content = content.replace("alert('Erro ao adicionar tarifa.')", "alert(t('carriers.freightRates.view.addError'))");
content = content.replace("alert('Erro ao salvar tarifa. Tente novamente.')", "alert(t('carriers.freightRates.view.saveError'))");
content = content.replace("message: 'Erro ao duplicar tarifa. Tente novamente.'", "message: t('carriers.freightRates.view.saveError')"); // reusing an error message
content = content.replace("`Tem certeza que deseja duplicar a tarifa \"${rate.descricao}\"?\\n\\nSerão copiados:\\n- Todos os valores e parâmetros\\n- Faixas de valores\\n- Taxas adicionais\\n- Itens restritos\\n\\nNÃO serão copiadas as cidades vinculadas.`", "`\\n${t('carriers.freightRates.form.duplicateConfirm')} \\\"${rate.descricao}\\\"?`"); // duplicate logic

// Switch labels for 'tipo aplicacao'
content = content.replace("case 'cidade': return 'Por Cidade'", "case 'cidade': return t('carriers.freightRates.view.byCity')");
content = content.replace("case 'cliente': return 'Por Cliente'", "case 'cliente': return t('carriers.freightRates.view.byClient')");
content = content.replace("case 'produto': return 'Por Produto'", "case 'produto': return t('carriers.freightRates.view.byProduct')");

fs.writeFileSync(file, content);
console.log('Update finished');
