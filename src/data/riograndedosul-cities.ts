// Rio Grande do Sul cities, districts and towns with ZIP code ranges
interface RSLocation {
  name: string;
  ibgeCode: string;
  type: 'cidade' | 'distrito' | 'povoado';
  zipCodeStart: string;
  zipCodeEnd: string;
  stateId: number;
  stateName: string;
  stateAbbreviation: string;
  region: string;
  zipCodeRanges: Array<{
    start: string;
    end: string;
    area?: string;
    neighborhood?: string;
  }>;
}

export const rioGrandeDoSulCities: RSLocation[] = [
  // Capital - Porto Alegre
  {
    name: 'Porto Alegre',
    ibgeCode: '4314902',
    type: 'cidade',
    zipCodeStart: '90000-000',
    zipCodeEnd: '91999-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '90000-000', end: '90099-999', area: 'Centro', neighborhood: 'Centro Histórico' },
      { start: '90100-000', end: '90199-999', area: 'Centro', neighborhood: 'Cidade Baixa' },
      { start: '90200-000', end: '90299-999', area: 'Centro', neighborhood: 'Menino Deus' },
      { start: '90300-000', end: '90399-999', area: 'Centro', neighborhood: 'Azenha' },
      { start: '90400-000', end: '90499-999', area: 'Centro', neighborhood: 'Santana' },
      { start: '90500-000', end: '90599-999', area: 'Centro', neighborhood: 'Farroupilha' },
      { start: '90600-000', end: '90699-999', area: 'Centro', neighborhood: 'Bom Fim' },
      { start: '90700-000', end: '90799-999', area: 'Centro', neighborhood: 'Independência' },
      { start: '90800-000', end: '90899-999', area: 'Centro', neighborhood: 'Moinhos de Vento' },
      { start: '90900-000', end: '90999-999', area: 'Centro', neighborhood: 'Auxiliadora' },
      { start: '91000-000', end: '91099-999', area: 'Zona Norte', neighborhood: 'Passo D\'Areia' },
      { start: '91100-000', end: '91199-999', area: 'Zona Norte', neighborhood: 'Cristo Redentor' },
      { start: '91200-000', end: '91299-999', area: 'Zona Norte', neighborhood: 'Lindóia' },
      { start: '91300-000', end: '91399-999', area: 'Zona Norte', neighborhood: 'São Sebastião' },
      { start: '91400-000', end: '91499-999', area: 'Zona Norte', neighborhood: 'Sarandi' },
      { start: '91500-000', end: '91599-999', area: 'Zona Norte', neighborhood: 'Rubem Berta' },
      { start: '91600-000', end: '91699-999', area: 'Zona Leste', neighborhood: 'Partenon' },
      { start: '91700-000', end: '91799-999', area: 'Zona Leste', neighborhood: 'Jardim Carvalho' },
      { start: '91800-000', end: '91899-999', area: 'Zona Leste', neighborhood: 'Agronomia' },
      { start: '91900-000', end: '91999-999', area: 'Zona Sul', neighborhood: 'Cavalhada' }
    ]
  },
  // Continuação de Porto Alegre
  {
    name: 'Porto Alegre',
    ibgeCode: '4314902',
    type: 'cidade',
    zipCodeStart: '92000-000',
    zipCodeEnd: '92999-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '92000-000', end: '92099-999', area: 'Zona Sul', neighborhood: 'Ipanema' },
      { start: '92100-000', end: '92199-999', area: 'Zona Sul', neighborhood: 'Tristeza' },
      { start: '92200-000', end: '92299-999', area: 'Zona Sul', neighborhood: 'Camaquã' },
      { start: '92300-000', end: '92399-999', area: 'Zona Sul', neighborhood: 'Cristal' },
      { start: '92400-000', end: '92499-999', area: 'Zona Sul', neighborhood: 'Belém Novo' },
      { start: '92500-000', end: '92599-999', area: 'Zona Sul', neighborhood: 'Restinga' },
      { start: '92600-000', end: '92699-999', area: 'Zona Sul', neighborhood: 'Lami' },
      { start: '92700-000', end: '92799-999', area: 'Zona Sul', neighborhood: 'Ponta Grossa' },
      { start: '92800-000', end: '92899-999', area: 'Zona Oeste', neighborhood: 'Belém Velho' },
      { start: '92900-000', end: '92999-999', area: 'Zona Oeste', neighborhood: 'Lomba do Pinheiro' }
    ]
  },
  // Grandes cidades da Região Metropolitana de Porto Alegre
  {
    name: 'Canoas',
    ibgeCode: '4304606',
    type: 'cidade',
    zipCodeStart: '92000-000',
    zipCodeEnd: '92449-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '92000-000', end: '92099-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '92100-000', end: '92199-999', area: 'Zona Norte', neighborhood: 'Mathias Velho' },
      { start: '92200-000', end: '92299-999', area: 'Zona Sul', neighborhood: 'Niterói' },
      { start: '92300-000', end: '92399-999', area: 'Zona Leste', neighborhood: 'Rio Branco' },
      { start: '92400-000', end: '92449-999', area: 'Zona Oeste', neighborhood: 'Igara' }
    ]
  },
  {
    name: 'Novo Hamburgo',
    ibgeCode: '4313409',
    type: 'cidade',
    zipCodeStart: '93300-000',
    zipCodeEnd: '93599-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '93300-000', end: '93399-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '93400-000', end: '93499-999', area: 'Zona Norte', neighborhood: 'Canudos' },
      { start: '93500-000', end: '93599-999', area: 'Zona Sul', neighborhood: 'Industrial' }
    ]
  },
  {
    name: 'São Leopoldo',
    ibgeCode: '4318705',
    type: 'cidade',
    zipCodeStart: '93000-000',
    zipCodeEnd: '93299-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '93000-000', end: '93099-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '93100-000', end: '93199-999', area: 'Zona Norte', neighborhood: 'Rio dos Sinos' },
      { start: '93200-000', end: '93299-999', area: 'Zona Sul', neighborhood: 'Scharlau' }
    ]
  },
  {
    name: 'Gravataí',
    ibgeCode: '4309209',
    type: 'cidade',
    zipCodeStart: '94000-000',
    zipCodeEnd: '94199-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '94000-000', end: '94099-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '94100-000', end: '94199-999', area: 'Zona Industrial', neighborhood: 'Distrito Industrial' }
    ]
  },
  // Cidades do interior - região da Serra Gaúcha
  {
    name: 'Caxias do Sul',
    ibgeCode: '4305108',
    type: 'cidade',
    zipCodeStart: '95000-000',
    zipCodeEnd: '95124-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '95000-000', end: '95099-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '95100-000', end: '95124-999', area: 'Zona Norte', neighborhood: 'Pio X' }
    ]
  },
  {
    name: 'Bento Gonçalves',
    ibgeCode: '4302105',
    type: 'cidade',
    zipCodeStart: '95700-000',
    zipCodeEnd: '95799-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '95700-000', end: '95799-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Gramado',
    ibgeCode: '4309100',
    type: 'cidade',
    zipCodeStart: '95670-000',
    zipCodeEnd: '95679-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '95670-000', end: '95679-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Canela',
    ibgeCode: '4304507',
    type: 'cidade',
    zipCodeStart: '95680-000',
    zipCodeEnd: '95689-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '95680-000', end: '95689-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades do interior - região Sul
  {
    name: 'Pelotas',
    ibgeCode: '4314407',
    type: 'cidade',
    zipCodeStart: '96000-000',
    zipCodeEnd: '96099-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '96000-000', end: '96099-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Rio Grande',
    ibgeCode: '4315602',
    type: 'cidade',
    zipCodeStart: '96200-000',
    zipCodeEnd: '96299-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '96200-000', end: '96299-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades do interior - região Central
  {
    name: 'Santa Maria',
    ibgeCode: '4316907',
    type: 'cidade',
    zipCodeStart: '97000-000',
    zipCodeEnd: '97119-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '97000-000', end: '97119-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Passo Fundo',
    ibgeCode: '4314100',
    type: 'cidade',
    zipCodeStart: '99000-000',
    zipCodeEnd: '99099-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '99000-000', end: '99099-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades do interior - região da Fronteira
  {
    name: 'Uruguaiana',
    ibgeCode: '4322400',
    type: 'cidade',
    zipCodeStart: '97500-000',
    zipCodeEnd: '97599-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '97500-000', end: '97599-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Santana do Livramento',
    ibgeCode: '4317103',
    type: 'cidade',
    zipCodeStart: '97570-000',
    zipCodeEnd: '97579-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '97570-000', end: '97579-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Distritos e povoados
  {
    name: 'São José das Missões',
    ibgeCode: '4318432',
    type: 'povoado',
    zipCodeStart: '98325-000',
    zipCodeEnd: '98329-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '98325-000', end: '98329-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Belém Novo',
    ibgeCode: '4314902',
    type: 'distrito',
    zipCodeStart: '91780-000',
    zipCodeEnd: '91789-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '91780-000', end: '91789-999', area: 'Belém Novo', neighborhood: 'Belém Novo' }
    ]
  },
  // Cidades históricas
  {
    name: 'São Miguel das Missões',
    ibgeCode: '4318432',
    type: 'cidade',
    zipCodeStart: '98330-000',
    zipCodeEnd: '98339-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '98330-000', end: '98339-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades turísticas
  {
    name: 'Torres',
    ibgeCode: '4321501',
    type: 'cidade',
    zipCodeStart: '95560-000',
    zipCodeEnd: '95569-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '95560-000', end: '95569-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Cambará do Sul',
    ibgeCode: '4303509',
    type: 'cidade',
    zipCodeStart: '95480-000',
    zipCodeEnd: '95489-999',
    stateId: 26,
    stateName: 'Rio Grande do Sul',
    stateAbbreviation: 'RS',
    region: 'Sul',
    zipCodeRanges: [
      { start: '95480-000', end: '95489-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  }
];