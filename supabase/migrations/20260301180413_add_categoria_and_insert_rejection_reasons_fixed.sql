/*
  # Adicionar coluna categoria e inserir motivos de rejeição

  1. Alteração na Estrutura
    - Adicionar coluna 'categoria' na tabela rejection_reasons
    - Tipo: text (nullable para manter compatibilidade)

  2. Dados a Inserir
    - 46 motivos de rejeição categorizados
    - Códigos de 001 a 046
    - 6 categorias principais

  3. Tipos Permitidos (constraint)
    - fatura: problemas relacionados a faturamento
    - cte: problemas com CT-e
    - coleta: problemas na coleta
    - entrega: problemas na entrega
    - geral: outros problemas

  4. Segurança
    - INSERT com ON CONFLICT DO UPDATE
    - organization_id e environment_id NULL = dados globais
*/

-- Adicionar coluna categoria se não existir
ALTER TABLE rejection_reasons
  ADD COLUMN IF NOT EXISTS categoria text;

COMMENT ON COLUMN rejection_reasons.categoria IS 'Categoria do motivo de rejeição para agrupamento e filtros';

-- Inserir dados de motivos de rejeição
INSERT INTO rejection_reasons (
  organization_id,
  environment_id,
  codigo,
  descricao,
  categoria,
  tipo,
  requer_foto,
  requer_assinatura,
  requer_observacao,
  ativo,
  created_at,
  updated_at
) VALUES
  -- Categoria: Inconsistências Cadastrais e Documentais (001-010)
  (NULL, NULL, '001', 'Transportador divergente do contrato homologado', 'Inconsistências Cadastrais e Documentais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '002', 'CT-e emitido com CNPJ incorreto do remetente ou destinatário', 'Inconsistências Cadastrais e Documentais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '003', 'CT-e com tomador divergente do informado no pedido ou contrato', 'Inconsistências Cadastrais e Documentais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '004', 'Tipo de serviço não autorizado (normal, redespacho, subcontratação)', 'Inconsistências Cadastrais e Documentais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '005', 'Classificação fiscal do frete (CFOP) incorreta', 'Inconsistências Cadastrais e Documentais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '006', 'Número do pedido de compra não informado ou inválido', 'Inconsistências Cadastrais e Documentais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '007', 'Duplicidade de CT-e para a mesma nota fiscal', 'Inconsistências Cadastrais e Documentais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '008', 'Número da NF não existente ou não autorizado para embarque', 'Inconsistências Cadastrais e Documentais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '009', 'Fatura sem correspondência com os CT-es entregues', 'Inconsistências Cadastrais e Documentais', 'fatura', false, false, true, true, now(), now()),
  (NULL, NULL, '010', 'Valor do ICMS divergente do parametrizado', 'Inconsistências Cadastrais e Documentais', 'cte', false, false, true, true, now(), now()),
  
  -- Categoria: Inconsistências de Valor (011-019)
  (NULL, NULL, '011', 'Valor do CT-e superior ao previsto em tabela ou simulação', 'Inconsistências de Valor', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '012', 'Diferença no valor de pedágios ou taxas adicionais', 'Inconsistências de Valor', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '013', 'Cobrança indevida de GRIS, TDE, TRT ou taxa de retorno', 'Inconsistências de Valor', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '014', 'Desconto não aplicado conforme política comercial', 'Inconsistências de Valor', 'fatura', false, false, true, true, now(), now()),
  (NULL, NULL, '015', 'Diferença de peso ou cubagem em relação ao pedido original', 'Inconsistências de Valor', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '016', 'Frete mínimo desrespeitado', 'Inconsistências de Valor', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '017', 'Cobrança por redespacho sem justificativa operacional', 'Inconsistências de Valor', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '018', 'Cobrança de taxa de devolução não autorizada', 'Inconsistências de Valor', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '019', 'Cobrança por KM rodado sem validação de rota', 'Inconsistências de Valor', 'cte', false, false, true, true, now(), now()),
  
  -- Categoria: Inconsistências Temporais e Operacionais (020-025)
  (NULL, NULL, '020', 'Data de entrega fora do SLA contratual', 'Inconsistências Temporais e Operacionais', 'entrega', false, false, true, true, now(), now()),
  (NULL, NULL, '021', 'Emissão do CT-e posterior à entrega (sem justificativa)', 'Inconsistências Temporais e Operacionais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '022', 'CT-e emitido antes da coleta física', 'Inconsistências Temporais e Operacionais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '023', 'Fatura gerada antes da conclusão da entrega', 'Inconsistências Temporais e Operacionais', 'fatura', false, false, true, true, now(), now()),
  (NULL, NULL, '024', 'Entrega com ocorrência crítica registrada no EDI', 'Inconsistências Temporais e Operacionais', 'entrega', false, false, true, true, now(), now()),
  (NULL, NULL, '025', 'Entregas com status pendente (não confirmado via EDI)', 'Inconsistências Temporais e Operacionais', 'entrega', false, false, true, true, now(), now()),
  
  -- Categoria: Inconsistências com Integrações e Sistemas (026-031)
  (NULL, NULL, '026', 'EDI com dados faltantes, divergentes ou fora de layout', 'Inconsistências com Integrações e Sistemas', 'geral', false, false, true, true, now(), now()),
  (NULL, NULL, '027', 'Ausência de evento EDI de entrega realizada', 'Inconsistências com Integrações e Sistemas', 'geral', false, false, true, true, now(), now()),
  (NULL, NULL, '028', 'EDI enviado fora do prazo acordado', 'Inconsistências com Integrações e Sistemas', 'geral', false, false, true, true, now(), now()),
  (NULL, NULL, '029', 'XML do CT-e não recebido ou inválido', 'Inconsistências com Integrações e Sistemas', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '030', 'DANFE da fatura inválida ou sem XML vinculado', 'Inconsistências com Integrações e Sistemas', 'fatura', false, false, true, true, now(), now()),
  (NULL, NULL, '031', 'CT-e ou NF sem registro no Portal da SEFAZ', 'Inconsistências com Integrações e Sistemas', 'cte', false, false, true, true, now(), now()),
  
  -- Categoria: Inconsistências Contratuais / Regulatórias (032-038)
  (NULL, NULL, '032', 'Modal de transporte não autorizado para a rota', 'Inconsistências Contratuais / Regulatórias', 'geral', false, false, true, true, now(), now()),
  (NULL, NULL, '033', 'Transportadora sem seguro ou com apólice vencida', 'Inconsistências Contratuais / Regulatórias', 'geral', false, false, true, true, now(), now()),
  (NULL, NULL, '034', 'Transportadora inativa ou com pendências fiscais', 'Inconsistências Contratuais / Regulatórias', 'geral', false, false, true, true, now(), now()),
  (NULL, NULL, '035', 'Rota utilizada não corresponde à rota homologada', 'Inconsistências Contratuais / Regulatórias', 'geral', false, false, true, true, now(), now()),
  (NULL, NULL, '036', 'Regime tributário divergente do contratado (ex: SN vs LP)', 'Inconsistências Contratuais / Regulatórias', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '037', 'Veículo utilizado não autorizado no contrato', 'Inconsistências Contratuais / Regulatórias', 'geral', false, false, true, true, now(), now()),
  (NULL, NULL, '038', 'Motorista não homologado ou com documentação vencida', 'Inconsistências Contratuais / Regulatórias', 'geral', false, false, true, true, now(), now()),
  
  -- Categoria: Outros Motivos Técnicos ou Operacionais (039-046)
  (NULL, NULL, '039', 'Informações obrigatórias ausentes no CT-e', 'Outros Motivos Técnicos ou Operacionais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '040', 'Notas fiscais sem chave de acesso válida', 'Outros Motivos Técnicos ou Operacionais', 'geral', false, false, true, true, now(), now()),
  (NULL, NULL, '041', 'Falta de comprovante de entrega (POD)', 'Outros Motivos Técnicos ou Operacionais', 'entrega', false, false, true, true, now(), now()),
  (NULL, NULL, '042', 'Faturas com CT-es de diferentes centros de custo', 'Outros Motivos Técnicos ou Operacionais', 'fatura', false, false, true, true, now(), now()),
  (NULL, NULL, '043', 'Faturas emitidas fora da janela de corte', 'Outros Motivos Técnicos ou Operacionais', 'fatura', false, false, true, true, now(), now()),
  (NULL, NULL, '044', 'Inconsistência de CFOP entre origem e destino', 'Outros Motivos Técnicos ou Operacionais', 'cte', false, false, true, true, now(), now()),
  (NULL, NULL, '045', 'Tentativa de faturamento de CT-e já rejeitado ou estornado', 'Outros Motivos Técnicos ou Operacionais', 'fatura', false, false, true, true, now(), now()),
  (NULL, NULL, '046', 'Cobrança por serviços não contratados (armazenagem, estadia etc.)', 'Outros Motivos Técnicos ou Operacionais', 'fatura', false, false, true, true, now(), now())
ON CONFLICT (organization_id, environment_id, codigo) 
DO UPDATE SET
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  requer_foto = EXCLUDED.requer_foto,
  requer_assinatura = EXCLUDED.requer_assinatura,
  requer_observacao = EXCLUDED.requer_observacao,
  updated_at = now();

COMMENT ON TABLE rejection_reasons IS 'Motivos padronizados de rejeição de CT-e e faturas. Códigos de 001 a 046 organizados em 6 categorias.';
