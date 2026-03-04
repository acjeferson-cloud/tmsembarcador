/*
  # Corrigir tipos de endereço de parceiros de negócios

  1. Mudanças
    - Remove o constraint antigo que permite apenas 'billing', 'shipping', 'both'
    - Adiciona novo constraint que permite 'billing', 'shipping', 'commercial', 'delivery', 'correspondence', 'both'
  
  2. Motivo
    - O formulário estava enviando valores diferentes dos aceitos pelo banco
    - Isso causava erro de constraint violation ao salvar endereços
  
  3. Tipos de endereço suportados
    - billing: Endereço de cobrança
    - shipping: Endereço de entrega
    - commercial: Endereço comercial/sede
    - delivery: Endereço de entrega alternativo
    - correspondence: Endereço para correspondência
    - both: Serve para cobrança e entrega
*/

-- Remove o constraint antigo
ALTER TABLE business_partner_addresses
DROP CONSTRAINT IF EXISTS business_partner_addresses_address_type_check;

-- Adiciona o novo constraint com os tipos corretos
ALTER TABLE business_partner_addresses
ADD CONSTRAINT business_partner_addresses_address_type_check
CHECK (address_type IN ('billing', 'shipping', 'commercial', 'delivery', 'correspondence', 'both'));