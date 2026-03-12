/*
  # Correção da Chave Estrangeira de Itens Restritos

  1. Problema Identificado
    - A tabela freight_rate_restricted_items foi criada com freight_rate_id referenciando freight_rates.
    - No entanto, a UI de Itens Restritos pertence à Tabela de Frete inteira (freight_rate_tables),
      o que causa erro de foreign key ao salvar, pois o Frontend envia o ID da Tabela.

  2. Solução Implementada
    - Limpar possíveis dados corrompidos (nenhum item foi salvo devido ao erro)
    - Remover constraint FK antiga (freight_rate_restricted_items_rate_fkey)
    - Renomear coluna freight_rate_id para freight_rate_table_id
    - Adicionar constraint FK nova referenciando freight_rate_tables
    - Renomear índice para consistência
*/

-- Limpar a tabela antes de alterar a chave primária
DELETE FROM public.freight_rate_restricted_items;

-- Remover a foreign key constraint antiga
ALTER TABLE public.freight_rate_restricted_items
  DROP CONSTRAINT freight_rate_restricted_items_rate_fkey;

-- Renomear a coluna
ALTER TABLE public.freight_rate_restricted_items
  RENAME COLUMN freight_rate_id TO freight_rate_table_id;

-- Adicionar a nova referência
ALTER TABLE public.freight_rate_restricted_items
  ADD CONSTRAINT freight_rate_restricted_items_table_fkey 
    FOREIGN KEY (freight_rate_table_id) 
    REFERENCES public.freight_rate_tables(id) 
    ON DELETE CASCADE;

-- Renomear índices, caso existam
ALTER INDEX IF EXISTS idx_freight_rate_restricted_items_rate RENAME TO idx_freight_rate_restricted_items_table;
