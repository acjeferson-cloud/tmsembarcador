// São Paulo cities, districts and towns with ZIP code ranges
interface SPLocation {
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

export const saoPauloCities: SPLocation[] = [
  // Capital - São Paulo (Expanded with detailed neighborhoods)
  {
    name: 'São Paulo',
    ibgeCode: '3550308',
    type: 'cidade',
    zipCodeStart: '01000-000',
    zipCodeEnd: '05999-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '01000-000', end: '01099-999', area: 'Centro', neighborhood: 'Sé' },
      { start: '01100-000', end: '01199-999', area: 'Centro', neighborhood: 'Santa Cecília' },
      { start: '01200-000', end: '01299-999', area: 'Centro', neighborhood: 'Bela Vista' },
      { start: '01300-000', end: '01399-999', area: 'Centro', neighborhood: 'Consolação' },
      { start: '01400-000', end: '01499-999', area: 'Centro', neighborhood: 'Cerqueira César' },
      { start: '01500-000', end: '01599-999', area: 'Centro', neighborhood: 'Liberdade' },
      { start: '02000-000', end: '02099-999', area: 'Zona Norte', neighborhood: 'Santana' },
      { start: '02100-000', end: '02199-999', area: 'Zona Norte', neighborhood: 'Vila Guilherme' },
      { start: '02200-000', end: '02299-999', area: 'Zona Norte', neighborhood: 'Tucuruvi' },
      { start: '02300-000', end: '02399-999', area: 'Zona Norte', neighborhood: 'Casa Verde' },
      { start: '02400-000', end: '02499-999', area: 'Zona Norte', neighborhood: 'Mandaqui' },
      { start: '02500-000', end: '02599-999', area: 'Zona Norte', neighborhood: 'Vila Maria' },
      { start: '03000-000', end: '03099-999', area: 'Zona Leste', neighborhood: 'Brás' },
      { start: '03100-000', end: '03199-999', area: 'Zona Leste', neighborhood: 'Mooca' },
      { start: '03200-000', end: '03299-999', area: 'Zona Leste', neighborhood: 'Belém' },
      { start: '03300-000', end: '03399-999', area: 'Zona Leste', neighborhood: 'Tatuapé' },
      { start: '03400-000', end: '03499-999', area: 'Zona Leste', neighborhood: 'Vila Formosa' },
      { start: '03500-000', end: '03599-999', area: 'Zona Leste', neighborhood: 'Carrão' },
      { start: '03600-000', end: '03699-999', area: 'Zona Leste', neighborhood: 'Vila Matilde' },
      { start: '03700-000', end: '03799-999', area: 'Zona Leste', neighborhood: 'Penha' },
      { start: '03800-000', end: '03899-999', area: 'Zona Leste', neighborhood: 'Cangaíba' },
      { start: '03900-000', end: '03999-999', area: 'Zona Leste', neighborhood: 'Vila Esperança' },
      { start: '04000-000', end: '04099-999', area: 'Zona Sul', neighborhood: 'Paraíso' },
      { start: '04100-000', end: '04199-999', area: 'Zona Sul', neighborhood: 'Vila Mariana' },
      { start: '04200-000', end: '04299-999', area: 'Zona Sul', neighborhood: 'Saúde' },
      { start: '04300-000', end: '04399-999', area: 'Zona Sul', neighborhood: 'Ipiranga' },
      { start: '04400-000', end: '04499-999', area: 'Zona Sul', neighborhood: 'Cursino' },
      { start: '04500-000', end: '04599-999', area: 'Zona Sul', neighborhood: 'Vila Clementino' },
      { start: '04600-000', end: '04699-999', area: 'Zona Sul', neighborhood: 'Sacomã' },
      { start: '04700-000', end: '04799-999', area: 'Zona Sul', neighborhood: 'Jabaquara' },
      { start: '04800-000', end: '04899-999', area: 'Zona Sul', neighborhood: 'Cidade Ademar' },
      { start: '04900-000', end: '04999-999', area: 'Zona Sul', neighborhood: 'Pedreira' },
      { start: '05000-000', end: '05099-999', area: 'Zona Oeste', neighborhood: 'Perdizes' },
      { start: '05100-000', end: '05199-999', area: 'Zona Oeste', neighborhood: 'Pinheiros' },
      { start: '05200-000', end: '05299-999', area: 'Zona Oeste', neighborhood: 'Vila Leopoldina' },
      { start: '05300-000', end: '05399-999', area: 'Zona Oeste', neighborhood: 'Lapa' },
      { start: '05400-000', end: '05499-999', area: 'Zona Oeste', neighborhood: 'Alto de Pinheiros' },
      { start: '05500-000', end: '05599-999', area: 'Zona Oeste', neighborhood: 'Butantã' },
      { start: '05600-000', end: '05699-999', area: 'Zona Oeste', neighborhood: 'Vila Sônia' },
      { start: '05700-000', end: '05799-999', area: 'Zona Oeste', neighborhood: 'Morumbi' },
      { start: '05800-000', end: '05899-999', area: 'Zona Oeste', neighborhood: 'Jaguaré' },
      { start: '05900-000', end: '05999-999', area: 'Zona Oeste', neighborhood: 'Rio Pequeno' }
    ]
  },
  // Continuação de São Paulo (Zona Leste e outras áreas)
  {
    name: 'São Paulo',
    ibgeCode: '3550308',
    type: 'cidade',
    zipCodeStart: '06000-000',
    zipCodeEnd: '09999-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '06000-000', end: '06299-999', area: 'Zona Oeste', neighborhood: 'Osasco' },
      { start: '06300-000', end: '06399-999', area: 'Zona Oeste', neighborhood: 'Carapicuíba' },
      { start: '06400-000', end: '06499-999', area: 'Zona Oeste', neighborhood: 'Barueri' },
      { start: '06500-000', end: '06599-999', area: 'Zona Oeste', neighborhood: 'Santana de Parnaíba' },
      { start: '06600-000', end: '06699-999', area: 'Zona Oeste', neighborhood: 'Jandira' },
      { start: '06700-000', end: '06799-999', area: 'Zona Oeste', neighborhood: 'Cotia' },
      { start: '06800-000', end: '06899-999', area: 'Zona Oeste', neighborhood: 'Embu das Artes' },
      { start: '06900-000', end: '06999-999', area: 'Zona Oeste', neighborhood: 'Itapecerica da Serra' },
      { start: '07000-000', end: '07099-999', area: 'Zona Norte', neighborhood: 'Guarulhos - Centro' },
      { start: '07100-000', end: '07199-999', area: 'Zona Norte', neighborhood: 'Guarulhos - Cumbica' },
      { start: '07200-000', end: '07299-999', area: 'Zona Norte', neighborhood: 'Guarulhos - Pimentas' },
      { start: '07300-000', end: '07399-999', area: 'Zona Norte', neighborhood: 'Guarulhos - Taboão' },
      { start: '07400-000', end: '07499-999', area: 'Zona Norte', neighborhood: 'Arujá' },
      { start: '07500-000', end: '07599-999', area: 'Zona Norte', neighborhood: 'Santa Isabel' },
      { start: '07600-000', end: '07699-999', area: 'Zona Norte', neighborhood: 'Mairiporã' },
      { start: '07700-000', end: '07799-999', area: 'Zona Norte', neighborhood: 'Caieiras' },
      { start: '07800-000', end: '07899-999', area: 'Zona Norte', neighborhood: 'Franco da Rocha' },
      { start: '07900-000', end: '07999-999', area: 'Zona Norte', neighborhood: 'Francisco Morato' },
      { start: '08000-000', end: '08099-999', area: 'Zona Leste', neighborhood: 'São Miguel Paulista' },
      { start: '08100-000', end: '08199-999', area: 'Zona Leste', neighborhood: 'Itaim Paulista' },
      { start: '08200-000', end: '08299-999', area: 'Zona Leste', neighborhood: 'Itaquera' },
      { start: '08300-000', end: '08399-999', area: 'Zona Leste', neighborhood: 'São Mateus' },
      { start: '08400-000', end: '08499-999', area: 'Zona Leste', neighborhood: 'Guaianases' },
      { start: '08500-000', end: '08599-999', area: 'Zona Leste', neighborhood: 'Cidade Tiradentes' },
      { start: '08600-000', end: '08699-999', area: 'Zona Leste', neighborhood: 'Suzano' },
      { start: '08700-000', end: '08799-999', area: 'Zona Leste', neighborhood: 'Mogi das Cruzes' },
      { start: '08800-000', end: '08899-999', area: 'Zona Leste', neighborhood: 'Poá' },
      { start: '08900-000', end: '08999-999', area: 'Zona Leste', neighborhood: 'Ferraz de Vasconcelos' },
      { start: '09000-000', end: '09099-999', area: 'ABC Paulista', neighborhood: 'Santo André - Centro' },
      { start: '09100-000', end: '09199-999', area: 'ABC Paulista', neighborhood: 'Santo André - Bairros' },
      { start: '09200-000', end: '09299-999', area: 'ABC Paulista', neighborhood: 'Santo André - Industrial' },
      { start: '09300-000', end: '09399-999', area: 'ABC Paulista', neighborhood: 'Mauá' },
      { start: '09400-000', end: '09499-999', area: 'ABC Paulista', neighborhood: 'Ribeirão Pires' },
      { start: '09500-000', end: '09599-999', area: 'ABC Paulista', neighborhood: 'São Caetano do Sul' },
      { start: '09600-000', end: '09699-999', area: 'ABC Paulista', neighborhood: 'São Bernardo do Campo - Centro' },
      { start: '09700-000', end: '09799-999', area: 'ABC Paulista', neighborhood: 'São Bernardo do Campo - Bairros' },
      { start: '09800-000', end: '09899-999', area: 'ABC Paulista', neighborhood: 'São Bernardo do Campo - Industrial' },
      { start: '09900-000', end: '09999-999', area: 'ABC Paulista', neighborhood: 'Diadema' }
    ]
  },
  // Grandes cidades da Região Metropolitana de São Paulo
  {
    name: 'Guarulhos',
    ibgeCode: '3518800',
    type: 'cidade',
    zipCodeStart: '07000-000',
    zipCodeEnd: '07399-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '07000-000', end: '07099-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '07100-000', end: '07199-999', area: 'Zona Leste', neighborhood: 'Cumbica' },
      { start: '07200-000', end: '07299-999', area: 'Zona Norte', neighborhood: 'Pimentas' },
      { start: '07300-000', end: '07399-999', area: 'Zona Oeste', neighborhood: 'Taboão' }
    ]
  },
  {
    name: 'Campinas',
    ibgeCode: '3509502',
    type: 'cidade',
    zipCodeStart: '13000-000',
    zipCodeEnd: '13139-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13000-000', end: '13099-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '13100-000', end: '13139-999', area: 'Distritos', neighborhood: 'Barão Geraldo' }
    ]
  },
  {
    name: 'São José dos Campos',
    ibgeCode: '3549904',
    type: 'cidade',
    zipCodeStart: '12200-000',
    zipCodeEnd: '12248-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '12200-000', end: '12248-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Ribeirão Preto',
    ibgeCode: '3543402',
    type: 'cidade',
    zipCodeStart: '14000-000',
    zipCodeEnd: '14109-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '14000-000', end: '14109-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Sorocaba',
    ibgeCode: '3552205',
    type: 'cidade',
    zipCodeStart: '18000-000',
    zipCodeEnd: '18109-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '18000-000', end: '18109-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Santos',
    ibgeCode: '3548500',
    type: 'cidade',
    zipCodeStart: '11000-000',
    zipCodeEnd: '11099-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11000-000', end: '11099-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'São José do Rio Preto',
    ibgeCode: '3549805',
    type: 'cidade',
    zipCodeStart: '15000-000',
    zipCodeEnd: '15104-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '15000-000', end: '15104-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Mogi das Cruzes',
    ibgeCode: '3530607',
    type: 'cidade',
    zipCodeStart: '08700-000',
    zipCodeEnd: '08899-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '08700-000', end: '08899-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Piracicaba',
    ibgeCode: '3538709',
    type: 'cidade',
    zipCodeStart: '13400-000',
    zipCodeEnd: '13439-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13400-000', end: '13439-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Bauru',
    ibgeCode: '3506003',
    type: 'cidade',
    zipCodeStart: '17000-000',
    zipCodeEnd: '17109-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '17000-000', end: '17109-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades médias do interior
  {
    name: 'Franca',
    ibgeCode: '3516200',
    type: 'cidade',
    zipCodeStart: '14400-000',
    zipCodeEnd: '14414-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '14400-000', end: '14414-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Limeira',
    ibgeCode: '3526902',
    type: 'cidade',
    zipCodeStart: '13480-000',
    zipCodeEnd: '13489-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13480-000', end: '13489-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Presidente Prudente',
    ibgeCode: '3541406',
    type: 'cidade',
    zipCodeStart: '19000-000',
    zipCodeEnd: '19099-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '19000-000', end: '19099-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'São Carlos',
    ibgeCode: '3548906',
    type: 'cidade',
    zipCodeStart: '13560-000',
    zipCodeEnd: '13579-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13560-000', end: '13579-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Marília',
    ibgeCode: '3529005',
    type: 'cidade',
    zipCodeStart: '17500-000',
    zipCodeEnd: '17539-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '17500-000', end: '17539-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Araraquara',
    ibgeCode: '3503208',
    type: 'cidade',
    zipCodeStart: '14800-000',
    zipCodeEnd: '14811-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '14800-000', end: '14811-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Araçatuba',
    ibgeCode: '3502804',
    type: 'cidade',
    zipCodeStart: '16000-000',
    zipCodeEnd: '16059-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '16000-000', end: '16059-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Distritos de São Paulo
  {
    name: 'Grajaú',
    ibgeCode: '3550308',
    type: 'distrito',
    zipCodeStart: '04800-000',
    zipCodeEnd: '04899-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '04800-000', end: '04849-999', area: 'Grajaú', neighborhood: 'Grajaú Centro' },
      { start: '04850-000', end: '04899-999', area: 'Grajaú', neighborhood: 'Grajaú Periferia' }
    ]
  },
  {
    name: 'Parelheiros',
    ibgeCode: '3550308',
    type: 'distrito',
    zipCodeStart: '04900-000',
    zipCodeEnd: '04949-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '04900-000', end: '04949-999', area: 'Parelheiros', neighborhood: 'Parelheiros' }
    ]
  },
  {
    name: 'Cidade Tiradentes',
    ibgeCode: '3550308',
    type: 'distrito',
    zipCodeStart: '08470-000',
    zipCodeEnd: '08499-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '08470-000', end: '08499-999', area: 'Cidade Tiradentes', neighborhood: 'Conjunto Habitacional' }
    ]
  },
  {
    name: 'Jaraguá',
    ibgeCode: '3550308',
    type: 'distrito',
    zipCodeStart: '02998-000',
    zipCodeEnd: '02999-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '02998-000', end: '02999-999', area: 'Jaraguá', neighborhood: 'Jaraguá' }
    ]
  },
  {
    name: 'Perus',
    ibgeCode: '3550308',
    type: 'distrito',
    zipCodeStart: '05200-000',
    zipCodeEnd: '05299-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '05200-000', end: '05299-999', area: 'Perus', neighborhood: 'Perus' }
    ]
  },
  // Distritos de outras cidades
  {
    name: 'Barão Geraldo',
    ibgeCode: '3509502',
    type: 'distrito',
    zipCodeStart: '13080-000',
    zipCodeEnd: '13089-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13080-000', end: '13089-999', area: 'Barão Geraldo', neighborhood: 'Barão Geraldo' }
    ]
  },
  {
    name: 'Sousas',
    ibgeCode: '3509502',
    type: 'distrito',
    zipCodeStart: '13100-000',
    zipCodeEnd: '13109-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13100-000', end: '13109-999', area: 'Sousas', neighborhood: 'Sousas' }
    ]
  },
  {
    name: 'Joaquim Egídio',
    ibgeCode: '3509502',
    type: 'distrito',
    zipCodeStart: '13110-000',
    zipCodeEnd: '13119-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13110-000', end: '13119-999', area: 'Joaquim Egídio', neighborhood: 'Joaquim Egídio' }
    ]
  },
  // Povoados e pequenas localidades
  {
    name: 'Paranapiacaba',
    ibgeCode: '3547809',
    type: 'povoado',
    zipCodeStart: '09150-000',
    zipCodeEnd: '09150-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '09150-000', end: '09150-999', area: 'Paranapiacaba', neighborhood: 'Vila Histórica' }
    ]
  },
  {
    name: 'Picinguaba',
    ibgeCode: '3555406',
    type: 'povoado',
    zipCodeStart: '11680-000',
    zipCodeEnd: '11680-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11680-000', end: '11680-999', area: 'Picinguaba', neighborhood: 'Vila de Pescadores' }
    ]
  },
  {
    name: 'Barra do Una',
    ibgeCode: '3550704',
    type: 'povoado',
    zipCodeStart: '11600-000',
    zipCodeEnd: '11600-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11600-000', end: '11600-999', area: 'Barra do Una', neighborhood: 'Praia' }
    ]
  },
  // Cidades do Litoral Norte
  {
    name: 'Ubatuba',
    ibgeCode: '3555406',
    type: 'cidade',
    zipCodeStart: '11680-000',
    zipCodeEnd: '11689-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11680-000', end: '11689-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Caraguatatuba',
    ibgeCode: '3510500',
    type: 'cidade',
    zipCodeStart: '11660-000',
    zipCodeEnd: '11679-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11660-000', end: '11679-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'São Sebastião',
    ibgeCode: '3550704',
    type: 'cidade',
    zipCodeStart: '11600-000',
    zipCodeEnd: '11629-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11600-000', end: '11629-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Ilhabela',
    ibgeCode: '3520400',
    type: 'cidade',
    zipCodeStart: '11630-000',
    zipCodeEnd: '11659-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11630-000', end: '11659-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades do Litoral Sul
  {
    name: 'Guarujá',
    ibgeCode: '3518701',
    type: 'cidade',
    zipCodeStart: '11400-000',
    zipCodeEnd: '11499-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11400-000', end: '11499-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Bertioga',
    ibgeCode: '3506359',
    type: 'cidade',
    zipCodeStart: '11250-000',
    zipCodeEnd: '11299-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11250-000', end: '11299-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Praia Grande',
    ibgeCode: '3541000',
    type: 'cidade',
    zipCodeStart: '11700-000',
    zipCodeEnd: '11729-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11700-000', end: '11729-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Mongaguá',
    ibgeCode: '3531100',
    type: 'cidade',
    zipCodeStart: '11730-000',
    zipCodeEnd: '11739-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11730-000', end: '11739-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Itanhaém',
    ibgeCode: '3522109',
    type: 'cidade',
    zipCodeStart: '11740-000',
    zipCodeEnd: '11749-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11740-000', end: '11749-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Peruíbe',
    ibgeCode: '3538006',
    type: 'cidade',
    zipCodeStart: '11750-000',
    zipCodeEnd: '11759-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11750-000', end: '11759-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades do Vale do Paraíba
  {
    name: 'Taubaté',
    ibgeCode: '3554102',
    type: 'cidade',
    zipCodeStart: '12000-000',
    zipCodeEnd: '12099-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '12000-000', end: '12099-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Jacareí',
    ibgeCode: '3524402',
    type: 'cidade',
    zipCodeStart: '12300-000',
    zipCodeEnd: '12349-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '12300-000', end: '12349-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Caçapava',
    ibgeCode: '3508504',
    type: 'cidade',
    zipCodeStart: '12280-000',
    zipCodeEnd: '12299-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '12280-000', end: '12299-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Pindamonhangaba',
    ibgeCode: '3538006',
    type: 'cidade',
    zipCodeStart: '12400-000',
    zipCodeEnd: '12449-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '12400-000', end: '12449-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Guaratinguetá',
    ibgeCode: '3518404',
    type: 'cidade',
    zipCodeStart: '12500-000',
    zipCodeEnd: '12549-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '12500-000', end: '12549-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades do interior - região de Campinas
  {
    name: 'Americana',
    ibgeCode: '3501608',
    type: 'cidade',
    zipCodeStart: '13465-000',
    zipCodeEnd: '13479-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13465-000', end: '13479-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Santa Bárbara d\'Oeste',
    ibgeCode: '3545803',
    type: 'cidade',
    zipCodeStart: '13450-000',
    zipCodeEnd: '13459-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13450-000', end: '13459-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Sumaré',
    ibgeCode: '3552403',
    type: 'cidade',
    zipCodeStart: '13170-000',
    zipCodeEnd: '13182-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13170-000', end: '13182-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Hortolândia',
    ibgeCode: '3519071',
    type: 'cidade',
    zipCodeStart: '13183-000',
    zipCodeEnd: '13189-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13183-000', end: '13189-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Indaiatuba',
    ibgeCode: '3520509',
    type: 'cidade',
    zipCodeStart: '13330-000',
    zipCodeEnd: '13349-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13330-000', end: '13349-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades do interior - região de Ribeirão Preto
  {
    name: 'Sertãozinho',
    ibgeCode: '3551702',
    type: 'cidade',
    zipCodeStart: '14160-000',
    zipCodeEnd: '14179-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '14160-000', end: '14179-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Jaboticabal',
    ibgeCode: '3524303',
    type: 'cidade',
    zipCodeStart: '14870-000',
    zipCodeEnd: '14899-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '14870-000', end: '14899-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Barretos',
    ibgeCode: '3505500',
    type: 'cidade',
    zipCodeStart: '14780-000',
    zipCodeEnd: '14799-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '14780-000', end: '14799-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades do interior - região de Bauru
  {
    name: 'Jaú',
    ibgeCode: '3525300',
    type: 'cidade',
    zipCodeStart: '17200-000',
    zipCodeEnd: '17229-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '17200-000', end: '17229-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Botucatu',
    ibgeCode: '3507506',
    type: 'cidade',
    zipCodeStart: '18600-000',
    zipCodeEnd: '18619-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '18600-000', end: '18619-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Lençóis Paulista',
    ibgeCode: '3526704',
    type: 'cidade',
    zipCodeStart: '18680-000',
    zipCodeEnd: '18689-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '18680-000', end: '18689-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades do interior - região de São José do Rio Preto
  {
    name: 'Catanduva',
    ibgeCode: '3511102',
    type: 'cidade',
    zipCodeStart: '15800-000',
    zipCodeEnd: '15819-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '15800-000', end: '15819-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Votuporanga',
    ibgeCode: '3557105',
    type: 'cidade',
    zipCodeStart: '15500-000',
    zipCodeEnd: '15519-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '15500-000', end: '15519-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Fernandópolis',
    ibgeCode: '3515707',
    type: 'cidade',
    zipCodeStart: '15600-000',
    zipCodeEnd: '15619-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '15600-000', end: '15619-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades do interior - região de Sorocaba
  {
    name: 'Itapetininga',
    ibgeCode: '3522505',
    type: 'cidade',
    zipCodeStart: '18200-000',
    zipCodeEnd: '18219-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '18200-000', end: '18219-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Tatuí',
    ibgeCode: '3554003',
    type: 'cidade',
    zipCodeStart: '18270-000',
    zipCodeEnd: '18279-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '18270-000', end: '18279-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Itu',
    ibgeCode: '3523909',
    type: 'cidade',
    zipCodeStart: '13300-000',
    zipCodeEnd: '13314-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13300-000', end: '13314-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Cidades históricas e turísticas
  {
    name: 'São Luiz do Paraitinga',
    ibgeCode: '3550001',
    type: 'cidade',
    zipCodeStart: '12140-000',
    zipCodeEnd: '12149-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '12140-000', end: '12149-999', area: 'Centro Histórico', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Iguape',
    ibgeCode: '3520301',
    type: 'cidade',
    zipCodeStart: '11920-000',
    zipCodeEnd: '11929-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11920-000', end: '11929-999', area: 'Centro Histórico', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Cananéia',
    ibgeCode: '3509908',
    type: 'cidade',
    zipCodeStart: '11990-000',
    zipCodeEnd: '11999-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11990-000', end: '11999-999', area: 'Centro Histórico', neighborhood: 'Centro' }
    ]
  },
  // Povoados e pequenas localidades turísticas
  {
    name: 'Águas de São Pedro',
    ibgeCode: '3500503',
    type: 'cidade',
    zipCodeStart: '13525-000',
    zipCodeEnd: '13529-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13525-000', end: '13529-999', area: 'Estância', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Holambra',
    ibgeCode: '3519055',
    type: 'cidade',
    zipCodeStart: '13825-000',
    zipCodeEnd: '13829-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13825-000', end: '13829-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Campos do Jordão',
    ibgeCode: '3509700',
    type: 'cidade',
    zipCodeStart: '12460-000',
    zipCodeEnd: '12489-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '12460-000', end: '12469-999', area: 'Capivari', neighborhood: 'Capivari' },
      { start: '12470-000', end: '12479-999', area: 'Abernéssia', neighborhood: 'Abernéssia' },
      { start: '12480-000', end: '12489-999', area: 'Jaguaribe', neighborhood: 'Jaguaribe' }
    ]
  },
  // Distritos rurais e povoados menores
  {
    name: 'Bonfim Paulista',
    ibgeCode: '3543402',
    type: 'distrito',
    zipCodeStart: '14110-000',
    zipCodeEnd: '14119-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '14110-000', end: '14119-999', area: 'Bonfim Paulista', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Cássia dos Coqueiros',
    ibgeCode: '3510906',
    type: 'cidade',
    zipCodeStart: '14260-000',
    zipCodeEnd: '14269-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '14260-000', end: '14269-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Analândia',
    ibgeCode: '3501905',
    type: 'cidade',
    zipCodeStart: '13550-000',
    zipCodeEnd: '13559-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '13550-000', end: '13559-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Barra do Chapéu',
    ibgeCode: '3505351',
    type: 'cidade',
    zipCodeStart: '18325-000',
    zipCodeEnd: '18329-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '18325-000', end: '18329-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    name: 'Barra do Turvo',
    ibgeCode: '3505500',
    type: 'cidade',
    zipCodeStart: '11955-000',
    zipCodeEnd: '11959-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11955-000', end: '11959-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  // Povoados e comunidades tradicionais
  {
    name: 'Ivaporunduva',
    ibgeCode: '3513603',
    type: 'povoado',
    zipCodeStart: '11960-000',
    zipCodeEnd: '11960-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11960-000', end: '11960-999', area: 'Quilombo', neighborhood: 'Comunidade Quilombola' }
    ]
  },
  {
    name: 'Cananéia - Comunidade Mandira',
    ibgeCode: '3509908',
    type: 'povoado',
    zipCodeStart: '11990-500',
    zipCodeEnd: '11990-599',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '11990-500', end: '11990-599', area: 'Mandira', neighborhood: 'Comunidade Caiçara' }
    ]
  },
  {
    name: 'Juquitiba - Barnabés',
    ibgeCode: '3525904',
    type: 'povoado',
    zipCodeStart: '06950-000',
    zipCodeEnd: '06950-999',
    stateId: 24,
    stateName: 'São Paulo',
    stateAbbreviation: 'SP',
    region: 'Sudeste',
    zipCodeRanges: [
      { start: '06950-000', end: '06950-999', area: 'Barnabés', neighborhood: 'Zona Rural' }
    ]
  }
];