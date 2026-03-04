# Testes de Formatação - Transportadores

## Como Testar

Acesse o cadastro de transportadores e teste os seguintes casos:

---

## 1. Teste de Razão Social

### Digite diferentes padrões e observe a formatação automática:

| Digite | Resultado Esperado |
|--------|-------------------|
| `transportadora exemplo ltda` | `Transportadora Exemplo LTDA` |
| `JOSÉ DA SILVA TRANSPORTES ME` | `José da Silva Transportes ME` |
| `abc logistics sa` | `Abc Logistics SA` |
| `EMPRESA DE TRANSPORTES BETA EIRELI` | `Empresa de Transportes Beta EIRELI` |
| `transportes silva e santos` | `Transportes Silva e Santos` |

**Comportamento:** A formatação deve ocorrer enquanto você digita.

---

## 2. Teste de Nome Fantasia

### Digite diferentes padrões:

| Digite | Resultado Esperado |
|--------|-------------------|
| `RAPIDÃO TRANSPORTES` | `Rapidão Transportes` |
| `expresso ltda` | `Expresso LTDA` |
| `abc express` | `Abc Express` |
| `TRANSPORTES DO SUL` | `Transportes do Sul` |

**Comportamento:** A formatação deve ocorrer enquanto você digita.

---

## 3. Teste de CNPJ

### Digite apenas números e observe a formatação:

| Digite | Formatação Progressiva | Resultado Final |
|--------|----------------------|----------------|
| `12` | `12` | - |
| `123` | `12.3` | - |
| `12345` | `12.345` | - |
| `12345678` | `12.345.678` | - |
| `123456789` | `12.345.678/9` | - |
| `12345678901` | `12.345.678/9012` | - |
| `1234567890123` | `12.345.678/9012-3` | - |
| `12345678901234` | `12.345.678/9012-34` | `12.345.678/9012-34` |

**Comportamento:**
- Formatação ocorre durante digitação
- Aceita no máximo 18 caracteres (14 dígitos + 4 separadores)
- Se colar com formatação, mantém apenas números

---

## 4. Teste de Telefone

### Celular (11 dígitos):

| Digite | Formatação Progressiva | Resultado Final |
|--------|----------------------|----------------|
| `11` | `11` | - |
| `119` | `(11) 9` | - |
| `1198765` | `(11) 98765` | - |
| `119876543` | `(11) 98765-43` | - |
| `11987654321` | `(11) 98765-4321` | `(11) 98765-4321` |

### Fixo (10 dígitos):

| Digite | Formatação Progressiva | Resultado Final |
|--------|----------------------|----------------|
| `11` | `11` | - |
| `113` | `(11) 3` | - |
| `1134567` | `(11) 3456-7` | - |
| `1134567890` | `(11) 3456-7890` | `(11) 3456-7890` |

**Comportamento:**
- Formatação automática baseada na quantidade de dígitos
- Celular: 11 dígitos → `(XX) XXXXX-XXXX`
- Fixo: 10 dígitos → `(XX) XXXX-XXXX`
- Aceita no máximo 15 caracteres

---

## 5. Teste de Consulta CNPJ (Receita Federal)

### Passos:
1. Digite um CNPJ válido (ex: `00.000.000/0001-91`)
2. Clique no botão de busca (🔍)
3. Observe que todos os campos são preenchidos E formatados automaticamente:
   - Razão Social: formatada com Title Case
   - Nome Fantasia: formatada com Title Case
   - CNPJ: formatado com pontos e barra
   - Telefone: formatado com parênteses

---

## 6. Teste de Modo Edição

### Passos:
1. Cadastre um transportador com dados SEM formatação:
   - Razão Social: `TESTE TRANSPORTES LTDA`
   - CNPJ: `12345678000195`
   - Telefone: `11987654321`
2. Salve o transportador
3. Clique para editar
4. Observe que os dados são exibidos formatados:
   - Razão Social: `Teste Transportes LTDA`
   - CNPJ: `12.345.678/0001-95`
   - Telefone: `(11) 98765-4321`
5. Salve novamente
6. Verifique no banco que os dados continuam sem formatação:
   - CNPJ: `12345678000195` (apenas números)
   - Telefone: `11987654321` (apenas números)

---

## 7. Casos Especiais

### Teste com Siglas Conhecidas:

| Digite | Resultado Esperado |
|--------|-------------------|
| `empresa teste ltda` | `Empresa Teste LTDA` |
| `empresa teste me` | `Empresa Teste ME` |
| `empresa teste epp` | `Empresa Teste EPP` |
| `empresa teste mei` | `Empresa Teste MEI` |
| `empresa teste eireli` | `Empresa Teste EIRELI` |
| `empresa teste sa` | `Empresa Teste SA` |
| `empresa teste s/a` | `Empresa Teste S/A` |
| `empresa teste cia` | `Empresa Teste CIA` |

### Teste com Preposições:

| Digite | Resultado Esperado |
|--------|-------------------|
| `transportes de são paulo` | `Transportes de São Paulo` |
| `empresa do norte` | `Empresa do Norte` |
| `serviços da região` | `Serviços da Região` |
| `transporte para todos` | `Transporte para Todos` |

### Teste com Nomes Compostos:

| Digite | Resultado Esperado |
|--------|-------------------|
| `JOSÉ DA SILVA E MARIA DOS SANTOS` | `José da Silva e Maria dos Santos` |
| `joão pedro transportes` | `João Pedro Transportes` |

---

## 8. Teste de Performance

### Passos:
1. Digite rapidamente sem pausas em cada campo
2. A formatação deve acompanhar sem atrasos
3. Não deve haver travamentos ou lag
4. O cursor deve permanecer na posição correta

---

## 9. Verificação no Banco de Dados

Após salvar, verifique que os dados estão corretos:

```sql
-- Verificar dados salvos
SELECT
  razao_social,
  fantasia,
  cnpj,
  phone
FROM carriers
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado Esperado:**
- Nomes: Com formatação (Title Case e siglas)
- CNPJ: Apenas números (sem pontos, barra ou hífen)
- Telefone: Apenas números (sem parênteses ou hífen)

---

## Critérios de Sucesso

✅ Formatação ocorre em tempo real durante digitação
✅ Siglas permanecem em MAIÚSCULO
✅ Preposições permanecem em minúsculo
✅ CNPJ e telefone são formatados progressivamente
✅ Dados são salvos sem formatação no banco
✅ Modo edição exibe dados formatados
✅ Consulta CNPJ retorna dados formatados
✅ Sem travamentos ou lentidão

---

## Problemas Conhecidos

Nenhum problema conhecido até o momento.

---

## Relatório de Bugs

Se encontrar algum problema, documente:
1. O que você digitou
2. O que esperava ver
3. O que realmente aconteceu
4. Screenshot se possível
