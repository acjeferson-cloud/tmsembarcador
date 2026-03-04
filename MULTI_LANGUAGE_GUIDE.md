# Guia de Multi-Idiomas do TMS Embarcador

## Visão Geral

O sistema TMS Embarcador agora suporta múltiplos idiomas utilizando **i18next** e **react-i18next**. Os idiomas suportados são:

- 🇧🇷 **Português (Brasil)** - `pt`
- 🇺🇸 **Inglês (Estados Unidos)** - `en`
- 🇪🇸 **Espanhol (Espanha)** - `es`

## Arquitetura

### Estrutura de Arquivos

```
src/
├── locales/
│   ├── pt/
│   │   └── translation.json  # Traduções em Português
│   ├── en/
│   │   └── translation.json  # Traduções em Inglês
│   └── es/
│       └── translation.json  # Traduções em Espanhol
├── context/
│   └── LanguageContext.tsx   # Contexto de gerenciamento de idioma
├── i18n.ts                   # Configuração do i18next
├── main.tsx                  # Importa i18n na inicialização
└── components/
    └── Auth/
        └── Login.tsx         # Tela de login com seletor de bandeiras
```

### Hierarquia de Contextos

O `LanguageProvider` está posicionado no nível raiz do App, envolvendo todos os componentes:

```
App
 └── ThemeProvider
     └── LanguageProvider
         └── ConnectionProvider
             └── AppContent / Login / Public Routes
```

Isso garante que o idioma funciona tanto:
- **Antes do login** (tela de Login)
- **Após o login** (toda a aplicação)
- **Em rotas públicas** (NPS, Rastreamento)

### Banco de Dados

Duas colunas foram adicionadas:

1. **`users.preferred_language`** (text)
   - Armazena a preferência de idioma do usuário
   - Valores possíveis: `'pt'`, `'en'`, `'es'`
   - Default: `'pt'`

2. **`saas_tenants.default_language`** (text)
   - Define o idioma padrão para o tenant (White Label)
   - Valores possíveis: `'pt'`, `'en'`, `'es'`
   - Default: `'pt'`

## Cascata de Preferência de Idioma

O sistema segue a seguinte ordem de prioridade para determinar o idioma:

### Para Usuários Logados

```
1. Idioma salvo no cadastro do usuário (users.preferred_language)
   ↓
2. Idioma padrão do tenant (saas_tenants.default_language)
   ↓
3. Idioma do navegador (navigator.language)
   ↓
4. Fallback para PT-BR
```

### Para Usuários Não Logados (Tela de Login)

```
1. Idioma selecionado nas bandeiras do login (localStorage: 'tms-login-language')
   ↓
2. Idioma do navegador (navigator.language)
   ↓
3. Fallback para PT-BR
```

**Importante**: O idioma selecionado na tela de login é salvo em `localStorage` e persiste mesmo após logout, mantendo a preferência do usuário entre sessões.

## Como Usar

### No Código (Componentes React)

```typescript
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';

function MyComponent() {
  const { t } = useTranslation();
  const { language, setLanguage, isLanguageAvailable } = useLanguage();

  return (
    <div>
      <h1>{t('common.save')}</h1>
      <p>{t('messages.saveSuccess')}</p>

      {/* Para trocar o idioma */}
      <button onClick={() => setLanguage('en')}>
        Change to English
      </button>
    </div>
  );
}
```

### Adicionar Novas Traduções

1. Abra o arquivo de tradução correspondente:
   - `/src/locales/pt/translation.json`
   - `/src/locales/en/translation.json`
   - `/src/locales/es/translation.json`

2. Adicione a chave e valor:

```json
{
  "mySection": {
    "myKey": "Minha Tradução"
  }
}
```

3. Use no código:

```typescript
const { t } = useTranslation();
console.log(t('mySection.myKey')); // "Minha Tradução"
```

## Tela de Login

### Bandeiras Circulares no Rodapé

A tela de login exibe 3 bandeiras circulares no rodapé do formulário:

- 🇧🇷 **Brasil** - Português
- 🇪🇸 **Espanha** - Espanhol
- 🇺🇸 **Estados Unidos** - Inglês

### Design e Interação

**Características visuais:**
- Bandeiras circulares de 32x32px
- Sombra suave (shadow-sm) que aumenta no hover (shadow-md)
- Efeito de escala ao passar o mouse (scale-105)
- Anel azul indicando o idioma ativo (ring-2 ring-blue-500 ring-offset-2)
- Transições suaves de 200ms

**Comportamento:**
- Clique troca o idioma instantaneamente
- Tooltip exibe o nome do idioma
- A escolha é salva em `localStorage` como `tms-login-language`
- O idioma persiste mesmo após fazer logout
- Todo o sistema carrega no idioma selecionado
- Totalmente responsivo e acessível

### Código de Implementação

```typescript
const handleLanguageClick = (lang: SupportedLanguage) => {
  console.log('🌐 Idioma selecionado no login:', lang);
  localStorage.setItem('tms-login-language', lang);
  i18n.changeLanguage(lang);
};

// Exemplo de bandeira circular
<button
  type="button"
  onClick={() => handleLanguageClick('pt')}
  className={`w-8 h-8 rounded-full overflow-hidden shadow-sm
    hover:shadow-md transition-all duration-200 hover:scale-105
    ${language === 'pt' ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
  title="Português"
>
  {/* Bandeira do Brasil */}
</button>
```

## Cadastro de Usuário

### Como Configurar o Idioma

1. Acesse **Configurações → Usuários**
2. Edite ou crie um usuário
3. Na aba **Acesso**, selecione o **Idioma Preferido**:
   - 🇧🇷 Português (Brasil)
   - 🇺🇸 English (United States)
   - 🇪🇸 Español (España)
4. Salve as alterações
5. **Faça logout e login novamente** para aplicar o novo idioma

### Campo no Formulário

```typescript
<select
  name="preferred_language"
  value={formData.preferred_language}
  onChange={handleInputChange}
>
  <option value="pt">🇧🇷 Português (Brasil)</option>
  <option value="en">🇺🇸 English (United States)</option>
  <option value="es">🇪🇸 Español (España)</option>
</select>
```

## White Label (Multi-Tenant)

### Configurar Idioma Padrão por Tenant

Para definir o idioma padrão de um tenant:

```sql
UPDATE saas_tenants
SET default_language = 'en'  -- ou 'pt' ou 'es'
WHERE id = 'tenant-id-aqui';
```

### Como Funciona

Quando um usuário faz login e **não possui** idioma configurado:
1. O sistema verifica o `default_language` do tenant
2. Se existir, usa esse idioma
3. Caso contrário, segue para o próximo na cascata

## LanguageContext API

### Funções Disponíveis

```typescript
interface LanguageContextType {
  language: SupportedLanguage;              // Idioma atual ('pt', 'en', 'es')
  availableLanguages: SupportedLanguage[];  // ['pt', 'en', 'es']
  setLanguage: (lang: SupportedLanguage) => Promise<void>; // Troca idioma
  userConfiguredLanguages: SupportedLanguage[]; // Idiomas configurados
  isLanguageAvailable: (lang: SupportedLanguage) => boolean; // Verifica disponibilidade
}
```

### Exemplo de Uso

```typescript
const {
  language,
  setLanguage,
  isLanguageAvailable
} = useLanguage();

// Idioma atual
console.log(language); // 'pt'

// Trocar idioma (salva no BD)
await setLanguage('en');

// Verificar se idioma está disponível para o usuário
if (isLanguageAvailable('es')) {
  console.log('Espanhol disponível!');
}
```

## Tradução de Componentes

### Textos Comuns já Traduzidos

Os seguintes textos já estão traduzidos nos 3 idiomas:

- **common**: save, cancel, delete, edit, add, search, filter, export, etc.
- **login**: email, password, loginButton, welcomeBack, etc.
- **menu**: dashboard, operations, orders, invoices, etc.
- **messages**: saveSuccess, deleteSuccess, updateSuccess, etc.
- **validation**: required, email, minLength, maxLength, etc.

### Exemplo de Uso

```typescript
// Botões
<button>{t('common.save')}</button>
<button>{t('common.cancel')}</button>

// Mensagens
showToast(t('messages.saveSuccess'));

// Menu
<span>{t('menu.dashboard')}</span>

// Validação
{errors.email && <span>{t('validation.email')}</span>}
```

## Como Funciona Internamente

### Detecção de Usuário

O `LanguageContext` usa `supabase.auth.getSession()` diretamente ao invés de `useAuth()`, permitindo que funcione antes do login. Ele escuta mudanças de autenticação via `onAuthStateChange`:

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    loadLanguagePreference();
  } else if (event === 'SIGNED_OUT') {
    // Reset para idioma do navegador
  }
});
```

### Fluxo de Inicialização

1. **Na inicialização**: Verifica se há sessão ativa
2. **Se não houver**: Usa idioma do navegador como fallback
3. **Se houver**: Busca preferências do usuário no banco
4. **Ao fazer login**: Recarrega preferências automaticamente
5. **Ao fazer logout**: Volta para idioma do navegador

## Boas Práticas

### 1. Sempre Use Chaves de Tradução

❌ **Errado**:
```typescript
<button>Salvar</button>
```

✅ **Correto**:
```typescript
<button>{t('common.save')}</button>
```

### 2. Organize Traduções por Seção

```json
{
  "users": {
    "title": "Usuários",
    "add": "Adicionar Usuário",
    "edit": "Editar Usuário"
  },
  "orders": {
    "title": "Pedidos",
    "create": "Criar Pedido"
  }
}
```

### 3. Use Interpolação para Valores Dinâmicos

```json
{
  "welcome": "Bem-vindo, {{name}}!"
}
```

```typescript
t('welcome', { name: user.nome })
// "Bem-vindo, João!"
```

### 4. Pluralização

```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} itens"
}
```

```typescript
t('items', { count: 1 })  // "1 item"
t('items', { count: 5 })  // "5 itens"
```

## Testando a Implementação

### Teste Manual

1. **Seleção de idioma na tela de login**:
   - Acesse a tela de login
   - Clique em uma das bandeiras no rodapé (🇧🇷, 🇪🇸, 🇺🇸)
   - A bandeira selecionada fica destacada com anel azul
   - O idioma muda instantaneamente (títulos, botões, placeholders)
   - Faça login e todo o sistema carrega no idioma escolhido
   - Faça logout e a preferência é mantida

2. **Login sem idioma configurado**:
   - Sistema deve usar idioma selecionado nas bandeiras (se existir)
   - Caso contrário, usa idioma do navegador ou PT-BR

3. **Configurar idioma no usuário**:
   - Vá em Configurações → Usuários
   - Edite seu usuário
   - Na aba Acesso, selecione Inglês
   - Salve (a página recarrega automaticamente)
   - Sistema deve carregar em Inglês

4. **Persistência do idioma**:
   - Selecione Espanhol nas bandeiras
   - Faça login
   - Faça logout
   - Tela de login deve continuar em Espanhol
   - O idioma persiste entre sessões

5. **White Label**:
   - Configure `default_language = 'es'` no tenant
   - Crie usuário novo (sem idioma)
   - Login deve usar Espanhol

## Troubleshooting

### Idioma não muda após atualizar usuário

**Solução**: Faça logout e login novamente. O idioma é carregado na inicialização.

### Traduções não aparecem

**Solução**: Verifique se:
1. A chave existe no arquivo de tradução
2. O caminho está correto: `t('secao.chave')`
3. O arquivo JSON está válido (sem erros de sintaxe)

### Idioma volta para PT-BR

**Solução**: Verifique:
1. `preferred_language` está salvo no BD
2. Valor é válido: `'pt'`, `'en'` ou `'es'`
3. Usuário tem permissão de leitura na tabela `users`

## Suporte

Para adicionar novos idiomas ou reportar problemas com traduções, contate a equipe de desenvolvimento.

---

**Última atualização**: 2025-12-12
**Versão**: 1.0.0
