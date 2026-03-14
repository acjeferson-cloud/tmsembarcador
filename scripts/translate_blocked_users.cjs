const fs = require('fs');
const path = require('path');

const blockedUsersPath = path.join(__dirname, '../src/components/Users/BlockedUsers.tsx');
let content = fs.readFileSync(blockedUsersPath, 'utf8');

if (!content.includes("import { useTranslation }")) {
  content = content.replace(
    "import { AlertTriangle, Unlock, Clock, AlertCircle } from 'lucide-react';",
    "import { AlertTriangle, Unlock, Clock, AlertCircle } from 'lucide-react';\nimport { useTranslation } from 'react-i18next';"
  );
}

if (!content.includes("const { t } = useTranslation();")) {
  content = content.replace(
    "export const BlockedUsers: React.FC<BlockedUsersProps> = ({ currentUserEmail }) => {",
    "export const BlockedUsers: React.FC<BlockedUsersProps> = ({ currentUserEmail }) => {\n  const { t } = useTranslation();"
  );
}

// Translate Table headers
content = content.replace(/>\s*Usuário\s*<\/th>/g, ">{t('users.table.name')}</th>");
content = content.replace(/>\s*Motivo do Bloqueio\s*<\/th>/g, ">{t('users.blocked.reason')}</th>");
content = content.replace(/>\s*Data do Bloqueio\s*<\/th>/g, ">{t('users.blocked.date')}</th>");
content = content.replace(/>\s*Ações\s*<\/th>/g, ">{t('users.table.actions')}</th>");

// Empty States
content = content.replace(/>\s*Nenhum usuário bloqueado no momento\.\s*<\/h3>/g, ">{t('users.blocked.emptyState')}</h3>");
content = content.replace(/>\s*Os usuários que excederem o limite de tentativas de login ou forem bloqueados manualmente aparecerão aqui\.\s*<\/p>/g, ">{t('users.blocked.emptyDesc')}</p>");

// Toast texts
content = content.replace(/'Usuário desbloqueado com sucesso'/g, "t('users.blocked.unlockSuccess')");
content = content.replace(/'Erro ao desbloquear usuário'/g, "t('users.blocked.unlockError')");

// Buttons & action
content = content.replace(/>\s*Desbloquear\s*<\/span>/g, ">{t('users.buttons.unblock')}</span>");
content = content.replace(/>\s*Desbloqueando\.\.\.\s*<\/span>/g, ">{t('users.blocked.unlocking')}</span>");

fs.writeFileSync(blockedUsersPath, content);
console.log('BlockedUsers.tsx translated');
