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
  status?: string;
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
      if (existing.is_active && existing.status === 'approved') {
        return { success: false, message: 'Este recurso já está ativado e aprovado' };
      }
      if (!existing.is_active && existing.status === 'pending') {
        return { success: false, message: 'A solicitação para este recurso já está em análise' };
      }
      
      const { error: updateError } = await supabase
        .from('user_innovations')
        .update({ is_active: false, status: 'pending', activated_at: new Date().toISOString(), notes } as any)
        .eq('id', existing.id);

      if (updateError) {
        return { success: false, message: `Erro ao solicitar recurso: ${updateError.message}` };
      }
      
      // Enviar notificação por email para o Master Admin
      await sendInnovationRequestEmail(innovationId);
      
      window.dispatchEvent(new Event('innovationsUpdated'));
      return { success: true, message: 'Solicitação enviada com sucesso! Aguarde a aprovação.' };
    }
    
    const { error: insertError } = await (supabase as any).from('user_innovations')
      .insert({
        user_id: userId,
        innovation_id: innovationId,
        organization_id: orgId,
        environment_id: envId,
        establishment_code: estabCode,
        is_active: false,
        status: 'pending',
        notes
      } as any);

    if (insertError) {
      return { success: false, message: `Erro ao solicitar recurso: ${insertError.message}` };
    }
    
    // Enviar notificação por email para o Master Admin
    await sendInnovationRequestEmail(innovationId);
    
    window.dispatchEvent(new Event('innovationsUpdated'));
    return { success: true, message: 'Solicitação enviada com sucesso! Aguarde a aprovação.' };
  } catch (error: any) {
    return { success: false, message: `Erro ao solicitar recurso: ${error?.message || 'Erro Desconhecido'}` };
  }
}

async function sendInnovationRequestEmail(innovationId: string) {
  try {
    const savedUser = localStorage.getItem('tms-user');
    const parsedUser = savedUser ? JSON.parse(savedUser) : {};
    const userEmail = parsedUser.email || '';
    const userName = parsedUser.name || parsedUser.nome || 'Usuário Desconhecido';
    
    const orgName = localStorage.getItem('tms-selected-organization-name') || 'Cliente LogAxis';
    
    const { data: innovationData } = await supabase.from('innovations').select('name').eq('id', innovationId).maybeSingle();
    const innovationName = innovationData?.name || 'Recurso Desconhecido';

    await supabase.functions.invoke('send-innovation-request-email', {
      body: {
        innovationName,
        organizationName: orgName,
        userEmail,
        userName
      }
    });
  } catch (err) {
    console.error('Erro ao enviar email de notificação:', err);
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
      .update({ is_active: false, status: 'rejected' } as any)
      .eq('organization_id', orgId)
      .eq('environment_id', envId)
      .eq('establishment_code', estabCode)
      .eq('innovation_id', innovationId);

    if (error) {
      return { success: false, message: `Erro ao desativar recurso: ${error.message}` };
    }
    window.dispatchEvent(new Event('innovationsUpdated'));
    return { success: true, message: 'Recurso desativado com sucesso!' };
  } catch (error) {
    return { success: false, message: 'Erro ao desativar recurso' };
  }
}

export async function getInnovationStatus(
  userId: number,
  innovationId: string,
  orgId: string,
  envId: string,
  estabCode: string
): Promise<'approved' | 'pending' | 'none'> {
  try {
    const { data, error } = await (supabase as any).from('user_innovations')
      .select('is_active, status')
      .eq('organization_id', orgId)
      .eq('environment_id', envId)
      .eq('establishment_code', estabCode)
      .eq('innovation_id', innovationId)
      .maybeSingle();

    if (error || !data) {
      return 'none';
    }

    if (data.is_active && data.status === 'approved') return 'approved';
    if (!data.is_active && data.status === 'pending') return 'pending';
    
    return 'none';
  } catch (error) {
    return 'none';
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
      .eq('status', 'approved')
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
