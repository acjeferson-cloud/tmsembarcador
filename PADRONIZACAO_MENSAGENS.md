# Padronização de Mensagens do Sistema

## Objetivo
Garantir uma experiência de uso consistente, profissional e alinhada à identidade da solução através da padronização de todas as mensagens exibidas ao usuário.

## Componente Padrão: InlineMessage

Foi criado o componente `InlineMessage` em `/src/components/common/InlineMessage.tsx` que serve como base para todas as mensagens inline do sistema.

### Tipos de Mensagens

#### 1. InlineMessage (Mensagem Simples)
```tsx
<InlineMessage
  type="success" | "error" | "warning" | "info"
  message="Sua mensagem aqui"
/>
```

**Características:**
- Ícone + texto inline
- Cores padronizadas por tipo
- Tamanho compacto (16px ícone, texto small)

**Exemplo Visual:**
- ✓ Sucesso: ícone verde + texto verde
- ✗ Erro: ícone vermelho + texto vermelho
- ⚠ Aviso: ícone amarelo + texto amarelo
- ℹ Info: ícone azul + texto azul

#### 2. InlineMessageBox (Mensagem em Caixa)
```tsx
<InlineMessageBox
  type="success" | "error" | "warning" | "info"
  message="Sua mensagem aqui"
/>
```

**Características:**
- Mensagem dentro de caixa colorida
- Fundo suave + ícone colorido
- Ideal para mensagens importantes ou de contexto

## Padrão de Cores

### Sucesso (Success)
- Ícone: `CheckCircle` verde (`text-green-600`)
- Texto: verde escuro (`text-green-800`)
- Fundo (box): verde claro (`bg-green-50`)

### Erro (Error)
- Ícone: `XCircle` vermelho (`text-red-600`)
- Texto: vermelho escuro (`text-red-800`)
- Fundo (box): vermelho claro (`bg-red-50`)

### Aviso (Warning)
- Ícone: `AlertCircle` amarelo (`text-yellow-600`)
- Texto: amarelo escuro (`text-yellow-800`)
- Fundo (box): amarelo claro (`bg-yellow-50`)

### Informação (Info)
- Ícone: `Info` azul (`text-blue-600`)
- Texto: azul escuro (`text-blue-800`)
- Fundo (box): azul claro (`bg-blue-50`)

## Componentes Padronizados

### ✅ Formulários Principais
- **EstablishmentForm** - Cadastro de Estabelecimentos (referência original)
- **BusinessPartnerForm** - Cadastro de Parceiros de Negócio
- **UserForm** - Cadastro de Usuários
- **CarrierForm** - Cadastro de Transportadoras
- **OccurrenceForm** - Cadastro de Ocorrências
- **RejectionReasonForm** - Cadastro de Motivos de Rejeição

### Exemplos de Uso nos Componentes

#### Validação de Campo
```tsx
{errors.codigo && (
  <div className="mt-2">
    <InlineMessage type="error" message={errors.codigo} />
  </div>
)}
```

#### Busca de CEP
```tsx
{cepError && (
  <div className="mt-2">
    <InlineMessage type="error" message={cepError} />
  </div>
)}

{cepSuccess && (
  <div className="mt-2">
    <InlineMessage type="success" message={cepSuccess} />
  </div>
)}
```

#### Consulta API Externa
```tsx
{cnpjMessage && (
  <div className="mt-2">
    <InlineMessage
      type={cnpjMessage.type}
      message={cnpjMessage.text}
    />
  </div>
)}
```

#### Teste de Conexão
```tsx
{connectionStatus.success !== undefined && (
  <InlineMessageBox
    type={connectionStatus.success ? 'success' : 'error'}
    message={connectionStatus.message}
  />
)}
```

## Mensagens Toast (Modais Centralizadas)

O componente `Toast` já existente mantém o mesmo padrão de cores e ícones, mas é usado para:
- Confirmações de ações (salvar, excluir, atualizar)
- Erros críticos que precisam de atenção
- Avisos importantes que requerem acknowledgment

### Quando usar Toast vs InlineMessage

**Use InlineMessage quando:**
- Validação de campo em tempo real
- Feedback de busca/consulta
- Mensagens contextuais próximas ao elemento relacionado
- Erros de validação de formulário

**Use Toast quando:**
- Confirmação de operação (salvou, excluiu, atualizou)
- Erro crítico de sistema
- Aviso que requer atenção imediata do usuário
- Feedback de ações globais (não relacionadas a um campo específico)

## Linguagem das Mensagens

### Princípios
1. **Clara e Objetiva** - Evite jargões técnicos
2. **Ação Orientada** - Indique o que o usuário deve fazer
3. **Positiva** - Quando possível, use linguagem positiva
4. **Consistente** - Use os mesmos termos para ações similares

### Exemplos de Boas Mensagens

#### ✅ Validação
- "Campo obrigatório"
- "CPF inválido. Use o formato 000.000.000-00"
- "Email já cadastrado no sistema"
- "Código deve ter exatamente 4 dígitos numéricos"

#### ✅ Sucesso
- "Estabelecimento cadastrado com sucesso"
- "Usuário atualizado com sucesso"
- "Endereço encontrado: São Paulo - SP"
- "Conexão estabelecida com sucesso"

#### ✅ Erro
- "CEP não encontrado. Verifique o número informado"
- "Erro ao buscar dados. Tente novamente"
- "Este código já está sendo usado"
- "Preencha todos os campos obrigatórios"

#### ✅ Aviso
- "Este usuário está bloqueado temporariamente"
- "Algumas funcionalidades estão em manutenção"
- "Documento pendente de validação"

#### ✅ Info
- "Código Sequencial: O sistema gera automaticamente"
- "Use senhas com no mínimo 8 caracteres"
- "Perfil Personalizado requer configuração de permissões"

## Checklist de Implementação

Ao adicionar novas mensagens em um componente:

- [ ] Importar `InlineMessage` de `../common/InlineMessage`
- [ ] Usar tipo apropriado (success, error, warning, info)
- [ ] Mensagem clara e objetiva
- [ ] Posicionar próxima ao elemento relacionado (geralmente com `mt-2`)
- [ ] Evitar duplicar lógica de estilo (use o componente!)
- [ ] Testar em diferentes tamanhos de tela
- [ ] Verificar contraste de cores (acessibilidade)

## Benefícios da Padronização

1. **Consistência Visual** - Todas as mensagens seguem o mesmo padrão
2. **Manutenibilidade** - Um único ponto de alteração para mudanças globais
3. **Experiência do Usuário** - Interface previsível e profissional
4. **Acessibilidade** - Cores e contrastes padronizados
5. **Velocidade de Desenvolvimento** - Reutilização de componente pronto

## Próximos Passos

Para continuar a padronização em novos módulos:

1. Identificar componentes com mensagens inline antigas
2. Importar `InlineMessage`
3. Substituir divs customizadas por `<InlineMessage />`
4. Verificar tipos de mensagem (success, error, warning, info)
5. Testar e validar visualmente
6. Documentar mensagens específicas se necessário
