# Workaround: package-lock.json Corruption Issue

## Problema Recorrente

O `package-lock.json` está sendo corrompido repetidamente durante o processo de Git commit/push:
- Tentativa 1: posição 52537
- Tentativa 2: posição 60720
- Tentativa 3: posição 195429

## Causa Raiz Provável

O problema parece estar relacionado ao processo de Git LFS, Git hooks, ou alguma transformação que o Vercel está fazendo durante o upload.

## Solução Definitiva: Usar .vercelignore

### Opção 1: Não Commitar o package-lock.json (RECOMENDADO)

Adicionar ao `.gitignore`:
```
package-lock.json
```

E configurar o Vercel para regenerá-lo:
```json
{
  "installCommand": "npm install --legacy-peer-deps && npm ci --legacy-peer-deps"
}
```

### Opção 2: Usar npm-shrinkwrap.json

O `npm-shrinkwrap.json` é idêntico ao `package-lock.json` mas tem prioridade e é mais estável:

```bash
# Converter
npm shrinkwrap

# Commitar
git add npm-shrinkwrap.json
git commit -m "chore: use npm-shrinkwrap.json instead of package-lock.json"

# Atualizar .gitignore
echo "package-lock.json" >> .gitignore
```

### Opção 3: Usar package.json sem lock file

Remover completamente o lock file e deixar o Vercel instalar as versões mais recentes:

```json
{
  "installCommand": "npm install --legacy-peer-deps --no-package-lock"
}
```

**ATENÇÃO**: Isso pode causar inconsistências entre builds.

## Proteções Já Implementadas

✅ `.gitattributes` configurado para tratar o arquivo como binário
✅ `.npmrc` configurado com `legacy-peer-deps=true`
✅ `vercel.json` configurado com `npm ci --legacy-peer-deps`
✅ Cache do npm limpo múltiplas vezes
✅ Arquivo validado localmente (JSON correto)

## Status Atual

O arquivo está **VÁLIDO LOCALMENTE**:
```
✓ Valid JSON
✓ Size: 190KB
✓ Packages: 412
✓ Build: SUCCESS
✓ MD5: dbcbf3ead3f1cb08a3b23e3217684caa
```

O problema ocorre **APENAS DURANTE O UPLOAD PARA O VERCEL**.

## Próximos Passos Recomendados

### 1. Tentar Deploy Sem Lock File

Remover o package-lock.json do Git:
```bash
git rm --cached package-lock.json
echo "package-lock.json" >> .gitignore
git add .gitignore
git commit -m "chore: ignore package-lock.json"
git push
```

Atualizar `vercel.json`:
```json
{
  "installCommand": "rm -f package-lock.json && npm install --legacy-peer-deps"
}
```

### 2. Usar npm-shrinkwrap.json

```bash
npm shrinkwrap
git add npm-shrinkwrap.json
git rm --cached package-lock.json
git commit -m "chore: switch to npm-shrinkwrap.json"
git push
```

### 3. Contatar Suporte do Vercel

Se nenhuma das opções acima funcionar, o problema pode estar no pipeline do Vercel. Fornecer:
- Link deste documento
- Logs de erro
- Confirmação de que o arquivo é válido localmente
- Checksums: `dbcbf3ead3f1cb08a3b23e3217684caa`

## Referências

- [npm shrinkwrap docs](https://docs.npmjs.com/cli/v9/commands/npm-shrinkwrap)
- [Vercel Build Configuration](https://vercel.com/docs/build-step)
- [Git LFS](https://git-lfs.github.com/)

---

**Última atualização**: 2026-02-18
**Tentativas**: 4
**Status**: Investigando alternativas
