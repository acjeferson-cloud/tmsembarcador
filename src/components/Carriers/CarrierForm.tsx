import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Info, Hash, MapPin, Settings, Truck, Search, Loader } from 'lucide-react';
import { carriersService } from '../../services/carriersService';
import { countriesService } from '../../services/countriesService';
import { statesService } from '../../services/statesService';
import { getAllCities, findOrCreateCityByCEP, findCityByCEPFromDatabase } from '../../services/citiesService';
import { InlineMessage } from '../common/InlineMessage';
import { receitaFederalService } from '../../services/receitaFederalService';
import { formatCompanyName, formatCNPJInput, formatPhone, unformatCNPJ, unformatPhone } from '../../utils/formatters';

interface CarrierFormProps {
  onBack: () => void;
  onSave: (carrier: any) => void;
  carrier?: any;
  isEdit?: boolean;
}

export const CarrierForm: React.FC<CarrierFormProps> = ({ onBack, onSave, carrier, isEdit = false }) => {
  const [formData, setFormData] = useState({
    codigo: carrier?.codigo || '',
    razaoSocial: carrier?.razao_social || '',
    fantasia: carrier?.fantasia || '',
    logotipo: carrier?.logotipo || null,
    cnpj: carrier?.cnpj || '',
    inscricaoEstadual: carrier?.inscricao_estadual || '',
    pais: carrier?.pais_id || '',
    estado: carrier?.estado_id || '',
    cidade: carrier?.cidade_id || '',
    logradouro: carrier?.logradouro || '',
    numero: carrier?.numero || '',
    complemento: carrier?.complemento || '',
    bairro: carrier?.bairro || '',
    cep: carrier?.cep || '',
    toleranciaValorCte: carrier?.tolerancia_valor_cte || '',
    toleranciaPercentualCte: carrier?.tolerancia_percentual_cte || '',
    toleranciaValorFatura: carrier?.tolerancia_valor_fatura || '',
    toleranciaPercentualFatura: carrier?.tolerancia_percentual_fatura || '',
    email: carrier?.email || '',
    phone: carrier?.phone || '',
    status: carrier?.status || 'ativo',
    modalRodoviario: carrier?.modal_rodoviario || false,
    modalAereo: carrier?.modal_aereo || false,
    modalAquaviario: carrier?.modal_aquaviario || false,
    modalFerroviario: carrier?.modal_ferroviario || false,
    consideraSabadoUtil: carrier?.considera_sabado_util || false,
    consideraDomingoUtil: carrier?.considera_domingo_util || false,
    consideraFeriados: carrier?.considera_feriados !== undefined ? carrier.considera_feriados : true
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(carrier?.logotipo || null);
  const [codeError, setCodeError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'tolerance'>('basic');
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [cepMessage, setCepMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const [cnpjMessage, setCnpjMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!carrier && !formData.codigo) {
      generateNextCode();
    }
    // Clear code error when editing
    if (carrier) {
      setCodeError('');
      // Formata dados ao carregar em modo edição
      setFormData(prev => ({
        ...prev,
        cnpj: formatCNPJInput(prev.cnpj),
        phone: formatPhone(prev.phone),
        razaoSocial: formatCompanyName(prev.razaoSocial),
        fantasia: formatCompanyName(prev.fantasia)
      }));
    }
  }, [carrier]);

  useEffect(() => {
    if (formData.estado) {
      loadCitiesByState(formData.estado);
    } else {
      setFilteredCities([]);
    }
  }, [formData.estado]);

  const loadData = async () => {
    try {
      const [countriesData, statesData, citiesData] = await Promise.all([
        countriesService.getAll(),
        statesService.getAll(),
        getAllCities()
      ]);

      console.log('Dados carregados:');
      console.log('- Países:', countriesData.length);
      console.log('- Estados:', statesData.length);
      console.log('- Cidades:', citiesData.length);

      if (citiesData.length > 0) {
        console.log('Exemplo de cidade:', citiesData[0]);
      }

      setCountries(countriesData);
      setStates(statesData);
      setCities(citiesData);

      if (!carrier || !carrier.pais_id) {
        const brazil = countriesData.find((c: any) => c.name === 'Brasil');
        if (brazil) {
          setFormData(prev => ({ ...prev, pais: brazil.id }));
        }
      }

      if (carrier?.estado_id) {
        const state = statesData.find((s: any) => s.id === carrier.estado_id);
        if (state) {
          const stateCities = citiesData.filter((c: any) => c.stateAbbreviation === state.abbreviation);
          setFilteredCities(stateCities);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const loadCitiesByState = (stateId: string) => {
    if (!stateId) {
      setFilteredCities([]);
      return;
    }

    const state = states.find(s => s.id === stateId);
    if (state) {
      const stateCities = cities.filter((c: any) => {
        return c.stateAbbreviation === state.abbreviation;
      });
      console.log('Estado selecionado:', state.name, state.abbreviation);
      console.log('Cidades filtradas:', stateCities.length);
      setFilteredCities(stateCities);
    } else {
      console.log('Estado não encontrado para ID:', stateId);
      setFilteredCities([]);
    }
  };

  const generateNextCode = async () => {
    try {
      console.log('Gerando próximo código...');
      const nextCode = await carriersService.getNextCode();
      console.log('Código gerado:', nextCode);
      setFormData(prev => ({
        ...prev,
        codigo: nextCode
      }));
      setCodeError(''); // Limpar qualquer erro de código
    } catch (error) {
      console.error('Erro ao gerar código:', error);
      setCodeError('');
    }
  };

  const estados = states.map(s => ({ id: s.id, name: s.name }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'estado') {
      setFormData(prev => ({
        ...prev,
        cidade: ''
      }));
    }

    if (name === 'codigo') {
      validateCode(value);
    }
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJInput(e.target.value);
    setFormData(prev => ({
      ...prev,
      cnpj: formatted
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({
      ...prev,
      phone: formatted
    }));
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formatted = formatCompanyName(value);
    setFormData(prev => ({
      ...prev,
      [name]: formatted
    }));
  };

  const validateCode = async (codigo: string): Promise<boolean> => {
    setCodeError('');
    console.log('validateCode chamado com:', codigo);

    if (!codigo) {
      setCodeError('Código é obrigatório');
      console.log('Validação falhou: código vazio');
      return false;
    }

    try {
      const existingCarrier = await carriersService.getByCode(codigo);
      console.log('Transportador existente encontrado:', existingCarrier);

      if (existingCarrier && existingCarrier.id !== carrier?.id) {
        setCodeError('Este código já está sendo usado por outro transportador');
        console.log('Validação falhou: código já existe');
        return false;
      }

      console.log('Validação bem-sucedida!');
      return true;
    } catch (error) {
      console.error('Erro ao validar código:', error);
      // Em caso de erro na validação, permitir continuar
      return true;
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      codigo: value
    }));
    validateCode(value);
  };

  const generateNewCode = async () => {
    try {
      const nextCode = await carriersService.getNextCode();
      setFormData(prev => ({
        ...prev,
        codigo: nextCode
      }));
      setCodeError('');
    } catch (error) {
      console.error('Erro ao gerar código:', error);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('📸 [LOGO UPLOAD] Arquivo:', file.name, file.size);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        console.log('📸 [LOGO UPLOAD] Base64 gerado, tamanho:', result?.length);
        setLogoPreview(result);
        setFormData(prev => {
          const updated = {
            ...prev,
            logotipo: result
          };
          console.log('📸 [LOGO UPLOAD] FormData atualizado:', { hasLogo: !!updated.logotipo });
          return updated;
        });
      };
      reader.onerror = (error) => {
        console.error('❌ [LOGO UPLOAD] Erro:', error);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    console.log('🗑️ [LOGO] Removendo');
    setLogoPreview(null);
    setFormData(prev => ({
      ...prev,
      logotipo: null
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== INICIANDO SALVAMENTO ===');
    console.log('Form data:', formData);
    console.log('Is editing?', !!carrier);

    // Validate required fields
    if (!formData.razaoSocial) {
      alert('Razão Social é obrigatória');
      return;
    }

    if (!formData.cnpj) {
      alert('CNPJ é obrigatório');
      return;
    }

    // Validate code only when creating (not editing)
    if (!carrier) {
      console.log('Validando código:', formData.codigo);
      const isValid = await validateCode(formData.codigo);
      console.log('Código válido?', isValid);

      if (!isValid) {
        console.log('Validação falhou. Erro:', codeError);
        return;
      }
    } else {
      console.log('Modo edição - pulando validação de código');
    }

    // Create carrier data with all required fields (remove formatting before saving)
    const carrierData = {
      codigo: formData.codigo,
      razaoSocial: formData.razaoSocial,
      fantasia: formData.fantasia,
      logotipo: formData.logotipo,
      cnpj: unformatCNPJ(formData.cnpj), // Remove formatação
      inscricaoEstadual: formData.inscricaoEstadual,
      pais: formData.pais || null,
      estado: formData.estado || null,
      cidade: formData.cidade || null,
      logradouro: formData.logradouro || '',
      numero: formData.numero || '',
      complemento: formData.complemento || '',
      bairro: formData.bairro || '',
      cep: formData.cep || '',
      toleranciaValorCte: formData.toleranciaValorCte || '0',
      toleranciaPercentualCte: formData.toleranciaPercentualCte || '0',
      toleranciaValorFatura: formData.toleranciaValorFatura || '0',
      toleranciaPercentualFatura: formData.toleranciaPercentualFatura || '0',
      email: formData.email,
      phone: unformatPhone(formData.phone), // Remove formatação
      status: formData.status || 'ativo',
      modalRodoviario: formData.modalRodoviario,
      modalAereo: formData.modalAereo,
      modalAquaviario: formData.modalAquaviario,
      modalFerroviario: formData.modalFerroviario,
      consideraSabadoUtil: formData.consideraSabadoUtil,
      consideraDomingoUtil: formData.consideraDomingoUtil,
      consideraFeriados: formData.consideraFeriados
    };

    console.log('Dados para salvar (formatados):', carrierData);
    console.log('📸 [SUBMIT] Logo presente?', !!carrierData.logotipo, carrierData.logotipo?.substring(0, 50));

    try {
      await onSave(carrierData);
      console.log('Salvamento concluído com sucesso!');
    } catch (error) {
      console.error('Erro capturado no handleSubmit:', error);
      alert(`Erro ao salvar transportador: ${error}`);
    }
  };

  const formatCurrency = (value: string | number) => {
    if (!value) return '';
    // Se já for número, converte para string formatada diretamente
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    }
    // Se for string, processa normalmente
    const numericValue = value.replace(/\D/g, '');
    const formattedValue = (parseInt(numericValue) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    return formattedValue;
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const formatPercentage = (value: string | number) => {
    if (!value) return '';
    // Se já for número, formata diretamente
    if (typeof value === 'number') {
      return `${value}%`;
    }
    // Se for string, processa normalmente
    const numericValue = value.replace(/\D/g, '');
    return numericValue ? `${numericValue}%` : '';
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const value = e.target.value.replace(/\D/g, '');
    if (parseInt(value) <= 100) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: value
      }));
    }
  };

  const handleConsultarCNPJ = async () => {
    if (!formData.cnpj) {
      setCnpjMessage({ type: 'error', text: 'Informe um CNPJ válido.' });
      return;
    }

    setIsLoadingCNPJ(true);
    setCnpjMessage(null);

    try {
      const dados = await receitaFederalService.consultarCNPJ(formData.cnpj);

      const permiteImportacao = receitaFederalService.permiteImportacao(dados.situacao_cadastral);
      const mensagemStatus = receitaFederalService.getMensagemStatus(dados.situacao_cadastral);

      if (!permiteImportacao) {
        setCnpjMessage({
          type: 'error',
          text: `Importação não permitida. ${mensagemStatus}\n\nApenas empresas com situação ATIVA podem ser cadastradas.`
        });
        setIsLoadingCNPJ(false);
        return;
      }

      // Preencher dados da empresa com formatação
      setFormData(prev => ({
        ...prev,
        cnpj: formatCNPJInput(dados.cnpj),
        razaoSocial: formatCompanyName(dados.razao_social),
        fantasia: formatCompanyName(dados.nome_fantasia || dados.razao_social),
        email: dados.email || prev.email,
        phone: dados.ddd_telefone_1 ? formatPhone(dados.ddd_telefone_1) : prev.phone,
        inscricaoEstadual: prev.inscricaoEstadual // Mantém o que já estava preenchido
      }));

      // Preencher endereço se disponível
      if (dados.cep) {
        const cleanCEP = dados.cep.replace(/\D/g, '');

        // Buscar Brasil como país padrão
        const brasilCountry = countries.find(c =>
          c.name === 'Brasil' || c.name === 'Brazil' || c.codigo_bacen === '1058'
        );

        // Buscar cidade no banco usando o CEP
        try {
          const cityFromDB = await findCityByCEPFromDatabase(cleanCEP);

          if (cityFromDB) {
            const state = states.find(s => s.abbreviation === cityFromDB.stateAbbreviation);

            if (state) {
              const stateCities = cities.filter((c: any) =>
                c.stateId === state.id ||
                c.stateAbbreviation === state.abbreviation
              );
              setFilteredCities(stateCities);

              const city = stateCities.find((c: any) =>
                c.id === cityFromDB.id ||
                c.name.toLowerCase() === cityFromDB.name.toLowerCase()
              );

              setFormData(prev => ({
                ...prev,
                pais: brasilCountry?.id || prev.pais,
                estado: state.id,
                cidade: city?.id || prev.cidade,
                cep: cleanCEP,
                logradouro: dados.logradouro || prev.logradouro,
                numero: dados.numero || prev.numero,
                complemento: dados.complemento || prev.complemento,
                bairro: dados.bairro || prev.bairro
              }));
            }
          } else {
            // Fallback para ViaCEP se não encontrar no banco
            const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
            const viaCepData = await viaCepResponse.json();

            if (!viaCepData.erro) {
              const state = states.find(s => s.abbreviation === viaCepData.uf);

              if (state) {
                const stateCities = cities.filter((c: any) =>
                  c.stateId === state.id ||
                  c.stateAbbreviation === state.abbreviation
                );
                setFilteredCities(stateCities);

                const city = stateCities.find((c: any) =>
                  c.name.toLowerCase() === viaCepData.localidade.toLowerCase()
                );

                setFormData(prev => ({
                  ...prev,
                  pais: brasilCountry?.id || prev.pais,
                  estado: state.id,
                  cidade: city?.id || prev.cidade,
                  cep: cleanCEP,
                  logradouro: viaCepData.logradouro || dados.logradouro || prev.logradouro,
                  bairro: viaCepData.bairro || dados.bairro || prev.bairro
                }));
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar cidade por CEP:', error);
        }
      }

      setCnpjMessage({
        type: 'success',
        text: `✓ Dados importados com sucesso! ${mensagemStatus}`
      });

      setTimeout(() => {
        setCnpjMessage(null);
      }, 5000);
    } catch (error: any) {
      console.error('Erro ao consultar CNPJ:', error);
      setCnpjMessage({
        type: 'error',
        text: error.message || 'Erro ao consultar CNPJ. Tente novamente.'
      });
    } finally {
      setIsLoadingCNPJ(false);
    }
  };

  const handleCEPSearch = async () => {
    const cleanCEP = formData.cep.replace(/\D/g, '');

    if (cleanCEP.length !== 8) {
      setCepMessage({ type: 'error', text: 'CEP deve conter 8 dígitos' });
      return;
    }

    setLoadingCEP(true);
    setCepMessage({ type: 'success', text: 'Buscando CEP...' });

    try {
      // ✅ NOVO: Busca PRIMEIRO no banco de dados (cities + zip_code_ranges)
      const cityFromDB = await findCityByCEPFromDatabase(cleanCEP);

      if (cityFromDB) {
        console.log('✅ Cidade encontrada no banco:', cityFromDB);

        // Buscar Brasil como país padrão
        const brasilCountry = countries.find(c =>
          c.name === 'Brasil' || c.name === 'Brazil' || c.codigo_bacen === '1058'
        );

        // Encontrar o estado
        const state = states.find(s =>
          s.abbreviation === cityFromDB.stateAbbreviation ||
          s.name === cityFromDB.stateName
        );

        if (state) {
          // Carregar as cidades do estado
          const stateCities = cities.filter((c: any) =>
            c.stateAbbreviation === state.abbreviation
          );
          setFilteredCities(stateCities);

          // Encontrar a cidade pelo ID ou nome
          const city = stateCities.find((c: any) =>
            c.id === cityFromDB.id ||
            c.name.toLowerCase() === cityFromDB.name.toLowerCase()
          );

          // Buscar informações adicionais do ViaCEP para preencher logradouro
          let logradouro = formData.logradouro;
          let bairro = cityFromDB.neighborhood || formData.bairro;

          try {
            const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
            const viaCepData = await viaCepResponse.json();

            if (!viaCepData.erro) {
              logradouro = viaCepData.logradouro || logradouro;
              bairro = viaCepData.bairro || bairro;
            }
          } catch (error) {
            console.log('⚠️ Não foi possível buscar logradouro do ViaCEP');
          }

          // ✅ Preencher TODOS os campos
          setFormData(prev => ({
            ...prev,
            pais: brasilCountry?.id || prev.pais,
            estado: state.id,
            cidade: city?.id || prev.cidade,
            logradouro: logradouro,
            bairro: bairro,
            cep: cleanCEP
          }));

          setCepMessage({
            type: 'success',
            text: `✓ ${cityFromDB.name}/${cityFromDB.stateAbbreviation}${cityFromDB.neighborhood ? ' - ' + cityFromDB.neighborhood : ''}`
          });
        } else {
          setCepMessage({ type: 'error', text: 'Estado não encontrado no sistema' });
        }
      } else {
        // Se não encontrou no banco, busca no ViaCEP como fallback
        console.log('⚠️ CEP não encontrado no banco, usando ViaCEP...');

        const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const viaCepData = await viaCepResponse.json();

        if (viaCepData.erro) {
          setCepMessage({ type: 'error', text: 'CEP não encontrado' });
          return;
        }

        // Buscar Brasil como país padrão
        const brasilCountry = countries.find(c =>
          c.name === 'Brasil' || c.name === 'Brazil' || c.codigo_bacen === '1058'
        );

        // Encontrar o estado pelo UF
        const state = states.find(s => s.abbreviation === viaCepData.uf);

        if (state) {
          // Carregar as cidades do estado
          const stateCities = cities.filter((c: any) =>
            c.stateAbbreviation === state.abbreviation
          );
          setFilteredCities(stateCities);

          // Encontrar a cidade pelo nome
          const city = stateCities.find((c: any) =>
            c.name.toLowerCase() === viaCepData.localidade.toLowerCase()
          );

          // Preencher os campos
          setFormData(prev => ({
            ...prev,
            pais: brasilCountry?.id || prev.pais,
            estado: state.id,
            cidade: city?.id || prev.cidade,
            logradouro: viaCepData.logradouro || prev.logradouro,
            bairro: viaCepData.bairro || prev.bairro,
            cep: cleanCEP
          }));

          setCepMessage({ type: 'success', text: `✓ ${viaCepData.localidade}/${viaCepData.uf}` });
        } else {
          setCepMessage({ type: 'error', text: 'Estado não encontrado no sistema' });
        }
      }

      setTimeout(() => {
        setCepMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepMessage({ type: 'error', text: 'Erro ao buscar CEP. Tente novamente.' });
    } finally {
      setLoadingCEP(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar para Transportadores</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Editar Transportador' : 'Novo Transportador'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Preencha os dados do transportador</p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Info size={16} />
                <span>Dados Básicos</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'location'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MapPin size={16} />
                <span>Endereço</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tolerance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tolerance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings size={16} />
                <span>Tolerâncias</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'basic' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dados Básicos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleCodeChange}
                    maxLength={4}
                    disabled={!!carrier}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      codeError ? 'border-red-300' : 'border-gray-300'
                    } ${carrier ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="0001"
                  />
                  {!carrier && (
                    <button
                      type="button"
                      onClick={generateNewCode}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Gerar próximo código"
                    >
                      <Hash size={18} />
                    </button>
                  )}
                </div>
                
                {codeError && (
                  <div className="mt-2">
                    <InlineMessage type="error" message={codeError} />
                  </div>
                )}
                
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info size={16} className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Código Sequencial</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Os códigos são gerados automaticamente em sequência numérica começando em 0001. 
                        {!carrier && " Clique no ícone # para gerar o próximo código disponível."}
                        {carrier && " O código não pode ser alterado após o cadastro."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Razão Social *
                </label>
                <input
                  type="text"
                  name="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={handleCompanyNameChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite a razão social"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CNPJ *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleCNPJChange}
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                  <button
                    type="button"
                    onClick={handleConsultarCNPJ}
                    disabled={isLoadingCNPJ || !formData.cnpj}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Buscar dados da Receita Federal"
                  >
                    {isLoadingCNPJ ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {cnpjMessage && (
                  <div className={`mt-2 text-xs ${cnpjMessage.type === 'error' ? 'text-red-600' : 'text-green-600'} flex items-start gap-1 whitespace-pre-wrap`}>
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{cnpjMessage.text}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  name="inscricaoEstadual"
                  value={formData.inscricaoEstadual}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 123.456.789.012"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  name="fantasia"
                  value={formData.fantasia}
                  onChange={handleCompanyNameChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome fantasia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contato@transportadora.com.br"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logotipo
              </label>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Clique para fazer upload do logotipo
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PNG, JPG até 2MB
                      </p>
                    </label>
                  </div>
                </div>
                
                {logoPreview && (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Preview do logotipo"
                      className="w-24 h-24 object-contain border border-gray-200 dark:border-gray-700 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Transport Modals Section */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Modais de Transporte</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Selecione os modais atendidos por este transportador:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <input
                    type="checkbox"
                    name="modalRodoviario"
                    checked={formData.modalRodoviario}
                    onChange={(e) => setFormData({ ...formData, modalRodoviario: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="flex items-center space-x-2">
                      <Truck className="text-blue-600" size={20} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Rodoviário</span>
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-sky-500 hover:bg-sky-50 transition-all">
                  <input
                    type="checkbox"
                    name="modalAereo"
                    checked={formData.modalAereo}
                    onChange={(e) => setFormData({ ...formData, modalAereo: e.target.checked })}
                    className="w-5 h-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                  />
                  <div className="ml-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sky-600 text-xl">✈️</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Aéreo</span>
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 transition-all">
                  <input
                    type="checkbox"
                    name="modalAquaviario"
                    checked={formData.modalAquaviario}
                    onChange={(e) => setFormData({ ...formData, modalAquaviario: e.target.checked })}
                    className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                  />
                  <div className="ml-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-cyan-600 text-xl">🚢</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Aquaviário</span>
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all">
                  <input
                    type="checkbox"
                    name="modalFerroviario"
                    checked={formData.modalFerroviario}
                    onChange={(e) => setFormData({ ...formData, modalFerroviario: e.target.checked })}
                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <div className="ml-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-amber-600 text-xl">🚂</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Ferroviário</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Working Days Configuration Section */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Configuração de Dias Úteis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Defina como o transportador considera dias úteis para cálculo de prazos de entrega:</p>

              <div className="space-y-3">
                <label className="flex items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <input
                    type="checkbox"
                    name="consideraSabadoUtil"
                    checked={formData.consideraSabadoUtil}
                    onChange={(e) => setFormData({ ...formData, consideraSabadoUtil: e.target.checked })}
                    className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Considera sábado como dia útil</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quando marcado, sábados serão contados no prazo de entrega</div>
                  </div>
                </label>

                <label className="flex items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <input
                    type="checkbox"
                    name="consideraDomingoUtil"
                    checked={formData.consideraDomingoUtil}
                    onChange={(e) => setFormData({ ...formData, consideraDomingoUtil: e.target.checked })}
                    className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Considera domingo como dia útil</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quando marcado, domingos serão contados no prazo de entrega</div>
                  </div>
                </label>

                <label className="flex items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <input
                    type="checkbox"
                    name="consideraFeriados"
                    checked={formData.consideraFeriados}
                    onChange={(e) => setFormData({ ...formData, consideraFeriados: e.target.checked })}
                    className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Considera feriados no cálculo de prazos</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quando marcado, feriados (nacionais, estaduais e municipais) não serão contados como dias úteis</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Endereço</h2>

            <div className="space-y-4">
              {/* CEP Field with Search Button - PRIMEIRO CAMPO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CEP
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="cep"
                      value={formData.cep}
                      onChange={handleInputChange}
                      onBlur={(e) => {
                        const cep = e.target.value.replace(/\D/g, '');
                        if (cep.length === 8) {
                          handleCEPSearch();
                        }
                      }}
                      maxLength={9}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="00000-000"
                    />
                    <button
                      type="button"
                      onClick={handleCEPSearch}
                      disabled={loadingCEP}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Buscar CEP"
                    >
                      {loadingCEP ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {cepMessage && (
                    <div className={`mt-2 text-xs ${cepMessage.type === 'error' ? 'text-red-600' : 'text-green-600'} flex items-center gap-1`}>
                      <Info className="w-3 h-3" />
                      <span>{cepMessage.text}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    País
                  </label>
                  <select
                    name="pais"
                    value={formData.pais}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione o país</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione o estado</option>
                    {states.map(estado => (
                      <option key={estado.id} value={estado.id}>
                        {estado.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cidade
                  </label>
                  <select
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleInputChange}
                    disabled={!formData.estado}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:bg-gray-700"
                  >
                    <option value="">Selecione a cidade</option>
                    {filteredCities.map((cidade: any) => (
                      <option key={cidade.id} value={cidade.id}>
                        {cidade.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Centro"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Complemento
                  </label>
                  <input
                    type="text"
                    name="complemento"
                    value={formData.complemento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Sala 45"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logradouro
                  </label>
                  <input
                    type="text"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rua das Flores"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tolerance' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configurações de Tolerância</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">CT-e</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tolerância de Valor no CT-e
                  </label>
                  <input
                    type="text"
                    name="toleranciaValorCte"
                    value={formData.toleranciaValorCte ? formatCurrency(formData.toleranciaValorCte) : ''}
                    onChange={(e) => handleCurrencyChange(e, 'toleranciaValorCte')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="R$ 0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tolerância de Percentual no CT-e
                  </label>
                  <input
                    type="text"
                    name="toleranciaPercentualCte"
                    value={formData.toleranciaPercentualCte ? formatPercentage(formData.toleranciaPercentualCte) : ''}
                    onChange={(e) => handlePercentageChange(e, 'toleranciaPercentualCte')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0%"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">Fatura</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tolerância de Valor na Fatura
                  </label>
                  <input
                    type="text"
                    name="toleranciaValorFatura"
                    value={formData.toleranciaValorFatura ? formatCurrency(formData.toleranciaValorFatura) : ''}
                    onChange={(e) => handleCurrencyChange(e, 'toleranciaValorFatura')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="R$ 0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tolerância de Percentual na Fatura
                  </label>
                  <input
                    type="text"
                    name="toleranciaPercentualFatura"
                    value={formData.toleranciaPercentualFatura ? formatPercentage(formData.toleranciaPercentualFatura) : ''}
                    onChange={(e) => handlePercentageChange(e, 'toleranciaPercentualFatura')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0%"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          {codeError && (
            <div className="mr-4">
              <InlineMessage type="error" message={`Erro no código: ${codeError}`} />
            </div>
          )}
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!carrier && !!codeError}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={codeError && !carrier ? `Botão desabilitado: ${codeError}` : 'Clique para salvar'}
          >
            {carrier ? 'Atualizar' : 'Salvar'} Transportador
          </button>
        </div>
      </form>
    </div>
  );
};