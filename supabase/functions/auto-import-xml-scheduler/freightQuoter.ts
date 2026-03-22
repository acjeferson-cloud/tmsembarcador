import { supabase, FreightRate } from './freightCalculator.ts';
import { freightCostCalculator } from './freightCalculator.ts';

export async function calculateBestFreight(
  cityName: string,
  stateAbbr: string,
  weight: number,
  volumeQty: number,
  cargoValue: number,
  cubicMeters: number = 0
): Promise<any[]> {
  try {
    console.log(`Buscando cidade destino: ${cityName} - ${stateAbbr}`);
    // 1. Find state UUID
    const { data: stateData } = await supabase
      .from('states')
      .select('id')
      .eq('sigla', stateAbbr)
      .maybeSingle();

    if (!stateData) {
      console.log(`Estado ${stateAbbr} não encontrado.`);
      return [];
    }

    // 2. Find city UUID
    const { data: cities } = await supabase
      .from('cities')
      .select('id, nome')
      .eq('state_id', stateData.id);

    if (!cities || cities.length === 0) return [];
    
    // Normalize string to ignore accents and case
    const normalizeString = (str: string) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    };
    
    const normalizedTarget = normalizeString(cityName);
    const city = cities.find(c => normalizeString(c.nome) === normalizedTarget);

    if (!city) {
      console.log(`Cidade ${cityName} não encontrada no estado ${stateAbbr}.`);
      return [];
    }

    const cityId = city.id;
    console.log(`Cidade encontrada: ${city.nome} (${cityId})`);

    // 3. Call RPC to get eligible rates
    const { data: ratesData, error: ratesError } = await supabase.rpc('calculate_freight_quotes', {
      p_destination_city_id: cityId,
      p_selected_modals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario']
    });

    if (ratesError) {
      console.error(`Erro RPC calculate_freight_quotes: ${ratesError.message}`);
      return [];
    }

    if (!ratesData || ratesData.length === 0) {
      console.log('Nenhuma tarifa encontrada para esta cidade.');
      return [];
    }

    // 4. Calculate quotes using the adapted freightCostCalculator
    const results: any[] = [];

    for (const rateData of ratesData) {
      try {
        const tariff = rateData.rate_data.freight_rate as FreightRate;
        const details = rateData.rate_data.freight_rate_details || [];
        tariff.detalhes = details;
        tariff.tabela_id = rateData.freight_rate_table_id;

        const calculation = await freightCostCalculator.performCalculation(
          tariff,
          {
            weight: weight,
            value: cargoValue,
            volume: volumeQty,
            m3: cubicMeters
          },
          null, // cte is null
          []    // additionalFees empty for now to match UI fast-response baseline
        );

        results.push({
          carrierId: rateData.carrier_id,
          carrierName: rateData.carrier_name,
          modal: rateData.modal || 'rodoviario',
          totalValue: calculation.valorTotal,
          calculationDetails: calculation,
          isNominated: false,
          deliveryDays: rateData.delivery_days || undefined,
          npsInterno: rateData.carrier_nps_interno || undefined
        });
      } catch (calcErr: any) {
        console.error(`Erro ao calcular tarifa para ${rateData.carrier_name}:`, calcErr.message);
      }
    }

    // 5. Sort by lowest value
    results.sort((a, b) => a.totalValue - b.totalValue);

    if (results.length > 0) {
      results[0].isNominated = true;
    }

    console.log(`Calculadas ${results.length} cotações. Melhor valor: R$ ${results[0]?.totalValue}`);
    return results;

  } catch (err: any) {
    console.error('Erro geral no calculateBestFreight:', err.message);
    return [];
  }
}

export async function calculateCteFreight(cteId: string): Promise<{success: boolean, error?: string, icmsLog?: string}> {
  try {
    console.log(`Iniciando cálculo para CT-e ID: ${cteId}`);
    const { data: fullCTe } = await supabase
        .from('ctes_complete')
        .select(`
          *,
          invoices:ctes_invoices(*),
          carrier_costs:ctes_carrier_costs(*),
          carrier:carriers(id, codigo, razao_social),
          establishment:establishments(id, codigo, razao_social)
        `)
        .eq('id', cteId)
        .maybeSingle();
        
    if (!fullCTe) {
      return { success: false, error: `CT-e ${cteId} não encontrado no BD.` };
    }

    const calculation = await freightCostCalculator.calculateCTeCost(fullCTe);
    
    await supabase.from('ctes_carrier_costs').delete().eq('cte_id', cteId);

    const costPayload = [
      { cte_id: cteId, cost_type: 'freight_weight', cost_value: calculation.fretePeso },
      { cte_id: cteId, cost_type: 'freight_value', cost_value: calculation.freteValor },
      { cte_id: cteId, cost_type: 'gris', cost_value: calculation.gris },
      { cte_id: cteId, cost_type: 'toll', cost_value: calculation.pedagio },
      { cte_id: cteId, cost_type: 'tas', cost_value: calculation.tas },
      { cte_id: cteId, cost_type: 'seccat', cost_value: calculation.seccat },
      { cte_id: cteId, cost_type: 'dispatch', cost_value: calculation.despacho },
      { cte_id: cteId, cost_type: 'itr', cost_value: calculation.itr },
      { cte_id: cteId, cost_type: 'collection_delivery', cost_value: calculation.coletaEntrega },
      { cte_id: cteId, cost_type: 'tda', cost_value: calculation.tda },
      { cte_id: cteId, cost_type: 'tde', cost_value: calculation.tde },
      { cte_id: cteId, cost_type: 'trt', cost_value: calculation.trt },
      { cte_id: cteId, cost_type: 'tec', cost_value: calculation.tec },
      { cte_id: cteId, cost_type: 'other_value', cost_value: calculation.outrosValores },
      { cte_id: cteId, cost_type: 'icms_base', cost_value: calculation.icmsBase },
      { cte_id: cteId, cost_type: 'icms_value', cost_value: calculation.icmsValor },
      { cte_id: cteId, cost_type: 'total_value', cost_value: calculation.valorTotal }
    ];

    const { error } = await supabase.from('ctes_carrier_costs').insert(costPayload);

    // Salvar ID da tarifa utilizada no CT-e
    if (calculation.tarifaUtilizada?.id) {
       await supabase.from('ctes_complete').update({ calculated_freight_rate_id: calculation.tarifaUtilizada.id }).eq('id', cteId);
    }
    
    if (error) {
       return { success: false, error: `Erro DB insert ctes_carrier_costs: ${error.message}` };
    }
    
    return { 
       success: true, 
       icmsLog: `F.Peso=${calculation.fretePeso} F.Val=${calculation.freteValor} GRIS=${calculation.gris} Ped=${calculation.pedagio} TRT=${calculation.trt} Outros=${calculation.outrosValores} Aliq=${calculation.icmsAliquota} Base=${calculation.icmsBase} ICMS=${calculation.icmsValor} Tarifa=${calculation.tarifaUtilizada?.aliquota_icms}` 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
