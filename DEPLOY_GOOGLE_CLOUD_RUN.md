# Guia de Deploy - Google Cloud Run

## 📋 Pré-requisitos

### 1. Conta Google Cloud
- Ter uma conta no Google Cloud Platform
- Ter um projeto criado
- Ter billing ativado

### 2. Ferramentas Instaladas
```bash
# Instalar Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Fazer login
gcloud auth login

# Configurar projeto
gcloud config set project SEU_PROJECT_ID
```

### 3. Habilitar APIs Necessárias
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com
```

## 🔐 Configurar Secrets no Secret Manager

### 1. Criar Secrets para as Variáveis de Ambiente

```bash
# Supabase URL
echo -n "https://wthpdsbvfrnrzupvhquo.supabase.co" | \
  gcloud secrets create supabase-url --data-file=-

# Supabase Anon Key
echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aHBkc2J2ZnJucnp1cHZocXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTExOTQsImV4cCI6MjA4NzE2NzE5NH0.RQUTEmVwDPG-tooKDhFk_D6chG4AYq7OgKCB7_iu820" | \
  gcloud secrets create supabase-anon-key --data-file=-

# Google Maps API Key (opcional - use sua key real)
echo -n "SUA_GOOGLE_MAPS_API_KEY_AQUI" | \
  gcloud secrets create google-maps-api-key --data-file=-

# reCAPTCHA Site Key (opcional - use sua key real)
echo -n "SEU_RECAPTCHA_SITE_KEY_AQUI" | \
  gcloud secrets create recaptcha-site-key --data-file=-
```

### 2. Dar Permissão ao Cloud Build para Acessar Secrets

```bash
# Obter o número do projeto
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Dar permissão
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

## 🚀 Deploy Automatizado via Cloud Build

### Método 1: Trigger Manual

```bash
# Na raiz do projeto, executar:
gcloud builds submit --config=cloudbuild.yaml
```

### Método 2: Configurar Trigger Automático (CI/CD)

```bash
# Conectar ao repositório GitHub/GitLab
gcloud builds triggers create github \
  --name="tms-embarcador-deploy" \
  --repo-name="SEU_REPOSITORIO" \
  --repo-owner="SEU_USERNAME" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

## 📦 Deploy Manual (alternativo)

Se preferir fazer deploy manual sem Cloud Build:

### 1. Build da Imagem Docker Localmente

```bash
# Build com variáveis de ambiente
docker build \
  --build-arg VITE_SUPABASE_URL="https://wthpdsbvfrnrzupvhquo.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --build-arg VITE_GOOGLE_MAPS_API_KEY="" \
  --build-arg VITE_RECAPTCHA_SITE_KEY="" \
  -t gcr.io/$(gcloud config get-value project)/tms-embarcador:latest \
  .
```

### 2. Push para Container Registry

```bash
# Autenticar Docker com GCR
gcloud auth configure-docker

# Push da imagem
docker push gcr.io/$(gcloud config get-value project)/tms-embarcador:latest
```

### 3. Deploy no Cloud Run

```bash
gcloud run deploy tms-embarcador \
  --image=gcr.io/$(gcloud config get-value project)/tms-embarcador:latest \
  --region=southamerica-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --port=8080 \
  --timeout=300 \
  --set-env-vars=NODE_ENV=production
```

## 🌐 Configurar Domínio Customizado (Opcional)

### 1. Mapear Domínio

```bash
gcloud run domain-mappings create \
  --service=tms-embarcador \
  --domain=seu-dominio.com.br \
  --region=southamerica-east1
```

### 2. Configurar DNS

Adicione os registros DNS conforme mostrado pelo comando acima.

## 📊 Monitoramento

### Ver Logs em Tempo Real

```bash
gcloud run services logs tail tms-embarcador \
  --region=southamerica-east1 \
  --follow
```

### Ver Métricas

```bash
# Acessar o Console do Cloud Run
https://console.cloud.google.com/run
```

## 🔄 Atualizar a Aplicação

### Opção 1: Via Cloud Build (Recomendado)

```bash
gcloud builds submit --config=cloudbuild.yaml
```

### Opção 2: Manual

```bash
# Build nova versão
docker build -t gcr.io/$(gcloud config get-value project)/tms-embarcador:v2 .

# Push
docker push gcr.io/$(gcloud config get-value project)/tms-embarcador:v2

# Deploy nova versão
gcloud run deploy tms-embarcador \
  --image=gcr.io/$(gcloud config get-value project)/tms-embarcador:v2 \
  --region=southamerica-east1
```

## 🔧 Rollback

Se algo der errado, fazer rollback para versão anterior:

```bash
# Listar revisões
gcloud run revisions list \
  --service=tms-embarcador \
  --region=southamerica-east1

# Fazer rollback para revisão específica
gcloud run services update-traffic tms-embarcador \
  --to-revisions=NOME_DA_REVISAO=100 \
  --region=southamerica-east1
```

## 💰 Estimativa de Custos

### Cloud Run Pricing (São Paulo - southamerica-east1)

- **CPU**: $0.00002400 por vCPU-segundo
- **Memory**: $0.00000250 por GiB-segundo
- **Requests**: $0.40 por 1 milhão de requests
- **Free Tier**: 2 milhões de requests/mês gratuitos

### Exemplo: 10.000 usuários/mês
- Custo estimado: ~$5-10 USD/mês

## 🆘 Troubleshooting

### Problema: Build falhando

```bash
# Ver logs detalhados do build
gcloud builds log $(gcloud builds list --limit=1 --format="value(id)")
```

### Problema: Aplicação não inicia

```bash
# Ver logs do container
gcloud run services logs read tms-embarcador --region=southamerica-east1 --limit=50
```

### Problema: Erro 403 ao acessar secrets

```bash
# Verificar permissões
gcloud projects get-iam-policy $(gcloud config get-value project) \
  --flatten="bindings[].members" \
  --filter="bindings.members:*cloudbuild*"
```

## 📞 Suporte

- [Documentação Cloud Run](https://cloud.google.com/run/docs)
- [Fórum Stack Overflow](https://stackoverflow.com/questions/tagged/google-cloud-run)
- [Suporte Google Cloud](https://cloud.google.com/support)

## ✅ Checklist de Deploy

- [ ] Conta Google Cloud configurada
- [ ] Projeto criado e billing ativado
- [ ] APIs habilitadas (Cloud Build, Cloud Run, Container Registry)
- [ ] Secrets criados no Secret Manager
- [ ] Permissões configuradas para Cloud Build
- [ ] Código commitado no repositório
- [ ] cloudbuild.yaml configurado
- [ ] Build executado com sucesso
- [ ] Deploy realizado no Cloud Run
- [ ] Aplicação acessível via URL do Cloud Run
- [ ] Health check funcionando (/health retorna 200)
- [ ] Logs sendo gerados corretamente
- [ ] (Opcional) Domínio customizado configurado

## 🎉 Pronto!

Sua aplicação TMS Embarcador agora está rodando no Google Cloud Run!

URL padrão: `https://tms-embarcador-XXXXXX-rj.a.run.app`
