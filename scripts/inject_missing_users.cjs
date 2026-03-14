const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const d = JSON.parse(content);

  // 1. Move roles
  if (d.users && d.users.form && d.users.form.roles) {
    if (!d.users.roles) {
      d.users.roles = d.users.form.roles;
    }
  }

  // 2. Add establishments filters
  if (d.establishments) {
    if (!d.establishments.filters) d.establishments.filters = {};
    if (!d.establishments.filters.allEstablishments) {
      if (lang === 'pt') d.establishments.filters.allEstablishments = 'Todos os Estabelecimentos';
      if (lang === 'en') d.establishments.filters.allEstablishments = 'All Establishments';
      if (lang === 'es') d.establishments.filters.allEstablishments = 'Todos los Establecimientos';
    }
  }

  if (d.users) {
    if (!d.users.view) d.users.view = {};
    if (!d.users.view.never) {
        d.users.view.never = lang === 'pt' ? 'Nunca' : (lang === 'en' ? 'Never' : 'Nunca');
    }
    if (!d.users.view.now) {
        d.users.view.now = lang === 'pt' ? 'Agora' : (lang === 'en' ? 'Now' : 'Ahora');
    }
    if (!d.users.view.hoursAgo) {
        d.users.view.hoursAgo = lang === 'pt' ? 'h atrás' : (lang === 'en' ? 'h ago' : 'h atrás');
    }
    if (!d.users.view.yesterday) {
        d.users.view.yesterday = lang === 'pt' ? 'Ontem' : (lang === 'en' ? 'Yesterday' : 'Ayer');
    }
    if (!d.users.view.loginAttempts) {
        d.users.view.loginAttempts = lang === 'pt' ? 'tentativa(s) de login' : (lang === 'en' ? 'login attempt(s)' : 'intento(s) de inicio de sesión');
    }
    if (!d.users.view.notLinked) {
        d.users.view.notLinked = lang === 'pt' ? 'Não vinculado' : (lang === 'en' ? 'Not linked' : 'No vinculado');
    }
    if (!d.users.view.permissionsConfigured) {
        d.users.view.permissionsConfigured = lang === 'pt' ? 'permissão(ões) configurada(s)' : (lang === 'en' ? 'permission(s) configured' : 'permiso(s) configurado(s)');
    }
    if (!d.users.blocked) d.users.blocked = {};
    if (!d.users.blocked.reasonMultiple) {
        d.users.blocked.reasonMultiple = lang === 'pt' ? 'Usuários bloqueados por múltiplas tentativas falhadas de login' : (lang === 'en' ? 'Users blocked due to multiple failed login attempts' : 'Usuarios bloqueados por múltiples intentos fallidos de inicio de sesión');
    }
    if (!d.users.view.emptyDept) {
        d.users.view.emptyDept = lang === 'pt' ? 'Não informado' : (lang === 'en' ? 'Not provided' : 'No informado');
    }
    if (!d.users.view.emptyPhone) {
        d.users.view.emptyPhone = lang === 'pt' ? 'Não informado' : (lang === 'en' ? 'Not provided' : 'No informado');
    }
    if (!d.users.view.lastLogin) {
        d.users.view.lastLogin = lang === 'pt' ? 'Último login' : (lang === 'en' ? 'Last login' : 'Último acceso');
    }
  }

  // Save changes
  fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
  console.log(`Updated ${lang}/translation.json successfully`);
});
