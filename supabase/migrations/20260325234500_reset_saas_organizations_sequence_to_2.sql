-- Redefine a sequência dos códigos das organizações para iniciar em 2
-- Útil para testes onde registros anteriores (1-4) foram deletados

ALTER SEQUENCE saas_organizations_codigo_seq RESTART WITH 2;
