# 🔐 GUIA PRÁTICO: Rotacionar Chaves Expostas

## ⚠️ IMPORTANTE
As seguintes chaves estão EXPOSTAS no repositório Git e precisam ser rotacionadas IMEDIATAMENTE antes do deploy em produção.

---

## 📋 CHAVES QUE PRECISAM SER ROTACIONADAS

```
✗ Supabase URL: https://eldppdrrzytfmcaadsrx.supabase.co
✗ Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✗ Google Maps API Key (no .env): AIzaSyCwKFbvio3eig1B1g0LJ09t7sDVkh6VBSI
✗ Google Maps API Key (no index.html): AIzaSyCo5MJ0lbxQHaFl2qe1JZamMWg8MkaX2nA
✗ reCAPTCHA Site Key: 6LfEwhEsAAAAACunskdCRdhsESVZZDiWd67ZhtN2
✗ reCAPTCHA Secret Key: 6LfEwhEsAAAAAGoxg9P6DM2-3-1cRYxRAC8ImxZF
```

---

## 🔄 PASSO A PASSO - ROTAÇÃO DE CHAVES

### 1️⃣ SUPABASE (15 minutos)

#### 1.1 - Acessar Painel do Supabase
```
1. Acesse: https://app.supabase.com/
2. Faça login com sua conta
3. Selecione o projeto: eldppdrrzytfmcaadsrx
```

#### 1.2 - Criar Novo Projeto (Recomendado para Produção)

**OPÇÃO A - Criar Novo Projeto (MAIS SEGURO):**

```
1. No dashboard, clique em "New Project"
2. Preencha:
   - Name: "TMS Embarcador Producao"
   - Database Password: [gere senha forte]
   - Region: Escolha mais próximo dos usuários
   - Pricing Plan: Free ou Pro
3. Clique em "Create new project"
4. Aguarde 2-5 minutos para provisionar
```

**OPÇÃO B - Resetar Chaves do Projeto Atual (Para Dev/Staging):**

```
⚠️ ATENÇÃO: Isso vai QUEBRAR a aplicação atual até você atualizar as chaves!

1. Vá em Settings → API
2. Na seção "Project API keys":
   - Clique em "Reset" no anon/public key
   - Confirme a ação
3. Aguarde a geração das novas chaves
```

#### 1.3 - Copiar Novas Credenciais

```
1. Vá em Settings → API
2. Copie os valores:

   Project URL:
   [nova-url].supabase.co

   anon/public key:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[novo-token]

   ⚠️ NUNCA copie o service_role key para o frontend!
```

#### 1.4 - Atualizar Arquivo .env Local

```bash
# Edite o arquivo .env (APENAS LOCAL - nunca commitar!)
VITE_SUPABASE_URL=https://[nova-url].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ[novo-token]
```

#### 1.5 - Migrar Dados (Se criou novo projeto)

```bash
# No projeto ANTIGO, faça backup:
1. Vá em Database → Backups
2. Clique em "Create Backup"
3. Após backup, clique em "Download"

# No projeto NOVO, restaure:
1. Vá em Database → Backups
2. Clique em "Restore" e faça upload do backup

# OU use migrations SQL:
# Copie todas as migrations de supabase/migrations/ e execute no novo projeto
```

---

### 2️⃣ GOOGLE MAPS API (10 minutos)

#### 2.1 - Acessar Google Cloud Console

```
1. Acesse: https://console.cloud.google.com/
2. Faça login com sua conta Google
3. Selecione o projeto (ou crie um novo)
```

#### 2.2 - Acessar Credenciais

```
1. No menu lateral, vá em:
   "APIs e serviços" → "Credenciais"

2. Ou acesse direto:
   https://console.cloud.google.com/apis/credentials
```

#### 2.3 - Criar Nova API Key

```
1. Clique em "+ CRIAR CREDENCIAIS"
2. Selecione "Chave de API"
3. Uma nova chave será gerada
4. Copie imediatamente (não será mostrada novamente)
```

#### 2.4 - CRÍTICO - Restringir a Nova Chave

```
⚠️ NÃO PULE ESTE PASSO! Chave sem restrição = Fatura alta!

1. Clique em "RESTRINGIR CHAVE" (ou edite depois)

2. Aba "Restrições de aplicação":
   - Selecione "Referenciadores HTTP (sites)"
   - Adicione seus domínios:
     * localhost:* (para dev)
     * seu-dominio.com/*
     * *.seu-dominio.com/*
   - Clique em "Adicionar"

3. Aba "Restrições de API":
   - Selecione "Restringir chave"
   - Marque APENAS:
     ☑ Maps JavaScript API
     ☑ Places API
     ☑ Geocoding API
     ☑ Directions API (se usar)
   - Desmarque todas as outras

4. Clique em "SALVAR"
```

#### 2.5 - Desabilitar Chaves Antigas

```
1. Na lista de credenciais, encontre as chaves antigas:
   - AIzaSyCwKFbvio3eig1B1g0LJ09t7sDVkh6VBSI
   - AIzaSyCo5MJ0lbxQHaFl2qe1JZamMWg8MkaX2nA

2. Para cada uma:
   - Clique no ícone de lápis (editar)
   - Clique em "EXCLUIR" (ou desabilitar temporariamente)
   - Confirme

⚠️ Só exclua DEPOIS de atualizar a aplicação!
```

#### 2.6 - Atualizar Arquivo .env

```bash
# Edite o arquivo .env
VITE_GOOGLE_MAPS_API_KEY=AIzaSy[sua-nova-chave]
```

---

### 3️⃣ RECAPTCHA (5 minutos)

#### 3.1 - Acessar Admin Console

```
1. Acesse: https://www.google.com/recaptcha/admin
2. Faça login com sua conta Google
```

#### 3.2 - Criar Novo Site

```
1. Clique em "+" (Adicionar novo site)

2. Preencha o formulário:

   Label:
   TMS Embarcador - Producao

   Tipo de reCAPTCHA:
   ☑ reCAPTCHA v2 - "Não sou um robô"
   (ou v3 se preferir)

   Domínios:
   localhost (para testes)
   seu-dominio.com

   Aceite os termos

3. Clique em "Enviar"
```

#### 3.3 - Copiar Novas Chaves

```
Você verá 2 chaves:

CHAVE DO SITE (Site Key):
[nova-site-key-aqui]
↑ Esta vai no FRONTEND

CHAVE SECRETA (Secret Key):
[nova-secret-key-aqui]
↑ Esta NUNCA vai no frontend!
```

#### 3.4 - Excluir Site Antigo

```
1. Na lista de sites, encontre o site antigo
2. Clique nas configurações (engrenagem)
3. No final da página, clique em "Excluir este site"
4. Confirme
```

#### 3.5 - Atualizar Arquivo .env

```bash
# Edite o arquivo .env
VITE_RECAPTCHA_SITE_KEY=[nova-site-key]

# A secret key vai no BACKEND/Edge Functions
# NUNCA no .env que vai pro frontend!
RECAPTCHA_SECRET_KEY=[nova-secret-key]
```

---

## 4️⃣ ATUALIZAR APLICAÇÃO

### 4.1 - Atualizar Arquivo .env Local

```bash
# SEU ARQUIVO .env DEVE FICAR ASSIM:
VITE_SUPABASE_URL=https://[nova-url].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ[novo-token-supabase]
VITE_GOOGLE_MAPS_API_KEY=AIzaSy[nova-chave-google-maps]
VITE_RECAPTCHA_SITE_KEY=[nova-site-key-recaptcha]

# Secret key (apenas para backend/edge functions)
RECAPTCHA_SECRET_KEY=[nova-secret-key-recaptcha]
```

### 4.2 - Atualizar index.html (Google Maps Hardcoded)

Você tem uma chave hardcoded no `index.html` linha 8:

```bash
# Abra o arquivo:
nano index.html

# Encontre a linha:
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCo5MJ0lbxQHaFl2qe1JZamMWg8MkaX2nA&libraries=places"></script>

# Substitua por:
<script async defer src="https://maps.googleapis.com/maps/api/js?key=NOVA_CHAVE_AQUI&libraries=places"></script>
```

**⚠️ MELHOR AINDA - Remova do HTML e carregue via JavaScript:**

```html
<!-- REMOVA a linha do script do index.html -->
<!-- O código já tem um loader em src/utils/googleMapsLoader.ts -->
```

### 4.3 - Testar Localmente

```bash
# Teste a aplicação com as novas chaves
npm run dev

# Acesse http://localhost:5173
# Verifique:
# ✓ Login funciona (Supabase)
# ✓ Mapas carregam (Google Maps)
# ✓ reCAPTCHA aparece (se usar)
```

---

## 5️⃣ LIMPAR GIT (CRÍTICO!)

### 5.1 - Remover .env do Repositório

```bash
# Se .env foi commitado no Git:
git rm --cached .env

# Commitar a remoção
git commit -m "security: Remove .env from repository"

# Push
git push origin main
```

### 5.2 - Verificar .gitignore

```bash
# Confirme que .env está no .gitignore
cat .gitignore | grep .env

# Deve mostrar:
# .env
```

### 5.3 - Verificar Histórico (Opcional mas Recomendado)

```bash
# Ver se .env aparece no histórico
git log --all --full-history -- .env

# Se aparecer, considere limpar o histórico:
# https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
```

---

## 6️⃣ CONFIGURAR SECRETS NO GOOGLE CLOUD

### 6.1 - Instalar Google Cloud SDK

```bash
# Se não tem instalado:
# https://cloud.google.com/sdk/docs/install

# Verificar instalação:
gcloud --version
```

### 6.2 - Autenticar

```bash
# Login
gcloud auth login

# Definir projeto
gcloud config set project SEU_PROJECT_ID
```

### 6.3 - Habilitar Secret Manager

```bash
gcloud services enable secretmanager.googleapis.com
```

### 6.4 - Criar Secrets

```bash
# Supabase URL
echo -n "https://[nova-url].supabase.co" | \
  gcloud secrets create supabase-url --data-file=-

# Supabase Anon Key
echo -n "eyJ[novo-token]" | \
  gcloud secrets create supabase-anon-key --data-file=-

# Google Maps API Key
echo -n "AIzaSy[nova-chave]" | \
  gcloud secrets create google-maps-api-key --data-file=-

# reCAPTCHA Site Key
echo -n "[nova-site-key]" | \
  gcloud secrets create recaptcha-site-key --data-file=-

# reCAPTCHA Secret Key (para edge functions)
echo -n "[nova-secret-key]" | \
  gcloud secrets create recaptcha-secret-key --data-file=-
```

### 6.5 - Verificar Secrets Criados

```bash
# Listar secrets
gcloud secrets list

# Ver conteúdo (para testar)
gcloud secrets versions access latest --secret=supabase-url
```

---

## ✅ CHECKLIST FINAL

Antes de fazer deploy, confirme:

- [ ] ✅ Criei novas chaves no Supabase
- [ ] ✅ Criei nova API Key no Google Maps com restrições
- [ ] ✅ Criei novo site no reCAPTCHA
- [ ] ✅ Atualizei arquivo .env local com novas chaves
- [ ] ✅ Removi chave hardcoded do index.html
- [ ] ✅ Testei aplicação localmente - TUDO funciona
- [ ] ✅ Removi .env do Git (git rm --cached .env)
- [ ] ✅ Verifiquei que .env está no .gitignore
- [ ] ✅ Criei secrets no Google Cloud Secret Manager
- [ ] ✅ Desabilitei/excluí chaves antigas
- [ ] ✅ Build da aplicação funciona (npm run build)

---

## 🆘 TROUBLESHOOTING

### Erro: "API key not valid"
- Verifique se copiou a chave completa
- Confirme que habilitou as APIs necessárias no GCP
- Aguarde 5 minutos (propagação)

### Erro: "Supabase client initialization failed"
- Verifique URL e Anon Key
- Confirme que projeto está ativo no Supabase
- Verifique se há typo nas variáveis

### Erro: "reCAPTCHA não carrega"
- Verifique se domínio está autorizado
- Confirme que a Site Key está correta
- Abra console do browser para ver erros

---

## 📞 SUPORTE

- Supabase: https://supabase.com/docs
- Google Maps: https://console.cloud.google.com/
- reCAPTCHA: https://www.google.com/recaptcha/admin

---

## ⏱️ TEMPO ESTIMADO

- Supabase: 15 minutos
- Google Maps: 10 minutos
- reCAPTCHA: 5 minutos
- Atualizar aplicação: 10 minutos
- Limpar Git: 5 minutos
- Configurar GCP Secrets: 10 minutos

**TOTAL: ~1 hora**

---

## 🎯 PRÓXIMO PASSO

Após rotacionar todas as chaves:
1. ✅ Teste localmente
2. 🚀 Siga o guia DEPLOY_GOOGLE_CLOUD.md
3. 📊 Configure monitoramento
