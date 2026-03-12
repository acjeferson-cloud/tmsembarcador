/*
  # Add nome_fantasia to SaaS Organizations

  1. Mudanças
    - Adiciona a coluna `nome_fantasia` (text) à tabela `saas_organizations`.
    - Atualiza os registros existentes para usar o `nome` como `nome_fantasia` inicialmente.
*/

ALTER TABLE saas_organizations ADD COLUMN IF NOT EXISTS nome_fantasia text;

UPDATE saas_organizations SET nome_fantasia = nome WHERE nome_fantasia IS NULL;
