# Estudo Técnico: Arquitetura de Mapas Híbrida para TMS

Este documento apresenta o estudo técnico e o plano de implementação para a Prova de Conceito (PoC) da funcionalidade de mapas do TMS Embarcador.

## 1. Visão Geral da Arquitetura Híbrida

O objetivo principal desta arquitetura é **zerar ou reduzir drasticamente os custos** associados a APIs de mapas comerciais (como Google Maps ou Mapbox), sem sacrificar a qualidade visual ou a precisão do roteamento logístico.

Para isso, adotamos uma estratégia de **separação de responsabilidades (Decoupling)**:

*   **Front-end (Apresentação Visual):** Utilizaremos a biblioteca open-source `Leaflet` (via `react-leaflet`) em conjunto com os *tiles* (imagens de fundo do mapa) fornecidos gratuitamente pelo OpenStreetMap (OSM) ou provedores gratuitos equivalentes (ex: CartoDB Dark Matter para o modo escuro). O Front-end será responsável apenas por renderizar as camadas visuais, pinos e linhas geométricas.
*   **Back-end (Processamento Logístico):** O cálculo de distâncias, pedágios, tempos de trânsito e o traçado real das rotas (snap-to-road) ocorrerá em um motor de roteirização isolado. Ferramentas como o **OSRM (Open Source Routing Machine)**, **GraphHopper** ou **Valhalla** podem ser hospedadas em um servidor próprio (ou usar APIs de baixo custo). O Back-end calcula a rota e envia para o Front-end apenas a *Polyline* (uma string codificada com as coordenadas do caminho) e os metadados da viagem.

**Vantagens da Abordagem:**
*   **Custo Zero em Visualização:** Nenhuma cobrança por "load de mapa" ou visualização de tela.
*   **Controle Total:** Os dados da operação ficam protegidos e o SLA de roteirização não depende do faturamento com provedores de mapa.
*   **Cache Agressivo:** Rotas frequentes (Matriz -> Cliente X) podem ter a Polyline armazenada no banco de dados do TMS (PostgreSQL), poupando requisições ao motor de rotas.

## 2. Proposta Visual e UI/UX (High-Tech Minimalista)

Para alinhar com a identidade premium e corporativa do TMS, a interface adotará o estilo "Dark Analytics":
*   **Base do Mapa:** *CartoDB Dark Matter* (fundo escuro, rios escuros, rodovias em cinza sutil, sem distrações geográficas desnecessárias).
*   **Matriz (Hub):** Um ícone central com cor de destaque (ex: Azul Neon ou Ciano), representando a origem dos dados/cargas.
*   **Clientes (Spokes):** Pontos circulares sólidos, pequenos e discretos. Sem o clichê de "caminhãozinho" ou "casinha". Foco em pontos de dados.
*   **Conexões (Teia):** Linhas de conexão vetoriais finas com baixa opacidade saindo da Matriz para cada Cliente.

## 3. O Efeito Spiderfy e Clustering

Quando há alta densidade de entregas na mesma região, múltiplos pinos se sobrepõem, gerando poluição visual.
*   **Clustering:** A biblioteca `leaflet.markercluster` agrupará pontos próximos dinamicamente com base no zoom. O cluster será um círculo indicando numericamente a quantidade de paradas naquela área.
*   **Spiderfy:** Ao clicar no cluster numérico no último nível de zoom, ocorrerá o efeito *Spiderfy*: os pinos "explodem" radialmente formando um círculo perfeito. Uma linha reta sutil conectará cada pino expandido ao centro original do cluster.

---

# Plano de Implementação da PoC

A seguir, os passos para materializarmos a Prova de Conceito no repositório atual.

## Proposed Changes

### [Dependências]
Será necessário instalar as seguintes bibliotecas no projeto via `npm`:
- `leaflet`
- `react-leaflet`
- `leaflet.markercluster`
- `react-leaflet-cluster`
- Dependências de tipagem (`@types/leaflet`, `@types/leaflet.markercluster`)

### [Estrutura de Pastas e Componentes]

#### [NEW] `src/components/NetworkMapPoC/NetworkMap.tsx`
O componente principal do mapa React. Irá renderizar o `MapContainer`, a base `TileLayer` (Dark Matter), os marcadores customizados, o `MarkerClusterGroup` e as polylines de conexão (Hub-and-Spoke).

#### [NEW] `src/components/NetworkMapPoC/NetworkMap.css`
Arquivo CSS dedicado para sobrescrever estilos padrão do Leaflet, forçar o estilo minimalista dos clusters, ajustar as linhas radiais do efeito Spiderfy e configurar ícones customizados via CSS/SVG.

#### [NEW] `src/services/mapMockService.ts`
Serviço simulado (mock) que fará o papel do "Back-end de Rotas". Retornará:
1.  Coordenada da Matriz (Hub).
2.  Lista de dezenas de Clientes (Spokes) com coordenadas próximas para forçar o agrupamento (Clustering).
3.  Simulação de Polylines.

#### [MODIFY] `src/App.tsx` (ou arquivo de Roteamento equivalente)
Adição temporária de uma rota (ex: `/map-poc`) ou inserção em um menu de testes para permitir a visualização e validação da PoC de forma isolada.

## User Review Required

> [!IMPORTANT]
> **Aprovação de Bibliotecas:** A PoC exigirá a instalação do ecossistema `react-leaflet`. Você aprova a adição destas dependências ao `package.json` do projeto agora?
> **Ponto de Acesso:** Gostaria que a PoC fosse acessível através de uma nova URL temporária (ex: `/map-poc`) ou que fosse inserida como uma nova aba dentro de alguma tela existente (ex: Torre de Controle)?

## Verification Plan

1.  Instalar as dependências do Leaflet.
2.  Criar os arquivos da PoC conforme o design planejado.
3.  Adicionar uma forma de acessar a tela.
4.  Rodar a aplicação (`npm run dev`) e navegar até a tela da PoC.
5.  Validar se o mapa carrega no modo escuro, se a Matriz está centralizada, se as linhas conectam os clientes e, principalmente, se o efeito numérico e a animação **Spiderfy** estão funcionando ao clicar nos agrupamentos.
