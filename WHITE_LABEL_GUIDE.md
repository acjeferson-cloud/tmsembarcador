# Guia White Label - TMS Embarcador

## Visão Geral

O sistema **White Label** permite que cada cliente (tenant) utilize o TMS Embarcador com sua própria identidade visual, marca e configurações personalizadas. A solução é totalmente integrada ao SaaS Admin Console e oferece controle completo sobre a aparência e comportamento do sistema para cada cliente.

## Funcionalidades Principais

### 1. Identidade Visual Personalizada
- **Logotipos**: Logo principal, logo pequeno, favicon
- **Cores**: 17 propriedades de cores customizáveis
- **Tipografia**: Fonte personalizada e tamanho de bordas
- **Modo**: Light, Dark ou Auto
- **CSS Customizado**: CSS adicional para ajustes finos

### 2. Configurações de Marca
- Nome da marca exibido no sistema
- Slogan/Tagline personalizado
- Informações de contato customizadas
- URLs personalizadas (suporte, política, termos)
- Textos personalizados (rodapé, login)
- Ocultar marca "Powered by TMS Embarcador"

### 3. Domínios Personalizados
- **Subdomínios**: Ex: cliente.tms.com
- **Domínios Próprios**: Ex: app.cliente.com.br
- Verificação DNS automática
- Gestão de certificados SSL
- Status de verificação em tempo real

### 4. Templates Reutilizáveis
- Templates pré-configurados (Modern Blue, Corporate Gray, Fresh Green, Deep Purple)
- Aplicação rápida de temas
- Contador de uso de templates
- Preview visual antes de aplicar

### 5. Gestão de Assets
- Upload de logos e imagens
- Gerenciamento de favicons
- Imagens de fundo personalizadas
- Headers para emails

## Estrutura do Banco de Dados

### Tabelas White Label

#### white_label_configs
Configurações principais por tenant:
- `tenant_id` - Referência ao cliente
- `is_enabled` - Ativar/desativar white label
- `brand_name` - Nome da marca
- `company_name` - Razão social
- `tagline` - Slogan
- `support_url`, `contact_email`, `contact_phone`
- `privacy_policy_url`, `terms_of_service_url`
- `hide_powered_by` - Ocultar marca original
- `custom_footer_text`, `custom_login_message`

#### white_label_themes
Temas de cores e estilos:
- `tenant_id` - Referência ao cliente
- `name` - Nome do tema
- `is_active` - Tema ativo
- 17 propriedades de cores customizáveis:
  - `primary_color`, `secondary_color`, `accent_color`
  - `background_color`, `text_color`
  - `header_bg_color`, `header_text_color`
  - `sidebar_bg_color`, `sidebar_text_color`
  - `button_primary_bg`, `button_primary_text`
  - `link_color`, `success_color`, `warning_color`, `error_color`, `info_color`
- `border_radius`, `font_family`, `theme_mode`
- `custom_css` - CSS adicional

#### white_label_assets
Logos e assets:
- `asset_type` - logo, logo_small, favicon, background, email_header
- `file_name`, `file_url`
- `file_size`, `mime_type`, `width`, `height`
- `is_active` - Asset ativo

#### white_label_domains
Domínios personalizados:
- `domain` - Domínio completo
- `domain_type` - subdomain ou custom
- `is_primary` - Domínio principal
- `status` - pending, verifying, active, failed, suspended
- `dns_verification_token` - Token para verificação DNS
- `ssl_status` - pending, issuing, active, expired, failed
- `ssl_expires_at` - Data de expiração do SSL

#### white_label_templates
Templates reutilizáveis:
- `name`, `description`, `category`
- `is_public` - Template público
- `theme_config` - Configuração de cores do template
- `usage_count` - Contador de uso

#### white_label_versions
Histórico de versões:
- `version_number` - Número da versão
- `change_description` - Descrição das mudanças
- `config_snapshot`, `theme_snapshot`, `assets_snapshot`
- `is_rollback` - Indica se é um rollback

## Como Usar

### 1. Acessar o Painel White Label

1. Faça login como administrador no TMS
2. Acesse **"SaaS Admin Console"** no menu
3. Clique na aba **"White Label"**
4. Selecione o cliente que deseja configurar

### 2. Configurar Identidade da Marca

Na aba **"Configurações"**:

1. Marque "Ativar White Label para este cliente"
2. Preencha:
   - Nome da Marca
   - Razão Social
   - Slogan (opcional)
   - Email e Telefone de Contato
   - URLs de Suporte, Política e Termos
3. Configure textos personalizados:
   - Texto do Rodapé
   - Mensagem de Login
4. Marque "Ocultar Powered by" se desejar
5. Clique em **"Salvar Configurações"**

### 3. Criar e Configurar Tema de Cores

Na aba **"Tema e Cores"**:

1. Clique em **"Novo"** para criar um tema
2. Digite um nome para o tema
3. Configure as cores:
   - Use os seletores de cor ou digite códigos HEX
   - Configure cores primária, secundária e de destaque
   - Ajuste cores de fundo, texto, header e sidebar
   - Configure cores de botões e links
   - Defina cores de feedback (sucesso, aviso, erro, info)
4. Clique em **"Visualizar Preview"** para ver o resultado
5. Clique em **"Salvar Tema"**
6. Para ativar, clique em **"Ativar"** no tema desejado

**Cores Customizáveis:**
- **Primária**: Cor principal do sistema
- **Secundária**: Cor secundária para elementos
- **Destaque**: Cor de realce/accent
- **Fundo**: Cor de fundo geral
- **Texto**: Cor do texto principal
- **Header**: Fundo e texto do cabeçalho
- **Sidebar**: Fundo e texto da barra lateral
- **Botão Primário**: Fundo e texto do botão
- **Link**: Cor dos links
- **Sucesso**: Verde para mensagens positivas
- **Aviso**: Amarelo para alertas
- **Erro**: Vermelho para erros
- **Info**: Azul para informações

### 4. Upload de Logos e Assets

Na aba **"Logos e Assets"**:

1. **Logo Principal**: Logo exibido no header (recomendado: 200x60px)
2. **Logo Pequeno**: Logo para espaços reduzidos
3. **Favicon**: Ícone exibido na aba do navegador (16x16 ou 32x32px)
4. **Imagem de Fundo**: Fundo da tela de login (opcional)
5. **Header de Email**: Logo para templates de email

Clique em **"Upload"** em cada tipo de asset para fazer o envio.

### 5. Configurar Domínios Personalizados

Na aba **"Domínios"**:

1. Clique em **"Adicionar Domínio"**
2. Selecione o tipo:
   - **Subdomínio**: Para domínios como cliente.tms.com
   - **Domínio Próprio**: Para domínios como app.cliente.com.br
3. Digite o domínio completo
4. Clique em **"Adicionar"**
5. Para domínios próprios:
   - Copie o token de verificação DNS
   - Adicione um registro TXT no DNS do domínio
   - Aguarde a verificação automática
6. O SSL será configurado automaticamente após verificação

### 6. Usar Templates Prontos

Na aba **"Templates"**:

1. Visualize os templates disponíveis
2. Veja as cores de preview de cada template
3. Clique em **"Aplicar Template"** no template desejado
4. Confirme a aplicação
5. Um novo tema será criado automaticamente com as cores do template
6. Ative o tema na aba "Tema e Cores"

**Templates Disponíveis:**
- **Modern Blue**: Tema moderno com tons de azul
- **Corporate Gray**: Tema corporativo com tons de cinza
- **Fresh Green**: Tema fresco com tons de verde
- **Deep Purple**: Tema elegante com tons de roxo

## Aplicação do White Label

### Como o White Label é Aplicado

O sistema utiliza CSS Variables para aplicar as cores em tempo real:

```css
--color-primary: #3B82F6;
--color-secondary: #8B5CF6;
--color-accent: #10B981;
/* ... e mais 14 variáveis */
```

Quando o White Label está ativo:
1. As variáveis CSS são injetadas no `document.documentElement`
2. O título da página é alterado para o `brand_name`
3. O favicon é atualizado se configurado
4. CSS customizado é injetado (se houver)
5. Textos personalizados substituem os padrões

### WhiteLabelContext

O contexto `WhiteLabelContext` gerencia o estado do White Label:

```typescript
const { config, theme, assets, isEnabled, applyTheme, refreshConfig } = useWhiteLabel();
```

**Propriedades:**
- `config` - Configurações do white label
- `theme` - Tema ativo
- `assets` - Assets (logos, favicon, etc)
- `isEnabled` - Se white label está ativo
- `applyTheme()` - Aplica o tema manualmente
- `refreshConfig()` - Recarrega as configurações

## Isolamento por Tenant

### Garantias de Isolamento

1. **Dados**: Cada tenant só vê suas próprias configurações (RLS)
2. **Marca**: Quando white label está ativo, nenhuma referência ao TMS Embarcador aparece
3. **Domínio**: Cada tenant pode ter domínio próprio
4. **Tema**: Completamente independente entre tenants
5. **Assets**: Armazenados separadamente por tenant

### Row Level Security (RLS)

Todas as tabelas white label têm RLS habilitado:
- Administradores podem gerenciar qualquer configuração
- Usuários comuns só visualizam configurações ativas do próprio tenant
- Logs de auditoria registram todas as alterações

## Versionamento e Rollback

O sistema mantém histórico de todas as alterações:

```sql
SELECT * FROM white_label_versions
WHERE tenant_id = '...'
ORDER BY version_number DESC;
```

Cada versão armazena:
- Snapshot completo da configuração
- Snapshot do tema ativo
- Snapshot dos assets
- Descrição das mudanças
- Quem aplicou e quando

## Segurança

### Políticas de Segurança

1. **Acesso Restrito**: Apenas administradores podem modificar
2. **Validação**: Domínios são validados antes de ativar
3. **SSL Automático**: Certificados gerenciados automaticamente
4. **Auditoria**: Todas as ações são registradas
5. **Isolamento**: RLS garante separação entre tenants

### Boas Práticas

1. **Backup**: Sempre crie versões antes de grandes mudanças
2. **Teste**: Use ambiente de homologação antes de produção
3. **Validação**: Verifique domínios antes de ativar
4. **Cores**: Teste contraste e legibilidade
5. **Assets**: Use imagens otimizadas (PNG, JPEG, SVG)

## API e Serviços

### whiteLabelService

Serviço TypeScript para gerenciar White Label:

```typescript
import { whiteLabelService } from '../services/whiteLabelService';

// Configurações
await whiteLabelService.getConfig(tenantId);
await whiteLabelService.createConfig(config);
await whiteLabelService.updateConfig(tenantId, config);

// Temas
await whiteLabelService.getThemes(tenantId);
await whiteLabelService.getActiveTheme(tenantId);
await whiteLabelService.createTheme(theme);
await whiteLabelService.updateTheme(id, theme);
await whiteLabelService.activateTheme(tenantId, themeId);
await whiteLabelService.deleteTheme(id);

// Assets
await whiteLabelService.getAssets(tenantId, assetType);
await whiteLabelService.createAsset(asset);
await whiteLabelService.deleteAsset(id);

// Domínios
await whiteLabelService.getDomains(tenantId);
await whiteLabelService.createDomain(domain);
await whiteLabelService.updateDomain(id, domain);
await whiteLabelService.deleteDomain(id);

// Templates
await whiteLabelService.getTemplates();
await whiteLabelService.applyTemplate(tenantId, templateId);
```

## Troubleshooting

### Tema não está aplicando

1. Verifique se White Label está ativo para o tenant
2. Confirme que o tema está marcado como ativo
3. Recarregue a página (Ctrl+F5)
4. Verifique o console do navegador por erros

### Domínio não verifica

1. Confirme que o registro TXT está correto no DNS
2. Aguarde propagação DNS (pode levar até 48h)
3. Use ferramentas como `dig` ou `nslookup` para verificar
4. Verifique na aba "Domínios" o status e mensagens de erro

### Logo não aparece

1. Verifique se o asset está marcado como ativo
2. Confirme que o URL da imagem está acessível
3. Verifique permissões de storage
4. Tente fazer upload novamente

### CSS customizado não funciona

1. Valide a sintaxe CSS
2. Use seletores específicos para evitar conflitos
3. Verifique prioridade (!important pode ser necessário)
4. Limpe o cache do navegador

## Roadmap

### Em Desenvolvimento
- [ ] Upload real de assets via Storage do Supabase
- [ ] Verificação automática de DNS
- [ ] Emissão automática de certificados SSL
- [ ] Editor visual de CSS

### Planejado
- [ ] Preview em tempo real do tema
- [ ] Múltiplos temas por tenant
- [ ] Importar/exportar configurações
- [ ] Templates de email personalizados
- [ ] Widgets customizáveis
- [ ] Modo de preview sem ativar

## Suporte

Para dúvidas ou problemas:
1. Consulte esta documentação
2. Verifique os logs de auditoria no Admin Console
3. Entre em contato com o administrador do sistema

---

**Versão**: 1.0.0
**Data**: Dezembro 2025
**Status**: Em Produção
