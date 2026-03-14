const fs = require('fs');
const path = require('path');

const userViewPath = path.join(__dirname, '../src/components/Users/UserView.tsx');
let content = fs.readFileSync(userViewPath, 'utf8');

if (!content.includes("import { useTranslation }")) {
  content = content.replace(
    "import { User, Shield, Phone, Mail, MapPin, Building, Calendar, Edit2, ArrowLeft } from 'lucide-react';",
    "import { User, Shield, Phone, Mail, MapPin, Building, Calendar, Edit2, ArrowLeft } from 'lucide-react';\nimport { useTranslation } from 'react-i18next';"
  );
}

if (!content.includes("const { t } = useTranslation();")) {
  content = content.replace(
    "export const UserView: React.FC<UserViewProps> = ({ user, onBack, onEdit }) => {",
    "export const UserView: React.FC<UserViewProps> = ({ user, onBack, onEdit }) => {\n  const { t } = useTranslation();"
  );
}

// Translate back button
content = content.replace(
  /<span>Voltar para Usuários<\/span>/g,
  "<span>{t('users.buttons.back')} {t('users.title').toLowerCase()}</span>"
);

content = content.replace(
  /<span>Editar<\/span>/g,
  "<span>{t('users.buttons.edit')}</span>"
);

// Sections
content = content.replace(/<h3[^>]*>Informações Pessoais<\/h3>/g, '<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(\'users.view.personalInfo\')}</h3>');
content = content.replace(/<h3[^>]*>Contato<\/h3>/g, '<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(\'users.view.contact\')}</h3>');
content = content.replace(/<h3[^>]*>Informações Profissionais<\/h3>/g, '<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(\'users.view.professional\')}</h3>');
content = content.replace(/<h3[^>]*>Acesso ao Sistema<\/h3>/g, '<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(\'users.view.system\')}</h3>');

// Fields
content = content.replace(/>\s*Nome\s*<\/p>/g, ">{t('users.table.name')}</p>");
content = content.replace(/>\s*Email\s*<\/p>/g, ">{t('users.form.fields.email')}</p>");
content = content.replace(/>\s*Não informado\s*<\/p>/g, ">{t('users.view.emptyPhone')}</p>");
content = content.replace(/>\s*Cargo\s*<\/p>/g, ">{t('users.form.fields.position')}</p>");
content = content.replace(/>\s*Departamento\s*<\/p>/g, ">{t('users.form.fields.department')}</p>");
content = content.replace(/>\s*Status\s*<\/p>/g, ">{t('users.table.status')}</p>");
content = content.replace(/>\s*Perfil de Acesso\s*<\/p>/g, ">{t('users.form.fields.role')}</p>");
content = content.replace(/>\s*Último acesso\s*<\/p>/g, ">{t('users.view.lastLogin')}</p>");

// Status mapping
content = content.replace(/user\.status === 'ativo' \? 'Ativo' :/g, "user.status === 'ativo' ? t('users.filters.active') :");
content = content.replace(/user\.status === 'inativo' \? 'Inativo' :/g, "user.status === 'inativo' ? t('users.filters.inactive') :");
content = content.replace(/'Bloqueado'/g, "t('users.filters.blocked')");

// Role mapping
content = content.replace(/user\.perfil \? user\.perfil\.charAt\(0\)\.toUpperCase\(\) \+ user\.perfil\.slice\(1\) : '-'/g, 
  "user.perfil ? t(`users.roles.${user.perfil === 'personalizado' ? 'custom' : user.perfil === 'administrador' ? 'admin' : user.perfil === 'gerente' ? 'manager' : user.perfil === 'operador' ? 'operator' : 'viewer'}`) : '-'");

fs.writeFileSync(userViewPath, content);
console.log('UserView.tsx translated');
