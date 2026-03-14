const fs = require('fs');
const path = require('path');

const userCardPath = path.join(__dirname, '../src/components/Users/UserCard.tsx');
let content = fs.readFileSync(userCardPath, 'utf8');

// The naive replace of the dictionary might have caused an issue.
// Let's restore the code to handle it correctly using dynamic i18n variables if needed, 
// but since this is just a quick fix let's rewrite the objects cleanly

content = content.replace(
  /const roleConfig = \{[\s\S]*?const statusConfig = /g,
  `const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
    administrador: { label: t('users.roles.admin'), color: 'text-purple-700', bg: 'bg-purple-100' },
    gerente: { label: t('users.roles.manager'), color: 'text-blue-700', bg: 'bg-blue-100' },
    operador: { label: t('users.roles.operator'), color: 'text-green-700', bg: 'bg-green-100' },
    visualizador: { label: t('users.roles.viewer'), color: 'text-gray-700', bg: 'bg-gray-100' },
    personalizado: { label: t('users.roles.custom'), color: 'text-indigo-700', bg: 'bg-indigo-100' }
  };

  const statusConfig = `
);

content = content.replace(
  /const statusConfig: Record<string, \{ label: string; color: string; bg: string \}> = \{[\s\S]*?return \(/g,
  `const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    ativo: { label: t('users.filters.active'), color: 'text-green-700', bg: 'bg-green-100' },
    inativo: { label: t('users.filters.inactive'), color: 'text-gray-700', bg: 'bg-gray-100' },
    bloqueado: { label: t('users.filters.blocked'), color: 'text-red-700', bg: 'bg-red-100' }
  };

  return (`
);

content = content.replace(/>\{\(roleConfig\[user\.perfil\] \|\| roleConfig\.operador\)\.label\}<\/span>/g, ">{(roleConfig[user.perfil] || roleConfig.operador).label}</span>");
content = content.replace(/>\{\(statusConfig\[user\.status\] \|\| statusConfig\.ativo\)\.label\}<\/span>/g, ">{(statusConfig[user.status] || statusConfig.ativo).label}</span>");

fs.writeFileSync(userCardPath, content);

console.log('UserCard.tsx syntax corrected');
