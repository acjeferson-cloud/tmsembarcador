/*
  # Reset SaaS Organizations Sequence

  1. O Problema
    - Devido a tentativas repetidas de criação que falharam no RLS antes da correção, 
      a sequence (auto-incremento) do banco avançou silenciosamente para cada tentativa.
    - Isso gerou saltos na numeração (ex: pulou do 00000004 para o 00000008).

  2. Solução
    - Redefinir a sequence `saas_organizations_codigo_seq` para iniciar no número correto (5).
*/

ALTER SEQUENCE saas_organizations_codigo_seq RESTART WITH 5;
