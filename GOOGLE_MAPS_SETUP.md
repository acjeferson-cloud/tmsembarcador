# Configuração do Google Maps

## Status Atual

A API Key do Google Maps está configurada em dois lugares:
1. **Banco de Dados**: `google_maps_config` table (configuração ativa)
2. **Arquivo .env**: `VITE_GOOGLE_MAPS_API_KEY` (fallback)

### API Key Ativa
- **Fonte**: Banco de dados (configuração mais recente)
- **Key**: `AIzaSyCwKFbvio3eig1B1g0LJ09t7sDVkh6VBSI`
- **Status**: ✅ Válida (testada via API Geocoding)

## Possíveis Problemas

Se o Google Maps não carregar, pode ser devido a:
- Restrições de domínio não configuradas para o ambiente atual
- APIs não habilitadas no Google Cloud Console
- Limite de uso da API excedido
- Problemas de CORS ou CSP (Content Security Policy)

## Como Obter uma Nova API Key

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative as seguintes APIs:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Places API**
4. Vá em "Credenciais" e clique em "Criar Credenciais" > "Chave de API"
5. Copie a nova API Key

## Configurar Restrições (Recomendado)

### Restrições de Aplicativo
- **HTTP referrers (sites)**: Adicione os domínios permitidos
  - `localhost:*`
  - `127.0.0.1:*`
  - `seu-dominio.com.br/*`

### Restrições de API
Restrinja a chave apenas para as APIs necessárias:
- Maps JavaScript API
- Geocoding API
- Places API

## Configurar no Projeto

1. Abra o arquivo `.env` na raiz do projeto
2. Atualize a variável `VITE_GOOGLE_MAPS_API_KEY` com sua nova chave:

```env
VITE_GOOGLE_MAPS_API_KEY=SUA_NOVA_API_KEY_AQUI
```

3. Reinicie o servidor de desenvolvimento

## Melhorias Implementadas (v2)

✅ **Dual Source API Key**: Banco de dados (primário) + .env (fallback)
✅ **Retry System**: Botão "Tentar Novamente" sem recarregar página
✅ **Timeout Inteligente**: 10s no loader + 15s no componente
✅ **Logs Detalhados**: Console mostra cada etapa do carregamento
✅ **Error Handler**: Detecta falhas de autenticação via `gm_authFailure`
✅ **Script Cleanup**: Remove scripts que falharam automaticamente
✅ **MapRef Safety**: Aguarda 100ms para garantir que ref está montado
✅ **Single Active Config**: Apenas 1 configuração ativa no banco
✅ **Better Error Messages**: Mensagens específicas para cada tipo de erro

## Telas que Usam Google Maps

- **Parceiros de Negócios** - Mapa de localização
- **Estabelecimentos** - Mapa de localização
- **Torre de Controle** - Mapa em tempo real com veículos
- **Estados** - Mapa do Brasil (SVG, não usa Google Maps)

## Testando a Integração

Após configurar a nova API Key:

1. Acesse qualquer tela com mapa
2. O mapa deve carregar em até 10 segundos
3. Se houver erro, uma mensagem clara será exibida
4. Use o botão "Tentar Novamente" (azul) para retry sem recarregar
5. Use "Recarregar Página" (vermelho) se o retry não funcionar

## Troubleshooting

### Erro: "Google Maps Indisponível"

**Verifique no Console do Navegador (F12):**

1. **"API Key carregada do banco de dados: AIzaSy..."**
   - ✅ OK: API Key foi encontrada e carregada

2. **"Erro ao buscar configuração do Google Maps"**
   - ❌ Problema de conexão com Supabase
   - Solução: Verifique conexão com internet e .env

3. **"gm_authFailure"**
   - ❌ API Key inválida ou expirada
   - Solução: Gere nova API Key no Google Cloud Console

4. **"Request denied"**
   - ❌ Restrições de domínio bloqueando
   - Solução: Adicione o domínio atual nas restrições da API Key

### Verificar Domínios Permitidos

No Google Cloud Console > Credenciais > Sua API Key > Restrições de aplicativo:

```
localhost:*
127.0.0.1:*
*.webcontainer-api.io/*
seu-dominio-producao.com/*
```

### Verificar APIs Habilitadas

No Google Cloud Console > APIs e Serviços > Biblioteca:

- ✅ Maps JavaScript API (obrigatório)
- ✅ Geocoding API (obrigatório)
- ✅ Places API (opcional, mas recomendado)

## Custos

O Google Maps tem um plano gratuito que inclui:
- $200 de crédito por mês
- Aproximadamente 28.000 carregamentos de mapa por mês
- Uso de APIs de Geocoding e Places

Monitore seu uso no [Google Cloud Console](https://console.cloud.google.com/billing).
