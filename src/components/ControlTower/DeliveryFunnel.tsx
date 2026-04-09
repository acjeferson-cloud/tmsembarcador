import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, CheckCircle2, Truck, AlertOctagon } from 'lucide-react';

interface FunnelData {
  previstas: number;
  concluidas: number;
  emRota: number;
  atrasadas: number;
}

export const DeliveryFunnel: React.FC = () => {
  const { t } = useTranslation();

  // Mock initial state as requested
  const [data] = useState<FunnelData>({
    previstas: 150,
    concluidas: 120,
    emRota: 25,
    atrasadas: 5
  });

  const getPercent = (value: number) => {
    if (data.previstas === 0) return 0;
    return Math.round((value / data.previstas) * 100);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
      <div className="flex flex-col mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>Projeções do Dia</span>
        </h3>
        <p className="text-xs text-gray-500">Funil de Nível de Serviço (SLA 24h)</p>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        
        {/* Previstas */}
        <div className="relative">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Target size={16} className="text-blue-500"/>
              Entregas Previstas Hoje
            </span>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{data.previstas}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Concluídas */}
        <div className="relative pl-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500"/>
              Concluídas
            </span>
            <div className="text-right">
              <span className="text-sm font-bold text-green-700 dark:text-green-300">{data.concluidas}</span>
              <span className="text-xs text-green-600/70 ml-1">({getPercent(data.concluidas)}%)</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${getPercent(data.concluidas)}%` }}></div>
          </div>
        </div>

        {/* Em Rota */}
        <div className="relative pl-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
              <Truck size={16} className="text-yellow-500"/>
              Em Rota (No Prazo)
            </span>
            <div className="text-right">
              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">{data.emRota}</span>
              <span className="text-xs text-yellow-600/70 ml-1">({getPercent(data.emRota)}%)</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: `${getPercent(data.emRota)}%` }}></div>
          </div>
        </div>

        {/* Atrasadas */}
        <div className="relative pl-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-red-900 dark:text-red-100 flex items-center gap-2">
              <AlertOctagon size={16} className="text-red-500"/>
              Atrasadas
            </span>
            <div className="text-right">
              <span className="text-sm font-bold text-red-700 dark:text-red-300">{data.atrasadas}</span>
              <span className="text-xs text-red-600/70 ml-1">({getPercent(data.atrasadas)}%)</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${getPercent(data.atrasadas)}%` }}></div>
          </div>
        </div>

      </div>
    </div>
  );
};
