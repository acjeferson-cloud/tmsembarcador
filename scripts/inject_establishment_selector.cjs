const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const d = JSON.parse(content);

  // Users -> Establishments Selector tab
  if (!d.users.establishments) d.users.establishments = {};
  if (!d.users.establishments.title) {
    d.users.establishments.title = lang === 'pt' ? 'Estabelecimentos do Usuário' : (lang === 'en' ? 'User Establishments' : 'Establecimientos del Usuario');
  }
  if (!d.users.establishments.desc) {
    d.users.establishments.desc = lang === 'pt' 
      ? 'Selecione os estabelecimentos que este usuário poderá acessar. Após o login, o usuário deverá selecionar um dos estabelecimentos permitidos para iniciar o trabalho.' 
      : (lang === 'en' 
        ? 'Select the establishments this user can access. After logging in, the user must select one of the allowed establishments to start working.' 
        : 'Seleccione los establecimientos a los que este usuario podrá acceder. Después de iniciar sesión, el usuario deberá seleccionar uno de los establecimientos permitidos para comenzar a trabajar.');
  }
  if (!d.users.establishments.searchPlaceholder) {
    d.users.establishments.searchPlaceholder = lang === 'pt' ? 'Buscar estabelecimentos...' : (lang === 'en' ? 'Search establishments...' : 'Buscar establecimientos...');
  }
  if (!d.users.establishments.selectAll) {
    d.users.establishments.selectAll = lang === 'pt' ? 'Selecionar Todos' : (lang === 'en' ? 'Select All' : 'Seleccionar Todos');
  }
  if (!d.users.establishments.clearAll) {
    d.users.establishments.clearAll = lang === 'pt' ? 'Limpar Todos' : (lang === 'en' ? 'Clear All' : 'Limpiar Todos');
  }
  if (!d.users.establishments.tableEst) {
    d.users.establishments.tableEst = lang === 'pt' ? 'Estabelecimento' : (lang === 'en' ? 'Establishment' : 'Establecimiento');
  }
  if (!d.users.establishments.tableAccess) {
    d.users.establishments.tableAccess = lang === 'pt' ? 'Acesso' : (lang === 'en' ? 'Access' : 'Acceso');
  }
  if (!d.users.establishments.allowed) {
    d.users.establishments.allowed = lang === 'pt' ? 'Permitido' : (lang === 'en' ? 'Allowed' : 'Permitido');
  }
  if (!d.users.establishments.notAllowed) {
    d.users.establishments.notAllowed = lang === 'pt' ? 'Não permitido' : (lang === 'en' ? 'Not allowed' : 'No permitido');
  }
  if (!d.users.establishments.notFound) {
    d.users.establishments.notFound = lang === 'pt' ? 'Nenhum estabelecimento encontrado.' : (lang === 'en' ? 'No establishments found.' : 'No se encontraron establecimientos.');
  }
  if (!d.users.establishments.selectedCount) {
    d.users.establishments.selectedCount = lang === 'pt' ? 'estabelecimento(s) selecionado(s)' : (lang === 'en' ? 'establishment(s) selected' : 'establecimiento(s) seleccionado(s)');
  }

  // Address tab - ensuring the keys used in UserForm exist
  if (!d.establishments.form.address) d.establishments.form.address = {};
  if (!d.establishments.form.address.city) d.establishments.form.address.city = lang === 'pt' ? 'Cidade' : (lang === 'en' ? 'City' : 'Ciudad');
  if (!d.establishments.form.address.state) d.establishments.form.address.state = lang === 'pt' ? 'Estado' : (lang === 'en' ? 'State' : 'Estado');
  if (!d.establishments.form.address.neighborhood) d.establishments.form.address.neighborhood = lang === 'pt' ? 'Bairro' : (lang === 'en' ? 'Neighborhood' : 'Barrio');
  if (!d.establishments.form.address.street) d.establishments.form.address.street = lang === 'pt' ? 'Logradouro' : (lang === 'en' ? 'Street' : 'Dirección');
  if (!d.establishments.form.address.autoFilledByZipCode) d.establishments.form.address.autoFilledByZipCode = lang === 'pt' ? 'Preenchimento automático pelo CEP' : (lang === 'en' ? 'Auto-filled by Zip Code' : 'Autocompletado por Código Postal');
  if (!d.establishments.form.address.zipCode) d.establishments.form.address.zipCode = lang === 'pt' ? 'CEP' : (lang === 'en' ? 'Zip Code' : 'Código Postal');
  if (!d.establishments.form.address.successMessage) d.establishments.form.address.successMessage = lang === 'pt' ? 'Endereço encontrado: ' : (lang === 'en' ? 'Address found: ' : 'Dirección encontrada: ');
  if (!d.establishments.form.address.searchCep) d.establishments.form.address.searchCep = lang === 'pt' ? 'Buscar CEP' : (lang === 'en' ? 'Search Zip Code' : 'Buscar Código Postal');

  fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
  console.log(`Updated ${lang}/translation.json successfully`);
});
