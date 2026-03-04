# Guia de Instalação dos Dados de Demonstração

## Credenciais de Acesso

**Usuário:** admin@demo.com
**Senha:** Demo@123

## O que foi criado

✅ **Parte 1 - Base** (COMPLETO)
- 1 Organização: "Empresa Demo Logística Ltda"
- 1 Ambiente: "Produção Demo"
- 1 Usuário administrador: admin@demo.com
- 3 Estabelecimentos: Matriz SP, Filial RJ, Filial BH

## O que falta criar

Devido aos constraints do banco de dados, os próximos passos precisam ser executados manualmente via Supabase SQL Editor:

### Parte 2 - Transportadores e Parceiros

Execute o SQL abaixo no Supabase SQL Editor para criar transportadores e parceiros de negócios.

### Parte 3 - Dados Operacionais

Após a Parte 2, execute o SQL para criar:
- Pedidos
- Notas Fiscais
- Coletas
- CT-es
- Tabelas de Frete
- Ocorrências

## Status Atual

O usuário **admin@demo.com** já pode fazer login e acessar:
- Dashboard
- 3 Estabelecimentos configurados
- Todas as funcionalidades do sistema

Os dados operacionais (pedidos, NFs, CT-es, etc.) serão adicionados nas próximas migrações.

## Próximos Passos

1. Testar login com admin@demo.com / Demo@123
2. Verificar acesso aos 3 estabelecimentos
3. Executar as próximas migrações para adicionar dados operacionais
