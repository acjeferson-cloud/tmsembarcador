import React, { useState } from 'react';
import { ArrowLeft, Edit, Trash2, Plus, DollarSign, MapPin, User, Package, Clock, Info, Map } from 'lucide-react';
import { FreightRate } from '../../data/freightRatesData';
import { FreightRateForm } from './FreightRateForm';
import { FreightRateCitiesModal } from './FreightRateCitiesModal';

interface FreightRateViewProps {
  onBack: () => void;
  onEdit: (rate: FreightRate) => void;
  onDelete: (rateId: number) => void;
  rate: FreightRate;
  tableId: number;
}

export const FreightRateView: React.FC<FreightRateViewProps> = ({
  onBack,
  onEdit,
  onDelete,
  rate,
  tableId
}) => {
  const [showCitiesModal, setShowCitiesModal] = useState(false);

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getTipoAplicacaoLabel = (tipo: string) => {
    switch (tipo) {
      case 'cidade': return 'Por Cidade';
      case 'cliente': return 'Por Cliente';
      case 'produto': return 'Por Produto';
      default: return tipo;
    }
  };

  const getTipoAplicacaoIcon = (tipo: string) => {
    switch (tipo) {
      case 'cidade': return <MapPin size={24} className="text-blue-600" />;
      case 'cliente': return <User size={24} className="text-green-600" />;
      case 'produto': return <Package size={24} className="text-purple-600" />;
      default: return <DollarSign size={24} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const handleDeleteClick = () => {
    if (window.confirm('Tem certeza que deseja excluir esta tarifa?')) {
      onDelete(rate.id);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar para Tarifas</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visualizar Tarifa</h1>
            <p className="text-gray-600 dark:text-gray-400">Detalhes completos da tarifa</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onEdit(rate)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit size={20} />
              <span>Editar</span>
            </button>
            <button
              onClick={() => setShowCitiesModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Map size={20} />
              <span>Cidades</span>
            </button>
            <button
              onClick={handleDeleteClick}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Trash2 size={20} />
              <span>Excluir</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                {getTipoAplicacaoIcon(rate.tipoAplicacao)}
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{rate.descricao}</h2>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-2.5 py-0.5 rounded">
                  Código: {rate.codigo}
                </span>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{getTipoAplicacaoLabel(rate.tipoAplicacao)}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Valor</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(rate.valor)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Prazo de Entrega</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {rate.prazoEntrega} {rate.prazoEntrega === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Type Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detalhes de Aplicação</h3>
          
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="flex items-start space-x-3">
              {getTipoAplicacaoIcon(rate.tipoAplicacao)}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">{getTipoAplicacaoLabel(rate.tipoAplicacao)}</h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {rate.tipoAplicacao === 'cidade' && 'Esta tarifa é aplicada com base na cidade de origem e destino.'}
                  {rate.tipoAplicacao === 'cliente' && 'Esta tarifa é aplicada com base no cliente específico.'}
                  {rate.tipoAplicacao === 'produto' && 'Esta tarifa é aplicada com base no tipo de produto transportado.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Prazo de Entrega</h3>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Clock size={32} className="text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{rate.prazoEntrega} {rate.prazoEntrega === 1 ? 'dia' : 'dias'}</p>
              <p className="text-gray-600 dark:text-gray-400">Prazo estimado para entrega</p>
            </div>
          </div>
        </div>

        {/* Value Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Valor</h3>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign size={32} className="text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(rate.valor)}</p>
              <p className="text-gray-600 dark:text-gray-400">Valor da tarifa</p>
            </div>
          </div>
        </div>

        {/* Observations */}
        {rate.observacoes && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Observações</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">{rate.observacoes}</p>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info size={24} className="text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Sobre Tarifas</h3>
              <p className="text-blue-800 mb-4">
                As tarifas definem os valores e prazos de entrega para diferentes aplicações. Cada tarifa possui um código 
                único e pode ser aplicada por cidade, cliente ou produto.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">Valor</p>
                  <p className="text-blue-700">Custo do frete para esta aplicação</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">Prazo</p>
                  <p className="text-blue-700">Tempo estimado para entrega</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">Aplicação</p>
                  <p className="text-blue-700">Critério para aplicação da tarifa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCitiesModal && (
        <FreightRateCitiesModal
          rate={rate}
          tableId={tableId}
          onClose={() => setShowCitiesModal(false)}
          onUpdate={() => {}}
        />
      )}
    </div>
  );
};