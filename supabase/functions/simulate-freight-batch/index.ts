import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const body = await req.json();
    const { 
      startDate, endDate, carrierIds, organizationId, environmentId,
      modal, businessPartnerId, destinationState, destinationCity,
      minWeight, maxWeight, minValue, maxValue
    } = body;

    if (!startDate || !endDate || !carrierIds || !Array.isArray(carrierIds) || carrierIds.length < 2) {
      throw new Error('Parâmetros inválidos. É necessário startDate, endDate e no mínimo 2 carrierIds.');
    }

    // 1. Fetch Orders (Limit 1000)
    let ordersQuery = supabaseClient
      .from('orders')
      .select('id, data_pedido, valor_mercadoria, weight, cubic_meters, destino_cidade, destino_estado, destino_cep')
      .eq('organization_id', organizationId)
      .eq('environment_id', environmentId)
      .gte('data_pedido', startDate)
      .lte('data_pedido', endDate)
      .not('destino_cidade', 'is', null)
      .not('destino_estado', 'is', null)
      .gt('valor_mercadoria', 0)
      .gt('weight', 0);

    if (businessPartnerId) {
      ordersQuery = ordersQuery.eq('business_partner_id', businessPartnerId);
    }
    if (destinationState) {
      ordersQuery = ordersQuery.eq('destino_estado', destinationState);
    }
    if (destinationCity) {
      ordersQuery = ordersQuery.ilike('destino_cidade', `%${destinationCity}%`);
    }
    if (minWeight !== undefined && minWeight !== null) {
      ordersQuery = ordersQuery.gte('weight', minWeight);
    }
    if (maxWeight !== undefined && maxWeight !== null) {
      ordersQuery = ordersQuery.lte('weight', maxWeight);
    }
    if (minValue !== undefined && minValue !== null) {
      ordersQuery = ordersQuery.gte('valor_mercadoria', minValue);
    }
    if (maxValue !== undefined && maxValue !== null) {
      ordersQuery = ordersQuery.lte('valor_mercadoria', maxValue);
    }

    const { data: orders, error: ordersError } = await ordersQuery.limit(1000);

    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ success: true, results: [], message: 'Nenhum pedido válido encontrado no período.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Resolve States & Cities to optimize tariff queries
    // We group destinations to fetch tariffs effectively
    const destStates = [...new Set(orders.map(o => o.destino_estado))];
    const { data: statesData, error: statesError } = await supabaseClient
      .from('states')
      .select('id, sigla')
      .in('sigla', destStates);
      
    if (statesError) throw statesError;

    const stateMap = new Map(statesData?.map(s => [s.sigla, s.id]) || []);
    const destCities = [...new Set(orders.map(o => o.destino_cidade.toUpperCase()))];
    
    // We need to fetch city IDs
    const stateIdsArray = Array.from(stateMap.values());
    let citiesData: any = [];
    if (stateIdsArray.length > 0) {
      const { data, error: citiesError } = await supabaseClient
        .from('cities')
        .select('id, nome, state_id')
        .in('state_id', stateIdsArray);
      if (citiesError) throw citiesError;
      citiesData = data;
    }
    
    // Map: StateId_CityName -> CityId
    const cityMap = new Map();
    citiesData?.forEach(c => {
      const normalizedName = c.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
      cityMap.set(`${c.state_id}_${normalizedName}`, c.id);
    });

    // Prepare helper structures
    const freightTableCache = new Map(); // carrierId -> tableId[]
    const tableInfo = new Map(); // tableId -> info
    const tariffCache = new Map(); // tableId_cityId -> tariff details

    for (const carrierId of carrierIds) {
      let tableQuery = supabaseClient
        .from('freight_rate_tables')
        .select('id, nome, modal, carriers(razao_social, nome_fantasia)')
        .eq('transportador_id', carrierId)
        .eq('status', 'ativo');
        
      if (modal) {
        tableQuery = tableQuery.ilike('modal', `%${modal}%`);
      }
      
      const { data: tableData, error: tableError } = await tableQuery.order('data_inicio', { ascending: false });

      if (tableError) throw tableError;

      if (tableData && tableData.length > 0) {
        freightTableCache.set(carrierId, tableData.map(t => t.id));
        tableData.forEach(t => tableInfo.set(t.id, t));
      }
    }

    // 3. Prepare result structure INDEPENDENTLY per TABLE
    const results: any[] = [];
    for (const [carrierId, tableIds] of freightTableCache.entries()) {
      for (const tId of tableIds) {
         const tData = tableInfo.get(tId);
         const carrierObj = Array.isArray(tData.carriers) ? tData.carriers[0] : tData.carriers;
         const carrierName = carrierObj?.razao_social || carrierObj?.nome_fantasia || 'Transportadora';
         results.push({
            carrierId: tId, // We use table ID so the unique key loop doesn't break in React
            originalCarrierId: carrierId,
            carrierName: `${carrierName} - ${tData.nome} (${tData.modal || 'N/A'})`,
            totalCost: 0,
            averageCost: 0,
            optimizedOrdersCount: 0,
            validOrdersCount: 0,
         });
      }
    }

    const simulatedOrders: any[] = [];


    // 4. Calculate
    for (const order of orders) {
      const stateId = stateMap.get(order.destino_estado);
      const normalizedCityName = order.destino_cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
      const cityId = cityMap.get(`${stateId}_${normalizedCityName}`);
      
      const orderSimulations = [];

      for (const carrierId of carrierIds) {
        const tableIds = freightTableCache.get(carrierId);
        if (!tableIds || tableIds.length === 0 || !cityId) continue;

        for (const tableId of tableIds) {
          const cacheKey = `${tableId}_${cityId}`;
          let tariff = tariffCache.get(cacheKey);

          if (tariff === undefined) {
            // Fetch tariff
            const { data: rateCity } = await supabaseClient
              .from('freight_rate_cities')
              .select('freight_rate_id')
              .eq('freight_rate_table_id', tableId)
              .eq('city_id', cityId)
              .maybeSingle();

            if (rateCity) {
              const { data: rate } = await supabaseClient
                .from('freight_rates')
                .select('*')
                .eq('id', rateCity.freight_rate_id)
                .single();

              const { data: details } = await supabaseClient
                .from('freight_rate_details')
                .select('*')
                .eq('freight_rate_id', rate.id)
                .order('ordem', { ascending: true });

              tariff = { ...rate, detalhes: details || [] };
            } else {
              tariff = null;
            }
            tariffCache.set(cacheKey, tariff);
          }

          if (tariff) {
            // Calculate Cost
            const weight = Number(order.weight);
            let pesoConsiderado = weight;
            if (tariff.fator_m3 > 0 && order.cubic_meters > 0) {
              const pesoCubado = order.cubic_meters * tariff.fator_m3;
              if (pesoCubado > pesoConsiderado) pesoConsiderado = pesoCubado;
            }

            let weightRange = tariff.detalhes[tariff.detalhes.length - 1];
            for (const detail of tariff.detalhes) {
              if (pesoConsiderado <= detail.peso_ate) {
                weightRange = detail;
                break;
              }
            }

            const freteMinimo = tariff.frete_peso_minimo || 0;
            let calculatedFretePeso = weightRange ? (weightRange.valor_faixa || 0) : freteMinimo;
            
            if (weightRange?.tipo_calculo === 'excedente') {
               const currentIndex = tariff.detalhes.findIndex((d: any) => d.ordem === weightRange.ordem);
               if (currentIndex > 0) {
                  const prev = tariff.detalhes[currentIndex - 1];
                  const excedente = pesoConsiderado - (prev.peso_ate || 0);
                  calculatedFretePeso = (prev.valor_faixa || 0) + (excedente * weightRange.valor_faixa);
               }
            }
            const fretePeso = Math.max(calculatedFretePeso, freteMinimo);

            // Frete Valor
            const percentualV = weightRange ? (weightRange.frete_valor || 0) : 0;
            const freteValor = Math.max((Number(order.valor_mercadoria) * percentualV) / 100, tariff.frete_valor_minimo || 0);

            const semTaxas = weightRange?.tipo_taxa === 'sem_taxas';

            // Outras taxas basicas
            const gris = semTaxas ? 0 : Math.max((Number(order.valor_mercadoria) * (tariff.percentual_gris || 0)) / 100, tariff.gris_minimo || 0);
            
            let pedagio = 0;
            if (!semTaxas && tariff.pedagio_por_kg > 0) {
               const fracoes = Math.ceil(pesoConsiderado / (tariff.pedagio_a_cada_kg || 100));
               pedagio = Math.max(fracoes * tariff.pedagio_por_kg, tariff.pedagio_minimo || 0);
            }

            const tas = semTaxas ? 0 : (tariff.tas || 0);
            const seccat = semTaxas ? 0 : (tariff.seccat || 0);
            const despacho = semTaxas ? 0 : (tariff.despacho || 0);
            const itr = semTaxas ? 0 : (tariff.itr || 0);
            const coletaEntrega = semTaxas ? 0 : (tariff.coleta_entrega || 0);

            const baseCalculo = fretePeso + freteValor + gris + pedagio + tas + seccat + despacho + itr + coletaEntrega;
            
            let valorTotal = baseCalculo;
            const icmsAliquota = tariff.aliquota_icms || 0;
            if (icmsAliquota > 0) {
               const outrosValores = semTaxas ? 0 : Math.max((baseCalculo * (tariff.valor_outros_percent || 0)) / 100, tariff.valor_outros_minimo || 0);
               if (tariff.icms_embutido_tabela === 'embutido') {
                  const baseFrete = baseCalculo + outrosValores;
                  valorTotal = baseFrete / (1 - (icmsAliquota / 100));
               } else {
                  const baseFrete = baseCalculo;
                  const icmsValor = (baseFrete * icmsAliquota) / (100 - icmsAliquota);
                  valorTotal = baseFrete + icmsValor;
               }
            } else {
               const outrosValores = semTaxas ? 0 : Math.max((baseCalculo * (tariff.valor_outros_percent || 0)) / 100, tariff.valor_outros_minimo || 0);
               valorTotal = baseCalculo + outrosValores;
            }

            orderSimulations.push({
              carrierId: tableId, // Use tableId as the tracking ID
              cost: valorTotal
            });
          }
        } // End of tableId loop
      }

      if (orderSimulations.length > 0) {
        simulatedOrders.push(orderSimulations);
      }
    }

    // 5. Aggregate KPI
    let totalSimulatedOrders = 0;
    
    simulatedOrders.forEach(sims => {
      let bestSim: any = null;
      
      sims.forEach(s => {
        // Tracker totals
        const resObj = results.find(r => r.carrierId === s.carrierId);
        if (resObj) {
          resObj.totalCost += s.cost;
          if (s.cost > 0) resObj.validOrdersCount += 1;
        }

        // Find winner for this order (must be > 0)
        if (s.cost > 0) {
          if (!bestSim || s.cost < bestSim.cost) {
            bestSim = s;
          }
        }
      });

      if (bestSim) {
        const winnerObj = results.find(r => r.carrierId === bestSim.carrierId);
        if (winnerObj) winnerObj.optimizedOrdersCount += 1;
      }
      
      totalSimulatedOrders += 1;
    });

    results.forEach(r => {
      // Average cost based only on valid served orders
      r.averageCost = r.validOrdersCount > 0 ? r.totalCost / r.validOrdersCount : 0;
    });

    // Sort by total cost ascending (ignore zeros by pushing them to the end)
    results.sort((a, b) => {
      if (a.totalCost === 0) return 1;
      if (b.totalCost === 0) return -1;
      return a.totalCost - b.totalCost;
    });

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      totalOrdersProcessed: totalSimulatedOrders
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    // Return a 200 status code but with success: false so the client can read the JSON body
    // because supabase-js hides the body if status is 4xx.
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: error.details || error.hint || 'No additional details'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
