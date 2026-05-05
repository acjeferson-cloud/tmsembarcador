import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Truck, AlertTriangle, DollarSign } from 'lucide-react';
import { Vehicle } from '../../../services/vehiclesService';
import { driversService, Driver } from '../../../services/driversService';

interface VehicleFormProps {
  onBack: () => void;
  onSave: (vehicle: Partial<Vehicle>) => void;
  vehicle: Vehicle | null;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ onBack, onSave, vehicle }) => {
  const [activeTab, setActiveTab] = useState<'gerais' | 'restricoes' | 'custos'>('gerais');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    placa: '',
    tipo: 'Fiorino',
    capacidade_kg: 0,
    cubagem_m3: 0,
    status: 'ativo',
    metadata: {
      categoria_operacional: 'Próprio',
      tipo_operacao: 'Urbano',
      dimensoes: { comprimento: 0, largura: 0, altura: 0 },
      capacidade_pallets: 0,
      numero_eixos: 2,
      restricoes: {
        area_restrita: false,
        tipo_carroceria: 'Baú',
        suporta_refrigerado: false,
        tipo_carga: [],
        certificacoes: [],
        equipamentos_especiais: []
      },
      custos: {
        fixo_mensal: 0,
        variavel_km: 0,
        consumo_km_l: 0,
        tipo_combustivel: 'Diesel'
      },
      motorista_padrao_id: '',
      avancado: {
        prioridade_uso: 1,
        score: 100,
        rastreador: false,
        telemetria: false,
        observacoes: ''
      }
    }
  });

  useEffect(() => {
    loadDrivers();
    if (vehicle) {
      // Merge com valores default para evitar undefined em objetos aninhados antigos
      setFormData({
        ...vehicle,
        metadata: {
          ...formData.metadata,
          ...vehicle.metadata,
          dimensoes: { ...formData.metadata?.dimensoes, ...vehicle.metadata?.dimensoes },
          restricoes: { ...formData.metadata?.restricoes, ...vehicle.metadata?.restricoes },
          custos: { ...formData.metadata?.custos, ...vehicle.metadata?.custos },
          avancado: { ...formData.metadata?.avancado, ...vehicle.metadata?.avancado }
        }
      });
    }
  }, [vehicle]);

  const loadDrivers = async () => {
    try {
      const data = await driversService.getAll();
      setDrivers(data);
    } catch (error) {
      console.error("Erro ao carregar motoristas:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    if (type === 'number') {
      parsedValue = value === '' ? 0 : parseFloat(value);
    } else if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }
    
    if (name === 'placa') {
      parsedValue = String(parsedValue).toUpperCase();
    }

    // Handles dot notation for nested metadata fields (e.g. "metadata.dimensoes.comprimento")
    if (name.startsWith('metadata.')) {
      const parts = name.split('.');
      setFormData(prev => {
        const newMetadata: any = { ...prev.metadata };
        
        if (parts.length === 2) {
          newMetadata[parts[1]] = parsedValue;
        } else if (parts.length === 3) {
          newMetadata[parts[1]] = {
            ...newMetadata[parts[1]],
            [parts[2]]: parsedValue
          };
        }
        
        return { ...prev, metadata: newMetadata };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: parsedValue }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMultiSelectChange = (fieldPath: string, value: string) => {
    setFormData(prev => {
      const newMetadata: any = { ...prev.metadata };
      const parts = fieldPath.split('.');
      // Ex: metadata.restricoes.tipo_carga
      const section = parts[1]; // restricoes
      const field = parts[2]; // tipo_carga
      
      if (!newMetadata[section]) {
        newMetadata[section] = {};
      } else {
        newMetadata[section] = { ...newMetadata[section] };
      }
      
      const currentList: string[] = newMetadata[section][field] || [];
      if (currentList.includes(value)) {
        newMetadata[section][field] = currentList.filter(i => i !== value);
      } else {
        newMetadata[section][field] = [...currentList, value];
      }
      
      return { ...prev, metadata: newMetadata };
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.placa) newErrors.placa = 'A placa é obrigatória';
    if (!formData.tipo) newErrors.tipo = 'O tipo de veículo é obrigatório';
    if (formData.capacidade_kg === undefined || formData.capacidade_kg < 0) newErrors.capacidade_kg = 'Capacidade inválida';
    if (formData.cubagem_m3 === undefined || formData.cubagem_m3 < 0) newErrors.cubagem_m3 = 'Cubagem inválida';
    
    const placaRegex = /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/;
    if (formData.placa && !placaRegex.test(formData.placa)) {
      newErrors.placa = 'Formato de placa inválido (ABC-1234 ou ABC1D23)';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setActiveTab('gerais'); // Focus tab with error
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabClass = (tab: string) => `
    flex-1 text-center py-3 font-medium text-sm transition-colors border-b-2 
    ${activeTab === tab 
      ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' 
      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
    }
  `;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-300"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {vehicle ? 'Editar Veículo' : 'Novo Veículo'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {vehicle ? 'Atualize as configurações e restrições' : 'Cadastre um novo veículo com regras operacionais'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* TABS */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <button type="button" onClick={() => setActiveTab('gerais')} className={tabClass('gerais')}>
              <div className="flex items-center justify-center gap-2">
                <Truck size={16} /> <span>1. Dados Gerais & Dimensões</span>
              </div>
            </button>
            <button type="button" onClick={() => setActiveTab('restricoes')} className={tabClass('restricoes')}>
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle size={16} /> <span>2. Operação & Restrições</span>
              </div>
            </button>
            <button type="button" onClick={() => setActiveTab('custos')} className={tabClass('custos')}>
              <div className="flex items-center justify-center gap-2">
                <DollarSign size={16} /> <span>3. Custos & Inteligência</span>
              </div>
            </button>
          </div>

          <div className="p-6">
            {/* ABA 1: GERAIS */}
            {activeTab === 'gerais' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Placa *</label>
                    <input type="text" name="placa" value={formData.placa} onChange={handleChange} placeholder="ABC-1234"
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white uppercase ${errors.placa ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.placa && <p className="mt-1 text-sm text-red-500">{errors.placa}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria Operacional</label>
                    <select name="metadata.categoria_operacional" value={formData.metadata?.categoria_operacional} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Próprio">Próprio</option>
                      <option value="Agregado">Agregado</option>
                      <option value="Terceiro">Terceiro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="manutencao">Em Manutenção</option>
                    </select>
                  </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Capacidades Oficiais</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Físico *</label>
                    <select name="tipo" value={formData.tipo} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Moto">Moto</option>
                      <option value="Fiorino">Fiorino / Van Pequena</option>
                      <option value="Van">VUC (Veículo Urbano de Carga)</option>
                      <option value="Toco">Caminhão Toco</option>
                      <option value="Truck">Caminhão Truck</option>
                      <option value="Carreta">Carreta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso Max (kg) *</label>
                    <input type="number" name="capacidade_kg" value={formData.capacidade_kg} onChange={handleChange} min="0" step="0.01"
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.capacidade_kg ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cubagem (m³) *</label>
                    <input type="number" name="cubagem_m3" value={formData.cubagem_m3} onChange={handleChange} min="0" step="0.01"
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.cubagem_m3 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qtd Pallets (Max)</label>
                    <input type="number" name="metadata.capacidade_pallets" value={formData.metadata?.capacidade_pallets} onChange={handleChange} min="0"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Dimensões e Carroceria</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comprimento (m)</label>
                    <input type="number" name="metadata.dimensoes.comprimento" value={formData.metadata?.dimensoes?.comprimento} onChange={handleChange} min="0" step="0.1"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Largura (m)</label>
                    <input type="number" name="metadata.dimensoes.largura" value={formData.metadata?.dimensoes?.largura} onChange={handleChange} min="0" step="0.1"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Altura (m)</label>
                    <input type="number" name="metadata.dimensoes.altura" value={formData.metadata?.dimensoes?.altura} onChange={handleChange} min="0" step="0.1"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº Eixos</label>
                    <input type="number" name="metadata.numero_eixos" value={formData.metadata?.numero_eixos} onChange={handleChange} min="2" max="10"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: RESTRIÇÕES */}
            {activeTab === 'restricoes' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Operação</label>
                    <select name="metadata.tipo_operacao" value={formData.metadata?.tipo_operacao} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Urbano">Urbano (Última Milha)</option>
                      <option value="Rodoviário">Rodoviário (Longo Curso)</option>
                      <option value="Misto">Misto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Carroceria</label>
                    <select name="metadata.restricoes.tipo_carroceria" value={formData.metadata?.restricoes?.tipo_carroceria} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Baú">Baú</option>
                      <option value="Sider">Sider</option>
                      <option value="Grade Baixa">Grade Baixa</option>
                      <option value="Prancha">Prancha</option>
                      <option value="Caçamba">Caçamba</option>
                      <option value="Tanque">Tanque</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 w-full cursor-pointer">
                      <input type="checkbox" name="metadata.restricoes.area_restrita" checked={formData.metadata?.restricoes?.area_restrita || false} onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pode entrar em Área Restrita</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4">Tipos de Carga Suportada</h3>
                    <div className="space-y-3">
                      {['Seca', 'Frágil', 'Perigosa', 'Granel'].map(carga => (
                        <label key={carga} className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" checked={formData.metadata?.restricoes?.tipo_carga?.includes(carga) || false} onChange={() => handleMultiSelectChange('metadata.restricoes.tipo_carga', carga)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Carga {carga}</span>
                        </label>
                      ))}
                      <label className="flex items-center space-x-3 cursor-pointer mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <input type="checkbox" name="metadata.restricoes.suporta_refrigerado" checked={formData.metadata?.restricoes?.suporta_refrigerado || false} onChange={handleChange}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Suporta Carga Refrigerada</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4">Equipamentos Auxiliares</h3>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        {['Munck', 'Plataforma', 'Guincho'].map(eq => (
                          <label key={eq} className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={formData.metadata?.restricoes?.equipamentos_especiais?.includes(eq) || false} onChange={() => handleMultiSelectChange('metadata.restricoes.equipamentos_especiais', eq)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{eq}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: CUSTOS */}
            {activeTab === 'custos' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custo Fixo (R$/mês)</label>
                    <input type="number" name="metadata.custos.fixo_mensal" value={formData.metadata?.custos?.fixo_mensal} onChange={handleChange} min="0" step="0.01"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custo Variável (R$/km)</label>
                    <input type="number" name="metadata.custos.variavel_km" value={formData.metadata?.custos?.variavel_km} onChange={handleChange} min="0" step="0.01"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Consumo Médio (km/l)</label>
                    <input type="number" name="metadata.custos.consumo_km_l" value={formData.metadata?.custos?.consumo_km_l} onChange={handleChange} min="0" step="0.1"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Combustível</label>
                    <select name="metadata.custos.tipo_combustivel" value={formData.metadata?.custos?.tipo_combustivel} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Diesel">Diesel</option>
                      <option value="Etanol">Etanol</option>
                      <option value="Gasolina">Gasolina</option>
                      <option value="GNV">GNV</option>
                      <option value="Elétrico">Elétrico</option>
                    </select>
                  </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Vínculos e Inteligência</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motorista Padrão</label>
                    <select name="metadata.motorista_padrao_id" value={formData.metadata?.motorista_padrao_id} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Nenhum (Livre)</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.nome} (CPF: {driver.cpf})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade de Uso (1 a 10)</label>
                    <input type="number" name="metadata.avancado.prioridade_uso" value={formData.metadata?.avancado?.prioridade_uso} onChange={handleChange} min="1" max="10"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-4 items-center pt-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" name="metadata.avancado.rastreador" checked={formData.metadata?.avancado?.rastreador} onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rastreador Ativo</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" name="metadata.avancado.telemetria" checked={formData.metadata?.avancado?.telemetria} onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Telemetria</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações Operacionais</label>
                  <textarea name="metadata.avancado.observacoes" value={formData.metadata?.avancado?.observacoes} onChange={handleChange} rows={3} placeholder="Alguma restrição ou detalhe específico sobre este veículo..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white resize-none"
                  ></textarea>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Save size={20} />
            {isSubmitting ? 'Salvando...' : 'Salvar Veículo'}
          </button>
        </div>
      </form>
    </div>
  );
};
