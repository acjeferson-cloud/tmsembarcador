import { BrazilianCity } from '../types/cities';
import { saoPauloCities } from './saopaulo-cities';
import { rioGrandeDoSulCities } from './riograndedosul-cities';
import { allRegionsCities } from './all-regions-cities';

// Dados iniciais - combinando os dados de São Paulo, Rio Grande do Sul e todas as regiões
let brazilianCities: BrazilianCity[] = [];

const cityTypes = [
  'Todos',
  'cidade',
  'distrito',
  'povoado'
];

const regions = [
  'Todos',
  'Norte',
  'Nordeste',
  'Centro-Oeste',
  'Sudeste',
  'Sul'
];

// Inicializar com os dados de todas as regiões
const initializeCities = () => {
  if (brazilianCities.length === 0) {
    // Carregar do localStorage se existir
    const savedCities = localStorage.getItem('tms-cities');
    if (savedCities) {
      brazilianCities = JSON.parse(savedCities);
    } else {
      // Se não existir no localStorage, importar os dados iniciais
      // Primeiro adiciona as 50 cidades de todas as regiões
      brazilianCities = [...allRegionsCities];

      // Depois adiciona as cidades de São Paulo e Rio Grande do Sul
      importCitiesFromSaoPaulo(saoPauloCities);
      importCitiesFromRioGrandeDoSul(rioGrandeDoSulCities);

      // Salva no localStorage
      saveCities();
    }
  }
  return brazilianCities;
};

// Salvar cidades no localStorage
const saveCities = () => {
  localStorage.setItem('tms-cities', JSON.stringify(brazilianCities));
};

// Funções para gerenciar cidades
const fetchCities = (
  page = 1,
  pageSize = 20,
  filters: { 
    searchTerm?: string, 
    stateFilter?: string, 
    regionFilter?: string, 
    typeFilter?: string 
  } = {}
) => {
  // Inicializar cidades se ainda não foi feito
  if (brazilianCities.length === 0) {
    initializeCities();
  }

  // Filtrar cidades
  let filteredCities = [...brazilianCities];
  
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filteredCities = filteredCities.filter(city => 
      city.name.toLowerCase().includes(searchLower) ||
      city.ibgeCode.includes(filters.searchTerm) ||
      city.zipCodeStart.includes(filters.searchTerm) ||
      city.zipCodeEnd.includes(filters.searchTerm)
    );
  }
  
  if (filters.stateFilter && filters.stateFilter !== 'Todos') {
    filteredCities = filteredCities.filter(city => 
      city.stateAbbreviation === filters.stateFilter
    );
  }
  
  if (filters.regionFilter && filters.regionFilter !== 'Todos') {
    filteredCities = filteredCities.filter(city => 
      city.region === filters.regionFilter
    );
  }
  
  if (filters.typeFilter && filters.typeFilter !== 'Todos') {
    filteredCities = filteredCities.filter(city => 
      city.type === filters.typeFilter
    );
  }
  
  // Calcular paginação
  const totalCount = filteredCities.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedCities = filteredCities.slice(start, end);
  
  return { cities: paginatedCities, totalCount };
};

const fetchCityById = (id: number) => {
  return brazilianCities.find(city => city.id === id) || null;
};

const createCity = (city: Omit<BrazilianCity, 'id'>) => {
  const newId = brazilianCities.length > 0 
    ? Math.max(...brazilianCities.map(c => c.id)) + 1 
    : 1;
  
  const newCity = { ...city, id: newId };
  brazilianCities.push(newCity);
  saveCities();
  return newCity;
};

const updateCity = (id: number, city: Partial<BrazilianCity>) => {
  const index = brazilianCities.findIndex(c => c.id === id);
  if (index !== -1) {
    brazilianCities[index] = { ...brazilianCities[index], ...city };
    saveCities();
    return true;
  }
  return false;
};

const deleteCity = (id: number) => {
  const index = brazilianCities.findIndex(c => c.id === id);
  if (index !== -1) {
    brazilianCities.splice(index, 1);
    saveCities();
    return true;
  }
  return false;
};

export const fetchCityByZipCode = (zipCode: string) => {
  // Remove non-numeric characters
  const numericZip = zipCode.replace(/\D/g, '');
  
  // First try to find a city with a matching ZIP code range
  for (const city of brazilianCities) {
    if (city.zipCodeRanges) {
      for (const range of city.zipCodeRanges) {
        const startZip = range.start.replace(/\D/g, '');
        const endZip = range.end.replace(/\D/g, '');
        
        if (numericZip >= startZip && numericZip <= endZip) {
          return {
            ...city,
            area: range.area,
            neighborhood: range.neighborhood
          };
        }
      }
    }
    
    // Then check general zip code range
    const startZip = city.zipCodeStart.replace(/\D/g, '');
    const endZip = city.zipCodeEnd.replace(/\D/g, '');
    
    if (numericZip >= startZip && numericZip <= endZip) {
      return city;
    }
  }
  
  return null;
};

const importCitiesFromSaoPaulo = (cities: BrazilianCity[]) => {
  // Check for duplicates by IBGE code
  const existingIbgeCodes = new Set(brazilianCities.map(city => city.ibgeCode));
  
  // Filter out cities that already exist
  const newCities = cities.filter(city => !existingIbgeCodes.has(city.ibgeCode));
  
  // Add new cities
  if (newCities.length > 0) {
    // Find the highest ID to ensure we don't have duplicates
    const maxId = brazilianCities.length > 0 
      ? Math.max(...brazilianCities.map(c => c.id)) 
      : 0;
    
    // Add new cities with incremented IDs
    const citiesToAdd = newCities.map((city, index) => ({
      ...city,
      id: maxId + index + 1
    }));
    
    brazilianCities = [...brazilianCities, ...citiesToAdd];
    saveCities();
  }
  
  return newCities.length;
};

const importCitiesFromRioGrandeDoSul = (cities: BrazilianCity[]) => {
  // Check for duplicates by IBGE code
  const existingIbgeCodes = new Set(brazilianCities.map(city => city.ibgeCode));

  // Filter out cities that already exist
  const newCities = cities.filter(city => !existingIbgeCodes.has(city.ibgeCode));

  // Add new cities
  if (newCities.length > 0) {
    // Find the highest ID to ensure we don't have duplicates
    const maxId = brazilianCities.length > 0
      ? Math.max(...brazilianCities.map(c => c.id))
      : 0;

    // Add new cities with incremented IDs
    const citiesToAdd = newCities.map((city, index) => ({
      ...city,
      id: maxId + index + 1
    }));

    brazilianCities = [...brazilianCities, ...citiesToAdd];
    saveCities();
  }

  return newCities.length;
};

const importCitiesFromAlagoas = (cities: BrazilianCity[]) => {
  // Check for duplicates by IBGE code
  const existingIbgeCodes = new Set(brazilianCities.map(city => city.ibgeCode));

  // Filter out cities that already exist
  const newCities = cities.filter(city => !existingIbgeCodes.has(city.ibgeCode));

  // Add new cities
  if (newCities.length > 0) {
    // Find the highest ID to ensure we don't have duplicates
    const maxId = brazilianCities.length > 0
      ? Math.max(...brazilianCities.map(c => c.id))
      : 0;

    // Add new cities with incremented IDs
    const citiesToAdd = newCities.map((city, index) => ({
      ...city,
      id: maxId + index + 1
    }));

    brazilianCities = [...brazilianCities, ...citiesToAdd];
    saveCities();
  }

  return newCities.length;
};

const importAllBrazilianCities = () => {
  // Import both São Paulo and Rio Grande do Sul cities
  const spCount = importCitiesFromSaoPaulo(saoPauloCities);
  const rsCount = importCitiesFromRioGrandeDoSul(rioGrandeDoSulCities);
  return spCount + rsCount;
};

const getCitiesStats = () => {
  // Initialize stats object
  const stats = {
    total: brazilianCities.length,
    byType: {} as Record<string, number>,
    byRegion: {} as Record<string, number>,
    byState: {} as Record<string, number>
  };
  
  // Count by type
  brazilianCities.forEach(city => {
    // By type
    if (!stats.byType[city.type]) {
      stats.byType[city.type] = 0;
    }
    stats.byType[city.type]++;
    
    // By region
    if (!stats.byRegion[city.region]) {
      stats.byRegion[city.region] = 0;
    }
    stats.byRegion[city.region]++;
    
    // By state
    if (!stats.byState[city.stateAbbreviation]) {
      stats.byState[city.stateAbbreviation] = 0;
    }
    stats.byState[city.stateAbbreviation]++;
  });
  
  return stats;
};

// Utility functions for working with the cities list
export const getAllCities = () => {
  if (brazilianCities.length === 0) {
    initializeCities();
  }
  return brazilianCities;
};

const refreshCities = () => {
  return brazilianCities;
};

// Mock API service for compatibility with existing code
class CorreiosAPIService {
  static async fetchCitiesByState(stateCode: string) {
    return brazilianCities.filter(city => city.stateAbbreviation === stateCode);
  }

  static async fetchDetailedZipRanges(cityIbgeCode: string) {
    const city = brazilianCities.find(c => c.ibgeCode === cityIbgeCode);
    return city?.zipCodeRanges || [];
  }

  static async fetchCityByZipCode(zipCode: string) {
    return fetchCityByZipCode(zipCode);
  }

  static getRegionByState(stateCode: string): string {
    const stateRegionMap: { [key: string]: string } = {
      'AC': 'Norte', 'AL': 'Nordeste', 'AP': 'Norte', 'AM': 'Norte', 'BA': 'Nordeste',
      'CE': 'Nordeste', 'DF': 'Centro-Oeste', 'ES': 'Sudeste', 'GO': 'Centro-Oeste',
      'MA': 'Nordeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste', 'MG': 'Sudeste',
      'PA': 'Norte', 'PB': 'Nordeste', 'PR': 'Sul', 'PE': 'Nordeste', 'PI': 'Nordeste',
      'RJ': 'Sudeste', 'RN': 'Nordeste', 'RS': 'Sul', 'RO': 'Norte', 'RR': 'Norte',
      'SC': 'Sul', 'SP': 'Sudeste', 'SE': 'Nordeste', 'TO': 'Norte'
    };
    return stateRegionMap[stateCode] || 'Desconhecida';
  }

  static async syncAllCities() {
    console.log('Iniciando sincronização com API dos Correios...');
    // Simular sincronização
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  static async importAllRegionsCities() {
    console.log('Iniciando importação completa de todas as regiões do Brasil...');
    // Simular importação
    await new Promise(resolve => setTimeout(resolve, 1000));
    return importAllBrazilianCities();
  }

  static async getZipCodeRangesByCity(cityId: number) {
    const city = brazilianCities.find(c => c.id === cityId);
    return city?.zipCodeRanges || [];
  }

  static async validateZipCodeInCity(zipCode: string, cityId: number) {
    const city = brazilianCities.find(c => c.id === cityId);
    if (!city || !city.zipCodeRanges) return false;

    const numericZip = zipCode.replace(/\D/g, '');
    
    return city.zipCodeRanges.some(range => {
      const startNumeric = range.start.replace(/\D/g, '');
      const endNumeric = range.end.replace(/\D/g, '');
      return numericZip >= startNumeric && numericZip <= endNumeric;
    });
  }
}

// Initialize cities data
initializeCities();