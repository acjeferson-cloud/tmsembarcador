/*
  # Adicionar policies de isolamento para organizations

  ## Descrição
  Cria policies de isolamento para a tabela organizations, garantindo que
  usuários só vejam/modifiquem suas próprias organizações.

  ## Mudanças
  1. Adiciona policy de SELECT - usuários veem apenas sua organização
  2. Adiciona policy de INSERT - para criação de novas organizações
  3. Adiciona policy de UPDATE - usuários atualizam apenas sua organização
  4. Adiciona policy de DELETE - usuários deletam apenas sua organização

  ## Segurança
  - Filtra por get_session_organization_id()
  - Previne vazamento de dados entre organizações
*/

-- Policy SELECT: usuários veem apenas sua organização
CREATE POLICY "organizations_isolation_select"
  ON organizations
  FOR SELECT
  TO anon
  USING (id = get_session_organization_id());

-- Policy INSERT: permitir inserção (controlada pela aplicação)
CREATE POLICY "organizations_isolation_insert"
  ON organizations
  FOR INSERT
  TO anon
  WITH CHECK (id = get_session_organization_id());

-- Policy UPDATE: usuários atualizam apenas sua organização
CREATE POLICY "organizations_isolation_update"
  ON organizations
  FOR UPDATE
  TO anon
  USING (id = get_session_organization_id())
  WITH CHECK (id = get_session_organization_id());

-- Policy DELETE: usuários deletam apenas sua organização
CREATE POLICY "organizations_isolation_delete"
  ON organizations
  FOR DELETE
  TO anon
  USING (id = get_session_organization_id());
