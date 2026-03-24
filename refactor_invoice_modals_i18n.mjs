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

function injectTHookModal(content, componentName) {
  if (content.match(/const\s*{\s*t\s*}\s*=\s*useTranslation\(\);/)) return content;
  const regex = new RegExp(`(export\\s+const\\s+${componentName}\\s*:\\s*React\\.FC<[^>]*>\\s*=\\s*\\([^)]*\\)\\s*=>\\s*{)`);
  if (content.match(regex)) {
    content = content.replace(regex, `$1\n  const { t } = useTranslation();\n`);
  }
  return content;
}

const processFile = (filePath, replacements, compName) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = addUseTranslation(content);
  content = injectTHookModal(content, compName);
  for (const [s, r] of replacements) {
    content = content.split(s).join(r);
  }
  fs.writeFileSync(filePath, content);
};

// --- CreatePickupModal ---
const createPickupReps = [
  ["setError('Selecione pelo menos uma nota fiscal');", "setError(t('invoices.modals.common.errorSelectInvoice'));"],
  ["setError('Estabelecimento não identificado');", "setError(t('invoices.modals.common.errorEstNotFound'));"],
  ["setError(result.error || 'Erro ao criar coletas');", "setError(result.error || t('invoices.modals.createPickup.errorCreate'));"],
  ["setError(err.message || 'Erro ao processar criação de coletas');", "setError(err.message || t('invoices.modals.createPickup.errorProcess'));"],
  ["<h2 className=\"text-xl font-bold text-gray-900 dark:text-white\">\n              Criar Coletas\n            </h2>", "<h2 className=\"text-xl font-bold text-gray-900 dark:text-white\">\n              {t('invoices.modals.createPickup.title')}\n            </h2>"],
  ["Resumo das Notas Fiscais Selecionadas", "{t('invoices.modals.common.summaryTitle')}"],
  ["<p className=\"text-xs text-blue-600 dark:text-blue-400\">Volumes</p>", "<p className=\"text-xs text-blue-600 dark:text-blue-400\">{t('invoices.modals.common.volumes')}</p>"],
  ["<p className=\"text-xs text-blue-600 dark:text-blue-400\">Peso Total</p>", "<p className=\"text-xs text-blue-600 dark:text-blue-400\">{t('invoices.modals.common.totalWeight')}</p>"],
  ["<p className=\"text-xs text-blue-600 dark:text-blue-400\">NFs</p>", "<p className=\"text-xs text-blue-600 dark:text-blue-400\">{t('invoices.modals.common.nfs')}</p>"],
  ["<p className=\"text-xs text-blue-600 dark:text-blue-400\">Metragem Cúbica</p>", "<p className=\"text-xs text-blue-600 dark:text-blue-400\">{t('invoices.modals.common.cubicMeters')}</p>"],
  ["<th className=\"px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          Nota Fiscal\n                        </th>", "<th className=\"px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          {t('invoices.modals.common.invoice')}\n                        </th>"],
  ["<th className=\"px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          Destinatário\n                        </th>", "<th className=\"px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          {t('invoices.modals.common.recipient')}\n                        </th>"],
  ["<th className=\"px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          Peso\n                        </th>", "<th className=\"px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          {t('invoices.modals.common.weight')}\n                        </th>"],
  ["<th className=\"px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          Volumes\n                        </th>", "<th className=\"px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          {t('invoices.modals.common.volumes')}\n                        </th>"],
  ["<th className=\"px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          Metragem Cub.\n                        </th>", "<th className=\"px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          {t('invoices.modals.common.cubicMet')}\n                        </th>"],
  ["<span>{isLoading ? 'Processando...' : 'Confirmar e Criar Coletas'}</span>", "<span>{isLoading ? t('invoices.modals.common.processing') : t('invoices.modals.createPickup.confirmBtn')}</span>"],
  ["Cancelar\n                </button>", "{t('invoices.modals.common.cancel')}\n                </button>"]
];
processFile('src/components/Invoices/CreatePickupModal.tsx', createPickupReps, 'CreatePickupModal');

// --- BulkXmlUploadModal ---
const bulkXmlReps = [
  ["throw new Error('Erro ao fazer parse do XML');", "throw new Error(t('invoices.modals.bulkXml.errorParse'));"],
  ["throw new Error('Contexto de locatário não encontrado');", "throw new Error(t('invoices.modals.bulkXml.errorTenant'));"],
  ["message: 'Importado com sucesso'", "message: t('invoices.modals.bulkXml.importedSuccess')"],
  ["throw new Error(result.error || 'Erro ao importar');", "throw new Error(result.error || t('invoices.modals.bulkXml.errorImport'));"],
  ["message: error.message || 'Erro desconhecido'", "message: error.message || t('invoices.modals.bulkXml.errorUnknown')"],
  ["Upload de XML em Lote - Notas Fiscais", "{t('invoices.modals.bulkXml.title')}"],
  ["Arraste arquivos XML aqui", "{t('invoices.modals.bulkXml.dragXml')}"],
  ["ou clique no botão abaixo para selecionar", "{t('invoices.modals.bulkXml.orClickToSelect')}"],
  ["Selecionar Arquivos", "{t('invoices.modals.bulkXml.selectFiles')}"],
  ["Total:", "{t('invoices.modals.bulkXml.total')}:"],
  ["Sucesso:", "{t('invoices.modals.bulkXml.success')}:"],
  ["Erro:", "{t('invoices.modals.bulkXml.error')}:"],
  ["Adicionar Mais", "{t('invoices.modals.bulkXml.addMore')}"],
  ["Processar {pendingCount} Arquivo{pendingCount !== 1 ? 's' : ''}", "{t('invoices.modals.bulkXml.processFiles', { count: pendingCount })}"],
  ["Processando arquivos...", "{t('invoices.modals.bulkXml.processingFiles')}"],
  ["\n                  Fechar\n", "\n                  {t('invoices.modals.common.close')}\n"]
];
processFile('src/components/Invoices/BulkXmlUploadModal.tsx', bulkXmlReps, 'BulkXmlUploadModal');

// --- OccurrenceInvoiceModal ---
const occurReps = [
  ["setError('Erro ao carregar histórico de ocorrências');", "setError(t('invoices.modals.occurrence.errorLoad'));"],
  ["throw new Error('Falha ao fazer o upload da foto. Verifique seu armazenamento.');", "throw new Error(t('invoices.modals.occurrence.errorPhoto'));"],
  ["setError('Por favor, selecione uma ocorrência.');", "setError(t('invoices.modals.occurrence.errorSelect'));"],
  ["setError('Data e hora são obrigatórias.');", "setError(t('invoices.modals.occurrence.errorDateTime'));"],
  ["setError(err.message || 'Erro ao salvar a ocorrência');", "setError(err.message || t('invoices.modals.occurrence.errorSave'));"],
  ["Lançar Ocorrência", "{t('invoices.modals.occurrence.title')}"],
  ["Tipo de Ocorrência *", "{t('invoices.modals.occurrence.type')} *"],
  ["Selecione uma ocorrência...", "{t('invoices.modals.occurrence.select')}..."],
  ["Data da Ocorrência *", "{t('invoices.modals.occurrence.date')} *"],
  ["Hora da Ocorrência *", "{t('invoices.modals.occurrence.time')} *"],
  ["Foto de Comprovante de Entrega", "{t('invoices.modals.occurrence.photo')}"],
  ["Fazer upload de foto", "{t('invoices.modals.occurrence.uploadPhoto')}"],
  ["PNG, JPG, JPEG até 5MB", "{t('invoices.modals.occurrence.photoHint')}"],
  ["\n            Cancelar\n", "\n            {t('invoices.modals.common.cancel')}\n"],
  ["<span>Salvando...</span>", "<span>{t('invoices.form.saving')}</span>"],
  ["<span>Lançar Ocorrência</span>", "<span>{t('invoices.modals.occurrence.title')}</span>"]
];
processFile('src/components/Invoices/OccurrenceInvoiceModal.tsx', occurReps, 'OccurrenceInvoiceModal');

// --- InvoiceCTesModal ---
const ctesReps = [
  ["<h2 className=\"text-xl font-bold text-gray-900 dark:text-white\">CT-es da Nota Fiscal</h2>", "<h2 className=\"text-xl font-bold text-gray-900 dark:text-white\">{t('invoices.modals.ctes.title')}</h2>"],
  ["Nota Fiscal: <span", "{t('invoices.modals.common.invoice')}: <span"],
  ["placeholder=\"Buscar por número de CT-e...\"", "placeholder={t('invoices.modals.ctes.searchPlaceholder')}"],
  ["<th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    Número\n                  </th>", "<th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    {t('invoices.details.code')}\n                  </th>"],
  ["<th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    Série\n                  </th>", "<th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    {t('invoices.form.fields.serie')}\n                  </th>"],
  ["<th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    Data Emissão\n                  </th>", "<th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    {t('invoices.form.fields.issueDate')}\n                  </th>"],
  ["<th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    Valor\n                  </th>", "<th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    {t('invoices.table.value')}\n                  </th>"],
  ["<th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    Status\n                  </th>", "<th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    {t('invoices.table.status')}\n                  </th>"],
  ["<th scope=\"col\" className=\"px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    Ações\n                  </th>", "<th scope=\"col\" className=\"px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n                    {t('invoices.table.actions')}\n                  </th>"],
  ["Carregando CT-es...", "{t('invoices.modals.ctes.loading')}"],
  ["title=\"Visualizar DACTE\"", "title={t('invoices.modals.ctes.viewDacte')}"],
  ["title=\"Download XML\"", "title={t('invoices.modals.ctes.downloadXml')}"],
  ["title=\"Consultar na SEFAZ\"", "title={t('invoices.modals.ctes.consultSefaz')}"],
  ["Nenhum CT-e encontrado.", "{t('invoices.modals.ctes.notFound')}"],
  ["Total de CT-es:", "{t('invoices.modals.ctes.totalCtes')}:"],
  ["Valor total:", "{t('invoices.modals.ctes.totalValue')}:"],
  ["\n                Exportar Lista\n", "\n                {t('invoices.modals.ctes.exportList')}\n"]
];
processFile('src/components/Invoices/InvoiceCTesModal.tsx', ctesReps, 'InvoiceCTesModal');

// --- SchedulePickupModal ---
const schedulePickupReps = [
  ["setError('Informe o e-mail do transportador');", "setError(t('invoices.modals.schedulePickup.errorEmail'));"],
  ["setError('E-mail inválido');", "setError(t('invoices.modals.schedulePickup.errorInvalidEmail'));"],
  ["setError('Selecione pelo menos uma nota fiscal');", "setError(t('invoices.modals.common.errorSelectInvoice'));"],
  ["setError('Estabelecimento não identificado');", "setError(t('invoices.modals.common.errorEstNotFound'));"],
  ["setError(result.error || 'Erro ao criar agendamento');", "setError(result.error || t('invoices.modals.schedulePickup.errorCreate'));"],
  ["setError(err.message || 'Erro ao processar agendamento');", "setError(err.message || t('invoices.modals.schedulePickup.errorProcess'));"],
  ["{generatedLink ? 'Agendamento Criado' : 'Agendar Coleta'}", "{generatedLink ? t('invoices.modals.schedulePickup.titleCreated') : t('invoices.modals.schedulePickup.title')}"]
];

let schFile = fs.readFileSync('src/components/Invoices/SchedulePickupModal.tsx', 'utf8');
schFile = addUseTranslation(schFile);
schFile = injectTHookModal(schFile, 'SchedulePickupModal');
for (const [s, r] of schedulePickupReps) {
  schFile = schFile.split(s).join(r);
}

const replaceAll = (str, search, replacement) => str.split(search).join(replacement);

schFile = replaceAll(schFile, "Resumo das Notas Fiscais Selecionadas", "{t('invoices.modals.common.summaryTitle')}");
schFile = replaceAll(schFile, "<p className=\"text-xs text-blue-600 dark:text-blue-400\">Volumes</p>", "<p className=\"text-xs text-blue-600 dark:text-blue-400\">{t('invoices.modals.common.volumes')}</p>");
schFile = replaceAll(schFile, "<p className=\"text-xs text-blue-600 dark:text-blue-400\">Peso Total</p>", "<p className=\"text-xs text-blue-600 dark:text-blue-400\">{t('invoices.modals.common.totalWeight')}</p>");
schFile = replaceAll(schFile, "<p className=\"text-xs text-blue-600 dark:text-blue-400\">NFs</p>", "<p className=\"text-xs text-blue-600 dark:text-blue-400\">{t('invoices.modals.common.nfs')}</p>");
schFile = replaceAll(schFile, "<th className=\"px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          Nota Fiscal\n                        </th>", "<th className=\"px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          {t('invoices.modals.common.invoice')}\n                        </th>");
schFile = replaceAll(schFile, "<th className=\"px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          Destinatário\n                        </th>", "<th className=\"px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          {t('invoices.modals.common.recipient')}\n                        </th>");
schFile = replaceAll(schFile, "<th className=\"px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          Peso\n                        </th>", "<th className=\"px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          {t('invoices.modals.common.weight')}\n                        </th>");
schFile = replaceAll(schFile, "<th className=\"px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          Volumes\n                        </th>", "<th className=\"px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300\">\n                          {t('invoices.modals.common.volumes')}\n                        </th>");

schFile = replaceAll(schFile, "E-mail do Transportador *", "{t('invoices.modals.schedulePickup.carrierEmail')} *");
schFile = replaceAll(schFile, "O link de agendamento será enviado para este e-mail", "{t('invoices.modals.schedulePickup.emailHint')}");
schFile = replaceAll(schFile, "Validade do Link (horas)", "{t('invoices.modals.schedulePickup.linkValidity')}");
schFile = replaceAll(schFile, ">24 horas<", ">{t('invoices.modals.schedulePickup.validity24')}<");
schFile = replaceAll(schFile, ">48 horas (2 dias)<", ">{t('invoices.modals.schedulePickup.validity48')}<");
schFile = replaceAll(schFile, ">72 horas (3 dias)<", ">{t('invoices.modals.schedulePickup.validity72')}<");
schFile = replaceAll(schFile, ">120 horas (5 dias)<", ">{t('invoices.modals.schedulePickup.validity120')}<");
schFile = replaceAll(schFile, ">168 horas (7 dias)<", ">{t('invoices.modals.schedulePickup.validity168')}<");
schFile = replaceAll(schFile, "<span>{isLoading ? 'Processando...' : 'Criar Agendamento'}</span>", "<span>{isLoading ? t('invoices.modals.common.processing') : t('invoices.modals.schedulePickup.createBtn')}</span>");
schFile = replaceAll(schFile, "\n                  Cancelar\n                </button>", "\n                  {t('invoices.modals.common.cancel')}\n                </button>");
schFile = replaceAll(schFile, "Agendamento Criado com Sucesso!", "{t('invoices.modals.schedulePickup.createdSuccess')}");
schFile = replaceAll(schFile, "O link foi enviado para", "{t('invoices.modals.schedulePickup.linkSentTo')}");
schFile = replaceAll(schFile, "Link de Agendamento:", "{t('invoices.modals.schedulePickup.bookingLink')}:");
schFile = replaceAll(schFile, "<span>{linkCopied ? 'Link Copiado!' : 'Copiar Link'}</span>", "<span>{linkCopied ? t('invoices.modals.schedulePickup.linkCopiedBtn') : t('invoices.modals.schedulePickup.copyLinkBtn')}</span>");
schFile = replaceAll(schFile, "Próximos Passos:", "{t('invoices.modals.schedulePickup.nextSteps')}:");
schFile = replaceAll(schFile, "O transportador receberá um e-mail com o link de acesso", "{t('invoices.modals.schedulePickup.step1')}");
schFile = replaceAll(schFile, "Ele poderá acessar o link e informar data/hora da coleta", "{t('invoices.modals.schedulePickup.step2')}");
schFile = replaceAll(schFile, "Você será notificado quando o agendamento for confirmado", "{t('invoices.modals.schedulePickup.step3')}");
schFile = replaceAll(schFile, "O link expirará em {expiresInHours} horas", "{t('invoices.modals.schedulePickup.step4', { hours: expiresInHours })}");
schFile = replaceAll(schFile, "\n                Fechar\n              </button>", "\n                {t('invoices.modals.common.close')}\n              </button>");

fs.writeFileSync('src/components/Invoices/SchedulePickupModal.tsx', schFile);

// --- Build Translation JSONs ---
const buildTranslation = (lang) => {
  const isEn = lang === 'en';
  const isEs = lang === 'es';
  
  return {
    modals: {
      common: {
        errorSelectInvoice: isEn ? "Select at least one invoice" : (isEs ? "Seleccione al menos una factura" : "Selecione pelo menos uma nota fiscal"),
        errorEstNotFound: isEn ? "Establishment not identified" : (isEs ? "Establecimiento no identificado" : "Estabelecimento não identificado"),
        summaryTitle: isEn ? "Summary of Selected Invoices" : (isEs ? "Resumen de Facturas Seleccionadas" : "Resumo das Notas Fiscais Selecionadas"),
        volumes: isEn ? "Volumes" : (isEs ? "Volúmenes" : "Volumes"),
        totalWeight: isEn ? "Total Weight" : (isEs ? "Peso Total" : "Peso Total"),
        nfs: isEn ? "NFs" : (isEs ? "Facturas" : "NFs"),
        cubicMeters: isEn ? "Cubic Meters" : (isEs ? "Metros Cúbicos" : "Metragem Cúbica"),
        invoice: isEn ? "Invoice" : (isEs ? "Factura" : "Nota Fiscal"),
        recipient: isEn ? "Recipient" : (isEs ? "Destinatario" : "Destinatário"),
        weight: isEn ? "Weight" : (isEs ? "Peso" : "Peso"),
        cubicMet: isEn ? "Cubic Met." : (isEs ? "Met. Cúbica" : "Metragem Cub."),
        processing: isEn ? "Processing..." : (isEs ? "Procesando..." : "Processando..."),
        cancel: isEn ? "Cancel" : (isEs ? "Cancelar" : "Cancelar"),
        close: isEn ? "Close" : (isEs ? "Cerrar" : "Fechar")
      },
      createPickup: {
        errorCreate: isEn ? "Error creating pickups" : (isEs ? "Error al crear recolecciones" : "Erro ao criar coletas"),
        errorProcess: isEn ? "Error processing pickups creation" : (isEs ? "Error al procesar creación de recolecciones" : "Erro ao processar criação de coletas"),
        title: isEn ? "Create Pickups" : (isEs ? "Crear Recolecciones" : "Criar Coletas"),
        confirmBtn: isEn ? "Confirm and Create Pickups" : (isEs ? "Confirmar y Crear" : "Confirmar e Criar Coletas")
      },
      bulkXml: {
        errorParse: isEn ? "Error parsing XML" : (isEs ? "Error procesando XML" : "Erro ao fazer parse do XML"),
        errorTenant: isEn ? "Tenant context not found" : (isEs ? "Contexto de inquilino no encontrado" : "Contexto de locatário não encontrado"),
        importedSuccess: isEn ? "Successfully imported" : (isEs ? "Importado con éxito" : "Importado com sucesso"),
        errorImport: isEn ? "Error importing" : (isEs ? "Error al importar" : "Erro ao importar"),
        errorUnknown: isEn ? "Unknown error" : (isEs ? "Error desconocido" : "Erro desconhecido"),
        title: isEn ? "Bulk XML Upload - Invoices" : (isEs ? "Subida masiva XML - Facturas" : "Upload de XML em Lote - Notas Fiscais"),
        dragXml: isEn ? "Drag XML files here" : (isEs ? "Arrastre archivos XML aquí" : "Arraste arquivos XML aqui"),
        orClickToSelect: isEn ? "or click the button below to select" : (isEs ? "o haga clic abajo para seleccionar" : "ou clique no botão abaixo para selecionar"),
        selectFiles: isEn ? "Select Files" : (isEs ? "Seleccionar Archivos" : "Selecionar Arquivos"),
        total: isEn ? "Total" : (isEs ? "Total" : "Total"),
        success: isEn ? "Success" : (isEs ? "Éxito" : "Sucesso"),
        error: isEn ? "Error" : (isEs ? "Error" : "Erro"),
        addMore: isEn ? "Add More" : (isEs ? "Añadir Más" : "Adicionar Mais"),
        processFiles: isEn ? "Process {{count}} File(s)" : (isEs ? "Procesar {{count}} Archivo(s)" : "Processar {{count}} Arquivo(s)"),
        processingFiles: isEn ? "Processing files..." : (isEs ? "Procesando archivos..." : "Processando arquivos...")
      },
      occurrence: {
        errorLoad: isEn ? "Error loading occurrences history" : (isEs ? "Error al cargar historial" : "Erro ao carregar histórico de ocorrências"),
        errorPhoto: isEn ? "Failed to upload photo. Check your storage." : (isEs ? "Error subiendo foto. Verifique almacenamiento" : "Falha ao fazer o upload da foto. Verifique seu armazenamento."),
        errorSelect: isEn ? "Please select an occurrence." : (isEs ? "Seleccione una ocurrencia." : "Por favor, selecione uma ocorrência."),
        errorDateTime: isEn ? "Date and time are required." : (isEs ? "Fecha y hora obligatorias." : "Data e hora são obrigatórias."),
        errorSave: isEn ? "Error saving occurrence" : (isEs ? "Error guardando ocurrencia" : "Erro ao salvar a ocorrência"),
        title: isEn ? "Log Occurrence" : (isEs ? "Registrar Ocurrencia" : "Lançar Ocorrência"),
        type: isEn ? "Occurrence Type" : (isEs ? "Tipo de Ocurrencia" : "Tipo de Ocorrência"),
        select: isEn ? "Select an occurrence" : (isEs ? "Seleccione una ocurrencia" : "Selecione uma ocorrência"),
        date: isEn ? "Occurrence Date" : (isEs ? "Fecha" : "Data da Ocorrência"),
        time: isEn ? "Occurrence Time" : (isEs ? "Hora" : "Hora da Ocorrência"),
        photo: isEn ? "Delivery Proof Photo" : (isEs ? "Foto de Comprobante" : "Foto de Comprovante de Entrega"),
        uploadPhoto: isEn ? "Upload Photo" : (isEs ? "Subir Foto" : "Fazer upload de foto"),
        photoHint: isEn ? "PNG, JPG, JPEG up to 5MB" : (isEs ? "PNG, JPG, JPEG hasta 5MB" : "PNG, JPG, JPEG até 5MB")
      },
      ctes: {
        title: isEn ? "Invoice CT-es" : (isEs ? "CT-es de la Factura" : "CT-es da Nota Fiscal"),
        searchPlaceholder: isEn ? "Search by CT-e number..." : (isEs ? "Buscar CT-e..." : "Buscar por número de CT-e..."),
        loading: isEn ? "Loading CT-es..." : (isEs ? "Cargando CT-es..." : "Carregando CT-es..."),
        viewDacte: isEn ? "View DACTE" : (isEs ? "Ver DACTE" : "Visualizar DACTE"),
        downloadXml: isEn ? "Download XML" : (isEs ? "Descargar XML" : "Download XML"),
        consultSefaz: isEn ? "Consult in SEFAZ" : (isEs ? "Consultar SEFAZ" : "Consultar na SEFAZ"),
        notFound: isEn ? "No CT-e found." : (isEs ? "Ningún CT-e encontrado." : "Nenhum CT-e encontrado."),
        totalCtes: isEn ? "Total CT-es" : (isEs ? "Total CT-es" : "Total de CT-es"),
        totalValue: isEn ? "Total value" : (isEs ? "Valor total" : "Valor total"),
        exportList: isEn ? "Export List" : (isEs ? "Exportar Lista" : "Exportar Lista")
      },
      schedulePickup: {
        errorEmail: isEn ? "Enter carrier email" : (isEs ? "Informa email del transportista" : "Informe o e-mail do transportador"),
        errorInvalidEmail: isEn ? "Invalid email" : (isEs ? "Email inválido" : "E-mail inválido"),
        errorCreate: isEn ? "Error creating schedule" : (isEs ? "Error creando agendamiento" : "Erro ao criar agendamento"),
        errorProcess: isEn ? "Error processing schedule" : (isEs ? "Error procesando agendamiento" : "Erro ao processar agendamento"),
        titleCreated: isEn ? "Schedule Created" : (isEs ? "Agendamiento Creado" : "Agendamento Criado"),
        title: isEn ? "Schedule Pickup" : (isEs ? "Agendar Recolección" : "Agendar Coleta"),
        carrierEmail: isEn ? "Carrier Email" : (isEs ? "Email Transportista" : "E-mail do Transportador"),
        emailHint: isEn ? "The scheduling link will be sent to this email" : (isEs ? "Link enviado a este email" : "O link de agendamento será enviado para este e-mail"),
        linkValidity: isEn ? "Link Validity (hours)" : (isEs ? "Validez del Link (horas)" : "Validade do Link (horas)"),
        validity24: isEn ? "24 hours" : (isEs ? "24 horas" : "24 horas"),
        validity48: isEn ? "48 hours (2 days)" : (isEs ? "48 horas (2 días)" : "48 horas (2 dias)"),
        validity72: isEn ? "72 hours (3 days)" : (isEs ? "72 horas (3 días)" : "72 horas (3 dias)"),
        validity120: isEn ? "120 hours (5 days)" : (isEs ? "120 horas (5 días)" : "120 horas (5 dias)"),
        validity168: isEn ? "168 hours (7 days)" : (isEs ? "168 horas (7 días)" : "168 horas (7 dias)"),
        createBtn: isEn ? "Create Schedule" : (isEs ? "Crear Agendamiento" : "Criar Agendamento"),
        createdSuccess: isEn ? "Schedule Created Successfully!" : (isEs ? "¡Agendamiento Creado con Éxito!" : "Agendamento Criado com Sucesso!"),
        linkSentTo: isEn ? "The link was sent to" : (isEs ? "Link enviado a" : "O link foi enviado para"),
        bookingLink: isEn ? "Scheduling Link" : (isEs ? "Link de Agendamiento" : "Link de Agendamento"),
        copyLinkBtn: isEn ? "Copy Link" : (isEs ? "Copiar Link" : "Copiar Link"),
        linkCopiedBtn: isEn ? "Link Copied!" : (isEs ? "¡Link Copiado!" : "Link Copiado!"),
        nextSteps: isEn ? "Next Steps" : (isEs ? "Próximos Pasos" : "Próximos Passos"),
        step1: isEn ? "The carrier will receive an email with the link" : (isEs ? "El transportista recibe un email" : "O transportador receberá um e-mail com o link de acesso"),
        step2: isEn ? "They can access the link to input date/time" : (isEs ? "Ellos informan hora/fecha" : "Ele poderá acessar o link e informar data/hora da coleta"),
        step3: isEn ? "You will be notified when confirmed" : (isEs ? "Se le notificará la confirmación" : "Você será notificado quando o agendamento for confirmado"),
        step4: isEn ? "Link expires in {{hours}} hours" : (isEs ? "Link expira en {{hours}} horas" : "O link expirará em {{hours}} horas")
      }
    }
  };
};

const locales = ['pt', 'en', 'es'];
locales.forEach(lang => {
  const p = path.join(__dirname, 'src', 'locales', lang, 'translation.json');
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const newKeys = buildTranslation(lang);
  
  data.invoices = { 
    ...data.invoices, 
    modals: newKeys.modals
  };
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  console.log(`Updated locale ${lang}`);
});

