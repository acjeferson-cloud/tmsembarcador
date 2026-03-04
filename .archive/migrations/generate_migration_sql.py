#!/usr/bin/env python3
"""
Script para gerar arquivo SQL completo de migração da organização Demonstração
"""

import os
import sys

# Configuração
ORG_ID = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
OUTPUT_FILE = '/tmp/cc-agent/62470871/project/cloudsql_complete_migration_demonstracao.sql'

# Cabeçalho do arquivo SQL
HEADER = """-- =====================================================================
-- Migração Completa de Dados da Organização "Demonstração"
-- do Supabase para Google Cloud SQL
-- =====================================================================
-- Data de geração: 2026-02-17
-- Organização: Demonstração (ID: 8b007dd0-0db6-4288-a1c1-7b05ffb7b32e)
--
-- ATENÇÃO:
-- - Execute este script EM UM BANCO DE DADOS VAZIO
-- - Faça backup antes de executar
-- - Valide os dados após a migração
-- - Tempo estimado de execução: 2-5 minutos
-- =====================================================================

-- Configurações de sessão para otimizar a importação
SET session_replication_role = 'replica';
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
BEGIN;
SET work_mem = '256MB';
SET maintenance_work_mem = '512MB';

"""

FOOTER = """
COMMIT;
SET session_replication_role = 'origin';

-- =====================================================================
-- QUERIES DE VALIDAÇÃO PÓS-MIGRAÇÃO
-- =====================================================================

-- Validar contagens de registros
SELECT 'Validação de Migração - Demonstração' as titulo;

SELECT
  'saas_plans' as tabela,
  COUNT(*) as registros_esperados,
  (SELECT COUNT(*) FROM saas_plans) as registros_atuais
FROM (VALUES (4)) v(c)
UNION ALL
SELECT
  'organizations',
  1,
  (SELECT COUNT(*) FROM organizations WHERE id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e')
UNION ALL
SELECT
  'environments',
  2,
  (SELECT COUNT(*) FROM environments WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e')
UNION ALL
SELECT
  'users',
  13,
  (SELECT COUNT(*) FROM users WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e')
UNION ALL
SELECT
  'establishments',
  4,
  (SELECT COUNT(*) FROM establishments WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e')
UNION ALL
SELECT
  'business_partners',
  14,
  (SELECT COUNT(*) FROM business_partners WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e')
UNION ALL
SELECT
  'carriers',
  12,
  (SELECT COUNT(*) FROM carriers WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e')
ORDER BY tabela;

-- =====================================================================
-- FIM DO ARQUIVO DE MIGRAÇÃO
-- =====================================================================
"""

def main():
    print(f"Gerando arquivo SQL de migração...")
    print(f"Organização: Demonstração ({ORG_ID})")
    print(f"Arquivo de saída: {OUTPUT_FILE}")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(HEADER)
        f.write("\n-- Nota: Os dados serão extraídos do Supabase via queries SQL\n")
        f.write("-- Este é um template base para a migração\n\n")
        f.write(FOOTER)

    print(f"\n✓ Arquivo base gerado em: {OUTPUT_FILE}")
    print(f"\nPróximos passos:")
    print(f"1. Executar queries de extração no Supabase")
    print(f"2. Adicionar INSERTs ao arquivo gerado")
    print(f"3. Validar integridade dos dados")

if __name__ == '__main__':
    main()
