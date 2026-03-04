/*
  # Corrigir Segurança das Funções RPC

  1. Mudanças
    - Define SECURITY DEFINER para permitir execução por usuários anônimos
    - Garante que as funções de autenticação possam ser chamadas antes do login
*/

-- Permitir que as funções sejam executadas por usuários anônimos
ALTER FUNCTION validate_user_credentials_only(text, text) SECURITY DEFINER;
ALTER FUNCTION tms_login_with_environment(text, uuid) SECURITY DEFINER;
ALTER FUNCTION get_user_available_environments(text) SECURITY DEFINER;

-- Adicionar comentários explicativos
COMMENT ON FUNCTION validate_user_credentials_only(text, text) IS 
'Valida credenciais de usuário sem fazer login completo. Usa SECURITY DEFINER para permitir chamadas anônimas.';

COMMENT ON FUNCTION tms_login_with_environment(text, uuid) IS 
'Faz login em um environment específico após validação de credenciais. Usa SECURITY DEFINER para permitir chamadas anônimas.';

COMMENT ON FUNCTION get_user_available_environments(text) IS 
'Lista todos os environments disponíveis para um email. Usa SECURITY DEFINER para permitir chamadas anônimas.';
