import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, '../src/locales');

const newTranslationsPt = {
  carriers: {
    form: {
      companyNameLabel: "Razão Social",
      stateRegistration: "Inscrição Estadual",
      fantasyName: "Nome Fantasia",
      email: "E-mail",
      phone: "Telefone",
      statusLabel: "Status *",
      activeText: "Ativo",
      inactiveText: "Inativo",
      logoLabel: "Logotipo",
      logoHelpDrop: "Clique para fazer upload do logotipo",
      transportModalsTitle: "Modais de Transporte",
      transportModalsHelp: "Selecione os modais atendidos por este transportador:",
      workingDaysConfig: "Configuração de Dias Úteis",
      workingDaysHelp: "Defina como o transportador considera dias úteis para cálculo de prazos de entrega:",
      saturdayWorkingDay: "Considera sábado como dia útil",
      saturdayWorkingDayHelp: "Quando marcado, sábados serão contados no prazo de entrega",
      sundayWorkingDay: "Considera domingo como dia útil",
      sundayWorkingDayHelp: "Quando marcado, domingos serão contados no prazo de entrega",
      holidaysWorkingDay: "Considera feriados no cálculo de prazos",
      holidaysWorkingDayHelp: "Quando marcado, feriados (nacionais, estaduais e municipais) não serão contados como dias úteis",
      addressTitle: "Endereço",
      zipCode: "CEP",
      searchZipCode: "Buscar CEP",
      countryLabel: "País",
      selectCountry: "Selecione o país",
      stateLabel: "Estado",
      selectState: "Selecione o estado",
      cityLabel: "Cidade",
      selectCity: "Selecione a cidade",
      neighborhoodLabel: "Bairro",
      complementLabel: "Complemento",
      streetLabel: "Logradouro",
      numberLabel: "Número",
      save: "Salvar",
      update: "Atualizar",
      carrierTerm: "Transportador",
      cancel: "Cancelar",
      errorInCode: "Erro no código:"
    }
  }
};

const newTranslationsEn = {
  carriers: {
    form: {
      companyNameLabel: "Company Name",
      stateRegistration: "State Registration",
      fantasyName: "Fantasy Name",
      email: "E-mail",
      phone: "Phone",
      statusLabel: "Status *",
      activeText: "Active",
      inactiveText: "Inactive",
      logoLabel: "Logo",
      logoHelpDrop: "Click to upload logo",
      transportModalsTitle: "Transport Modals",
      transportModalsHelp: "Select the transport modals met by this carrier:",
      workingDaysConfig: "Working Days Configuration",
      workingDaysHelp: "Define how the carrier considers working days for calculating delivery times:",
      saturdayWorkingDay: "Considers Saturday as a working day",
      saturdayWorkingDayHelp: "When checked, Saturdays will be counted in the delivery time",
      sundayWorkingDay: "Considers Sunday as a working day",
      sundayWorkingDayHelp: "When checked, Sundays will be counted in the delivery time",
      holidaysWorkingDay: "Considers holidays in calculating deadlines",
      holidaysWorkingDayHelp: "When checked, holidays (national, state and municipal) will not be counted as working days",
      addressTitle: "Address",
      zipCode: "ZIP Code",
      searchZipCode: "Search ZIP Code",
      countryLabel: "Country",
      selectCountry: "Select country",
      stateLabel: "State",
      selectState: "Select state",
      cityLabel: "City",
      selectCity: "Select city",
      neighborhoodLabel: "Neighborhood",
      complementLabel: "Complement",
      streetLabel: "Street",
      numberLabel: "Number",
      save: "Save",
      update: "Update",
      carrierTerm: "Carrier",
      cancel: "Cancel",
      errorInCode: "Error in code:"
    }
  }
};

const newTranslationsEs = {
  carriers: {
    form: {
      companyNameLabel: "Razón Social",
      stateRegistration: "Inscripción Estatal",
      fantasyName: "Nombre Comercial",
      email: "Correo electrónico",
      phone: "Teléfono",
      statusLabel: "Estado *",
      activeText: "Activo",
      inactiveText: "Inactivo",
      logoLabel: "Logotipo",
      logoHelpDrop: "Haga clic para subir el logotipo",
      transportModalsTitle: "Modalidades de Transporte",
      transportModalsHelp: "Seleccione las modalidades atendidas por este transportista:",
      workingDaysConfig: "Configuración de Días Hábiles",
      workingDaysHelp: "Defina cómo el transportista considera los días hábiles para el cálculo de los plazos de entrega:",
      saturdayWorkingDay: "Considera el sábado como día hábil",
      saturdayWorkingDayHelp: "Cuando esté marcado, los sábados se contarán en el plazo de entrega",
      sundayWorkingDay: "Considera el domingo como día hábil",
      sundayWorkingDayHelp: "Cuando esté marcado, los domingos se contarán en el plazo de entrega",
      holidaysWorkingDay: "Considera feriados en el cálculo de plazos",
      holidaysWorkingDayHelp: "Cuando esté marcado, los feriados (nacionales, estatales y municipales) no se contarán como días hábiles",
      addressTitle: "Dirección",
      zipCode: "Código Postal",
      searchZipCode: "Buscar Código Postal",
      countryLabel: "País",
      selectCountry: "Seleccione el país",
      stateLabel: "Estado",
      selectState: "Seleccione el estado",
      cityLabel: "Ciudad",
      selectCity: "Seleccione la ciudad",
      neighborhoodLabel: "Barrio",
      complementLabel: "Complemento",
      streetLabel: "Calle",
      numberLabel: "Número",
      save: "Guardar",
      update: "Actualizar",
      carrierTerm: "Transportista",
      cancel: "Cancelar",
      errorInCode: "Error en el código:"
    }
  }
};

const langs = [
  { code: 'pt', ext: newTranslationsPt },
  { code: 'en', ext: newTranslationsEn },
  { code: 'es', ext: newTranslationsEs }
];

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function deepMergeLocal(target, source) {
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMergeLocal(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return target;
}

langs.forEach(({ code, ext }) => {
  const filePath = path.join(localesDir, code, 'translation.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const fileJson = JSON.parse(fileContent);
  
  if (!fileJson.carriers) fileJson.carriers = {};
  if (!fileJson.carriers.form) fileJson.carriers.form = {};
  
  fileJson.carriers.form = deepMergeLocal(fileJson.carriers.form, ext.carriers.form);
  
  fs.writeFileSync(filePath, JSON.stringify(fileJson, null, 2), 'utf-8');
});

console.log('Translations part 2 merged successfully.');
