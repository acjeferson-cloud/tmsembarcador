import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface CTe {
  id?: string;
  establishment_id?: string;
  carrier_id?: string;
  freight_type: string;
  number: string;
  series?: string;
  access_key?: string;
  issue_date?: string;
  entry_date?: string;
  origin: string;
  integration_date?: string;
  status: string;
  freight_weight_value: number;
  freight_value_value: number;
  seccat_value: number;
  dispatch_value: number;
  ademe_gris_value: number;
  itr_value: number;
  tas_value: number;
  collection_delivery_value: number;
  other_tax_value: number;
  toll_value: number;
  icms_rate: number;
  icms_base: number;
  icms_value: number;
  pis_value: number;
  cofins_value: number;
  other_value: number;
  total_value: number;
  cargo_weight?: number;
  cargo_value?: number;
  cargo_volume?: number;
  cargo_m3?: number;
  cargo_weight_cubed?: number;
  cargo_weight_for_calculation?: number;
  cubing_factor?: number;
  freight_rate_table_id?: string;
  sender_name?: string;
  sender_document?: string;
  sender_city?: string;
  sender_state?: string;
  recipient_name?: string;
  recipient_document?: string;
  recipient_city?: string;
  recipient_state?: string;
  shipper_name?: string;
  shipper_document?: string;
  receiver_name?: string;
  receiver_document?: string;
  payer_name?: string;
  payer_document?: string;
  xml_data?: any;
  observations?: string;
  organization_id?: string;
  environment_id?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CTeInvoice {
  id?: string;
  cte_id: string;
  establishment_code?: string;
  invoice_type: string;
  series?: string;
  number?: string;
  cost_value: number;
  observations?: string;
}

export interface CTeCarrierCost {
  id?: string;
  cte_id: string;
  carrier_id?: string;
  cost_type: string;
  cost_value: number;
}

export interface CTeWithRelations extends CTe {
  invoices?: CTeInvoice[];
  carrier_costs?: CTeCarrierCost[];
  carrier?: {
    id: string;
    codigo: string;
    razao_social: string;
  };
  establishment?: {
    id: string;
    codigo: string;
    razao_social: string;
  };
}

export const ctesCompleteService = {
  async getAll(): Promise<CTeWithRelations[]> {
    try {


      // Buscar os CT-es priorizados (o contexto é configurado automaticamente)

      const { data: prioritizedData, error: rpcError } = await supabase.rpc('get_ctes_prioritized');

      if (rpcError) {

        throw rpcError;
      }



      if (!prioritizedData || prioritizedData.length === 0) {

        return [];
      }

      // Extrair IDs dos CT-es priorizados
      const cteIds = prioritizedData.map((cte: any) => cte.id);


      // Buscar os CT-es completos com relacionamentos, na mesma ordem
      const { data, error } = await supabase
        .from('ctes_complete')
        .select(`
          *,
          invoices:ctes_invoices(*),
          carrier_costs:ctes_carrier_costs(*),
          carrier:carriers(id, codigo, razao_social),
          establishment:establishments(id, codigo, razao_social)
        `)
        .in('id', cteIds);

      if (error) {

        throw error;
      }



      // Ordenar os dados conforme a ordem priorizada
      const orderedData = cteIds.map(id =>
        data?.find((cte: any) => cte.id === id)
      ).filter(Boolean);


      return orderedData || [];
    } catch (error) {


      // Re-lançar o erro para que possa ser exibido na UI
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Erro ao buscar CT-es');
    }
  },

  async getById(id: string): Promise<CTeWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from('ctes_complete')
        .select(`
          *,
          invoices:ctes_invoices(*),
          carrier_costs:ctes_carrier_costs(*),
          carrier:carriers(id, codigo, razao_social),
          establishment:establishments(id, codigo, razao_social)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {

      return null;
    }
  },

  async searchByNumberOrKey(searchTerm: string): Promise<CTeWithRelations[]> {
    try {
      // Limpar o termo de busca
      const cleanTerm = searchTerm.trim().toUpperCase().replace(/\s+/g, '');

      const { data, error } = await supabase
        .from('ctes_complete')
        .select(`
          *,
          invoices:ctes_invoices(*),
          carrier_costs:ctes_carrier_costs(*),
          carrier:carriers(id, codigo, razao_social),
          establishment:establishments(id, codigo, razao_social)
        `)
        .or(`number.ilike.%${cleanTerm}%,access_key.ilike.%${cleanTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {

        throw error;
      }

      return data || [];
    } catch (error) {

      return [];
    }
  },

  async findByAccessKey(accessKey: string): Promise<CTeWithRelations | null> {
    try {
      if (!accessKey?.trim()) return null;

      // Limpar a chave: remover espaços e converter para maiúsculas
      const cleanKey = accessKey.trim().toUpperCase().replace(/\s+/g, '');

      // Buscar usando ilike para case-insensitive
      const { data, error } = await supabase
        .from('ctes_complete')
        .select(`
          *,
          invoices:ctes_invoices(*),
          carrier_costs:ctes_carrier_costs(*),
          carrier:carriers(id, codigo, razao_social),
          establishment:establishments(id, codigo, razao_social)
        `)
        .ilike('access_key', cleanKey)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {

      return null;
    }
  },

  async create(cte: CTe): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Obter contexto do tenant (organization_id e environment_id)
      const tenantContext = await TenantContextHelper.getCurrentContext();
      if (!tenantContext || !tenantContext.organizationId || !tenantContext.environmentId) {
        throw new Error('Contexto de organização/ambiente não encontrado');
      }

      const { organizationId, environmentId } = tenantContext;

      // Limpar e normalizar a chave de acesso antes de salvar
      let cleanAccessKey = null;
      if (cte.access_key?.trim()) {
        cleanAccessKey = cte.access_key.trim().toUpperCase().replace(/\s+/g, '');
      }

      // Verificar se já existe CT-e com esta chave de acesso
      if (cleanAccessKey) {
        const existingCTe = await this.findByAccessKey(cleanAccessKey);
        if (existingCTe) {
          const carrierName = existingCTe.carrier?.razao_social || 'N/A';
          const establishmentCode = existingCTe.establishment?.codigo || 'N/A';
          const establishmentName = existingCTe.establishment?.razao_social || 'N/A';
          const issueDate = existingCTe.issue_date
            ? new Date(existingCTe.issue_date).toLocaleDateString('pt-BR')
            : 'N/A';
          const cteNumber = existingCTe.number || 'N/A';
          const series = existingCTe.series || '0';

          return {
            success: false,
            error: `CT-e DUPLICADO! Este CT-e já foi importado anteriormente.\n\nDados do CT-e existente:\n• Número: ${cteNumber} / Série: ${series}\n• Transportador: ${carrierName}\n• Estabelecimento: ${establishmentCode} - ${establishmentName}\n• Data Emissão: ${issueDate}\n\nUse a BUSCA na tela de CT-es (digite o número ${cteNumber} ou a chave de acesso) para localizar o registro existente.\n\nChave de Acesso: ${cleanAccessKey.substring(0, 10)}...${cleanAccessKey.substring(cleanAccessKey.length - 10)}`
          };
        }
      }

      // Converter campos vazios para NULL para evitar conflitos de constraint UNIQUE
      const cleanedCte = {
        ...cte,
        organization_id: organizationId,
        environment_id: environmentId,
        access_key: cleanAccessKey,
        series: cte.series?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ctes_complete')
        .insert(cleanedCte)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('access_key')) {
            const accessKey = cte.access_key?.trim();
            const keyDisplay = accessKey
              ? `\n\nChave: ${accessKey.substring(0, 10)}...${accessKey.substring(accessKey.length - 10)}`
              : '';
            return {
              success: false,
              error: `CT-e duplicado! Já existe um CT-e com esta chave de acesso.${keyDisplay}\n\nVerifique a lista de CT-es ou use a busca para encontrar o registro existente.`
            };
          }
          return {
            success: false,
            error: 'CT-e duplicado! Já existe um CT-e com estes dados.'
          };
        }
        return { success: false, error: error.message };
      }

      // XML já está salvo em xml_data do CT-e
      if (cte.xml_data && cte.xml_data.original) {

      }

      // CÁLCULO AUTOMÁTICO: Executar cálculo de custos após importação
      if (data && data.id) {
        try {
          // Importar dinamicamente para evitar dependência circular
          const { freightCostCalculator } = await import('./freightCostCalculator');

          // Buscar o CT-e completo com todas as relações
          const fullCTe = await this.getById(data.id);

          if (fullCTe) {


            const calculation = await freightCostCalculator.calculateCTeCost(fullCTe);
            await freightCostCalculator.saveCostsToCTe(data.id, calculation);


          }
        } catch (calcError: any) {
          // Não falhar a importação se o cálculo der erro


        }
      }

      return { success: true, id: data.id };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async update(id: string, cte: Partial<CTe>): Promise<{ success: boolean; error?: string }> {
    try {
      // Converter campos vazios para NULL para evitar conflitos de constraint UNIQUE
      const cleanedCte: any = {
        ...cte,
        updated_at: new Date().toISOString()
      };

      // Limpar e normalizar a chave de acesso se fornecida
      if ('access_key' in cte) {
        if (cte.access_key?.trim()) {
          cleanedCte.access_key = cte.access_key.trim().toUpperCase().replace(/\s+/g, '');
        } else {
          cleanedCte.access_key = null;
        }
      }
      if ('series' in cte) {
        cleanedCte.series = cte.series?.trim() || null;
      }

      const { error } = await supabase
        .from('ctes_complete')
        .update(cleanedCte)
        .eq('id', id);

      if (error) {
        if (error.code === '23505' && error.message.includes('access_key')) {
          const accessKey = cte.access_key?.trim();
          const keyDisplay = accessKey
            ? `\n\nChave: ${accessKey.substring(0, 10)}...${accessKey.substring(accessKey.length - 10)}`
            : '';
          return {
            success: false,
            error: `CT-e duplicado! Já existe um CT-e com esta chave de acesso.${keyDisplay}\n\nVerifique a lista de CT-es ou use a busca para encontrar o registro existente.`
          };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ctes_complete')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async addInvoice(invoice: CTeInvoice): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ctes_invoices')
        .insert(invoice);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async removeInvoice(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ctes_invoices')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async addCarrierCost(cost: CTeCarrierCost): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ctes_carrier_costs')
        .insert(cost);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async removeCarrierCost(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ctes_carrier_costs')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }
};
