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
  created_at: string;
}

interface UserInnovation {
  id: string;
  user_id: number;
  innovation_id: string;
  activated_at: string;
  is_active: boolean;
  notes?: string;
  innovation?: Innovation;
}


export async function fetchInnovations(): Promise<Innovation[]> {
  try {
    console.log('🔍 Fetching innovations from Supabase...');
    console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

    const { data, error } = await supabase
      .from('innovations')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('❌ Error fetching innovations:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No data returned from Supabase');
      return [];
    }

    console.log('✅ Innovations fetched successfully:', data.length, 'items');
    console.log('📦 Data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in fetchInnovations:', error);
    return [];
  }
}

async function fetchUserInnovations(userId: number): Promise<UserInnovation[]> {
  try {
    const { data, error } = await supabase
      .from('user_innovations')
      .select(`
        *,
        innovation:innovations(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching user innovations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchUserInnovations:', error);
    return [];
  }
}

export async function activateInnovation(
  userId: number,
  innovationId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 Activating innovation:', { userId, innovationId });

    const { data: existing, error: checkError } = await supabase
      .from('user_innovations')
      .select('*')
      .eq('user_id', userId)
      .eq('innovation_id', innovationId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing activation:', checkError);
      console.error('Error details:', JSON.stringify(checkError, null, 2));
      return { success: false, message: `Erro ao verificar ativação: ${checkError.message || 'Erro desconhecido'}` };
    }

    console.log('✅ Check complete. Existing activation:', existing);

    if (existing) {
      if (existing.is_active) {
        console.log('ℹ️ Innovation already active');
        return { success: false, message: 'Este recurso já está ativado' };
      }

      console.log('🔄 Reactivating existing innovation...');
      const { error: updateError } = await supabase
        .from('user_innovations')
        .update({ is_active: true, activated_at: new Date().toISOString(), notes })
        .eq('id', existing.id);

      if (updateError) {
        console.error('❌ Error reactivating innovation:', updateError);
        return { success: false, message: `Erro ao reativar recurso: ${updateError.message}` };
      }

      console.log('✅ Innovation reactivated successfully');
      return { success: true, message: 'Recurso reativado com sucesso!' };
    }

    console.log('🔄 Creating new innovation activation...');
    const { error: insertError } = await supabase
      .from('user_innovations')
      .insert({
        user_id: userId,
        innovation_id: innovationId,
        is_active: true,
        notes
      });

    if (insertError) {
      console.error('❌ Error activating innovation:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      return { success: false, message: `Erro ao ativar recurso: ${insertError.message}` };
    }

    console.log('✅ Innovation activated successfully');
    return { success: true, message: 'Recurso ativado com sucesso!' };
  } catch (error) {
    console.error('Error in activateInnovation:', error);
    return { success: false, message: 'Erro ao ativar recurso' };
  }
}

export async function deactivateInnovation(
  userId: number,
  innovationId: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 Deactivating innovation:', { userId, innovationId });

    const { error } = await supabase
      .from('user_innovations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('innovation_id', innovationId);

    if (error) {
      console.error('❌ Error deactivating innovation:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { success: false, message: `Erro ao desativar recurso: ${error.message}` };
    }

    console.log('✅ Innovation deactivated successfully');
    return { success: true, message: 'Recurso desativado com sucesso!' };
  } catch (error) {
    console.error('❌ Error in deactivateInnovation:', error);
    return { success: false, message: 'Erro ao desativar recurso' };
  }
}

export async function isInnovationActivated(
  userId: number,
  innovationId: string
): Promise<boolean> {
  try {
    console.log('🔍 isInnovationActivated: Checking', { userId, innovationId });

    const { data, error } = await supabase
      .from('user_innovations')
      .select('is_active')
      .eq('user_id', userId)
      .eq('innovation_id', innovationId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('❌ isInnovationActivated: Error checking innovation status:', error);
      return false;
    }

    const isActive = !!data;
    console.log('✅ isInnovationActivated: Result:', { userId, innovationId, isActive, data });

    return isActive;
  } catch (error) {
    console.error('❌ isInnovationActivated: Exception:', error);
    return false;
  }
}

function calculateMonthlyTotal(innovations: UserInnovation[]): number {
  return innovations
    .filter(ui => ui.is_active && ui.innovation)
    .reduce((total, ui) => total + (ui.innovation?.monthly_price || 0), 0);
}
