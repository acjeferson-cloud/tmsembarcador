const fs = require('fs');
const path = require('path');

const usersTsxPath = path.join(__dirname, '../src/components/Users/Users.tsx');
let content = fs.readFileSync(usersTsxPath, 'utf8');

// Replace standard texts
content = content.replace(/'Mostrando \$\{startIndex \+ 1\} a \$\{Math.min\(startIndex \+ itemsPerPage, filteredUsers.length\)\} de \$\{filteredUsers.length\} usuários'/g, 
  "`${t('users.stats.showing')} ${startIndex + 1} ${t('users.stats.to')} ${Math.min(startIndex + itemsPerPage, filteredUsers.length)} ${t('users.stats.of')} ${filteredUsers.length} ${t('users.stats.users')}`");

content = content.replace(/>\{t\('loading'\)\}<\/div>/g, 
  ">{t('loading')}</div>"); // Already translated? Wait, let's just make sure.

content = content.replace(/<span>Total: \{filteredUsers.length\} usuários<\/span>/g,
  "<span>{t('users.stats.total')}: {filteredUsers.length} {t('users.stats.users')}</span>");

content = content.replace(/<span>Página \{currentPage\} de \{totalPages\}<\/span>/g,
  "<span>{t('users.stats.page')} {currentPage} {t('users.stats.of')} {totalPages}</span>");

content = content.replace(/<span>\{stats\.status\.ativos\} ativos<\/span>/g,
  "<span>{stats.status.ativos} {t('users.stats.activeText')}</span>");

content = content.replace(/<span>\{stats\.status\.bloqueados\} bloqueados<\/span>/g,
  "<span>{stats.status.bloqueados} {t('users.stats.blockedText')}</span>");

content = content.replace(/>Total<\/p>/g,
  ">{t('users.stats.total')}</p>");

content = content.replace(/>Administradores<\/p>/g,
  ">{t('users.roles.admin')}</p>");

content = content.replace(/>Personalizados<\/p>/g,
  ">{t('users.roles.custom')}</p>");

// Security Section
content = content.replace(/>Segurança e Controle de Acesso<\/h3>/g,
  ">{t('users.stats.securityAccessTitle')}</h3>");

content = content.replace(/>\s*O sistema possui controle rigoroso de acesso com diferentes níveis de permissão e monitoramento de atividades\.\s*<\/p>/g,
  ">{t('users.stats.securityAccessDesc')}</p>");

content = content.replace(/>Perfis de Acesso<\/p>/g,
  ">{t('users.stats.accessProfiles')}</p>");

content = content.replace(/>5 níveis de permissão<\/p>/g,
  ">{t('users.stats.accessProfilesLen')}</p>");

content = content.replace(/>Permissões<\/p>/g,
  ">{t('users.stats.permissions')}</p>");

content = content.replace(/>Controle granular<\/p>/g,
  ">{t('users.stats.permissionsGranular')}</p>");

content = content.replace(/>Bloqueio Automático<\/p>/g,
  ">{t('users.stats.autoBlock')}</p>");

content = content.replace(/>Após 5 tentativas<\/p>/g,
  ">{t('users.stats.autoBlockAfter')}</p>");

content = content.replace(/>Auditoria<\/p>/g,
  ">{t('users.stats.audit')}</p>");

content = content.replace(/>Log de atividades<\/p>/g,
  ">{t('users.stats.auditLog')}</p>");

content = content.replace(/>Proteção Admin<\/p>/g,
  ">{t('users.stats.adminProtect')}</p>");

content = content.replace(/>Usuário protegido<\/p>/g,
  ">{t('users.stats.adminProtectUser')}</p>");

// Pagination Buttons
content = content.replace(/>\s*Anterior\s*<\/button>/g,
  ">{t('common.previous') || 'Anterior'}</button>");

content = content.replace(/>\s*Próximo\s*<\/button>/g,
  ">{t('common.next') || 'Próximo'}</button>");

// Filters Dropdowns Options
content = content.replace(/<option value="administrador">Administrador<\/option>/g,
  '<option value="administrador">{t(\'users.roles.admin\')}</option>');

content = content.replace(/<option value="gerente">Gerente<\/option>/g,
  '<option value="gerente">{t(\'users.roles.manager\')}</option>');

content = content.replace(/<option value="operador">Operador<\/option>/g,
  '<option value="operador">{t(\'users.roles.operator\')}</option>');

content = content.replace(/<option value="visualizador">Visualizador<\/option>/g,
  '<option value="visualizador">{t(\'users.roles.viewer\')}</option>');

content = content.replace(/<option value="personalizado">Personalizado<\/option>/g,
  '<option value="personalizado">{t(\'users.roles.custom\')}</option>');

content = content.replace(/'Todos os Estabelecimentos'/g,
  "t('establishments.filters.allEstablishments') || 'Todos os Estabelecimentos'");

// Write back to file
fs.writeFileSync(usersTsxPath, content);
console.log('Translated Users.tsx');
