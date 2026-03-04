import React, { useState } from 'react';
import { ArrowLeft, Edit, Star, Phone, Mail, MapPin, Building, Clock, Truck, Hash, Globe, Eye, CheckCircle, Circle } from 'lucide-react';
import { FreightRateTablesList } from '../FreightRates/FreightRateTablesList';
import { getFreightRateTablesByCarrier } from '../../data/freightRatesData';
import { CarrierVision360 } from './CarrierVision360';

interface CarrierViewProps {
  onBack: () => void;
  onEdit: () => void;
  carrier: any;
}

export const CarrierView: React.FC<CarrierViewProps> = ({ onBack, onEdit, carrier }) => {
  const [activeTab, setActiveTab] = useState<'vision360' | 'details' | 'freight-rates'>('vision360');
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const formatCurrency = (value: string) => {
    if (!value) return 'Não informado';
    const numericValue = parseInt(value);
    return (numericValue / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatPercentage = (value: string) => {
    if (!value) return 'Não informado';
    return `${value}%`;
  };

  // Mock data for location names
  const getLocationName = (type: 'pais' | 'estado' | 'cidade', id: string) => {
    const locations = {
      pais: { '1': 'Brasil' },
      estado: {
        '1': 'São Paulo',
        '2': 'Rio de Janeiro',
        '3': 'Minas Gerais',
        '4': 'Rio Grande do Sul',
        '5': 'Paraná',
        '6': 'Bahia',
        '7': 'Santa Catarina',
        '8': 'Goiás',
        '9': 'Pernambuco',
        '10': 'Ceará'
      },
      cidade: {
        '1': 'São Paulo',
        '2': 'Campinas',
        '3': 'Santos',
        '4': 'Rio de Janeiro',
        '5': 'Niterói',
        '6': 'Belo Horizonte',
        '7': 'Uberlândia',
        '8': 'Porto Alegre',
        '9': 'Caxias do Sul',
        '10': 'Curitiba',
        '11': 'Brasília'
      }
    };

    return locations[type][id as keyof typeof locations[typeof type]] || 'Não informado';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visualizar Transportador</h1>
            <p className="text-gray-600 dark:text-gray-400">Detalhes completos do transportador</p>
          </div>
          <button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Edit size={20} />
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('vision360')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'vision360'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Eye size={16} />
                <span>Visão 360</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Truck size={16} />
                <span>Dados do Transportador</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('freight-rates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'freight-rates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <span>Tabelas de Frete</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'vision360' ? (
        <CarrierVision360 carrierId={carrier.id} carrierName={carrier.razao_social} />
      ) : activeTab === 'details' ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                {carrier.logotipo ? (
                  <img
                    src={carrier.logotipo}
                    alt={`Logo ${carrier.name}`}
                    className="w-24 h-24 object-contain border border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Logo</span>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{carrier.name}</h2>
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium px-2.5 py-0.5 rounded">
                    {carrier.codigo}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  {renderStars(carrier.rating)}
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">({carrier.rating})</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Razão Social</p>
                    <p className="font-medium text-gray-900 dark:text-white">{carrier.razaoSocial || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nome Fantasia</p>
                    <p className="font-medium text-gray-900 dark:text-white">{carrier.fantasia || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CNPJ</p>
                    <p className="font-medium text-gray-900 dark:text-white">{carrier.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <span className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${carrier.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    `}>
                      {carrier.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="text-center">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">{carrier.activeShipments}</p>
                  <p className="text-sm text-blue-700">Entregas Ativas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">E-mail</p>
                    <p className="font-medium text-gray-900 dark:text-white">{carrier.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Telefone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{carrier.phone || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Localização</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Globe className="text-purple-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">País</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getLocationName('pais', carrier.pais)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Building className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getLocationName('estado', carrier.estado)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="text-red-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cidade</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getLocationName('cidade', carrier.cidade)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tolerance Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configurações de Tolerância</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* CT-e Tolerances */}
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">CT-e</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tolerância de Valor</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(carrier.toleranciaValorCte)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tolerância de Percentual</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatPercentage(carrier.toleranciaPercentualCte)}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Tolerances */}
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Fatura</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tolerância de Valor</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(carrier.toleranciaValorFatura)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tolerância de Percentual</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatPercentage(carrier.toleranciaPercentualFatura)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transport Modals */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Modais de Transporte</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border-2 ${carrier.modal_rodoviario ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  {carrier.modal_rodoviario ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <Circle className="text-gray-400" size={24} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Rodoviário</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {carrier.modal_rodoviario ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${carrier.modal_aereo ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  {carrier.modal_aereo ? (
                    <CheckCircle className="text-blue-600" size={24} />
                  ) : (
                    <Circle className="text-gray-400" size={24} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Aéreo</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {carrier.modal_aereo ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${carrier.modal_aquaviario ? 'border-cyan-500 bg-cyan-50' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  {carrier.modal_aquaviario ? (
                    <CheckCircle className="text-cyan-600" size={24} />
                  ) : (
                    <Circle className="text-gray-400" size={24} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Aquaviário</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {carrier.modal_aquaviario ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${carrier.modal_ferroviario ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  {carrier.modal_ferroviario ? (
                    <CheckCircle className="text-orange-600" size={24} />
                  ) : (
                    <Circle className="text-gray-400" size={24} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Ferroviário</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {carrier.modal_ferroviario ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Métricas de Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{carrier.rating}</p>
                <p className="text-sm text-blue-700">Avaliação Média</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{carrier.activeShipments}</p>
                <p className="text-sm text-green-700">Entregas Ativas</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">98.5%</p>
                <p className="text-sm text-purple-700">Taxa de Entrega</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <FreightRateTablesList carrierId={carrier.id} carrierName={carrier.name} />
      )}
    </div>
  );
};