/*
  # Inserir Histórico de Ocorrências - Dados Padrão

  1. Objetivo
    - Inserir 66 tipos de ocorrências padrão do sistema de transporte
    - Dados usados para rastreamento e controle de entregas
    - Cada ocorrência tem código único (001-099) e descrição

  2. Estrutura dos Dados
    - Códigos de 001 a 099
    - Descrições detalhadas de cada tipo de ocorrência
    - Tipos permitidos: coleta, transporte, entrega, geral
    - Configurações padrão:
      - impacta_prazo: true para ocorrências que atrasam entregas
      - notifica_cliente: true para notificar automaticamente
      - ativo: true (todas habilitadas)

  3. Categorias e Mapeamento de Tipos
    - Entregas realizadas: tipo 'entrega'
    - Recusas/Problemas: tipo 'geral'
    - Problemas em trânsito: tipo 'transporte'
    - Problemas na coleta: tipo 'coleta'

  4. Segurança
    - INSERT com ON CONFLICT DO UPDATE para atualizar dados existentes
    - organization_id e environment_id NULL = dados globais do sistema
*/

-- Inserir dados com os tipos corretos conforme constraint
INSERT INTO occurrences (
  organization_id,
  environment_id,
  codigo,
  descricao,
  tipo,
  impacta_prazo,
  dias_impacto,
  notifica_cliente,
  ativo,
  created_at,
  updated_at
) VALUES
  -- Entregas (001-002)
  (NULL, NULL, '001', 'Entrega Realizada Normalmente', 'entrega', false, 0, true, true, now(), now()),
  (NULL, NULL, '002', 'Entrega Fora da Data Programada', 'entrega', true, 1, true, true, now(), now()),
  
  -- Recusas Administrativas (003-004, 011, 017, 036, 050-051)
  (NULL, NULL, '003', 'Recusa por Falta de Pedido de Compra', 'geral', true, 2, true, true, now(), now()),
  (NULL, NULL, '004', 'Recusa por Pedido de Compra Cancelado', 'geral', true, 2, true, true, now(), now()),
  (NULL, NULL, '011', 'Cliente Destino somente Recebe com Frete Pago', 'geral', true, 1, true, true, now(), now()),
  (NULL, NULL, '017', 'Pedido de Compras em Duplicidade', 'geral', true, 1, true, true, now(), now()),
  (NULL, NULL, '036', 'Pedido de Compra Incompleto', 'geral', true, 2, true, true, now(), now()),
  (NULL, NULL, '050', 'Cliente Destino não Recebe Pedido Parcial', 'geral', true, 2, true, true, now(), now()),
  (NULL, NULL, '051', 'Cliente Destino não Recebe Pedido Fracionado', 'geral', true, 2, true, true, now(), now()),
  
  -- Problemas Físicos/Logísticos (005-008, 013-014, 021-022, 040-041, 052-056)
  (NULL, NULL, '005', 'Falta de Espaço Físico no Depósito do Cliente Destino', 'entrega', true, 2, true, true, now(), now()),
  (NULL, NULL, '006', 'Falta de Espaço Físico no Depósito do Cliente', 'entrega', true, 2, true, true, now(), now()),
  (NULL, NULL, '007', 'Endereço do Cliente Destino Incompleto ou Incorreto', 'entrega', true, 1, true, true, now(), now()),
  (NULL, NULL, '008', 'Veículo Não Autorizado pelo Cliente', 'entrega', true, 1, true, true, now(), now()),
  (NULL, NULL, '013', 'Redespacho não Indicado', 'transporte', true, 2, true, true, now(), now()),
  (NULL, NULL, '014', 'Transportadora não Atende a Cidade do Cliente Destino', 'transporte', true, 3, true, true, now(), now()),
  (NULL, NULL, '021', 'Entrega Prejudicada por Horário/Falta de Tempo Hábil', 'entrega', true, 1, true, true, now(), now()),
  (NULL, NULL, '022', 'Cliente Estabelecimento Fechado', 'entrega', true, 1, true, true, now(), now()),
  (NULL, NULL, '040', 'Cliente Destino Encerrou Atividades', 'entrega', true, 5, true, true, now(), now()),
  (NULL, NULL, '041', 'Responsável de Recebimento não Localizado', 'entrega', true, 1, true, true, now(), now()),
  (NULL, NULL, '052', 'Redespacho somente com Frete Pago', 'transporte', true, 2, true, true, now(), now()),
  (NULL, NULL, '053', 'Funcionário não autorizado para Receber Mercadorias', 'entrega', true, 1, true, true, now(), now()),
  (NULL, NULL, '054', 'Mercadoria Embarcada para Rota Indevida', 'transporte', true, 2, true, true, now(), now()),
  (NULL, NULL, '055', 'Estrada/Entrada de Acesso Interditada', 'transporte', true, 2, true, true, now(), now()),
  (NULL, NULL, '056', 'Cliente Destino Mudou de Endereço', 'entrega', true, 2, true, true, now(), now()),
  
  -- Problemas com Mercadoria (009-010, 012, 015-016, 018-019, 033, 035, 037, 057-060)
  (NULL, NULL, '009', 'Cliente Recusou em Desacordo com Pedido de Compra', 'entrega', true, 2, true, true, now(), now()),
  (NULL, NULL, '010', 'Mercadoria em Desacordo com o Pedido de Compra', 'entrega', true, 2, true, true, now(), now()),
  (NULL, NULL, '012', 'Recusa por Deficiência Embalagem Mercadoria', 'entrega', true, 2, true, true, now(), now()),
  (NULL, NULL, '015', 'Mercadoria Sinistrada', 'transporte', true, 5, true, true, now(), now()),
  (NULL, NULL, '016', 'Embalagem Sinistrada', 'transporte', true, 3, true, true, now(), now()),
  (NULL, NULL, '018', 'Mercadoria fora da Embalagem Adequada', 'entrega', true, 2, true, true, now(), now()),
  (NULL, NULL, '019', 'Mercadorias Trocadas', 'geral', true, 2, true, true, now(), now()),
  (NULL, NULL, '033', 'Falta com Busca/Reconferência', 'geral', true, 1, true, true, now(), now()),
  (NULL, NULL, '035', 'Quantidade de Produto em Desacordo (Nota Fiscal e/ou Pedido)', 'entrega', true, 2, true, true, now(), now()),
  (NULL, NULL, '037', 'Nota Fiscal com Produtos de Setores Diferentes', 'geral', true, 1, true, true, now(), now()),
  (NULL, NULL, '057', 'Avaria Total', 'transporte', true, 5, true, true, now(), now()),
  (NULL, NULL, '058', 'Avaria Parcial', 'transporte', true, 3, true, true, now(), now()),
  (NULL, NULL, '059', 'Extravio Total', 'transporte', true, 7, true, true, now(), now()),
  (NULL, NULL, '060', 'Extravio Parcial', 'transporte', true, 5, true, true, now(), now()),
  
  -- Problemas Documentais (027, 030, 048-049, 061-064)
  (NULL, NULL, '027', 'Nota Fiscal Retida ou Apreendida pela Fiscalização', 'geral', true, 5, true, true, now(), now()),
  (NULL, NULL, '030', 'Problema com a Documentação (Nota Fiscal / CRTC)', 'geral', true, 2, true, true, now(), now()),
  (NULL, NULL, '048', 'Inutilização Tributária', 'geral', true, 3, true, true, now(), now()),
  (NULL, NULL, '049', 'Sistema Fora do Ar', 'geral', true, 1, true, true, now(), now()),
  (NULL, NULL, '061', 'Sobra de Mercadoria sem Nota Fiscal', 'geral', true, 3, true, true, now(), now()),
  (NULL, NULL, '062', 'Mercadoria em poder da SUFRAMA para Internação', 'geral', true, 5, true, true, now(), now()),
  (NULL, NULL, '063', 'Mercadoria Retirada para Conferência', 'geral', true, 1, true, true, now(), now()),
  (NULL, NULL, '064', 'Apreensão Fiscal', 'geral', true, 7, true, true, now(), now()),
  
  -- Problemas Externos/Especiais (023, 028, 031, 034, 038, 042-043, 044, 047, 065-066)
  (NULL, NULL, '023', 'Cliente em Condição de Greve', 'entrega', true, 3, true, true, now(), now()),
  (NULL, NULL, '028', 'Roubo de Carga', 'transporte', true, 10, true, true, now(), now()),
  (NULL, NULL, '031', 'Cliente Fechado para Balanço', 'entrega', true, 1, true, true, now(), now()),
  (NULL, NULL, '034', 'Cliente Fechado para Balanço', 'entrega', true, 1, true, true, now(), now()),
  (NULL, NULL, '038', 'Feriado Local/Nacional', 'geral', true, 1, true, true, now(), now()),
  (NULL, NULL, '042', 'Cliente Destino em Greve', 'entrega', true, 3, true, true, now(), now()),
  (NULL, NULL, '043', 'Greve nacional (geral)', 'geral', true, 5, true, true, now(), now()),
  (NULL, NULL, '044', 'Entrar em Contato com o Comprador', 'geral', true, 1, true, true, now(), now()),
  (NULL, NULL, '047', 'Data de Entrega Diferente do Pedido', 'entrega', true, 1, true, true, now(), now()),
  (NULL, NULL, '065', 'Excesso de Carga/Peso', 'coleta', true, 2, true, true, now(), now()),
  (NULL, NULL, '066', 'Entrega Programada', 'entrega', false, 0, true, true, now(), now()),
  
  -- Outras Ocorrências (020, 024-026, 029, 032, 039, 045-046, 091, 099)
  (NULL, NULL, '020', 'Retentativa Solicitada pelo Cliente', 'entrega', true, 1, true, true, now(), now()),
  (NULL, NULL, '024', 'Extravio de Mercadoria em Trânsito', 'transporte', true, 7, true, true, now(), now()),
  (NULL, NULL, '025', 'Mercadoria Reentregue com Autorização', 'entrega', false, 0, true, true, now(), now()),
  (NULL, NULL, '026', 'Mercadoria Devolvida com Autorização de Retorno', 'geral', false, 0, true, true, now(), now()),
  (NULL, NULL, '029', 'Mercadoria Retida até a Segunda Ordem', 'geral', true, 3, true, true, now(), now()),
  (NULL, NULL, '032', 'Falta com Solicitação de Reposição', 'geral', true, 2, true, true, now(), now()),
  (NULL, NULL, '039', 'Escolta de Veículos', 'transporte', true, 1, true, true, now(), now()),
  (NULL, NULL, '045', 'Troca não Disponível', 'geral', true, 2, true, true, now(), now()),
  (NULL, NULL, '046', 'Fins Estatísticos', 'geral', false, 0, false, true, now(), now()),
  (NULL, NULL, '091', 'Problemas Físicos', 'geral', true, 1, true, true, now(), now()),
  (NULL, NULL, '099', 'Outros tipos de ocorrências não especificadas acima', 'geral', false, 0, true, true, now(), now())
ON CONFLICT (organization_id, environment_id, codigo) 
DO UPDATE SET
  descricao = EXCLUDED.descricao,
  tipo = EXCLUDED.tipo,
  impacta_prazo = EXCLUDED.impacta_prazo,
  dias_impacto = EXCLUDED.dias_impacto,
  notifica_cliente = EXCLUDED.notifica_cliente,
  updated_at = now();
