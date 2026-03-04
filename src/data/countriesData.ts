import { saveCountries, loadCountries } from '../services/storageService';

export interface WorldCountry {
  id: number;
  code: string;
  name: string;
  flag: string;
  continent: string;
  capital: string;
  language: string;
  bacenCode?: string;
}

// Dados iniciais
const initialCountries: WorldCountry[] = [
  // América do Norte
  { id: 1, code: 'US', name: 'Estados Unidos', flag: '🇺🇸', continent: 'América do Norte', capital: 'Washington D.C.', language: 'Inglês', bacenCode: '2496' },
  { id: 2, code: 'CA', name: 'Canadá', flag: '🇨🇦', continent: 'América do Norte', capital: 'Ottawa', language: 'Inglês/Francês', bacenCode: '1058' },
  { id: 3, code: 'MX', name: 'México', flag: '🇲🇽', continent: 'América do Norte', capital: 'Cidade do México', language: 'Espanhol', bacenCode: '1589' },
  
  // América do Sul
  { id: 4, code: 'BR', name: 'Brasil', flag: '🇧🇷', continent: 'América do Sul', capital: 'Brasília', language: 'Português', bacenCode: '1058' },
  { id: 5, code: 'AR', name: 'Argentina', flag: '🇦🇷', continent: 'América do Sul', capital: 'Buenos Aires', language: 'Espanhol', bacenCode: '0639' },
  { id: 6, code: 'CL', name: 'Chile', flag: '🇨🇱', continent: 'América do Sul', capital: 'Santiago', language: 'Espanhol', bacenCode: '1279' },
  { id: 7, code: 'CO', name: 'Colômbia', flag: '🇨🇴', continent: 'América do Sul', capital: 'Bogotá', language: 'Espanhol', bacenCode: '1376' },
  { id: 8, code: 'PE', name: 'Peru', flag: '🇵🇪', continent: 'América do Sul', capital: 'Lima', language: 'Espanhol', bacenCode: '2291' },
  { id: 9, code: 'VE', name: 'Venezuela', flag: '🇻🇪', continent: 'América do Sul', capital: 'Caracas', language: 'Espanhol', bacenCode: '2534' },
  { id: 10, code: 'EC', name: 'Equador', flag: '🇪🇨', continent: 'América do Sul', capital: 'Quito', language: 'Espanhol', bacenCode: '1490' }
];

// Carregar dados do localStorage ou usar os dados iniciais
let worldCountries: WorldCountry[] = loadCountries(initialCountries);

export const continents = [
  'Todos',
  'América do Norte',
  'América do Sul',
  'América Central',
  'Europa',
  'Ásia',
  'África',
  'Oceania',
  'Caribe'
];

// Functions to manage countries
const addCountry = (country: Omit<WorldCountry, 'id'>) => {
  const newId = Math.max(...worldCountries.map(c => c.id), 0) + 1;
  const newCountry = { ...country, id: newId };
  worldCountries.push(newCountry);
  saveCountries(worldCountries);
  return newCountry;
};

const updateCountry = (id: number, updatedCountry: Partial<WorldCountry>) => {
  const index = worldCountries.findIndex(c => c.id === id);
  if (index !== -1) {
    worldCountries[index] = { ...worldCountries[index], ...updatedCountry };
    saveCountries(worldCountries);
    return worldCountries[index];
  }
  return null;
};

const deleteCountry = (id: number) => {
  const index = worldCountries.findIndex(c => c.id === id);
  if (index !== -1) {
    worldCountries.splice(index, 1);
    saveCountries(worldCountries);
    return true;
  }
  return false;
};

const getCountryById = (id: number) => {
  return worldCountries.find(c => c.id === id) || null;
};

const getCountryByCode = (code: string) => {
  return worldCountries.find(c => c.code === code) || null;
};

// Reactive data functions
const getAllCountries = () => {
  return worldCountries;
};

const refreshCountries = () => {
  worldCountries = [...worldCountries];
  saveCountries(worldCountries);
  return worldCountries;
};