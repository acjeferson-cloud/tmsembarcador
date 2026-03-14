const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const d = JSON.parse(content);

  // UserView Translations
  if (!d.userView) d.userView = {};
  
  // General Buttons and Titles
  if (!d.userView.back) d.userView.back = lang === 'pt' ? 'Voltar para Usuários' : (lang === 'en' ? 'Back to Users' : 'Volver a los Usuarios');
  if (!d.userView.title) d.userView.title = lang === 'pt' ? 'Detalhes do Usuário' : (lang === 'en' ? 'User Details' : 'Detalles del Usuario');
  if (!d.userView.subtitle) d.userView.subtitle = lang === 'pt' ? 'Visualize as informações completas do usuário' : (lang === 'en' ? 'View complete user information' : 'Ver información completa del usuario');
  if (!d.userView.edit) d.userView.edit = lang === 'pt' ? 'Editar Usuário' : (lang === 'en' ? 'Edit User' : 'Editar Usuario');
  if (!d.userView.protectedUser) d.userView.protectedUser = lang === 'pt' ? 'Usuário Protegido (Sistema)' : (lang === 'en' ? 'Protected User (System)' : 'Usuario Protegido (Sistema)');

  // Tabs
  if (!d.userView.tabs) d.userView.tabs = {};
  if (!d.userView.tabs.details) d.userView.tabs.details = lang === 'pt' ? 'Detalhes Básicos' : (lang === 'en' ? 'Basic Details' : 'Detalles Básicos');
  if (!d.userView.tabs.permissions) d.userView.tabs.permissions = lang === 'pt' ? 'Permissões de Acesso' : (lang === 'en' ? 'Access Permissions' : 'Permisos de Acceso');
  if (!d.userView.tabs.establishments) d.userView.tabs.establishments = lang === 'pt' ? 'Estabelecimentos Permitidos' : (lang === 'en' ? 'Allowed Establishments' : 'Establecimientos Permitidos');

  // Fields
  if (!d.userView.fields) d.userView.fields = {};
  if (!d.userView.fields.email) d.userView.fields.email = lang === 'pt' ? 'E-mail Corporativo' : (lang === 'en' ? 'Corporate Email' : 'Correo Corporativo');
  if (!d.userView.fields.cpf) d.userView.fields.cpf = lang === 'pt' ? 'CPF' : (lang === 'en' ? 'CPF' : 'RUT/DNI');
  if (!d.userView.fields.status) d.userView.fields.status = lang === 'pt' ? 'Status' : (lang === 'en' ? 'Status' : 'Estado');
  if (!d.userView.fields.profile) d.userView.fields.profile = lang === 'pt' ? 'Perfil de Acesso' : (lang === 'en' ? 'Access Profile' : 'Perfil de Acceso');
  if (!d.userView.fields.companyTime) d.userView.fields.companyTime = lang === 'pt' ? 'Tempo de empresa' : (lang === 'en' ? 'Time in company' : 'Tiempo en la empresa');
  if (!d.userView.fields.phone) d.userView.fields.phone = lang === 'pt' ? 'Telefone Fixo' : (lang === 'en' ? 'Landline' : 'Teléfono Fijo');
  if (!d.userView.fields.cellphone) d.userView.fields.cellphone = lang === 'pt' ? 'Celular / WhatsApp' : (lang === 'en' ? 'Cellphone / WhatsApp' : 'Celular / WhatsApp');
  if (!d.userView.fields.role) d.userView.fields.role = lang === 'pt' ? 'Cargo/Função' : (lang === 'en' ? 'Role/Function' : 'Cargo/Función');
  if (!d.userView.fields.department) d.userView.fields.department = lang === 'pt' ? 'Departamento/Setor' : (lang === 'en' ? 'Department/Sector' : 'Departamento/Sector');
  if (!d.userView.fields.admissionDate) d.userView.fields.admissionDate = lang === 'pt' ? 'Data de Admissão' : (lang === 'en' ? 'Admission Date' : 'Fecha de Admisión');
  if (!d.userView.fields.accessProfile) d.userView.fields.accessProfile = lang === 'pt' ? 'Perfil de Acesso' : (lang === 'en' ? 'Access Profile' : 'Perfil de Acceso');
  if (!d.userView.fields.mainEstablishment) d.userView.fields.mainEstablishment = lang === 'pt' ? 'Estabelecimento Principal (Padrão)' : (lang === 'en' ? 'Main Establishment (Default)' : 'Establecimiento Principal (Predeterminado)');
  if (!d.userView.fields.lastLogin) d.userView.fields.lastLogin = lang === 'pt' ? 'Último acesso ao sistema' : (lang === 'en' ? 'Last system access' : 'Último acceso al sistema');
  if (!d.userView.fields.birthDate) d.userView.fields.birthDate = lang === 'pt' ? 'Data de Nascimento' : (lang === 'en' ? 'Birth Date' : 'Fecha de Nacimiento');
  if (!d.userView.fields.address) d.userView.fields.address = lang === 'pt' ? 'Endereço Residencial' : (lang === 'en' ? 'Residential Address' : 'Dirección Residencial');
  if (!d.userView.fields.loginAttempts) d.userView.fields.loginAttempts = lang === 'pt' ? 'Tentativas de Login Falhas' : (lang === 'en' ? 'Failed Login Attempts' : 'Intentos de Inicio de Sesión Fallidos');
  if (!d.userView.fields.accountStatus) d.userView.fields.accountStatus = lang === 'pt' ? 'Status da Conta' : (lang === 'en' ? 'Account Status' : 'Estado de la Cuenta');
  if (!d.userView.fields.accessLevel) d.userView.fields.accessLevel = lang === 'pt' ? 'Nível de Acesso' : (lang === 'en' ? 'Access Level' : 'Nivel de Acceso');
  if (!d.userView.fields.createdBy) d.userView.fields.createdBy = lang === 'pt' ? 'Criado por' : (lang === 'en' ? 'Created by' : 'Creado por');
  if (!d.userView.fields.createdAt) d.userView.fields.createdAt = lang === 'pt' ? 'Criado em' : (lang === 'en' ? 'Created at' : 'Creado en');
  if (!d.userView.fields.updatedBy) d.userView.fields.updatedBy = lang === 'pt' ? 'Última atualização por' : (lang === 'en' ? 'Last update by' : 'Última actualización por');
  if (!d.userView.fields.updatedAt) d.userView.fields.updatedAt = lang === 'pt' ? 'Última atualização em' : (lang === 'en' ? 'Last update at' : 'Última actualización en');

  // Values
  if (!d.userView.values) d.userView.values = {};
  if (!d.userView.values.never) d.userView.values.never = lang === 'pt' ? 'Nunca acessou' : (lang === 'en' ? 'Never accessed' : 'Nunca accedió');
  if (!d.userView.values.notLinked) d.userView.values.notLinked = lang === 'pt' ? 'Não vinculado a nenhum estabelecimento' : (lang === 'en' ? 'Not linked to any establishment' : 'No vinculado a ningún establecimiento');
  if (!d.userView.values.yearsOld) d.userView.values.yearsOld = lang === 'pt' ? 'anos' : (lang === 'en' ? 'years old' : 'años');
  if (!d.userView.securityAlerts) d.userView.securityAlerts = {};
  if (!d.userView.securityAlerts.title) d.userView.securityAlerts.title = lang === 'pt' ? 'Alerta de Segurança' : (lang === 'en' ? 'Security Alert' : 'Alerta de Seguridad');
  if (!d.userView.securityAlerts.attempts) d.userView.securityAlerts.attempts = lang === 'pt' ? 'Este usuário possui {{attempts}} tentativas falhas recentes. ' : (lang === 'en' ? 'This user has {{attempts}} recent failed attempts. ' : 'Este usuario tiene {{attempts}} intentos fallidos recientes. ');
  if (!d.userView.securityAlerts.autoBlocked) d.userView.securityAlerts.autoBlocked = lang === 'pt' ? 'A conta foi bloqueada automaticamente.' : (lang === 'en' ? 'The account has been automatically blocked.' : 'La cuenta ha sido bloqueada automáticamente.');
  if (!d.userView.securityAlerts.willBlock) d.userView.securityAlerts.willBlock = lang === 'pt' ? 'Mais tentativas bloquearão a conta.' : (lang === 'en' ? 'More attempts will block the account.' : 'Más intentos bloquearán la cuenta.');
  if (!d.userView.securityAlerts.blockedTitle) d.userView.securityAlerts.blockedTitle = lang === 'pt' ? 'Usuário Bloqueado' : (lang === 'en' ? 'User Blocked' : 'Usuario Bloqueado');
  if (!d.userView.securityAlerts.blockedDesc) d.userView.securityAlerts.blockedDesc = lang === 'pt' ? 'Este usuário não pode acessar o sistema no momento. Um administrador deve editar o perfil para remover o bloqueio ou redefinir a senha.' : (lang === 'en' ? 'This user cannot access the system at the moment. An administrator must edit the profile to remove the block or reset the password.' : 'Este usuario no puede acceder al sistema en este momento. Un administrador debe editar el perfil para eliminar el bloqueo o restablecer la contraseña.');
  if (!d.userView.audit) d.userView.audit = {};
  if (!d.userView.audit.userNumber) d.userView.audit.userNumber = lang === 'pt' ? 'Usuário #{{id}}' : (lang === 'en' ? 'User #{{id}}' : 'Usuario #{{id}}');

  // Sections
  if (!d.userView.sections) d.userView.sections = {};
  if (!d.userView.sections.contact) d.userView.sections.contact = lang === 'pt' ? 'Informações de Contato' : (lang === 'en' ? 'Contact Information' : 'Información de Contacto');
  if (!d.userView.sections.professional) d.userView.sections.professional = lang === 'pt' ? 'Informações Profissionais e de Acesso' : (lang === 'en' ? 'Professional and Access Information' : 'Información Profesional y de Acceso');
  if (!d.userView.sections.personal) d.userView.sections.personal = lang === 'pt' ? 'Informações Pessoais' : (lang === 'en' ? 'Personal Information' : 'Información Personal');
  if (!d.userView.sections.security) d.userView.sections.security = lang === 'pt' ? 'Segurança e Acesso' : (lang === 'en' ? 'Security and Access' : 'Seguridad y Acceso');
  if (!d.userView.sections.audit) d.userView.sections.audit = lang === 'pt' ? 'Informações de Auditoria' : (lang === 'en' ? 'Audit Information' : 'Información de Auditoría');
  if (!d.userView.sections.observations) d.userView.sections.observations = lang === 'pt' ? 'Observações e Anotações' : (lang === 'en' ? 'Observations and Notes' : 'Observaciones y Notas');
  if (!d.userView.sections.customPermissions) d.userView.sections.customPermissions = lang === 'pt' ? 'Gerenciamento de Permissões' : (lang === 'en' ? 'Permissions Management' : 'Gestión de Permisos');
  if (!d.userView.sections.permittedEstablishments) d.userView.sections.permittedEstablishments = lang === 'pt' ? 'Estabelecimentos Permitidos' : (lang === 'en' ? 'Allowed Establishments' : 'Establecimientos Permitidos');

  // Permissions Sub-section
  if (!d.userView.permissions) d.userView.permissions = {};
  if (!d.userView.permissions.customProfileTitle) d.userView.permissions.customProfileTitle = lang === 'pt' ? 'Perfil Personalizado' : (lang === 'en' ? 'Custom Profile' : 'Perfil Personalizado');
  if (!d.userView.permissions.customProfileDesc) d.userView.permissions.customProfileDesc = lang === 'pt' ? 'Este usuário possui permissões específicas definidas individualmente, não seguindo nenhum papel padrão do sistema.' : (lang === 'en' ? 'This user has specific permissions defined individually, not following any standard system role.' : 'Este usuario tiene permisos específicos definidos individualmente, no siguiendo ningún rol estándar del sistema.');
  if (!d.userView.permissions.menu) d.userView.permissions.menu = lang === 'pt' ? 'Menu / Funcionalidade' : (lang === 'en' ? 'Menu / Functionality' : 'Menú / Funcionalidad');
  if (!d.userView.permissions.permission) d.userView.permissions.permission = lang === 'pt' ? 'Permissão' : (lang === 'en' ? 'Permission' : 'Permiso');
  if (!d.userView.permissions.permitted) d.userView.permissions.permitted = lang === 'pt' ? 'Permitido' : (lang === 'en' ? 'Allowed' : 'Permitido');
  if (!d.userView.permissions.partial) d.userView.permissions.partial = lang === 'pt' ? 'Parcial' : (lang === 'en' ? 'Partial' : 'Parcial');
  if (!d.userView.permissions.notPermitted) d.userView.permissions.notPermitted = lang === 'pt' ? 'Bloqueado' : (lang === 'en' ? 'Blocked' : 'Bloqueado');
  if (!d.userView.permissions.summary) d.userView.permissions.summary = lang === 'pt' ? 'Resumo de Permissões' : (lang === 'en' ? 'Permissions Summary' : 'Resumen de Permisos');
  if (!d.userView.permissions.totalPermissions) d.userView.permissions.totalPermissions = lang === 'pt' ? 'Total de Permissões' : (lang === 'en' ? 'Total Permissions' : 'Total de Permisos');
  if (!d.userView.permissions.mainMenus) d.userView.permissions.mainMenus = lang === 'pt' ? 'Menus Principais' : (lang === 'en' ? 'Main Menus' : 'Menús Principales');
  if (!d.userView.permissions.submenus) d.userView.permissions.submenus = lang === 'pt' ? 'Submenus' : (lang === 'en' ? 'Submenus' : 'Submenús');
  
  // Establishments Sub-section
  if (!d.userView.establishments) d.userView.establishments = {};
  if (!d.userView.establishments.restrictedAccessTitle) d.userView.establishments.restrictedAccessTitle = lang === 'pt' ? 'Acesso Restrito a Estabelecimentos' : (lang === 'en' ? 'Restricted Access to Establishments' : 'Acceso Restringido a Establecimientos');
  if (!d.userView.establishments.restrictedAccessDesc) d.userView.establishments.restrictedAccessDesc = lang === 'pt' ? 'O acesso do usuário está limitado apenas aos estabelecimentos listados abaixo. Ele não poderá visualizar dados de outras unidades.' : (lang === 'en' ? 'The user\'s access is limited only to the establishments listed below. They will not be able to view data from other units.' : 'El acceso del usuario está limitado solo a los establecimientos enumerados a continuación. No podrá visualizar datos de otras unidades.');
  if (!d.userView.establishments.listTitle) d.userView.establishments.listTitle = lang === 'pt' ? 'Locais com Acesso Permitido' : (lang === 'en' ? 'Locations with Allowed Access' : 'Lugares con Acceso Permitido');
  if (!d.userView.establishments.mainTitle) d.userView.establishments.mainTitle = lang === 'pt' ? 'Estabelecimento Principal' : (lang === 'en' ? 'Main Establishment' : 'Establecimiento Principal');
  if (!d.userView.establishments.mainDescHas) d.userView.establishments.mainDescHas = lang === 'pt' ? 'O estabelecimento padrão para login é' : (lang === 'en' ? 'The default establishment for login is' : 'El establecimiento predeterminado para iniciar sesión es');
  if (!d.userView.establishments.mainDescHasNot) d.userView.establishments.mainDescHasNot = lang === 'pt' ? 'O usuário não possui um estabelecimento padrão configurado.' : (lang === 'en' ? 'The user does not have a default establishment configured.' : 'El usuario no tiene un establecimiento predeterminado configurado.');
  if (!d.userView.establishments.summaryPermitted) d.userView.establishments.summaryPermitted = lang === 'pt' ? 'unidade(s) permitida(s)' : (lang === 'en' ? 'allowed unit(s)' : 'unidad(es) permitida(s)');
  if (!d.userView.establishments.summaryTotal) d.userView.establishments.summaryTotal = lang === 'pt' ? 'unidades totais cadastradas' : (lang === 'en' ? 'total registered units' : 'unidades totales registradas');

  fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
  console.log(`Updated ${lang}/translation.json successfully`);
});
