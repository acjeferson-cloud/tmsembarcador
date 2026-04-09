import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, AlertTriangle, ArrowDownCircle, Info, ShieldCheck } from 'lucide-react';

interface AnomalyData {
  devolucoes: number;
  atrasos: number;
  sinistros: number;
}

export const AnomalyRadar: React.FC = () => {
  const { t } = useTranslation();

  // Mock initial state as requested
  const [data] = useState<AnomalyData>({
    devolucoes: 3,
    atrasos: 12,
    sinistros: 1,
  });

  const totalAnomalies = data.devolucoes + data.atrasos + data.sinistros;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-gray-700 dark:text-gray-300 w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Radar de Anomalias</h3>
        </div>
        <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">24h</span>
      </div>

      {totalAnomalies === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <ShieldCheck className="text-green-600 w-6 h-6" />
          </div>
          <p className="text-green-700 font-medium">Operação Saudável</p>
          <p className="text-xs text-gray-500 mt-1">Zero incidentes registrados hoje.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-red-100 dark:bg-red-800 flex items-center justify-center text-red-600 dark:text-red-300">
                <ArrowDownCircle size={18} />
              </div>
              <span className="text-sm font-medium text-red-900 dark:text-red-100">Devoluções</span>
            </div>
            <span className="text-lg font-bold text-red-700 dark:text-red-300">{data.devolucoes}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-orange-100 dark:bg-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-300">
                <ClockIcon size={18} />
              </div>
              <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Atrasos Reportados</span>
            </div>
            <span className="text-lg font-bold text-orange-700 dark:text-orange-300">{data.atrasos}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center text-yellow-600 dark:text-yellow-300">
                <AlertTriangle size={18} />
              </div>
              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Sinistros / Avarias</span>
            </div>
            <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{data.sinistros}</span>
          </div>
        </div>
      )}

      {totalAnomalies > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-500">
          <Info size={14} />
          <span>As anomalias aguardam resolução do SAC.</span>
        </div>
      )}
    </div>
  );
};

const ClockIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);
