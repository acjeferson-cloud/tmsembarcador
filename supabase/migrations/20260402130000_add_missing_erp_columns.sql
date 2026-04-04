-- Adicionando colunas de mapeamento contábil e de integração que podem estar faltando
ALTER TABLE erp_integration_config 
ADD COLUMN IF NOT EXISTS erp_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS service_layer_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS port VARCHAR(50),
ADD COLUMN IF NOT EXISTS database VARCHAR(100),
ADD COLUMN IF NOT EXISTS cte_integration_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS cte_model VARCHAR(50),
ADD COLUMN IF NOT EXISTS invoice_model VARCHAR(50),
ADD COLUMN IF NOT EXISTS billing_nfe_item VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_usage VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_control_account VARCHAR(255),
ADD COLUMN IF NOT EXISTS outbound_nf_item VARCHAR(255),
ADD COLUMN IF NOT EXISTS cte_without_nf_item VARCHAR(255),
ADD COLUMN IF NOT EXISTS cte_usage VARCHAR(255),
ADD COLUMN IF NOT EXISTS inbound_nf_control_account VARCHAR(255),
ADD COLUMN IF NOT EXISTS invoice_transitory_account VARCHAR(255),
ADD COLUMN IF NOT EXISTS nfe_xml_network_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS fiscal_module VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_by BIGINT,
ADD COLUMN IF NOT EXISTS updated_by BIGINT;

-- Forçar o reload do schema cache do PostgREST para a API reconhecer imediatamente as novas colunas
NOTIFY pgrst, 'reload schema';
