const fs = require('fs');
const path = require('path');

const pts = {
  whatsapp: {
    config: {
      title: "Configurações do WhatsApp",
      subtitle: "Configure a integração com WhatsApp Business API",
      notContractedMsg: "Recurso não contratado. Ative em Inovações & Sugestões.",
      saveSuccess: "Configuração salva com sucesso!",
      saveError: "Erro ao salvar configuração",
      testSuccess: "Conexão testada com sucesso! A configuração está funcionando.",
      testError: "Falha ao testar conexão",
      saveTemplateSuccess: "Template salvo com sucesso!",
      saveTemplateError: "Erro ao salvar template",
      deleteTemplateConfirm: "Deseja realmente excluir este template?",
      deleteTemplateSuccess: "Template excluído com sucesso!",
      deleteTemplateError: "Erro ao excluir template",
      nameAndBodyRequired: "Nome e corpo da mensagem são obrigatórios",
      notice: {
        title: "Integração com WhatsApp não contratada:",
        text: "Para utilizar as funcionalidades do WhatsApp Business API, é necessário ativar o serviço em",
        link: "Inovações & Sugestões",
        textEnd: ". Sem a ativação, as configurações não terão efeito."
      },
      tabs: {
        config: "Configurações API",
        templates: "Templates",
        extract: "Extrato"
      },
      api: {
        accessToken: "Access Token *",
        accessTokenPlaceholder: "EAAxxxxxxxxxxxxxxxxxxxxxxx",
        accessTokenHelp: "Token de acesso permanente gerado na Meta for Developers",
        phoneId: "Phone Number ID *",
        phoneIdPlaceholder: "123456789012345",
        phoneIdHelp: "ID do número de telefone do WhatsApp Business",
        accountId: "Business Account ID *",
        accountIdPlaceholder: "123456789012345",
        accountIdHelp: "ID da conta comercial do WhatsApp",
        webhookToken: "Webhook Verify Token (opcional)",
        webhookTokenPlaceholder: "seu_token_secreto",
        webhookTokenHelp: "Token para verificação de webhooks (se configurado)"
      },
      buttons: {
        saveConfig: "Salvar Configuração",
        saving: "Salvando...",
        testConnection: "Testar Conexão",
        testing: "Testando..."
      },
      howTo: {
        title: "Como obter as credenciais:",
        step1: "Acesse",
        link: "Meta for Developers",
        step2: "Crie ou selecione um App do tipo \"Business\"",
        step3: "Adicione o produto \"WhatsApp\" ao seu app",
        step4: "Em \"API Setup\", você encontrará o Phone Number ID e poderá gerar o Access Token",
        step5: "O Business Account ID está disponível nas configurações do WhatsApp Business",
        warningTitle: "WhatsApp Business API (não possui plano gratuito):",
        warning1: "O WhatsApp opera exclusivamente com cobrança por uso, baseada no envio de mensagens e templates. Cada mensagem enviada — principalmente aquelas iniciadas pela empresa — gera custo conforme a tabela oficial de preços da Meta.",
        warning2: "Recomendamos configurar limites de consumo no painel da plataforma parceira (BSP) para evitar qualquer gasto inesperado.",
        warning3: "Lembre-se: além da cobrança por mensagem, existe também o valor mensal fixo do recurso, conforme previsto em contrato."
      }
    },
    templates: {
      title: "Gerencie os templates de mensagens aprovados pela Meta",
      newTemplateHeader: "Novo Template",
      editTemplateHeader: "Editar Template",
      noTemplates: "Nenhum template encontrado. Clique em \"Novo Template\" para criar um.",
      unnamed: "Sem nome",
      status: {
        approved: "APPROVED",
        pending: "PENDING",
        rejected: "REJECTED"
      },
      form: {
        name: "Nome do Template *",
        namePlaceholder: "nome_do_template",
        description: "Descrição",
        descriptionPlaceholder: "Descrição do uso do template",
        body: "Corpo da Mensagem *",
        bodyPlaceholder: "Digite o corpo da mensagem. Use {{1}}, {{2}}, etc. para variáveis.",
        bodyHelp: "Variáveis devem estar no formato {{1}}, {{2}}, etc.",
        category: "Categoria",
        approvalStatus: "Status de Aprovação",
        active: "Template ativo",
        save: "Salvar",
        saving: "Salvando...",
        cancel: "Cancelar"
      }
    },
    extract: {
      title: "Extrato de Consumo WhatsApp",
      subtitle: "Controle detalhado de envios e recebimentos de mensagens",
      buttons: {
        filters: "Filtros",
        export: "Exportar CSV",
        apply: "Aplicar Filtros",
        clear: "Limpar"
      },
      filters: {
        title: "Filtros",
        startDate: "Data Inicial",
        endDate: "Data Final",
        transactionType: "Tipo de Transação",
        transactionOptions: {
          all: "Todos",
          send: "Envio",
          receive: "Recebimento"
        },
        messageType: "Tipo de Mensagem",
        messageOptions: {
          all: "Todos",
          text: "Texto",
          image: "Imagem",
          template: "Template",
          document: "Documento",
          audio: "Áudio",
          video: "Vídeo",
          location: "Localização"
        },
        status: "Status",
        statusOptions: {
          all: "Todos",
          sent: "Enviada",
          delivered: "Entregue",
          read: "Lida",
          failed: "Falha",
          pending: "Pendente"
        }
      },
      summary: {
        totalMessages: "Total de Mensagens",
        totalCost: "Custo Total",
        sentMessages: "Mensagens Enviadas",
        receivedMessages: "Mensagens Recebidas"
      },
      table: {
        date: "Data/Hora",
        type: "Tipo",
        message: "Mensagem",
        recipient: "Destinatário",
        phone: "Telefone",
        value: "Valor",
        status: "Status",
        template: "Template",
        loading: "Carregando...",
        noTransactions: "Nenhuma transação encontrada",
        totalDisplayed: "Total de {{count}} transações exibidas",
        periodCost: "Custo total do período:"
      }
    }
  }
};

const ens = {
  whatsapp: {
    config: {
      title: "WhatsApp Settings",
      subtitle: "Configure the WhatsApp Business API integration",
      notContractedMsg: "Feature not contracted. Activate in Innovations & Suggestions.",
      saveSuccess: "Configuration saved successfully!",
      saveError: "Error saving configuration",
      testSuccess: "Connection tested successfully! Configuration is working.",
      testError: "Failed to test connection",
      saveTemplateSuccess: "Template saved successfully!",
      saveTemplateError: "Error saving template",
      deleteTemplateConfirm: "Are you sure you want to delete this template?",
      deleteTemplateSuccess: "Template deleted successfully!",
      deleteTemplateError: "Error deleting template",
      nameAndBodyRequired: "Message name and body are required",
      notice: {
        title: "WhatsApp integration not contracted:",
        text: "To use WhatsApp Business API features, you must activate the service in",
        link: "Innovations & Suggestions",
        textEnd: ". Without activation, settings will not take effect."
      },
      tabs: {
        config: "API Settings",
        templates: "Templates",
        extract: "Extract"
      },
      api: {
        accessToken: "Access Token *",
        accessTokenPlaceholder: "EAAxxxxxxxxxxxxxxxxxxxxxxx",
        accessTokenHelp: "Permanent access token generated in Meta for Developers",
        phoneId: "Phone Number ID *",
        phoneIdPlaceholder: "123456789012345",
        phoneIdHelp: "WhatsApp Business Phone Number ID",
        accountId: "Business Account ID *",
        accountIdPlaceholder: "123456789012345",
        accountIdHelp: "WhatsApp Business Account ID",
        webhookToken: "Webhook Verify Token (optional)",
        webhookTokenPlaceholder: "your_secret_token",
        webhookTokenHelp: "Token for webhook verification (if configured)"
      },
      buttons: {
        saveConfig: "Save Configuration",
        saving: "Saving...",
        testConnection: "Test Connection",
        testing: "Testing..."
      },
      howTo: {
        title: "How to get credentials:",
        step1: "Access",
        link: "Meta for Developers",
        step2: "Create or select a \"Business\" App",
        step3: "Add the \"WhatsApp\" product to your app",
        step4: "In \"API Setup\" you will find the Phone Number ID and can generate the Access Token",
        step5: "The Business Account ID is available in WhatsApp Business settings",
        warningTitle: "WhatsApp Business API (no free tier):",
        warning1: "WhatsApp operates exclusively on pay-per-use, based on messaging and templates. Each message sent — particularly business-initiated ones — incurs costs according to Meta's official pricing.",
        warning2: "We recommend setting consumption limits in your BSP dashboard to avoid unexpected charges.",
        warning3: "Remember: in addition to per-message charges, there is also the fixed monthly rate for the feature, as per your contract."
      }
    },
    templates: {
      title: "Manage Meta-approved message templates",
      newTemplateHeader: "New Template",
      editTemplateHeader: "Edit Template",
      noTemplates: "No templates found. Click \"New Template\" to create one.",
      unnamed: "Unnamed",
      status: {
        approved: "APPROVED",
        pending: "PENDING",
        rejected: "REJECTED"
      },
      form: {
        name: "Template Name *",
        namePlaceholder: "template_name",
        description: "Description",
        descriptionPlaceholder: "Template usage description",
        body: "Message Body *",
        bodyPlaceholder: "Enter message body. Use {{1}}, {{2}}, etc. for variables.",
        bodyHelp: "Variables must be formatted as {{1}}, {{2}}, etc.",
        category: "Category",
        approvalStatus: "Approval Status",
        active: "Active template",
        save: "Save",
        saving: "Saving...",
        cancel: "Cancel"
      }
    },
    extract: {
      title: "WhatsApp Usage Extract",
      subtitle: "Detailed control of sent and received messages",
      buttons: {
        filters: "Filters",
        export: "Export CSV",
        apply: "Apply Filters",
        clear: "Clear"
      },
      filters: {
        title: "Filters",
        startDate: "Start Date",
        endDate: "End Date",
        transactionType: "Transaction Type",
        transactionOptions: {
          all: "All",
          send: "Send",
          receive: "Receive"
        },
        messageType: "Message Type",
        messageOptions: {
          all: "All",
          text: "Text",
          image: "Image",
          template: "Template",
          document: "Document",
          audio: "Audio",
          video: "Video",
          location: "Location"
        },
        status: "Status",
        statusOptions: {
          all: "All",
          sent: "Sent",
          delivered: "Delivered",
          read: "Read",
          failed: "Failed",
          pending: "Pending"
        }
      },
      summary: {
        totalMessages: "Total Messages",
        totalCost: "Total Cost",
        sentMessages: "Sent Messages",
        receivedMessages: "Received Messages"
      },
      table: {
        date: "Date/Time",
        type: "Type",
        message: "Message",
        recipient: "Recipient",
        phone: "Phone",
        value: "Value",
        status: "Status",
        template: "Template",
        loading: "Loading...",
        noTransactions: "No transactions found",
        totalDisplayed: "Total of {{count}} transactions displayed",
        periodCost: "Total cost for period:"
      }
    }
  }
};

const ess = {
  whatsapp: {
    config: {
      title: "Ajustes de WhatsApp",
      subtitle: "Configure la integración con WhatsApp Business API",
      notContractedMsg: "Función no contratada. Activa en Innovaciones y Sugerencias.",
      saveSuccess: "¡Configuración guardada con éxito!",
      saveError: "Error al guardar la configuración",
      testSuccess: "¡Conexión probada con éxito! La configuración funciona.",
      testError: "Error al probar la conexión",
      saveTemplateSuccess: "¡Plantilla guardada con éxito!",
      saveTemplateError: "Error al guardar plantilla",
      deleteTemplateConfirm: "¿Realmente desea eliminar esta plantilla?",
      deleteTemplateSuccess: "¡Plantilla eliminada con éxito!",
      deleteTemplateError: "Error al eliminar plantilla",
      nameAndBodyRequired: "El nombre y el cuerpo del mensaje son obligatorios",
      notice: {
        title: "Integración de WhatsApp no contratada:",
        text: "Para utilizar las funciones de WhatsApp Business API, debe activar el servicio en",
        link: "Innovaciones y Sugerencias",
        textEnd: ". Sin activación, la configuración no tendrá efecto."
      },
      tabs: {
        config: "Ajustes API",
        templates: "Plantillas",
        extract: "Extracto"
      },
      api: {
        accessToken: "Token de acceso *",
        accessTokenPlaceholder: "EAAxxxxxxxxxxxxxxxxxxxxxxx",
        accessTokenHelp: "Token de acceso permanente generado en Meta for Developers",
        phoneId: "ID del número de teléfono *",
        phoneIdPlaceholder: "123456789012345",
        phoneIdHelp: "ID del número de teléfono de WhatsApp Business",
        accountId: "ID de la cuenta comercial *",
        accountIdPlaceholder: "123456789012345",
        accountIdHelp: "ID de la cuenta comercial de WhatsApp",
        webhookToken: "Token de verificación Webhook (opcional)",
        webhookTokenPlaceholder: "su_token_secreto",
        webhookTokenHelp: "Token para verificación de webhooks (si configurado)"
      },
      buttons: {
        saveConfig: "Guardar Configuración",
        saving: "Guardando...",
        testConnection: "Probar Conexión",
        testing: "Probando..."
      },
      howTo: {
        title: "Cómo obtener las credenciales:",
        step1: "Acceda a",
        link: "Meta for Developers",
        step2: "Cree o seleccione una aplicación tipo \"Business\"",
        step3: "Agregue el producto \"WhatsApp\" a su aplicación",
        step4: "En \"API Setup\" encontrará el ID de teléfono y podrá generar el Token de Acceso",
        step5: "El ID de Cuenta Comercial está en la configuración de WhatsApp Business",
        warningTitle: "WhatsApp Business API (no tiene plan gratuito):",
        warning1: "WhatsApp opera exclusivamente mediante pago por uso real, basado en el envío de mensajes y plantillas. Cada mensaje —especialmente los originados por la empresa— incurre en un costo según la tabla oficial de Meta.",
        warning2: "Recomendamos definir límites de gasto en el panel de su BSP (proporcionador) para evitar costos inesperados.",
        warning3: "Recuerde: además de la tarifa por mensaje, también se cobra la tarifa mensual del contrato."
      }
    },
    templates: {
      title: "Gestione las plantillas de mensajes aprobadas por Meta",
      newTemplateHeader: "Nueva Plantilla",
      editTemplateHeader: "Editar Plantilla",
      noTemplates: "No se encontraron plantillas. Haga clic en \"Nueva Plantilla\" para crear una.",
      unnamed: "Sin nombre",
      status: {
        approved: "APPROVED",
        pending: "PENDING",
        rejected: "REJECTED"
      },
      form: {
        name: "Nombre de la Plantilla *",
        namePlaceholder: "nombre_plantilla",
        description: "Descripción",
        descriptionPlaceholder: "Descripción del uso de la plantilla",
        body: "Cuerpo del Mensaje *",
        bodyPlaceholder: "Ingrese el cuerpo del mensaje. Utilice {{1}}, {{2}}, etc. para variables.",
        bodyHelp: "Las variables deben tener el formato {{1}}, {{2}}, etc.",
        category: "Categoría",
        approvalStatus: "Estado de Aprobación",
        active: "Plantilla activa",
        save: "Guardar",
        saving: "Guardando...",
        cancel: "Cancelar"
      }
    },
    extract: {
      title: "Extracto de Consumo WhatsApp",
      subtitle: "Control detallado de envíos y recepción de mensajes",
      buttons: {
        filters: "Filtros",
        export: "Exportar CSV",
        apply: "Aplicar Filtros",
        clear: "Limpiar"
      },
      filters: {
        title: "Filtros",
        startDate: "Fecha Inicial",
        endDate: "Fecha Final",
        transactionType: "Tipo de Transacción",
        transactionOptions: {
          all: "Todos",
          send: "Envío",
          receive: "Recepción"
        },
        messageType: "Tipo de Mensaje",
        messageOptions: {
          all: "Todos",
          text: "Texto",
          image: "Imagen",
          template: "Plantilla",
          document: "Documento",
          audio: "Audio",
          video: "Video",
          location: "Ubicación"
        },
        status: "Estado",
        statusOptions: {
          all: "Todos",
          sent: "Enviada",
          delivered: "Entregada",
          read: "Leída",
          failed: "Fallida",
          pending: "Pendiente"
        }
      },
      summary: {
        totalMessages: "Total de Mensajes",
        totalCost: "Costo Total",
        sentMessages: "Mensajes Enviados",
        receivedMessages: "Mensajes Recibidos"
      },
      table: {
        date: "Fecha/Hora",
        type: "Tipo",
        message: "Mensaje",
        recipient: "Destinatario",
        phone: "Teléfono",
        value: "Valor",
        status: "Estado",
        template: "Plantilla",
        loading: "Cargando...",
        noTransactions: "No se encontraron transacciones",
        totalDisplayed: "Total de {{count}} transacciones mostradas",
        periodCost: "Costo total del período:"
      }
    }
  }
};

function readJsonFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (err) {
    return null;
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

const langs = [
  { lang: 'pt', data: pts },
  { lang: 'en', data: ens },
  { lang: 'es', data: ess }
];

langs.forEach(({ lang, data }) => {
  const p = path.resolve(__dirname, `../src/locales/${lang}/translation.json`);
  const exist = readJsonFile(p);
  if (exist) {
    exist.whatsapp = { ...exist.whatsapp, ...data.whatsapp };
    writeJsonFile(p, exist);
    console.log(`Updated WhatsApp translations for ${lang}`);
  }
});
