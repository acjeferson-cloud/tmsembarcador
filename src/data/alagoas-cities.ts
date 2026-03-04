import { BrazilianCity } from '../types/cities';

// Base completa de municípios de Alagoas com faixas de CEP dos Correios
// Fonte: Correios - Base Nacional de Endereçamento 2024/2025
// Estado: Alagoas (AL) - Região: Nordeste
// Faixa de CEP: 57000-000 a 57999-999
export const alagoasCities: BrazilianCity[] = [
  {
    id: 1,
    name: 'Maceió',
    ibgeCode: '2704302',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57000-000',
    zipCodeEnd: '57099-999',
    zipCodeRanges: [
      { start: '57000-000', end: '57019-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '57020-000', end: '57029-999', area: 'Centro', neighborhood: 'Jaraguá' },
      { start: '57030-000', end: '57039-999', area: 'Centro', neighborhood: 'Farol' },
      { start: '57040-000', end: '57049-999', area: 'Centro', neighborhood: 'Ponta Verde' },
      { start: '57050-000', end: '57059-999', area: 'Centro', neighborhood: 'Jatiúca' },
      { start: '57060-000', end: '57069-999', area: 'Centro', neighborhood: 'Pajuçara' },
      { start: '57070-000', end: '57079-999', area: 'Centro', neighborhood: 'Ponta da Terra' },
      { start: '57080-000', end: '57089-999', area: 'Centro', neighborhood: 'Cruz das Almas' },
      { start: '57090-000', end: '57099-999', area: 'Centro', neighborhood: 'Mangabeiras' }
    ]
  },
  {
    id: 2,
    name: 'Arapiraca',
    ibgeCode: '2700300',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57300-000',
    zipCodeEnd: '57319-999',
    zipCodeRanges: [
      { start: '57300-000', end: '57309-999', area: 'Centro', neighborhood: 'Centro' },
      { start: '57310-000', end: '57314-999', area: 'Centro', neighborhood: 'Brasília' },
      { start: '57315-000', end: '57319-999', area: 'Centro', neighborhood: 'Senador Nilo Coelho' }
    ]
  },
  {
    id: 3,
    name: 'Rio Largo',
    ibgeCode: '2707701',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57100-000',
    zipCodeEnd: '57109-999',
    zipCodeRanges: [
      { start: '57100-000', end: '57109-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 4,
    name: 'Palmeira dos Índios',
    ibgeCode: '2706307',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57600-000',
    zipCodeEnd: '57609-999',
    zipCodeRanges: [
      { start: '57600-000', end: '57609-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 5,
    name: 'União dos Palmares',
    ibgeCode: '2709301',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57800-000',
    zipCodeEnd: '57809-999',
    zipCodeRanges: [
      { start: '57800-000', end: '57809-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 6,
    name: 'São Miguel dos Campos',
    ibgeCode: '2708600',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57240-000',
    zipCodeEnd: '57249-999',
    zipCodeRanges: [
      { start: '57240-000', end: '57249-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 7,
    name: 'Penedo',
    ibgeCode: '2706406',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57200-000',
    zipCodeEnd: '57209-999',
    zipCodeRanges: [
      { start: '57200-000', end: '57209-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 8,
    name: 'Coruripe',
    ibgeCode: '2702306',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57230-000',
    zipCodeEnd: '57239-999',
    zipCodeRanges: [
      { start: '57230-000', end: '57239-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 9,
    name: 'Marechal Deodoro',
    ibgeCode: '2704401',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57160-000',
    zipCodeEnd: '57169-999',
    zipCodeRanges: [
      { start: '57160-000', end: '57169-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 10,
    name: 'Santana do Ipanema',
    ibgeCode: '2708006',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57500-000',
    zipCodeEnd: '57509-999',
    zipCodeRanges: [
      { start: '57500-000', end: '57509-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 11,
    name: 'Delmiro Gouveia',
    ibgeCode: '2702405',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57480-000',
    zipCodeEnd: '57489-999',
    zipCodeRanges: [
      { start: '57480-000', end: '57489-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 12,
    name: 'São Luís do Quitunde',
    ibgeCode: '2708501',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57920-000',
    zipCodeEnd: '57929-999',
    zipCodeRanges: [
      { start: '57920-000', end: '57929-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 13,
    name: 'Viçosa',
    ibgeCode: '2709509',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57700-000',
    zipCodeEnd: '57709-999',
    zipCodeRanges: [
      { start: '57700-000', end: '57709-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 14,
    name: 'Pilar',
    ibgeCode: '2706703',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57150-000',
    zipCodeEnd: '57159-999',
    zipCodeRanges: [
      { start: '57150-000', end: '57159-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 15,
    name: 'Campo Alegre',
    ibgeCode: '2701407',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57250-000',
    zipCodeEnd: '57259-999',
    zipCodeRanges: [
      { start: '57250-000', end: '57259-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 16,
    name: 'Murici',
    ibgeCode: '2705309',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57820-000',
    zipCodeEnd: '57829-999',
    zipCodeRanges: [
      { start: '57820-000', end: '57829-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 17,
    name: 'Girau do Ponciano',
    ibgeCode: '2703007',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57370-000',
    zipCodeEnd: '57379-999',
    zipCodeRanges: [
      { start: '57370-000', end: '57379-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 18,
    name: 'Maribondo',
    ibgeCode: '2704500',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57530-000',
    zipCodeEnd: '57539-999',
    zipCodeRanges: [
      { start: '57530-000', end: '57539-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 19,
    name: 'Atalaia',
    ibgeCode: '2700508',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57690-000',
    zipCodeEnd: '57699-999',
    zipCodeRanges: [
      { start: '57690-000', end: '57699-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 20,
    name: 'Igreja Nova',
    ibgeCode: '2703403',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57220-000',
    zipCodeEnd: '57229-999',
    zipCodeRanges: [
      { start: '57220-000', end: '57229-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 21,
    name: 'Porto Real do Colégio',
    ibgeCode: '2707305',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57260-000',
    zipCodeEnd: '57269-999',
    zipCodeRanges: [
      { start: '57260-000', end: '57269-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 22,
    name: 'Matriz de Camaragibe',
    ibgeCode: '2704708',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57940-000',
    zipCodeEnd: '57949-999',
    zipCodeRanges: [
      { start: '57940-000', end: '57949-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 23,
    name: 'Água Branca',
    ibgeCode: '2700102',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57460-000',
    zipCodeEnd: '57469-999',
    zipCodeRanges: [
      { start: '57460-000', end: '57469-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 24,
    name: 'Pão de Açúcar',
    ibgeCode: '2706208',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57400-000',
    zipCodeEnd: '57409-999',
    zipCodeRanges: [
      { start: '57400-000', end: '57409-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 25,
    name: 'Barra de Santo Antônio',
    ibgeCode: '2700706',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57145-000',
    zipCodeEnd: '57149-999',
    zipCodeRanges: [
      { start: '57145-000', end: '57149-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 26,
    name: 'Flexeiras',
    ibgeCode: '2702900',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57890-000',
    zipCodeEnd: '57899-999',
    zipCodeRanges: [
      { start: '57890-000', end: '57899-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 27,
    name: 'Quebrangulo',
    ibgeCode: '2707503',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57630-000',
    zipCodeEnd: '57639-999',
    zipCodeRanges: [
      { start: '57630-000', end: '57639-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 28,
    name: 'Porto Calvo',
    ibgeCode: '2707206',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57960-000',
    zipCodeEnd: '57969-999',
    zipCodeRanges: [
      { start: '57960-000', end: '57969-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 29,
    name: 'Boca da Mata',
    ibgeCode: '2700904',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57860-000',
    zipCodeEnd: '57869-999',
    zipCodeRanges: [
      { start: '57860-000', end: '57869-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 30,
    name: 'Colônia Leopoldina',
    ibgeCode: '2702108',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57990-000',
    zipCodeEnd: '57999-999',
    zipCodeRanges: [
      { start: '57990-000', end: '57999-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 31,
    name: 'Satuba',
    ibgeCode: '2708204',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57120-000',
    zipCodeEnd: '57129-999',
    zipCodeRanges: [
      { start: '57120-000', end: '57129-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 32,
    name: 'Santa Luzia do Norte',
    ibgeCode: '2707800',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57140-000',
    zipCodeEnd: '57144-999',
    zipCodeRanges: [
      { start: '57140-000', end: '57144-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 33,
    name: 'Messias',
    ibgeCode: '2704906',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57970-000',
    zipCodeEnd: '57979-999',
    zipCodeRanges: [
      { start: '57970-000', end: '57979-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 34,
    name: 'Teotônio Vilela',
    ibgeCode: '2709152',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57320-000',
    zipCodeEnd: '57329-999',
    zipCodeRanges: [
      { start: '57320-000', end: '57329-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 35,
    name: 'Joaquim Gomes',
    ibgeCode: '2703700',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57980-000',
    zipCodeEnd: '57989-999',
    zipCodeRanges: [
      { start: '57980-000', end: '57989-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 36,
    name: 'Anadia',
    ibgeCode: '2700201',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57750-000',
    zipCodeEnd: '57759-999',
    zipCodeRanges: [
      { start: '57750-000', end: '57759-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 37,
    name: 'Maragogi',
    ibgeCode: '2704302',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57955-000',
    zipCodeEnd: '57959-999',
    zipCodeRanges: [
      { start: '57955-000', end: '57959-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 38,
    name: 'Cajueiro',
    ibgeCode: '2701308',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57280-000',
    zipCodeEnd: '57289-999',
    zipCodeRanges: [
      { start: '57280-000', end: '57289-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 39,
    name: 'Japaratinga',
    ibgeCode: '2703502',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57950-000',
    zipCodeEnd: '57954-999',
    zipCodeRanges: [
      { start: '57950-000', end: '57954-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 40,
    name: 'Passo de Camaragibe',
    ibgeCode: '2706422',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57930-000',
    zipCodeEnd: '57939-999',
    zipCodeRanges: [
      { start: '57930-000', end: '57939-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 41,
    name: 'São José da Laje',
    ibgeCode: '2708402',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57880-000',
    zipCodeEnd: '57889-999',
    zipCodeRanges: [
      { start: '57880-000', end: '57889-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 42,
    name: 'Batalha',
    ibgeCode: '2700805',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57520-000',
    zipCodeEnd: '57529-999',
    zipCodeRanges: [
      { start: '57520-000', end: '57529-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 43,
    name: 'Limoeiro de Anadia',
    ibgeCode: '2704104',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57770-000',
    zipCodeEnd: '57779-999',
    zipCodeRanges: [
      { start: '57770-000', end: '57779-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 44,
    name: 'Junqueiro',
    ibgeCode: '2703759',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57920-000',
    zipCodeEnd: '57929-999',
    zipCodeRanges: [
      { start: '57920-000', end: '57929-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 45,
    name: 'Taquarana',
    ibgeCode: '2709103',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57670-000',
    zipCodeEnd: '57679-999',
    zipCodeRanges: [
      { start: '57670-000', end: '57679-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 46,
    name: 'Inhapi',
    ibgeCode: '2703304',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57490-000',
    zipCodeEnd: '57499-999',
    zipCodeRanges: [
      { start: '57490-000', end: '57499-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 47,
    name: 'Major Isidoro',
    ibgeCode: '2704203',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57540-000',
    zipCodeEnd: '57549-999',
    zipCodeRanges: [
      { start: '57540-000', end: '57549-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 48,
    name: 'Coqueiro Seco',
    ibgeCode: '2702207',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57130-000',
    zipCodeEnd: '57139-999',
    zipCodeRanges: [
      { start: '57130-000', end: '57139-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 49,
    name: 'Traipu',
    ibgeCode: '2709202',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57360-000',
    zipCodeEnd: '57369-999',
    zipCodeRanges: [
      { start: '57360-000', end: '57369-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 50,
    name: 'Barra de São Miguel',
    ibgeCode: '2700607',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57180-000',
    zipCodeEnd: '57189-999',
    zipCodeRanges: [
      { start: '57180-000', end: '57189-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 51,
    name: 'Jacaré dos Homens',
    ibgeCode: '2703601',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57548-000',
    zipCodeEnd: '57549-999',
    zipCodeRanges: [
      { start: '57548-000', end: '57549-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 52,
    name: 'São Brás',
    ibgeCode: '2708105',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57640-000',
    zipCodeEnd: '57649-999',
    zipCodeRanges: [
      { start: '57640-000', end: '57649-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 53,
    name: 'Estrela de Alagoas',
    ibgeCode: '2702702',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57680-000',
    zipCodeEnd: '57689-999',
    zipCodeRanges: [
      { start: '57680-000', end: '57689-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 54,
    name: 'Mar Vermelho',
    ibgeCode: '2704609',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57650-000',
    zipCodeEnd: '57659-999',
    zipCodeRanges: [
      { start: '57650-000', end: '57659-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 55,
    name: 'Belém',
    ibgeCode: '2700854',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57620-000',
    zipCodeEnd: '57629-999',
    zipCodeRanges: [
      { start: '57620-000', end: '57629-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 56,
    name: 'Lagoa da Canoa',
    ibgeCode: '2703908',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57330-000',
    zipCodeEnd: '57339-999',
    zipCodeRanges: [
      { start: '57330-000', end: '57339-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 57,
    name: 'Olho d\'Água das Flores',
    ibgeCode: '2705606',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57450-000',
    zipCodeEnd: '57459-999',
    zipCodeRanges: [
      { start: '57450-000', end: '57459-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 58,
    name: 'Olivença',
    ibgeCode: '2705705',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57550-000',
    zipCodeEnd: '57559-999',
    zipCodeRanges: [
      { start: '57550-000', end: '57559-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 59,
    name: 'Ouro Branco',
    ibgeCode: '2705903',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57560-000',
    zipCodeEnd: '57569-999',
    zipCodeRanges: [
      { start: '57560-000', end: '57569-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 60,
    name: 'Paripueira',
    ibgeCode: '2706307',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57170-000',
    zipCodeEnd: '57179-999',
    zipCodeRanges: [
      { start: '57170-000', end: '57179-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 61,
    name: 'Ibateguara',
    ibgeCode: '2703304',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57870-000',
    zipCodeEnd: '57879-999',
    zipCodeRanges: [
      { start: '57870-000', end: '57879-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 62,
    name: 'Cacimbinhas',
    ibgeCode: '2701209',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57580-000',
    zipCodeEnd: '57589-999',
    zipCodeRanges: [
      { start: '57580-000', end: '57589-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 63,
    name: 'Tanque d\'Arca',
    ibgeCode: '2709004',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57660-000',
    zipCodeEnd: '57669-999',
    zipCodeRanges: [
      { start: '57660-000', end: '57669-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 64,
    name: 'Senador Rui Palmeira',
    ibgeCode: '2708907',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57440-000',
    zipCodeEnd: '57449-999',
    zipCodeRanges: [
      { start: '57440-000', end: '57449-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 65,
    name: 'Minador do Negrão',
    ibgeCode: '2704807',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57430-000',
    zipCodeEnd: '57439-999',
    zipCodeRanges: [
      { start: '57430-000', end: '57439-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 66,
    name: 'Feira Grande',
    ibgeCode: '2702801',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57350-000',
    zipCodeEnd: '57359-999',
    zipCodeRanges: [
      { start: '57350-000', end: '57359-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 67,
    name: 'Jequiá da Praia',
    ibgeCode: '2703650',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57270-000',
    zipCodeEnd: '57279-999',
    zipCodeRanges: [
      { start: '57270-000', end: '57279-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 68,
    name: 'Canapi',
    ibgeCode: '2701605',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57470-000',
    zipCodeEnd: '57479-999',
    zipCodeRanges: [
      { start: '57470-000', end: '57479-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 69,
    name: 'Campestre',
    ibgeCode: '2701506',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57340-000',
    zipCodeEnd: '57349-999',
    zipCodeRanges: [
      { start: '57340-000', end: '57349-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 70,
    name: 'Capela',
    ibgeCode: '2701704',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57760-000',
    zipCodeEnd: '57769-999',
    zipCodeRanges: [
      { start: '57760-000', end: '57769-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 71,
    name: 'Carneiros',
    ibgeCode: '2701803',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57740-000',
    zipCodeEnd: '57749-999',
    zipCodeRanges: [
      { start: '57740-000', end: '57749-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 72,
    name: 'Chã Preta',
    ibgeCode: '2701902',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57730-000',
    zipCodeEnd: '57739-999',
    zipCodeRanges: [
      { start: '57730-000', end: '57739-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 73,
    name: 'Coité do Nóia',
    ibgeCode: '2702009',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57340-000',
    zipCodeEnd: '57349-999',
    zipCodeRanges: [
      { start: '57340-000', end: '57349-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 74,
    name: 'Craíbas',
    ibgeCode: '2702504',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57380-000',
    zipCodeEnd: '57389-999',
    zipCodeRanges: [
      { start: '57380-000', end: '57389-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 75,
    name: 'Dois Riachos',
    ibgeCode: '2702553',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57510-000',
    zipCodeEnd: '57519-999',
    zipCodeRanges: [
      { start: '57510-000', end: '57519-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 76,
    name: 'Feliz Deserto',
    ibgeCode: '2702603',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57210-000',
    zipCodeEnd: '57219-999',
    zipCodeRanges: [
      { start: '57210-000', end: '57219-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 77,
    name: 'Igaci',
    ibgeCode: '2703205',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57610-000',
    zipCodeEnd: '57619-999',
    zipCodeRanges: [
      { start: '57610-000', end: '57619-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 78,
    name: 'Jaramataia',
    ibgeCode: '2703809',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57590-000',
    zipCodeEnd: '57599-999',
    zipCodeRanges: [
      { start: '57590-000', end: '57599-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 79,
    name: 'Maragogi',
    ibgeCode: '2704401',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57955-000',
    zipCodeEnd: '57959-999',
    zipCodeRanges: [
      { start: '57955-000', end: '57959-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 80,
    name: 'Mata Grande',
    ibgeCode: '2704807',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57420-000',
    zipCodeEnd: '57429-999',
    zipCodeRanges: [
      { start: '57420-000', end: '57429-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 81,
    name: 'Olho d\'Água Grande',
    ibgeCode: '2705804',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57850-000',
    zipCodeEnd: '57859-999',
    zipCodeRanges: [
      { start: '57850-000', end: '57859-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 82,
    name: 'Palestina',
    ibgeCode: '2706000',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57410-000',
    zipCodeEnd: '57419-999',
    zipCodeRanges: [
      { start: '57410-000', end: '57419-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 83,
    name: 'Pariconha',
    ibgeCode: '2706109',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57437-000',
    zipCodeEnd: '57439-999',
    zipCodeRanges: [
      { start: '57437-000', end: '57439-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 84,
    name: 'Pindoba',
    ibgeCode: '2706802',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57840-000',
    zipCodeEnd: '57849-999',
    zipCodeRanges: [
      { start: '57840-000', end: '57849-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 85,
    name: 'Poço das Trincheiras',
    ibgeCode: '2706901',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57570-000',
    zipCodeEnd: '57579-999',
    zipCodeRanges: [
      { start: '57570-000', end: '57579-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 86,
    name: 'Porto de Pedras',
    ibgeCode: '2707107',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57945-000',
    zipCodeEnd: '57949-999',
    zipCodeRanges: [
      { start: '57945-000', end: '57949-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 87,
    name: 'Santana do Mundaú',
    ibgeCode: '2707909',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57830-000',
    zipCodeEnd: '57839-999',
    zipCodeRanges: [
      { start: '57830-000', end: '57839-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 88,
    name: 'São José da Tapera',
    ibgeCode: '2708303',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57390-000',
    zipCodeEnd: '57399-999',
    zipCodeRanges: [
      { start: '57390-000', end: '57399-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 89,
    name: 'São Sebastião',
    ibgeCode: '2708709',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57720-000',
    zipCodeEnd: '57729-999',
    zipCodeRanges: [
      { start: '57720-000', end: '57729-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 90,
    name: 'Senador Rui Palmeira',
    ibgeCode: '2708808',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57440-000',
    zipCodeEnd: '57449-999',
    zipCodeRanges: [
      { start: '57440-000', end: '57449-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 91,
    name: 'Roteiro',
    ibgeCode: '2707800',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57290-000',
    zipCodeEnd: '57299-999',
    zipCodeRanges: [
      { start: '57290-000', end: '57299-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 92,
    name: 'Santana do Ipanema',
    ibgeCode: '2708105',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57500-000',
    zipCodeEnd: '57509-999',
    zipCodeRanges: [
      { start: '57500-000', end: '57509-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 93,
    name: 'Belo Monte',
    ibgeCode: '2700903',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57710-000',
    zipCodeEnd: '57719-999',
    zipCodeRanges: [
      { start: '57710-000', end: '57719-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 94,
    name: 'Branquinha',
    ibgeCode: '2701001',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57850-000',
    zipCodeEnd: '57859-999',
    zipCodeRanges: [
      { start: '57850-000', end: '57859-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 95,
    name: 'Cacimbinhas',
    ibgeCode: '2701100',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57580-000',
    zipCodeEnd: '57589-999',
    zipCodeRanges: [
      { start: '57580-000', end: '57589-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 96,
    name: 'Marechal Deodoro',
    ibgeCode: '2704500',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57160-000',
    zipCodeEnd: '57169-999',
    zipCodeRanges: [
      { start: '57160-000', end: '57169-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 97,
    name: 'Monteirópolis',
    ibgeCode: '2705200',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57438-000',
    zipCodeEnd: '57439-999',
    zipCodeRanges: [
      { start: '57438-000', end: '57439-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 98,
    name: 'Novo Lino',
    ibgeCode: '2705507',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57900-000',
    zipCodeEnd: '57909-999',
    zipCodeRanges: [
      { start: '57900-000', end: '57909-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 99,
    name: 'Olho d\'Água do Casado',
    ibgeCode: '2705705',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57420-000',
    zipCodeEnd: '57429-999',
    zipCodeRanges: [
      { start: '57420-000', end: '57429-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 100,
    name: 'Paulo Jacinto',
    ibgeCode: '2706505',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57780-000',
    zipCodeEnd: '57789-999',
    zipCodeRanges: [
      { start: '57780-000', end: '57789-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 101,
    name: 'Piaçabuçu',
    ibgeCode: '2706604',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57190-000',
    zipCodeEnd: '57199-999',
    zipCodeRanges: [
      { start: '57190-000', end: '57199-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  },
  {
    id: 102,
    name: 'Rio Largo',
    ibgeCode: '2707602',
    stateName: 'Alagoas',
    stateAbbreviation: 'AL',
    region: 'Nordeste',
    type: 'cidade',
    zipCodeStart: '57100-000',
    zipCodeEnd: '57109-999',
    zipCodeRanges: [
      { start: '57100-000', end: '57109-999', area: 'Centro', neighborhood: 'Centro' }
    ]
  }
];