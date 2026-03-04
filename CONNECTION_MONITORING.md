# Sistema de Monitoramento de Conexão

## Visão Geral
Sistema SIMPLIFICADO de detecção de conexão usando apenas `navigator.onLine` do navegador.

**Abordagem**: Confia 100% no status de conexão do navegador, sem validações de servidor.

## Componentes

### 1. Connection Service (`connectionService.ts`)
```typescript
// Usa apenas navigator.onLine
isOnline(): boolean {
  return navigator.onLine;
}

// Escuta eventos nativos do navegador
window.addEventListener('online', ...)
window.addEventListener('offline', ...)
```

### 2. Connection Context (`ConnectionContext.tsx`)
Fornece estado global de conexão para toda aplicação.

### 3. Hook `useOnlineStatus()`
```typescript
{
  isOnline: boolean,
  lastChecked: Date,
  checkConnection: () => Promise<boolean>,
  waitForConnection: (timeout?) => Promise<boolean>,
  requireOnline: (action, errorMsg?) => Promise<void>
}
```

### 4. Componente `OfflineAlert`
Alerta visual fixo no topo quando offline/reconectado.

## Como Usar

### Validar antes de ação crítica
```typescript
import { useOnlineStatus } from '../hooks/useOnlineStatus';

function MyComponent() {
  const { isOnline } = useOnlineStatus();

  const handleSave = async () => {
    if (!isOnline) {
      alert('Sem conexão');
      return;
    }
    // salvar...
  };
}
```

### Bloquear formulário quando offline
```typescript
const { isOnline } = useOnlineStatus();

<button disabled={!isOnline}>
  Salvar
</button>
```

## Funcionalidades

✅ Detecta eventos `online`/`offline` do navegador
✅ Alerta visual automático (vermelho offline, verde reconectado)
✅ Login bloqueado quando offline
✅ Sem chamadas de servidor
✅ Extremamente leve e rápido

## Integração Atual

- ✅ `Login.tsx` - Bloqueia login quando offline
- ✅ `OfflineAlert.tsx` - Mostra alerta visual
- ✅ Todos componentes podem usar `useOnlineStatus()`

## Como Funciona

```
Usuário desconecta WiFi/Ethernet
        ↓
navigator.onLine = false
        ↓
Evento 'offline' dispara
        ↓
Sistema atualiza estado
        ↓
Alerta vermelho aparece
        ↓
Login bloqueado
```

**Extremamente simples**: O navegador já detecta conexão, apenas reagimos aos eventos.

## Debug

Verificar status no console:
```javascript
console.log(navigator.onLine);  // true ou false
console.log(connectionService.getStatus());
```
