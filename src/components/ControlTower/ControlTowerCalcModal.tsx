import React from 'react';
import { Info, X, Zap, Map, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlTowerCalcModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            Como os indicadores são calculados?
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* Executive KPIs */}
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h4 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
              <Zap className="w-5 h-5 text-blue-600" />
              Super KPIs Executivos
            </h4>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Custo de Frete sobre Vendas (CFV)</p>
                <p className="text-sm">É a métrica mãe do embarcador. Representa o percentual do faturamento que está sendo gasto com transporte. Calculado como: (Total de Frete Pago / Total Faturado nas NFs * 100).</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Share de Frete (Spot vs. Contrato)</p>
                <p className="text-sm">Mede a proporção do frete que foi negociada via tabelas fixas (Contrato Standadrd) comparado ao frete alocado no mercado livre de transportes (Spot).</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Custo Médio por KG</p>
                <p className="text-sm">Indica a eficiência logística dividindo o total gasto em Fretes pelo total de peso (Kg) das mercadorias trafegadas. Essencial para monitorar inflação nos custos unitários logísticos.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Entregas no Prazo (OTIF Diário)</p>
                <p className="text-sm">Mede a saúde operacional da empresa através da confiabilidade das entregas. Relaciona a quantidade de mercadorias entregues dentro do prazo sobre o total de entregas efetuadas no período.</p>
              </div>
            </div>
          </div>

          {/* Operational View */}
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h4 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
              <Map className="w-5 h-5 text-orange-600" />
              Visão Geográfica
            </h4>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Central GeoVision (Mapa)</p>
                <p className="text-sm">Agrupa as posições geográficas em tempo real de toda a sua frota ou ocorrências logísticas usando inteligência de sub-redes (Clustering) fornecendo uma visão macro e micro do tracking sem sobrecarregar sua tela.</p>
              </div>
            </div>
          </div>

          {/* Side Panels */}
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h4 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
              <Radio className="w-5 h-5 text-indigo-600" />
              Saúde da Esteira Operacional
            </h4>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Radar de Anomalias (Resumo 24h)</p>
                <p className="text-sm">Consolida todos os incidentes logísticos ativos no dia de forma visual. Acompanha Devoluções de mercadoria, Atrasos reportados pela base e Sinistros graves, mantendo o foco no tratamento das anomalias críticas (By-Exception).</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Projeções do Dia (Funil SLA)</p>
                <p className="text-sm">Um gráfico de funil que cruza a volumetria de demandas de entrega daquele dia contra o que já foi finalizado. Mostra rapidamente se a operação vai deixar pendências de SLA para o dia seguinte (previsto x entregue x em rota x atrasado).</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Carrossel de Notícias Corporativas</p>
                <p className="text-sm">Motor que varre os principais portais logísticos em busca das pautas de mercado mais recentes (limite de 15 dias) auxiliando no radar executivo (cotações, greves em modais, tendências econômicas).</p>
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            {t('common.understood') || 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
};
