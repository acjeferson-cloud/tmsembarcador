import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

const translations = {
  pt: {
    form: {
      title: "Cadastro de Parceiro",
      editTitle: "Editar Parceiro",
      tabs: {
        basicData: "Dados Básicos",
        contacts: "Pessoas de Contato",
        addresses: "Endereços",
        observations: "Observações"
      },
      basicInfo: "Informações Básicas",
      name: "Nome/Razão Social *",
      documentType: "Tipo de Documento",
      document: "Cód. CNPJ ou CPF *",
      documentPlaceholder: "00.000.000/0000-00",
      documentPlaceholderCpf: "000.000.000-00",
      searchAction: "Buscar",
      searching: "Consultando...",
      partnerType: "Tipo de Parceiro *",
      status: "Status",
      contactInfo: "Informações de Contato",
      email: "E-mail Principal",
      phone: "Telefone Principal",
      website: "Website",
      fiscalInfo: "Informações Fiscais e Comerciais",
      taxRegime: "Regime Tributário",
      taxRegimes: {
        simples: "Simples Nacional",
        presumido: "Lucro Presumido",
        real: "Lucro Real",
        mei: "MEI"
      },
      creditLimit: "Limite de Crédito (R$)",
      paymentTerms: "Prazo de Pagamento (dias)",
      addContact: "Adicionar Contato",
      contactItem: "Contato",
      primaryContactLabel: "Principal",
      removeContact: "Remover contato",
      contactName: "Nome Completo *",
      contactEmail: "E-mail *",
      contactPhone: "Telefone *",
      contactPosition: "Cargo",
      contactDepartment: "Departamento",
      setAsPrimaryContact: "Definir como contato principal",
      receiveWhatsappNotifications: "Receber notificações via WhatsApp",
      whatsappNotifyDesc: "Este contato receberá atualizações sobre pedidos via WhatsApp",
      receiveEmailNotifications: "Receber notificações via E-mail",
      emailNotifyDesc: "Este contato receberá atualizações sobre pedidos via e-mail",
      notifyEvents: {
        orderCreated: "Pedido Realizado",
        orderInvoiced: "Pedido Faturado",
        awaitingPickup: "Aguardando Coleta",
        pickedUp: "Coletado pela Transportadora",
        inTransit: "Em Transporte",
        outForDelivery: "Saiu para Entrega",
        delivered: "Entrega Realizada"
      },
      noContactsTitle: "Nenhum contato cadastrado",
      noContactsDesc: "Clique em 'Adicionar Contato' para incluir pessoas de contato",
      addAddress: "Adicionar Endereço",
      addressItem: "Endereço",
      primaryAddressLabel: "Principal",
      removeAddress: "Remover endereço",
      addressTypes: {
        commercial: "Comercial",
        billing: "Cobrança",
        shipping: "Expedição",
        delivery: "Entrega",
        correspondence: "Correspondência",
        both: "Cobrança e Entrega"
      },
      cep: "CEP *",
      searchLabel: "Buscar CEP",
      finding: "Buscando...",
      street: "Logradouro *",
      number: "Número *",
      complement: "Complemento",
      neighborhood: "Bairro *",
      city: "Cidade *",
      state: "Estado *",
      country: "País",
      setAsPrimaryAddress: "Definir como endereço principal",
      noAddressesTitle: "Nenhum endereço cadastrado",
      noAddressesDesc: "Clique em 'Adicionar Endereço' para incluir endereços",
      viewOnMap: "Visualizar no Mapa",
      observationsLabel: "Observações",
      observationsPlaceholder: "Digite aqui observações importantes sobre este parceiro de negócios...",
      notesLabel: "Notas Adicionais",
      notesPlaceholder: "Informações adicionais sobre o parceiro de negócios...",
      cancel: "Cancelar",
      save: "Salvar",
      mapTitle: "Localização no Mapa",
      validation: {
        minOneAddress: "É obrigatório cadastrar pelo menos um endereço para o parceiro de negócios.",
        fillAddressFirst: "Por favor, preencha o endereço, cidade e estado antes de visualizar no mapa.",
        fixErrors: "Por favor, corrija os seguintes erros nos endereços:"
      },
      receitaFederalWarnings: {
        notActive: "Integração com a Receita Federal não contratada",
        notActiveDesc: "Integração com a Receita Federal não contratada: O botão 'Buscar' está desabilitado. Para habilitar a consulta automática de CNPJ, ative o serviço em Inovações & Sugestões."
      }
    }
  },
  en: {
    form: {
      title: "Business Partner Registration",
      editTitle: "Edit Business Partner",
      tabs: {
        basicData: "Basic Data",
        contacts: "Contact Persons",
        addresses: "Addresses",
        observations: "Observations"
      },
      basicInfo: "Basic Information",
      name: "Name/Company Name *",
      documentType: "Document Type",
      document: "CNPJ/CPF Code *",
      documentPlaceholder: "00.000.000/0000-00",
      documentPlaceholderCpf: "000.000.000-00",
      searchAction: "Search",
      searching: "Searching...",
      partnerType: "Partner Type *",
      status: "Status",
      contactInfo: "Contact Information",
      email: "Primary E-mail",
      phone: "Primary Phone",
      website: "Website",
      fiscalInfo: "Tax and Commercial Info",
      taxRegime: "Tax Regime",
      taxRegimes: {
        simples: "Simples Nacional",
        presumido: "Presumed Profit",
        real: "Real Profit",
        mei: "MEI"
      },
      creditLimit: "Credit Limit ($)",
      paymentTerms: "Payment Terms (days)",
      addContact: "Add Contact",
      contactItem: "Contact",
      primaryContactLabel: "Primary",
      removeContact: "Remove contact",
      contactName: "Full Name *",
      contactEmail: "E-mail *",
      contactPhone: "Phone *",
      contactPosition: "Position",
      contactDepartment: "Department",
      setAsPrimaryContact: "Set as primary contact",
      receiveWhatsappNotifications: "Receive notifications via WhatsApp",
      whatsappNotifyDesc: "This contact will receive order updates via WhatsApp",
      receiveEmailNotifications: "Receive notifications via E-mail",
      emailNotifyDesc: "This contact will receive order updates via e-mail",
      notifyEvents: {
        orderCreated: "Order Placed",
        orderInvoiced: "Order Invoiced",
        awaitingPickup: "Awaiting Pickup",
        pickedUp: "Picked Up by Carrier",
        inTransit: "In Transit",
        outForDelivery: "Out for Delivery",
        delivered: "Delivered"
      },
      noContactsTitle: "No contacts registered",
      noContactsDesc: "Click 'Add Contact' to include contact persons",
      addAddress: "Add Address",
      addressItem: "Address",
      primaryAddressLabel: "Primary",
      removeAddress: "Remove address",
      addressTypes: {
        commercial: "Commercial",
        billing: "Billing",
        shipping: "Shipping",
        delivery: "Delivery",
        correspondence: "Correspondence",
        both: "Billing and Delivery"
      },
      cep: "Zip Code *",
      searchLabel: "Search Zip",
      finding: "Searching...",
      street: "Street address *",
      number: "Number *",
      complement: "Complement",
      neighborhood: "Neighborhood *",
      city: "City *",
      state: "State *",
      country: "Country",
      setAsPrimaryAddress: "Set as primary address",
      noAddressesTitle: "No addresses registered",
      noAddressesDesc: "Click 'Add Address' to include addresses",
      viewOnMap: "View on Map",
      observationsLabel: "Observations",
      observationsPlaceholder: "Enter important observations about this business partner here...",
      notesLabel: "Additional Notes",
      notesPlaceholder: "Additional information about the business partner...",
      cancel: "Cancel",
      save: "Save",
      mapTitle: "Location on Map",
      validation: {
        minOneAddress: "Registering at least one address for the business partner is mandatory.",
        fillAddressFirst: "Please fill in the address, city, and state before viewing on the map.",
        fixErrors: "Please fix the following address errors:"
      },
      receitaFederalWarnings: {
        notActive: "Receita Federal integration not contracted",
        notActiveDesc: "Receita Federal integration not contracted: The 'Search' button is disabled. To enable automatic CNPJ lookup, activate the service in Innovations & Suggestions."
      }
    }
  },
  es: {
    form: {
      title: "Registro de Socio",
      editTitle: "Editar Socio",
      tabs: {
        basicData: "Datos Básicos",
        contacts: "Personas de Contacto",
        addresses: "Direcciones",
        observations: "Observaciones"
      },
      basicInfo: "Información Básica",
      name: "Nombre/Razón Social *",
      documentType: "Tipo de Documento",
      document: "Cód. CNPJ o CPF *",
      documentPlaceholder: "00.000.000/0000-00",
      documentPlaceholderCpf: "000.000.000-00",
      searchAction: "Buscar",
      searching: "Consultando...",
      partnerType: "Tipo de Socio *",
      status: "Estado",
      contactInfo: "Información de Contacto",
      email: "E-mail Principal",
      phone: "Teléfono Principal",
      website: "Sitio Web",
      fiscalInfo: "Información Fiscal y Comercial",
      taxRegime: "Régimen Tributario",
      taxRegimes: {
        simples: "Simples Nacional",
        presumido: "Lucro Presumido",
        real: "Lucro Real",
        mei: "MEI"
      },
      creditLimit: "Límite de Crédito ($)",
      paymentTerms: "Plazo de Pago (días)",
      addContact: "Agregar Contacto",
      contactItem: "Contacto",
      primaryContactLabel: "Principal",
      removeContact: "Eliminar contacto",
      contactName: "Nombre Completo *",
      contactEmail: "E-mail *",
      contactPhone: "Teléfono *",
      contactPosition: "Cargo",
      contactDepartment: "Departamento",
      setAsPrimaryContact: "Definir como contacto principal",
      receiveWhatsappNotifications: "Recibir notificaciones vía WhatsApp",
      whatsappNotifyDesc: "Este contacto recibirá actualizaciones de pedidos vía WhatsApp",
      receiveEmailNotifications: "Recibir notificaciones vía E-mail",
      emailNotifyDesc: "Este contacto recibirá actualizaciones de pedidos vía e-mail",
      notifyEvents: {
        orderCreated: "Pedido Realizado",
        orderInvoiced: "Pedido Facturado",
        awaitingPickup: "Esperando Recogida",
        pickedUp: "Recogido por Transportista",
        inTransit: "En Tránsito",
        outForDelivery: "Salió para Entrega",
        delivered: "Entrega Realizada"
      },
      noContactsTitle: "No hay contactos registrados",
      noContactsDesc: "Haz clic en 'Agregar Contacto' para incluir personas de contacto",
      addAddress: "Agregar Dirección",
      addressItem: "Dirección",
      primaryAddressLabel: "Principal",
      removeAddress: "Eliminar dirección",
      addressTypes: {
        commercial: "Comercial",
        billing: "Facturación",
        shipping: "Expedición",
        delivery: "Entrega",
        correspondence: "Correspondencia",
        both: "Facturación y Entrega"
      },
      cep: "Código Postal *",
      searchLabel: "Buscar CP",
      finding: "Buscando...",
      street: "Dirección *",
      number: "Número *",
      complement: "Complemento",
      neighborhood: "Barrio *",
      city: "Ciudad *",
      state: "Estado *",
      country: "País",
      setAsPrimaryAddress: "Definir como dirección principal",
      noAddressesTitle: "Ninguna dirección registrada",
      noAddressesDesc: "Haz clic en 'Agregar Dirección' para incluir direcciones",
      viewOnMap: "Ver en Mapa",
      observationsLabel: "Observaciones",
      observationsPlaceholder: "Ingresa observaciones importantes sobre este socio aquí...",
      notesLabel: "Notas Adicionales",
      notesPlaceholder: "Información adicional sobre el socio comercial...",
      cancel: "Cancelar",
      save: "Guardar",
      mapTitle: "Ubicación en el Mapa",
      validation: {
        minOneAddress: "Es obligatorio registrar al menos una dirección para el socio comercial.",
        fillAddressFirst: "Por favor, completa la dirección, ciudad y estado antes de ver en el mapa.",
        fixErrors: "Por favor, corrige los siguientes errores en las direcciones:"
      },
      receitaFederalWarnings: {
        notActive: "Integración de Receita Federal no contratada",
        notActiveDesc: "Integración de Receita Federal no contratada: El botón 'Buscar' está desactivado. Para habilitar la consulta automática de CNPJ, activa el servicio en Innovaciones y Sugerencias."
      }
    }
  }
};

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(fileContent);
    
    // Initialise if not exists
    if (!json.businessPartners) {
      json.businessPartners = {};
    }

    json.businessPartners.form = {
      ...(json.businessPartners.form || {}),
      ...translations[lang].form
    };

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Updated form translations for ${lang}`);
  } else {
    console.error(`File not found: ${filePath}`);
  }
});
