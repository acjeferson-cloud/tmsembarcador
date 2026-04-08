import { supabase } from '../lib/supabase';
import { FreightRate, FreightRateDetail } from './freightRatesService';
import { CTeWithRelations, CTeCarrierCost } from './ctesCompleteService';

interface InvoiceData {
  weight: number;
  value: number;
  volume?: number;
  m3?: number;
}

interface AdditionalFee {
  id: string;
  fee_type: 'TDA' | 'TDE' | 'TRT' | 'TEC';
  fee_value: number;
  value_type: 'fixed' | 'percent_weight' | 'percent_value' | 'percent_weight_value' | 'percent_cte';
  minimum_value: number;
}

interface CalculationResult {
  fretePeso: number;
  freteValor: number;
  gris: number;
  pedagio: number;
  tas: number;
  seccat: number;
  despacho: number;
  itr: number;
  coletaEntrega: number;
  tda: number;
  tde: number;
  trt: number;
  tec: number;
  outrosValores: number;
  icmsBase: number;
  icmsAliquota: number;
  icmsValor: number;
  valorTotal: number;
  tarifaUtilizada?: FreightRate;
  faixaUtilizada?: FreightRateDetail;
}

export const freightCostCalculator = {
  /**
   * Calcula o custo total do frete baseado nos dados do CT-e
   */
  async calculateCTeCost(cte: CTeWithRelations): Promise<CalculationResult> {
    // 1. Identificar o transportador
    const carrierId = cte.carrier_id;
    if (!carrierId) {
      throw new Error('Transportador não identificado no CT-e');
    }

    // 2. Buscar tabelas de frete vigentes
    const freightTables = await this.findActiveFreightTables(carrierId, cte.issue_date);
    if (!freightTables || freightTables.length === 0) {
      throw new Error('Nenhuma tabela de frete ativa encontrada para este transportador');
    }

    // 3. Identificar cidade de destino
    const destinationCity = cte.recipient_city;
    const destinationState = cte.recipient_state;
    if (!destinationCity || !destinationState) {
      throw new Error('Cidade de destino não identificada no CT-e');
    }

    // 4. Buscar tarifa vinculada à cidade em todas as tabelas ativas
    let tariff = null;
    let matchedTableId = null;

    for (const table of freightTables) {
      const cityTariff = await this.findTariffByCity(table.id, destinationCity, destinationState);
      if (cityTariff) {
        tariff = cityTariff;
        matchedTableId = table.id;
        break;
      }
    }

    if (!tariff || !matchedTableId) {
      throw new Error(`Nenhuma tarifa encontrada para a cidade ${destinationCity}-${destinationState}`);
    }

    // 5. Coletar dados das notas fiscais
    const invoiceData = this.extractInvoiceData(cte);

    // 6. Buscar taxas adicionais aplicáveis
    let additionalFees: AdditionalFee[] = [];

    // Primeiro, buscar o state_id da cidade de destino
    const { data: stateData, error: stateError } = await supabase
      .from('states')
      .select('id')
      .eq('sigla', destinationState)
      .maybeSingle();

    if (stateData) {
      const { data: cityData } = await supabase
        .from('cities')
        .select('id')
        .eq('state_id', stateData.id)
        .ilike('nome', destinationCity)
        .maybeSingle();

      if (cityData) {
        additionalFees = await this.findAdditionalFees(
          matchedTableId,
          cityData.id,
          stateData.id,
          cte.sender_id // ID do parceiro de negócios (remetente)
        );
      }
    }

    // 7. Calcular todas as taxas
    return this.performCalculation(tariff, invoiceData, cte, additionalFees);
  },

  /**
   * Busca as tabelas de frete ativas para o transportador na data especificada
   */
  async findActiveFreightTables(carrierId: string, issueDate?: string): Promise<{ id: string }[] | null> {
    const dateToCheck = issueDate ? new Date(issueDate).toISOString() : new Date().toISOString();

    const { data, error } = await supabase
      .from('freight_rate_tables')
      .select('id, nome, data_inicio, data_fim')
      .eq('transportador_id', carrierId)
      .eq('status', 'ativo')
      .lte('data_inicio', dateToCheck)
      .gte('data_fim', dateToCheck)
      .order('data_inicio', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Busca taxas adicionais aplicáveis baseadas na cidade, estado e parceiro de negócios
   */
  async findAdditionalFees(
    tableId: string,
    cityId: string,
    stateId: string,
    businessPartnerId?: string
  ): Promise<AdditionalFee[]> {
    try {






      const { data: fees, error } = await supabase
        .from('freight_rate_additional_fees')
        .select('*')
        .eq('freight_rate_table_id', tableId)
        .is('freight_rate_id', null);

      if (error) throw error;
      if (!fees || fees.length === 0) {

        return [];
      }

      // Filtrar taxas aplicáveis seguindo ordem de prioridade:
      // 1. Específica para cidade + parceiro
      // 2. Específica para cidade (sem parceiro)
      // 3. Específica para estado + parceiro
      // 4. Específica para estado (sem parceiro)
      // 5. Genérica para parceiro (sem localização)
      // 6. Genérica (sem parceiro e sem localização)

      const applicableFees = fees.filter(fee => {
        // Se tem parceiro especificado na taxa, deve ser do mesmo parceiro (ou considerar raiz CNPJ)
        if (fee.business_partner_id) {
          if (!businessPartnerId) return false;

          if (fee.consider_cnpj_root) {
            // TODO: Implementar lógica de raiz CNPJ se necessário
            // Por enquanto, comparação exata
            if (fee.business_partner_id !== businessPartnerId) return false;
          } else {
            if (fee.business_partner_id !== businessPartnerId) return false;
          }
        }

        // Se tem cidade especificada na taxa, deve ser a mesma cidade
        if (fee.city_id && fee.city_id !== cityId) return false;

        // Se tem estado especificado na taxa, deve ser o mesmo estado
        if (fee.state_id && fee.state_id !== stateId) return false;

        return true;
      });


      applicableFees.forEach(fee => {

      });

      return applicableFees;
    } catch (error) {

      return [];
    }
  },

  /**
   * Busca a tarifa vinculada a uma cidade específica
   */
  async findTariffByCity(
    tableId: string,
    cityName: string,
    stateAbbr: string
  ): Promise<FreightRate | null> {
    // Normalizar nome da cidade (remover acentos e converter para maiúsculas)
    const normalizedCityName = this.normalizeString(cityName);

    // Buscar estado para pegar o state_id
    const { data: stateData } = await supabase
      .from('states')
      .select('id')
      .eq('sigla', stateAbbr)
      .maybeSingle();

    if (!stateData) return null;

    // Buscar cidade no cadastro usando busca case-insensitive e sem acentos
    const { data: cities, error: cityError } = await supabase
      .from('cities')
      .select('id, nome')
      .eq('state_id', stateData.id);

    if (cityError) throw cityError;
    if (!cities || cities.length === 0) return null;

    // Encontrar a cidade que corresponde (ignorando acentos e case)
    const city = cities.find(c =>
      this.normalizeString(c.nome) === normalizedCityName
    );

    if (!city) return null;

    // Buscar tarifa vinculada à cidade
    const { data: rateCity, error: rateCityError } = await supabase
      .from('freight_rate_cities')
      .select('freight_rate_id')
      .eq('freight_rate_table_id', tableId)
      .eq('city_id', city.id)
      .maybeSingle();

    if (rateCityError) throw rateCityError;
    if (!rateCity) return null;

    // Buscar dados completos da tarifa
    const { data: rate, error: rateError } = await supabase
      .from('freight_rates')
      .select('*')
      .eq('id', rateCity.freight_rate_id)
      .single();

    if (rateError) throw rateError;

    // Buscar detalhes/faixas da tarifa
    const { data: details, error: detailsError } = await supabase
      .from('freight_rate_details')
      .select('*')
      .eq('freight_rate_id', rate.id)
      .order('ordem', { ascending: true });

    if (detailsError) throw detailsError;

    return { ...rate, detalhes: details || [] };
  },

  /**
   * Extrai dados consolidados das notas fiscais do CT-e
   */
  extractInvoiceData(cte: CTeWithRelations): InvoiceData {
    let totalWeight = 0;
    let totalValue = 0;
    let totalVolume = 0;
    let totalM3 = 0;

    // PRIORIDADE 1: Usar peso para cálculo (maior entre peso real e peso cubado)
    // Se o CT-e tem cargo_weight_for_calculation, usar esse peso
    if (cte.cargo_weight_for_calculation && cte.cargo_weight_for_calculation > 0) {
      totalWeight = parseFloat(cte.cargo_weight_for_calculation.toString());

    }
    // Fallback: usar cargo_weight se não tiver cargo_weight_for_calculation
    else if (cte.cargo_weight && cte.cargo_weight > 0) {
      totalWeight = parseFloat(cte.cargo_weight.toString());

    }
    if (cte.cargo_value && cte.cargo_value > 0) {
      totalValue = parseFloat(cte.cargo_value.toString());

    }
    if (cte.cargo_volume && cte.cargo_volume > 0) {
      totalVolume = parseFloat(cte.cargo_volume.toString());
    }
    if (cte.cargo_m3 && cte.cargo_m3 > 0) {
      totalM3 = parseFloat(cte.cargo_m3.toString());
    }

    // PRIORIDADE 2: Se não tem nos campos diretos, tentar extrair do XML
    if ((totalWeight === 0 || totalValue === 0) && cte.xml_data) {
      const xmlData = typeof cte.xml_data === 'string' ? JSON.parse(cte.xml_data) : cte.xml_data;

      // Tentar extrair peso - PRIORIZAR PESO REAL sobre PESO CUBADO
      if (totalWeight === 0 && xmlData.infCte?.infCarga?.infQ) {
        const infQArray = Array.isArray(xmlData.infCte.infCarga.infQ)
          ? xmlData.infCte.infCarga.infQ
          : [xmlData.infCte.infCarga.infQ];

        // Procurar por PESO REAL primeiro
        let pesoReal = infQArray.find((q: any) =>
          q.tpMed?.toUpperCase().includes('PESO REAL') ||
          q.tpMed?.toUpperCase().includes('REAL')
        );

        // Se não encontrou PESO REAL, pegar qualquer peso (cubado, bruto, etc)
        if (!pesoReal) {
          pesoReal = infQArray.find((q: any) =>
            q.tpMed?.toUpperCase().includes('PESO') &&
            q.cUnid === '01' // Código 01 = KG
          );
        }

        // Se ainda não encontrou, pegar o primeiro com KG
        if (!pesoReal) {
          pesoReal = infQArray.find((q: any) => q.cUnid === '01');
        }

        // Fallback: pegar o primeiro elemento
        if (!pesoReal && infQArray.length > 0) {
          pesoReal = infQArray[0];
        }

        if (pesoReal) {
          totalWeight = parseFloat(pesoReal.qCarga || '0');

        }
      }

      // Tentar extrair valor da nota
      if (totalValue === 0 && xmlData.infCte?.infDoc?.infNFe) {
        const infNFe = Array.isArray(xmlData.infCte.infDoc.infNFe)
          ? xmlData.infCte.infDoc.infNFe
          : [xmlData.infCte.infDoc.infNFe];

        infNFe.forEach((nfe: any) => {
          if (nfe.vNF) {
            totalValue += parseFloat(nfe.vNF);
          }
        });
      }

      // Tentar extrair volume
      if (totalVolume === 0 && xmlData.infCte?.infCarga?.qCarga) {
        totalVolume = parseFloat(xmlData.infCte.infCarga.qCarga);
      }
    }

    // PRIORIDADE 3: Tentar das notas fiscais vinculadas
    if (totalValue === 0 && cte.invoices && cte.invoices.length > 0) {
      cte.invoices.forEach(invoice => {
        totalValue += parseFloat(invoice.cost_value?.toString() || '0');
      });
    }

    // PRIORIDADE 4: FALLBACK - usar cálculo reverso dos valores do CT-e (último recurso)
    if (totalWeight === 0 || totalValue === 0) {




      // Calcular valor da mercadoria a partir do Frete Valor (ad valorem)
      const freteValorCte = parseFloat(cte.freight_value_value?.toString() || '0');
      if (freteValorCte > 0 && totalValue === 0) {
        // Assumir 0,3% como padrão comum
        totalValue = freteValorCte / 0.003;

      }

      // Calcular valor a partir do GRIS
      const grisCte = parseFloat(cte.ademe_gris_value?.toString() || '0');
      if (grisCte > 0 && totalValue === 0) {
        totalValue = grisCte / 0.0015;

      }

      // NÃO estimar peso baseado no frete peso (cria loop circular)
      // Se o peso não foi encontrado, lançar erro
      if (totalWeight === 0) {
        throw new Error('Peso da carga não encontrado. Impossível calcular frete peso.');
      }
    }

    return {
      weight: totalWeight,
      value: totalValue,
      volume: totalVolume,
      m3: totalM3
    };
  },

  /**
   * Calcula o valor de uma taxa adicional
   */
  calculateAdditionalFeeValue(
    fee: AdditionalFee,
    fretePeso: number,
    freteValor: number,
    valorMercadoria: number,
    valorCTe: number
  ): number {
    let calculated = 0;

    switch (fee.value_type) {
      case 'fixed':
        calculated = fee.fee_value;
        break;
      case 'percent_weight':
        calculated = (fretePeso * fee.fee_value) / 100;
        break;
      case 'percent_value':
        calculated = (freteValor * fee.fee_value) / 100;
        break;
      case 'percent_weight_value':
        calculated = ((fretePeso + freteValor) * fee.fee_value) / 100;
        break;
      case 'percent_cte':
        calculated = (valorCTe * fee.fee_value) / 100;
        break;
    }

    return Math.max(calculated, fee.minimum_value || 0);
  },

  /**
   * Executa todos os cálculos de custo
   */
  performCalculation(
    tariff: FreightRate,
    invoiceData: InvoiceData,
    cte: CTeWithRelations | null,
    additionalFees: AdditionalFee[] = []
  ): CalculationResult {
    // Calcular o Peso Considerado (Priorizar o maior entre Regra de Cubagem e Peso Real)
    let pesoConsiderado = invoiceData.weight;
    let pesoCubado = 0;
    
    if (tariff.fator_m3 && tariff.fator_m3 > 0 && invoiceData.m3 && invoiceData.m3 > 0) {
      pesoCubado = invoiceData.m3 * tariff.fator_m3;
      if (pesoCubado > pesoConsiderado) {
        pesoConsiderado = pesoCubado;
      }
    }

    // Identificar a faixa de peso aplicável usando o pesoConsiderado
    const weightRange = this.findWeightRange(tariff.detalhes || [], pesoConsiderado);

    // Verificar se a faixa tem tipo_taxa = "sem_taxas"
    const semTaxas = weightRange?.tipo_taxa === 'sem_taxas';

    // 1. FRETE PESO (arredondar individualmente)
    const fretePeso = this.roundValue(this.calculateFretePeso(weightRange, pesoConsiderado, tariff));

    // 2. FRETE VALOR (arredondar individualmente)
    const freteValor = this.roundValue(this.calculateFreteValor(weightRange, invoiceData.value, tariff));

    // Se tipo_taxa = "sem_taxas", NÃO calcular as taxas abaixo
    // 3. GRIS (arredondar individualmente)
    const gris = this.roundValue(semTaxas ? 0 : this.calculateGris(invoiceData.value, tariff));

    // 4. PEDÁGIO (arredondar individualmente)
    const pedagio = this.roundValue(semTaxas ? 0 : this.calculatePedagio(pesoConsiderado, tariff));

    // 5. TAS (arredondar individualmente)
    const tas = this.roundValue(semTaxas ? 0 : (tariff.tas || 0));

    // 6. SECCAT (arredondar individualmente)
    const seccat = this.roundValue(semTaxas ? 0 : (tariff.seccat || 0));

    // 7. DESPACHO (arredondar individualmente)
    const despacho = this.roundValue(semTaxas ? 0 : (tariff.despacho || 0));

    // 8. ITR (arredondar individualmente)
    const itr = this.roundValue(semTaxas ? 0 : (tariff.itr || 0));

    // 9. COLETA/ENTREGA (arredondar individualmente)
    const coletaEntrega = this.roundValue(semTaxas ? 0 : (tariff.coleta_entrega || 0));

    // 9.1 TAXA ADICIONAL (da tabela)
    const taxaAdicional = this.roundValue(semTaxas ? 0 : (tariff.taxa_adicional || 0));

    // 10. TAXAS ADICIONAIS (TDA, TDE, TRT) - arredondar individualmente
    let tda = 0;
    let tde = 0;
    let trt = 0;
    let tec = 0;

    if (!semTaxas && additionalFees.length > 0) {


      // O valor do CT-e para cálculo percentual é a soma do frete peso + frete valor
      const valorCTeParaCalculo = fretePeso + freteValor;

      additionalFees.forEach(fee => {
        const feeValue = this.roundValue(
          this.calculateAdditionalFeeValue(
            fee,
            fretePeso,
            freteValor,
            invoiceData.value,
            valorCTeParaCalculo
          )
        );

        switch (fee.fee_type) {
          case 'TDA':
            tda += feeValue;

            break;
          case 'TDE':
            tde += feeValue;

            break;
          case 'TRT':
            trt += feeValue;

            break;
          case 'TEC':
            tec += feeValue;

            break;
        }
      });





    }

    // 11. BASE DE CÁLCULO (sem outros valores) - somar valores já arredondados
    const baseCalculo = this.roundValue(fretePeso + freteValor + gris + pedagio + tas + seccat +
                        despacho + itr + coletaEntrega + tda + tde + trt + tec + taxaAdicional);

    // 13. ICMS - Calcular ANTES de "outros valores"
    const icmsAliquota = parseFloat(tariff.aliquota_icms?.toString() || '0');
    const icmsEmbutido = tariff.icms_embutido_tabela === 'embutido';
    let icmsBase = 0;
    let icmsValor = 0;
    let outrosValores = 0;
    let baseFrete = 0;






    if (icmsAliquota > 0) {
      if (icmsEmbutido) {
        // ICMS EMBUTIDO: "Outros Valores" é calculado como percentual
        // 11. OUTROS VALORES (calcular percentual sobre base de cálculo e arredondar)
        outrosValores = this.roundValue(semTaxas ? 0 : this.calculateOutrosValores(baseCalculo, tariff));

        // 12. BASE DO FRETE (antes do ICMS)
        baseFrete = this.roundValue(baseCalculo + outrosValores);

        // ICMS embutido: calcular o valor COM ICMS a partir do valor SEM ICMS
        const valorComICMS = baseFrete / (1 - (icmsAliquota / 100));
        icmsBase = this.roundValue(valorComICMS);
        icmsValor = this.roundValue(valorComICMS - baseFrete);
      } else {
        // ICMS NÃO EMBUTIDO: Calcula Gross-Up nativame sem sobrepor 'outrosValores'
        outrosValores = this.roundValue(semTaxas ? 0 : this.calculateOutrosValores(baseCalculo, tariff));
        baseFrete = this.roundValue(baseCalculo + outrosValores);
        
        // ICMS calculado sobre a base
        const valorComICMS = baseFrete / (1 - (icmsAliquota / 100));
        icmsBase = this.roundValue(valorComICMS);
        icmsValor = this.roundValue(valorComICMS - baseFrete);
      }
    } else {
      // Sem ICMS: calcular "outros valores" normalmente
      outrosValores = this.roundValue(semTaxas ? 0 : this.calculateOutrosValores(baseCalculo, tariff));
      baseFrete = this.roundValue(baseCalculo + outrosValores);
      icmsBase = baseFrete;
    }

    // 14. VALOR TOTAL
    const valorTotal = icmsAliquota > 0 ? icmsBase : baseFrete;























    return {
      fretePeso,
      freteValor,
      gris,
      pedagio,
      tas,
      seccat,
      despacho,
      itr,
      coletaEntrega,
      tda,
      tde,
      trt,
      tec,
      taxaAdicional,
      outrosValores,
      icmsBase,
      icmsAliquota,
      icmsValor,
      valorTotal,
      tarifaUtilizada: tariff,
      faixaUtilizada: weightRange
    };
  },

  /**
   * Identifica a faixa de peso aplicável
   */
  findWeightRange(details: FreightRateDetail[], weight: number): FreightRateDetail | undefined {
    if (!details || details.length === 0) return undefined;

    // Ordenar por ordem crescente
    const sortedDetails = [...details].sort((a, b) => a.ordem - b.ordem);

    // Encontrar a faixa onde o peso se encaixa
    for (const detail of sortedDetails) {
      if (weight <= detail.peso_ate) {
        return detail;
      }
    }

    // Se não encontrou nenhuma faixa, usar a última
    return sortedDetails[sortedDetails.length - 1];
  },

  /**
   * Calcula o frete peso
   */
  calculateFretePeso(
    weightRange: FreightRateDetail | undefined,
    weight: number,
    tariff: FreightRate
  ): number {
    if (!weightRange) return tariff.frete_peso_minimo || 0;

    const valorFaixa = weightRange.valor_faixa || 0;
    const freteMinimo = weightRange.frete_minimo || tariff.frete_peso_minimo || 0;
    const tipoCalculo = weightRange.tipo_calculo || 'valor_faixa';

    let calculated = valorFaixa;







    // Se o tipo de cálculo for "excedente", aplicar a regra de cálculo específica
    if (tipoCalculo === 'excedente') {
      // Encontrar a faixa anterior para pegar o valor base
      const allDetails = (tariff.detalhes || []).sort((a, b) => a.ordem - b.ordem);
      const currentIndex = allDetails.findIndex(d => d.ordem === weightRange.ordem);

      if (currentIndex > 0) {
        // Faixas intermediárias ou superiores: calcular excedente
        const previousRange = allDetails[currentIndex - 1];
        const valorBase = previousRange.valor_faixa || 0;
        const pesoAnterior = previousRange.peso_ate || 0;
        const pesoExcedente = weight - pesoAnterior;
        const valorPorKgExcedente = valorFaixa;








        // Fórmula: Valor da faixa anterior + (Peso excedente × Valor por KG excedente)
        calculated = valorBase + (pesoExcedente * valorPorKgExcedente);


      } else {
        // Primeira faixa com tipo excedente: usar valor fixo da faixa
        // NÃO multiplicar pelo peso, pois o valor já representa o custo fixo até esse peso


        calculated = valorFaixa;
      }
    } else if (tipoCalculo === 'multiplicador') {
      const fracaoBase = weightRange.fracao_base || 1;
      const fatorAplicacao = weight / fracaoBase;
      calculated = valorFaixa * fatorAplicacao;
    } else {
      // Tipo "valor_faixa": usar o valor fixo da faixa
      calculated = valorFaixa;
    }

    const resultado = Math.max(calculated, freteMinimo);



    return resultado;
  },

  /**
   * Calcula o frete valor (ad valorem)
   */
  calculateFreteValor(
    weightRange: FreightRateDetail | undefined,
    value: number,
    tariff: FreightRate
  ): number {
    if (!weightRange) return tariff.frete_valor_minimo || 0;

    const percentual = weightRange.frete_valor || 0;
    const freteMinimo = tariff.frete_valor_minimo || 0;

    const calculated = (value * percentual) / 100;
    return Math.max(calculated, freteMinimo);
  },

  /**
   * Calcula o GRIS
   */
  calculateGris(value: number, tariff: FreightRate): number {
    // Garantir que os valores sejam parseados corretamente
    const valorMercadoria = parseFloat(value.toFixed(2));
    const percentual = parseFloat(tariff.percentual_gris?.toString() || '0');
    const grisMinimo = parseFloat(tariff.gris_minimo?.toString() || '0');






    const calculated = (valorMercadoria * percentual) / 100;





    return Math.max(calculated, grisMinimo);
  },

  /**
   * Calcula o pedágio
   */
  calculatePedagio(weight: number, tariff: FreightRate): number {
    const pedagioMinimo = tariff.pedagio_minimo || 0;
    const pedagioPorKg = tariff.pedagio_por_kg || 0;
    const pedagioACadaKg = tariff.pedagio_a_cada_kg || 100; // padrão: a cada 100kg






    if (pedagioPorKg === 0) {

      return pedagioMinimo;
    }

    // Calcular número de frações
    const fracoes = Math.ceil(weight / pedagioACadaKg);
    const calculated = fracoes * pedagioPorKg;







    return Math.max(calculated, pedagioMinimo);
  },

  /**
   * Calcula outros valores (percentual sobre a base de cálculo)
   */
  calculateOutrosValores(baseCalculo: number, tariff: FreightRate): number {
    const percentual = tariff.valor_outros_percent || 0;
    const minimo = tariff.valor_outros_minimo || 0;

    const calculated = (baseCalculo * percentual) / 100;
    return Math.max(calculated, minimo);
  },

  /**
   * Calcula o ICMS
   */
  calculateICMS(base: number, aliquota: number): number {
    return (base * aliquota) / 100;
  },

  /**
   * Arredonda valor para 2 casas decimais
   * Usa toFixed para garantir arredondamento consistente
   */
  roundValue(value: number): number {
    // Usar toFixed para arredondamento padrão (banqueiro)
    return parseFloat(value.toFixed(2));
  },

  /**
   * Salva os custos calculados no banco de dados
   */
  async saveCostsToCTe(cteId: string, calculation: CalculationResult): Promise<void> {
    // Salvar o ID da tarifa utilizada no CT-e
    if (calculation.tarifaUtilizada?.id) {
      const { error: updateError } = await supabase
        .from('ctes_complete')
        .update({ calculated_freight_rate_id: calculation.tarifaUtilizada.id })
        .eq('id', cteId);

      if (updateError) {

      }
    }

    // Deletar custos anteriores
    await supabase
      .from('ctes_carrier_costs')
      .delete()
      .eq('cte_id', cteId);

    // Preparar dados dos custos (outrosValores já vem calculado corretamente)
    const costs: Omit<CTeCarrierCost, 'id'>[] = [
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







    // Inserir novos custos
    const { error } = await supabase
      .from('ctes_carrier_costs')
      .insert(costs);

    if (error) throw error;



    // Atualizar o valor total no CT-e (não sobrescrever o valor original do XML)
    // O valor calculado será mostrado na comparação
  },

  /**
   * Normaliza string para comparação (remove acentos, espaços extras e converte para maiúsculas)
   */
  normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }
};
