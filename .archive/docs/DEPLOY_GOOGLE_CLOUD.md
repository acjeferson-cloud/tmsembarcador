# 🚀 Guia de Deploy - Google Cloud Run

## Pré-requisitos

1. **Conta Google Cloud ativa**
2. **Google Cloud SDK instalado** ([Instalar](https://cloud.google.com/sdk/docs/install))
3. **Docker instalado** (para testes locais)
4. **Projeto criado no Google Cloud Console**

---

## 📋 Checklist Pré-Deploy

- [ ] Remover arquivo `.env` do Git (se commitado)
- [ ] Adicionar `.env` ao `.gitignore`
- [ ] Criar secrets no Secret Manager
- [ ] Testar build local do Docker
- [ ] Configurar billing no projeto GCP
- [ ] Habilitar APIs necessárias

---

## 🔐 Passo 1: Configurar Secrets (CRÍTICO)

### 1.1 - Criar Secrets no Secret Manager

```bash
# Autenticar no Google Cloud
gcloud auth login
gcloud config set project SEU_PROJECT_ID

# Habilitar API do Secret Manager
gcloud services enable secretmanager.googleapis.com

# Criar secrets (substitua os valores)
echo -n "https://seu-projeto.supabase.co" | gcloud secrets create supabase-url --data-file=-
echo -n "sua_chave_anonima" | gcloud secrets create supabase-anon-key --data-file=-
echo -n "sua_chave_google_maps" | gcloud secrets create google-maps-api-key --data-file=-
echo -n "sua_site_key_recaptcha" | gcloud secrets create recaptcha-site-key --data-file=-
```

### 1.2 - Conceder Acesso aos Secrets

```bash
# Obter número do projeto
PROJECT_NUMBER=$(gcloud projects describe SEU_PROJECT_ID --format="value(projectNumber)")

# Conceder acesso ao Cloud Run
for secret in supabase-url supabase-anon-key google-maps-api-key recaptcha-site-key; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## 🏗️ Passo 2: Build e Deploy Manual

### 2.1 - Testar Build Local

```bash
# Build da imagem
docker build -t tms-embarcador:test .

# Testar localmente (substitua as variáveis)
docker run -p 8080:8080 \
  -e VITE_SUPABASE_URL="https://seu-projeto.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="sua_chave" \
  -e VITE_GOOGLE_MAPS_API_KEY="sua_chave" \
  -e VITE_RECAPTCHA_SITE_KEY="sua_chave" \
  tms-embarcador:test

# Acessar http://localhost:8080
```

### 2.2 - Habilitar APIs Necessárias

```bash
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com
```

### 2.3 - Deploy no Cloud Run

```bash
# Build e push da imagem
gcloud builds submit --tag gcr.io/SEU_PROJECT_ID/tms-embarcador

# Deploy no Cloud Run
gcloud run deploy tms-embarcador \
  --image gcr.io/SEU_PROJECT_ID/tms-embarcador \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --port 8080 \
  --set-secrets=VITE_SUPABASE_URL=supabase-url:latest \
  --set-secrets=VITE_SUPABASE_ANON_KEY=supabase-anon-key:latest \
  --set-secrets=VITE_GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
  --set-secrets=VITE_RECAPTCHA_SITE_KEY=recaptcha-site-key:latest
```

---

## 🤖 Passo 3: Deploy Automático (CI/CD)

### 3.1 - Configurar Cloud Build Trigger

```bash
# Conectar repositório GitHub/GitLab ao Cloud Build
gcloud beta builds triggers create github \
  --repo-name=seu-repositorio \
  --repo-owner=seu-usuario \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

### 3.2 - Push para Main = Deploy Automático

Após configurar, todo push para `main` fará deploy automaticamente.

---

## 🌐 Passo 4: Configurar Domínio Customizado

### 4.1 - Mapear Domínio

```bash
# Adicionar domínio ao Cloud Run
gcloud run domain-mappings create \
  --service tms-embarcador \
  --domain seu-dominio.com \
  --region us-central1
```

### 4.2 - Configurar DNS

Adicione os registros DNS fornecidos pelo comando acima.

---

## 📊 Passo 5: Monitoramento e Logs

### Ver Logs

```bash
# Logs em tempo real
gcloud run services logs tail tms-embarcador --region us-central1

# Logs no Cloud Console
# https://console.cloud.google.com/logs
```

### Métricas

Acesse: https://console.cloud.google.com/run

---

## 💰 Estimativa de Custos

**Cloud Run (Pay-per-use):**
- 2 milhões de requisições/mês: **GRÁTIS**
- CPU: $0.00002400/vCPU-segundo
- Memória: $0.00000250/GiB-segundo
- **Custo estimado: $5-30/mês** (para tráfego moderado)

---

## 🔒 Segurança - Checklist Final

- [ ] Secrets configurados no Secret Manager (NÃO em variáveis de ambiente)
- [ ] `.env` adicionado ao `.gitignore`
- [ ] HTTPS habilitado (automático no Cloud Run)
- [ ] Headers de segurança configurados (nginx.conf)
- [ ] CORS configurado no Supabase
- [ ] Cloud Armor configurado (opcional, para DDoS protection)
- [ ] Backup do banco Supabase configurado

---

## 🆘 Troubleshooting

### Erro: "Permission Denied"
```bash
# Verificar permissões da service account
gcloud projects get-iam-policy SEU_PROJECT_ID
```

### Erro: "Container failed to start"
```bash
# Ver logs de inicialização
gcloud run services logs read tms-embarcador --region us-central1 --limit 50
```

### Aplicação não carrega variáveis de ambiente
```bash
# Verificar secrets
gcloud secrets versions access latest --secret=supabase-url

# Verificar se estão mapeados no serviço
gcloud run services describe tms-embarcador --region us-central1
```

---

## 📞 Suporte

- [Documentação Cloud Run](https://cloud.google.com/run/docs)
- [Community Support](https://stackoverflow.com/questions/tagged/google-cloud-run)
- [Status GCP](https://status.cloud.google.com/)

---

## ✅ Deploy Completo!

Após seguir todos os passos, sua aplicação estará rodando em:
```
https://tms-embarcador-XXXXXX-uc.a.run.app
```

Configure um domínio customizado para melhor experiência do usuário.
