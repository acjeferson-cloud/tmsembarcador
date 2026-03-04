export interface BrazilianCity {
  id: string | number;
  name: string;
  ibgeCode: string;
  stateId?: string | number;
  stateName: string;
  stateAbbreviation: string;
  zipCodeStart: string;
  zipCodeEnd: string;
  type: 'cidade' | 'distrito' | 'povoado';
  region: string;
  zipCodeRanges?: Array<{
    start: string;
    end: string;
    area?: string;
    neighborhood?: string;
  }>;
  area?: string;
  neighborhood?: string;
}

interface CityStats {
  total: number;
  byType: {
    cidade?: number;
    distrito?: number;
    povoado?: number;
  };
  byRegion: {
    [key: string]: number;
  };
  byState: {
    [key: string]: number;
  };
}

export const cityTypes = [
  'Todos',
  'cidade',
  'distrito',
  'povoado'
];

export const regions = [
  'Todos',
  'Norte',
  'Nordeste',
  'Centro-Oeste',
  'Sudeste',
  'Sul'
];