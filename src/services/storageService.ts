// Serviço para gerenciar a persistência de dados no localStorage

// Chaves para os diferentes tipos de dados
const STORAGE_KEYS = {
  USERS: 'tms-gestor-users',
  CARRIERS: 'tms-gestor-carriers',
  CITIES: 'tms-gestor-cities',
  STATES: 'tms-gestor-states',
  COUNTRIES: 'tms-gestor-countries',
  ESTABLISHMENTS: 'tms-gestor-establishments',
  DOCUMENTS: 'tms-gestor-documents',
  SHIPMENTS: 'tms-gestor-shipments',
  FREIGHT_RATES: 'tms-gestor-freight-rates',
  OCCURRENCES: 'tms-gestor-occurrences',
  REJECTION_REASONS: 'tms-gestor-rejection-reasons'
};

// Funções genéricas para salvar e recuperar dados
const saveData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {

  }
};

const loadData = <T>(key: string, defaultData: T[]): T[] => {
  try {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultData;
  } catch (error) {

    return defaultData;
  }
};

// Funções específicas para cada tipo de dado
export const saveUsers = (users: any[]): void => {
  saveData(STORAGE_KEYS.USERS, users);
};

export const loadUsers = (defaultUsers: any[]): any[] => {
  return loadData(STORAGE_KEYS.USERS, defaultUsers);
};

const saveCarriers = (carriers: any[]): void => {
  saveData(STORAGE_KEYS.CARRIERS, carriers);
};

const loadCarriers = (defaultCarriers: any[]): any[] => {
  return loadData(STORAGE_KEYS.CARRIERS, defaultCarriers);
};

const saveCities = (cities: any[]): void => {
  saveData(STORAGE_KEYS.CITIES, cities);
};

const loadCities = (defaultCities: any[]): any[] => {
  return loadData(STORAGE_KEYS.CITIES, defaultCities);
};

export const saveStates = (states: any[]): void => {
  saveData(STORAGE_KEYS.STATES, states);
};

export const loadStates = (defaultStates: any[]): any[] => {
  return loadData(STORAGE_KEYS.STATES, defaultStates);
};

export const saveCountries = (countries: any[]): void => {
  saveData(STORAGE_KEYS.COUNTRIES, countries);
};

export const loadCountries = (defaultCountries: any[]): any[] => {
  return loadData(STORAGE_KEYS.COUNTRIES, defaultCountries);
};

export const saveEstablishments = (establishments: any[]): void => {
  saveData(STORAGE_KEYS.ESTABLISHMENTS, establishments);
};

export const loadEstablishments = (defaultEstablishments: any[]): any[] => {
  return loadData(STORAGE_KEYS.ESTABLISHMENTS, defaultEstablishments);
};

export const saveDocuments = (documents: any[]): void => {
  saveData(STORAGE_KEYS.DOCUMENTS, documents);
};

export const loadDocuments = (defaultDocuments: any[]): any[] => {
  return loadData(STORAGE_KEYS.DOCUMENTS, defaultDocuments);
};

const saveShipments = (shipments: any[]): void => {
  saveData(STORAGE_KEYS.SHIPMENTS, shipments);
};

const loadShipments = (defaultShipments: any[]): any[] => {
  return loadData(STORAGE_KEYS.SHIPMENTS, defaultShipments);
};

export const saveFreightRates = (freightRates: any[]): void => {
  saveData(STORAGE_KEYS.FREIGHT_RATES, freightRates);
};

export const loadFreightRates = (defaultFreightRates: any[]): any[] => {
  return loadData(STORAGE_KEYS.FREIGHT_RATES, defaultFreightRates);
};

export const saveOccurrences = (occurrences: any[]): void => {
  saveData(STORAGE_KEYS.OCCURRENCES, occurrences);
};

export const loadOccurrences = (defaultOccurrences: any[]): any[] => {
  return loadData(STORAGE_KEYS.OCCURRENCES, defaultOccurrences);
};

export const saveRejectionReasons = (reasons: any[]): void => {
  saveData(STORAGE_KEYS.REJECTION_REASONS, reasons);
};

export const loadRejectionReasons = (defaultReasons: any[]): any[] => {
  return loadData(STORAGE_KEYS.REJECTION_REASONS, defaultReasons);
};

// Limpar todos os dados (útil para testes ou reset)
const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};