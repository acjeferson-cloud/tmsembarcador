# Deploy Troubleshooting

## Erro: "Cannot find package 'vite'"

Este erro ocorre quando o ambiente de deploy não tem as dependências instaladas.

### Soluções

#### 1. Para Deploy na Vercel
```bash
# Já configurado no vercel.json
npm ci --legacy-peer-deps && NODE_ENV=production vite build
```

#### 2. Para Deploy no Netlify
Adicionar arquivo `netlify.toml`:
```toml
[build]
  command = "npm ci --legacy-peer-deps && npm run build"
  publish = "dist"
```

#### 3. Para Deploy no Google Cloud
```bash
# Já configurado no cloudbuild.yaml
npm ci --legacy-peer-deps
npm run build
```

#### 4. Para StackBlitz/WebContainer
**Limitação:** StackBlitz tem limitações com alguns pacotes Node.js.

**Solução:** Use Vercel, Netlify ou Google Cloud para deploy em produção.

### Build Local Funciona?

✅ **Sim**, o build local passa em 1m 24s

Para testar localmente:
```bash
npm install
npm run build
npm run preview
```

### Recomendação

Para **produção**, use uma das seguintes plataformas:

1. **Vercel** (mais fácil)
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Google Cloud Run**
   ```bash
   gcloud builds submit
   ```

### Status Atual

- ✅ Build local: Funcionando (1m 24s)
- ✅ Código: Sem erros TypeScript
- ✅ Dependências: Instaladas corretamente
- ✅ Arquivos de config: Corretos
- ⚠️ StackBlitz/WebContainer: Limitado para este projeto

---

**Próximo passo:** Retry o deploy usando uma das plataformas recomendadas acima.
