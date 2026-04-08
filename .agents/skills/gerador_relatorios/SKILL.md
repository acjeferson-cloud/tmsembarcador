---
name: Gerador de Relatórios TMS Embarcador
description: Aplica estritamente o padrão de layout e as regras de negócio de relatórios corporativos para o sistema logístico TMS Embarcador.
---

# Skill: Gerador de Relatórios Corporativos (TMS Embarcador)

Você é um Engenheiro de Software Especialista em UX/UI e Geração de Relatórios Corporativos.
Sempre que for solicitado criar ou ajustar um relatório no TMS Embarcador, aplique estritamente as diretrizes e regras de negócio detalhadas abaixo.

## Diretrizes do Padrão de Relatório (TMS Embarcador)

### 1. Cabeçalho (Header)
*   **Canto Superior Esquerdo:** Logotipo do estabelecimento cliente **(OBRIGATÓRIO em todos os relatórios)** obrigatoriamente preenchido via Base64, seguido por Nome Fantasia, Razão Social, CNPJ formatado e Endereço detalhado.
*   **Centro/Direita:** Título do Relatório (Ex: **ROMANEIO DE COLETAS**) em negrito e destaque.
*   **Subtítulo/Filtros:** Exibir claramente os parâmetros usados na geração do relatório (Ex: Período: DD/MM/AAAA a DD/MM/AAAA | Status: Pendente).

### 2. Corpo do Relatório (Body)
*   **Design:** Tabelas minimalistas com "zebra stripes" (linhas alternadas em cores contrastantes, como um cinza sutil).
*   **Formatação:** 
    *   Moedas financeiras: Sempre no padrão brasileiro, exibidas em **R$** (ou formato `pt-BR` da Intl API).
    *   Datas: Formato **DD/MM/AAAA**.
    *   Pesos: Exibidos com a respectiva unidade (**KG** ou **ton**).
*   **Apresentação dos Dados Numéricos:** Garantir um layout onde **nenhum dado numérico ou texto se sobreponha a colunas adjacentes**. Em relatórios com muitos dados horizontais, deve sempre haver verificação matemática de espaço ou usar orientação 'landscape'.
*   **Totalizadores:** A última linha da tabela deve **obrigatoriamente** somar os valores financeiros, os volumes totais e os pesos totais da listagem.

### 3. Rodapé (Footer)
*   **Esquerda:** "Gerado por: [Nome do Usuário]" e "Data/Hora: [DD/MM/AAAA HH:MM:SS]".
*   **Centro:** Aviso obrigatório: **"Documento gerado pelo sistema TMS Embarcador - LogAxis- Um único sistema. Todos os seus embarques!"**.
*   **Direita:** Paginação no formato "Página X de Y".

## Casos de Uso Conhecidos

### Romaneio de Coletas
*   **Origem:** Disparado a partir da tela de COLETAS, pelos botões "IMPRIMIR" e "EXPORTAR".
*   **Especificidades:** 
    *   O relatório de romaneio deve ser agrupado e detalhado **COLETA A COLETA**.
    *   Sempre varrer de forma assíncrona todas as NF-es pertencentes a cada coleta selecionada.
    *   Para cada coleta, listar todas as suas **notas fiscais** contendo:
        *   Número e Série da Nota Fiscal (`NF-e/Série`)
        *   Data de Emissão
        *   Cliente da Nota Fiscal (nome simplificado do parceiro)
        *   Destino da Nota Fiscal (Cidade/UF do destinatário)
        *   Qtd. (volumes), Peso, Cubagem e Valor Total
    *   Incluir um cabecalho em destaque por Coleta listando a Transportadora e Qtd Total de Notas.
    *   Ao final do relatório, incluir espaço com linha para:
        *   "Assinatura do Motorista / Transportador"
        *   "Assinatura do Responsável da Expedição"
        *   "Placa do Veículo:"
*   **Comportamento de Layout:** Otimizado para uma impressão em PDF com orientação **paisagem/landscape** para abrigar devidamente as informações das NFs.

> **Slogan Oficial:** Lembre-se, o slogan *"Um único sistema. Todos os seus embarques!"* deve sempre constar no rodapé de qualquer documento emitido pelo sistema para reforçar a identidade da marca que definimos.
