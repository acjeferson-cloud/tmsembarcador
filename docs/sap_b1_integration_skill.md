# 🔄 SKILL: Integração Bidirecional TMS Embarcador ↔ SAP Business One

Este documento define a arquitetura, regras de negócio, fluxos de dados e requisitos técnicos para a implementação da SKILL de integração entre o **TMS Embarcador** e o ERP **SAP Business One (Service Layer)**.

---

## 1. Escopo e Arquitetura dos Fluxos de Dados

A arquitetura prevê uma comunicação via REST API de forma bidirecional. O "middleware" ou serviço de integração (que pode ser hospedado numa cloud function, webhook listener no TMS ou engine de integração como n8n/Make) atuará como orquestrador.

### 📍 Fluxo A: Envio de Remessas/Pedidos (SAP ➡️ TMS)
- **Gatilho (Trigger):** Aprovação/Liberação de um Pedido de Venda (`Orders` - ObjType 17) ou Nota Fiscal de Saída (`Invoices` - ObjType 13) no SAP.
- **Ação:** O SAP dispara uma notificação (via *B1iF* ou script customizado no *TransactionNotification*) para o Módulo de Integração que faz um GET no Pedido completo via Service Layer.
- **Transformação:** Mapeia-se os dados de cabeçalho (`CardCode`, `DocTotal`), endereço de entrega e as linhas (`DocumentLines` - Peso, Volume, SKU) para o formato do TMS.
- **Destino:** `POST /api/shipments` no TMS Embarcador.

### 📍 Fluxo B: Retorno de Custos (TMS ➡️ SAP)
- **Gatilho:** Cotação gerada ou frete selecionado/negociado para a remessa no TMS Embarcador.
- **Ação:** O TMS dispara um Webhook ou faz push direto para a camada de integração.
- **Transformação:** Pega o custo do frete calculado e converte num `PATCH` ou atualização de despesas adicionais (*Freight Charges* no SAP).
- **Destino:** Atualização no SAP B1 (`PATCH /b1s/v1/Orders({DocEntry})` ou `/b1s/v1/Drafts({DocEntry})` se for esboço).

### 📍 Fluxo C: Tracking/Status de Entrega (TMS ➡️ SAP)
- **Gatilho:** Atualização de ocorrência ("Em trânsito", "Entregue") no painel do TMS Embarcador.
- **Ação:** Consome a notificação contendo os dados rastreados.
- **Destino SAP:** Pode atualizar `UDFs` (Campos de Usuário) na Nota Fiscal referente ao status, criar uma nova `Activity` atrelada ao Parceiro de Negócios, ou atualizar o status no Pedido Base.

> [!TIP]
> **Performance:** Para evitar sobrecarga no SAP, eventos de tracking podem ser empacotados num batch ou limitados apenas às mudanças de estado principais (ex: Saiu para Entrega, Entregue, Problema/Avaria).

---

## 2. Requisitos de Conexão e Autenticação

### Autenticação SAP B1 (Service Layer)
O Service Layer não utiliza OAuth/Tokens Bearer padrão, e sim autenticação baseada em Cookie / Sessão.
1. O integrador faz um `POST /b1s/v1/Login` passando `{ "CompanyDB": "COMP", "UserName": "usr", "Password": "pwd" }`.
2. A API devolve os cookies `B1SESSION` e `ROUTEID`.
3. Todas as requisições subsequentes devem repassar estes cookies no Header (ex: `Cookie: B1SESSION=xxx; ROUTEID=yyy;`).
4. **Renovação:** Se expirar, o SAP retornará `401 Unauthorized`. O fluxo deve engatilhar imediatamente um novo login, renovar a sessão e refazer a tentativa automaticamente antes de falhar (*Retry logic*).

### Autenticação TMS Embarcador
- API RESTful protegida por autenticação moderna através de HTTP Header:
  `Authorization: Bearer <SEU_JWT_TOKEN>` ou `x-api-key: <SUA_CHAVE>`.

---

## 3. Mapeamentos de Dados JSON (Request / Response)

### Exemplo 1: Payload de Envio (Aprovado no SAP ➡️ Integrador ➡️ TMS)
O Módulo agrupa as informações de *Delivery* recolhidas no Service Layer e traduz.

**Payload a ser enviado para o TMS (`POST /api/v1/shipments`):**
```json
{
  "referenceId": "1004592",          // DocNum no SAP
  "documentType": "NF-e",            // Pode ser OINV (Nota) ou ORDR (Pedido)
  "issueDate": "2026-04-01T10:00:00Z",
  "totalValue": 15000.50,            // DocTotal
  "sender": {
    "cnpj": "11.222.333/0001-44",
    "name": "Minha Empresa LTDA"
  },
  "receiver": {
    "cpfCnpj": "99.888.777/0001-66", // CardCode/LicTradNum no SAP
    "name": "Cliente Destino S/A",   // CardName
    "address": {
      "street": "Rua das Flores, 100",  // Address2
      "city": "São Paulo",              // City
      "state": "SP",                    // State
      "zipCode": "01000-000"            // ZipCode
    }
  },
  "volumes": [
    {
      "quantity": 10,
      "weightKg": 500.0,             // Somatório das DocumentLines
      "cubageM3": 1.2,
      "sku": "PROD-A01"
    }
  ]
}
```

### Exemplo 2: Retorno de Custos (TMS ➡️ Integrador ➡️ SAP B1)
Atualização do Pedido ou Cotação no SAP B1 com o valor consolidado da transportadora.

**Payload traduzido para atualização no SAP B1 (`PATCH /b1s/v1/Orders(1004592)`):**
```json
{
  "U_TMS_Carrier": "Jamef Transportes",     // Atualizando campo customizado de nome
  "U_TMS_FreightEst": 450.75,               // Custo calculado no TMS
  "U_TMS_TransitTime": 3,
  "DocumentLines": [ ... ]                  // Ou alternativamente, inserir Expenses/Fretes na tabela padrão DocumentAdditionalExpenses
}
```

---

## 4. Estrutura de Código (Node.js/TypeScript)

Caso esta SKILL seja estruturada como um microserviço/worker, eis um esqueleto abordando robustez, log estruturado e controle de sessão do Service Layer:

```typescript
import axios, { AxiosInstance } from 'axios';
import winston from 'winston'; // Para Logs Estruturados

// --- 1. Configuração do Log Estruturado (Resiliência Operacional) ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'integration-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'integration-combined.log' })
  ]
});

// --- 2. Controle Dinâmico da Sessão do SAP SL ---
export class SAPServiceLayer {
  private api: AxiosInstance;
  private sessionId: string | null = null;
  private routeId: string | null = null;

  constructor(baseURL: string) {
    this.api = axios.create({ baseURL });
  }

  // Efetua login e guarda cookies em memória
  async login() {
    const res = await this.api.post('/Login', {
      CompanyDB: process.env.SAP_DB,
      UserName: process.env.SAP_USER,
      Password: process.env.SAP_PASSWORD
    });
    
    // Extrai Cookies da resposta
    const setCookie = res.headers['set-cookie'] || [];
    this.sessionId = this.extractCookie(setCookie, 'B1SESSION');
    this.routeId = this.extractCookie(setCookie, 'ROUTEID');
    logger.info(`Session renovada. B1SESSION=${this.sessionId}`);
  }

  // Wrapper robusto que refaz o login se receber "401"
  async requestWithRetry(method: 'GET'|'POST'|'PATCH', endpoint: string, data?: any) {
    if (!this.sessionId) await this.login();

    try {
      return await this.executeRequest(method, endpoint, data);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        logger.warn('Token do SAP Expirado. Tentando reconectar...');
        await this.login(); // Renova
        return await this.executeRequest(method, endpoint, data); // Tenta novamente
      }
      // Se não for problema de auth, registrar o log do erro fatal e repassar
      logger.error('Erro na chamada SAP', { endpoint, payload: data, error: error.message });
      throw error;
    }
  }

  private executeRequest(method: string, endpoint: string, data?: any) {
    return this.api.request({
      method,
      url: endpoint,
      data,
      headers: { Cookie: `B1SESSION=${this.sessionId}; ROUTEID=${this.routeId}` }
    });
  }

  private extractCookie(cookies: string[], name: string) {
    const match = cookies.join(';').match(new RegExp(`${name}=([^;]+)`));
    return match ? match[1] : null;
  }
}

// --- 3. Função Principal Orquestradora ---
export async function syncOrderTask(docEntry: string) {
  const sap = new SAPServiceLayer('https://servidor-sap:50000/b1s/v1');
  
  try {
    // 1. Busca os dados no SAP
    const { data: order } = await sap.requestWithRetry('GET', `/Orders(${docEntry})`);
    
    // 2. Transforma (Mapper)
    const tmsPayload = {
      referenceId: order.DocNum,
      // ... mapear restos das propriedades conforme JSON acima
    };
    
    logger.info(`Enviando pedido ${order.DocNum} para o TMS...`, { payload: tmsPayload });
    
    // 3. Envia p/ TMS
    const tmsResponse = await axios.post('https://tms-embarcador.com/api/shipments', tmsPayload, {
      headers: { Authorization: `Bearer ${process.env.TMS_TOKEN}` } // Autenticação TMS API
    });
    
    logger.info(`Sucesso na sincronização do pedido ${order.DocNum}.`);
  } catch (err: any) {
    logger.error('Falha crítica na tarefa syncOrderTask', { docEntry, err: err.message });
    // Sistema deve sinalizar em um dead-letter-queue para processamento manual posterior.
  }
}
```

---

## 5. Passo a Passo Lógico / Visão para Setup em Nós (ex: n8n / Make.com)

Caso a integração seja configurada em motores como o **n8n**, os nós devem respeitar estritamente a seguinte lógica mecânica:

1. **Trigger Node**: 
   - Receber Webhook contínuo (no caso de disparo oriundo do SAP via B1iF ou evento no banco) contendo o ID do Pedido (`DocEntry`).
2. **Authentication Flow (Sub-workflow)**: 
   - Nó HTTP Request em `/b1s/v1/Login`.
   - Node Set (Armazena a variável de ambiente `B1SESSION` nos dados globais, para economizar requisições concorrentes).
3. **Fetch SAP Data**:
   - HTTP Request. Method: GET no URL: `/b1s/v1/Orders({DocEntry})`.
   - **Error Catch (Avançado):** Se o HTTP Request der status `401`, usar o pino de erro para direcionar para o *Authentication Flow* novamente, reescrever as credenciais, e voltar ao *Fetch SAP Data* num max-retry de 1 vez.
4. **Data Mapper (Transform Tool)**:
   - Configurar variáveis do TMS (`referenceId` recebe a prop `$json.DocNum`). Executa conversões (Ex: data SAP *YYYYMMDD* para ISO).
5. **Send to TMS Node**:
   - HTTP Request Node (POST para o TMS com a key `Authorization: Bearer <API_KEY>`).
   - Salvar no Output / Trigger webhook de retorno para registrar eventual Id de rastreio de volta no SAP (PATCH em `U_TMS_ShipmentId`).

> [!WARNING]
> **Aviso de Conciliação Financeira:** Certifique-se nas parametrizações contábeis do SAP Business One de que os valores injetados no campo de "Despesas Adicionais de Frete" sejam direcionados à conta de rateio pré-estabelecida pela Controladoria, caso contrário a validação da Nota Fiscal pode sofrer variações de PIS/COFINS por base divergente de rateio.
