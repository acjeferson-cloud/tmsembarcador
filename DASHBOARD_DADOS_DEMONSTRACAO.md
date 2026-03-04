# Dashboard - Dados de Demonstração

## Visão Geral

O Dashboard foi configurado com **dados fictícios realistas** para demonstrações da organização `00000001` (Demonstração).

## KPIs Principais

### 1. Total de Entregas
- **Valor:** 2.847 entregas
- **Descrição:** Total de entregas realizadas no período
- **Ícone:** 📦 Package
- **Cor:** Azul

### 2. Transportadoras Ativas
- **Valor:** 24 transportadoras
- **Descrição:** Número de transportadoras cadastradas e ativas
- **Ícone:** 🚚 Truck
- **Cor:** Verde

### 3. Despesa Mensal em Frete
- **Valor:** R$ 184.750,89
- **Descrição:** Total gasto com frete no período
- **Ícone:** 💰 DollarSign
- **Cor:** Roxo

### 4. Taxa de Entrega
- **Valor:** 96,3%
- **Descrição:** Percentual de entregas bem-sucedidas
- **Ícone:** 📈 TrendingUp
- **Cor:** Laranja

## Gráficos

### 1. Performance Mensal (Gráfico de Barras)

Mostra a evolução de entregas nos últimos 6 meses com **tendência de crescimento**:

```
Janeiro:   1.850 entregas
Fevereiro: 2.120 entregas (+14.5%)
Março:     2.450 entregas (+15.6%)
Abril:     2.680 entregas (+9.4%)
Maio:      2.750 entregas (+2.6%)
Junho:     2.847 entregas (+3.5%)
```

**Crescimento Total:** +53,9% (Jan → Jun)

### 2. Status das Entregas (Gráfico Pizza/Donut)

Distribuição percentual dos status de entregas:

| Status | Percentual | Cor | Descrição |
|--------|-----------|-----|-----------|
| **Entregue** | 68% | 🟢 Verde (#10B981) | Entregas concluídas com sucesso |
| **Em Trânsito** | 22% | 🔵 Azul (#3B82F6) | Cargas em transporte |
| **Aguardando Coleta** | 7% | 🟡 Amarelo (#F59E0B) | Aguardando coleta pela transportadora |
| **Cancelada** | 3% | 🔴 Vermelho (#EF4444) | Entregas canceladas |

**Total:** 100%

## Como Funciona

### Detecção Automática

O Dashboard verifica automaticamente se o usuário está na organização de demonstração:

```typescript
// Verifica se é organização 00000001
const { data: orgData } = await supabase
  .from('organizations')
  .select('slug')
  .eq('id', selectedOrgId)
  .maybeSingle();

if (orgData?.slug === '00000001') {
  // Carrega dados fictícios
  getDemoData();
}
```

### Dados em Tempo Real vs Demonstração

| Organização | Fonte de Dados |
|-------------|---------------|
| `00000001` (Demo) | Dados fictícios pré-configurados |
| Outras organizações | Dados reais do banco (invoices_nfe, ctes_complete, carriers) |

## Características dos Dados Demo

### ✅ Realismo
- Números baseados em operações reais de logística
- Crescimento mensal progressivo e consistente
- Taxa de entrega alta (96,3%) mas não perfeita
- Distribuição de status proporcional à realidade

### ✅ Consistência
- Soma dos percentuais = 100%
- Valores monetários com 2 casas decimais
- Números inteiros para contagens

### ✅ Visualização
- Todos os gráficos preenchidos
- Cores distintas e acessíveis
- Legendas claras e descritivas

## Filtro de Período

O Dashboard possui **Date Range Picker** para selecionar período customizado:

### Validações
- ❌ Não permite datas futuras
- ❌ Período máximo de 90 dias
- ❌ Data inicial deve ser ≤ data final

### Comportamento com Dados Demo
Na organização `00000001`, os dados fictícios são **sempre os mesmos**, independente do período selecionado. Isso garante consistência nas demonstrações.

## Última Atualização

O Dashboard exibe:
- ⏰ Hora da última atualização
- 🔄 Botão para atualizar manualmente

## Logs de Debug

O sistema registra logs no console para facilitar debug:

```javascript
📊 Carregando dados de demonstração...
✅ Organização 00000001 detectada - carregando dados de demonstração
✅ Dados de demonstração carregados: {
  entregas: 2847,
  transportadoras: 24,
  despesa: 'R$ 184.750,89',
  taxaEntrega: '96.3%'
}
```

## Arquivo Modificado

- ✅ `src/components/Dashboard/Dashboard.tsx` - Dados demo aprimorados

## Build Status

- ✅ Build: 1m 45s
- ✅ Sem erros
- ✅ Todos os gráficos funcionais
- ✅ KPIs realistas

## Como Testar

1. **Login:** admin@demo.com / Demo@123
2. **Navegue:** Menu "Dashboard"
3. **Verifique:**
   - 4 KPIs com valores
   - Gráfico de barras (6 meses)
   - Gráfico pizza (4 status)
   - Última atualização
   - Date picker funcional

## Próximos Passos

Se quiser adicionar mais dados de demonstração:

1. **Mais Gráficos:** Adicionar novos gráficos ao Dashboard
2. **Mais Períodos:** Expandir dados para 12 meses
3. **Detalhamento:** Adicionar drill-down nos gráficos
4. **Comparações:** Adicionar comparativo período anterior

---

**DASHBOARD COM DADOS REALISTAS PARA DEMONSTRAÇÃO!** ✅
