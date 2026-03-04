# Formatação Automática - Cadastro de Transportadores

## Implementação Concluída

Foram implementadas formatações automáticas para os campos do formulário de cadastro de transportadores, melhorando significativamente a experiência do usuário e a consistência dos dados.

## Funcionalidades Implementadas

### 1. Formatação de Razão Social e Nome Fantasia

**Regras Aplicadas:**
- Primeira letra de cada palavra em maiúsculo (Title Case)
- Siglas empresariais permanecem em MAIÚSCULO (LTDA, SA, ME, EPP, MEI, EIRELI, CIA, etc.)
- Palavras conectivas em minúsculo (de, da, do, e, para, com, etc.)
- Formatação em tempo real durante a digitação

**Exemplos:**
```
Entrada: "TRANSPORTADORA ABC LTDA"
Saída: "Transportadora Abc LTDA"

Entrada: "joao silva transportes me"
Saída: "Joao Silva Transportes ME"

Entrada: "empresa xyz s/a"
Saída: "Empresa Xyz S/A"

Entrada: "transportes silva e santos eireli"
Saída: "Transportes Silva e Santos EIRELI"
```

### 2. Formatação de CNPJ

**Formato Aplicado:** `00.000.000/0000-00`

**Características:**
- Formatação progressiva durante digitação
- Limita entrada a 14 dígitos numéricos
- Remove caracteres não numéricos automaticamente
- Salva no banco apenas números (sem formatação)

**Exemplos:**
```
Entrada: "12345678000195"
Exibição: "12.345.678/0001-95"
Salvo no BD: "12345678000195"
```

### 3. Formatação de Telefone

**Formatos Suportados:**
- Celular (11 dígitos): `(00) 00000-0000`
- Fixo (10 dígitos): `(00) 0000-0000`

**Características:**
- Formatação progressiva durante digitação
- Detecta automaticamente celular vs fixo
- Remove caracteres não numéricos automaticamente
- Salva no banco apenas números (sem formatação)

**Exemplos:**
```
Entrada: "11987654321"
Exibição: "(11) 98765-4321"
Salvo no BD: "11987654321"

Entrada: "1134567890"
Exibição: "(11) 3456-7890"
Salvo no BD: "1134567890"
```

## Integração com Receita Federal

Quando dados são importados via consulta CNPJ na Receita Federal, as formatações são aplicadas automaticamente:

- **Razão Social**: Formatada com Title Case e siglas em maiúsculo
- **Nome Fantasia**: Formatada com Title Case e siglas em maiúsculo
- **CNPJ**: Formatado com pontos, barra e hífen
- **Telefone**: Formatado com parênteses e hífen

## Modo Edição

Ao carregar um transportador existente para edição:
- Todos os campos são formatados automaticamente na exibição
- Nomes são formatados com regras de Title Case
- CNPJ e telefone são formatados para melhor legibilidade
- Dados continuam sendo salvos sem formatação no banco

## Arquivos Modificados

### 1. `/src/utils/formatters.ts`
Adicionadas novas funções:
- `formatCompanyName()` - Formata nomes de empresas com siglas
- `formatCNPJInput()` - Formata CNPJ durante digitação
- `formatPhone()` - Atualizada para suportar formatação progressiva
- `unformatCNPJ()` - Remove formatação de CNPJ
- `unformatPhone()` - Remove formatação de telefone

### 2. `/src/components/Carriers/CarrierForm.tsx`
Alterações implementadas:
- Importação das funções de formatação
- Novos handlers: `handleCNPJChange`, `handlePhoneChange`, `handleCompanyNameChange`
- Integração com `handleConsultarCNPJ` para formatar dados da Receita Federal
- useEffect para formatar dados em modo edição
- Remoção de formatação antes de salvar no banco

## Estrutura de Dados

**Exibição no Formulário:**
```javascript
{
  razaoSocial: "Transportadora Exemplo LTDA",
  fantasia: "Exemplo Transportes ME",
  cnpj: "12.345.678/0001-95",
  phone: "(11) 98765-4321"
}
```

**Salvamento no Banco de Dados:**
```javascript
{
  razao_social: "Transportadora Exemplo LTDA",
  fantasia: "Exemplo Transportes ME",
  cnpj: "12345678000195",
  phone: "11987654321"
}
```

## Benefícios

1. **Experiência do Usuário**
   - Feedback visual imediato durante digitação
   - Dados sempre apresentados de forma consistente
   - Redução de erros de digitação

2. **Consistência de Dados**
   - Padronização automática de nomes
   - Siglas sempre em maiúsculo
   - Formato único para CNPJ e telefone

3. **Manutenibilidade**
   - Funções centralizadas e reutilizáveis
   - Fácil aplicação em outros formulários
   - Código limpo e bem documentado

4. **Integração Perfeita**
   - Funciona em modo criação e edição
   - Compatível com importação da Receita Federal
   - Não afeta dados já existentes no banco

## Casos de Teste Validados

### Nomes com Siglas
✅ "TRANSPORTADORA ABC LTDA" → "Transportadora Abc LTDA"
✅ "João Silva ME" → "João Silva ME"
✅ "Empresa XYZ S/A" → "Empresa Xyz S/A"
✅ "Transportes Silva e Santos EIRELI" → "Transportes Silva e Santos EIRELI"

### CNPJ
✅ "12345678000195" → "12.345.678/0001-95"
✅ Digitação progressiva com formatação em tempo real
✅ Limitação a 18 caracteres (14 números + 4 separadores)

### Telefone
✅ "11987654321" → "(11) 98765-4321" (Celular)
✅ "1134567890" → "(11) 3456-7890" (Fixo)
✅ Digitação progressiva com formatação em tempo real
✅ Limitação a 15 caracteres para celular

## Próximos Passos Sugeridos

1. Aplicar mesmas formatações em outros formulários (Parceiros de Negócios, etc.)
2. Adicionar validação de CNPJ (dígitos verificadores)
3. Adicionar máscaras visuais opcionais para outros campos
4. Criar testes automatizados para as funções de formatação
