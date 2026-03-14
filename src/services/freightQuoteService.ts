import { supabase } from '../lib/supabase';
import { freightCostCalculator } from './freightCostCalculator';
import { holidaysService } from './holidaysService';
import { findCityByCEPFromDatabase } from './citiesService';

export interface QuoteParams {
  originCityId?: string;
  originZipCode?: string;
  destinationCityId?: string;
  destinationZipCode?: string;
  weight: number;
  volumeQty: number;
  cubicMeters?: number;
  cargoValue: number;
  establishmentId?: string;
  businessPartnerId?: string;
  selectedModals?: string[];
}

export interface QuoteResult {
  carrierId: string;
  carrierName: string;
  modal: string;
  totalValue: number;
  calculationDetails: any;
  isNominated: boolean;
  deliveryDays?: number;
  deliveryDeadline?: string;
  percentageAboveLowest?: number;
  npsInterno?: number;
}

export interface FreightQuoteHistory {
  id: string;
  user_id?: string;
  establishment_id?: string;
  business_partner_id?: string;
  origin_city_id?: string;
  destination_city_id?: string;
  origin_zip_code?: string;
  destination_zip_code?: string;
  weight: number;
  volume_qty: number;
  cubic_meters?: number;
  cargo_value: number;
  quote_results: QuoteResult[];
  best_carrier_id?: string;
  best_carrier_value?: number;
  delivery_days?: number;
  delivery_deadline?: string;
  selected_modals?: string[];
  created_at: string;
}

export const freightQuoteService = {
  async findCityByZipCode(zipCode: string): Promise<any> {
    const cleanZip = zipCode.replace(/\D/g, '');

    const city = await findCityByCEPFromDatabase(cleanZip);

    if (!city) return null;

    return {
      ibge_code: city.ibgeCode,
      state_abbreviation: city.stateAbbreviation,
      nome: city.name
    };
  },

  async calculateDeliveryDeadline(
    deliveryDays: number,
    destinationCityId: string,
    destinationStateId: string,
    carrierId: string,
    quoteDate: Date = new Date()
  ): Promise<string> {
    // Buscar configurações do transportador (working_days_config é JSONB)
    const { data: carrier } = await supabase
      .from('carriers')
      .select('working_days_config')
      .eq('id', carrierId)
      .maybeSingle();

    const workingDaysConfig = carrier?.working_days_config as any || {};
    const consideraSabado = workingDaysConfig?.considera_sabado || false;
    const consideraDomingo = workingDaysConfig?.considera_domingo || false;
    const consideraFeriados = workingDaysConfig?.considera_feriados !== undefined ? workingDaysConfig.considera_feriados : true;

    // Calcular data de entrega considerando dias úteis e feriados
    const deadline = await holidaysService.calculateDeliveryDate(
      quoteDate,
      deliveryDays,
      destinationCityId,
      destinationStateId,
      consideraSabado,
      consideraDomingo,
      consideraFeriados
    );

    return deadline.toISOString().split('T')[0];
  },

  async getDeliveryDays(freightRateId: string, cityId: string): Promise<number | null> {
    const { data: freightRateCity } = await supabase
      .from('freight_rate_cities')
      .select('delivery_days')
      .eq('freight_rate_id', freightRateId)
      .eq('city_id', cityId)
      .maybeSingle();

    if (freightRateCity?.delivery_days !== undefined && freightRateCity?.delivery_days !== null) {
      return freightRateCity.delivery_days;
    }

    const { data: freightRate } = await supabase
      .from('freight_rates')
      .select('prazo_entrega')
      .eq('id', freightRateId)
      .maybeSingle();

    return freightRate?.prazo_entrega || null;
  },

  async calculateQuote(params: QuoteParams, userId?: string, userName?: string, userEmail?: string): Promise<QuoteResult[]> {
    const startTime = performance.now();


    let originCityId: string | undefined = params.originCityId;
    let destinationCityId: string | undefined = params.destinationCityId;

    if (!originCityId && params.originZipCode) {
      const city = await this.findCityByZipCode(params.originZipCode);
      if (city) originCityId = city.ibge_code;
    }

    if (!destinationCityId && params.destinationZipCode) {
      const city = await this.findCityByZipCode(params.destinationZipCode);
      if (city) destinationCityId = city.ibge_code;
    }

    if (!destinationCityId) {
      throw new Error('Cidade de destino não identificada');
    }

    // Buscar cidade de destino com JOIN de states
    const { data: cityData } = await supabase
      .from('cities')
      .select(`
        id,
        nome,
        codigo_ibge,
        state_id,
        states:state_id (
          id,
          sigla
        )
      `)
      .eq('codigo_ibge', destinationCityId)
      .maybeSingle();

    if (!cityData) {
      throw new Error('Dados da cidade de destino não encontrados');
    }

    const cityId = cityData.id; // UUID
    const stateAbbr = (cityData as any).states?.sigla;
    const stateId = cityData.state_id; // UUID



    // Usar a função SQL otimizada para buscar todas as tarifas aplicáveis
    const selectedModals = params.selectedModals || ['rodoviario', 'aereo', 'aquaviario', 'ferroviario'];



    const { data: ratesData, error: ratesError } = await supabase.rpc('calculate_freight_quotes', {
      p_destination_city_id: cityId,
      p_selected_modals: selectedModals
    });



    if (ratesError) {

      throw new Error(`Erro ao buscar tarifas: ${ratesError.message}`);
    }

    if (!ratesData || ratesData.length === 0) {




      return [];
    }



    const results: QuoteResult[] = [];

    // Processar todas as tarifas em paralelo
    const calculationPromises = ratesData.map(async (rateData: any) => {
      try {
        const tariff = rateData.rate_data.freight_rate;
        const details = rateData.rate_data.freight_rate_details || [];
        tariff.detalhes = details;

        const calculation = await freightCostCalculator.performCalculation(
          tariff,
          {
            weight: params.weight,
            value: params.cargoValue,
            volume: params.volumeQty,
            m3: params.cubicMeters
          },
          null
        );

        let deliveryDeadline: string | undefined;
        if (rateData.delivery_days && stateId) {
          deliveryDeadline = await this.calculateDeliveryDeadline(
            rateData.delivery_days,
            cityId,
            stateId,
            rateData.carrier_id
          );
        }

        return {
          carrierId: rateData.carrier_id,
          carrierName: rateData.carrier_name,
          modal: rateData.modal || 'rodoviario',
          totalValue: calculation.valorTotal,
          calculationDetails: calculation,
          isNominated: false,
          deliveryDays: rateData.delivery_days || undefined,
          deliveryDeadline: deliveryDeadline,
          npsInterno: rateData.carrier_nps_interno || undefined
        };
      } catch (error) {

        return null;
      }
    });

    const calculatedResults = await Promise.all(calculationPromises);
    results.push(...calculatedResults.filter(r => r !== null) as QuoteResult[]);

    // Ordenar por valor
    results.sort((a, b) => a.totalValue - b.totalValue);

    // Calcular percentual sobre o menor valor
    if (results.length > 0) {
      const lowestValue = results[0].totalValue;
      results[0].isNominated = true;

      results.forEach((result, index) => {
        if (index === 0) {
          result.percentageAboveLowest = 0;
        } else {
          result.percentageAboveLowest = ((result.totalValue - lowestValue) / lowestValue) * 100;
        }
      });
    }

    const totalTime = performance.now() - startTime;


    // Salvar histórico com UUIDs corretos
    await this.saveQuoteHistory({
      ...params,
      originCityId: originCityId, // Pode ser código IBGE ou UUID
      destinationCityId: cityId, // Passar UUID da cidade, não código IBGE
      destinationCityIBGE: destinationCityId, // Manter código IBGE original para fallback
      results,
      userId,
      userName,
      userEmail
    });

    return results;
  },

  async saveQuoteHistory(data: any): Promise<void> {


    try {
      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {

        return;
      }

      const userData = JSON.parse(savedUser);
      const { organization_id, environment_id, codigo, nome, email } = userData;

      if (!organization_id || !environment_id) {

        return;
      }



      const bestCarrier = data.results.length > 0 ? data.results[0] : null;

      let originCityUUID: string | null = null;
      let destinationCityUUID: string | null = null;
      let establishmentUUID = null;

      // Verificar se originCityId já é UUID ou código IBGE
      if (data.originCityId) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.originCityId);
        if (isUUID) {
          originCityUUID = data.originCityId;
        } else {
          const { data: originCity } = await supabase
            .from('cities')
            .select('id')
            .eq('codigo_ibge', data.originCityId)
            .maybeSingle();
          originCityUUID = originCity?.id || null;
        }
      }

      // Verificar se destinationCityId já é UUID ou código IBGE
      if (data.destinationCityId) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.destinationCityId);
        if (isUUID) {
          destinationCityUUID = data.destinationCityId;
        } else if (data.destinationCityIBGE) {
          // Usar o código IBGE original se disponível
          const { data: destCity } = await supabase
            .from('cities')
            .select('id')
            .eq('codigo_ibge', data.destinationCityIBGE)
            .maybeSingle();
          destinationCityUUID = destCity?.id || null;
        } else {
          const { data: destCity } = await supabase
            .from('cities')
            .select('id')
            .eq('codigo_ibge', data.destinationCityId)
            .maybeSingle();
          destinationCityUUID = destCity?.id || null;
        }
      }

      if (data.establishmentId) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.establishmentId);
        if (isUUID) {
          establishmentUUID = data.establishmentId;
        } else {
          const { data: establishment } = await supabase
            .from('establishments')
            .select('id')
            .eq('codigo', data.establishmentId)
            .maybeSingle();
          establishmentUUID = establishment?.id;
        }
      }

      // Buscar o UUID do usuário pelo email e formatar nome do usuário
      let validUserId = null;
      let userDisplayName = null;

      const userEmailToSearch = data.userEmail || email;
      if (userEmailToSearch) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id, codigo, nome')
          .eq('email', userEmailToSearch)
          .maybeSingle();

        if (userByEmail) {
          validUserId = userByEmail.id;
          // Formatar: 0000-Nome Completo
          const userCode = userByEmail.codigo?.padStart(4, '0') || '0000';
          userDisplayName = `${userCode}-${userByEmail.nome}`;
        }
      }

      // Se não encontrou por email, tentar usar os dados do localStorage
      if (!validUserId && codigo && nome) {
        const { data: userByCodigo } = await supabase
          .from('users')
          .select('id')
          .eq('codigo', codigo)
          .maybeSingle();

        if (userByCodigo) {
          validUserId = userByCodigo.id;
          const userCode = codigo.padStart(4, '0');
          userDisplayName = `${userCode}-${nome}`;
        }
      }

      const insertData = {
        organization_id,
        environment_id,
        user_id: validUserId,
        user_display_name: userDisplayName,
        establishment_id: establishmentUUID,
        business_partner_id: data.businessPartnerId || null,
        origin_city_id: originCityUUID,
        destination_city_id: destinationCityUUID,
        origin_zip_code: data.originZipCode?.replace(/\D/g, '') || null,
        destination_zip_code: data.destinationZipCode?.replace(/\D/g, '') || null,
        weight: data.weight || 0,
        volume_qty: data.volumeQty || 1,
        cubic_meters: data.cubicMeters && data.cubicMeters > 0 ? data.cubicMeters : null,
        cargo_value: data.cargoValue || 0,
        quote_results: data.results || [],
        best_carrier_id: bestCarrier?.carrierId || null,
        best_carrier_value: bestCarrier?.totalValue || null,
        delivery_days: bestCarrier?.deliveryDays || null,
        delivery_deadline: bestCarrier?.deliveryDeadline || null,
        selected_modals: data.selectedModals || ['rodoviario', 'aereo', 'aquaviario', 'ferroviario']
      };



      const { data: insertedData, error } = await supabase
        .from('freight_quotes_history')
        .insert(insertData)
        .select();

      if (error) {


        throw new Error(`Falha ao salvar histórico: ${error.message}`);
      } else {

      }
    } catch (error) {

      throw error;
    }
  },

  async getHistory(userId?: string, limit = 50): Promise<FreightQuoteHistory[]> {
    const savedUser = localStorage.getItem('tms-user');
    if (!savedUser) {

      return [];
    }

    const userData = JSON.parse(savedUser);
    const { organization_id, environment_id } = userData;

    if (!organization_id || !environment_id) {

      return [];
    }

    const { data, error } = await supabase
      .from('freight_quotes_history')
      .select(`
        *,
        business_partners (
          id,
          nome_fantasia
        ),
        users (
          id,
          codigo,
          nome,
          email
        ),
        origin_city:origin_city_id (
          id,
          nome,
          states:state_id (
            sigla
          )
        ),
        destination_city:destination_city_id (
          id,
          nome,
          states:state_id (
            sigla
          )
        )
      `)
      .eq('organization_id', organization_id)
      .eq('environment_id', environment_id)
      .order('quote_number', { ascending: false })
      .limit(limit);

    if (error) {

      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }


    return data || [];
  }
};
