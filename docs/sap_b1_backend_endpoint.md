# 🛠 Módulo: Backend do Centro de Implementação - Integração ERP (SAP B1)

Abaixo estão os entregáveis referentes à construção do endpoint para recebimento, teste de conexão (Login na Service Layer) e persistência das credenciais do SAP Business One.

---

## 2. Esquema de Banco de Dados (JSON / Supabase)

Para persistir exclusivamente as diretrizes de conexão, o ideal é possuir uma tabela `erp_integrations` (ou utilizar uma coluna JSONB numa tabela de `establishments` ou `tenant_configs`).

**Estrutura do DB (Exemplo Schema JSON):**
```json
{
  "integration_id": "uuid",
  "establishment_id": "uuid",
  "source_technology": "SAP - Business One",
  "status": "ACTIVE",
  "last_tested_at": "2026-04-01T15:30:00Z",
  "connection_settings": {
    "endpoint_system": "https://meu-servidor-sap.com",
    "port": 50000,
    "path": "/b1s/v1",
    "username": "manager",
    "password": "encrypted_password_here",
    "company_db": "SBODEMOBR"
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```
> [!IMPORTANT]
> **Segurança:** A propriedade `password` **nunca** deve ser salva em texto plano. No momento da persistência, o backend deve encriptar essa senha (ex: `AES-256-GCM` com uma chave mestra) ou utilizar o **Google Secret Manager / Supabase Vault** para persistir o segredo e salvar apenas a referência no JSON.

---

## 1. Estrutura Lógica do Endpoint (TypeScript / Node.js)

Este é o código do controller/endpoint que processa o payload acionado pelo botão **"Processar Parametrização ERP"**. Ele recebe os dados, monta a URL da Service Layer, dispara o login, trata as falhas e então salva no BD.

```typescript
import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import { encryptData } from '../utils/encryption'; // Função de encriptação
import { db } from '../database';

// Tipagem do Payload de Entrada
interface ERPConnectionPayload {
  sourceTechnology: string;
  connectionSettings: {
    endpointSystem: string;  // Ex: "https://servidor-sap.com/b1s/v1" ou apenas "https://servidor-sap.com"
    port: number | string;   // Ex: 50000
    username: string;
    password: string;
    companyDb: string;
  };
}

export async function processERPConfiguration(req: Request, res: Response) {
  try {
    const payload: ERPConnectionPayload = req.body;
    const { endpointSystem, port, username, password, companyDb } = payload.connectionSettings;

    // 1. Sanitização e Construção da Base URL do SAP Service Layer
    // Remove barras finais e garante a montagem correta da porta.
    let cleanEndpoint = endpointSystem.replace(/\/$/, '');
    let serviceLayerUrl = cleanEndpoint;
    
    // Se o endpoint enviado pelo usuário não contiver a porta embutida, nós a adicionamos
    if (!cleanEndpoint.includes(`:${port}`)) {
       // Isola o protocolo (https://) do domínio para injetar a porta corretamente
       const urlParts = new URL(cleanEndpoint);
       urlParts.port = port.toString();
       serviceLayerUrl = urlParts.toString().replace(/\/$/, ''); // https://servidor:50000
    }
    
    // Garante o sufixo da API do SL
    if (!serviceLayerUrl.endsWith('/b1s/v1')) {
       serviceLayerUrl = `${serviceLayerUrl}/b1s/v1`;
    }

    // 2. Dispara a requisição de Login (Teste de Conexão Ativa)
    let loginResponse;
    try {
      loginResponse = await axios.post(
        `${serviceLayerUrl}/Login`, 
        {
          CompanyDB: companyDb,
          UserName: username,
          Password: password
        },
        { timeout: 10000 } // Impõe timeout de 10s para não travar o frontend
      );
    } catch (apiError) {
      const error = apiError as AxiosError;
      
      // Tratamento Específico de Erros do SAP B1
      if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
         return res.status(504).json({ error: 'Timeout: Não foi possível alcançar o servidor do SAP. Verifique o Endpoint e a Porta TCP/IP informados e se o firewall permite conexões externas.' });
      }

      const sapError = error.response?.data as any;
      if (error.response?.status === 401) {
         return res.status(401).json({ error: 'Falha de Autenticação: O Usuário ou a Password informada estão incorretos.' });
      }
      
      if (sapError?.error?.message?.value?.includes('Database')) {
         return res.status(400).json({ error: `Banco de Dados não encontrado: A instância "${companyDb}" não é válida no servidor SAP.` });
      }

      // Erro Genérico ou SSL
      return res.status(500).json({ error: `Falha na conexão com o SAP B1. Detalhe: ${sapError?.error?.message?.value || error.message}` });
    }

    // 3. Sucesso! Extração dos tokens/cookies da sessão para retorno (opcional)
    const cookies = loginResponse.headers['set-cookie'] || [];
    const sessionId = cookies.find(c => c.includes('B1SESSION'))?.split(';')[0] || '';

    // 4. Salvar Configuração no Banco de Dados
    // Criptografamos a senha antes do repouso no banco de dados.
    const encryptedPassword = encryptData(password);

    await db.erp_integrations.upsert({
      source_technology: payload.sourceTechnology,
      status: 'ACTIVE',
      last_tested_at: new Date().toISOString(),
      connection_settings: {
        endpoint_system: cleanEndpoint,
        port: Number(port),
        path: '/b1s/v1',
        username: username,
        password: encryptedPassword, // Senha salva de forma segura
        company_db: companyDb
      }
    });

    // 5. Devolve Status Positivo para o Centro de Implementação (Frontend)
    return res.status(200).json({
      message: 'Conexão estabelecida e parametrizada com sucesso no SAP Business One.',
      sessionId: sessionId // Apenas para debug/uso imediato da UI se necessário
    });

  } catch (globalError: any) {
    return res.status(500).json({ error: `Erro interno no módulo de integração: ${globalError.message}` });
  }
}
```

## Resumo Lógico da Engenharia

1. **Montagem Inteligente da URL:** O usuário muitas vezes se confunde e coloca portas misturadas ou caminhos quebrados. A lógica isola e sanitiza a união de `Endpoint + :Porta + /b1s/v1` usando a classe nativa `URL()`.
2. **Timeouts Resilientes:** Aplicação de `timeout` rígido de 10s no Axios. Caso o endpoint seja uma VPN fechada, o sistema aborta graciosamente devolvendo `504` ao invés de manter a conexão do NodeJS suspensa até travar as threads do servidor.
3. **Parse de Erros Cirúrgicos do SAP Layer:** Quando usamos um `CompanyDB` ou `UserName` inválido, o Service Layer solta erros específicos no `data.error.message.value`. O bloco `catch` traduz esse erro técnico em uma mensagem perfeitamente clara na UI para instruir a correção por parte do analista.
4. **Criptografia OBRIGATÓRIA:** Como se tratam de credenciais administrativas de ERP, os dados passados para a coluna de json viajam mascarados/hash no nível do Banco de Dados.
