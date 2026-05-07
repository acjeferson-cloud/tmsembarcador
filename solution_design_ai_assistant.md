# Solution Design: Assistente Virtual de IA no Ecossistema Log Axis

**Autor:** AntiGravity (Principal Software Architect & TMS Expert)  
**Objetivo:** Desenvolver e integrar um assistente virtual (Chatbot de IA) embutido na interface do TMS, focado em alta performance, arquitetura escalável (SaaS B2B) e visual premium/clean.

---

## 1. Visão Geral da Arquitetura

Para garantir manutenibilidade, isolamento de responsabilidades e independência de plataformas engessadas (vendor lock-in), propomos uma arquitetura em camadas utilizando nossa stack atual: **React** (Frontend), **Node.js** (Backend/Gateway), **n8n** (Orquestração/Workflows de IA) e **Supabase/PostgreSQL** (Persistência e Segurança).

O fluxo de comunicação padrão seguirá o modelo:
**React (Widget)** ➔ **Node.js (API Gateway)** ➔ **n8n (Workflow/Agente)** ➔ **LLM (OpenAI/Gemini)**

---

## 2. Frontend (React): Widget de Chat

A prioridade no frontend é garantir que o widget seja leve, não bloqueie a thread principal do TMS e mantenha uma experiência "premium e clean".

*   **Estrutura e Componentização:** 
    *   O widget deve ser implementado usando **React Portals** (para renderizar fora da hierarquia principal do DOM, evitando conflitos de z-index e CSS herdado).
    *   Utilizar **Shadow DOM** ou escopo estrito de CSS (CSS Modules / Tailwind prefixado) para garantir que o estilo "premium" não afete ou seja afetado pela aplicação legado.
*   **Gerenciamento de Estado:**
    *   **Isolamento:** O estado do chat (mensagens abertas, input, status de carregamento) deve ser gerenciado de forma isolada (ex: `Zustand` instanciado especificamente para o widget, ou `useReducer` interno) para **não engatilhar re-renders** na árvore de componentes principal do TMS.
    *   **Streaming UI:** O componente deve estar preparado para receber respostas em *Stream* (Server-Sent Events - SSE), renderizando o texto progressivamente para reduzir a percepção de latência.
*   **Lazy Loading:** O bundle pesado do chat (markdown parsers, syntax highlighters se houver, bibliotecas de animação como Framer Motion) deve ser carregado via **Code Splitting** (`React.lazy`) apenas quando o usuário interagir com o botão flutuante.

---

## 3. Orquestração e Backend (Node.js & n8n)

A decisão crucial aqui é **não expor o n8n diretamente ao Frontend**. O Node.js atuará como nosso *Backend-for-Frontend (BFF)* e barreira de segurança.

*   **O Papel do Node.js (API Gateway / Proxy):**
    *   Recebe a requisição do React (que já contém o token JWT do usuário).
    *   Valida a autenticação, resolve o `tenant_id` e o `user_id` de forma confiável (impossível de ser forjado pelo client).
    *   Aplica políticas de **Rate Limiting**.
    *   Enriquece o payload e repassa a requisição para o Webhook do n8n (em rede interna/privada).
*   **O Papel do n8n (Motor Cognitivo e Orquestrador):**
    *   Recebe o payload limpo e confiável do Node.js.
    *   Executa o fluxo lógico da IA (Agents, RAG - Retrieval-Augmented Generation, Tool Calling).
    *   **Por que usar n8n aqui?** A orquestração visual do n8n permite iterar rapidamente nos *prompts*, integrar com APIs externas (ex: buscar status de uma carga em outra API interna) e mudar de LLM (OpenAI para Gemini, por exemplo) sem precisar fazer deploy de código no backend.
    *   *Futuro (Execução de Comandos):* O n8n é ideal para a fase de "Actionable AI", onde a IA decide que precisa acionar uma rota POST do próprio TMS para "Aprovar Frete", executando isso através de nós HTTP autenticados.

---

## 4. Persistência e Contexto (Supabase / PostgreSQL)

A modelagem de dados deve garantir o isolamento estrito entre clientes (Multitenancy) e manter o histórico rico para o LLM.

### Modelagem de Dados Relacional

```sql
-- Tabela de Sessões (Agrupa as conversas de um tópico/dia)
CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Mensagens
CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL, -- Desnormalização para facilitar RLS
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Contexto e RLS (Row Level Security)
*   **RLS Rigoroso:** Ambas as tabelas terão RLS ativado. As políticas (Policies) do Supabase devem garantir que `auth.uid() = user_id` E que o usuário pertença ao `tenant_id` da sessão.
*   **Injeção de Contexto (RAG):** Para que a IA responda dúvidas operacionais específicas do TMS, usaremos a extensão `pgvector` no Supabase. Documentações e FAQs do TMS serão vetorizadas em uma tabela separada (`knowledge_base_embeddings`). O n8n fará uma busca vetorial baseada na pergunta do usuário antes de enviar o prompt final ao LLM, garantindo respostas embasadas na operação da Log Axis.

---

## 5. Segurança e Controle de Custos

Sistemas de IA baseados em LLMs são alvos fáceis para ataques de "Prompt Injection" e podem gerar custos astronômicos se não controlados.

*   **Evitando Abuso da API (Cost Control):**
    *   **Rate Limiting no Node.js:** Limitar a, por exemplo, 10 mensagens por minuto por usuário.
    *   **Quota por Tenant:** Implementar no Node.js uma verificação de quota mensal de uso (baseada na contagem de tokens salva na tabela `ai_chat_messages`). Se o plano do cliente estourar, a IA responde amigavelmente que o limite foi atingido.
    *   **Truncamento de Janela de Contexto:** O Node.js/n8n deve buscar apenas as últimas *N* mensagens da `chat_sessions` ao invés de todo o histórico, economizando tokens em conversas longas.
*   **Proteção de Dados (Data Leakage):**
    *   **Filtros no Node.js:** O Backend deve assegurar que *NUNCA* um `tenant_id` diferente seja passado para a busca vetorial (RAG) do n8n. O isolamento começa no backend.
    *   **System Prompt Hardcoded:** O System Prompt principal (que define as regras do bot) deve ser injetado pelo Node.js/n8n, nunca pelo Frontend. Deve conter diretrizes explícitas: *"Você é um assistente do TMS Log Axis. Nunca revele dados de outros clientes. Responda apenas sobre logística e uso do sistema."*
*   **Moderação:** Utilizar APIs de moderação (como a OpenAI Moderation API, que é gratuita) antes de processar o prompt principal, descartando mensagens maliciosas ou inapropriadas.

---

## Conclusão e Próximos Passos

Esta arquitetura garante um MVP altamente escalável e seguro. A divisão clara de responsabilidades (React para UI fluida, Node para segurança e controle, n8n para inteligência fluida, Supabase para dados) permite que a Log Axis evolua o assistente gradualmente.

**Próximo passo recomendado:** Criar uma PoC (Proof of Concept) do Frontend chamando uma rota "mock" no Node.js, apenas para validar o isolamento de estado e a renderização do design premium, enquanto o fluxo do n8n é construído em paralelo.
