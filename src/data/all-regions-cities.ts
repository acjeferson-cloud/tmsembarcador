import { BrazilianCity } from '../types/cities';

export const allRegionsCities: BrazilianCity[] = [
  // REGIÃO NORTE (10 cidades)
  {
    id: 1,
    name: 'Manaus',
    stateAbbreviation: 'AM',
    stateName: 'Amazonas',
    region: 'Norte',
    ibgeCode: '1302603',
    type: 'cidade',
    zipCodeStart: '69000-000',
    zipCodeEnd: '69099-999',
    zipCodeRanges: [
      { start: '69000-000', end: '69025-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '69040-000', end: '69049-999', area: 'Zona Sul', neighborhood: 'Aleixo' },
      { start: '69050-000', end: '69059-999', area: 'Zona Norte', neighborhood: 'Cidade Nova' }
    ]
  },
  {
    id: 2,
    name: 'Belém',
    stateAbbreviation: 'PA',
    stateName: 'Pará',
    region: 'Norte',
    ibgeCode: '1501402',
    type: 'cidade',
    zipCodeStart: '66000-000',
    zipCodeEnd: '66999-999',
    zipCodeRanges: [
      { start: '66010-000', end: '66019-999', area: 'Centro', neighborhood: 'Comércio' },
      { start: '66020-000', end: '66029-999', area: 'Centro', neighborhood: 'Cidade Velha' },
      { start: '66050-000', end: '66059-999', area: 'Zona Sul', neighborhood: 'Nazaré' }
    ]
  },
  {
    id: 3,
    name: 'Porto Velho',
    stateAbbreviation: 'RO',
    stateName: 'Rondônia',
    region: 'Norte',
    ibgeCode: '1100205',
    type: 'cidade',
    zipCodeStart: '76800-000',
    zipCodeEnd: '76834-999',
    zipCodeRanges: [
      { start: '76801-000', end: '76804-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '76820-000', end: '76824-999', area: 'Zona Leste', neighborhood: 'Areal' }
    ]
  },
  {
    id: 4,
    name: 'Rio Branco',
    stateAbbreviation: 'AC',
    stateName: 'Acre',
    region: 'Norte',
    ibgeCode: '1200401',
    type: 'cidade',
    zipCodeStart: '69900-000',
    zipCodeEnd: '69923-999',
    zipCodeRanges: [
      { start: '69900-000', end: '69903-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '69915-000', end: '69918-999', area: 'Distrito', neighborhood: 'Distrito Industrial' }
    ]
  },
  {
    id: 5,
    name: 'Macapá',
    stateAbbreviation: 'AP',
    stateName: 'Amapá',
    region: 'Norte',
    ibgeCode: '1600303',
    type: 'cidade',
    zipCodeStart: '68900-000',
    zipCodeEnd: '68949-999',
    zipCodeRanges: [
      { start: '68900-000', end: '68906-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '68908-000', end: '68912-999', area: 'Zona Norte', neighborhood: 'Zerão' }
    ]
  },
  {
    id: 6,
    name: 'Palmas',
    stateAbbreviation: 'TO',
    stateName: 'Tocantins',
    region: 'Norte',
    ibgeCode: '1721000',
    type: 'cidade',
    zipCodeStart: '77000-000',
    zipCodeEnd: '77270-999',
    zipCodeRanges: [
      { start: '77001-000', end: '77006-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '77020-000', end: '77026-999', area: 'Plano Diretor Sul', neighborhood: 'Plano Diretor Sul' }
    ]
  },
  {
    id: 7,
    name: 'Boa Vista',
    stateAbbreviation: 'RR',
    stateName: 'Roraima',
    region: 'Norte',
    ibgeCode: '1400100',
    type: 'cidade',
    zipCodeStart: '69300-000',
    zipCodeEnd: '69339-999',
    zipCodeRanges: [
      { start: '69301-000', end: '69305-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '69306-000', end: '69310-999', area: 'Zona Oeste', neighborhood: 'Caçari' }
    ]
  },
  {
    id: 8,
    name: 'Santarém',
    stateAbbreviation: 'PA',
    stateName: 'Pará',
    region: 'Norte',
    ibgeCode: '1506807',
    type: 'cidade',
    zipCodeStart: '68000-000',
    zipCodeEnd: '68130-999',
    zipCodeRanges: [
      { start: '68005-000', end: '68010-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '68020-000', end: '68025-999', area: 'Zona Oeste', neighborhood: 'Mapiri' }
    ]
  },
  {
    id: 9,
    name: 'Araguaína',
    stateAbbreviation: 'TO',
    stateName: 'Tocantins',
    region: 'Norte',
    ibgeCode: '1702109',
    type: 'cidade',
    zipCodeStart: '77800-000',
    zipCodeEnd: '77848-999',
    zipCodeRanges: [
      { start: '77804-000', end: '77808-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 10,
    name: 'Vilhena',
    stateAbbreviation: 'RO',
    stateName: 'Rondônia',
    region: 'Norte',
    ibgeCode: '1100304',
    type: 'cidade',
    zipCodeStart: '76980-000',
    zipCodeEnd: '76999-999',
    zipCodeRanges: [
      { start: '76980-000', end: '76984-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },

  // REGIÃO NORDESTE (10 cidades)
  {
    id: 11,
    name: 'Salvador',
    stateAbbreviation: 'BA',
    stateName: 'Bahia',
    region: 'Nordeste',
    ibgeCode: '2927408',
    type: 'cidade',
    zipCodeStart: '40000-000',
    zipCodeEnd: '42599-999',
    zipCodeRanges: [
      { start: '40010-000', end: '40029-999', area: 'Centro', neighborhood: 'Comércio' },
      { start: '40110-000', end: '40119-999', area: 'Centro Histórico', neighborhood: 'Pelourinho' },
      { start: '41100-000', end: '41199-999', area: 'Barra', neighborhood: 'Barra' }
    ]
  },
  {
    id: 12,
    name: 'Fortaleza',
    stateAbbreviation: 'CE',
    stateName: 'Ceará',
    region: 'Nordeste',
    ibgeCode: '2304400',
    type: 'cidade',
    zipCodeStart: '60000-000',
    zipCodeEnd: '60999-999',
    zipCodeRanges: [
      { start: '60010-000', end: '60029-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '60115-000', end: '60125-999', area: 'Praia', neighborhood: 'Meireles' },
      { start: '60165-000', end: '60175-999', area: 'Praia', neighborhood: 'Aldeota' }
    ]
  },
  {
    id: 13,
    name: 'Recife',
    stateAbbreviation: 'PE',
    stateName: 'Pernambuco',
    region: 'Nordeste',
    ibgeCode: '2611606',
    type: 'cidade',
    zipCodeStart: '50000-000',
    zipCodeEnd: '52999-999',
    zipCodeRanges: [
      { start: '50010-000', end: '50029-999', area: 'Centro', neighborhood: 'Recife' },
      { start: '50030-000', end: '50049-999', area: 'Centro', neighborhood: 'Santo Antônio' },
      { start: '51010-000', end: '51029-999', area: 'Zona Norte', neighborhood: 'Boa Vista' }
    ]
  },
  {
    id: 14,
    name: 'São Luís',
    stateAbbreviation: 'MA',
    stateName: 'Maranhão',
    region: 'Nordeste',
    ibgeCode: '2111300',
    type: 'cidade',
    zipCodeStart: '65000-000',
    zipCodeEnd: '65115-999',
    zipCodeRanges: [
      { start: '65010-000', end: '65029-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '65060-000', end: '65069-999', area: 'Zona Sul', neighborhood: 'Renascença' }
    ]
  },
  {
    id: 15,
    name: 'Natal',
    stateAbbreviation: 'RN',
    stateName: 'Rio Grande do Norte',
    region: 'Nordeste',
    ibgeCode: '2408102',
    type: 'cidade',
    zipCodeStart: '59000-000',
    zipCodeEnd: '59149-999',
    zipCodeRanges: [
      { start: '59010-000', end: '59029-999', area: 'Centro', neighborhood: 'Cidade Alta' },
      { start: '59054-000', end: '59064-999', area: 'Praia', neighborhood: 'Ponta Negra' }
    ]
  },
  {
    id: 16,
    name: 'Maceió',
    stateAbbreviation: 'AL',
    stateName: 'Alagoas',
    region: 'Nordeste',
    ibgeCode: '2704302',
    type: 'cidade',
    zipCodeStart: '57000-000',
    zipCodeEnd: '57099-999',
    zipCodeRanges: [
      { start: '57010-000', end: '57019-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '57035-000', end: '57039-999', area: 'Praia', neighborhood: 'Pajuçara' }
    ]
  },
  {
    id: 17,
    name: 'Teresina',
    stateAbbreviation: 'PI',
    stateName: 'Piauí',
    region: 'Nordeste',
    ibgeCode: '2211001',
    type: 'cidade',
    zipCodeStart: '64000-000',
    zipCodeEnd: '64099-999',
    zipCodeRanges: [
      { start: '64000-000', end: '64009-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '64048-000', end: '64052-999', area: 'Zona Leste', neighborhood: 'Fátima' }
    ]
  },
  {
    id: 18,
    name: 'João Pessoa',
    stateAbbreviation: 'PB',
    stateName: 'Paraíba',
    region: 'Nordeste',
    ibgeCode: '2507507',
    type: 'cidade',
    zipCodeStart: '58000-000',
    zipCodeEnd: '58099-999',
    zipCodeRanges: [
      { start: '58010-000', end: '58019-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '58038-000', end: '58042-999', area: 'Praia', neighborhood: 'Manaíra' }
    ]
  },
  {
    id: 19,
    name: 'Aracaju',
    stateAbbreviation: 'SE',
    stateName: 'Sergipe',
    region: 'Nordeste',
    ibgeCode: '2800308',
    type: 'cidade',
    zipCodeStart: '49000-000',
    zipCodeEnd: '49099-999',
    zipCodeRanges: [
      { start: '49010-000', end: '49019-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '49035-000', end: '49038-999', area: 'Zona Sul', neighborhood: 'Atalaia' }
    ]
  },
  {
    id: 20,
    name: 'Feira de Santana',
    stateAbbreviation: 'BA',
    stateName: 'Bahia',
    region: 'Nordeste',
    ibgeCode: '2910800',
    type: 'cidade',
    zipCodeStart: '44000-000',
    zipCodeEnd: '44099-999',
    zipCodeRanges: [
      { start: '44001-000', end: '44009-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },

  // REGIÃO CENTRO-OESTE (10 cidades)
  {
    id: 21,
    name: 'Brasília',
    stateAbbreviation: 'DF',
    stateName: 'Distrito Federal',
    region: 'Centro-Oeste',
    ibgeCode: '5300108',
    type: 'cidade',
    zipCodeStart: '70000-000',
    zipCodeEnd: '72799-999',
    zipCodeRanges: [
      { start: '70040-000', end: '70049-999', area: 'Plano Piloto', neighborhood: 'Asa Sul' },
      { start: '70297-000', end: '70359-999', area: 'Plano Piloto', neighborhood: 'Asa Norte' },
      { start: '71000-000', end: '71099-999', area: 'Região Administrativa', neighborhood: 'Guará' }
    ]
  },
  {
    id: 22,
    name: 'Goiânia',
    stateAbbreviation: 'GO',
    stateName: 'Goiás',
    region: 'Centro-Oeste',
    ibgeCode: '5208707',
    type: 'cidade',
    zipCodeStart: '74000-000',
    zipCodeEnd: '74999-999',
    zipCodeRanges: [
      { start: '74010-000', end: '74019-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '74063-000', end: '74069-999', area: 'Setor Oeste', neighborhood: 'Setor Oeste' },
      { start: '74110-000', end: '74119-999', area: 'Setor Sul', neighborhood: 'Setor Sul' }
    ]
  },
  {
    id: 23,
    name: 'Campo Grande',
    stateAbbreviation: 'MS',
    stateName: 'Mato Grosso do Sul',
    region: 'Centro-Oeste',
    ibgeCode: '5002704',
    type: 'cidade',
    zipCodeStart: '79000-000',
    zipCodeEnd: '79124-999',
    zipCodeRanges: [
      { start: '79002-000', end: '79009-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '79020-000', end: '79029-999', area: 'Zona Norte', neighborhood: 'Amambaí' }
    ]
  },
  {
    id: 24,
    name: 'Cuiabá',
    stateAbbreviation: 'MT',
    stateName: 'Mato Grosso',
    region: 'Centro-Oeste',
    ibgeCode: '5103403',
    type: 'cidade',
    zipCodeStart: '78000-000',
    zipCodeEnd: '78099-999',
    zipCodeRanges: [
      { start: '78005-000', end: '78015-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '78043-000', end: '78049-999', area: 'Zona Sul', neighborhood: 'Quilombo' }
    ]
  },
  {
    id: 25,
    name: 'Anápolis',
    stateAbbreviation: 'GO',
    stateName: 'Goiás',
    region: 'Centro-Oeste',
    ibgeCode: '5201108',
    type: 'cidade',
    zipCodeStart: '75000-000',
    zipCodeEnd: '75139-999',
    zipCodeRanges: [
      { start: '75020-000', end: '75029-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 26,
    name: 'Dourados',
    stateAbbreviation: 'MS',
    stateName: 'Mato Grosso do Sul',
    region: 'Centro-Oeste',
    ibgeCode: '5003702',
    type: 'cidade',
    zipCodeStart: '79800-000',
    zipCodeEnd: '79849-999',
    zipCodeRanges: [
      { start: '79804-000', end: '79808-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 27,
    name: 'Aparecida de Goiânia',
    stateAbbreviation: 'GO',
    stateName: 'Goiás',
    region: 'Centro-Oeste',
    ibgeCode: '5201405',
    type: 'cidade',
    zipCodeStart: '74900-000',
    zipCodeEnd: '74993-999',
    zipCodeRanges: [
      { start: '74905-000', end: '74909-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 28,
    name: 'Várzea Grande',
    stateAbbreviation: 'MT',
    stateName: 'Mato Grosso',
    region: 'Centro-Oeste',
    ibgeCode: '5108402',
    type: 'cidade',
    zipCodeStart: '78110-000',
    zipCodeEnd: '78169-999',
    zipCodeRanges: [
      { start: '78115-000', end: '78119-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 29,
    name: 'Rio Verde',
    stateAbbreviation: 'GO',
    stateName: 'Goiás',
    region: 'Centro-Oeste',
    ibgeCode: '5218805',
    type: 'cidade',
    zipCodeStart: '75900-000',
    zipCodeEnd: '75919-999',
    zipCodeRanges: [
      { start: '75901-000', end: '75905-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 30,
    name: 'Águas Claras',
    stateAbbreviation: 'DF',
    stateName: 'Distrito Federal',
    region: 'Centro-Oeste',
    ibgeCode: '5300108',
    type: 'cidade',
    zipCodeStart: '71900-000',
    zipCodeEnd: '71936-999',
    zipCodeRanges: [
      { start: '71900-000', end: '71936-999', area: 'Águas Claras', neighborhood: 'Águas Claras' }
    ]
  },

  // REGIÃO SUDESTE (10 cidades)
  {
    id: 31,
    name: 'São Paulo',
    stateAbbreviation: 'SP',
    stateName: 'São Paulo',
    region: 'Sudeste',
    ibgeCode: '3550308',
    type: 'cidade',
    zipCodeStart: '01000-000',
    zipCodeEnd: '05999-999',
    zipCodeRanges: [
      { start: '01000-000', end: '01599-999', area: 'Centro', neighborhood: 'Sé' },
      { start: '04000-000', end: '04599-999', area: 'Zona Sul', neighborhood: 'Vila Mariana' },
      { start: '05000-000', end: '05599-999', area: 'Zona Oeste', neighborhood: 'Pinheiros' }
    ]
  },
  {
    id: 32,
    name: 'Rio de Janeiro',
    stateAbbreviation: 'RJ',
    stateName: 'Rio de Janeiro',
    region: 'Sudeste',
    ibgeCode: '3304557',
    type: 'cidade',
    zipCodeStart: '20000-000',
    zipCodeEnd: '23799-999',
    zipCodeRanges: [
      { start: '20010-000', end: '20099-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '22010-000', end: '22099-999', area: 'Zona Sul', neighborhood: 'Copacabana' },
      { start: '22400-000', end: '22499-999', area: 'Zona Sul', neighborhood: 'Ipanema' }
    ]
  },
  {
    id: 33,
    name: 'Belo Horizonte',
    stateAbbreviation: 'MG',
    stateName: 'Minas Gerais',
    region: 'Sudeste',
    ibgeCode: '3106200',
    type: 'cidade',
    zipCodeStart: '30000-000',
    zipCodeEnd: '31999-999',
    zipCodeRanges: [
      { start: '30110-000', end: '30199-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '30130-000', end: '30139-999', area: 'Centro-Sul', neighborhood: 'Savassi' },
      { start: '31270-000', end: '31279-999', area: 'Pampulha', neighborhood: 'Pampulha' }
    ]
  },
  {
    id: 34,
    name: 'Vitória',
    stateAbbreviation: 'ES',
    stateName: 'Espírito Santo',
    region: 'Sudeste',
    ibgeCode: '3205309',
    type: 'cidade',
    zipCodeStart: '29000-000',
    zipCodeEnd: '29099-999',
    zipCodeRanges: [
      { start: '29010-000', end: '29019-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '29050-000', end: '29059-999', area: 'Praia', neighborhood: 'Praia do Canto' }
    ]
  },
  {
    id: 35,
    name: 'Campinas',
    stateAbbreviation: 'SP',
    stateName: 'São Paulo',
    region: 'Sudeste',
    ibgeCode: '3509502',
    type: 'cidade',
    zipCodeStart: '13000-000',
    zipCodeEnd: '13149-999',
    zipCodeRanges: [
      { start: '13010-000', end: '13019-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '13070-000', end: '13079-999', area: 'Cambuí', neighborhood: 'Cambuí' }
    ]
  },
  {
    id: 36,
    name: 'Uberlândia',
    stateAbbreviation: 'MG',
    stateName: 'Minas Gerais',
    region: 'Sudeste',
    ibgeCode: '3170206',
    type: 'cidade',
    zipCodeStart: '38400-000',
    zipCodeEnd: '38499-999',
    zipCodeRanges: [
      { start: '38400-000', end: '38409-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 37,
    name: 'Niterói',
    stateAbbreviation: 'RJ',
    stateName: 'Rio de Janeiro',
    region: 'Sudeste',
    ibgeCode: '3303302',
    type: 'cidade',
    zipCodeStart: '24000-000',
    zipCodeEnd: '24799-999',
    zipCodeRanges: [
      { start: '24020-000', end: '24029-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 38,
    name: 'Juiz de Fora',
    stateAbbreviation: 'MG',
    stateName: 'Minas Gerais',
    region: 'Sudeste',
    ibgeCode: '3136702',
    type: 'cidade',
    zipCodeStart: '36000-000',
    zipCodeEnd: '36130-999',
    zipCodeRanges: [
      { start: '36010-000', end: '36019-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 39,
    name: 'Santos',
    stateAbbreviation: 'SP',
    stateName: 'São Paulo',
    region: 'Sudeste',
    ibgeCode: '3548500',
    type: 'cidade',
    zipCodeStart: '11000-000',
    zipCodeEnd: '11099-999',
    zipCodeRanges: [
      { start: '11010-000', end: '11019-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 40,
    name: 'Vila Velha',
    stateAbbreviation: 'ES',
    stateName: 'Espírito Santo',
    region: 'Sudeste',
    ibgeCode: '3205200',
    type: 'cidade',
    zipCodeStart: '29100-000',
    zipCodeEnd: '29199-999',
    zipCodeRanges: [
      { start: '29100-000', end: '29109-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },

  // REGIÃO SUL (10 cidades)
  {
    id: 41,
    name: 'Curitiba',
    stateAbbreviation: 'PR',
    stateName: 'Paraná',
    region: 'Sul',
    ibgeCode: '4106902',
    type: 'cidade',
    zipCodeStart: '80000-000',
    zipCodeEnd: '82999-999',
    zipCodeRanges: [
      { start: '80010-000', end: '80029-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '80240-000', end: '80249-999', area: 'Batel', neighborhood: 'Batel' },
      { start: '82510-000', end: '82519-999', area: 'Santa Felicidade', neighborhood: 'Santa Felicidade' }
    ]
  },
  {
    id: 42,
    name: 'Porto Alegre',
    stateAbbreviation: 'RS',
    stateName: 'Rio Grande do Sul',
    region: 'Sul',
    ibgeCode: '4314902',
    type: 'cidade',
    zipCodeStart: '90000-000',
    zipCodeEnd: '91999-999',
    zipCodeRanges: [
      { start: '90010-000', end: '90029-999', area: 'Centro', neighborhood: 'Centro Histórico' },
      { start: '90430-000', end: '90449-999', area: 'Zona Leste', neighborhood: 'Bom Fim' },
      { start: '91040-000', end: '91049-999', area: 'Zona Norte', neighborhood: 'Cristo Redentor' }
    ]
  },
  {
    id: 43,
    name: 'Florianópolis',
    stateAbbreviation: 'SC',
    stateName: 'Santa Catarina',
    region: 'Sul',
    ibgeCode: '4205407',
    type: 'cidade',
    zipCodeStart: '88000-000',
    zipCodeEnd: '88099-999',
    zipCodeRanges: [
      { start: '88010-000', end: '88019-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '88036-000', end: '88039-999', area: 'Norte da Ilha', neighborhood: 'Canasvieiras' },
      { start: '88056-000', end: '88059-999', area: 'Sul da Ilha', neighborhood: 'Campeche' }
    ]
  },
  {
    id: 44,
    name: 'Londrina',
    stateAbbreviation: 'PR',
    stateName: 'Paraná',
    region: 'Sul',
    ibgeCode: '4113700',
    type: 'cidade',
    zipCodeStart: '86000-000',
    zipCodeEnd: '86199-999',
    zipCodeRanges: [
      { start: '86010-000', end: '86019-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 45,
    name: 'Caxias do Sul',
    stateAbbreviation: 'RS',
    stateName: 'Rio Grande do Sul',
    region: 'Sul',
    ibgeCode: '4305108',
    type: 'cidade',
    zipCodeStart: '95000-000',
    zipCodeEnd: '95129-999',
    zipCodeRanges: [
      { start: '95010-000', end: '95019-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 46,
    name: 'Joinville',
    stateAbbreviation: 'SC',
    stateName: 'Santa Catarina',
    region: 'Sul',
    ibgeCode: '4209102',
    type: 'cidade',
    zipCodeStart: '89200-000',
    zipCodeEnd: '89239-999',
    zipCodeRanges: [
      { start: '89201-000', end: '89209-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 47,
    name: 'Maringá',
    stateAbbreviation: 'PR',
    stateName: 'Paraná',
    region: 'Sul',
    ibgeCode: '4115200',
    type: 'cidade',
    zipCodeStart: '87000-000',
    zipCodeEnd: '87099-999',
    zipCodeRanges: [
      { start: '87010-000', end: '87019-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 48,
    name: 'Ponta Grossa',
    stateAbbreviation: 'PR',
    stateName: 'Paraná',
    region: 'Sul',
    ibgeCode: '4119905',
    type: 'cidade',
    zipCodeStart: '84000-000',
    zipCodeEnd: '84099-999',
    zipCodeRanges: [
      { start: '84010-000', end: '84019-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 49,
    name: 'Blumenau',
    stateAbbreviation: 'SC',
    stateName: 'Santa Catarina',
    region: 'Sul',
    ibgeCode: '4202404',
    type: 'cidade',
    zipCodeStart: '89000-000',
    zipCodeEnd: '89099-999',
    zipCodeRanges: [
      { start: '89010-000', end: '89019-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 50,
    name: 'Pelotas',
    stateAbbreviation: 'RS',
    stateName: 'Rio Grande do Sul',
    region: 'Sul',
    ibgeCode: '4314407',
    type: 'cidade',
    zipCodeStart: '96000-000',
    zipCodeEnd: '96099-999',
    zipCodeRanges: [
      { start: '96010-000', end: '96019-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  }
];
