# Configurar Storage para Logotipos dos Ambientes

O sistema de upload de logotipos está implementado, mas requer a configuração do bucket de storage no Supabase.

## Opção 1: Configuração Manual via Dashboard Supabase

### Passo 1: Acessar o Storage

1. Acesse o Dashboard do Supabase
2. Vá em **Storage** no menu lateral
3. Clique em **"New bucket"**

### Passo 2: Criar o Bucket

Configure o bucket com as seguintes opções:

- **Name:** `environment-logos`
- **Public bucket:** ✅ Sim (marcar checkbox)
- **File size limit:** `5242880` (5MB)
- **Allowed MIME types:** `image/png, image/jpeg, image/jpg, image/svg+xml, image/webp`

### Passo 3: Configurar Políticas de Acesso

Após criar o bucket, adicione as seguintes políticas:

#### Política 1: Leitura Pública (SELECT)

```sql
-- Nome: Public read access
-- Operation: SELECT
-- Target roles: public
-- WITH CHECK expression:
bucket_id = 'environment-logos'
```

#### Política 2: Upload para Autenticados (INSERT)

```sql
-- Nome: Authenticated users can upload
-- Operation: INSERT
-- Target roles: authenticated
-- WITH CHECK expression:
bucket_id = 'environment-logos'
```

#### Política 3: Atualização para Autenticados (UPDATE)

```sql
-- Nome: Authenticated users can update
-- Operation: UPDATE
-- Target roles: authenticated
-- USING expression:
bucket_id = 'environment-logos'
```

#### Política 4: Exclusão para Autenticados (DELETE)

```sql
-- Nome: Authenticated users can delete
-- Operation: DELETE
-- Target roles: authenticated
-- USING expression:
bucket_id = 'environment-logos'
```

---

## Opção 2: Configuração via SQL (Automática)

Execute este SQL no Supabase SQL Editor:

```sql
-- Criar bucket environment-logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'environment-logos',
  'environment-logos',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];

-- Criar política de leitura pública
CREATE POLICY IF NOT EXISTS "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'environment-logos');

-- Criar política de upload para autenticados
CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'environment-logos');

-- Criar política de atualização para autenticados
CREATE POLICY IF NOT EXISTS "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'environment-logos');

-- Criar política de exclusão para autenticados
CREATE POLICY IF NOT EXISTS "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'environment-logos');
```

---

## Verificar Configuração

### Teste 1: Verificar se o bucket existe

```sql
SELECT * FROM storage.buckets WHERE id = 'environment-logos';
```

Deve retornar:
- id: environment-logos
- public: true
- file_size_limit: 5242880

### Teste 2: Verificar políticas

```sql
SELECT * FROM storage.policies WHERE bucket_id = 'environment-logos';
```

Deve retornar 4 políticas (SELECT, INSERT, UPDATE, DELETE)

---

## Como Usar Após Configuração

1. Acesse o SaaS Admin Console (`/SaasAdminConsole`)
2. Vá em **Ambientes**
3. Selecione uma organização
4. No card do ambiente, clique em **"Upload"** na seção "Logotipo do Ambiente"
5. Selecione uma imagem (PNG, JPG, SVG ou WebP, máx 5MB)
6. O upload será processado e o logotipo aparecerá no card

---

## Estrutura de Pastas no Storage

Os logotipos serão salvos com a seguinte estrutura:

```
environment-logos/
└── logos/
    ├── {environment-id-1}-{timestamp}.png
    ├── {environment-id-2}-{timestamp}.jpg
    └── {environment-id-3}-{timestamp}.svg
```

Exemplo:
```
environment-logos/logos/123e4567-e89b-12d3-a456-426614174000-1709057234567.png
```

---

## Troubleshooting

### Erro: "Bucket not found"

**Solução:** O bucket ainda não foi criado. Execute a Opção 2 (SQL) ou crie manualmente.

### Erro: "Permission denied"

**Solução:** As políticas de acesso não foram configuradas. Verifique se as 4 políticas existem.

### Erro: "File too large"

**Solução:** O arquivo excede 5MB. Comprima a imagem antes de fazer upload.

### Erro: "Invalid file type"

**Solução:** Use apenas PNG, JPG, JPEG, SVG ou WebP.

---

## URLs Públicas dos Logotipos

Após o upload, a URL pública seguirá o padrão:

```
https://[seu-projeto].supabase.co/storage/v1/object/public/environment-logos/logos/[arquivo].png
```

Esta URL é armazenada automaticamente no campo `logo_url` da tabela `saas_environments`.

---

## Segurança

- ✅ Leitura pública permite exibir logotipos sem autenticação
- ✅ Upload/alteração/exclusão apenas para usuários autenticados
- ✅ Limite de 5MB previne uploads excessivos
- ✅ Tipos MIME restritos a imagens válidas
- ✅ Nomes únicos com timestamp previnem colisões

---

## Próximos Passos

Após configurar o storage:

1. Teste o upload de logotipo em cada ambiente
2. Verifique se as imagens aparecem corretamente nos cards
3. Integre o logotipo no header principal da aplicação
4. Use o logotipo em relatórios PDF e emails

---

**Nota:** Esta configuração precisa ser feita apenas uma vez. Depois disso, o sistema de upload estará totalmente funcional para todos os ambientes de todas as organizações.
