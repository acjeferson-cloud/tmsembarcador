import { getCurrentSessionContext } from '../lib/sessionContext';

/**
 * ID da organization de demonstração (slug: 00000001)
 * Esta é a ÚNICA organization que deve mostrar dados de exemplo/mockados
 */
export const DEMO_ORGANIZATION_ID = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';

/**
 * Verifica se a organization atual é a de demonstração
 * Retorna true apenas para a organization 00000001
 *
 * @returns true se for a organization de demonstração, false caso contrário
 */
export async function isDemoOrganization(): Promise<boolean> {
  try {
    const context = await getCurrentSessionContext();

    if (!context.hasContext || !context.organizationId) {
      return false;
    }

    return context.organizationId === DEMO_ORGANIZATION_ID;
  } catch (error) {

    return false;
  }
}

/**
 * Verifica se a organization atual é de demonstração (versão síncrona)
 * Usa o organizationId passado como parâmetro
 *
 * @param organizationId - ID da organization a verificar
 * @returns true se for a organization de demonstração, false caso contrário
 */
export function isDemoOrganizationSync(organizationId: string | null | undefined): boolean {
  if (!organizationId) {
    return false;
  }

  return organizationId === DEMO_ORGANIZATION_ID;
}

/**
 * Retorna dados mockados apenas se for organization de demonstração
 * Caso contrário, retorna array vazio
 *
 * @param mockData - Dados mockados para demonstração
 * @param organizationId - ID da organization atual
 * @returns mockData se for demo, array vazio caso contrário
 */
export function getMockDataIfDemo<T>(
  mockData: T[],
  organizationId: string | null | undefined
): T[] {
  return isDemoOrganizationSync(organizationId) ? mockData : [];
}
