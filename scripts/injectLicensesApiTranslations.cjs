const fs = require('fs');
const path = require('path');

const ptPath = path.resolve(__dirname, '../src/locales/pt/translation.json');
const enPath = path.resolve(__dirname, '../src/locales/en/translation.json');
const esPath = path.resolve(__dirname, '../src/locales/es/translation.json');

const translationsToAdd = {
  pt: {
    licenses: {
      title: "Administração de Licenças",
      subtitle: "Gerencie as licenças de acesso ao sistema",
      counters: {
        total: "Total Contratadas",
        inUse: "Em Uso",
        available: "Disponíveis"
      },
      searchUser: "Buscar usuário...",
      actions: {
        newUser: "Novo Usuário",
        history: "Histórico",
        purchase: "Adquirir Licenças",
        editUser: "Editar usuário",
        revokeLicense: "Remover licença",
        transferLicense: "Transferir licença",
        assignLicense: "Atribuir licença"
      },
      table: {
        code: "Código",
        name: "Nome",
        profile: "Perfil",
        status: "Status",
        license: "Licença",
        licenseCode: "Código de Licença",
        actions: "Ações"
      },
      status: {
        active: "Ativo",
        inactive: "Inativo",
        licensed: "Licenciado",
        unlicensed: "Não licenciado"
      },
      historyTitle: "Histórico de Movimentações",
      historyMessages: {
        assigned: "Atribuída",
        revoked: "Removida",
        transferred: "Transferida",
        purchased: "Adquiridas",
        by: "Por"
      },
      purchaseModal: {
        title: "Adquirir Novas Licenças",
        warning: "O valor das novas licenças será adicionado à sua mensalidade. Nossa equipe entrará em contato para confirmar a aquisição.",
        quantityMsg: "Quantidade de licenças",
        estimatedValue: "Valor estimado por licença:",
        totalMonthly: "Total mensal adicional:",
        cancel: "Cancelar",
        request: "Solicitar",
        processing: "Processando..."
      },
      transferModal: {
        title: "Transferir Licença",
        from: "De:",
        to: "Transferir para:",
        selectUser: "Selecione um usuário",
        cancel: "Cancelar",
        transfer: "Transferir",
        transferring: "Transferindo..."
      },
      messages: {
        loading: "Carregando licenças...",
        assignSuccess: "Licença atribuída com sucesso!",
        assignError: "Erro ao atribuir licença",
        revokeSuccess: "Licença removida com sucesso!",
        revokeError: "Erro ao remover licença",
        transferSuccess: "Licença transferida com sucesso!",
        transferError: "Erro ao transferir licença",
        purchaseSuccess: "{{count}} licença(s) solicitada(s) com sucesso!",
        purchaseError: "Erro ao solicitar licenças",
        saveUserSuccess: "Usuário atualizado com sucesso!",
        createUserSuccess: "Usuário criado com sucesso!",
        saveUserError: "Erro ao salvar usuário."
      }
    },
    apiKeys: {
      title: "Gerenciamento de Chaves de API",
      subtitle: "Gerencie, rotacione e monitore todas as chaves de API do sistema",
      actions: {
        refresh: "Atualizar",
        newKey: "Nova Chave",
        firstKey: "Cadastrar Primeira Chave"
      },
      stats: {
        total: "Total de Chaves",
        active: "Ativas",
        inactive: "Inativas",
        expiring: "Expirando",
        overLimit: "Acima do Limite"
      },
      alerts: {
        activeAlerts: "Alertas Ativos ({{count}})",
        moreAlerts: "+{{count}} mais alertas"
      },
      filters: {
        search: "Buscar chaves...",
        allTypes: "Todos os Tipos",
        allStatus: "Todos os Status",
        statusActive: "Ativas",
        statusInactive: "Inativas"
      },
      empty: {
        filtered: "Nenhuma chave encontrada com os filtros aplicados",
        noKeys: "Nenhuma chave de API cadastrada"
      },
      messages: {
        deleteConfirm: "Tem certeza que deseja excluir a chave \"{{name}}\"?",
        deleteSuccess: "Chave de API excluída com sucesso!",
        deleteError: "Erro ao excluir a chave. Tente novamente."
      },
      card: {
        inactive: "Inativa",
        limitExceeded: "Limite Excedido",
        approachingLimit: "Próximo do Limite",
        active: "Ativa",
        key: "Chave:",
        hide: "Ocultar",
        show: "Mostrar",
        copy: "Copiar",
        monthlyUsage: "Uso Mensal",
        lastRotation: "Última rotação:",
        never: "Nunca",
        daysAgo: "(há {{count}} dias)",
        lastUse: "Último uso:",
        expiresIn: "Expira em:",
        autoRotation: "🔄 Automática",
        rotate: "Rotacionar",
        history: "Histórico",
        delete: "Excluir"
      },
      historyModal: {
        title: "Histórico de Rotações",
        noRotations: "Nenhuma rotação registrada ainda",
        noReason: "Sem motivo especificado",
        oldKey: "Chave Anterior (Hash)",
        newKey: "Chave Nova (Hash)",
        rotatedBy: "Rotacionado por:",
        metadata: "Metadados",
        aboutHistory: "Sobre o Histórico",
        aboutText: "O histórico registra todas as rotações de chaves com hashes SHA-256 das chaves (não as chaves em si) para fins de auditoria e compliance. As chaves antigas nunca são armazenadas por questões de segurança.",
        close: "Fechar"
      },
      rotationModal: {
        title: "Rotacionar Chave de API",
        warningTitle: "Atenção",
        warningText: "A rotação da chave substituirá a chave atual por uma nova. Certifique-se de que a nova chave está correta antes de confirmar. Esta ação ficará registrada no histórico de auditoria.",
        currentKey: "Chave Atual",
        newKey: "Nova Chave de API *",
        newKeyPlaceholder: "Cole aqui a nova chave de API...",
        testKey: "Testar Chave",
        testing: "Testando...",
        rotationType: "Tipo de Rotação *",
        rotationReason: "Motivo da Rotação *",
        reasonPlaceholder: "Selecione um motivo...",
        reasons: {
          security: "Rotação preventiva de segurança",
          compromised: "Chave comprometida",
          scheduled: "Rotação programada",
          expiration: "Expiração da chave",
          improvement: "Melhoria de segurança",
          vendorChange: "Troca de fornecedor",
          other: "Outro"
        },
        notes: "Notas Adicionais",
        notesPlaceholder: "Informações adicionais sobre a rotação...",
        currentInfo: "Informações da Chave Atual",
        lastRotation: "Última rotação:",
        monthlyUsage: "Uso mensal:",
        unlimited: "Ilimitado",
        cancel: "Cancelar",
        rotate: "Rotacionar Chave",
        rotating: "Rotacionando...",
        messages: {
          fillNewKey: "Por favor, insira a nova chave de API",
          fillReason: "Por favor, informe o motivo da rotação",
          rotateSuccess: "Chave rotacionada com sucesso!",
          rotateError: "Erro ao rotacionar a chave. Tente novamente.",
          fillTestKey: "Por favor, insira uma chave para testar",
          testError: "Erro ao testar a chave"
        }
      },
      formModal: {
        title: "Nova Chave de API",
        subtitle: "Cadastre uma nova chave de API no sistema",
        keyType: "Tipo de Chave *",
        environment: "Ambiente *",
        environments: {
          production: "Produção",
          staging: "Staging",
          development: "Desenvolvimento"
        },
        keyName: "Nome da Chave *",
        keyNamePlaceholder: "Ex: Google Maps API Principal",
        description: "Descrição",
        descPlaceholder: "Descrição opcional...",
        apiKey: "Chave de API *",
        apiKeyPlaceholder: "Cole a chave de API aqui...",
        monthlyLimit: "Limite Mensal",
        limitPlaceholder: "Ex: 100000",
        alertPercent: "Alerta em (%)",
        expirationDate: "Data de Expiração",
        alertEmails: "Emails para Alertas (separados por vírgula)",
        emailsPlaceholder: "email1@example.com, email2@example.com",
        activeImmediately: "Ativar chave imediatamente",
        cancel: "Cancelar",
        create: "Criar Chave",
        creating: "Criando...",
        messages: {
          fillRequired: "Por favor, preencha os campos obrigatórios",
          createSuccess: "Chave de API criada com sucesso!",
          duplicateKey: "Já existe uma chave ativa deste tipo para este ambiente. Desative a chave existente primeiro.",
          createError: "Erro ao criar chave de API. Tente novamente."
        }
      }
    }
  },
  en: {
    licenses: {
      title: "License Administration",
      subtitle: "Manage system access licenses",
      counters: {
        total: "Total Contracted",
        inUse: "In Use",
        available: "Available"
      },
      searchUser: "Search user...",
      actions: {
        newUser: "New User",
        history: "History",
        purchase: "Purchase Licenses",
        editUser: "Edit user",
        revokeLicense: "Revoke license",
        transferLicense: "Transfer license",
        assignLicense: "Assign license"
      },
      table: {
        code: "Code",
        name: "Name",
        profile: "Profile",
        status: "Status",
        license: "License",
        licenseCode: "License Code",
        actions: "Actions"
      },
      status: {
        active: "Active",
        inactive: "Inactive",
        licensed: "Licensed",
        unlicensed: "Unlicensed"
      },
      historyTitle: "Movement History",
      historyMessages: {
        assigned: "Assigned",
        revoked: "Revoked",
        transferred: "Transferred",
        purchased: "Purchased",
        by: "By"
      },
      purchaseModal: {
        title: "Purchase New Licenses",
        warning: "The value of the new licenses will be added to your monthly fee. Our team will contact you to confirm the acquisition.",
        quantityMsg: "Number of licenses",
        estimatedValue: "Estimated value per license:",
        totalMonthly: "Additional monthly total:",
        cancel: "Cancel",
        request: "Request",
        processing: "Processing..."
      },
      transferModal: {
        title: "Transfer License",
        from: "From:",
        to: "Transfer to:",
        selectUser: "Select a user",
        cancel: "Cancel",
        transfer: "Transfer",
        transferring: "Transferring..."
      },
      messages: {
        loading: "Loading licenses...",
        assignSuccess: "License assigned successfully!",
        assignError: "Error assigning license",
        revokeSuccess: "License revoked successfully!",
        revokeError: "Error revoking license",
        transferSuccess: "License transferred successfully!",
        transferError: "Error transferring license",
        purchaseSuccess: "{{count}} license(s) requested successfully!",
        purchaseError: "Error requesting licenses",
        saveUserSuccess: "User updated successfully!",
        createUserSuccess: "User created successfully!",
        saveUserError: "Error saving user."
      }
    },
    apiKeys: {
      title: "API Keys Management",
      subtitle: "Manage, rotate, and monitor all system API keys",
      actions: {
        refresh: "Refresh",
        newKey: "New Key",
        firstKey: "Register First Key"
      },
      stats: {
        total: "Total Keys",
        active: "Active",
        inactive: "Inactive",
        expiring: "Expiring",
        overLimit: "Over Limit"
      },
      alerts: {
        activeAlerts: "Active Alerts ({{count}})",
        moreAlerts: "+{{count}} more alerts"
      },
      filters: {
        search: "Search keys...",
        allTypes: "All Types",
        allStatus: "All Status",
        statusActive: "Active",
        statusInactive: "Inactive"
      },
      empty: {
        filtered: "No keys found with the applied filters",
        noKeys: "No API keys registered"
      },
      messages: {
        deleteConfirm: "Are you sure you want to delete the key \"{{name}}\"?",
        deleteSuccess: "API key deleted successfully!",
        deleteError: "Error deleting key. Try again."
      },
      card: {
        inactive: "Inactive",
        limitExceeded: "Limit Exceeded",
        approachingLimit: "Approaching Limit",
        active: "Active",
        key: "Key:",
        hide: "Hide",
        show: "Show",
        copy: "Copy",
        monthlyUsage: "Monthly Usage",
        lastRotation: "Last rotation:",
        never: "Never",
        daysAgo: "({{count}} days ago)",
        lastUse: "Last use:",
        expiresIn: "Expires in:",
        autoRotation: "🔄 Automatic",
        rotate: "Rotate",
        history: "History",
        delete: "Delete"
      },
      historyModal: {
        title: "Rotation History",
        noRotations: "No rotations recorded yet",
        noReason: "No reason specified",
        oldKey: "Old Key (Hash)",
        newKey: "New Key (Hash)",
        rotatedBy: "Rotated by:",
        metadata: "Metadata",
        aboutHistory: "About History",
        aboutText: "The history records all key rotations with SHA-256 hashes of the keys (not the keys themselves) for audit and compliance purposes. Old keys are never stored for security reasons.",
        close: "Close"
      },
      rotationModal: {
        title: "Rotate API Key",
        warningTitle: "Attention",
        warningText: "Rotating the key will replace the current key with a new one. Ensure the new key is correct before confirming. This action will be recorded in the audit history.",
        currentKey: "Current Key",
        newKey: "New API Key *",
        newKeyPlaceholder: "Paste the new API key here...",
        testKey: "Test Key",
        testing: "Testing...",
        rotationType: "Rotation Type *",
        rotationReason: "Rotation Reason *",
        reasonPlaceholder: "Select a reason...",
        reasons: {
          security: "Preventive security rotation",
          compromised: "Compromised key",
          scheduled: "Scheduled rotation",
          expiration: "Key expiration",
          improvement: "Security improvement",
          vendorChange: "Vendor change",
          other: "Other"
        },
        notes: "Additional Notes",
        notesPlaceholder: "Additional information about the rotation...",
        currentInfo: "Current Key Info",
        lastRotation: "Last rotation:",
        monthlyUsage: "Monthly usage:",
        unlimited: "Unlimited",
        cancel: "Cancel",
        rotate: "Rotate Key",
        rotating: "Rotating...",
        messages: {
          fillNewKey: "Please enter the new API key",
          fillReason: "Please provide a rotation reason",
          rotateSuccess: "Key rotated successfully!",
          rotateError: "Error rotating key. Try again.",
          fillTestKey: "Please enter a key to test",
          testError: "Error testing key"
        }
      },
      formModal: {
        title: "New API Key",
        subtitle: "Register a new API key in the system",
        keyType: "Key Type *",
        environment: "Environment *",
        environments: {
          production: "Production",
          staging: "Staging",
          development: "Development"
        },
        keyName: "Key Name *",
        keyNamePlaceholder: "Ex: Main Google Maps API",
        description: "Description",
        descPlaceholder: "Optional description...",
        apiKey: "API Key *",
        apiKeyPlaceholder: "Paste the API key here...",
        monthlyLimit: "Monthly Limit",
        limitPlaceholder: "Ex: 100000",
        alertPercent: "Alert at (%)",
        expirationDate: "Expiration Date",
        alertEmails: "Alert Emails (comma-separated)",
        emailsPlaceholder: "email1@example.com, email2@example.com",
        activeImmediately: "Activate key immediately",
        cancel: "Cancel",
        create: "Create Key",
        creating: "Creating...",
        messages: {
          fillRequired: "Please fill in the required fields",
          createSuccess: "API key created successfully!",
          duplicateKey: "An active key of this type already exists for this environment. Deactivate the existing key first.",
          createError: "Error creating API key. Try again."
        }
      }
    }
  },
  es: {
    licenses: {
      title: "Administración de Licencias",
      subtitle: "Gestione las licencias de acceso al sistema",
      counters: {
        total: "Total Contratadas",
        inUse: "En Uso",
        available: "Disponibles"
      },
      searchUser: "Buscar usuario...",
      actions: {
        newUser: "Nuevo Usuario",
        history: "Historial",
        purchase: "Adquirir Licencias",
        editUser: "Editar usuario",
        revokeLicense: "Quitar licencia",
        transferLicense: "Transferir licencia",
        assignLicense: "Asignar licencia"
      },
      table: {
        code: "Código",
        name: "Nombre",
        profile: "Perfil",
        status: "Estado",
        license: "Licencia",
        licenseCode: "Código de Licencia",
        actions: "Acciones"
      },
      status: {
        active: "Activo",
        inactive: "Inactivo",
        licensed: "Licenciado",
        unlicensed: "No licenciado"
      },
      historyTitle: "Historial de Movimientos",
      historyMessages: {
        assigned: "Asignada",
        revoked: "Quitada",
        transferred: "Transferida",
        purchased: "Adquiridas",
        by: "Por"
      },
      purchaseModal: {
        title: "Adquirir Nuevas Licencias",
        warning: "El valor de las nuevas licencias se agregará a su tarifa mensual. Nuestro equipo se pondrá en contacto para confirmar la adquisición.",
        quantityMsg: "Cantidad de licencias",
        estimatedValue: "Valor estimado por licencia:",
        totalMonthly: "Total mensual adicional:",
        cancel: "Cancelar",
        request: "Solicitar",
        processing: "Procesando..."
      },
      transferModal: {
        title: "Transferir Licencia",
        from: "De:",
        to: "Transferir a:",
        selectUser: "Seleccione un usuario",
        cancel: "Cancelar",
        transfer: "Transferir",
        transferring: "Transfiriendo..."
      },
      messages: {
        loading: "Cargando licencias...",
        assignSuccess: "¡Licencia asignada con éxito!",
        assignError: "Error al asignar licencia",
        revokeSuccess: "¡Licencia quitada con éxito!",
        revokeError: "Error al quitar licencia",
        transferSuccess: "¡Licencia transferida con éxito!",
        transferError: "Error al transferir licencia",
        purchaseSuccess: "¡{{count}} licencia(s) solicitada(s) con éxito!",
        purchaseError: "Error al solicitar licencias",
        saveUserSuccess: "¡Usuario actualizado con éxito!",
        createUserSuccess: "¡Usuario creado con éxito!",
        saveUserError: "Error al guardar usuario."
      }
    },
    apiKeys: {
      title: "Gestión de Claves de API",
      subtitle: "Administre, rote y supervise todas las claves de API del sistema",
      actions: {
        refresh: "Actualizar",
        newKey: "Nueva Clave",
        firstKey: "Registrar Primera Clave"
      },
      stats: {
        total: "Total de Claves",
        active: "Activas",
        inactive: "Inactivas",
        expiring: "A punto de expirar",
        overLimit: "Por encima del límite"
      },
      alerts: {
        activeAlerts: "Alertas Activas ({{count}})",
        moreAlerts: "+{{count}} alertas más"
      },
      filters: {
        search: "Buscar claves...",
        allTypes: "Todos los Tipos",
        allStatus: "Todos los Estados",
        statusActive: "Activas",
        statusInactive: "Inactivas"
      },
      empty: {
        filtered: "No se encontraron claves con los filtros aplicados",
        noKeys: "No hay claves de API registradas"
      },
      messages: {
        deleteConfirm: "¿Está seguro de que desea eliminar la clave \"{{name}}\"?",
        deleteSuccess: "¡Clave de API eliminada con éxito!",
        deleteError: "Error al eliminar la clave. Inténtelo de nuevo."
      },
      card: {
        inactive: "Inactiva",
        limitExceeded: "Límite Excedido",
        approachingLimit: "Cerca del Límite",
        active: "Activa",
        key: "Clave:",
        hide: "Ocultar",
        show: "Mostrar",
        copy: "Copiar",
        monthlyUsage: "Uso Mensual",
        lastRotation: "Última rotación:",
        never: "Nunca",
        daysAgo: "(hace {{count}} días)",
        lastUse: "Último uso:",
        expiresIn: "Expira en:",
        autoRotation: "🔄 Automática",
        rotate: "Rotar",
        history: "Historial",
        delete: "Eliminar"
      },
      historyModal: {
        title: "Historial de Rotaciones",
        noRotations: "No se han registrado rotaciones todavía",
        noReason: "Sin motivo especificado",
        oldKey: "Clave Anterior (Hash)",
        newKey: "Nueva Clave (Hash)",
        rotatedBy: "Rotado por:",
        metadata: "Metadatos",
        aboutHistory: "Acerca del Historial",
        aboutText: "El historial registra todas las rotaciones de claves con hashes SHA-256 de las claves (no las claves en sí) con fines de auditoría y cumplimiento. Las claves antiguas nunca se almacenan por razones de seguridad.",
        close: "Cerrar"
      },
      rotationModal: {
        title: "Rotar Clave de API",
        warningTitle: "Atención",
        warningText: "La rotación de la clave sustituirá la clave actual por una nueva. Asegúrese de que la nueva clave sea correcta antes de confirmar. Esta acción quedará registrada en el historial de auditoría.",
        currentKey: "Clave Actual",
        newKey: "Nueva Clave de API *",
        newKeyPlaceholder: "Pegue aquí la nueva clave de API...",
        testKey: "Probar Clave",
        testing: "Probando...",
        rotationType: "Tipo de Rotación *",
        rotationReason: "Motivo de la Rotación *",
        reasonPlaceholder: "Seleccione un motivo...",
        reasons: {
          security: "Rotación de seguridad preventiva",
          compromised: "Clave comprometida",
          scheduled: "Rotación programada",
          expiration: "Expiración de la clave",
          improvement: "Mejora de seguridad",
          vendorChange: "Cambio de proveedor",
          other: "Otro"
        },
        notes: "Notas Adicionales",
        notesPlaceholder: "Información adicional sobre la rotación...",
        currentInfo: "Información de la Clave Actual",
        lastRotation: "Última rotación:",
        monthlyUsage: "Uso mensual:",
        unlimited: "Ilimitado",
        cancel: "Cancelar",
        rotate: "Rotar Clave",
        rotating: "Rotando...",
        messages: {
          fillNewKey: "Por favor, introduzca la nueva clave de API",
          fillReason: "Por favor, proporcione un motivo de rotación",
          rotateSuccess: "¡Clave rotada con éxito!",
          rotateError: "Error al rotar la clave. Inténtelo de nuevo.",
          fillTestKey: "Por favor, introduzca una clave para probar",
          testError: "Error al probar la clave"
        }
      },
      formModal: {
        title: "Nueva Clave de API",
        subtitle: "Registre una nueva clave de API en el sistema",
        keyType: "Tipo de Clave *",
        environment: "Entorno *",
        environments: {
          production: "Producción",
          staging: "Staging",
          development: "Desarrollo"
        },
        keyName: "Nombre de la Clave *",
        keyNamePlaceholder: "Ej: API principal de Google Maps",
        description: "Descripción",
        descPlaceholder: "Descripción opcional...",
        apiKey: "Clave de API *",
        apiKeyPlaceholder: "Pegue la clave de API aquí...",
        monthlyLimit: "Límite Mensal",
        limitPlaceholder: "Ej: 100000",
        alertPercent: "Alerta en (%)",
        expirationDate: "Fecha de Expiración",
        alertEmails: "Correos para Alertas (separados por coma)",
        emailsPlaceholder: "correo1@ejemplo.com, correo2@ejemplo.com",
        activeImmediately: "Activar clave inmediatamente",
        cancel: "Cancelar",
        create: "Crear Clave",
        creating: "Creando...",
        messages: {
          fillRequired: "Por favor, rellene los campos obligatorios",
          createSuccess: "¡Clave de API creada con éxito!",
          duplicateKey: "Ya existe una clave activa de este tipo para este entorno. Primero desactive la clave existente.",
          createError: "Error al crear la clave de API. Inténtelo de nuevo."
        }
      }
    }
  }
};

function readJsonFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return null;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully updated ${filePath}`);
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
}

function updateTranslations() {
  const paths = { pt: ptPath, en: enPath, es: esPath };

  Object.keys(paths).forEach((lang) => {
    const filePath = paths[lang];
    const data = readJsonFile(filePath);

    if (data) {
      if (!data.licenses) data.licenses = {};
      if (!data.apiKeys) data.apiKeys = {};
      
      data.licenses = { ...data.licenses, ...translationsToAdd[lang].licenses };
      data.apiKeys = { ...data.apiKeys, ...translationsToAdd[lang].apiKeys };
      writeJsonFile(filePath, data);
    }
  });
}

updateTranslations();
