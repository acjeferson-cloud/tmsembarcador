const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const languages = ['pt', 'en', 'es'];

const implementationCenterTranslations = {
  pt: {
    implementationCenter: {
      title: "Centro de Implementação",
      description: "Importe dados e gerencie configurações em massa para acelerar a implementação",
      tabs: {
        deployAgent: "Deploy Agent IA",
        erpIntegration: "Integração ao ERP",
        carriers: "Transportadoras",
        freightTables: "Tabelas de Frete",
        cities: "Cidades",
        tableFees: "Taxas da Tabela",
        restrictedCeps: "CEPs Restritos",
        adjustTables: "Reajustar Tabelas",
      },
      erpIntegration: {
        configTitle: "Configuração de Integração ERP",
        template: {
          title: "Template de Configuração",
          description: "Baixe o template ou importe configurações existentes",
          downloadBtn: "Template",
          importBtn: "Importar",
          processing: "Processando arquivo...",
          success: "Arquivo importado com sucesso!",
          successDesc: "{{count}} registro(s) processado(s). Os campos foram preenchidos automaticamente com os dados do primeiro registro."
        },
        selectErp: "Selecione o ERP",
        selectErpPlaceholder: "Selecione um ERP...",
        connection: {
          title: "Configurações de Conexão",
          serviceLayerAddress: "Endereço do Service Layer",
          port: "Porta",
          username: "Usuário",
          password: "Senha",
          database: "Database"
        },
        cte: {
          title: "Configurações de CT-e",
          integrationType: "Tipo de integração de CT-e",
          typeDraft: "Esboço",
          typeEntry: "Nota de Entrada",
          cteModel: "Modelo de CT-e",
          invoiceModel: "Modelo de Fatura"
        },
        billing: {
          title: "Configurações de Faturamento",
          nfeItem: "Item da NF-e de Faturamento",
          usage: "Utilização de Faturamento",
          controlAccount: "Conta Controle de Faturamento"
        },
        invoice: {
          title: "Configurações de Notas Fiscais",
          outboundItem: "Item da Nota Fiscal de Saída gerada a partir de CT-e",
          cteWithoutNfItem: "Item para CT-e sem Nota Fiscal",
          cteUsage: "Utilização de CT-e",
          inboundControlAccount: "Conta Controle para emissão de Nota Fiscal de Entrada",
          transitoryAccount: "Conta Transitória para fechamento de Invoice"
        },
        additional: {
          title: "Configurações Adicionais",
          nfeXmlAddress: "Endereço de rede dos XMLs da NF-e",
          fiscalModule: "Módulo Fiscal"
        },
        saveBtn: "Salvar Configurações",
        saving: "Salvando...",
        importConfig: {
          title: "Importação de Configurações",
          clickUpload: "Clique para fazer upload",
          dragDrop: "ou arraste e solte",
          fileType: "Arquivo Excel (.xlsx)"
        }
      },
      imports: {
        templateExcel: "Template Excel",
        downloadTemplate: "Baixar Template",
        dragDrop: "Arraste o arquivo Excel aqui ou clique para selecionar",
        acceptedFormats: "Formatos aceitos: .xlsx, .xls",
        selectFile: "Selecionar Arquivo",
        processing: "Processando importação...",
        recordsProcessed: "Registros processados: {{count}}",
        errorsFound: "Erros encontrados:",
        carriers: {
          title: "Importar Transportadoras",
          description: "Importe cadastros de transportadoras em massa através de arquivo Excel",
          templateName: "template_transportadoras.xlsx"
        },
        freight: {
          title: "Importar Tabelas de Frete",
          description: "Importe tabelas de frete com faixas de valores por transportadora",
          templateName: "template_tabelas_frete.xlsx"
        },
        cities: {
          title: "Importar Cidades da Tabela",
          description: "Importe cadastro de cidades vinculadas às tabelas de frete",
          templateName: "template_cidades.xlsx"
        },
        fees: {
          title: "Importar Taxas da Tabela",
          description: "Faça upload do arquivo Excel com as taxas (pedágio, coleta/entrega, etc.) das tabelas de frete.",
          templateName: "template_taxas_tabela.xlsx"
        },
        restrictedCeps: {
          title: "Importar CEPs Restritos",
          description: "Faça upload do arquivo Excel com a listagem de CEPs restritos por transportadora.",
          templateName: "template_ceps_restritos.xlsx"
        }
      },
      adjustment: {
        infoTitle: "Reajuste de Tabelas de Frete",
        infoDesc: "Aplique reajustes em massa nas tabelas de frete ativas. Escolha entre aplicação de percentual ou inserção manual de valores.",
        configTitle: "Configuração do Reajuste",
        type: "Tipo de Reajuste",
        typePercentage: "Aplicar Percentual",
        typeManual: "Inserção Manual de Valores",
        percentageLabel: "Percentual de Reajuste (%)",
        percentagePlaceholder: "Ex: 5.5 (aumento) ou -3.2 (redução)",
        percentageHint: "Use valores positivos para aumento e negativos para redução",
        manualLabel: "Arquivo Excel com Novos Valores",
        manualUploadDesc: "Clique para fazer upload ou arraste o arquivo aqui",
        manualUploadHint: "Apenas arquivos Excel (.xlsx, .xls)",
        downloadManualTemplate: "Baixar Template para Novos Valores",
        tablesToAdjust: "Tabelas a Reajustar",
        allTables: "Todas as Tabelas Ativas",
        submitBtn: "Aplicar Reajuste",
        submitting: "Processando Reajuste...",
        instructions: {
          title: "Instruções",
          percentageTitle: "Reajuste por Percentual:",
          percentage1: "Digite o percentual desejado (ex: 5.5 para aumento de 5,5%)",
          percentage2: "Use valores negativos para redução (ex: -3.2 para redução de 3,2%)",
          percentage3: "O reajuste será aplicado a todos os valores da tabela",
          percentage4: "Valores serão arredondados para 2 casas decimais",
          manualTitle: "Inserção Manual:",
          manual1: "Baixe o template com a estrutura atual",
          manual2: "Preencha os novos valores desejados",
          manual3: "Faça upload do arquivo preenchido",
          manual4: "Valores em branco manterão o valor atual"
        }
      },
      instructions: {
        title: "Instruções de Uso",
        step1: "1. Baixe o template Excel correspondente ao tipo de dados que deseja importar",
        step2: "2. Preencha o arquivo seguindo exatamente o layout fornecido",
        step3: "3. Faça o upload do arquivo preenchido",
        step4: "4. Aguarde o processamento e verifique os resultados",
        step5: "5. Corrija eventuais erros e reimporte se necessário"
      },
      messages: {
        templateError: "Erro ao gerar template: {{error}}. Verifique se todos os dados estão corretos.",
        unsupportedTemplate: "Tipo de template não suportado",
        unsupportedImport: "Tipo de importação não suportado",
        processError: "Erro ao processar arquivo",
        adjustError: "Erro ao aplicar reajuste",
        saveSuccess: "Configurações de ERP salvas com sucesso!",
        saveError: "Erro ao salvar configurações de ERP",
        importSuccessAlert: "Template importado com sucesso! {{count}} registro(s) processado(s).",
        importErrorAlert: "Erro ao processar arquivo: {{error}}"
      },
      deployAgent: {
        title: "Deploy Agent",
        description: "Implantação automatizada com Inteligência Artificial",
        subDescription: "Envie seus dados e deixe a IA configurar automaticamente todo o sistema",
        newProjectBtn: "Novo Projeto",
        features: {
          uploadTitle: "Upload Inteligente",
          uploadDesc: "Envie planilhas e arquivos, a IA identifica automaticamente o tipo de dados",
          aiTitle: "Interpretação IA",
          aiDesc: "OpenAI analisa, valida e mapeia os campos automaticamente",
          executeTitle: "Auto-Execução",
          executeDesc: "Parametrização automática de cadastros, tabelas e integrações",
          monitorTitle: "Monitoramento",
          monitorDesc: "Dashboard com status, erros e sugestões de melhoria em tempo real"
        },
        projectsTitle: "Projetos de Implantação",
        loadingProjects: "Carregando projetos...",
        noProjects: "Nenhum projeto criado ainda",
        createFirstProjectBtn: "Criar Primeiro Projeto",
        clientPrefix: "Cliente: ",
        startedAt: "Iniciado: ",
        progressPrefix: "Progresso: ",
        completedAt: "Concluído: ",
        viewDetails: "Ver detalhes",
        deleteProjectTitle: "Excluir projeto",
        statuses: {
          pending: "Pendente",
          collecting: "Coletando",
          interpreting: "Interpretando",
          executing: "Executando",
          completed: "Concluído",
          failed: "Falha"
        },
        newProjectModal: {
          title: "Novo Projeto de Implantação",
          projectName: "Nome do Projeto *",
          projectNamePlaceholder: "Ex: Implantação Cliente ABC",
          clientName: "Nome do Cliente *",
          clientNamePlaceholder: "Ex: Empresa XYZ Ltda",
          autoExecute: "Executar automaticamente após interpretação",
          requireApproval: "Requerer aprovação antes de executar",
          cancelBtn: "Cancelar",
          createBtn: "Criar Projeto"
        },
        deleteConfirm: {
          title: "Tem certeza que deseja excluir o projeto?",
          message: "Projeto: \"{{name}}\"\n\nEsta ação não pode ser desfeita.",
          confirmBtn: "OK",
          cancelBtn: "Cancelar"
        },
        dashboard: {
          backBtn: "Voltar para Projetos",
          uploadBtn: "Enviar Arquivos",
          stats: {
            progress: "Progresso",
            steps: "{{completed}} de {{total}} etapas",
            errors: "Erros",
            errorsDesc: "Requerem atenção",
            warnings: "Avisos",
            warningsDesc: "Para revisão",
            suggestions: "Sugestões",
            suggestionsDesc: "Melhorias possíveis"
          },
          generalProgress: "Progresso Geral",
          implementation: "Implantação",
          steps: {
            collection: "Coleta",
            interpretation: "Interpretação",
            execution: "Execução",
            completed: "Concluído"
          },
          uploads: {
            title: "Arquivos Enviados",
            noUploads: "Nenhum arquivo enviado ainda",
            executeBtn: "Efetivar Importação",
            statuses: {
              executed: "Importado (100%)",
              validated: "Aguardando Importação"
            }
          },
          validations: {
            title: "Validações",
            noValidations: "Nenhuma validação registrada",
            fieldPrefix: "Campo: "
          },
          suggestions: {
            title: "Sugestões de Melhoria",
            noSuggestions: "Nenhuma sugestão disponível",
            approveBtn: "Aprovar"
          }
        },
        uploader: {
          title: "Enviar Arquivo",
          description: "A IA irá interpretar e configurar automaticamente",
          dataType: "Tipo de Dados *",
          categories: {
            erpIntegration: "Integração ao ERP",
            carriers: "Transportadoras",
            freightTables: "Tabelas de Fretes",
            cities: "Cidades",
            fees: "Taxas da Tabela",
            restrictedZips: "CEPs Restritos",
            tableAdjustments: "Reajustar Tabela"
          },
          fileLabel: "Arquivo *",
          dropzoneClick: "Clique para selecionar ou arraste o arquivo",
          dropzoneFormats: "Formatos: XLSX, XLS, CSV, TXT",
          statusMessages: {
            idle: "Enviando arquivo...",
            success: "Arquivo enviado com sucesso!",
            processing: "Processando com IA...",
            completed: "Processamento concluído!"
          },
          howItWorks: {
            title: "Como funciona?",
            item1: "A IA identifica a estrutura dos dados automaticamente",
            item2: "Valida campos obrigatórios e formatos",
            item3: "Mapeia os campos para o banco de dados",
            item4: "Detecta erros e sugere melhorias",
            item5: "Configura os cadastros automaticamente",
            devMode: "Modo Desenvolvimento:",
            devModeDesc: "Se OpenAI não estiver configurada, usa interpretação mock para demonstração."
          },
          cancelBtn: "Cancelar",
          sendBtn: "Enviar e Processar",
          sendingBtn: "Enviando...",
          processingBtn: "Processando..."
        },
        messages: {
          loadError: "Erro ao carregar projetos",
          fillRequired: "Preencha todos os campos obrigatórios",
          createSuccess: "Projeto criado com sucesso!",
          deleteSuccess: "Projeto excluído com sucesso!",
          approveSuggestionError: "Erro ao aprovar sugestão",
          executeUploadSuccess: "Arquivo processado e importado com sucesso!",
          executeUploadError: "Erro ao executar importação",
          uploadValidationMissing: "Selecione uma categoria e um arquivo"
        }
      }
    }
  },
  en: {
    implementationCenter: {
      title: "Implementation Center",
      description: "Import data and manage settings in bulk to speed up deployment",
      tabs: {
        deployAgent: "AI Deploy Agent",
        erpIntegration: "ERP Integration",
        carriers: "Carriers",
        freightTables: "Freight Tables",
        cities: "Cities",
        tableFees: "Table Fees",
        restrictedCeps: "Restricted Zips",
        adjustTables: "Adjust Tables",
      },
      erpIntegration: {
        configTitle: "ERP Integration Configuration",
        template: {
          title: "Configuration Template",
          description: "Download the template or import existing configurations",
          downloadBtn: "Template",
          importBtn: "Import",
          processing: "Processing file...",
          success: "File successfully imported!",
          successDesc: "{{count}} record(s) processed. Fields filled automatically based on the first record."
        },
        selectErp: "Select the ERP",
        selectErpPlaceholder: "Select an ERP...",
        connection: {
          title: "Connection Settings",
          serviceLayerAddress: "Service Layer Address",
          port: "Port",
          username: "Username",
          password: "Password",
          database: "Database"
        },
        cte: {
          title: "CT-e Settings",
          integrationType: "CT-e Integration Type",
          typeDraft: "Draft",
          typeEntry: "Inbound Invoice",
          cteModel: "CT-e Model",
          invoiceModel: "Invoice Model"
        },
        billing: {
          title: "Billing Settings",
          nfeItem: "Billing NF-e Item",
          usage: "Billing Usage",
          controlAccount: "Billing Control Account"
        },
        invoice: {
          title: "Invoice Settings",
          outboundItem: "Outbound Invoice Item generated from CT-e",
          cteWithoutNfItem: "Item for CT-e without Invoice",
          cteUsage: "CT-e Usage",
          inboundControlAccount: "Inbound Invoice issuance Control Account",
          transitoryAccount: "Invoice closing Transitory Account"
        },
        additional: {
          title: "Additional Settings",
          nfeXmlAddress: "NF-e XMLs Network Address",
          fiscalModule: "Fiscal Module"
        },
        saveBtn: "Save Configurations",
        saving: "Saving...",
        importConfig: {
          title: "Configuration Import",
          clickUpload: "Click to upload",
          dragDrop: "or drag and drop",
          fileType: "Excel File (.xlsx)"
        }
      },
      imports: {
        templateExcel: "Excel Template",
        downloadTemplate: "Download Template",
        dragDrop: "Drag the Excel file here or click to select",
        acceptedFormats: "Accepted formats: .xlsx, .xls",
        selectFile: "Select File",
        processing: "Processing import...",
        recordsProcessed: "Records processed: {{count}}",
        errorsFound: "Errors found:",
        carriers: {
          title: "Import Carriers",
          description: "Import carrier records in bulk using an Excel file",
          templateName: "template_carriers.xlsx"
        },
        freight: {
          title: "Import Freight Tables",
          description: "Import freight tables with rate ranges per carrier",
          templateName: "template_freight_tables.xlsx"
        },
        cities: {
          title: "Import Table Cities",
          description: "Import city records linked to freight tables",
          templateName: "template_cities.xlsx"
        },
        fees: {
          title: "Import Table Fees",
          description: "Upload Excel file with fees (toll, collection/delivery, etc.) of freight tables.",
          templateName: "template_table_fees.xlsx"
        },
        restrictedCeps: {
          title: "Import Restricted Zips",
          description: "Upload Excel file containing restricted zip codes per carrier.",
          templateName: "template_restricted_zips.xlsx"
        }
      },
      adjustment: {
        infoTitle: "Freight Tables Adjustment",
        infoDesc: "Apply mass adjustments to active freight tables. Choose between percentage application or manual value insertion.",
        configTitle: "Adjustment Configuration",
        type: "Adjustment Type",
        typePercentage: "Apply Percentage",
        typeManual: "Manual Value Insertion",
        percentageLabel: "Adjustment Percentage (%)",
        percentagePlaceholder: "Ex: 5.5 (increase) or -3.2 (decrease)",
        percentageHint: "Use positive values for increase and negative for decrease",
        manualLabel: "Excel File with New Values",
        manualUploadDesc: "Click to upload or drag the file here",
        manualUploadHint: "Excel files only (.xlsx, .xls)",
        downloadManualTemplate: "Download Template for New Values",
        tablesToAdjust: "Tables to Adjust",
        allTables: "All Active Tables",
        submitBtn: "Apply Adjustment",
        submitting: "Processing Adjustment...",
        instructions: {
          title: "Instructions",
          percentageTitle: "Percentage Adjustment:",
          percentage1: "Type desired percentage (e.g. 5.5 for a 5.5% increase)",
          percentage2: "Use negative values for decrease (e.g. -3.2 for a 3.2% decrease)",
          percentage3: "The adjustment will be applied to all table values",
          percentage4: "Values will be rounded to 2 decimal places",
          manualTitle: "Manual Insertion:",
          manual1: "Download the template with the current structure",
          manual2: "Fill in the desired new values",
          manual3: "Upload the filled file",
          manual4: "Blank values will retain current data"
        }
      },
      instructions: {
        title: "Usage Instructions",
        step1: "1. Download the Excel template corresponding to the data type to import",
        step2: "2. Fill the file strictly following the layout provided",
        step3: "3. Upload the filled file",
        step4: "4. Wait for processing and check the results",
        step5: "5. Fix eventual errors and re-import if necessary"
      },
      messages: {
        templateError: "Error generating template: {{error}}. Check inputs.",
        unsupportedTemplate: "Unsupported template type",
        unsupportedImport: "Unsupported import type",
        processError: "Error processing file",
        adjustError: "Error applying adjustment",
        saveSuccess: "ERP configurations successfully saved!",
        saveError: "Error saving ERP configurations",
        importSuccessAlert: "Template successfully imported! {{count}} record(s) processed.",
        importErrorAlert: "Error processing file: {{error}}"
      },
      deployAgent: {
        title: "Deploy Agent",
        description: "Automated deployment with Artificial Intelligence",
        subDescription: "Upload your data and let AI configure the entire system automatically",
        newProjectBtn: "New Project",
        features: {
          uploadTitle: "Smart Upload",
          uploadDesc: "Upload sheets and files, AI automatically identifies the data type",
          aiTitle: "AI Interpretation",
          aiDesc: "OpenAI analyzes, validates, and maps fields automatically",
          executeTitle: "Auto-Execution",
          executeDesc: "Automatic parametrization of records, tables, and integrations",
          monitorTitle: "Monitoring",
          monitorDesc: "Real-time dashboard showing status, errors, and improvement suggestions"
        },
        projectsTitle: "Deployment Projects",
        loadingProjects: "Loading projects...",
        noProjects: "No projects created yet",
        createFirstProjectBtn: "Create First Project",
        clientPrefix: "Client: ",
        startedAt: "Started: ",
        progressPrefix: "Progress: ",
        completedAt: "Completed: ",
        viewDetails: "View Details",
        deleteProjectTitle: "Delete Project",
        statuses: {
          pending: "Pending",
          collecting: "Collecting",
          interpreting: "Interpreting",
          executing: "Executing",
          completed: "Completed",
          failed: "Failed"
        },
        newProjectModal: {
          title: "New Deployment Project",
          projectName: "Project Name *",
          projectNamePlaceholder: "Ex: Client ABC Deployment",
          clientName: "Client Name *",
          clientNamePlaceholder: "Ex: XYZ Inc.",
          autoExecute: "Execute automatically after interpretation",
          requireApproval: "Require approval before executing",
          cancelBtn: "Cancel",
          createBtn: "Create Project"
        },
        deleteConfirm: {
          title: "Are you sure you want to delete this project?",
          message: "Project: \"{{name}}\"\n\nThis action cannot be undone.",
          confirmBtn: "OK",
          cancelBtn: "Cancel"
        },
        dashboard: {
          backBtn: "Back to Projects",
          uploadBtn: "Upload Files",
          stats: {
            progress: "Progress",
            steps: "{{completed}} of {{total}} steps",
            errors: "Errors",
            errorsDesc: "Require attention",
            warnings: "Warnings",
            warningsDesc: "For review",
            suggestions: "Suggestions",
            suggestionsDesc: "Possible improvements"
          },
          generalProgress: "Overall Progress",
          implementation: "Implementation",
          steps: {
            collection: "Collection",
            interpretation: "Interpretation",
            execution: "Execution",
            completed: "Completed"
          },
          uploads: {
            title: "Uploaded Files",
            noUploads: "No files uploaded yet",
            executeBtn: "Execute Import",
            statuses: {
              executed: "Imported (100%)",
              validated: "Waiting for Import"
            }
          },
          validations: {
            title: "Validations",
            noValidations: "No validations registered",
            fieldPrefix: "Field: "
          },
          suggestions: {
            title: "Improvement Suggestions",
            noSuggestions: "No suggestions available",
            approveBtn: "Approve"
          }
        },
        uploader: {
          title: "Upload File",
          description: "AI will interpret and configure it automatically",
          dataType: "Data Type *",
          categories: {
            erpIntegration: "ERP Integration",
            carriers: "Carriers",
            freightTables: "Freight Tables",
            cities: "Cities",
            fees: "Table Fees",
            restrictedZips: "Restricted Zips",
            tableAdjustments: "Adjust Table"
          },
          fileLabel: "File *",
          dropzoneClick: "Click to select or drag the file",
          dropzoneFormats: "Formats: XLSX, XLS, CSV, TXT",
          statusMessages: {
            idle: "Sending file...",
            success: "File successfully uploaded!",
            processing: "Processing with AI...",
            completed: "Processing complete!"
          },
          howItWorks: {
            title: "How does it work?",
            item1: "AI identifies the data structure automatically",
            item2: "Validates required fields and formats",
            item3: "Maps fields to the database",
            item4: "Detects errors and suggests improvements",
            item5: "Configure records automatically",
            devMode: "Dev Mode:",
            devModeDesc: "If OpenAI is not configured, mocks interpretation for demo."
          },
          cancelBtn: "Cancel",
          sendBtn: "Send and Process",
          sendingBtn: "Sending...",
          processingBtn: "Processing..."
        },
        messages: {
          loadError: "Error loading projects",
          fillRequired: "Fill all required fields",
          createSuccess: "Project successfully created!",
          deleteSuccess: "Project successfully deleted!",
          approveSuggestionError: "Error approving suggestion",
          executeUploadSuccess: "File processed and imported successfully!",
          executeUploadError: "Error executing import",
          uploadValidationMissing: "Select a category and a file"
        }
      }
    }
  },
  es: {
    implementationCenter: {
      title: "Centro de Implementación",
      description: "Importe datos y gestione configuraciones masivamente para acelerar la implementación",
      tabs: {
        deployAgent: "Deploy Agent IA",
        erpIntegration: "Integración ERP",
        carriers: "Transportistas",
        freightTables: "Tablas de Flete",
        cities: "Ciudades",
        tableFees: "Tasas de la Tabla",
        restrictedCeps: "Códigos Postales Restringidos",
        adjustTables: "Reajustar Tablas",
      },
      erpIntegration: {
        configTitle: "Configuración de Integración ERP",
        template: {
          title: "Plantilla de Configuración",
          description: "Descargue la plantilla o importe configuraciones existentes",
          downloadBtn: "Plantilla",
          importBtn: "Importar",
          processing: "Procesando archivo...",
          success: "¡Archivo importado con éxito!",
          successDesc: "{{count}} registro(s) procesado(s). Los campos se completaron automáticamente con los datos del primer registro."
        },
        selectErp: "Seleccione el ERP",
        selectErpPlaceholder: "Seleccione un ERP...",
        connection: {
          title: "Configuraciones de Conexión",
          serviceLayerAddress: "Dirección de Service Layer",
          port: "Puerto",
          username: "Usuario",
          password: "Contraseña",
          database: "Base de Datos"
        },
        cte: {
          title: "Configuraciones CT-e",
          integrationType: "Tipo de Integración CT-e",
          typeDraft: "Borrador",
          typeEntry: "Factura de Entrada",
          cteModel: "Modelo CT-e",
          invoiceModel: "Modelo Factura"
        },
        billing: {
          title: "Configuraciones de Facturación",
          nfeItem: "Elemento de Facturación NF-e",
          usage: "Uso de Facturación",
          controlAccount: "Cuenta Control de Facturación"
        },
        invoice: {
          title: "Configuraciones de Notas Fiscales",
          outboundItem: "Elemento de Nota Fiscal de Salida desde CT-e",
          cteWithoutNfItem: "Elemento para CT-e sin Nota Fiscal",
          cteUsage: "Uso de CT-e",
          inboundControlAccount: "Cuenta Control para emisión de Nota Fiscal de Entrada",
          transitoryAccount: "Cuenta Transitoria para cierre de Factura"
        },
        additional: {
          title: "Configuraciones Adicionales",
          nfeXmlAddress: "Dirección de red XMLs de NF-e",
          fiscalModule: "Módulo Fiscal"
        },
        saveBtn: "Guardar Configuraciones",
        saving: "Guardando...",
        importConfig: {
          title: "Importación de Configuraciones",
          clickUpload: "Haga clic para subir",
          dragDrop: "o arrastre y suelte",
          fileType: "Archivo Excel (.xlsx)"
        }
      },
      imports: {
        templateExcel: "Plantilla Excel",
        downloadTemplate: "Descargar Plantilla",
        dragDrop: "Arrastre el archivo Excel aquí o haga clic para seleccionar",
        acceptedFormats: "Formatos aceptados: .xlsx, .xls",
        selectFile: "Seleccionar Archivo",
        processing: "Procesando importación...",
        recordsProcessed: "Registros procesados: {{count}}",
        errorsFound: "Errores encontrados:",
        carriers: {
          title: "Importar Transportistas",
          description: "Importe transportistas masivamente desde archivo Excel",
          templateName: "plantilla_transportistas.xlsx"
        },
        freight: {
          title: "Importar Tablas de Flete",
          description: "Importe tablas de flete con rangos por transportista",
          templateName: "plantilla_tablas_flete.xlsx"
        },
        cities: {
          title: "Importar Ciudades de Tabla",
          description: "Importar ciudades vinculadas a las tablas de flete",
          templateName: "plantilla_ciudades.xlsx"
        },
        fees: {
          title: "Importar Tasas de Tabla",
          description: "Cargue un Excel con las tasas (peaje, colección, etc) de las tablas.",
          templateName: "plantilla_tasas_tabla.xlsx"
        },
        restrictedCeps: {
          title: "Importar Códigos Postales Restringidos",
          description: "Cargue un Excel con los CP restringidos por transportista.",
          templateName: "plantilla_cps_restringidos.xlsx"
        }
      },
      adjustment: {
        infoTitle: "Reajuste de Tablas de Flete",
        infoDesc: "Aplique reajustes masivos en tablas de flete activas. Elija entre porcentaje o inserción manual de valores.",
        configTitle: "Configuración del Reajuste",
        type: "Tipo de Reajuste",
        typePercentage: "Aplicar Porcentaje",
        typeManual: "Inserción Manual de Valores",
        percentageLabel: "Porcentaje de Reajuste (%)",
        percentagePlaceholder: "Ej: 5.5 (aumento) o -3.2 (reducción)",
        percentageHint: "Use valores positivos para aumento y negativos para reducción",
        manualLabel: "Archivo Excel con Nuevos Valores",
        manualUploadDesc: "Haga clic o arrastre el archivo aquí",
        manualUploadHint: "Solo archivos Excel (.xlsx, .xls)",
        downloadManualTemplate: "Descargar Plantilla para Nuevos Valores",
        tablesToAdjust: "Tablas a Reajustar",
        allTables: "Todas las Tablas Activas",
        submitBtn: "Aplicar Reajuste",
        submitting: "Procesando Reajuste...",
        instructions: {
          title: "Instrucciones",
          percentageTitle: "Reajuste por Porcentaje:",
          percentage1: "Escriba el porcentaje deseado (ej: 5.5 para subir 5,5%)",
          percentage2: "Use negativos para reducción (ej: -3.2 para reducir 3,2%)",
          percentage3: "Se aplicará a todos los valores de la tabla",
          percentage4: "Los valores se redondearán a 2 decimales",
          manualTitle: "Inserción Manual:",
          manual1: "Descargue la plantilla con la estructura actual",
          manual2: "Rellene con los nuevos valores deseados",
          manual3: "Suba el archivo rellenado",
          manual4: "Valores en blanco mantendrán el dato actual"
        }
      },
      instructions: {
        title: "Instrucciones de Uso",
        step1: "1. Descarga la plantilla de Excel según el tipo de datos a importar",
        step2: "2. Rellene el archivo siguiendo exactamente el formato",
        step3: "3. Suba el archivo importado",
        step4: "4. Espere y valide los resultados",
        step5: "5. Corrija los posibles errores y re-importe"
      },
      messages: {
        templateError: "Error al generar plantilla: {{error}}.",
        unsupportedTemplate: "Tipo de plantilla no compatible",
        unsupportedImport: "Tipo de importación no compatible",
        processError: "Error al procesar archivo",
        adjustError: "Error al aplicar el reajuste",
        saveSuccess: "Configuraciones ERP guardadas con éxito",
        saveError: "Error al guardar configuraciones ERP",
        importSuccessAlert: "Plantilla importada con éxito. {{count}} registro(s) procesado(s).",
        importErrorAlert: "Error al procesar el archivo: {{error}}"
      },
      deployAgent: {
        title: "Deploy Agent",
        description: "Implementación automatizada con Inteligencia Artificial",
        subDescription: "Envíe sus datos y deje que la IA configure todo el sistema",
        newProjectBtn: "Nuevo Proyecto",
        features: {
          uploadTitle: "Subida Inteligente",
          uploadDesc: "Envíe registros, la IA identifica el tipo de datos",
          aiTitle: "Interpretación IA",
          aiDesc: "OpenAI valida, mapea y analiza automáticamente",
          executeTitle: "Auto-Ejecución",
          executeDesc: "Parametrizaciones automáticas de tablas e integraciones",
          monitorTitle: "Monitoreo",
          monitorDesc: "Panel de estado, errores y sugerencias en tiempo real"
        },
        projectsTitle: "Proyectos de Implementación",
        loadingProjects: "Cargando proyectos...",
        noProjects: "Aún no hay proyectos",
        createFirstProjectBtn: "Crear Primer Proyecto",
        clientPrefix: "Cliente: ",
        startedAt: "Iniciado al: ",
        progressPrefix: "Progreso: ",
        completedAt: "Finalizado: ",
        viewDetails: "Ver detalles",
        deleteProjectTitle: "Eliminar proyecto",
        statuses: {
          pending: "Pendiente",
          collecting: "Recopilando",
          interpreting: "Interpretando",
          executing: "Ejecutando",
          completed: "Completado",
          failed: "Fallido"
        },
        newProjectModal: {
          title: "Nuevo Proyecto de Implementación",
          projectName: "Nombre de Proyecto *",
          projectNamePlaceholder: "Ej: Cliente Implementación ABC",
          clientName: "Nombre de Cliente *",
          clientNamePlaceholder: "Ej: Empleo XYZ S.A",
          autoExecute: "Ejecutar automáticamente tras interpretar",
          requireApproval: "Requerir verificación antes de ejecución",
          cancelBtn: "Cancelar",
          createBtn: "Crear Proyecto"
        },
        deleteConfirm: {
          title: "¿Estás seguro que deseas eliminarlo?",
          message: "Proyecto: \"{{name}}\"\n\nNó puede ser deshecho.",
          confirmBtn: "Vale",
          cancelBtn: "Cancelar"
        },
        dashboard: {
          backBtn: "Volver a Proyectos",
          uploadBtn: "Subir Archivos",
          stats: {
            progress: "Progreso",
            steps: "{{completed}} de {{total}} hitos",
            errors: "Errores",
            errorsDesc: "Pendientes",
            warnings: "Advertencias",
            warningsDesc: "Para revisión",
            suggestions: "Sugerencias",
            suggestionsDesc: "Mejoras potenciales"
          },
          generalProgress: "Progreso General",
          implementation: "Implementación",
          steps: {
            collection: "Colección",
            interpretation: "Interprete",
            execution: "Ejecución",
            completed: "Finalizado"
          },
          uploads: {
            title: "Archivos Cargados",
            noUploads: "Ningún archivo todavia",
            executeBtn: "Efectuar importación",
            statuses: {
              executed: "Importado (100%)",
              validated: "Aguardando ejecución"
            }
          },
          validations: {
            title: "Validaciones",
            noValidations: "Ningún resultado",
            fieldPrefix: "Dato: "
          },
          suggestions: {
            title: "Posibles Ajustes",
            noSuggestions: "Sin consejos.",
            approveBtn: "Aprobar"
          }
        },
        uploader: {
          title: "Cargar Archivo",
          description: "La IA interpretará y configurará automáticamente",
          dataType: "Dato General *",
          categories: {
            erpIntegration: "Integración ERP",
            carriers: "Transportistas",
            freightTables: "Tablas de Flete",
            cities: "Ciudades",
            fees: "Tasas de Tablas",
            restrictedZips: "CPs Restringidos",
            tableAdjustments: "Ajustar Tabla"
          },
          fileLabel: "Fichero *",
          dropzoneClick: "Seleccione o arrastre archivo",
          dropzoneFormats: "Permitido: XLSX, XLS, CSV, TXT",
          statusMessages: {
            idle: "Cargando archivo...",
            success: "Fichero enviado con éxito",
            processing: "Evaluando con IA...",
            completed: "Completado proceso exitosamente."
          },
          howItWorks: {
            title: "¿Como usar?",
            item1: "La IA detecta los detalles estructuralmente",
            item2: "Analiza campos y formatos requeridos",
            item3: "Líga las variables en base de datos",
            item4: "Previene averías y expédie correcciónes",
            item5: "Registra en vivo el catálogo",
            devMode: "Modo Prueba:",
            devModeDesc: "Si OpenAI bloquea, un marco fijo asume las labores"
          },
          cancelBtn: "Cancelar",
          sendBtn: "Verificar y Ejecutar",
          sendingBtn: "Comprobando...",
          processingBtn: "Evaluando..."
        },
        messages: {
          loadError: "Declinado cargue proyectos",
          fillRequired: "Escriba los campos requeridos",
          createSuccess: "Agregó un éxito proyecto",
          deleteSuccess: "Eliminado con validez",
          approveSuggestionError: "No verificó propuesta",
          executeUploadSuccess: "Cargando y listado totalemente listo",
          executeUploadError: "Surgió complicativo importar",
          uploadValidationMissing: "Decida categoria e importe."
        }
      }
    }
  }
};

function injectTranslations() {
  for (const lang of languages) {
    const localePath = path.join(localesDir, lang, 'translation.json');

    if (!fs.existsSync(localePath)) {
      console.warn(`File not found for language ${lang}: ${localePath}`);
      continue;
    }

    try {
      const fileContent = fs.readFileSync(localePath, 'utf8');
      const translations = JSON.parse(fileContent);

      // Inject the block
      translations['implementationCenter'] = implementationCenterTranslations[lang].implementationCenter;

      fs.writeFileSync(localePath, JSON.stringify(translations, null, 2), 'utf8');
      console.log(`Successfully injected implementationCenter translations into ${lang}/translation.json`);

    } catch (error) {
      console.error(`Error processing file ${localePath}:`, error);
    }
  }
}

injectTranslations();
