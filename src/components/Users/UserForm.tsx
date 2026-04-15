import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, MapPin, AlertCircle, Hash, Info, Eye, EyeOff, Mail, User, Shield, CheckCircle, Building, Camera, X, Globe, Users } from 'lucide-react';
import { User as UserType, usersService } from '../../services/usersService';
import { fetchCityByZipCode } from '../../data/citiesData';
import { establishmentsService, Establishment } from '../../services/establishmentsService';
import { PermissionsTree } from './PermissionsTree';
import { EstablishmentSelector } from './EstablishmentSelector';
import { Toast, ToastType } from '../common/Toast';
import { useTranslation } from 'react-i18next';
import { InlineMessage } from '../common/InlineMessage';
import zxcvbn from 'zxcvbn';
import { useAuth } from '../../hooks/useAuth';
import { CopyPermissionsModal } from './CopyPermissionsModal';

interface UserFormProps {
  onBack: () => void;
  onSave: (user: any) => void;
  user?: UserType;
}

export const UserForm: React.FC<UserFormProps> = ({ onBack, onSave, user }) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    codigo: user?.codigo || '',
    nome: user?.nome || '',
    email: user?.email || '',
    senha: '',
    confirmarSenha: '',
    cpf: user?.cpf || '',
    telefone: user?.telefone || '',
    celular: user?.celular || '',
    cargo: user?.cargo || '',
    departamento: user?.departamento || '',
    data_admissao: user?.data_admissao || '',
    data_nascimento: user?.data_nascimento || '',
    endereco: user?.endereco || '',
    bairro: user?.bairro || '',
    cep: user?.cep || '',
    cidade: user?.cidade || '',
    estado: user?.estado || '',
    perfil: user?.perfil || 'operador',
    permissoes: user?.permissoes || [],
    estabelecimento_id: user?.estabelecimento_id?.toString() || '',
    estabelecimentosPermitidos: user?.estabelecimentosPermitidos || [],
    observacoes: user?.observacoes || '',
    status: user?.status || 'ativo',
    preferred_language: user?.preferred_language || 'pt',
    force_password_reset: user?.force_password_reset || false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [cepError, setCepError] = useState('');
  const [cepSuccess, setCepSuccess] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'professional' | 'access' | 'address' | 'permissions' | 'establishments'>('basic');
  const [showPermissionsConfig, setShowPermissionsConfig] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(user?.foto_perfil_url || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Load establishments
  useEffect(() => {
    const loadEstablishments = async () => {
      try {
        const data = await establishmentsService.getAll();
        setEstablishments(data);
      } catch (error) {
      }
    };
    loadEstablishments();
  }, []);

  // Auto-generate code for new users
  useEffect(() => {
    const loadNextCode = async () => {
      if (!user && !formData.codigo) {
        const nextCode = await usersService.getNextCode();
        setFormData(prev => ({
          ...prev,
          codigo: nextCode
        }));
      }
    };
    loadNextCode();
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'A foto deve ter no máximo 5MB.', type: 'error' });
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setToast({ message: 'Formato inválido. Use JPG, PNG, GIF ou WebP.', type: 'error' });
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
    if (user?.id && user?.foto_perfil_url) {
      setIsUploadingPhoto(true);
      const success = await usersService.deleteProfilePhoto(user.id, user.foto_perfil_url);
      setIsUploadingPhoto(false);

      if (success) {
        setProfilePhoto(null);
        setProfilePhotoPreview(null);
        setToast({ message: 'Foto removida com sucesso!', type: 'success' });
      } else {
        setToast({ message: 'Erro ao remover foto.', type: 'error' });
      }
    } else {
      setProfilePhoto(null);
      setProfilePhotoPreview(null);
    }
  };

  // Show permissions config when perfil is personalizado
  useEffect(() => {
    if (formData.perfil === 'personalizado') {
      setShowPermissionsConfig(true);
    } else {
      setShowPermissionsConfig(false);
    }
  }, [formData.perfil]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('email') ? value.toLowerCase() : value
    }));

    // Clear specific field errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateField = (name: string, value: string) => {
    let error = '';

    switch (name) {
      case 'codigo':
        if (!value) {
          error = 'Código é obrigatório';
        } else if (!/^\d{4}$/.test(value)) {
          error = 'Código deve ter exatamente 4 dígitos numéricos (ex: 0001)';
        } else if (value === '0000') {
          error = 'Código 0000 não é permitido. O código deve iniciar em 0001';
        }
        break;
      case 'nome':
        if (!value || value.trim() === '') {
          error = 'Nome é obrigatório';
        }
        break;
      case 'email':
        if (!value) {
          error = 'Email é obrigatório';
        } else if (!usersService.isValidEmail(value)) {
          error = 'Email deve ter um formato válido';
        }
        break;
      case 'cpf':
        // CONFIG_CPF_OBRIGATORIO: Para tornar o CPF obrigatório novamente, mude isCpfRequired para true.
        const isCpfRequired = false;
        if (isCpfRequired && !value) {
          error = 'CPF é obrigatório';
        } else if (value && !usersService.isValidCPF(value)) {
          error = 'CPF deve ter um formato válido';
        }
        break;
      case 'cargo':
        if (!value || value.trim() === '') {
          error = 'Cargo é obrigatório';
        }
        break;
      case 'departamento':
        if (!value || value.trim() === '') {
          error = 'Departamento é obrigatório';
        }
        break;
      case 'perfil':
        if (!value) {
          error = 'Perfil é obrigatório';
        }
        break;
      case 'senha':
        if (!user && !value) {
          error = 'Senha é obrigatória para novos usuários';
        } else if (value && value.length < 8) {
          error = t('users.form.fields.passwordMinLength');
        } else if (value) {
          const result = zxcvbn(value);
          if (result.score < 3) {
            error = t('users.form.fields.passwordWeakFeedback');
          }
        }
        break;
      case 'confirmarSenha':
        if (formData.senha && value !== formData.senha) {
          error = 'Confirmação de senha não confere';
        }
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    return !error;
  };

  const formatCPF = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (numeric.length <= 3) {
      return numeric;
    } else if (numeric.length <= 6) {
      return `${numeric.slice(0, 3)}.${numeric.slice(3)}`;
    } else if (numeric.length <= 9) {
      return `${numeric.slice(0, 3)}.${numeric.slice(3, 6)}.${numeric.slice(6)}`;
    } else {
      return `${numeric.slice(0, 3)}.${numeric.slice(3, 6)}.${numeric.slice(6, 9)}-${numeric.slice(9, 11)}`;
    }
  };

  const formatPhone = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (numeric.length <= 2) {
      return numeric;
    } else if (numeric.length <= 6) {
      return `(${numeric.slice(0, 2)}) ${numeric.slice(2)}`;
    } else if (numeric.length <= 10) {
      return `(${numeric.slice(0, 2)}) ${numeric.slice(2, 6)}-${numeric.slice(6)}`;
    } else {
      return `(${numeric.slice(0, 2)}) ${numeric.slice(2, 7)}-${numeric.slice(7, 11)}`;
    }
  };

  const formatCEP = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (numeric.length <= 5) {
      return numeric;
    } else {
      return `${numeric.slice(0, 5)}-${numeric.slice(5, 8)}`;
    }
  };

  const formatCode = (value: string) => {
    const numeric = value.replace(/\D/g, '').slice(0, 4);
    return numeric.padStart(4, '0');
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setFormData(prev => ({
      ...prev,
      codigo: formatted
    }));
    validateField('codigo', formatted);
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({
      ...prev,
      cpf: formatted
    }));
    validateField('cpf', formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({
      ...prev,
      [field]: formatted
    }));
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setFormData(prev => ({
      ...prev,
      cep: formatted
    }));
    setCepError('');
    setCepSuccess('');
  };

  const searchCEP = async () => {
    if (!formData.cep || formData.cep.length < 9) {
      setCepError('CEP deve ter 8 dígitos');
      return;
    }

    setIsSearchingCep(true);
    setCepError('');
    setCepSuccess('');

    try {
      const city = await fetchCityByZipCode(formData.cep.replace(/\D/g, ''));
      
      if (city) {
        setFormData(prev => ({
          ...prev,
          cidade: city.name,
          estado: city.stateAbbreviation,
          bairro: city.neighborhood || prev.bairro
        }));
        setCepSuccess(`Endereço encontrado: ${city.name} - ${city.stateAbbreviation}${city.neighborhood ? ` - ${city.neighborhood}` : ''}`);
      } else {
        setCepError('CEP não encontrado. Verifique o número informado.');
      }
    } catch (error) {
      setCepError('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Auto-search CEP when it's complete
  useEffect(() => {
    if (formData.cep.length === 9) {
      const timer = setTimeout(() => {
        searchCEP();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.cep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all required fields
    // CONFIG_CPF_OBRIGATORIO: Adicione 'cpf' de volta na lista abaixo para torná-lo bloqueante no submit.
    const requiredFields = ['codigo', 'nome', 'email', 'cargo', 'departamento', 'perfil'];
    if (!user) requiredFields.push('senha', 'confirmarSenha');

    let hasErrors = false;
    requiredFields.forEach(field => {
      if (!validateField(field, formData[field as keyof typeof formData] as string)) {
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setToast({ message: 'Por favor, corrija os erros antes de continuar.', type: 'warning' });
      return;
    }

    // Validação de unicidade do E-mail
    if (formData.email) {
      const isUniqueEmail = await usersService.isEmailUnique(formData.email, user?.id);
      if (!isUniqueEmail) {
        setErrors(prev => ({ ...prev, email: 'Este e-mail já está em uso.' }));
        setToast({ message: 'Falha: Este e-mail já está cadastrado para outro usuário.', type: 'error' });
        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
        if (emailInput) {
          emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          emailInput.focus();
        }
        return;
      }
    }

    // Validate permissions for personalizado profile
    if (formData.perfil === 'personalizado' && (!formData.permissoes || formData.permissoes.length === 0)) {
      setToast({ message: 'Por favor, selecione pelo menos uma permissão para o perfil personalizado.', type: 'warning' });
      return;
    }

    // Validate establishments if any are selected
    if (formData.estabelecimentosPermitidos.length > 0 && !formData.estabelecimento_id) {
      // If user has establishments permissions but no default establishment,
      // set the first permitted establishment as default
      setFormData(prev => ({
        ...prev,
        estabelecimento_id: prev.estabelecimentosPermitidos[0].toString()
      }));
    }

    // Prepare data for saving
    const userData = {
      ...formData,
      estabelecimento_id: formData.estabelecimento_id && formData.estabelecimento_id.trim() !== '' ? formData.estabelecimento_id : undefined,
      estabelecimentosPermitidos: formData.estabelecimentosPermitidos
    };
    // Remove password confirmation from data
    const { confirmarSenha, ...finalData } = userData as Record<string, any>;

    // Convert empty strings to undefined for optional fields
    if (!finalData.data_nascimento || finalData.data_nascimento === '') {
      finalData.data_nascimento = undefined;
    }
    if (!finalData.data_admissao || finalData.data_admissao === '') {
      finalData.data_admissao = undefined;
    }
    if (!finalData.telefone || finalData.telefone === '') {
      finalData.telefone = undefined;
    }
    if (!finalData.celular || finalData.celular === '') {
      finalData.celular = undefined;
    }
    if (!finalData.endereco || finalData.endereco === '') {
      finalData.endereco = undefined;
    }
    if (!finalData.bairro || finalData.bairro === '') {
      finalData.bairro = undefined;
    }
    if (!finalData.cep || finalData.cep === '') {
      finalData.cep = undefined;
    }
    if (!finalData.cidade || finalData.cidade === '') {
      finalData.cidade = undefined;
    }
    if (!finalData.estado || finalData.estado === '') {
      finalData.estado = undefined;
    }
    if (!finalData.observacoes || finalData.observacoes === '') {
      finalData.observacoes = undefined;
    }
    if (!finalData.cpf || finalData.cpf === '') {
      finalData.cpf = undefined;
    }

    // Only include password if it was filled
    if (user && !finalData.senha) {
      delete finalData.senha;
    } else if (user && finalData.senha) {
      // Password was filled, keep it to update
      // The service will handle the update
    }

    // Remove permissions if not personalizado
    if (finalData.perfil !== 'personalizado') {
      delete finalData.permissoes;
    }

    // Pass profile photo to be uploaded after save
    const dataToSave = {
      ...finalData,
      _profilePhoto: profilePhoto // Temporary field to pass the photo file
    };
    onSave(dataToSave);
  };

  const generateNewCode = async () => {
    const nextCode = await usersService.getNextCode();
    setFormData(prev => ({
      ...prev,
      codigo: nextCode
    }));
    setErrors(prev => ({
      ...prev,
      codigo: ''
    }));
  };

  const handlePermissionsChange = (permissions: string[]) => {
    setFormData(prev => ({
      ...prev,
      permissoes: permissions
    }));
  };

  const handleCopyPermissionsSubmit = async (targetUserIds: string[]) => {
    try {
      const updatePromises = targetUserIds.map((targetId) => 
        usersService.update(targetId, {
          permissoes: formData.permissoes
        } as Partial<UserType>) // Cast because usersService update accepts Partial<User>
      );
      
      await Promise.all(updatePromises);
      
      setToast({
        message: `Permissões distribuídas com sucesso para ${targetUserIds.length} usuário(s)!`,
        type: 'success'
      });
      setShowCopyModal(false);
    } catch (error) {
      console.error('Error copying permissions:', error);
      throw new Error('Falha ao transferir permissões.'); 
    }
  };

  const handleEstablishmentsChange = (establishmentCodes: string[]) => {
    setFormData(prev => ({
      ...prev,
      estabelecimentosPermitidos: establishmentCodes
    }));
  };

  const isProtectedUser = user?.codigo === '0001';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('users.buttons.back')} {t('users.title').toLowerCase()}</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {user ? t('users.form.editTitle') : t('users.form.newTitle')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{user ? t('users.form.editSubtitle') : t('users.form.newSubtitle')}</p>
        
        {isProtectedUser && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">{t('users.form.hints.protectedUserTitle')}</p>
                <p className="text-xs text-yellow-700 mt-1">
                  {t('users.form.hints.protectedUserDesc')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User size={16} />
                <span>{t('users.form.tabs.basic')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'contact'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail size={16} />
                <span>{t('users.form.tabs.contact')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('professional')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'professional'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building size={16} />
                <span>{t('users.form.tabs.professional')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'access'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield size={16} />
                <span>{t('users.form.tabs.access')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('establishments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'establishments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building size={16} />
                <span>{t('users.form.tabs.establishments')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('address')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'address'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MapPin size={16} />
                <span>{t('users.form.tabs.address')}</span>
              </div>
            </button>
            {formData.perfil === 'personalizado' && currentUser?.perfil?.toLowerCase() === 'administrador' && (
              <button
                onClick={() => setActiveTab('permissions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'permissions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} />
                  <span>{t('users.form.tabs.permissions')}</span>
                </div>
              </button>
            )}
          </nav>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'basic' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('users.form.tabs.basic')}</h2>

            {/* {t('users.form.fields.avatar')} */}
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('users.form.fields.avatar')}
              </label>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {profilePhotoPreview ? (
                    <img
                      src={profilePhotoPreview}
                      alt={t('users.form.fields.avatar')}
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                      <span className="text-3xl font-semibold text-white">
                        {formData.nome?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U'}
                      </span>
                    </div>
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handlePhotoChange}
                        className="hidden"
                        disabled={isUploadingPhoto}
                      />
                      <div className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        <Camera size={18} />
                        <span>{t('users.buttons.choosePhoto')}</span>
                      </div>
                    </label>
                    {profilePhotoPreview && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={isUploadingPhoto}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <X size={18} />
                        <span>{t('users.buttons.remove')}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t('users.form.fields.avatarHint')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('users.form.fields.code')} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    readOnly
                    disabled
                    required
                    maxLength={4}
                    className="w-full px-3 py-2 pr-10 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed border-gray-300"
                    placeholder="0001"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Hash size={18} />
                  </div>
                </div>

                {errors.codigo && (
                  <div className="mt-2">
                    <InlineMessage type="error" message={errors.codigo} />
                  </div>
                )}

                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{t('users.form.hints.autoCodeTitle')}</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">{t('users.form.hints.autoCodeDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('users.form.fields.name')} *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('users.form.fields.namePlaceholder', 'Ex: João da Silva')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('users.form.fields.email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={async (e) => {
                    const isValid = validateField('email', e.target.value);
                    if (isValid && e.target.value) {
                      const isUnique = await usersService.isEmailUnique(e.target.value, user?.id);
                      if (!isUnique) {
                        setErrors(prev => ({ ...prev, email: 'Este e-mail já está em uso.' }));
                      }
                    }
                  }}
                  required
                  disabled={isProtectedUser}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } ${isProtectedUser ? 'bg-gray-100' : ''}`}
                  placeholder="usuário@suaempresa.com.br"
                />
                
                {errors.email && (
                  <div className="mt-2">
                    <InlineMessage type="error" message={errors.email} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> 
                  {t('users.form.fields.cpf')} {/* CONFIG_CPF_OBRIGATORIO: Adicione ' *' após a tag de instrução */}
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  onBlur={(e) => validateField('cpf', e.target.value)}
                  // CONFIG_CPF_OBRIGATORIO: Descomente a tag 'required' abaixo
                  // required
                  maxLength={14}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.cpf ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="000.000.000-00"
                />
                
                {errors.cpf && (
                  <div className="mt-2">
                    <InlineMessage type="error" message={errors.cpf} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('users.form.tabs.contact')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('users.form.fields.phone')} </label>
                <input
                  type="text"
                  name="telefone"
                  value={formData.telefone}
                  onChange={(e) => handlePhoneChange(e, 'telefone')}
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(11) 3333-4444"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('users.form.fields.mobile')} </label>
                <input
                  type="text"
                  name="celular"
                  value={formData.celular}
                  onChange={(e) => handlePhoneChange(e, 'celular')}
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('users.form.fields.birthDate')} </label>
                <input
                  type="date"
                  name="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'professional' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('users.form.tabs.professional')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('users.form.fields.position')} * </label>
                <input
                  type="text"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Analista de Sistemas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('users.form.fields.department')} * </label>
                <select
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('common.select')} {t('users.form.fields.department').toLowerCase()}</option>
                  <option value="TI">TI</option>
                  <option value="Operações">Operações</option>
                  <option value="Logística">Logística</option>
                  <option value="Transportes">Transportes</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="RH">Recursos Humanos</option>
                  <option value="Jurídico">Jurídico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('users.form.fields.admissionDate')} </label>
                <input
                  type="date"
                  name="data_admissao"
                  value={formData.data_admissao}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('users.form.fields.mainEstablishment')} </label>
                <select
                  name="estabelecimento_id"
                  value={formData.estabelecimento_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('common.select')} {t('establishments.title').toLowerCase()}</option>
                  {establishments
                    .filter(e => formData.estabelecimentosPermitidos.length === 0 || 
                                formData.estabelecimentosPermitidos.includes(e.id) ||
                                formData.estabelecimentosPermitidos.includes(e.codigo))
                    .map(establishment => (
                      <option key={establishment.id} value={establishment.id}>
                        {establishment.codigo} - {establishment.fantasia || establishment.razao_social}
                      </option>
                    ))
                  }
                </select>
                {formData.estabelecimentosPermitidos.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('users.form.hints.establishmentLimitations')}</p>
                )}
              </div>
            </div>

            {/* Observations */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('users.form.fields.observations')} </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('users.form.fields.observationsPlaceholder')}
              />
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('users.form.tabs.access')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('users.form.fields.role')} * </label>
                <select
                  name="perfil"
                  value={formData.perfil}
                  onChange={handleInputChange}
                  required
                  disabled={isProtectedUser || currentUser?.perfil?.toLowerCase() !== 'administrador'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    (isProtectedUser || currentUser?.perfil?.toLowerCase() !== 'administrador') ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="administrador">{t('users.roles.admin')}</option>
                  <option value="gerente">{t('users.roles.manager')}</option>
                  <option value="operador">{t('users.roles.operator')}</option>
                  <option value="visualizador">{t('users.roles.viewer')}</option>
                  <option value="personalizado">{t('users.roles.custom')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('users.form.fields.status')} * </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  disabled={isProtectedUser}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isProtectedUser ? 'bg-gray-100' : ''
                  }`}
                >
                  <option value="ativo">{t('users.filters.active')}</option>
                  <option value="inativo">{t('users.filters.inactive')}</option>
                  <option value="bloqueado">{t('users.filters.blocked')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                  <Globe size={16} />
                  <span> {t('users.form.fields.preferredLanguage')} </span>
                </label>
                <select
                  name="preferred_language"
                  value={formData.preferred_language}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pt">🇧🇷 Português (Brasil)</option>
                  <option value="en">🇺🇸 English (United States)</option>
                  <option value="es">🇪🇸 Español (España)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {user ?
                    t('users.form.hints.languageSaveHint', 'Suas alterações entrarão em vigor no próximo login.') :
                    t('users.form.hints.languageUserHint', 'A linguagem escolhida será aplicada quando o usuário fizer login.')
                  }
                </p>
              </div>

              {/* Force Password Reset Toggle (iOS Style) - Apenas para administradores */}
              {currentUser?.perfil?.toLowerCase() === 'administrador' && (
                <div className="md:col-span-2 mt-2 mb-2 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <Shield size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Exigir alteração de senha no próximo login
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mr-4">
                        Ao ativar esta opção, o usuário será obrigado a redefinir sua senha imediatamente após fazer o próximo login, interceptando o acesso ao painel.
                      </p>
                    </div>
                  </div>
                  
                  {/* iOS Style Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      name="force_password_reset"
                      className="sr-only peer"
                      checked={formData.force_password_reset}
                      onChange={(e) => setFormData(prev => ({ ...prev, force_password_reset: e.target.checked }))}
                      disabled={isProtectedUser}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {user ? t('users.form.fields.newPassword') : t('users.form.fields.password') + ' *'} </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    onBlur={(e) => validateField('senha', e.target.value)}
                    required={!user}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.senha ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={user ? t('users.form.fields.passwordHint') : "*****"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {formData.senha && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('users.form.fields.passwordStrength')}:</span>
                      <span className={`text-xs font-medium ${
                        zxcvbn(formData.senha).score < 3 ? 'text-red-500' : 'text-green-600'
                      }`}>
                        {zxcvbn(formData.senha).score === 0 && t('users.form.fields.passwordVeryWeak')}
                        {zxcvbn(formData.senha).score === 1 && t('users.form.fields.passwordWeak')}
                        {zxcvbn(formData.senha).score === 2 && t('users.form.fields.passwordFair')}
                        {zxcvbn(formData.senha).score >= 3 && t('users.form.fields.passwordStrong')}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          zxcvbn(formData.senha).score === 0 ? 'bg-red-500 w-1/4' : 
                          zxcvbn(formData.senha).score === 1 ? 'bg-orange-500 w-2/4' : 
                          zxcvbn(formData.senha).score === 2 ? 'bg-yellow-500 w-3/4' : 
                          'bg-green-500 w-full'
                        }`} 
                      ></div>
                    </div>
                    {zxcvbn(formData.senha).score < 3 && zxcvbn(formData.senha).feedback.warning && (
                      <p className="text-xs text-red-500 mt-1">
                        {t('users.form.fields.passwordWeakFeedback')}
                      </p>
                    )}
                  </div>
                )}
                
                {errors.senha && (
                  <div className="mt-2">
                    <InlineMessage type="error" message={errors.senha} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {user ? t('users.form.fields.confirmNewPassword') : t('users.form.fields.confirmPassword') + ' *'} </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmarSenha"
                    value={formData.confirmarSenha}
                    onChange={handleInputChange}
                    onBlur={(e) => validateField('confirmarSenha', e.target.value)}
                    required={!user || !!formData.senha}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmarSenha ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="*****"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {errors.confirmarSenha && (
                  <div className="mt-2">
                    <InlineMessage type="error" message={errors.confirmarSenha} />
                  </div>
                )}
              </div>
            </div>

            {/* Access Level Info */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">{t('users.form.hints.accessLevelsTitle')}</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• <strong>{t('users.roles.admin')}:</strong> {t('users.form.hints.accessAdmin')}</li>
                    <li>• <strong>{t('users.roles.manager')}:</strong> {t('users.form.hints.accessManager')}</li>
                    <li>• <strong>{t('users.roles.operator')}:</strong> {t('users.form.hints.accessOperator')}</li>
                    <li>• <strong>{t('users.roles.viewer')}:</strong> {t('users.form.hints.accessViewer')}</li>
                    <li>• <strong>{t('users.roles.custom')}:</strong> {t('users.form.hints.accessCustom')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Permissions Configuration Notice */}
            {formData.perfil === 'personalizado' && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle size={16} className="text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">{t('users.form.hints.customPermissionsTitle')}</p>
                    <p className="text-xs text-green-700 mt-1">
                      {t('users.form.hints.customPermissionsDesc')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'establishments' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('users.form.tabs.establishments')}</h2>
            
            <EstablishmentSelector 
              selectedEstablishments={formData.estabelecimentosPermitidos}
              onChange={handleEstablishmentsChange}
            />
          </div>
        )}

        {activeTab === 'address' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('users.form.tabs.address')} ({t('common.optional')})</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CEP - Primeiro campo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CEP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleCEPChange}
                    maxLength={9}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="00000-000"
                  />
                  <button
                    type="button"
                    onClick={searchCEP}
                    disabled={isSearchingCep || formData.cep.length < 9}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
                    title={t('common.search')}
                  >
                    {isSearchingCep ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Search size={18} />
                    )}
                  </button>
                </div>

                {/* CEP Messages */}
                {cepError && (
                  <div className="mt-2">
                    <InlineMessage type="error" message={cepError} />
                  </div>
                )}

                {cepSuccess && (
                  <div className="mt-2">
                    <InlineMessage type="success" message={`${t('establishments.form.address.successMessage')} ${cepSuccess.replace('Endereço encontrado: ', '')}`} />
                  </div>
                )}
              </div>

              {/* Cidade - Somente leitura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('establishments.form.address.city')} </label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  placeholder={t('establishments.form.address.autoFilledByZipCode')}
                />
              </div>

              {/* Estado - Somente leitura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('establishments.form.address.state')} </label>
                <input
                  type="text"
                  name="estado"
                  value={formData.estado}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  placeholder="UF"
                />
              </div>

              {/* Bairro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('establishments.form.address.neighborhood')} </label>
                <input
                  type="text"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t('establishments.form.address.neighborhood')}
                />
              </div>

              {/* Endereço/Logradouro - Ocupa toda a linha */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {t('establishments.form.address.street')} </label>
                <input
                  type="text"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Rua das Flores, Avenida Paulista"
                />
              </div>
            </div>

            {/* Informativo */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{t('users.form.hints.autoZipSearch')}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    {t('users.form.hints.autoZipDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && formData.perfil === 'personalizado' && currentUser?.perfil?.toLowerCase() === 'administrador' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('users.form.hints.customPermissionsTitle')}</h2>
              
              {currentUser?.perfil?.toLowerCase() === 'administrador' && (
                <button
                  type="button"
                  onClick={() => setShowCopyModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors text-sm font-medium border border-blue-200 dark:border-blue-800"
                >
                  <Users size={16} />
                  <span>Copiar para Outros...</span>
                </button>
              )}
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">{t('users.roles.custom')}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {t('users.form.hints.customPermissionsExtra')}
                  </p>
                </div>
              </div>
            </div>
            
            <PermissionsTree 
              selectedPermissions={formData.permissoes || []}
              onChange={handlePermissionsChange}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >{t('users.buttons.cancel')}</button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {user ? t('users.buttons.update') : t('users.buttons.save')} {t('users.title').slice(0, -1)}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showCopyModal && (
        <CopyPermissionsModal
          sourceUserId={user?.id}
          sourceUserName={formData.nome || 'Novo Usuário (Rascunho)'}
          sourcePermissions={formData.permissoes}
          onClose={() => setShowCopyModal(false)}
          onConfirm={handleCopyPermissionsSubmit}
        />
      )}
    </div>
  );
};
