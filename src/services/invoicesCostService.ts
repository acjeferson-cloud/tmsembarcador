import { supabase } from '../lib/supabase';
import { freightCostCalculator } from './freightCostCalculator';

export interface InvoiceCarrierCost {
  id?: string;
  invoice_id: string;
  carrier_id: string;
  carrier_name: string;
  carrier_document: string;
  freight_table_id?: string;
  tariff_code?: string;
  freight_type: string;
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
  calculation_data?: any;
  observations?: string;
}

interface InvoiceData {
  weight: number;
  value: number;
  volume?: number;
  m3?: number;
  destinationCity: string;
  destinationState: string;
  issueDate?: string;
}

export const invoicesCostService = {
  /**
   * Busca os custos de uma nota fiscal por transportador
   */
  async getInvoiceCosts(invoiceId: string): Promise<InvoiceCarrierCost[]> {
    try {
      const { data, error } = await supabase
        .from('invoices_nfe_carrier_costs')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  /**
   * Calcula os custos para uma nota fiscal usando o MESMO motor do CT-e
   */
  async calculateInvoiceCost(
    invoiceData: InvoiceData,
    carrierId: string,
    issueDate?: string
  ) {





    // Criar um objeto CT-e mockado para usar o motor de cálculo existente
    const mockCte = {
      carrier_id: carrierId,
      issue_date: issueDate,
      recipient_city: invoiceData.destinationCity,
      recipient_state: invoiceData.destinationState,
      cargo_weight: invoiceData.weight,
      cargo_value: invoiceData.value,
      cargo_volume: invoiceData.volume || 0,
      cargo_m3: invoiceData.m3 || 0,
      icms_rate: 12.0, // Padrão
      icms_value: 0,
    };



    // Usar o motor de cálculo do CT-e (mesma lógica exata)
    const calculation = await freightCostCalculator.calculateCTeCost(mockCte as any);



    return calculation;
  },

  /**
   * Busca dados do transportador
   */
  async getCarrierData(carrierId: string): Promise<any> {
    const { data, error } = await supabase
      .from('carriers')
      .select('id, codigo, razao_social, cnpj')
      .eq('id', carrierId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Salva os custos calculados no banco de dados
   */
  async saveCostsToInvoice(
    invoiceId: string,
    carrierId: string,
    calculation: any,
    carrierData: any,
    freightType: string = 'CIF'
  ): Promise<void> {





    // Calcular PIS e COFINS sobre a base
    const baseCalculo = calculation.fretePeso + calculation.freteValor +
                        calculation.gris + calculation.pedagio +
                        calculation.tas + calculation.seccat +
                        calculation.despacho + calculation.itr +
                        calculation.coletaEntrega;

    const pisValor = freightCostCalculator.roundValue((baseCalculo * 1.65) / 100);
    const cofinsValor = freightCostCalculator.roundValue((baseCalculo * 7.6) / 100);

    const cost: Omit<InvoiceCarrierCost, 'id'> = {
      invoice_id: invoiceId,
      carrier_id: carrierId,
      carrier_name: carrierData.razao_social,
      carrier_document: carrierData.cnpj,
      freight_type: freightType,
      freight_weight_value: calculation.fretePeso,
      freight_value_value: calculation.freteValor,
      seccat_value: calculation.seccat,
      dispatch_value: calculation.despacho,
      ademe_gris_value: calculation.gris,
      itr_value: calculation.itr,
      tas_value: calculation.tas,
      collection_delivery_value: calculation.coletaEntrega,
      other_tax_value: 0,
      toll_value: calculation.pedagio,
      icms_rate: calculation.icmsAliquota,
      icms_base: calculation.icmsBase,
      icms_value: calculation.icmsValor,
      pis_value: pisValor,
      cofins_value: cofinsValor,
      other_value: calculation.outrosValores,
      total_value: calculation.valorTotal,
      tariff_code: calculation.tarifaUtilizada?.codigo,
      freight_table_id: calculation.tarifaUtilizada?.tabela_id,
      calculation_data: {
        tariff: calculation.tarifaUtilizada,
        weightRange: calculation.faixaUtilizada,
        calculatedAt: new Date().toISOString(),
        calculationMethod: 'freightCostCalculator (same as CTE)',
      },
    };



    const { error } = await supabase.from('invoices_nfe_carrier_costs').insert(cost);

    if (error) {

      throw error;
    }


  },
};
