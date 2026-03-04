# Como Testar o PWA

## Teste Rápido no Localhost

### 1. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

**Nota**: O Service Worker funciona em localhost sem necessidade de HTTPS.

### 2. Abrir no Chrome/Edge

1. Abra `http://localhost:5173`
2. Aguarde o carregamento completo
3. Verifique no console: `✅ Service Worker registrado`

### 3. Testar instalação

O prompt de instalação aparecerá automaticamente no canto inferior direito após alguns segundos.

Ou você pode:
1. Clicar no ícone de instalação na barra de endereços (ícone de computador/celular)
2. Ou abrir DevTools > Application > Manifest > Clicar em "Install"

### 4. Verificar Service Worker

**Chrome DevTools > Application > Service Workers**

Você deve ver:
- Status: Activated and running
- Scope: http://localhost:5173/
- Source: sw.js

### 5. Testar Cache

1. Navegue por algumas páginas (Dashboard, NFe, CTe)
2. Abra DevTools > Application > Cache Storage
3. Você verá dois caches:
   - `tms-embarcador-v1.0.0` (precache)
   - `tms-runtime-v1.0.0` (runtime)

### 6. Testar Modo Offline

1. Abra DevTools > Application > Service Workers
2. Marque "Offline"
3. Recarregue a página
4. As páginas já visitadas devem carregar normalmente
5. Chamadas de API mostrarão mensagem de erro offline

## Teste em Produção

### Deploy em HTTPS

O PWA **requer HTTPS** em produção (exceto localhost).

Opções:
1. Vercel (HTTPS automático)
2. Netlify (HTTPS automático)
3. Google Cloud Run (HTTPS automático)

### Verificar instalabilidade

Use o Lighthouse no Chrome DevTools:

1. Abra DevTools
2. Vá para aba "Lighthouse"
3. Selecione "Progressive Web App"
4. Clique em "Generate report"

**Critérios PWA:**
- ✅ Manifest configurado corretamente
- ✅ Service Worker registrado
- ✅ HTTPS habilitado
- ✅ Icons adequados
- ✅ Responde quando offline

## Teste em Dispositivos Móveis

### Android (Chrome)

1. Acesse o site em HTTPS
2. Aguarde o prompt "Adicionar à tela inicial"
3. Ou vá em Menu > Adicionar à tela inicial
4. Confirme a instalação
5. Um ícone será adicionado à tela inicial

**Testar offline:**
1. Abra o app instalado
2. Ative modo avião
3. Use o app normalmente
4. Páginas já visitadas funcionarão

### iOS (Safari)

1. Acesse o site em HTTPS
2. Toque no botão compartilhar
3. Selecione "Adicionar à Tela de Início"
4. Confirme o nome e adicione

**Limitações iOS:**
- Safari tem suporte PWA limitado
- Service Worker funciona com restrições
- Notificações push não suportadas
- Background sync não suportado

## Checklist de Funcionalidades

### ✅ Básico
- [ ] App carrega em localhost
- [ ] Service Worker registra sem erros
- [ ] Manifest é detectado pelo navegador
- [ ] Ícones aparecem corretamente

### ✅ Instalação
- [ ] Prompt de instalação aparece
- [ ] Instalação funciona no desktop
- [ ] Instalação funciona no mobile
- [ ] App abre em janela standalone

### ✅ Offline
- [ ] Páginas visitadas carregam offline
- [ ] Assets estáticos servem do cache
- [ ] API retorna erro amigável quando offline
- [ ] Indicador offline/online funciona

### ✅ Atualização
- [ ] Nova versão é detectada
- [ ] Prompt de atualização aparece
- [ ] Atualização funciona sem bugs
- [ ] Service Worker antigo é desativado

### ✅ Atalhos
- [ ] Atalhos aparecem no menu do app (mobile)
- [ ] Atalhos navegam para páginas corretas
- [ ] Ícones dos atalhos carregam

## Comandos Úteis

### Limpar cache do Service Worker

```javascript
// Cole no console do navegador
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

### Forçar atualização do Service Worker

```javascript
// Cole no console do navegador
navigator.serviceWorker.getRegistration().then(registration => {
  registration.update();
});
```

### Ver cache armazenado

```javascript
// Cole no console do navegador
caches.keys().then(names => {
  names.forEach(name => {
    console.log('Cache:', name);
    caches.open(name).then(cache => {
      cache.keys().then(keys => {
        console.log(`  - ${keys.length} items`);
      });
    });
  });
});
```

### Limpar todo cache

```javascript
// Cole no console do navegador
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

## Troubleshooting

### Service Worker não registra

**Erro**: `Service Worker registration failed`

**Soluções**:
1. Verifique se está em localhost ou HTTPS
2. Confirme que `sw.js` existe em `/public`
3. Limpe cache do navegador
4. Tente em modo anônimo

### Prompt de instalação não aparece

**Possíveis causas**:
1. App já está instalado
2. Critérios PWA não atendidos
3. Navegador não suporta (Firefox limitado)
4. Prompt foi fechado recentemente

**Soluções**:
1. Verifique em DevTools > Application > Manifest
2. Use Lighthouse para diagnóstico
3. Teste em Chrome/Edge

### Cache não funciona

**Erro**: Páginas não carregam offline

**Soluções**:
1. Verifique estratégia de cache em `sw.js`
2. Confirme que Service Worker está ativado
3. Navegue pelas páginas primeiro (para cachear)
4. Verifique DevTools > Application > Cache Storage

### Ícones não aparecem

**Erro**: Ícones genéricos ou quebrados

**Soluções**:
1. Confirme que ícones existem em `/public`
2. Verifique tamanhos no manifest.json
3. Use PNG ao invés de SVG se problemas persistirem
4. Teste com ícones absolutos (https://...)

## Ferramentas de Debug

### Chrome DevTools - Application Tab

- **Manifest**: Ver configuração do PWA
- **Service Workers**: Status e controles
- **Cache Storage**: Ver conteúdo do cache
- **Offline**: Simular modo offline

### Lighthouse

Audita PWA e mostra problemas:
- Performance
- Acessibilidade
- Best Practices
- SEO
- PWA Score

### PWA Builder

Site: https://www.pwabuilder.com

- Testa seu PWA
- Mostra problemas
- Gera manifests
- Cria packages para stores

## Métricas de Sucesso

### Instalação
- Taxa de instalação > 5%
- Retenção 7 dias > 60%
- Uso mensal > 40%

### Performance
- First Contentful Paint < 2s
- Time to Interactive < 5s
- Lighthouse Score > 90

### Offline
- Cache hit ratio > 80%
- Offline usage > 10%

## Próximos Passos

Depois de validar o PWA básico:

1. Implementar Push Notifications
2. Adicionar Background Sync
3. Converter ícones para PNG
4. Otimizar estratégias de cache
5. Adicionar shortcuts específicos
6. Implementar Web Share API
7. Publicar na Google Play (TWA)
