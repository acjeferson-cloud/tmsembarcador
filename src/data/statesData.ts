import { saveStates, loadStates } from '../services/storageService';

export interface BrazilianState {
  id: number;
  name: string;
  abbreviation: string;
  ibgeCode: string;
  capital: string;
  region: string;
}

// Dados iniciais
const initialStates: BrazilianState[] = [
  // Região Norte
  { id: 1, name: 'Acre', abbreviation: 'AC', ibgeCode: '12', capital: 'Rio Branco', region: 'Norte' },
  { id: 2, name: 'Amapá', abbreviation: 'AP', ibgeCode: '16', capital: 'Macapá', region: 'Norte' },
  { id: 3, name: 'Amazonas', abbreviation: 'AM', ibgeCode: '13', capital: 'Manaus', region: 'Norte' },
  { id: 4, name: 'Pará', abbreviation: 'PA', ibgeCode: '15', capital: 'Belém', region: 'Norte' },
  { id: 5, name: 'Rondônia', abbreviation: 'RO', ibgeCode: '11', capital: 'Porto Velho', region: 'Norte' },
  { id: 6, name: 'Roraima', abbreviation: 'RR', ibgeCode: '14', capital: 'Boa Vista', region: 'Norte' },
  { id: 7, name: 'Tocantins', abbreviation: 'TO', ibgeCode: '17', capital: 'Palmas', region: 'Norte' },

  // Região Nordeste
  { id: 8, name: 'Alagoas', abbreviation: 'AL', ibgeCode: '27', capital: 'Maceió', region: 'Nordeste' },
  { id: 9, name: 'Bahia', abbreviation: 'BA', ibgeCode: '29', capital: 'Salvador', region: 'Nordeste' },
  { id: 10, name: 'Ceará', abbreviation: 'CE', ibgeCode: '23', capital: 'Fortaleza', region: 'Nordeste' },
  { id: 11, name: 'Maranhão', abbreviation: 'MA', ibgeCode: '21', capital: 'São Luís', region: 'Nordeste' },
  { id: 12, name: 'Paraíba', abbreviation: 'PB', ibgeCode: '25', capital: 'João Pessoa', region: 'Nordeste' },
  { id: 13, name: 'Pernambuco', abbreviation: 'PE', ibgeCode: '26', capital: 'Recife', region: 'Nordeste' },
  { id: 14, name: 'Piauí', abbreviation: 'PI', ibgeCode: '22', capital: 'Teresina', region: 'Nordeste' },
  { id: 15, name: 'Rio Grande do Norte', abbreviation: 'RN', ibgeCode: '24', capital: 'Natal', region: 'Nordeste' },
  { id: 16, name: 'Sergipe', abbreviation: 'SE', ibgeCode: '28', capital: 'Aracaju', region: 'Nordeste' },

  // Região Centro-Oeste
  { id: 17, name: 'Distrito Federal', abbreviation: 'DF', ibgeCode: '53', capital: 'Brasília', region: 'Centro-Oeste' },
  { id: 18, name: 'Goiás', abbreviation: 'GO', ibgeCode: '52', capital: 'Goiânia', region: 'Centro-Oeste' },
  { id: 19, name: 'Mato Grosso', abbreviation: 'MT', ibgeCode: '51', capital: 'Cuiabá', region: 'Centro-Oeste' },
  { id: 20, name: 'Mato Grosso do Sul', abbreviation: 'MS', ibgeCode: '50', capital: 'Campo Grande', region: 'Centro-Oeste' },

  // Região Sudeste
  { id: 21, name: 'Espírito Santo', abbreviation: 'ES', ibgeCode: '32', capital: 'Vitória', region: 'Sudeste' },
  { id: 22, name: 'Minas Gerais', abbreviation: 'MG', ibgeCode: '31', capital: 'Belo Horizonte', region: 'Sudeste' },
  { id: 23, name: 'Rio de Janeiro', abbreviation: 'RJ', ibgeCode: '33', capital: 'Rio de Janeiro', region: 'Sudeste' },
  { id: 24, name: 'São Paulo', abbreviation: 'SP', ibgeCode: '35', capital: 'São Paulo', region: 'Sudeste' },

  // Região Sul
  { id: 25, name: 'Paraná', abbreviation: 'PR', ibgeCode: '41', capital: 'Curitiba', region: 'Sul' },
  { id: 26, name: 'Rio Grande do Sul', abbreviation: 'RS', ibgeCode: '43', capital: 'Porto Alegre', region: 'Sul' },
  { id: 27, name: 'Santa Catarina', abbreviation: 'SC', ibgeCode: '42', capital: 'Florianópolis', region: 'Sul' }
];

// Carregar dados do localStorage ou usar os dados iniciais
export let brazilianStates: BrazilianState[] = loadStates(initialStates);

export const regions = [
  'Todos',
  'Norte',
  'Nordeste',
  'Centro-Oeste',
  'Sudeste',
  'Sul'
];

// Functions to manage states
const addState = (state: Omit<BrazilianState, 'id'>) => {
  const newId = Math.max(...brazilianStates.map(s => s.id), 0) + 1;
  const newState = { ...state, id: newId };
  brazilianStates.push(newState);
  saveStates(brazilianStates);
  return newState;
};

const updateState = (id: number, updatedState: Partial<BrazilianState>) => {
  const index = brazilianStates.findIndex(s => s.id === id);
  if (index !== -1) {
    brazilianStates[index] = { ...brazilianStates[index], ...updatedState };
    saveStates(brazilianStates);
    return brazilianStates[index];
  }
  return null;
};

const deleteState = (id: number) => {
  const index = brazilianStates.findIndex(s => s.id === id);
  if (index !== -1) {
    brazilianStates.splice(index, 1);
    saveStates(brazilianStates);
    return true;
  }
  return false;
};

const getStateById = (id: number) => {
  return brazilianStates.find(s => s.id === id) || null;
};

const getStateByAbbreviation = (abbreviation: string) => {
  return brazilianStates.find(s => s.abbreviation === abbreviation) || null;
};

// Reactive data functions
const getAllStates = () => {
  return brazilianStates;
};

const refreshStates = () => {
  brazilianStates = [...brazilianStates];
  saveStates(brazilianStates);
  return brazilianStates;
};