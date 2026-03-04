import { supabase } from '../lib/supabase';
import { changeLogsService } from './changeLogsService';
import { BrazilianCity } from '../types/cities';

interface CityDBRecord {
  id: string;
  state_id?: string;
  codigo_ibge?: string;
  nome: string;
  latitude?: number;
  longitude?: number;
  populacao?: number;
  area_km2?: number;
  ativo?: boolean;
  created_at: string;
  updated_at: string;
}

const formatZipCode = (zip: string): string => {
  const cleaned = zip.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return zip;
};

const dbRecordToCity = (record: CityDBRecord, stateName?: string, stateAbbr?: string, region?: string): BrazilianCity => {
  // GARANTIR que TODOS os campos obrigatórios estejam preenchidos
  if (!stateName || !stateAbbr || !region) {
    console.warn('⚠️ [CITY CONVERT] Missing required fields:', {
      cityName: record.nome,
      stateName,
      stateAbbr,
      region
    });
  }

  return {
    id: record.id,
    name: record.nome,
    ibgeCode: record.codigo_ibge || '',
    stateId: record.state_id,
    stateName: stateName || 'ESTADO NÃO INFORMADO',
    stateAbbreviation: stateAbbr || 'XX',
    region: region || 'REGIÃO NÃO INFORMADA',
    type: 'cidade',
    zipCodeStart: '',
    zipCodeEnd: '',
    zipCodeRanges: null
  };
};

const cityToDbRecord = async (city: BrazilianCity, stateId?: string) => {
  let finalStateId = stateId || city.stateId;

  // Se não tiver state_id mas tiver stateAbbreviation, buscar na tabela states
  if (!finalStateId && city.stateAbbreviation) {
    const { data: stateData } = await supabase
      .from('states')
      .select('id')
      .eq('sigla', city.stateAbbreviation)
      .maybeSingle();

    if (stateData) {
      finalStateId = stateData.id;
      console.log('🔍 [cityToDbRecord] Found state_id by abbreviation:', city.stateAbbreviation, '→', finalStateId);
    }
  }

  return {
    nome: city.name,
    codigo_ibge: city.ibgeCode,
    state_id: finalStateId || null,
    ativo: true
  };
};

export const citiesService = {
  async getAll() {
    console.log('🏙️ [CITIES] Starting query...');
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('nome', { ascending: true })
        .limit(100);

      if (error) {
        console.error('❌ [CITIES] Error:', error);
        throw error;
      }

      console.log(`✅ [CITIES] Found: ${data?.length || 0}`);
      return data || [];
    } catch (error) {
      console.error('❌ [CITIES] Exception:', error);
      return [];
    }
  }
};

export const fetchCities = async (
  page = 1,
  pageSize = 20,
  filters: {
    searchTerm?: string,
    stateFilter?: string,
    regionFilter?: string,
    typeFilter?: string
  } = {}
) => {
  try {
    let query = supabase
      .from('cities')
      .select(`
        *,
        states:state_id (
          sigla,
          nome,
          regiao
        )
      `, { count: 'exact' });

    if (filters?.searchTerm) {
      query = query.or(`nome.ilike.%${filters.searchTerm}%,codigo_ibge.ilike.%${filters.searchTerm}%`);
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end).order('nome', { ascending: true });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      cities: (data || []).map((record: any) =>
        dbRecordToCity(
          record,
          record.states?.nome || '',
          record.states?.sigla || '',
          record.states?.regiao || ''
        )
      ),
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Error fetching cities:', error);
    return { cities: [], totalCount: 0 };
  }
};

export const fetchCityById = async (id: string | number) => {
  try {
    console.log('🏙️ [CITY FETCH] Fetching by ID:', id);

    // ✅ CORRIGIDO: Adicionar JOIN com states para ter dados completos
    const { data, error } = await supabase
      .from('cities')
      .select(`
        *,
        states:state_id (
          id,
          nome,
          sigla,
          regiao
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('❌ [CITY FETCH] Error:', error);
      throw error;
    }

    if (!data) {
      console.log('⚠️ [CITY FETCH] City not found');
      return null;
    }

    console.log('✅ [CITY FETCH] City found with state:', data);

    // Buscar as faixas de CEP da tabela zip_code_ranges
    const { data: zipRanges, error: zipError } = await supabase
      .from('zip_code_ranges')
      .select('*')
      .eq('city_id', id)
      .order('start_zip', { ascending: true });

    if (zipError) console.error('Error fetching zip ranges:', zipError);

    // Converter as faixas para o formato esperado pelo frontend
    const formattedZipRanges = (zipRanges || []).map(range => ({
      start: formatZipCode(range.start_zip),
      end: formatZipCode(range.end_zip),
      area: range.area || '',
      neighborhood: range.neighborhood || ''
    }));

    // ✅ CORRIGIDO: Converter com dados do state
    const city = dbRecordToCity(
      data,
      data.states?.nome || '',
      data.states?.sigla || '',
      data.states?.regiao || ''
    );

    // Sobrescrever zipCodeRanges com os dados da tabela zip_code_ranges
    city.zipCodeRanges = formattedZipRanges.length > 0 ? formattedZipRanges : city.zipCodeRanges;

    // ✅ NOVO: Calcular Faixa Geral (zipCodeStart e zipCodeEnd) a partir das faixas detalhadas
    if (formattedZipRanges.length > 0) {
      const allZipCodes = formattedZipRanges.flatMap(r => [r.start.replace(/\D/g, ''), r.end.replace(/\D/g, '')]);
      const minZip = Math.min(...allZipCodes.map(z => parseInt(z)));
      const maxZip = Math.max(...allZipCodes.map(z => parseInt(z)));

      city.zipCodeStart = formatZipCode(minZip.toString().padStart(8, '0'));
      city.zipCodeEnd = formatZipCode(maxZip.toString().padStart(8, '0'));

      console.log('📮 [CITY FETCH] Calculated general range:', {
        zipCodeStart: city.zipCodeStart,
        zipCodeEnd: city.zipCodeEnd,
        basedOn: formattedZipRanges.length + ' ranges'
      });
    }

    return city;
  } catch (error) {
    console.error('Error fetching city by ID:', error);
    return null;
  }
};

export const fetchCityByIbgeCode = async (ibgeCode: string) => {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('ibge_code', ibgeCode)
      .maybeSingle();

    if (error) throw error;
    return data ? dbRecordToCity(data) : null;
  } catch (error) {
    console.error('Error fetching city by IBGE code:', error);
    return null;
  }
};

export const fetchCityByZipCode = async (zipCode: string) => {
  try {
    const cleanZip = zipCode.replace(/\D/g, '');

    console.log('📮 [ZIP SEARCH] Looking for ZIP:', cleanZip);

    // Buscar na tabela zip_code_ranges
    const { data: zipRangeData, error: zipError } = await supabase
      .from('zip_code_ranges')
      .select(`
        *,
        cities!inner (
          *,
          states!inner (
            nome,
            sigla,
            regiao
          )
        )
      `)
      .lte('start_zip', cleanZip)
      .gte('end_zip', cleanZip)
      .limit(1);

    if (zipError) {
      console.error('❌ [ZIP SEARCH] Error:', zipError);
      throw zipError;
    }

    if (!zipRangeData || zipRangeData.length === 0) {
      console.log('❌ [ZIP SEARCH] ZIP not found in ranges');
      return null;
    }

    console.log('✅ [ZIP SEARCH] Found:', zipRangeData[0]);

    const cityData = (zipRangeData[0] as any).cities;
    const city = dbRecordToCity(
      cityData,
      cityData.states?.nome || '',
      cityData.states?.sigla || '',
      cityData.states?.regiao || ''
    );

    // Adicionar informações do bairro se disponível
    if (zipRangeData[0].neighborhood) {
      city.neighborhood = zipRangeData[0].neighborhood;
    }

    return city;
  } catch (error) {
    console.error('❌ [ZIP SEARCH] Exception:', error);
    return null;
  }
};

export const createCity = async (city: Omit<BrazilianCity, 'id'>) => {
  try {
    console.log('🏙️ [CITY CREATE] Starting...', city);

    const cityRecord = await cityToDbRecord(city as BrazilianCity);
    const { data, error } = await supabase
      .from('cities')
      .insert([cityRecord])
      .select()
      .single();

    if (error) {
      console.error('❌ [CITY CREATE] Error:', error);
      throw error;
    }

    console.log('✅ [CITY CREATE] City created:', data);

    // Se houver zipCodeRanges, salvar na tabela zip_code_ranges
    if (city.zipCodeRanges && Array.isArray(city.zipCodeRanges)) {
      console.log('📦 [CITY CREATE] Processing zip ranges:', {
        cityId: data.id,
        rangesCount: city.zipCodeRanges.length
      });

      const zipRangesToInsert = city.zipCodeRanges
        .filter(range => range.start && range.end)
        .map(range => ({
          city_id: data.id,
          start_zip: range.start.replace(/\D/g, ''),
          end_zip: range.end.replace(/\D/g, ''),
          area: range.area || null,
          neighborhood: range.neighborhood || null
        }));

      if (zipRangesToInsert.length > 0) {
        console.log('💾 [CITY CREATE] Saving zip ranges:', zipRangesToInsert);

        const { error: zipError } = await supabase
          .from('zip_code_ranges')
          .insert(zipRangesToInsert);

        if (zipError) {
          console.error('❌ [CITY CREATE] Error saving zip ranges:', zipError);
        } else {
          console.log('✅ [CITY CREATE] Zip ranges saved');
        }
      }
    }

    return dbRecordToCity(data);
  } catch (error) {
    console.error('❌ [CITY CREATE] Exception:', error);
    throw error;
  }
};

export const updateCity = async (id: string | number, updates: Partial<BrazilianCity>) => {
  try {
    console.log('🔄 [CITY UPDATE] ID:', id);
    console.log('🔄 [CITY UPDATE] Updates:', updates);

    const dbUpdates: any = {};

    if (updates.name !== undefined) dbUpdates.nome = updates.name;
    if (updates.ibgeCode !== undefined) dbUpdates.codigo_ibge = updates.ibgeCode;

    // ✅ CORRIGIDO: Aceitar stateId diretamente OU buscar por stateAbbreviation
    if (updates.stateId) {
      dbUpdates.state_id = updates.stateId;
      console.log('🔄 [CITY UPDATE] Using stateId:', updates.stateId);
    } else if (updates.stateAbbreviation) {
      const { data: stateData } = await supabase
        .from('states')
        .select('id')
        .eq('sigla', updates.stateAbbreviation)
        .maybeSingle();

      if (stateData) {
        dbUpdates.state_id = stateData.id;
        console.log('🔄 [CITY UPDATE] Found state_id by abbr:', stateData.id);
      }
    }

    console.log('🔄 [CITY UPDATE] DB Updates:', dbUpdates);

    // ✅ CORRIGIDO: Fazer JOIN com states para retornar dados completos
    const { data, error } = await supabase
      .from('cities')
      .update(dbUpdates)
      .eq('id', id)
      .select(`
        *,
        states:state_id (
          id,
          nome,
          sigla,
          regiao
        )
      `)
      .single();

    if (error) {
      console.error('❌ [CITY UPDATE] Error:', error);
      throw error;
    }

    if (!data) {
      console.error('❌ [CITY UPDATE] No data returned');
      throw new Error('Cidade não encontrada ou você não tem permissão para editá-la');
    }

    console.log('✅ [CITY UPDATE] Success with state:', data);

    // Se houver zipCodeRanges, atualizar a tabela zip_code_ranges
    if (updates.zipCodeRanges && Array.isArray(updates.zipCodeRanges)) {
      console.log('📦 [CITY UPDATE] Processing zip ranges...');

      // Primeiro, deletar as faixas antigas
      await supabase
        .from('zip_code_ranges')
        .delete()
        .eq('city_id', id);

      console.log('🗑️ [CITY UPDATE] Old zip ranges deleted');

      // Inserir as novas faixas
      const zipRangesToInsert = updates.zipCodeRanges
        .filter(range => range.start && range.end)
        .map(range => ({
          city_id: id,
          start_zip: range.start.replace(/\D/g, ''),
          end_zip: range.end.replace(/\D/g, ''),
          area: range.area || null,
          neighborhood: range.neighborhood || null
        }));

      if (zipRangesToInsert.length > 0) {
        console.log('💾 [CITY UPDATE] Saving new zip ranges:', zipRangesToInsert);

        const { error: zipError } = await supabase
          .from('zip_code_ranges')
          .insert(zipRangesToInsert);

        if (zipError) {
          console.error('❌ [CITY UPDATE] Error saving zip ranges:', zipError);
        } else {
          console.log('✅ [CITY UPDATE] Zip ranges saved');
        }
      }
    }

    // ✅ CORRIGIDO: Converter com dados do state
    return dbRecordToCity(
      data,
      data.states?.nome || '',
      data.states?.sigla || '',
      data.states?.regiao || ''
    );
  } catch (error) {
    console.error('Error updating city:', error);
    throw error;
  }
};

export const deleteCity = async (id: string | number) => {
  try {
    const { error } = await supabase
      .from('cities')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting city:', error);
    return false;
  }
};

const importCities = async (cities: BrazilianCity[]) => {
  try {
    const dbRecords = await Promise.all(cities.map(city => cityToDbRecord(city)));

    const { data, error } = await supabase
      .from('cities')
      .upsert(dbRecords, { onConflict: 'ibge_code' })
      .select();

    if (error) throw error;
    return (data || []).map(dbRecordToCity);
  } catch (error) {
    console.error('Error importing cities:', error);
    throw error;
  }
};

const importCitiesFromAcre = async (cities: BrazilianCity[]) => {
  return await importCities(cities);
};

export const importCitiesFromAlagoas = async (cities: BrazilianCity[]) => {
  return await importCities(cities);
};

export const getCitiesStats = async () => {
  try {
    const { data: allCities, error } = await supabase
      .from('cities')
      .select(`
        id,
        states:state_id (
          sigla,
          regiao
        )
      `);

    if (error) throw error;

    const stats = {
      total: allCities?.length || 0,
      byType: { cidade: allCities?.length || 0 } as Record<string, number>,
      byRegion: {} as Record<string, number>,
      byState: {} as Record<string, number>
    };

    allCities?.forEach((city: any) => {
      const region = city.states?.regiao;
      const state = city.states?.sigla;

      if (region) {
        stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
      }
      if (state) {
        stats.byState[state] = (stats.byState[state] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { total: 0, byType: {}, byRegion: {}, byState: {} };
  }
};

// Cache de estados para evitar queries repetidas
let statesCache: string[] | null = null;
let statesCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Busca apenas os estados disponíveis (muito mais rápido que carregar todas as cidades)
 * @returns Array de siglas de estados ordenados
 */
export const getAllStates = async (): Promise<string[]> => {
  const now = Date.now();

  // Retornar cache se ainda válido
  if (statesCache && (now - statesCacheTime) < CACHE_DURATION) {
    return statesCache;
  }

  const { data, error } = await supabase
    .from('states')
    .select('sigla')
    .order('sigla');

  if (error) throw error;

  // Extrair UFs únicas
  const uniqueStates = (data || []).map(s => s.sigla).sort();

  // Atualizar cache
  statesCache = uniqueStates;
  statesCacheTime = now;

  return uniqueStates;
};

/**
 * Busca cidades de um estado específico (carregamento sob demanda)
 * @param stateAbbreviation - Sigla do estado (ex: SP, RJ)
 * @returns Array de cidades do estado
 */
export const getCitiesByState = async (stateAbbreviation: string) => {
  try {
    // Usar a função RPC que já faz o JOIN com states
    const { data, error } = await supabase.rpc('get_cities_with_state', {
      p_state_abbreviation: stateAbbreviation
    });

    if (error) throw error;

    // Mapear resultado da RPC para o formato esperado
    return (data || []).map((city: any) => ({
      id: city.id,
      name: city.nome,
      ibgeCode: city.codigo_ibge,
      stateId: city.state_id,
      stateAbbreviation: city.sigla_uf,
      stateName: '',
      region: '',
      type: 'cidade',
      zipCodeStart: '',
      zipCodeEnd: '',
      zipCodeRanges: null
    }));
  } catch (error) {
    console.error('Error fetching cities by state:', error);
    return [];
  }
};

/**
 * Busca todas as cidades (USAR APENAS EM CASOS ESPECÍFICOS - MUITO PESADO)
 * @deprecated Use getAllStates() + getCitiesByState() para melhor performance
 */
export const getAllCities = async () => {
  try {
    // Buscar todas as cidades COM JOIN de states para ter dados completos
    let allCities: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          states:state_id (
            id,
            nome,
            sigla,
            regiao
          )
        `)
        .order('nome', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allCities = [...allCities, ...data];
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    // Converter para BrazilianCity com TODOS os campos
    return allCities.map((record: any) =>
      dbRecordToCity(
        record,
        record.states?.nome || '',
        record.states?.sigla || '',
        record.states?.regiao || ''
      )
    );
  } catch (error) {
    console.error('Error fetching all cities:', error);
    return [];
  }
};

export const refreshCities = async () => {
  return await getAllCities();
};

/**
 * Busca cidade pelo CEP usando as faixas cadastradas (cities.zip_code_start/end e zip_code_ranges)
 */
export const findCityByCEPFromDatabase = async (zipCode: string) => {
  try {
    const cleanZip = zipCode.replace(/\D/g, '');
    if (cleanZip.length !== 8) {
      return null;
    }

    console.log('🔍 [CEP SEARCH] Buscando cidade para CEP:', cleanZip);

    // Busca diretamente nas faixas detalhadas de CEP
    const { data: detailedRange, error: detailError } = await supabase
      .from('zip_code_ranges')
      .select(`
        *,
        cities:city_id (
          *,
          states:state_id (
            id,
            nome,
            sigla,
            regiao
          )
        )
      `)
      .lte('start_zip', cleanZip)
      .gte('end_zip', cleanZip)
      .maybeSingle();

    if (detailError) {
      console.error('❌ [CEP SEARCH] Erro na busca detalhada:', detailError);
      return null;
    }

    if (detailedRange && detailedRange.cities) {
      console.log('✅ [CEP SEARCH] Cidade encontrada na faixa detalhada:', detailedRange.cities.nome);

      const city = dbRecordToCity(
        detailedRange.cities,
        detailedRange.cities.states?.nome || '',
        detailedRange.cities.states?.sigla || '',
        detailedRange.cities.states?.regiao || ''
      );

      city.area = detailedRange.area || '';
      city.neighborhood = detailedRange.neighborhood || '';

      return city;
    }

    console.log('⚠️ [CEP SEARCH] CEP não encontrado no banco de dados');
    return null;
  } catch (error) {
    console.error('❌ [CEP SEARCH] Erro ao buscar CEP:', error);
    return null;
  }
};

export const findOrCreateCityByCEP = async (zipCode: string) => {
  try {
    const cleanZip = zipCode.replace(/\D/g, '');
    if (cleanZip.length !== 8) {
      throw new Error('CEP inválido. Deve conter 8 dígitos.');
    }

    // Primeiro tenta buscar no banco de dados
    const cityFromDB = await findCityByCEPFromDatabase(zipCode);
    if (cityFromDB) {
      console.log('✅ [findOrCreateCityByCEP] Cidade encontrada no banco:', cityFromDB.name);
      return cityFromDB;
    }

    // Se não encontrou, busca no ViaCEP como fallback
    console.log('⚠️ [findOrCreateCityByCEP] CEP não encontrado no banco, buscando no ViaCEP...');

    const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
    if (!response.ok) {
      throw new Error('Erro ao consultar ViaCEP');
    }

    const cepData = await response.json();

    if (cepData.erro) {
      throw new Error('CEP não encontrado no ViaCEP');
    }

    // Buscar o state_id correto na tabela states
    const { data: stateData, error: stateError } = await supabase
      .from('states')
      .select('id, nome, sigla, regiao')
      .eq('sigla', cepData.uf)
      .maybeSingle();

    if (stateError) {
      console.error('❌ [findOrCreateCityByCEP] Erro ao buscar estado:', stateError);
      throw new Error(`Erro ao buscar estado ${cepData.uf}`);
    }

    if (!stateData) {
      throw new Error(`Estado ${cepData.uf} não encontrado no sistema`);
    }

    console.log('✅ [findOrCreateCityByCEP] Estado encontrado:', stateData.nome, '(', stateData.sigla, ')');

    // Verificar se a cidade já existe (pelo IBGE ou nome + estado)
    const { data: existingCity } = await supabase
      .from('cities')
      .select(`
        *,
        states:state_id (
          id,
          nome,
          sigla,
          regiao
        )
      `)
      .or(`codigo_ibge.eq.${cepData.ibge},and(nome.ilike.${cepData.localidade},state_id.eq.${stateData.id})`)
      .maybeSingle();

    if (existingCity) {
      console.log('✅ [findOrCreateCityByCEP] Cidade já existe no banco:', existingCity.nome);

      // Adicionar a faixa de CEP se não existir
      const { data: existingRange } = await supabase
        .from('zip_code_ranges')
        .select('*')
        .eq('city_id', existingCity.id)
        .lte('start_zip', cleanZip)
        .gte('end_zip', cleanZip)
        .maybeSingle();

      if (!existingRange) {
        console.log('📦 [findOrCreateCityByCEP] Adicionando faixa de CEP para cidade existente');
        await supabase
          .from('zip_code_ranges')
          .insert([{
            city_id: existingCity.id,
            start_zip: cleanZip,
            end_zip: cleanZip,
            area: cepData.bairro || null,
            neighborhood: cepData.bairro || null
          }]);
      }

      return dbRecordToCity(
        existingCity,
        existingCity.states?.nome || stateData.nome,
        existingCity.states?.sigla || stateData.sigla,
        existingCity.states?.regiao || stateData.regiao
      );
    }

    // Criar nova cidade
    const cityData: Omit<BrazilianCity, 'id'> = {
      name: cepData.localidade,
      ibgeCode: cepData.ibge,
      stateName: stateData.nome,
      stateAbbreviation: stateData.sigla,
      stateId: stateData.id,
      region: stateData.regiao,
      type: 'Município',
      zipCodeStart: '',
      zipCodeEnd: '',
      zipCodeRanges: [{
        start: cleanZip,
        end: cleanZip,
        area: cepData.bairro || '',
        neighborhood: cepData.bairro || ''
      }]
    };

    console.log('🆕 [findOrCreateCityByCEP] Criando nova cidade:', cityData);

    const newCity = await createCity(cityData);

    try {
      await changeLogsService.createLog({
        module: 'Cidades',
        action: 'create',
        description: `Cidade "${newCity.name} - ${newCity.stateAbbreviation}" cadastrada automaticamente via integração com ViaCEP (CEP: ${zipCode})`,
        userId: 'system',
        entityId: newCity.id.toString(),
        entityType: 'city'
      });
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }

    return newCity;
  } catch (error) {
    console.error('❌ [findOrCreateCityByCEP] Erro:', error);
    throw error;
  }
};

const CorreiosAPIService = {
  async fetchCitiesByState(stateCode: string) {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('state_abbreviation', stateCode);

    if (error) return [];
    return (data || []).map(dbRecordToCity);
  },

  async fetchCityByZipCode(zipCode: string) {
    return await fetchCityByZipCode(zipCode);
  },

  getRegionByState(stateCode: string): string {
    const stateRegionMap: { [key: string]: string } = {
      'AC': 'Norte', 'AL': 'Nordeste', 'AP': 'Norte', 'AM': 'Norte', 'BA': 'Nordeste',
      'CE': 'Nordeste', 'DF': 'Centro-Oeste', 'ES': 'Sudeste', 'GO': 'Centro-Oeste',
      'MA': 'Nordeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste', 'MG': 'Sudeste',
      'PA': 'Norte', 'PB': 'Nordeste', 'PR': 'Sul', 'PE': 'Nordeste', 'PI': 'Nordeste',
      'RJ': 'Sudeste', 'RN': 'Nordeste', 'RS': 'Sul', 'RO': 'Norte', 'RR': 'Norte',
      'SC': 'Sul', 'SP': 'Sudeste', 'SE': 'Nordeste', 'TO': 'Norte'
    };
    return stateRegionMap[stateCode] || 'Desconhecida';
  },

  async syncAllCities() {
    return true;
  }
};