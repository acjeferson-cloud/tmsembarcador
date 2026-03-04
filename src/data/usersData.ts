import { saveUsers, loadUsers } from '../services/storageService';

interface User {
  id: number;
  codigo: string; // Código sequencial do usuário
  nome: string;
  email: string;
  senha?: string; // Opcional para visualização (não exibir senha)
  cpf: string;
  telefone?: string;
  celular?: string;
  cargo: string;
  departamento: string;
  dataAdmissao: string;
  dataNascimento?: string;
  endereco?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  perfil: 'administrador' | 'gerente' | 'operador' | 'visualizador' | 'personalizado';
  permissoes?: string[]; // Array de IDs de menus permitidos para perfil personalizado
  status: 'ativo' | 'inativo' | 'bloqueado';
  estabelecimentoId?: number; // Vinculação com estabelecimento
  estabelecimentoNome?: string;
  ultimoLogin?: string;
  tentativasLogin: number;
  observacoes?: string;
  criadoPor: number;
  criadoEm: string;
  alteradoPor?: number;
  alteradoEm?: string;
}

// Dados iniciais
const initialUsers: User[] = [
  {
    id: 1,
    codigo: '0001',
    nome: 'Jeferson Carthen',
    email: 'admin@tmsgestor.com',
    senha: '123456',
    cpf: '123.456.789-00',
    telefone: '(11) 3333-4444',
    celular: '(11) 99999-9999',
    cargo: 'Administrador do Sistema',
    departamento: 'TI',
    dataAdmissao: '2024-01-01',
    dataNascimento: '1985-05-15',
    endereco: 'Av. Paulista, 1000 - Conj. 101',
    bairro: 'Bela Vista',
    cep: '01310-100',
    cidade: 'São Paulo',
    estado: 'SP',
    perfil: 'administrador',
    status: 'ativo',
    estabelecimentoId: 1,
    estabelecimentoNome: 'TMS Gestor - Matriz',
    ultimoLogin: '2025-01-15T10:30:00',
    tentativasLogin: 0,
    observacoes: 'Usuário administrador principal do sistema',
    criadoPor: 1,
    criadoEm: '2024-01-01T08:00:00',
    alteradoPor: 1,
    alteradoEm: '2025-01-15T10:30:00'
  },
  {
    id: 2,
    codigo: '0002',
    nome: 'Maria Silva Santos',
    email: 'maria.silva@tmsgestor.com',
    cpf: '987.654.321-00',
    telefone: '(11) 2222-3333',
    celular: '(11) 98888-7777',
    cargo: 'Gerente de Operações',
    departamento: 'Operações',
    dataAdmissao: '2024-02-15',
    dataNascimento: '1990-08-22',
    endereco: 'Rua Augusta, 500 - Apto 102',
    bairro: 'Consolação',
    cep: '01305-000',
    cidade: 'São Paulo',
    estado: 'SP',
    perfil: 'gerente',
    status: 'ativo',
    estabelecimentoId: 1,
    estabelecimentoNome: 'TMS Gestor - Matriz',
    ultimoLogin: '2025-01-15T09:15:00',
    tentativasLogin: 0,
    observacoes: 'Responsável pelas operações da matriz',
    criadoPor: 1,
    criadoEm: '2024-02-15T14:30:00',
    alteradoPor: 1,
    alteradoEm: '2024-12-10T16:45:00'
  },
  {
    id: 3,
    codigo: '0003',
    nome: 'João Carlos Oliveira',
    email: 'joao.oliveira@tmsgestor.com',
    cpf: '456.789.123-00',
    telefone: '(21) 3333-4444',
    celular: '(21) 97777-6666',
    cargo: 'Coordenador Logístico',
    departamento: 'Logística',
    dataAdmissao: '2024-03-01',
    dataNascimento: '1988-12-10',
    endereco: 'Rua da Assembleia, 500 - Sala 201',
    bairro: 'Centro',
    cep: '20011-000',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    perfil: 'operador',
    status: 'ativo',
    estabelecimentoId: 2,
    estabelecimentoNome: 'TMS Gestor - Filial RJ',
    ultimoLogin: '2025-01-14T18:20:00',
    tentativasLogin: 0,
    observacoes: 'Coordenador da filial Rio de Janeiro',
    criadoPor: 1,
    criadoEm: '2024-03-01T10:00:00',
    alteradoPor: 2,
    alteradoEm: '2024-11-20T14:30:00'
  },
  {
    id: 4,
    codigo: '0004',
    nome: 'Ana Paula Costa',
    email: 'ana.costa@tmsgestor.com',
    cpf: '789.123.456-00',
    telefone: '(31) 2222-3333',
    celular: '(31) 96666-5555',
    cargo: 'Analista de Transportes',
    departamento: 'Transportes',
    dataAdmissao: '2024-04-10',
    dataNascimento: '1992-03-18',
    endereco: 'Av. Afonso Pena, 1500 - 8º andar',
    bairro: 'Centro',
    cep: '30130-002',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    perfil: 'operador',
    status: 'ativo',
    estabelecimentoId: 3,
    estabelecimentoNome: 'TMS Gestor - Filial BH',
    ultimoLogin: '2025-01-15T08:45:00',
    tentativasLogin: 0,
    observacoes: 'Especialista em análise de rotas e custos',
    criadoPor: 1,
    criadoEm: '2024-04-10T09:30:00',
    alteradoPor: 1,
    alteradoEm: '2024-10-15T11:20:00'
  },
  {
    id: 5,
    codigo: '0005',
    nome: 'Carlos Eduardo Ferreira',
    email: 'carlos.ferreira@tmsgestor.com',
    cpf: '321.654.987-00',
    telefone: '(41) 3333-2222',
    celular: '(41) 95555-4444',
    cargo: 'Supervisor de Frota',
    departamento: 'Manutenção',
    dataAdmissao: '2024-05-20',
    dataNascimento: '1987-07-25',
    endereco: 'Rua XV de Novembro, 800 - Conj. 1205',
    bairro: 'Centro',
    cep: '80020-310',
    cidade: 'Curitiba',
    estado: 'PR',
    perfil: 'operador',
    status: 'ativo',
    estabelecimentoId: 4,
    estabelecimentoNome: 'TMS Gestor - Filial Curitiba',
    ultimoLogin: '2025-01-14T17:30:00',
    tentativasLogin: 0,
    observacoes: 'Responsável pela manutenção da frota',
    criadoPor: 1,
    criadoEm: '2024-05-20T13:15:00',
    alteradoPor: 2,
    alteradoEm: '2024-09-30T15:45:00'
  },
  {
    id: 6,
    codigo: '0006',
    nome: 'Fernanda Lima Rodrigues',
    email: 'fernanda.lima@tmsgestor.com',
    cpf: '654.321.789-00',
    telefone: '(51) 2222-1111',
    celular: '(51) 94444-3333',
    cargo: 'Assistente Administrativo',
    departamento: 'Administrativo',
    dataAdmissao: '2024-06-15',
    dataNascimento: '1995-11-08',
    endereco: 'Av. Borges de Medeiros, 1200 - Sala 301',
    bairro: 'Centro Histórico',
    cep: '90020-025',
    cidade: 'Porto Alegre',
    estado: 'RS',
    perfil: 'visualizador',
    status: 'ativo',
    estabelecimentoId: 5,
    estabelecimentoNome: 'TMS Gestor - Filial Porto Alegre',
    ultimoLogin: '2025-01-15T07:20:00',
    tentativasLogin: 0,
    observacoes: 'Suporte administrativo da filial',
    criadoPor: 1,
    criadoEm: '2024-06-15T11:00:00',
    alteradoPor: 1,
    alteradoEm: '2024-08-20T09:30:00'
  },
  {
    id: 7,
    codigo: '0007',
    nome: 'Roberto Santos Almeida',
    email: 'roberto.almeida@tmsgestor.com',
    cpf: '147.258.369-00',
    telefone: '(71) 3333-5555',
    celular: '(71) 93333-2222',
    cargo: 'Gerente Regional',
    departamento: 'Comercial',
    dataAdmissao: '2024-07-01',
    dataNascimento: '1983-04-12',
    endereco: 'Av. Tancredo Neves, 2200 - Ed. CEO, Sala 1501',
    bairro: 'Caminho das Árvores',
    cep: '41820-021',
    cidade: 'Salvador',
    estado: 'BA',
    perfil: 'gerente',
    status: 'ativo',
    estabelecimentoId: 6,
    estabelecimentoNome: 'TMS Gestor - Filial Salvador',
    ultimoLogin: '2025-01-14T19:45:00',
    tentativasLogin: 0,
    observacoes: 'Gerente regional Nordeste',
    criadoPor: 1,
    criadoEm: '2024-07-01T08:30:00',
    alteradoPor: 1,
    alteradoEm: '2024-12-05T16:20:00'
  },
  {
    id: 8,
    codigo: '0008',
    nome: 'Luciana Pereira Souza',
    email: 'luciana.souza@tmsgestor.com',
    cpf: '258.369.147-00',
    telefone: '(85) 2222-4444',
    celular: '(85) 92222-1111',
    cargo: 'Analista Financeiro',
    departamento: 'Financeiro',
    dataAdmissao: '2024-08-10',
    dataNascimento: '1991-09-30',
    endereco: 'Av. Dom Luís, 1200 - Sala 702',
    bairro: 'Aldeota',
    cep: '60160-230',
    cidade: 'Fortaleza',
    estado: 'CE',
    perfil: 'operador',
    status: 'inativo',
    estabelecimentoId: 7,
    estabelecimentoNome: 'TMS Gestor - Filial Fortaleza',
    ultimoLogin: '2024-12-20T16:30:00',
    tentativasLogin: 0,
    observacoes: 'Usuário em licença médica',
    criadoPor: 1,
    criadoEm: '2024-08-10T14:45:00',
    alteradoPor: 7,
    alteradoEm: '2024-12-20T17:00:00'
  },
  {
    id: 9,
    codigo: '0009',
    nome: 'Paulo Henrique Martins',
    email: 'paulo.martins@tmsgestor.com',
    cpf: '369.147.258-00',
    telefone: '(81) 3333-6666',
    celular: '(81) 91111-9999',
    cargo: 'Coordenador de TI',
    departamento: 'TI',
    dataAdmissao: '2024-09-05',
    dataNascimento: '1986-01-20',
    endereco: 'Av. Boa Viagem, 3500 - Sala 1203',
    bairro: 'Boa Viagem',
    cep: '51021-000',
    cidade: 'Recife',
    estado: 'PE',
    perfil: 'gerente',
    status: 'ativo',
    estabelecimentoId: 8,
    estabelecimentoNome: 'TMS Gestor - Filial Recife',
    ultimoLogin: '2025-01-15T06:15:00',
    tentativasLogin: 0,
    observacoes: 'Responsável pela infraestrutura de TI regional',
    criadoPor: 1,
    criadoEm: '2024-09-05T10:20:00',
    alteradoPor: 1,
    alteradoEm: '2024-11-15T13:40:00'
  },
  {
    id: 10,
    codigo: '0010',
    nome: 'Juliana Campos Barbosa',
    email: 'juliana.barbosa@tmsgestor.com',
    cpf: '741.852.963-00',
    telefone: '(61) 3333-7777',
    celular: '(61) 98888-5555',
    cargo: 'Analista de Sistemas',
    departamento: 'TI',
    dataAdmissao: '2024-10-12',
    dataNascimento: '1993-06-14',
    endereco: 'SCS Quadra 02, Bloco C, Sala 1001',
    bairro: 'Asa Sul',
    cep: '70300-500',
    cidade: 'Brasília',
    estado: 'DF',
    perfil: 'operador',
    status: 'bloqueado',
    estabelecimentoId: 9,
    estabelecimentoNome: 'TMS Gestor - Filial Brasília',
    ultimoLogin: '2024-12-15T14:20:00',
    tentativasLogin: 5,
    observacoes: 'Usuário bloqueado por excesso de tentativas de login',
    criadoPor: 1,
    criadoEm: '2024-10-12T09:00:00',
    alteradoPor: 9,
    alteradoEm: '2024-12-15T14:25:00'
  },
  {
    id: 11,
    codigo: '0011',
    nome: 'Ricardo Mendes Oliveira',
    email: 'ricardo.mendes@tmsgestor.com',
    cpf: '852.963.741-00',
    telefone: '(11) 4444-5555',
    celular: '(11) 97777-8888',
    cargo: 'Analista de Logística',
    departamento: 'Logística',
    dataAdmissao: '2024-11-05',
    dataNascimento: '1990-03-25',
    endereco: 'Av. Paulista, 1500 - Sala 502',
    bairro: 'Bela Vista',
    cep: '01310-200',
    cidade: 'São Paulo',
    estado: 'SP',
    perfil: 'personalizado',
    permissoes: ['dashboard', 'control-tower', 'calculator', 'shipments', 'carriers', 'electronic-docs'],
    status: 'ativo',
    estabelecimentoId: 1,
    estabelecimentoNome: 'TMS Gestor - Matriz',
    ultimoLogin: '2025-01-14T15:30:00',
    tentativasLogin: 0,
    observacoes: 'Usuário com permissões personalizadas',
    criadoPor: 1,
    criadoEm: '2024-11-05T08:30:00',
    alteradoPor: 1,
    alteradoEm: '2024-12-10T14:20:00'
  }
];

// Carregar dados do localStorage ou usar os dados iniciais
let users: User[] = loadUsers(initialUsers);

// Function to generate next sequential code
const getNextUserCode = (): string => {
  if (users.length === 0) {
    return '0001';
  }
  
  // Get all numeric codes and find the highest
  const numericCodes = users
    .map(u => parseInt(u.codigo))
    .filter(code => !isNaN(code))
    .sort((a, b) => b - a);
  
  const nextCode = numericCodes.length > 0 ? numericCodes[0] + 1 : 1;
  
  // Format with leading zeros (4 digits)
  return nextCode.toString().padStart(4, '0');
};

// Functions to manage users data
const addUser = (user: Omit<User, 'id' | 'codigo' | 'criadoEm' | 'tentativasLogin'>) => {
  const newId = Math.max(...users.map(u => u.id), 0) + 1;
  const newCode = getNextUserCode();
  const newUser = { 
    ...user, 
    id: newId,
    codigo: newCode,
    criadoEm: new Date().toISOString(),
    tentativasLogin: 0
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

const updateUser = (id: number, updatedUser: Partial<User>) => {
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { 
      ...users[index], 
      ...updatedUser,
      alteradoEm: new Date().toISOString()
    };
    saveUsers(users);
    return users[index];
  }
  return null;
};

const deleteUser = (id: number) => {
  // Prevent deletion of admin user
  if (id === 1) {
    throw new Error('Não é possível excluir o usuário administrador principal');
  }
  
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users.splice(index, 1);
    saveUsers(users);
    return true;
  }
  return false;
};

const getUserById = (id: number) => {
  return users.find(u => u.id === id) || null;
};

export const getUserByEmail = (email: string) => {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
};

const getUserByCode = (codigo: string) => {
  return users.find(u => u.codigo === codigo) || null;
};

const getUsersByCPF = (cpf: string) => {
  return users.filter(u => u.cpf === cpf);
};

const getUsersByEstablishment = (establishmentId: number) => {
  return users.filter(u => u.estabelecimentoId === establishmentId);
};

const getUsersByStatus = (status: 'ativo' | 'inativo' | 'bloqueado') => {
  return users.filter(u => u.status === status);
};

const getUsersByPerfil = (perfil: 'administrador' | 'gerente' | 'operador' | 'visualizador' | 'personalizado') => {
  return users.filter(u => u.perfil === perfil);
};

// Validation functions
const isValidUserCode = (codigo: string): boolean => {
  const numericRegex = /^\d{4}$/;
  return numericRegex.test(codigo);
};

const isUserCodeUnique = (codigo: string, excludeId?: number): boolean => {
  return !users.some(u => u.codigo === codigo && u.id !== excludeId);
};

const isEmailUnique = (email: string, excludeId?: number): boolean => {
  return !users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeId);
};

const isCPFUnique = (cpf: string, excludeId?: number): boolean => {
  return !users.some(u => u.cpf === cpf && u.id !== excludeId);
};

const isValidCPF = (cpf: string): boolean => {
  // Remove formatting
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check if has 11 digits
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Security functions
export const resetLoginAttempts = (userId: number) => {
  const user = getUserById(userId);
  if (user) {
    updateUser(userId, { tentativasLogin: 0, status: 'ativo' });
  }
};

export const incrementLoginAttempts = (userId: number) => {
  const user = getUserById(userId);
  if (user) {
    const newAttempts = user.tentativasLogin + 1;
    const newStatus = newAttempts >= 5 ? 'bloqueado' : user.status;
    updateUser(userId, { 
      tentativasLogin: newAttempts, 
      status: newStatus,
      ultimoLogin: newStatus === 'bloqueado' ? user.ultimoLogin : new Date().toISOString()
    });
  }
};

export const updateLastLogin = (userId: number) => {
  updateUser(userId, { 
    ultimoLogin: new Date().toISOString(),
    tentativasLogin: 0
  });
};

// Statistics functions
const getUserStats = () => {
  const total = users.length;
  const ativos = users.filter(u => u.status === 'ativo').length;
  const inativos = users.filter(u => u.status === 'inativo').length;
  const bloqueados = users.filter(u => u.status === 'bloqueado').length;
  
  const administradores = users.filter(u => u.perfil === 'administrador').length;
  const gerentes = users.filter(u => u.perfil === 'gerente').length;
  const operadores = users.filter(u => u.perfil === 'operador').length;
  const visualizadores = users.filter(u => u.perfil === 'visualizador').length;
  const personalizados = users.filter(u => u.perfil === 'personalizado').length;
  
  return {
    total,
    status: { ativos, inativos, bloqueados },
    perfis: { administradores, gerentes, operadores, visualizadores, personalizados }
  };
};

// Reactive data functions
const getAllUsers = () => {
  return users;
};

const refreshUsers = () => {
  users = [...users];
  saveUsers(users);
  return users;
};