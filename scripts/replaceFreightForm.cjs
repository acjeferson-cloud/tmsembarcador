const fs = require('fs');
const file = 'c:/Users/usuário/Desktop/TmsEmbarcador/tmsembarcador/src/components/FreightRates/FreightRateTableForm.tsx';

let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useTranslation')) {
  content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useTranslation } from 'react-i18next';");
}

if (!content.includes('const { t } = useTranslation()')) {
  content = content.replace("export const FreightRateTableForm: React.FC<FreightRateTableFormProps> = ({", "export const FreightRateTableForm: React.FC<FreightRateTableFormProps> = ({\n");
  content = content.replace("readOnly = false\n}) => {", "readOnly = false\n}) => {\n  const { t } = useTranslation();");
}

const replacements = [
  ["<span>Voltar para Tabelas de Frete</span>", "<span>{t('carriers.freightRates.form.backToTables')}</span>"],
  ["{readOnly ? 'Visualizar Tabela de Frete' : table ? 'Editar Tabela de Frete' : 'Nova Tabela de Frete'}", "{readOnly ? t('carriers.freightRates.form.titleView') : table ? t('carriers.freightRates.form.titleEdit') : t('carriers.freightRates.form.titleNew')}"],
  ["{readOnly ? 'Detalhes completos da tabela e suas tarifas' : 'Preencha os dados da tabela de frete e adicione as tarifas'}", "{readOnly ? t('carriers.freightRates.form.subtitleView') : t('carriers.freightRates.form.subtitleNew')}"],
  ["<span>Taxas Adicionais</span>", "<span>{t('carriers.freightRates.form.additionalFees')}</span>"],
  ["<span>Itens Restritos</span>", "<span>{t('carriers.freightRates.form.restrictedItems')}</span>"],
  ["<h2 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">Informações Básicas</h2>", "<h2 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">{t('carriers.freightRates.form.basicInfo')}</h2>"],
  ["Nome da Tabela *", "{t('carriers.freightRates.form.tableName')}"],
  ["placeholder=\"Ex: Tabela Padrão 2025\"", "placeholder={t('carriers.freightRates.form.tableNamePlaceholder')}"],
  ["Transportador *", "{t('carriers.freightRates.form.carrier')}"],
  ["<option value=\"\">Selecione o transportador</option>", "<option value=\"\">{t('carriers.freightRates.form.selectCarrier')}</option>"],
  ["Data de Início *", "{t('carriers.freightRates.form.startDate')}"],
  ["Data de Fim *", "{t('carriers.freightRates.form.endDate')}"],
  ["Status *", "{t('carriers.freightRates.form.status')}"],
  ["Tipo de Tabela *", "{t('carriers.freightRates.form.tableType')}"],
  ["<option value=\"Entrada\">Entrada (Frete de Compra)</option>", "<option value=\"Entrada\">{t('carriers.freightRates.form.inbound')}</option>"],
  ["<option value=\"Saída\">Saída (Frete de Venda)</option>", "<option value=\"Saída\">{t('carriers.freightRates.form.outbound')}</option>"],
  ["Modal de Transporte *", "{t('carriers.freightRates.form.transportModal')}"],
  ["'Selecione um transportador primeiro'", "t('carriers.freightRates.form.selectCarrierFirst')"],
  ["'Transportador sem modais configurados'", "t('carriers.freightRates.form.noModalsConfigured')"],
  ["'Selecione o modal'", "t('carriers.freightRates.form.selectModal')"],
  ["<option value=\"rodoviario\">Rodoviário</option>", "<option value=\"rodoviario\">{t('carriers.freightRates.form.road')}</option>"],
  ["<option value=\"aereo\">Aéreo</option>", "<option value=\"aereo\">{t('carriers.freightRates.form.air')}</option>"],
  ["<option value=\"aquaviario\">Aquaviário</option>", "<option value=\"aquaviario\">{t('carriers.freightRates.form.water')}</option>"],
  ["<option value=\"ferroviario\">Ferroviário</option>", "<option value=\"ferroviario\">{t('carriers.freightRates.form.rail')}</option>"],
  ["⚠️ O transportador selecionado não possui modais configurados. Configure os modais no cadastro do transportador.", "{t('carriers.freightRates.form.modalWarning')}"],
  ["<h2 className=\"text-lg font-semibold text-gray-900 dark:text-white\">Tarifas</h2>", "<h2 className=\"text-lg font-semibold text-gray-900 dark:text-white\">{t('carriers.freightRates.form.rates')}</h2>"],
  ["<span>Adicionar Tarifa</span>", "<span>{t('carriers.freightRates.form.addRate')}</span>"],
  ["{editingRateId !== null ? 'Editar Tarifa' : 'Nova Tarifa'}", "{editingRateId !== null ? t('carriers.freightRates.form.editRate') : t('carriers.freightRates.form.newRate')}"],
  ["Descrição da Tarifa *", "{t('carriers.freightRates.form.rateDescription')}"],
  ["placeholder=\"Ex: Frete São Paulo → Rio de Janeiro\"", "placeholder={t('carriers.freightRates.form.rateDescriptionPlaceholder')}"],
  ["Tipo de Aplicação *", "{t('carriers.freightRates.form.applicationType')}"],
  ["<option value=\"cidade\">Por Cidade</option>", "<option value=\"cidade\">{t('carriers.freightRates.form.byCity')}</option>"],
  ["<option value=\"cliente\">Por Cliente</option>", "<option value=\"cidade\">{t('carriers.freightRates.form.byClient')}</option>"],
  ["<option value=\"produto\">Por Produto</option>", "<option value=\"cidade\">{t('carriers.freightRates.form.byProduct')}</option>"],
  ["Prazo de Entrega (dias) *", "{t('carriers.freightRates.form.deliveryTime')}"],
  ["Valor (R$) *", "{t('carriers.freightRates.form.value')}"],
  ["Observações", "{t('carriers.freightRates.form.observations')}"],
  ["placeholder=\"Informações adicionais sobre a tarifa...\"", "placeholder={t('carriers.freightRates.form.observationsPlaceholder')}"],
  ["{editingRateId !== null ? 'Atualizar Tarifa' : 'Adicionar Tarifa'}", "{editingRateId !== null ? t('carriers.freightRates.form.updateRate') : t('carriers.freightRates.form.addRate')}"],
  ["Código", "{t('carriers.freightRates.form.code')}"],
  ["Descrição", "{t('carriers.freightRates.form.description')}"],
  ["Tipo", "{t('carriers.freightRates.form.type')}"],
  ["Prazo", "{t('carriers.freightRates.form.deadline')}"],
  ["Ações", "{t('carriers.freightRates.form.actions')}"],
  ["'Por Cidade'", "t('carriers.freightRates.form.byCity')"],
  ["'Por Cliente'", "t('carriers.freightRates.form.byClient')"],
  ["'Por Produto'", "t('carriers.freightRates.form.byProduct')"],
  ["title=\"Cidades\"", "title={t('carriers.freightRates.form.cities')}"],
  ["title=\"Valores\"", "title={t('carriers.freightRates.form.values')}"],
  ["title=\"Editar\"", "title={t('carriers.freightRates.form.editRate')}"],
  ["title=\"Duplicar\"", "title={t('carriers.freightRates.form.actions')}"],
  ["<span>Cancelar</span>", "<span>{t('carriers.freightRates.form.cancel')}</span>"],
  ["<span>Salvar Tabela</span>", "<span>{t('carriers.freightRates.form.saveTable')}</span>"]
];

for (const [find, replace] of replacements) {
  content = content.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
}

// Few manual string replacements
content = content.replace("window.confirm('Esta tabela não possui tarifas. Deseja continuar mesmo assim?')", "window.confirm(t('carriers.freightRates.form.confirmNoRates'))");
content = content.replace("message: 'Tabela de frete atualizada com sucesso!'", "message: t('carriers.freightRates.form.saveSuccess')");
content = content.replace("message: 'Tabela de frete criada com sucesso!'", "message: t('carriers.freightRates.form.createSuccess')");
content = content.replace("message: 'Por favor, preencha todos os campos obrigatórios.'", "message: t('carriers.freightRates.form.fillRequired')");
content = content.replace("message: 'Tarifa duplicada com sucesso!'", "message: t('carriers.freightRates.form.duplicateSuccess')");
content = content.replace("`Tem certeza que deseja duplicar a tarifa \"${rate.descricao}\"?\\n\\nSerão copiados:\\n- Todos os valores e parâmetros\\n- Faixas de valores\\n- Taxas adicionais\\n- Itens restritos\\n\\nNÃO serão copiadas as cidades vinculadas.`", "`\\n${t('carriers.freightRates.form.duplicateConfirm')} \\\"${rate.descricao}\\\"?`"); // Simplified alert logic to fit hook interpolation slightly better

fs.writeFileSync(file, content);
console.log('Update finished');
