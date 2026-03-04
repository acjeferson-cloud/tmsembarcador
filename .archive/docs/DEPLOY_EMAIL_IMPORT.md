# Deploy da Importação Automática de XML via E-mail

## Implementação Concluída

A importação automática de XML via e-mail está **100% implementada** e pronta para deploy.

## O que foi feito

### 1. Edge Function `fetch-email-xmls`
- **Localização:** `/supabase/functions/fetch-email-xmls/index.ts`
- **Funcionalidade:** Conecta em servidores IMAP/POP3 e baixa anexos XML de e-mails
- **Biblioteca:** `imapflow@1.0.157` via npm
- **Suporta:**
  - Gmail (IMAP: imap.gmail.com:993)
  - Outlook (IMAP: outlook.office365.com:993)
  - Qualquer servidor IMAP/POP3 com SSL

### 2. Edge Function `auto-import-xml-scheduler`
- **Localização:** `/supabase/functions/auto-import-xml-scheduler/index.ts`
- **Funcionalidade:** Scheduler que processa XMLs automaticamente
- **Processamento completo:**
  - Parse de NFe e CTe (mesma lógica do upload manual)
  - Extração de todos os dados
  - Importação em todas as tabelas relacionadas
  - Validação de duplicidade
  - Associação com transportadores

### 3. Frontend Atualizado
- **Componente:** `AutoDownloadStatus.tsx`
- **Removida** mensagem de "em desenvolvimento"
- **Interface** mostra status da última importação

## Deploy Manual das Edge Functions

Como o sistema de deploy automático não está disponível, faça o deploy manual:

### Via Supabase CLI (se disponível):

```bash
# Deploy fetch-email-xmls
supabase functions deploy fetch-email-xmls

# Deploy auto-import-xml-scheduler
supabase functions deploy auto-import-xml-scheduler
```

### Via Dashboard do Supabase:

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Vá em **Edge Functions**
3. Para cada função:

   **fetch-email-xmls:**
   - Clique em "Create Function" ou edite a existente
   - Cole o código de `/supabase/functions/fetch-email-xmls/index.ts`
   - Salve e publique

   **auto-import-xml-scheduler:**
   - Clique em "Create Function" ou edite a existente
   - Cole o código de `/supabase/functions/auto-import-xml-scheduler/index.ts`
   - Salve e publique

## Como Configurar

1. Acesse **Cadastros > Estabelecimentos**
2. Edite um estabelecimento
3. Vá na aba **"Download de XML"**
4. Configure:
   - Host: `imap.gmail.com` (para Gmail)
   - Porta: `993`
   - E-mail: seu e-mail
   - Usuário: seu e-mail
   - Senha: senha de app (veja abaixo)
   - Protocolo: `IMAP`
   - Use SSL: `Sim`
   - Intervalo: `15` minutos (ou desejado)
5. Ative o download automático
6. Salve

### Senhas de App

**Gmail:**
1. Vá em [myaccount.google.com](https://myaccount.google.com)
2. Segurança > Verificação em duas etapas
3. Senhas de app > Criar senha de app
4. Use essa senha no sistema

**Outlook:**
1. Use a senha normal se não tiver 2FA
2. Com 2FA, crie senha de app em account.microsoft.com

## Como Funciona

1. **Scheduler Local** (já implementado)
   - Verifica a cada 5 minutos se há estabelecimentos configurados
   - Chama `auto-import-xml-scheduler` edge function

2. **auto-import-xml-scheduler**
   - Busca estabelecimentos com auto_download_xml = true
   - Para cada estabelecimento:
     - Chama `fetch-email-xmls` para buscar XMLs
     - Processa cada XML encontrado
     - Detecta se é NFe ou CTe
     - Faz parse completo
     - Importa no banco com validação de duplicidade
     - Atualiza lastAutoDownload

3. **fetch-email-xmls**
   - Conecta no servidor IMAP
   - Lista e-mails na caixa de entrada
   - Extrai anexos XML
   - Retorna lista de XMLs encontrados

4. **Resultado**
   - XMLs aparecem automaticamente em:
     - **Operações > Notas Fiscais** (para NFe)
     - **Operações > CT-es** (para CTe)
   - Mesmos dados que upload manual
   - Cálculo de custo automático

## Teste Rápido

1. Configure um estabelecimento conforme acima
2. Envie um e-mail com XML anexado para o e-mail configurado
3. Aguarde até 5 minutos (intervalo do scheduler local)
4. OU force execução acessando:
   ```
   POST https://seu-projeto.supabase.co/functions/v1/auto-import-xml-scheduler
   ```
5. Verifique em Notas Fiscais ou CT-es

## Logs e Monitoramento

Logs das edge functions podem ser vistos em:
- Dashboard Supabase > Edge Functions > Logs
- Busque por:
  - `✅ Connected to IMAP server`
  - `📎 Found XML: arquivo.xml`
  - `✅ NFe xxxxx imported`
  - `✅ CTe xxxxx imported`

## Troubleshooting

### Erro de autenticação IMAP
- Verifique senha de app está correta
- Gmail: Ative IMAP nas configurações
- Outlook: Verifique permissões da conta

### XMLs não aparecem
- Verifique logs da edge function
- Confirme que e-mails têm anexos .xml
- Verifique se XML é válido (nfeProc ou cteProc)

### Duplicados
- Sistema valida automaticamente por chave de acesso
- XMLs duplicados são ignorados

## Benefícios

- **100% automático** após configuração
- **Mesma qualidade** do upload manual
- **Validação de duplicidade** automática
- **Multi-estabelecimento** - cada um com sua conta
- **Seguro** - usa SSL/TLS
- **Confiável** - retry automático em caso de erro
