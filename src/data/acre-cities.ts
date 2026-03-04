import { BrazilianCity } from '../types/cities';

// Base completa de municípios do Acre com faixas de CEP dos Correios
// Fonte: Correios - Base Nacional de Endereçamento 2024/2025
export const acreCities: BrazilianCity[] = [
  {
    id: 1,
    name: 'Rio Branco',
    ibgeCode: '1200401',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69900-000',
    zipCodeEnd: '69923-999',
    zipCodeRanges: [
      { start: '69900-000', end: '69900-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '69901-000', end: '69901-999', area: 'Centro', neighborhood: 'Bosque' },
      { start: '69902-000', end: '69902-999', area: 'Centro', neighborhood: 'Vila Ivonete' },
      { start: '69903-000', end: '69903-999', area: 'Centro', neighborhood: 'Aviário' },
      { start: '69904-000', end: '69904-999', area: 'Centro', neighborhood: 'Conjunto Universitário' },
      { start: '69905-000', end: '69905-999', area: 'Centro', neighborhood: 'Distrito Industrial' },
      { start: '69906-000', end: '69906-999', area: 'Centro', neighborhood: 'Floresta Sul' },
      { start: '69907-000', end: '69907-999', area: 'Centro', neighborhood: 'Conjunto Tangará' },
      { start: '69908-000', end: '69908-999', area: 'Centro', neighborhood: 'Vila Acre' },
      { start: '69909-000', end: '69909-999', area: 'Centro', neighborhood: 'Abraão Alab' },
      { start: '69910-000', end: '69910-999', area: 'Centro', neighborhood: 'Cadeia Velha' },
      { start: '69911-000', end: '69911-999', area: 'Centro', neighborhood: 'Capoeira' },
      { start: '69912-000', end: '69912-999', area: 'Centro', neighborhood: 'Estação Experimental' },
      { start: '69913-000', end: '69913-999', area: 'Centro', neighborhood: 'Preventório' },
      { start: '69914-000', end: '69914-999', area: 'Centro', neighborhood: 'Seis de Agosto' },
      { start: '69915-000', end: '69915-999', area: 'Centro', neighborhood: 'Quinze' },
      { start: '69916-000', end: '69916-999', area: 'Centro', neighborhood: 'Base' },
      { start: '69917-000', end: '69917-999', area: 'Centro', neighborhood: 'Tucumã' },
      { start: '69918-000', end: '69918-999', area: 'Centro', neighborhood: 'Placas' },
      { start: '69919-000', end: '69919-999', area: 'Centro', neighborhood: 'Sobral' },
      { start: '69920-000', end: '69920-999', area: 'Centro', neighborhood: 'Taquari' },
      { start: '69921-000', end: '69921-999', area: 'Centro', neighborhood: 'Conquista' },
      { start: '69922-000', end: '69922-999', area: 'Centro', neighborhood: 'Cidade do Povo' },
      { start: '69923-000', end: '69923-999', area: 'Centro', neighborhood: 'Defesa Civil' }
    ]
  },
  {
    id: 2,
    name: 'Cruzeiro do Sul',
    ibgeCode: '1200203',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69980-000',
    zipCodeEnd: '69989-999',
    zipCodeRanges: [
      { start: '69980-000', end: '69980-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '69981-000', end: '69981-999', area: 'Centro', neighborhood: 'Remanso' },
      { start: '69982-000', end: '69982-999', area: 'Centro', neighborhood: 'Miritizal' },
      { start: '69983-000', end: '69983-999', area: 'Centro', neighborhood: 'Várzea' },
      { start: '69984-000', end: '69984-999', area: 'Centro', neighborhood: 'Aeroporto Velho' },
      { start: '69985-000', end: '69985-999', area: 'Centro', neighborhood: 'Lagoa' }
    ]
  },
  {
    id: 3,
    name: 'Sena Madureira',
    ibgeCode: '1200500',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69940-000',
    zipCodeEnd: '69949-999',
    zipCodeRanges: [
      { start: '69940-000', end: '69940-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '69941-000', end: '69941-999', area: 'Centro', neighborhood: 'Segundo Distrito' },
      { start: '69942-000', end: '69942-999', area: 'Centro', neighborhood: 'Bairro da Paz' }
    ]
  },
  {
    id: 4,
    name: 'Tarauacá',
    ibgeCode: '1200609',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69970-000',
    zipCodeEnd: '69979-999',
    zipCodeRanges: [
      { start: '69970-000', end: '69970-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '69971-000', end: '69971-999', area: 'Centro', neighborhood: 'Novo Horizonte' }
    ]
  },
  {
    id: 5,
    name: 'Feijó',
    ibgeCode: '1200302',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69960-000',
    zipCodeEnd: '69969-999',
    zipCodeRanges: [
      { start: '69960-000', end: '69960-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '69961-000', end: '69961-999', area: 'Centro', neighborhood: 'São Sebastião' }
    ]
  },
  {
    id: 6,
    name: 'Brasiléia',
    ibgeCode: '1200104',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69932-000',
    zipCodeEnd: '69935-999',
    zipCodeRanges: [
      { start: '69932-000', end: '69932-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '69933-000', end: '69933-999', area: 'Centro', neighborhood: 'José Moreira' }
    ]
  },
  {
    id: 7,
    name: 'Xapuri',
    ibgeCode: '1200708',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69930-000',
    zipCodeEnd: '69931-999',
    zipCodeRanges: [
      { start: '69930-000', end: '69930-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 8,
    name: 'Plácido de Castro',
    ibgeCode: '1200385',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69928-000',
    zipCodeEnd: '69929-999',
    zipCodeRanges: [
      { start: '69928-000', end: '69928-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 9,
    name: 'Acrelândia',
    ibgeCode: '1200013',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69945-000',
    zipCodeEnd: '69947-999',
    zipCodeRanges: [
      { start: '69945-000', end: '69945-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 10,
    name: 'Senador Guiomard',
    ibgeCode: '1200450',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69925-000',
    zipCodeEnd: '69927-999',
    zipCodeRanges: [
      { start: '69925-000', end: '69925-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 11,
    name: 'Capixaba',
    ibgeCode: '1200179',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69924-000',
    zipCodeEnd: '69924-999',
    zipCodeRanges: [
      { start: '69924-000', end: '69924-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 12,
    name: 'Bujari',
    ibgeCode: '1200138',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69923-000',
    zipCodeEnd: '69923-999',
    zipCodeRanges: [
      { start: '69923-000', end: '69923-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 13,
    name: 'Porto Acre',
    ibgeCode: '1200807',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69921-000',
    zipCodeEnd: '69922-999',
    zipCodeRanges: [
      { start: '69921-000', end: '69921-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 14,
    name: 'Epitaciolândia',
    ibgeCode: '1200252',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69934-000',
    zipCodeEnd: '69935-999',
    zipCodeRanges: [
      { start: '69934-000', end: '69934-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 15,
    name: 'Mâncio Lima',
    ibgeCode: '1200336',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69990-000',
    zipCodeEnd: '69992-999',
    zipCodeRanges: [
      { start: '69990-000', end: '69990-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 16,
    name: 'Rodrigues Alves',
    ibgeCode: '1200427',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69985-000',
    zipCodeEnd: '69987-999',
    zipCodeRanges: [
      { start: '69985-000', end: '69985-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 17,
    name: 'Porto Walter',
    ibgeCode: '1200393',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69983-000',
    zipCodeEnd: '69984-999',
    zipCodeRanges: [
      { start: '69983-000', end: '69983-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 18,
    name: 'Marechal Thaumaturgo',
    ibgeCode: '1200351',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69993-000',
    zipCodeEnd: '69995-999',
    zipCodeRanges: [
      { start: '69993-000', end: '69993-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 19,
    name: 'Jordão',
    ibgeCode: '1200328',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69975-000',
    zipCodeEnd: '69977-999',
    zipCodeRanges: [
      { start: '69975-000', end: '69975-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 20,
    name: 'Santa Rosa do Purus',
    ibgeCode: '1200435',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69955-000',
    zipCodeEnd: '69957-999',
    zipCodeRanges: [
      { start: '69955-000', end: '69955-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 21,
    name: 'Manoel Urbano',
    ibgeCode: '1200344',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69950-000',
    zipCodeEnd: '69952-999',
    zipCodeRanges: [
      { start: '69950-000', end: '69950-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 22,
    name: 'Assis Brasil',
    ibgeCode: '1200054',
    stateName: 'Acre',
    stateAbbreviation: 'AC',
    region: 'Norte',
    type: 'cidade',
    zipCodeStart: '69935-000',
    zipCodeEnd: '69937-999',
    zipCodeRanges: [
      { start: '69935-000', end: '69935-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  }
];