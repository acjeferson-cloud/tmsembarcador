# 🔒 Checklist de Segurança - Deploy Produção

## ❌ CRÍTICO - ANTES DO DEPLOY

### 1. Secrets e Credenciais

- [ ] **REMOVER `.env` do Git imediatamente**
  ```bash
  git rm --cached .env
  git commit -m "Remove .env from repository"
  git push
  ```

- [ ] **Verificar histórico do Git** para secrets expostos
  ```bash
  git log --all --full-history -- .env
  # Se encontrar commits com secrets, considere reescrever o histórico ou rotacionar todas as chaves
  ```

- [ ] **Rotacionar TODAS as chaves expostas:**
  - [ ] Supabase: Gerar novas chaves no painel do Supabase
  - [ ] Google Maps API: Criar nova chave no Google Cloud Console
  - [ ] reCAPTCHA: Gerar novo par de chaves no Google reCAPTCHA

- [ ] **Adicionar `.env` ao `.gitignore`** (confirmar)
  ```bash
  echo ".env" >> .gitignore
  echo ".env.local" >> .gitignore
  echo ".env.production" >> .gitignore
  ```

- [ ] **Usar Google Cloud Secret Manager** para produção (não variáveis de ambiente simples)

---

## 🔐 Secrets que DEVEM ser Rotacionados

```
⚠️ AS SEGUINTES CHAVES ESTÃO EXPOSTAS NO REPOSITÓRIO:

1. Supabase URL: https://eldppdrrzytfmcaadsrx.supabase.co
2. Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
3. Google Maps API Key: AIzaSyCwKFbvio3eig1B1g0LJ09t7sDVkh6VBSI
4. reCAPTCHA Secret: 6LfEwhEsAAAAAGoxg9P6DM2-3-1cRYxRAC8ImxZF
5. reCAPTCHA Site Key: 6LfEwhEsAAAAACunskdCRdhsESVZZDiWd67ZhtN2

⚠️ AÇÃO IMEDIATA NECESSÁRIA: ROTACIONAR TODAS
```

---

## 🛡️ Configurações de Segurança

### 2. Supabase

- [ ] **Row Level Security (RLS)** habilitado em TODAS as tabelas
- [ ] **Políticas RLS** configuradas corretamente
- [ ] **Service Role Key** NUNCA exposta no frontend
- [ ] **Anon Key** é a ÚNICA chave usada no frontend
- [ ] **CORS** configurado para domínio de produção apenas
- [ ] **Rate limiting** configurado no Supabase
- [ ] **Backups automáticos** habilitados

### 3. Google Maps API

- [ ] **Restrições de API Key** configuradas:
  - [ ] Restringir por domínio (referrer)
  - [ ] Restringir por IP (se aplicável)
  - [ ] Habilitar apenas APIs necessárias
- [ ] **Quotas e alertas** configurados
- [ ] **Billing alerts** ativos

### 4. reCAPTCHA

- [ ] **Domínios autorizados** configurados
- [ ] **Score threshold** ajustado (0.5 recomendado)
- [ ] **Secret key** NUNCA no frontend (apenas backend/edge functions)

---

## 🌐 Configurações Cloud Run

### 5. Cloud Run Service

- [ ] **Autenticação** configurada (não deixar público sem proteção)
- [ ] **HTTPS** forçado (habilitado por padrão)
- [ ] **Custom domain** com certificado SSL
- [ ] **Cloud Armor** para proteção DDoS
- [ ] **Cloud CDN** para assets estáticos
- [ ] **IAM** roles adequados para service account

### 6. Networking

- [ ] **VPC Connector** (se precisar acessar recursos privados)
- [ ] **Ingress controls** configurados
- [ ] **Egress controls** (allow all vs allow VPC)

---

## 📊 Monitoramento

### 7. Observabilidade

- [ ] **Cloud Logging** habilitado
- [ ] **Cloud Monitoring** com alertas configurados
- [ ] **Error Reporting** ativo
- [ ] **Uptime checks** configurados
- [ ] **SLOs** definidos

### 8. Alertas Críticos

- [ ] Alerta de erro 5xx > 1%
- [ ] Alerta de latência P95 > 2s
- [ ] Alerta de custo inesperado
- [ ] Alerta de quota excedida

---

## 💰 Custos

### 9. Controle de Custos

- [ ] **Billing alerts** configurados
- [ ] **Budget** definido no GCP
- [ ] **Autoscaling limits** configurados
  - Min instances: 0
  - Max instances: 10 (ajustar conforme necessidade)
- [ ] **Resource quotas** revisadas

---

## 🚨 Resposta a Incidentes

### 10. Plano de Contingência

- [ ] **Rollback plan** documentado
- [ ] **Backup dos secrets** em local seguro (cofre da empresa)
- [ ] **Contacts de emergência** definidos
- [ ] **Runbook** para incidentes comuns

---

## ✅ Comandos de Verificação

```bash
# Verificar se .env está no Git
git ls-files | grep .env

# Verificar secrets no histórico
git log --all --full-history --source -- .env

# Verificar configuração do Cloud Run
gcloud run services describe tms-embarcador --region us-central1

# Verificar secrets
gcloud secrets list

# Verificar IAM policies
gcloud projects get-iam-policy SEU_PROJECT_ID
```

---

## 📋 Timeline de Rotação de Secrets

| Secret | Última Rotação | Próxima Rotação | Status |
|--------|---------------|-----------------|--------|
| Supabase Keys | - | ⚠️ IMEDIATO | ❌ EXPOSTO |
| Google Maps API | - | ⚠️ IMEDIATO | ❌ EXPOSTO |
| reCAPTCHA | - | ⚠️ IMEDIATO | ❌ EXPOSTO |

**Recomendação:** Rotacionar secrets a cada 90 dias ou após qualquer incidente de segurança.

---

## 🎯 Próximos Passos

1. ✅ Arquivos de deploy criados
2. ⚠️ **ROTACIONAR TODAS AS CHAVES IMEDIATAMENTE**
3. ⚠️ **REMOVER .env DO GIT**
4. 🔒 Configurar secrets no Secret Manager
5. 🧪 Testar deploy em ambiente de staging
6. 🚀 Deploy em produção
7. 📊 Configurar monitoramento
8. 🔐 Audit de segurança pós-deploy

---

## ⚠️ DISCLAIMER

**Este checklist NÃO substitui um audit de segurança profissional.**

Para aplicações que lidam com dados sensíveis, considere contratar um especialista em segurança para realizar:
- Penetration testing
- Security audit
- Compliance review (LGPD, GDPR, etc.)
