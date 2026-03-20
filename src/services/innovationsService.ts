import { supabase } from '../lib/supabase';

export interface Innovation {
  id: string;
  name: string;
  description: string;
  detailed_description?: string;
  monthly_price: string | number;
  icon: string;
  category: string;
  is_active: boolean;
  display_order: number;
  innovation_key?: string;
  created_at: string;
}

interface UserInnovation {
  id: string;
  user_id: number;
  innovation_id: string;
  activated_at: string;
  is_active: boolean;
  notes?: string;
  organization_id?: string;
  environment_id?: string;
  establishment_code?: string;
  innovation?: Innovation;
}


export async function fetchInnovations(): Promise<Innovation[]> {
  try {
    const { data, error } = await (supabase as any).from('innovations')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }
    return data;
  } catch (error) {
    return [];
  }
}

async function fetchUserInnovations(userId: number, orgId: string, envId: string, estabCode: string): Promise<UserInnovation[]> {
  try {
    const { data, error } = await (supabase as any).from('user_innovations')
      .select(`
        *,
        innovation:innovations(*)
      `)
      .eq('organization_id', orgId)
      .eq('environment_id', envId)
      .eq('establishment_code', estabCode)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

export async function activateInnovation(
  userId: number,
  innovationId: string,
  orgId: string,
  envId: string,
  estabCode: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: existing, error: checkError } = await (supabase as any).from('user_innovations')
      .select('*')
      .eq('organization_id', orgId)
      .eq('environment_id', envId)
      .eq('establishment_code', estabCode)
      .eq('innovation_id', innovationId)
      .maybeSingle();

    if (checkError) {
      return { success: false, message: `Erro ao verificar ativação: ${checkError.message || 'Erro desconhecido'}` };
    }
    if (existing) {
      if (existing.is_active) {
        return { success: false, message: 'Este recurso já está ativado' };
      }
      const { error: updateError } = await supabase
        .from('user_innovations')
        .update({ is_active: true, activated_at: new Date().toISOString(), notes } as any)
        .eq('id', existing.id);

      if (updateError) {
        return { success: false, message: `Erro ao reativar recurso: ${updateError.message}` };
      }
      return { success: true, message: 'Recurso reativado com sucesso!' };
    }
    const { error: insertError } = await (supabase as any).from('user_innovations')
      .insert({
        user_id: userId,
        innovation_id: innovationId,
        organization_id: orgId,
        environment_id: envId,
        establishment_code: estabCode,
        is_active: true,
        notes
      } as any);

    if (insertError) {
      return { success: false, message: `Erro ao ativar recurso: ${insertError.message}` };
    }
    return { success: true, message: 'Recurso ativado com sucesso!' };
  } catch (error) {
    return { success: false, message: 'Erro ao ativar recurso' };
  }
}

export async function deactivateInnovation(
  userId: number,
  innovationId: string,
  orgId: string,
  envId: string,
  estabCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await (supabase as any).from('user_innovations')
      .update({ is_active: false } as any)
      .eq('organization_id', orgId)
      .eq('environment_id', envId)
      .eq('establishment_code', estabCode)
      .eq('innovation_id', innovationId);

    if (error) {
      return { success: false, message: `Erro ao desativar recurso: ${error.message}` };
    }
    return { success: true, message: 'Recurso desativado com sucesso!' };
  } catch (error) {
    return { success: false, message: 'Erro ao desativar recurso' };
  }
}

export async function isInnovationActivated(
  userId: number,
  innovationId: string,
  orgId: string,
  envId: string,
  estabCode: string
): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any).from('user_innovations')
      .select('is_active')
      .eq('organization_id', orgId)
      .eq('environment_id', envId)
      .eq('establishment_code', estabCode)
      .eq('innovation_id', innovationId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return false;
    }

    const isActive = !!data;
    return isActive;
  } catch (error) {
    return false;
  }
}

function calculateMonthlyTotal(innovations: UserInnovation[]): number {
  return innovations
    .filter(ui => ui.is_active && ui.innovation)
    .reduce((total, ui) => total + (ui.innovation?.monthly_price || 0), 0);
}
