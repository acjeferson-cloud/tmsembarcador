/*
  # Desabilitar RLS temporariamente para debug - Versão 2

  1. Mudanças
    - Desabilita RLS em várias tabelas principais para permitir acesso total
    - Remove validações de organization_id e environment_id temporariamente
    
  2. Tabelas afetadas
    - establishments
    - users
    - innovations
    - user_innovations
    - invoices
    - orders
    - bills
    - business_partners
    - carriers
    - pickups
    - countries
    - states
    - cities
    - freight_rates
    - occurrences
    - rejection_reasons
    - reverse_logistics
    - electronic_documents
    - holidays
    
  3. Notas
    - Esta é uma solução TEMPORÁRIA apenas para debug
    - Em produção, as políticas RLS devem ser restauradas
*/

-- Desabilitar RLS apenas em tabelas que existem
ALTER TABLE IF EXISTS establishments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS innovations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_innovations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS business_partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS carriers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pickups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS states DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS freight_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS occurrences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rejection_reasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reverse_logistics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS electronic_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS freight_rate_cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS freight_rate_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ctes_complete DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pickup_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotes DISABLE ROW LEVEL SECURITY;
