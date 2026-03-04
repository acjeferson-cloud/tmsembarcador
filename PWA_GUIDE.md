# Guia de PWA - TMS Embarcador Smart Log

## O que é PWA?

PWA (Progressive Web App) é uma tecnologia que permite que aplicações web sejam instaladas e usadas como aplicativos nativos em desktop e dispositivos móveis, oferecendo funcionalidades offline e melhor desempenho.

## Recursos Implementados

### 1. Manifest (manifest.json)

O arquivo `public/manifest.json` define as configurações do aplicativo:

- **Nome**: TMS Embarcador Smart Log
- **Nome Curto**: Smart Log
- **Ícones**: Disponíveis em SVG (192x192 e 512x512)
- **Modo de Exibição**: Standalone (app independente)
- **Cor do Tema**: Azul (#2563eb)
- **Orientação**: Retrato
- **Atalhos**: Acesso rápido a Dashboard, NFe, CTe e Rastreamento

### 2. Service Worker (sw.js)

O Service Worker em `public/sw.js` fornece:

- **Cache de Assets**: Armazena arquivos estáticos para acesso offline
- **Estratégia Cache-First**: Serve do cache quando disponível
- **Fallback para API**: Retorna erro amigável quando offline
- **Atualização Automática**: Detecta novas versões e atualiza

### 3. Instalação

O componente `PWAInstallPrompt` exibe automaticamente um prompt de instalação quando:

- O navegador suporta PWA (Chrome, Edge, Safari)
- O usuário ainda não instalou o app
- O app não está sendo executado no modo standalone

### 4. Funcionalidades Offline

- Cache de páginas e assets estáticos
- Detecção de status online/offline
- Mensagens de erro amigáveis quando offline
- Sincronização automática quando volta online

## Como Instalar

### Desktop (Chrome/Edge)

1. Acesse o TMS Embarcador no navegador
2. Clique no botão "Instalar" no prompt que aparece no canto inferior direito
3. Ou clique no ícone de instalação na barra de endereços
4. O app será instalado e abrirá em janela própria

### Mobile (Android/iOS)

**Android (Chrome):**
1. Abra o site no Chrome
2. Toque no menu (três pontos)
3. Selecione "Adicionar à tela inicial" ou "Instalar app"
4. Confirme a instalação

**iOS (Safari):**
1. Abra o site no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"
4. Confirme adicionando o ícone

## Atalhos do Aplicativo

Após instalado, o app oferece atalhos rápidos:

1. **Dashboard** - Acesso ao painel principal
2. **Notas Fiscais** - Gerenciamento de NFe
3. **CTe** - Gerenciamento de conhecimentos
4. **Rastreamento** - Rastreamento de pedidos

## Atualização do App

O Service Worker detecta automaticamente novas versões:

1. Uma nova versão é baixada em segundo plano
2. Um prompt aparece perguntando se deseja atualizar
3. Ao aceitar, o app é atualizado e recarregado
4. Todas as funcionalidades novas ficam disponíveis

## Vantagens do PWA

### Para Usuários

- ✅ Acesso offline às páginas já visitadas
- ✅ Instalação sem Google Play ou App Store
- ✅ Menos espaço ocupado que apps nativos
- ✅ Atualizações automáticas
- ✅ Acesso rápido pela tela inicial
- ✅ Experiência similar a app nativo
- ✅ Notificações push (futuro)

### Para a Empresa

- ✅ Redução de custos (sem necessidade de apps nativos)
- ✅ Manutenção unificada (uma base de código)
- ✅ Deploy instantâneo de atualizações
- ✅ Compatibilidade multiplataforma
- ✅ SEO mantido (ainda é web)
- ✅ Analytics e métricas integradas

## Requisitos

### Navegadores Suportados

- ✅ Chrome 73+ (Desktop e Mobile)
- ✅ Edge 79+
- ✅ Safari 11.1+ (iOS/macOS)
- ✅ Firefox 97+ (parcial)
- ✅ Samsung Internet 11+

### Servidor

- ✅ HTTPS obrigatório (exceto localhost)
- ✅ Manifest.json acessível
- ✅ Service Worker registrado
- ✅ Ícones em formato adequado

## Estrutura de Arquivos

```
public/
├── manifest.json          # Configurações do PWA
├── sw.js                  # Service Worker
├── icon.svg              # Ícone principal
├── icon-192.svg          # Ícone 192x192
└── icon-512.svg          # Ícone 512x512

src/
├── main.tsx              # Registro do Service Worker
└── components/
    └── common/
        └── PWAInstallPrompt.tsx  # Prompt de instalação
```

## Cache Strategy

O Service Worker usa estratégias diferentes para tipos de conteúdo:

### Assets Estáticos (Cache-First)
- HTML, CSS, JS
- Imagens e ícones
- Serve do cache primeiro
- Atualiza em background

### API Calls (Network-First)
- Chamadas Supabase
- Edge Functions
- Sempre tenta rede primeiro
- Retorna erro se offline

### Runtime Cache
- Páginas visitadas
- Assets dinâmicos
- Cache de 200 responses
- Limpeza automática de versões antigas

## Troubleshooting

### App não oferece instalação

1. Verifique se está em HTTPS
2. Confirme que manifest.json está acessível
3. Abra DevTools > Application > Manifest
4. Verifique se Service Worker está registrado

### Service Worker não registra

1. Limpe cache do navegador
2. Verifique console por erros
3. Confirme que sw.js está acessível
4. Tente em modo anônimo

### Cache não funciona

1. Abra DevTools > Application > Service Workers
2. Clique em "Unregister" e recarregue
3. Verifique se CACHE_NAME está correto
4. Confirme estratégia de cache no código

### Atualização não aparece

1. O Service Worker usa cache
2. Feche todas as abas do app
3. Reabra o app
4. A atualização deve ser detectada

## Próximas Melhorias

- [ ] Push Notifications para alertas
- [ ] Background Sync para upload offline
- [ ] Conversão de ícones para PNG
- [ ] Suporte a Web Share API
- [ ] Badging API para contador
- [ ] Shortcuts mais específicos
- [ ] Screenshots para Google Play

## Suporte

Para questões sobre PWA, consulte:
- [MDN PWA Docs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Guide](https://web.dev/progressive-web-apps/)
- [Apple PWA Support](https://developer.apple.com/documentation/webkit/webkit_web_views)

## Changelog

### v1.0.0 (2026-01-14)
- ✅ Implementação inicial do PWA
- ✅ Manifest.json configurado
- ✅ Service Worker com cache
- ✅ Prompt de instalação
- ✅ Suporte offline básico
- ✅ Atalhos do app
- ✅ Atualização automática
