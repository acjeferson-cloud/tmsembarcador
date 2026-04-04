-- Mudar o campo CPF para aceitar valores nulos (nullable)
ALTER TABLE users ALTER COLUMN cpf DROP NOT NULL;

COMMENT ON COLUMN users.cpf IS 'CPF do usuário. Opcional, mas se preenchido deve ser válido e pode ser útil para futuras emissões fiscais e assinaturas.';
