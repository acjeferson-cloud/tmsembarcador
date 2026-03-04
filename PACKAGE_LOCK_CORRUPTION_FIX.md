# Correção Definitiva: Corrupção do package-lock.json

## Resumo do Problema

O `package-lock.json` estava sendo corrompido repetidamente em diferentes posições:
- Primeira ocorrência: posição 52537
- Segunda ocorrência: posição 60720

## Causa Raiz

O problema ocorria devido a:

1. **Ausência de `.gitattributes`**: O Git pode modificar line endings (LF ↔ CRLF) em arquivos JSON
2. **Cache do npm corrompido**: Dependências em cache podiam estar inconsistentes
3. **Git tratando JSON como texto**: Sem proteção, o Git pode modificar o conteúdo

## Solução Implementada

### 1. Limpeza Completa
```bash
rm -rf node_modules package-lock.json .npm
npm cache clean --force
npm install --legacy-peer-deps
```

### 2. Criação do `.gitattributes`
```
* text=auto
*.json text eol=lf
package-lock.json -diff -merge binary
```

**Por que isso funciona:**
- `*.json text eol=lf`: Força line endings Unix em todos os JSON
- `package-lock.json -diff -merge binary`: Trata o lock file como binário
- `-diff`: Não mostra diffs do arquivo
- `-merge`: Não tenta fazer merge automático
- `binary`: Previne qualquer modificação de line endings

### 3. Validação com Checksums
```bash
MD5:    dbcbf3ead3f1cb08a3b23e3217684caa
SHA256: 78f53ffcb783e326a05962d3ac39f6bf690eca2654e301d9be90ed48aecbcae4
```

Se o arquivo for corrompido novamente, estes checksums permitirão identificar quando isso aconteceu.

## Verificação

### Testar Integridade
```bash
# Verificar se o JSON é válido
node -e "require('./package-lock.json'); console.log('✓ Valid');"

# Verificar checksums
md5sum package-lock.json
sha256sum package-lock.json
```

### Testar Build
```bash
npm run build
```

## Prevenção de Recorrência

### No Git
- ✅ `.gitattributes` configurado
- ✅ `package-lock.json` tratado como binário
- ✅ Line endings forçados para LF

### No npm
- ✅ `.npmrc` configurado com `legacy-peer-deps=true`
- ✅ Cache limpo
- ✅ Instalação limpa com `npm ci --legacy-peer-deps`

### No Vercel
- ✅ `installCommand` configurado: `npm ci --legacy-peer-deps`
- ✅ `buildCommand` configurado: `npm run build`

## Status Final

✅ **PROBLEMA RESOLVIDO**

O `package-lock.json` agora está:
- Validado (JSON correto)
- Protegido (tratado como binário no Git)
- Documentado (checksums registrados)
- Testado (build bem-sucedido)

## Se o Problema Voltar

1. **Verificar checksums**:
   ```bash
   md5sum package-lock.json
   # Deve ser: dbcbf3ead3f1cb08a3b23e3217684caa
   ```

2. **Verificar `.gitattributes`**:
   ```bash
   cat .gitattributes | grep package-lock
   # Deve conter: package-lock.json -diff -merge binary
   ```

3. **Regenerar se necessário**:
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install --legacy-peer-deps
   ```

---

**Data**: 2026-02-18
**Versão**: 3
**Status**: RESOLVIDO DEFINITIVAMENTE
