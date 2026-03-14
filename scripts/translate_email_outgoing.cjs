const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/establishments/EmailOutgoingConfig.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add useTranslation import
if (!content.includes('useTranslation')) {
  content = content.replace(
    "import { Toast, ToastType } from '../common/Toast';",
    "import { Toast, ToastType } from '../common/Toast';\nimport { useTranslation } from 'react-i18next';"
  );
}

// Add hook inside component
if (!content.includes('const { t } = useTranslation()')) {
  content = content.replace(
    'const [config, setConfig]',
    'const { t } = useTranslation();\n  const [config, setConfig]'
  );
}

// Replace texts
const replacements = [
  ["'Erro ao carregar configuração'", "t('establishments.form.emailOutgoing.messages.loadError')"],
  ["'Preencha todos os campos obrigatórios'", "t('establishments.form.emailOutgoing.messages.fillRequired')"],
  ["'E-mail remetente inválido'", "t('establishments.form.emailOutgoing.messages.invalidSenderEmail')"],
  ["'Configuração atualizada com sucesso!'", "t('establishments.form.emailOutgoing.messages.updateSuccess')"],
  ["'Configuração criada com sucesso!'", "t('establishments.form.emailOutgoing.messages.createSuccess')"],
  ["'Erro ao salvar configuração'", "t('establishments.form.emailOutgoing.messages.saveError')"],
  ["'Digite um e-mail para teste'", "t('establishments.form.emailOutgoing.messages.typeTestEmail')"],
  ["'E-mail inválido'", "t('establishments.form.emailOutgoing.messages.invalidTestEmail')"],
  ["'Salve a configuração antes de testar'", "t('establishments.form.emailOutgoing.messages.saveBeforeTest')"],
  ["'Erro ao testar envio de e-mail'", "t('establishments.form.emailOutgoing.messages.testError')"],
  ["<h3 className=\"text-2xl font-bold\">Configuração de E-mail de Saída</h3>", "<h3 className=\"text-2xl font-bold\">{t('establishments.form.emailOutgoing.title')}</h3>"],
  ["Configure as credenciais SMTP para envio de e-mails do sistema (notificações, NPS, alertas, etc.)", "{t('establishments.form.emailOutgoing.subtitle')}"],
  ["<h4 className=\"text-lg font-semibold text-gray-900 dark:text-white\">Configuração Atual</h4>", "<h4 className=\"text-lg font-semibold text-gray-900 dark:text-white\">{t('establishments.form.emailOutgoing.currentConfig')}</h4>"],
  ["Ativa", "{t('establishments.form.emailOutgoing.active')}"],
  ["Testada", "{t('establishments.form.emailOutgoing.tested')}"],
  ["Servidor SMTP", "{t('establishments.form.emailOutgoing.smtpServer')}"],
  ["Segurança", "{t('establishments.form.emailOutgoing.security')}"],
  ["Usuário SMTP", "{t('establishments.form.emailOutgoing.smtpUser')}"],
  ["Tipo de Autenticação", "{t('establishments.form.emailOutgoing.authType')}"],
  ["E-mail Remetente", "{t('establishments.form.emailOutgoing.senderEmail')}"],
  ["Nome do Remetente", "{t('establishments.form.emailOutgoing.senderName')}"],
  [">Editar Configuração<", ">{t('establishments.form.emailOutgoing.editConfig')}<"],
  [">Testar Envio de E-mail<", ">{t('establishments.form.emailOutgoing.testEmail')}<"],
  ["'Editar Configuração' : 'Nova Configuração'", "t('establishments.form.emailOutgoing.editConfig') : t('establishments.buttons.new')"],
  [">Cancelar<", ">{t('establishments.buttons.cancel')}<"],
  [">Salvar Configuração<", ">{t('establishments.buttons.save')}<"],
  ["Salvando...", "{t('establishments.buttons.save')}..."]
];

for (const [search, replace] of replacements) {
  content = content.split(search).join(replace);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ EmailOutgoingConfig.tsx translated successfully!');
