const fs = require('fs');
const path = require('path');

const userFormPath = path.join(__dirname, '../src/components/Users/UserForm.tsx');
let content = fs.readFileSync(userFormPath, 'utf8');

// Ensure useTranslation is imported and used
if (!content.includes("import { useTranslation }")) {
  content = content.replace(
    "import { Toast, ToastType } from '../common/Toast';",
    "import { Toast, ToastType } from '../common/Toast';\nimport { useTranslation } from 'react-i18next';"
  );
}

if (!content.includes("const { t } = useTranslation();")) {
  content = content.replace(
    "export const UserForm: React.FC<UserFormProps> = ({ onBack, onSave, user }) => {",
    "export const UserForm: React.FC<UserFormProps> = ({ onBack, onSave, user }) => {\n  const { t } = useTranslation();"
  );
}

// Replace Back button text
content = content.replace(
  /<span>Voltar para Usuários<\/span>/g,
  "<span>{t('users.buttons.back')} {t('users.title').toLowerCase()}</span>"
);

// Form titles
content = content.replace(
  /\{user \? 'Editar Usuário' : 'Novo Usuário'\}/g,
  "{user ? t('users.form.editTitle') : t('users.form.newTitle')}"
);

content = content.replace(
  /<p className="text-gray-600 dark:text-gray-400">Preencha os dados do usuário<\/p>/g,
  '<p className="text-gray-600 dark:text-gray-400">{user ? t(\'users.form.editSubtitle\') : t(\'users.form.newSubtitle\')}</p>'
);

// Protected user alert
content = content.replace(
  /<p className="text-sm text-yellow-800 font-medium">Usuário Protegido<\/p>/g,
  '<p className="text-sm text-yellow-800 font-medium">{t(\'users.form.hints.protectedUserTitle\')}</p>'
);
content = content.replace(
  /Este é o usuário administrador principal \(admin@tmsgestor\.com\)\. Algumas alterações podem ser restritas para manter a segurança do sistema\./g,
  "{t('users.form.hints.protectedUserDesc')}"
);

// Tabs
content = content.replace(/>Informações Básicas<\/span>/g, ">{t('users.form.tabs.basic')}</span>");
content = content.replace(/>Contato<\/span>/g, ">{t('users.form.tabs.contact')}</span>");
content = content.replace(/>Profissional<\/span>/g, ">{t('users.form.tabs.professional')}</span>");
content = content.replace(/>Acesso<\/span>/g, ">{t('users.form.tabs.access')}</span>");
content = content.replace(/>Estabelecimentos<\/span>/g, ">{t('users.form.tabs.establishments')}</span>");
content = content.replace(/>Endereço<\/span>/g, ">{t('users.form.tabs.address')}</span>");
content = content.replace(/>Permissões<\/span>/g, ">{t('users.form.tabs.permissions')}</span>");

// Tab content titles
content = content.replace(/<h2[^>]*>Informações Básicas<\/h2>/g, '<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(\'users.form.tabs.basic\')}</h2>');
content = content.replace(/<h2[^>]*>Informações de Contato<\/h2>/g, '<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(\'users.form.tabs.contact\')}</h2>');
content = content.replace(/<h2[^>]*>Informações Profissionais<\/h2>/g, '<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(\'users.form.tabs.professional\')}</h2>');
content = content.replace(/<h2[^>]*>Controle de Acesso<\/h2>/g, '<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(\'users.form.tabs.access\')}</h2>');
content = content.replace(/<h2[^>]*>Estabelecimentos do Usuário<\/h2>/g, '<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(\'users.form.tabs.establishments\')}</h2>');
content = content.replace(/<h2[^>]*>Endereço \(opcional\)<\/h2>/g, '<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(\'users.form.tabs.address\')} (opcional)</h2>');
content = content.replace(/<h2[^>]*>Configuração de Permissões<\/h2>/g, '<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(\'users.form.hints.customPermissionsTitle\')}</h2>');

// Basic Tab fields
content = content.replace(/Foto de Perfil/g, "{t('users.form.fields.avatar')}");
content = content.replace(/>Escolher Foto<\/span>/g, ">{t('users.buttons.choosePhoto')}</span>");
content = content.replace(/>Remover<\/span>/g, ">{t('users.buttons.remove')}</span>");
content = content.replace(/JPG, PNG, GIF ou WebP\. Máximo 5MB\./g, "{t('users.form.fields.avatarHint')}");

content = content.replace(/Código do Usuário \*/g, "{t('users.form.fields.code')} *");
content = content.replace(/>Código Gerado Automaticamente<\/p>/g, ">{t('users.form.hints.autoCodeTitle')}</p>");
content = content.replace(/>\s*Os códigos são gerados automaticamente de forma sequencial, iniciando em 0001\.\s*Este campo não pode ser editado manualmente\.\s*<\/p>/g, ">{t('users.form.hints.autoCodeDesc')}</p>");

content = content.replace(/Nome Completo \*/g, "{t('users.form.fields.name')} *");
content = content.replace(/Email \*/g, "{t('users.form.fields.email')} *");
content = content.replace(/>\s*CPF \*\s*<\/label>/g, "> {t('users.form.fields.cpf')} * </label>");

// Contact Tab fields
content = content.replace(/>\s*Telefone\s*<\/label>/g, "> {t('users.form.fields.phone')} </label>");
content = content.replace(/>\s*Celular\s*<\/label>/g, "> {t('users.form.fields.mobile')} </label>");
content = content.replace(/>\s*Data de Nascimento\s*<\/label>/g, "> {t('users.form.fields.birthDate')} </label>");

// Prof Tab fields
content = content.replace(/>\s*Cargo \*\s*<\/label>/g, "> {t('users.form.fields.position')} * </label>");
content = content.replace(/>\s*Departamento \*\s*<\/label>/g, "> {t('users.form.fields.department')} * </label>");
content = content.replace(/>\s*Data de Admissão \*\s*<\/label>/g, "> {t('users.form.fields.admissionDate')} * </label>");
content = content.replace(/>\s*Estabelecimento Principal\s*<\/label>/g, "> {t('users.form.fields.mainEstablishment')} </label>");
content = content.replace(/>\s*Observações Gerais\s*<\/label>/g, "> {t('users.form.fields.observations')} </label>");
content = content.replace(/>\s*Apenas estabelecimentos permitidos são exibidos nesta lista\.\s*<\/p>/g, ">{t('users.form.hints.establishmentLimitations')}</p>");

content = content.replace(/<option value="">Selecione o departamento<\/option>/g, "<option value=\"\">{t('common.select') || 'Selecione'} {t('users.form.fields.department').toLowerCase()}</option>");
content = content.replace(/<option value="">Selecione o estabelecimento<\/option>/g, "<option value=\"\">{t('common.select') || 'Selecione'} {t('establishments.title').toLowerCase()}</option>");

// Access Tab fields
content = content.replace(/>\s*Perfil de Acesso \*\s*<\/label>/g, "> {t('users.form.fields.role')} * </label>");
content = content.replace(/>\s*Status \*\s*<\/label>/g, "> {t('users.form.fields.status')} * </label>");
content = content.replace(/>\s*Idioma Preferido\s*<\/span>/g, "> {t('users.form.fields.preferredLanguage')} </span>");

content = content.replace(/>\s*\{user \? 'Nova Senha' : 'Senha \*'\}\s*<\/label>/g, "> {user ? t('users.form.fields.newPassword') : t('users.form.fields.password') + ' *'} </label>");
content = content.replace(/placeholder=\{user \? "Deixe em branco para manter a senha atual" : "Digite a senha"\}/g, "placeholder={user ? t('users.form.fields.passwordHint') : \"*****\"}");
content = content.replace(/>\s*\{user \? 'Confirmar Nova Senha' : 'Confirmar Senha \*'\}\s*<\/label>/g, "> {user ? t('users.form.fields.confirmNewPassword') : t('users.form.fields.confirmPassword') + ' *'} </label>");
content = content.replace(/placeholder="Confirme a senha"/g, 'placeholder="*****"');

// Niveis Access Info
content = content.replace(/>Níveis de Acesso<\/p>/g, ">{t('users.form.hints.accessLevelsTitle')}</p>");
content = content.replace(/>Administrador:<\/strong> Acesso total ao sistema/g, ">{t('users.roles.admin')}:</strong> {t('users.form.hints.accessAdmin')}");
content = content.replace(/>Gerente:<\/strong> Acesso a relatórios e gestão de operações/g, ">{t('users.roles.manager')}:</strong> {t('users.form.hints.accessManager')}");
content = content.replace(/>Operador:<\/strong> Acesso às funcionalidades operacionais/g, ">{t('users.roles.operator')}:</strong> {t('users.form.hints.accessOperator')}");
content = content.replace(/>Visualizador:<\/strong> Acesso apenas para consulta/g, ">{t('users.roles.viewer')}:</strong> {t('users.form.hints.accessViewer')}");
content = content.replace(/>Personalizado:<\/strong> Acesso customizado por funcionalidade/g, ">{t('users.roles.custom')}:</strong> {t('users.form.hints.accessCustom')}");

// Permissions hint mapping
content = content.replace(/<p className="text-sm text-green-800 font-medium">Configuração de Permissões Personalizadas<\/p>/g, "<p className=\"text-sm text-green-800 font-medium\">{t('users.form.hints.customPermissionsTitle')}</p>");
content = content.replace(/Você selecionou o perfil "Personalizado"\. Acesse a aba "Permissões" para configurar as permissões de acesso específicas para este usuário\./g, "{t('users.form.hints.customPermissionsDesc')}");

// Permissions info mapping 2
content = content.replace(/<p className="text-sm text-blue-800 font-medium">Permissões Personalizadas<\/p>/g, "<p className=\"text-sm text-blue-800 font-medium\">{t('users.roles.custom')}</p>");
content = content.replace(/Selecione as opções de menu que este usuário terá acesso\. Marque ou desmarque as caixas de seleção para configurar as permissões\.\s*Quando um menu pai é selecionado, todos os seus submenus são automaticamente incluídos\./g, "{t('users.form.hints.customPermissionsExtra')}");

// Role Dropdown
content = content.replace(/<option value="administrador">Administrador<\/option>/g, '<option value="administrador">{t(\'users.roles.admin\')}</option>');
content = content.replace(/<option value="gerente">Gerente<\/option>/g, '<option value="gerente">{t(\'users.roles.manager\')}</option>');
content = content.replace(/<option value="operador">Operador<\/option>/g, '<option value="operador">{t(\'users.roles.operator\')}</option>');
content = content.replace(/<option value="visualizador">Visualizador<\/option>/g, '<option value="visualizador">{t(\'users.roles.viewer\')}</option>');
content = content.replace(/<option value="personalizado">Personalizado<\/option>/g, '<option value="personalizado">{t(\'users.roles.custom\')}</option>');

// Status Dropdown
content = content.replace(/<option value="ativo">Ativo<\/option>/g, '<option value="ativo">{t(\'users.filters.active\')}</option>');
content = content.replace(/<option value="inativo">Inativo<\/option>/g, '<option value="inativo">{t(\'users.filters.inactive\')}</option>');
content = content.replace(/<option value="bloqueado">Bloqueado<\/option>/g, '<option value="bloqueado">{t(\'users.filters.blocked\')}</option>');

// Language Text
content = content.replace(/'Ao salvar, o idioma selecionado será aplicado imediatamente em todo o sistema \(menu, telas, botões, etc\.\)'/g, "t('users.form.hints.languageSaveHint')");
content = content.replace(/'Este idioma será usado para exibir o sistema para este usuário\.'/g, "t('users.form.hints.languageUserHint')");

// Address fields reuse
content = content.replace(/>\s*Cidade\s*<\/label>/g, "> {t('establishments.form.address.city') || 'Cidade'} </label>");
content = content.replace(/>\s*Estado \(UF\)\s*<\/label>/g, "> {t('establishments.form.address.state') || 'Estado (UF)'} </label>");
content = content.replace(/>\s*Bairro\s*<\/label>/g, "> {t('establishments.form.address.neighborhood') || 'Bairro'} </label>");
content = content.replace(/>\s*Logradouro \(Rua, Avenida, etc\.\)\s*<\/label>/g, "> {t('establishments.form.address.street') || 'Logradouro'} </label>");
content = content.replace(/placeholder="Preenchido automaticamente pelo CEP"/g, "placeholder={t('establishments.form.address.autoFilledByZipCode')}");

content = content.replace(/>\s*Busca Automática por CEP\s*<\/p>/g, ">{t('users.form.hints.autoZipSearch')}</p>");
content = content.replace(/Informe o CEP para preencher automaticamente cidade, estado e bairro\.\s*Os campos cidade e estado não podem ser editados manualmente\./g, "{t('users.form.hints.autoZipDesc')}");

// Submit Action Buttons
content = content.replace(/>\s*Cancelar\s*<\/button>/g, ">{t('users.buttons.cancel')}</button>");
content = content.replace(/\{user \? 'Atualizar' : 'Salvar'\} Usuário/g, "{user ? t('users.buttons.update') : t('users.buttons.save')} {t('users.title').slice(0, -1)}");

fs.writeFileSync(userFormPath, content);
console.log('UserForm.tsx translated successfully!');
