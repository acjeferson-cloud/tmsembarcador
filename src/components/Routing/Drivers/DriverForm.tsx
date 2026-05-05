import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Users, AlertTriangle, ShieldCheck, DollarSign, Camera, X } from 'lucide-react';
import { Driver, driversService } from '../../../services/driversService';
import { formatCPFInput, formatPhone } from '../../../utils/formatters';

interface DriverFormProps {
  onBack: () => void;
  onSave: (driver: Partial<Driver>) => void;
  driver: Driver | null;
}

export const DriverForm: React.FC<DriverFormProps> = ({ onBack, onSave, driver }) => {
  const [activeTab, setActiveTab] = useState<'gerais' | 'operacao' | 'habilitacoes' | 'custos'>('gerais');
  const [formData, setFormData] = useState<Partial<Driver>>({
    nome: '',
    cpf: '',
    cnh: '',
    telefone: '',
    status: 'livre',
    metadata: {
      acesso_app: false,
      categoria_operacional: 'Próprio',
      operacao: {
        regioes_atuacao: [],
        disponibilidade: true
      },
      habilitacoes: {
        mopp: false,
        certificacoes: [],
        tipos_carga: [],
        veiculos_permitidos: []
      },
      custos: {
        possui_rastreador: false
      }
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(driver?.metadata?.foto_url || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (driver) {
      setFormData({
        ...driver,
        cpf: driver.cpf ? formatCPFInput(driver.cpf) : '',
        telefone: driver.telefone ? formatPhone(driver.telefone) : '',
        metadata: {
          ...driver.metadata,
          operacao: driver.metadata?.operacao || { regioes_atuacao: [], disponibilidade: true },
          habilitacoes: driver.metadata?.habilitacoes || { mopp: false, certificacoes: [], tipos_carga: [], veiculos_permitidos: [] },
          custos: driver.metadata?.custos || { possui_rastreador: false },
          acesso_app: driver.metadata?.acesso_app || false
        }
      });
      setProfilePhotoPreview(driver.metadata?.foto_url || null);
    }
  }, [driver]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A foto deve ter no máximo 5MB.');
        return;
      }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Formato inválido. Use JPG, PNG, GIF ou WebP.');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = async () => {
    if (driver?.id && driver.metadata?.foto_url) {
      setIsUploadingPhoto(true);
      const success = await driversService.deleteDriverPhoto(driver.metadata.foto_url);
      setIsUploadingPhoto(false);
      if (success) {
        setProfilePhoto(null);
        setProfilePhotoPreview(null);
        setFormData(prev => ({
          ...prev,
          metadata: { ...prev.metadata, foto_url: undefined }
        }));
      }
    } else {
      setProfilePhoto(null);
      setProfilePhotoPreview(null);
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

    if (name === 'cpf') {
      parsedValue = formatCPFInput(value);
    } else if (name === 'telefone') {
      parsedValue = formatPhone(value);
    }

    if (name.startsWith('metadata.')) {
      const parts = name.split('.');
      setFormData(prev => {
        const newMetadata: any = { ...prev.metadata };
        
        if (parts.length === 2) {
          newMetadata[parts[1]] = parsedValue;
        } else if (parts.length === 3) {
          if (!newMetadata[parts[1]]) newMetadata[parts[1]] = {};
          else newMetadata[parts[1]] = { ...newMetadata[parts[1]] };
          
          newMetadata[parts[1]][parts[2]] = parsedValue;
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
      const section = parts[1];
      const field = parts[2];
      
      if (!newMetadata[section]) {
        newMetadata[section] = {};
      } else {
        newMetadata[section] = { ...newMetadata[section] };
      }
      
      const currentList: string[] = newMetadata[section][field] || [];
      if (currentList.includes(value)) {
        newMetadata[section][field] = currentList.filter((i: string) => i !== value);
      } else {
        newMetadata[section][field] = [...currentList, value];
      }
      
      return { ...prev, metadata: newMetadata };
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome || formData.nome.trim().length < 3) {
      newErrors.nome = 'Nome completo é obrigatório';
    }
    
    if (formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!formData.telefone || formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone válido é obrigatório';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setActiveTab('gerais');
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        _profilePhoto: profilePhoto
      };
      await onSave(dataToSave);
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
              {driver ? 'Editar Motorista' : 'Novo Motorista'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {driver ? 'Atualize os dados e restrições do motorista' : 'Cadastre um novo motorista com regras operacionais'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <button type="button" onClick={() => setActiveTab('gerais')} className={tabClass('gerais')}>
              <div className="flex items-center justify-center gap-2">
                <Users size={16} /> <span className="hidden sm:inline">1. Dados Gerais</span>
              </div>
            </button>
            <button type="button" onClick={() => setActiveTab('operacao')} className={tabClass('operacao')}>
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle size={16} /> <span className="hidden sm:inline">2. Operação</span>
              </div>
            </button>
            <button type="button" onClick={() => setActiveTab('habilitacoes')} className={tabClass('habilitacoes')}>
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck size={16} /> <span className="hidden sm:inline">3. Habilitações</span>
              </div>
            </button>
            <button type="button" onClick={() => setActiveTab('custos')} className={tabClass('custos')}>
              <div className="flex items-center justify-center gap-2">
                <DollarSign size={16} /> <span className="hidden sm:inline">4. Custos & Performance</span>
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'gerais' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Foto do Motorista</label>
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {profilePhotoPreview ? (
                        <img src={profilePhotoPreview} alt="Foto" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                          <span className="text-3xl font-semibold text-white">{formData.nome ? formData.nome.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'MT'}</span>
                        </div>
                      )}
                      {isUploadingPhoto && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <label className="cursor-pointer">
                          <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handlePhotoChange} className="hidden" disabled={isUploadingPhoto} />
                          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            <Camera size={18} /> <span>Escolher foto</span>
                          </div>
                        </label>
                        {profilePhotoPreview && (
                          <button type="button" onClick={handleRemovePhoto} disabled={isUploadingPhoto} className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                            <X size={18} /> <span>Remover</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="João da Silva" className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.nome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                    {errors.nome && <p className="mt-1 text-sm text-red-500">{errors.nome}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF *</label>
                      <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" maxLength={14}
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.cpf ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      />
                      {errors.cpf && <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Celular *</label>
                      <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(00) 00000-0000" maxLength={15}
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.telefone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      />
                      {errors.telefone && <p className="mt-1 text-sm text-red-500">{errors.telefone}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNH (Número)</label>
                    <input type="text" name="cnh" value={formData.cnh} onChange={handleChange} placeholder="Número do registro"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria CNH</label>
                    <select name="metadata.categoria_cnh" value={formData.metadata?.categoria_cnh || ''} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Selecione...</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="AB">AB</option>
                      <option value="AC">AC</option>
                      <option value="AD">AD</option>
                      <option value="AE">AE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validade CNH</label>
                    <input type="date" name="metadata.validade_cnh" value={formData.metadata?.validade_cnh || ''} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status Operacional</label>
                    <select name="status" value={formData.status} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    >
                      <option value="livre">Livre</option>
                      <option value="em_rota">Em rota</option>
                      <option value="indisponivel">Indisponível</option>
                      <option value="ferias">Férias</option>
                      <option value="afastado">Afastado</option>
                      <option value="em_viagem">Em viagem (Antigo)</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria Operacional</label>
                    <select name="metadata.categoria_operacional" value={formData.metadata?.categoria_operacional || 'Próprio'} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Próprio">Próprio</option>
                      <option value="Agregado">Agregado</option>
                      <option value="Terceiro">Terceiro</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: OPERAÇÃO */}
            {activeTab === 'operacao' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turno de Trabalho (Início)</label>
                    <input type="time" name="metadata.operacao.turno_inicio" value={formData.metadata?.operacao?.turno_inicio || ''} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turno de Trabalho (Fim)</label>
                    <input type="time" name="metadata.operacao.turno_fim" value={formData.metadata?.operacao?.turno_fim || ''} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jornada Máxima Diária (horas)</label>
                    <input type="number" name="metadata.operacao.jornada_maxima_diaria" value={formData.metadata?.operacao?.jornada_maxima_diaria || ''} onChange={handleChange} min="0" max="24"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="flex items-end md:col-span-3">
                    <label className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 w-full md:w-1/3 cursor-pointer">
                      <input type="checkbox" name="metadata.operacao.disponibilidade" checked={formData.metadata?.operacao?.disponibilidade ?? true} onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Motorista Disponível (Agenda)</span>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Região de Atuação</h3>
                  <div className="flex flex-wrap gap-4">
                    {['Sul', 'Sudeste', 'Centro-Oeste', 'Nordeste', 'Norte'].map(regiao => (
                      <label key={regiao} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={formData.metadata?.operacao?.regioes_atuacao?.includes(regiao) || false} onChange={() => handleMultiSelectChange('metadata.operacao.regioes_atuacao', regiao)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{regiao}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: HABILITAÇÕES */}
            {activeTab === 'habilitacoes' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4">Certificações e MOPP</h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 cursor-pointer pb-4 border-b border-gray-200 dark:border-gray-600">
                        <input type="checkbox" name="metadata.habilitacoes.mopp" checked={formData.metadata?.habilitacoes?.mopp || false} onChange={handleChange}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Possui Curso MOPP (Cargas Perigosas)</span>
                      </label>
                      <div>
                        <span className="block text-xs font-medium text-gray-500 uppercase mb-2">Outras Certificações</span>
                        <div className="flex flex-col gap-2">
                          {['Direção Defensiva', 'Cargas Indivisíveis', 'Transporte de Passageiros', 'SASSMAQ'].map(cert => (
                            <label key={cert} className="flex items-center space-x-2 cursor-pointer">
                              <input type="checkbox" checked={formData.metadata?.habilitacoes?.certificacoes?.includes(cert) || false} onChange={() => handleMultiSelectChange('metadata.habilitacoes.certificacoes', cert)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{cert}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-4">Tipos de Carga Permitida</h3>
                      <div className="flex flex-wrap gap-4">
                        {['Seca', 'Frágil', 'Perigosa', 'Refrigerada', 'Granel'].map(carga => (
                          <label key={carga} className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={formData.metadata?.habilitacoes?.tipos_carga?.includes(carga) || false} onChange={() => handleMultiSelectChange('metadata.habilitacoes.tipos_carga', carga)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{carga}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-4">Veículos Permitidos</h3>
                      <div className="flex flex-wrap gap-4">
                        {['VUC', 'Toco', 'Truck', 'Bitruck', 'Carreta', 'Rodotrem'].map(v => (
                          <label key={v} className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={formData.metadata?.habilitacoes?.veiculos_permitidos?.includes(v) || false} onChange={() => handleMultiSelectChange('metadata.habilitacoes.veiculos_permitidos', v)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{v}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Restrições Operacionais</label>
                  <textarea name="metadata.habilitacoes.restricoes" value={formData.metadata?.habilitacoes?.restricoes || ''} onChange={handleChange} rows={2} placeholder="Ex: Não pode viajar aos domingos, alergia a produtos químicos..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>
              </div>
            )}

            {/* ABA 4: CUSTOS */}
            {activeTab === 'custos' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custo por Hora (R$)</label>
                    <input type="number" name="metadata.custos.valor_hora" value={formData.metadata?.custos?.valor_hora || ''} onChange={handleChange} min="0" step="0.01"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custo por Diária (R$)</label>
                    <input type="number" name="metadata.custos.valor_diaria" value={formData.metadata?.custos?.valor_diaria || ''} onChange={handleChange} min="0" step="0.01"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Score de Performance (0-100)</label>
                    <input type="number" name="metadata.custos.score_performance" value={formData.metadata?.custos?.score_performance || ''} onChange={handleChange} min="0" max="100"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="flex items-end gap-4 md:col-span-3">
                    <label className="flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 w-full md:w-1/2 cursor-pointer">
                      <input type="checkbox" name="metadata.acesso_app" checked={formData.metadata?.acesso_app || false} onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Liberar acesso ao App do Motorista</span>
                    </label>

                    <label className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 w-full md:w-1/2 cursor-pointer">
                      <input type="checkbox" name="metadata.custos.possui_rastreador" checked={formData.metadata?.custos?.possui_rastreador || false} onChange={handleChange}
                        className="w-4 h-4 text-gray-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Possui Rastreador Físico</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações Gerais</label>
                  <textarea name="metadata.custos.observacoes" value={formData.metadata?.custos?.observacoes || ''} onChange={handleChange} rows={3} placeholder="Anotações adicionais sobre o motorista..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors font-medium disabled:opacity-50"
            >
              <Save size={20} />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Motorista'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
