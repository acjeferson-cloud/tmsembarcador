import { supabase } from '../lib/supabase';
import { FlatFreightRateTemplate } from './templateService';
import { FreightRateTable, FreightRateDetail, FreightRate } from './freightRatesService';

export interface ParseResult {
  success: boolean;
  errors: string[];
  tables?: Omit<FreightRateTable, 'id'>[];
  rates?: Omit<FreightRate, 'id'>[];
  details?: Omit<FreightRateDetail, 'id'>[];
}

export const parseBulkFreightRates = async (
  flatData: FlatFreightRateTemplate[],
  tenantContext: { organization_id: string; environment_id: string; establishment_id: string; created_by: string }
): Promise<ParseResult> => {
  const errors: string[] = [];

  if (!flatData || flatData.length === 0) {
    return { success: false, errors: ['A planilha está vazia.'] };
  }

  // Validar obrigatoriedade na primeira linha
  const baseHeaders = ['cnpj_transportador', 'nome_tabela', 'modal', 'validade_inicio', 'validade_fim', 'origem_uf', 'destino_uf', 'prazo_entrega', 'faixa_peso_ate', 'valor_faixa', 'tipo_calculo'];
  for (const header of baseHeaders) {
    if (flatData[0][header as keyof FlatFreightRateTemplate] === undefined) {
      errors.push(`Coluna obrigatória ausente: ${header}`);
    }
  }

  if (errors.length > 0) return { success: false, errors };

  // 1. Traduzir CNPJs transportador => UUIDs no business_partners
  const uniqueCnpjs = [...new Set(flatData.map(r => r.cnpj_transportador).filter(Boolean))];
  const { data: partnersData, error: partnersError } = await supabase
    .from('business_partners')
    .select('id, tax_id')
    .in('tax_id', uniqueCnpjs)
    .eq('organization_id', tenantContext.organization_id);

  if (partnersError) {
    return { success: false, errors: ['Erro ao validar Transportadores no banco de dados.'] };
  }

  const cnpjMap = new Map<string, string>();
  partnersData?.forEach(p => {
    // tax_id usually stores unformatted CNPJ, ensure comparison is clean
    const cleanDb = p.tax_id.replace(/\D/g, '');
    uniqueCnpjs.forEach(cnpj => {
      if (cnpj.replace(/\D/g, '') === cleanDb) {
        cnpjMap.set(cnpj, p.id);
      }
    });
  });

  // Validar se todos os transportadores existem
  const missingCarriers = new Set<string>();
  uniqueCnpjs.forEach(cnpj => {
    if (!cnpjMap.has(cnpj)) missingCarriers.add(cnpj);
  });

  if (missingCarriers.size > 0) {
    errors.push(`Não encontramos Transportadores com os seguintes CNPJs: ${Array.from(missingCarriers).join(', ')}`);
    return { success: false, errors };
  }

  // Agrupamento hierárquico
  const defaultStatus = 'ativo';

  const tablesMap = new Map<string, any>(); // key: nome_tabela + cnpj
  const ratesMap = new Map<string, any>();  // key: tableKey + origem + destino
  const detailsList: any[] = [];

  flatData.forEach((row, index) => {
    const rowNum = index + 2; // +1 pro array 0, +1 pro header
    
    // Tratamento de datas
    const [dIn, mIn, yIn] = String(row.validade_inicio || '').split('/');
    const dateInicio = new Date(`${yIn}-${mIn}-${dIn}T00:00:00Z`).toISOString();
    const [dFim, mFim, yFim] = String(row.validade_fim || '').split('/');
    const dateFim = new Date(`${yFim}-${mFim}-${dFim}T23:59:59Z`).toISOString();

    const carrierId = cnpjMap.get(row.cnpj_transportador);

    // 1. Capa
    const tableKey = `${row.nome_tabela}_${carrierId}`;
    if (!tablesMap.has(tableKey)) {
      tablesMap.set(tableKey, {
        nome: row.nome_tabela,
        transportador_id: carrierId,
        modal: row.modal,
        data_inicio: dateInicio,
        data_fim: dateFim,
        status: defaultStatus,
        table_type: 'Saída', // Assumido default
        organization_id: tenantContext.organization_id,
        environment_id: tenantContext.environment_id,
        establishment_id: tenantContext.establishment_id,
        created_by: tenantContext.created_by,
      });
    }

    // 2. Tarifa (Rate)
    const rateKey = `${tableKey}_${row.origem_uf}_${row.destino_uf}_${row.destino_cidade || ''}`;
    if (!ratesMap.has(rateKey)) {
      ratesMap.set(rateKey, {
        _tableKey: tableKey,
        codigo: `ROT${rowNum}`, // Simplificação: a primeira linha da rota define o código
        descricao: `${row.origem_uf} para ${row.destino_cidade || row.destino_uf}`,
        tipo_aplicacao: row.destino_cidade ? 'cidade' : 'estado',
        prazo_entrega: Number(row.prazo_entrega) || 0,
        pedagio_minimo: 0,
        pedagio_por_kg: Number(row.pedagio_valor) && Number(row.pedagio_fracao) ? Number(row.pedagio_valor) / Number(row.pedagio_fracao) : 0,
        pedagio_a_cada_kg: Number(row.pedagio_fracao) || 0,
        pedagio_tipo_kg: row.pedagio_fracao ? 'peso_cálculo' : null,
        percentual_gris: Number(row.gris_percentual) || 0,
        despacho: Number(row.taxa_despacho) || 0,
        valor_total_minimo: Number(row.frete_minimo) || 0,
        _origem: row.origem_uf,
        _destino: row.destino_uf,
        _destino_cidade: row.destino_cidade
      });
    }

    // 3. Faixas (Details)
    let peso_ate = Number(row.faixa_peso_ate);
    if (isNaN(peso_ate) || peso_ate > 99000) peso_ate = 999999;

    detailsList.push({
      _rateKey: rateKey,
      peso_ate: peso_ate,
      valor_faixa: Number(row.valor_faixa) || 0,
      tipo_calculo: row.tipo_calculo,
      tipo_frete: 'Peso',
      m3_ate: 0,
      volume_ate: 0,
      valor_ate: 0,
      frete_valor: 0,
      frete_minimo: 0,
      tipo_taxa: 'com_taxas',
      taxa_minima: 0,
      ordem: detailsList.filter(d => d._rateKey === rateKey).length + 1
    });
  });

  return {
    success: true,
    errors: [],
    tables: Array.from(tablesMap.values()),
    rates: Array.from(ratesMap.values()),
    details: detailsList
  };
};
