# 🔧 Instalação - Testes E2E TMS

## Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- Git

## Passo a Passo

### 1. Verificar Instalação do Playwright

```bash
# Verificar se Playwright está instalado
npm list @playwright/test
```

Se não estiver instalado:

```bash
npm install -D @playwright/test
```

### 2. Instalar Browsers

```bash
# Instalar todos os browsers
npx playwright install

# Ou instalar com dependências do sistema
npx playwright install --with-deps
```

### 3. Verificar Instalação

```bash
# Verificar versão
npx playwright --version

# Listar browsers instalados
npx playwright install --dry-run
```

### 4. Primeiro Teste

```bash
# Rodar interface gráfica
npm run test:e2e:ui
```

## Browsers Instalados

Após a instalação, você terá:

- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)

## Troubleshooting

### Erro: Missing system dependencies

**Linux:**
```bash
npx playwright install-deps
```

**Mac:**
```bash
# Instalar via Homebrew se necessário
brew install --cask playwright
```

**Windows:**
Geralmente funciona sem configuração adicional.

### Erro: Permission denied

```bash
sudo npx playwright install --with-deps
```

### Erro: Port 5173 already in use

```bash
# Matar processo
npx kill-port 5173

# Ou mudar porta no vite.config.ts
```

## Configuração de Ambiente

### .env (Opcional)

Se quiser customizar:

```env
BASE_URL=http://localhost:5173
```

## Atualizações

### Atualizar Playwright

```bash
npm update @playwright/test
npx playwright install
```

### Verificar Updates

```bash
npm outdated @playwright/test
```

## Comandos Úteis

```bash
# Limpar cache do Playwright
npx playwright cache --clear

# Ver informações do sistema
npx playwright system-info

# Rodar teste específico
npx playwright test nome-do-teste
```

## Próximo Passo

Após instalação, veja:
- [Quick Start](./QUICK_START.md) - Início rápido
- [README](./README.md) - Documentação completa

## ✅ Checklist

- [ ] Node.js 16+ instalado
- [ ] @playwright/test instalado
- [ ] Browsers instalados
- [ ] Primeiro teste executado com sucesso
- [ ] Interface gráfica funcionando

---

**Pronto!** Sua automação E2E está funcionando! 🎉

```bash
npm run test:e2e:ui
```
