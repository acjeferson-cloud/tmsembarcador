import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';


// Lista de campos válidos da tabela freight_rates
const VALID_FREIGHT_RATE_FIELDS = [
  'freight_rate_table_id', 'codigo', 'descricao', 'tipo_aplicacao', 'prazo_entrega',
  'valor', 'data_inicio', 'observacoes', 'pedagio_minimo', 'pedagio_por_kg', 'pedagio_a_cada_kg',
  'pedagio_tipo_kg', 'icms_embutido_tabela', 'aliquota_icms', 'fator_m3',
  'fator_m3_apartir_kg', 'fator_m3_apartir_m3', 'fator_m3_apartir_valor',
  'percentual_gris', 'gris_minimo', 'seccat', 'despacho', 'itr', 'taxa_adicional',
  'coleta_entrega', 'tde_trt', 'tas', 'taxa_suframa', 'valor_outros_percent',
  'valor_outros_minimo', 'taxa_outros_valor', 'taxa_outros_tipo_valor',
  'taxa_apartir_de', 'taxa_apartir_de_tipo', 'taxa_outros_a_cada',
  'taxa_outros_minima', 'frete_peso_minimo', 'frete_valor_minimo',
  'frete_tonelada_minima', 'frete_percentual_minimo', 'frete_m3_minimo',
  'valor_total_minimo'
];

// Função auxiliar para filtrar apenas campos válidos
const filterValidFields = (data: any, fields: string[]): any => {
  const filtered: any = {};
  fields.forEach(field => {
    if (data[field] !== undefined) {
      filtered[field] = data[field];
    }
  });
  return filtered;
};

export interface FreightRateTable {
  id: string;
  nome: string;
  transportador_id: string;
  transportador_nome?: string;
  data_inicio: string;
  data_fim: string;
  status: 'ativo' | 'inativo';
  table_type?: 'Entrada' | 'Saída';
  modal?: 'rodoviario' | 'aereo' | 'aquaviario' | 'ferroviario';
  tarifas?: FreightRate[];
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface FreightRateDetail {
  id?: string;
  freight_rate_id: string;
  ordem: number;
  peso_ate: number;
  m3_ate: number;
  volume_ate: number;
  valor_ate: number;
  valor_faixa: number;
  tipo_calculo: string;
  tipo_frete: string;
  frete_valor: number;
  frete_minimo: number;
  tipo_taxa: string;
  taxa_minima: number;
}

export interface FreightRate {
  id: string;
  freight_rate_table_id: string;
  codigo: string;
  descricao: string;
  tipo_aplicacao: 'cidade' | 'cliente' | 'produto';
  prazo_entrega: number;
  valor: number;
  data_inicio: string;
  observacoes?: string;

  // Campos de pedágio
  pedagio_minimo?: number;
  pedagio_por_kg?: number;
  pedagio_a_cada_kg?: number;
  pedagio_tipo_kg?: string;

  // Campos de ICMS
  icms_embutido_tabela?: string;
  aliquota_icms?: number;

  // Campos de fator m³
  fator_m3?: number;
  fator_m3_apartir_kg?: number;
  fator_m3_apartir_m3?: number;
  fator_m3_apartir_valor?: number;

  // Campos de taxas
  percentual_gris?: number;
  gris_minimo?: number;
  seccat?: number;
  despacho?: number;
  itr?: number;
  taxa_adicional?: number;
  coleta_entrega?: number;
  tde_trt?: number;
  tas?: number;
  taxa_suframa?: number;
  valor_outros_percent?: number;
  valor_outros_minimo?: number;
  taxa_outros_valor?: number;
  taxa_outros_tipo_valor?: string;
  taxa_apartir_de?: number;
  taxa_apartir_de_tipo?: string;
  taxa_outros_a_cada?: number;
  taxa_outros_minima?: number;

  // Campos de frete mínimo
  frete_peso_minimo?: number;
  frete_valor_minimo?: number;
  frete_tonelada_minima?: number;
  frete_percentual_minimo?: number;
  frete_m3_minimo?: number;
  valor_total_minimo?: number;

  // Detalhes/faixas
  detalhes?: FreightRateDetail[];

  created_at?: string;
  updated_at?: string;
}

// Função auxiliar para formatar percentual_gris com 5 casas decimais
const formatRateData = (rateData: any): any => {
  const formatted = { ...rateData };
  if (formatted.percentual_gris !== undefined && formatted.percentual_gris !== null) {
    formatted.percentual_gris = Number(formatted.percentual_gris).toFixed(5);
  }
  return formatted;
};

export const freightRatesService = {
  async getTablesByCarrier(carrierId: string): Promise<FreightRateTable[]> {

    const { data, error } = await supabase
      .from('freight_rate_tables')
      .select(`
        *,
        carriers!transportador_id (
          nome_fantasia
        )
      `)
      .eq('transportador_id', carrierId)
      .order('created_at', { ascending: false });

    if (error) {

      throw error;
    }


    const tablesWithRates = await Promise.all(
      (data || []).map(async (table: any) => {
        const rates = await this.getRatesByTable(table.id);
        return {
          ...table,
          transportador_nome: table.carriers?.nome_fantasia,
          tarifas: rates
        };
      })
    );


    return tablesWithRates;
  },

  async getAllTables(): Promise<FreightRateTable[]> {

    const { data, error } = await supabase
      .from('freight_rate_tables')
      .select(`
        *,
        carriers!transportador_id (
          nome_fantasia
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {

      throw error;
    }



    const tablesWithRates = await Promise.all(
      (data || []).map(async (table: any) => {
        const rates = await this.getRatesByTable(table.id);
        return {
          ...table,
          transportador_nome: table.carriers?.nome_fantasia,
          tarifas: rates
        };
      })
    );


    return tablesWithRates;
  },

  async getTableById(id: string): Promise<FreightRateTable | null> {
    const { data, error } = await supabase
      .from('freight_rate_tables')
      .select(`
        *,
        carriers!transportador_id (
          nome_fantasia
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const rates = await this.getRatesByTable(id);
    return {
      ...data,
      transportador_nome: (data as any).carriers?.nome_fantasia,
      tarifas: rates
    };
  },

  async createTable(table: Omit<FreightRateTable, 'id'>): Promise<FreightRateTable> {




    // PASSO 1: VERIFICAR AUTENTICAÇÃO DO USUÁRIO


    const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId || !ctx.environmentId) {
        throw new Error('Sessão inválida ou contexto não selecionado.');
      }
      const userData = {
        organization_id: ctx.organizationId,
        environment_id: ctx.environmentId,
        establishment_id: ctx.establishmentId || null
      };


    // PASSO 2: VALIDAR DADOS DE ORGANIZAÇÃO


    if (!userData.organization_id || !userData.environment_id) {

      throw new Error('Dados de organização incompletos. Contate o suporte.');
    }



    // PASSO 3: PREPARAR DADOS PARA INSERT


    const { tarifas, ...tableData } = table;

    // Limpar campos vazios
    const cleanedTableData = { ...tableData };
    Object.keys(cleanedTableData).forEach(key => {
      if (cleanedTableData[key] === '') {
        delete cleanedTableData[key];
      }
    });

    // Adicionar organization_id e environment_id aos dados
    const finalTableData = {
      ...cleanedTableData,
      organization_id: userData.organization_id,
      environment_id: userData.environment_id
    };



    // PASSO 4: EXECUTAR INSERT



    const { data: newTable, error: tableError } = await supabase
      .from('freight_rate_tables')
      .insert([finalTableData])
      .select()
      .single();



    if (tableError) {








      // Erro específico de RLS
      if (tableError.code === '42501' || tableError.message.includes('row-level security')) {



        throw new Error('Erro de permissão ao criar tabela de frete. Contate o suporte.');
      }

      throw new Error(tableError.message || 'Erro ao criar tabela de frete.');
    }







    if (tarifas && tarifas.length > 0) {
      for (const rate of tarifas) {
        const { id, detalhes, created_at, updated_at, created_by, updated_by, ...rateData } = rate;

        // Filtrar apenas campos válidos
        const filteredData = filterValidFields(rateData, VALID_FREIGHT_RATE_FIELDS);

        // Limpar campos com strings vazias
        const cleanedRateData = {
          freight_rate_table_id: newTable.id,
          organization_id: userData.organization_id,
          environment_id: userData.environment_id,
          ...formatRateData(filteredData)
        };
        Object.keys(cleanedRateData).forEach(key => {
          if (cleanedRateData[key] === '') {
            delete cleanedRateData[key];
          }
        });

        const { data: newRate, error: rateError } = await supabase
          .from('freight_rates')
          .insert([cleanedRateData])
          .select()
          .single();

        if (rateError) throw rateError;

        // Inserir detalhes se existirem
        if (detalhes && detalhes.length > 0 && newRate) {
          const detailsData = detalhes.map(detail => {
            const { id, created_at, updated_at, ...cleanDetail } = detail as any;
            return {
              ...cleanDetail,
              freight_rate_id: newRate.id
            };
          });

          const { error: detailsError } = await supabase
            .from('freight_rate_details')
            .insert(detailsData);

          if (detailsError) throw detailsError;
        }
      }
    }


    const finalTable = await this.getTableById(newTable.id);

    return finalTable as FreightRateTable;
  },

  async updateTable(id: string, updates: Partial<FreightRateTable>): Promise<FreightRateTable> {
    // Extrair apenas os campos válidos da tabela, ignorando tarifas e outros campos relacionais
    const {
      tarifas,
      transportador_nome,
      created_at,
      created_by,
      updated_by,
      ...tableUpdates
    } = updates;

    // Criar objeto apenas com campos válidos para update
    const validUpdates: any = {};
    const validFields = ['nome', 'transportador_id', 'data_inicio', 'data_fim', 'status', 'table_type', 'modal'];

    validFields.forEach(field => {
      if (tableUpdates[field] !== undefined && tableUpdates[field] !== '') {
        validUpdates[field] = tableUpdates[field];
      }
    });

    // Adicionar updated_at
    validUpdates.updated_at = new Date().toISOString();

    // Atualizar apenas os dados da tabela (não toca nas tarifas)
    const { error: tableError } = await supabase
      .from('freight_rate_tables')
      .update(validUpdates)
      .eq('id', id);

    if (tableError) {

      throw tableError;
    }

    // IMPORTANTE: Não deletamos/recriamos as tarifas aqui para preservar
    // as cidades vinculadas e outros relacionamentos.
    // As tarifas são gerenciadas individualmente através dos métodos
    // createRate, updateRate e deleteRate.

    // Retornar apenas os dados da tabela atualizada sem carregar todas as tarifas
    // para evitar timeouts em tabelas com muitas tarifas/cidades
    const { data: updatedTable, error: fetchError } = await supabase
      .from('freight_rate_tables')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!updatedTable) throw new Error('Tabela não encontrada após atualização');

    return updatedTable as FreightRateTable;
  },

  async deleteTable(id: string): Promise<void> {
    const { error } = await supabase
      .from('freight_rate_tables')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getRatesByTable(tableId: string): Promise<FreightRate[]> {
    const { data, error } = await supabase
      .from('freight_rates')
      .select('*')
      .eq('freight_rate_table_id', tableId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Carregar detalhes para cada tarifa
    const ratesWithDetails = await Promise.all(
      (data || []).map(async (rate) => {
        const detalhes = await this.getDetailsByRate(rate.id);
        return { ...rate, detalhes };
      })
    );

    return ratesWithDetails;
  },

  async getDetailsByRate(rateId: string): Promise<FreightRateDetail[]> {
    const { data, error } = await supabase
      .from('freight_rate_details')
      .select('*')
      .eq('freight_rate_id', rateId)
      .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createRate(rate: Omit<FreightRate, 'id' | 'created_at' | 'updated_at'>): Promise<FreightRate> {







    // Obter dados do usuário para organization_id e environment_id
    const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId || !ctx.environmentId) {
        throw new Error('Sessão inválida ou contexto não selecionado.');
      }
      const userData = {
        organization_id: ctx.organizationId,
        environment_id: ctx.environmentId,
        establishment_id: ctx.establishmentId || null
      };

    if (!userData.organization_id || !userData.environment_id) {
      throw new Error('Dados de organização incompletos. Contate o suporte.');
    }

    // Verificar se já existe uma tarifa com o mesmo código na mesma tabela
    if (rate.codigo && rate.freight_rate_table_id) {

      const { data: existing } = await supabase
        .from('freight_rates')
        .select('id')
        .eq('freight_rate_table_id', rate.freight_rate_table_id)
        .eq('codigo', rate.codigo)
        .maybeSingle();

      if (existing) {

        throw new Error(`Já existe uma tarifa com o código "${rate.codigo}" nesta tabela. Por favor, use um código diferente.`);
      }

    }

    // Filtrar apenas campos válidos

    const filteredRate = filterValidFields(rate, VALID_FREIGHT_RATE_FIELDS);


    // Limpar campos com strings vazias (geralmente problemas com UUID)
    const cleanedRate = {
      ...filteredRate,
      organization_id: userData.organization_id,
      environment_id: userData.environment_id
    };
    Object.keys(cleanedRate).forEach(key => {
      if (cleanedRate[key] === '') {

        delete cleanedRate[key];
      }
    });







    const { data, error } = await supabase
      .from('freight_rates')
      .insert([cleanedRate])
      .select()
      .single();



    if (error) {










      // Se o erro for de constraint unique, fornecer mensagem mais clara
      if (error.code === '23505' && error.message.includes('freight_rates_table_codigo_unique')) {

        throw new Error(`Já existe uma tarifa com o código "${rate.codigo}" nesta tabela. Por favor, use um código diferente.`);
      }

      // Erro específico de RLS
      if (error.code === '42501' || error.message.includes('row-level security')) {


      }

      throw error;
    }







    return data;
  },

  async updateRate(id: string, updates: Partial<FreightRate>): Promise<FreightRate> {
    const { detalhes, created_by, updated_by, created_at, id: rateId, ...rateData } = updates;






    try {
      // Filtrar apenas campos válidos
      const filteredData = filterValidFields(rateData, VALID_FREIGHT_RATE_FIELDS);


      // Limpar campos com strings vazias (geralmente problemas com UUID)
      const cleanedData = { ...formatRateData(filteredData), updated_at: new Date().toISOString() };
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '') {

          delete cleanedData[key];
        }
      });




      // O trigger ensure_gris_three_decimals no banco garante 3 casas decimais
      const { data, error } = await supabase
        .from('freight_rates')
        .update(cleanedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {






        throw new Error(`Erro ao atualizar tarifa: ${error.message || error.code || 'Erro desconhecido'}`);
      }

      if (!data) {
        throw new Error('Tarifa não encontrada após atualização');
      }



      if (detalhes !== undefined) {



        const { error: deleteError } = await supabase
          .from('freight_rate_details')
          .delete()
          .eq('freight_rate_id', id);

        if (deleteError) {


          throw new Error(`Erro ao deletar detalhes antigos: ${deleteError.message || deleteError.code || 'Erro desconhecido'}`);
        }



        if (detalhes.length > 0) {
          const detailsData = detalhes.map((detail, index) => {
            // Remover o campo 'id' se existir, pois será um novo registro
            const { id: detailId, created_at, updated_at, ...detailWithoutId } = detail as any;

            // Garantir valores padrão para campos obrigatórios
            const processedDetail = {
              freight_rate_id: id,
              ordem: detailWithoutId.ordem ?? index + 1,
              peso_ate: Number(detailWithoutId.peso_ate) || 0,
              m3_ate: Number(detailWithoutId.m3_ate) || 0,
              volume_ate: Number(detailWithoutId.volume_ate) || 0,
              valor_ate: Number(detailWithoutId.valor_ate) || 0,
              valor_faixa: Number(detailWithoutId.valor_faixa) || 0,
              tipo_calculo: detailWithoutId.tipo_calculo || 'valor_faixa',
              tipo_frete: detailWithoutId.tipo_frete || 'normal',
              frete_valor: Number(detailWithoutId.frete_valor) || 0,
              frete_minimo: Number(detailWithoutId.frete_minimo) || 0,
              tipo_taxa: detailWithoutId.tipo_taxa || 'com_taxas',
              taxa_minima: Number(detailWithoutId.taxa_minima) || 0
            };




            return processedDetail;
          });



          const { error: insertError, data: insertedData } = await supabase
            .from('freight_rate_details')
            .insert(detailsData)
            .select();

          if (insertError) {





            throw new Error(`Erro ao inserir novos detalhes: ${insertError.message || insertError.code || 'Erro desconhecido'}`);
          }



        } else {

        }
      } else {

      }

      return data;
    } catch (error) {

      throw error;
    }
  },

  async deleteRate(id: string): Promise<void> {
    const { error } = await supabase
      .from('freight_rates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async duplicateRate(rateId: string): Promise<FreightRate> {
    // 1. Buscar a tarifa original
    const { data: originalRate, error: rateError } = await supabase
      .from('freight_rates')
      .select('*')
      .eq('id', rateId)
      .single();

    if (rateError) throw rateError;
    if (!originalRate) throw new Error('Tarifa não encontrada');

    // 2. Buscar todas as tarifas da mesma tabela para gerar novo código
    const { data: existingRates } = await supabase
      .from('freight_rates')
      .select('codigo')
      .eq('freight_rate_table_id', originalRate.freight_rate_table_id);

    const maxCode = (existingRates || [])
      .map(r => parseInt(r.codigo.replace(/\D/g, '')) || 0)
      .reduce((max, curr) => Math.max(max, curr), 0);

    const newCode = `TAR${String(maxCode + 1).padStart(4, '0')}`;

    // 3. Criar nova tarifa (sem id, created_at, updated_at e com novo código)
    const { id, created_at, updated_at, created_by, updated_by, ...rateToCopy } = originalRate;

    // Filtrar apenas campos válidos
    const filteredRate = filterValidFields(rateToCopy, VALID_FREIGHT_RATE_FIELDS);

    // Obter dados do usuário para organization_id e environment_id
    const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId || !ctx.environmentId) {
        throw new Error('Sessão inválida ou contexto não selecionado.');
      }
      const userData = {
        organization_id: ctx.organizationId,
        environment_id: ctx.environmentId,
        establishment_id: ctx.establishmentId || null
      };

    if (!userData.organization_id || !userData.environment_id) {
      throw new Error('Dados de organização incompletos. Contate o suporte.');
    }

    const newRateData = {
      ...filteredRate,
      codigo: newCode,
      descricao: `${rateToCopy.descricao} (Cópia)`,
      organization_id: userData.organization_id,
      environment_id: userData.environment_id
    };

    // Limpar campos com strings vazias
    const cleanedNewRateData = formatRateData(newRateData);
    Object.keys(cleanedNewRateData).forEach(key => {
      if (cleanedNewRateData[key] === '') {
        delete cleanedNewRateData[key];
      }
    });

    const { data: newRate, error: newRateError } = await supabase
      .from('freight_rates')
      .insert([cleanedNewRateData])
      .select()
      .single();

    if (newRateError) throw newRateError;

    // 4. Copiar detalhes/faixas (freight_rate_details)
    const { data: details, error: detailsError } = await supabase
      .from('freight_rate_details')
      .select('*')
      .eq('freight_rate_id', rateId);

    if (detailsError) throw detailsError;

    if (details && details.length > 0) {
      const newDetails = details.map(({ id, created_at, updated_at, ...detail }) => ({
        ...detail,
        freight_rate_id: newRate.id
      }));

      const { error: insertDetailsError } = await supabase
        .from('freight_rate_details')
        .insert(newDetails);

      if (insertDetailsError) throw insertDetailsError;
    }

    // 5. NÃO copiar taxas adicionais (freight_rate_additional_fees) pois pertencem à Tabela
    // 6. NÃO copiar itens restritos (freight_rate_restricted_items) pois pertencem à Tabela

    // 7. NÃO copiar cidades (freight_rate_cities) conforme especificado
    // A nova tarifa será criada sem cidades associadas

    return newRate;
  },

  async getNextRateCode(tableId: string, existingRates?: FreightRate[]): Promise<string> {
    // Se temos tableId, buscar todas as tarifas do banco para garantir código único
    let allRates = existingRates || [];

    if (tableId && tableId !== '') {
      const { data: ratesFromDb } = await supabase
        .from('freight_rates')
        .select('codigo')
        .eq('freight_rate_table_id', tableId);

      if (ratesFromDb && ratesFromDb.length > 0) {
        // Mesclar tarifas do banco com as existentes (se houver)
        const allCodes = [...new Set([
          ...allRates.map(r => r.codigo),
          ...ratesFromDb.map(r => r.codigo)
        ])];
        allRates = allCodes.map(codigo => ({ codigo } as FreightRate));
      }
    }

    const maxCode = allRates
      .map(r => parseInt(r.codigo.replace(/\D/g, '')) || 0)
      .reduce((max, curr) => Math.max(max, curr), 0);

    return `TAR${String(maxCode + 1).padStart(4, '0')}`;
  },

  async getFreightRateWithTable(rateId: string): Promise<{ rate: FreightRate; table: FreightRateTable } | null> {
    try {
      const { data: rate, error: rateError } = await supabase
        .from('freight_rates')
        .select('*, freight_rate_table:freight_rate_tables(*)')
        .eq('id', rateId)
        .maybeSingle();

      if (rateError) throw rateError;
      if (!rate) return null;

      const table = rate.freight_rate_table;
      delete rate.freight_rate_table;

      return { rate, table };
    } catch (error) {

      return null;
    }
  },

  async getById(rateId: string): Promise<FreightRate | null> {
    try {
      const { data: rate, error: rateError } = await supabase
        .from('freight_rates')
        .select('*')
        .eq('id', rateId)
        .maybeSingle();

      if (rateError) throw rateError;
      if (!rate) return null;

      const details = await this.getDetailsByRate(rateId);

      return {
        ...rate,
        detalhes: details
      };
    } catch (error) {

      return null;
    }
  }
};
