# 🚀 GUIA DE DEPLOY - VERCEL

> **Status:** ✅ APLICAÇÃO 100% COMPATÍVEL COM VERCEL
> **Última Validação:** 2026-01-10
> **Tempo Estimado:** 10-15 minutos (primeiro deploy)

---

## 🎯 POR QUE VERCEL?

### Vantagens sobre Google Cloud Run:

| Característica | Vercel | Google Cloud Run |
|----------------|--------|------------------|
| **Setup** | 5-10 minutos | 30-60 minutos |
| **Complexidade** | Baixa | Média/Alta |
| **Git Integration** | Automático | Manual |
| **CDN Global** | Incluído | Configuração extra |
| **Deploy** | git push | Docker + Cloud Build |
| **Custo (hobby)** | Grátis* | $10-30/mês |
| **HTTPS** | Automático | Automático |
| **Domínio Custom** | 1 clique | Configuração DNS |
| **Preview Deploys** | Automático | Manual |

**Recomendação:** Para protótipos, MVPs e pequenos projetos, **Vercel é mais simples e rápido**.

---

## ⚡ DEPLOY RÁPIDO (3 MÉTODOS)

### Método 1: Via Dashboard (MAIS FÁCIL) ⭐

#### Passo 1: Login no Vercel (2 minutos)

1. Acesse: https://vercel.com
2. Clique em "Sign Up"
3. Escolha "Continue with GitHub" (recomendado)
4. Autorize o Vercel a acessar seus repositórios

#### Passo 2: Importar Projeto (3 minutos)

1. Clique em "Add New Project"
2. Selecione "Import Git Repository"
3. Escolha o repositório `tms-embarcador-smart-log`
4. Clique em "Import"

#### Passo 3: Configurar Build (2 minutos)

O Vercel detecta automaticamente Vite, mas confirme:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

✅ **Não precisa alterar nada, o Vercel detecta tudo automaticamente!**

#### Passo 4: Configurar Variáveis de Ambiente (5 minutos)

Na seção "Environment Variables", adicione:

```bash
# OBRIGATÓRIO - Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase

# OPCIONAL - Google Maps
VITE_GOOGLE_MAPS_API_KEY=sua_chave_google_maps

# OPCIONAL - reCAPTCHA
VITE_RECAPTCHA_SITE_KEY=sua_site_key_recaptcha
```

**Importante:**
- ✅ Marque "Production", "Preview" e "Development"
- ✅ Clique em "Add" para cada variável

#### Passo 5: Deploy! (3 minutos)

1. Clique em "Deploy"
2. Aguarde o build (1-2 minutos)
3. ✅ Aplicação no ar!

**URL:** `https://seu-projeto.vercel.app`

---

### Método 2: Via CLI (MAIS RÁPIDO PARA QUEM JÁ USA CLI) 🔥

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (primeira vez)
vercel

# Configurar variáveis de ambiente
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GOOGLE_MAPS_API_KEY
vercel env add VITE_RECAPTCHA_SITE_KEY

# Deploy para produção
vercel --prod
```

**Pronto!** A aplicação estará no ar em 2-3 minutos.

---

### Método 3: Via Git Push (AUTOMÁTICO APÓS SETUP) 🎯

Após o primeiro deploy via dashboard ou CLI:

```bash
# Qualquer mudança no código
git add .
git commit -m "Atualização"
git push origin main

# Vercel faz deploy automático!
```

**Preview Deploys:**
- Cada PR cria um deploy preview automático
- URL única para cada branch
- Perfeito para testar antes de produção

---

## 🔧 CONFIGURAÇÕES AVANÇADAS

### Domínio Customizado

```bash
# Via CLI
vercel domains add seu-dominio.com

# Via Dashboard
1. Vá em Project Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções
```

### Variáveis de Ambiente por Ambiente

```bash
# Produção
vercel env add VITE_SUPABASE_URL production

# Preview (PRs)
vercel env add VITE_SUPABASE_URL preview

# Desenvolvimento
vercel env add VITE_SUPABASE_URL development
```

### Monitoramento e Analytics

```json
// vercel.json (já criado)
{
  "analytics": {
    "enable": true
  },
  "speed-insights": {
    "enable": true
  }
}
```

Acesse: https://vercel.com/analytics

---

## 📊 COMPARAÇÃO: VERCEL VS GOOGLE CLOUD

### Quando usar VERCEL:

✅ Protótipos e MVPs
✅ Sites estáticos e SPAs
✅ Projetos pequenos/médios
✅ Deploy rápido e simples
✅ Time pequeno ou solo dev
✅ Orçamento limitado
✅ Preview deploys importantes

### Quando usar GOOGLE CLOUD RUN:

✅ Aplicações enterprise
✅ Alto volume de tráfego (>100k visits/dia)
✅ Necessidade de containers customizados
✅ Integração com GCP services
✅ Compliance rigoroso
✅ Multi-região complexa

---

## 💰 CUSTOS VERCEL

### Plan Gratuito (Hobby):

| Recurso | Limite |
|---------|--------|
| Bandwidth | 100 GB/mês |
| Build Minutes | 6.000 min/mês |
| Serverless Functions | 100 GB-Hours |
| Edge Functions | 100k requests/dia |
| Projetos | Ilimitados |
| Domínios Custom | ✅ Sim |
| SSL | ✅ Grátis |
| CDN Global | ✅ Incluído |

**Suficiente para:** 50-100k visitantes/mês

### Plan Pro ($20/mês):

- Bandwidth: 1 TB/mês
- Build Minutes: 24.000 min/mês
- Analytics avançado
- Password protection
- Web Analytics

**Ideal para:** Projetos comerciais pequenos/médios

---

## 🔒 SEGURANÇA

### Headers já Configurados (vercel.json):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "X-Frame-Options", "value": "DENY"},
        {"key": "X-XSS-Protection", "value": "1; mode=block"},
        {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"}
      ]
    }
  ]
}
```

✅ Já aplicados automaticamente!

### Proteção de Secrets:

- ✅ Variáveis de ambiente criptografadas
- ✅ Não expostas no código
- ✅ Não aparecem nos logs
- ✅ Diferentes por ambiente (prod/preview/dev)

---

## 📦 ARQUIVOS CRIADOS PARA VERCEL

```
✅ vercel.json        → Configurações do Vercel
✅ .vercelignore      → Arquivos a ignorar
✅ package.json       → Scripts já configurados
✅ vite.config.ts     → Build já otimizado
```

**Nada mais precisa ser alterado!**

---

## 🆘 TROUBLESHOOTING

### Erro: 404 NOT_FOUND (MAIS COMUM) ⚠️

**Sintomas:**
- Página mostra "404: NOT_FOUND"
- Code: `NOT_FOUND`
- ID com região (ex: `gru1::hkgm2-...`)

**Causas Principais:**

1. **Pasta dist/ vazia ou sem index.html**
   ```bash
   # Verificar se tem conteúdo
   ls -la dist/

   # Deve ter:
   # - index.html
   # - pasta assets/
   # - _redirects
   ```

2. **Build não foi executado**
   ```bash
   # Executar build
   npm run build

   # Verificar sucesso
   test -f dist/index.html && echo "✅ OK" || echo "❌ ERRO"
   ```

3. **vercel.json com configuração errada**
   ```json
   // ❌ NÃO USE (causa problemas):
   {
     "version": 2,
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite"
   }

   // ✅ USE (funciona perfeitamente):
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

**Solução Completa:**

```bash
# 1. Fazer build
npm run build

# 2. Verificar estrutura
ls dist/index.html dist/assets/

# 3. Commit e push
git add .
git commit -m "fix: corrigir erro 404"
git push origin main

# 4. OU redeploy via CLI
vercel --prod --force
```

**Aguarde 2-3 minutos e teste novamente.**

---

### Erro: "Rollup failed to resolve import /src/main.tsx" ⚠️⚠️

**Este era o erro mais crítico - JÁ CORRIGIDO!**

**Sintomas:**
```
[vite]: Rollup failed to resolve import "/src/main.tsx" from "/vercel/path0/index.html"
Error: Command "npm run build" exited with 1
Build failed in 44ms
```

**Causa:**
Vite no Vercel não conseguia resolver o caminho do main.tsx porque faltavam configurações explícitas de paths no vite.config.ts.

**Solução Aplicada (✅ JÁ FEITO):**

1. **vite.config.ts atualizado com:**
   ```typescript
   root: process.cwd(),
   base: '/',
   resolve: {
     alias: { '@': path.resolve(__dirname, './src') }
   },
   build: {
     outDir: 'dist',
     assetsDir: 'assets',
     emptyOutDir: true,
     rollupOptions: {
       input: { main: path.resolve(__dirname, 'index.html') }
     }
   }
   ```

2. **.node-version criado:**
   ```
   20
   ```
   Garante que Vercel use Node.js 20.x

3. **Build testado e funcionando:**
   ```bash
   npm run build
   # ✓ built in 1m 10s
   ```

**Se você ainda ver este erro:**
- Certifique-se que fez `git push` com as alterações
- Verifique que o arquivo `.node-version` está no repositório
- Force rebuild: `vercel --prod --force`

---

### Erro: "Build Failed"

```bash
# Ver logs completos
vercel logs --follow

# Testar build local
npm run build

# Limpar cache e rebuildar
rm -rf node_modules dist
npm install
npm run build
vercel --prod --force
```

### Erro: "Variáveis de ambiente não carregam"

**Causa:** Esqueceu de adicionar no dashboard
**Solução:**
1. Vá em Project Settings → Environment Variables
2. Adicione todas as variáveis (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
3. Marque "Production", "Preview" e "Development"
4. Redeploye: `vercel --prod --force`

### Build muito lento

```bash
# Limpar tudo e rebuildar
rm -rf node_modules dist .vercel
npm install
vercel --prod
```

---

## 🔄 CI/CD AUTOMÁTICO

### Como funciona:

1. **Push para `main`** → Deploy automático em PRODUÇÃO
2. **Push para outra branch** → Deploy automático em PREVIEW
3. **Abrir PR** → Deploy preview com URL única
4. **Merge PR** → Atualização automática em produção

**Não precisa configurar nada!** É automático após o primeiro deploy.

---

## 📈 MONITORAMENTO

### Analytics (Grátis no Plan Pro):

- Pageviews
- Visitors únicos
- Tempo de carregamento
- Origem do tráfego
- Dispositivos

Acesse: https://vercel.com/dashboard/analytics

### Speed Insights:

- Core Web Vitals
- Performance score
- Sugestões de otimização

Já habilitado no `vercel.json`!

---

## ✅ CHECKLIST PRÉ-DEPLOY

### Antes do Deploy:
- [x] Código no Git/GitHub
- [x] package.json configurado
- [x] vercel.json criado
- [x] .vercelignore criado
- [x] Build testado localmente
- [x] Supabase configurado
- [ ] Variáveis de ambiente prontas

### Após o Deploy:
- [ ] Aplicação acessível
- [ ] Login funcionando
- [ ] Dados carregando do Supabase
- [ ] Sem erros no console
- [ ] Testar em mobile
- [ ] Configurar domínio (opcional)

---

## 🎯 COMPARATIVO FINAL

| Critério | Vercel | Google Cloud Run |
|----------|--------|------------------|
| **Setup Time** | ⭐⭐⭐⭐⭐ (10 min) | ⭐⭐ (60 min) |
| **Facilidade** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Custo (pequeno)** | ⭐⭐⭐⭐⭐ (grátis) | ⭐⭐⭐ ($10-30) |
| **Performance** | ⭐⭐⭐⭐⭐ (CDN) | ⭐⭐⭐⭐ |
| **Escalabilidade** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Controle** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Enterprise** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🚀 RECOMENDAÇÃO FINAL

### Para esta aplicação:

**COMECE COM VERCEL** 🎯

Motivos:
1. ✅ Setup em 10 minutos vs 60 minutos
2. ✅ Grátis para começar
3. ✅ Deploy automático via Git
4. ✅ Preview deploys para cada PR
5. ✅ CDN global incluído
6. ✅ Zero configuração de infraestrutura
7. ✅ Perfeito para Supabase + React

**Migre para Google Cloud depois** se precisar:
- Alta escala (>100k visits/dia)
- Features enterprise
- Compliance específico
- Integração GCP services

---

## 📞 LINKS ÚTEIS

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Documentação:** https://vercel.com/docs
- **CLI Docs:** https://vercel.com/docs/cli
- **Status Page:** https://vercel-status.com

---

## 🎉 PRONTO!

Execute o deploy agora:

```bash
# Opção 1: Dashboard
https://vercel.com/new

# Opção 2: CLI
npm install -g vercel && vercel
```

**Tempo até aplicação no ar:** 10-15 minutos

**URL:** `https://seu-projeto.vercel.app`

Configure um domínio customizado depois para melhor experiência!

---

**Criado em:** 2026-01-10
**Compatibilidade:** ✅ 100% Pronto
**Arquivos necessários:** ✅ Todos criados
