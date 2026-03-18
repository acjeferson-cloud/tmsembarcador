import React from 'react';
import { Info, X, TrendingUp, Activity, Map } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardCalcModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            Como os KPIs são Calculados?
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* Aba Executiva */}
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h4 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Visão Executiva
            </h4>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Despesa de Frete (R$)</p>
                <p className="text-sm">Soma do valor total gasto em fretes durante o período filtrado.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Embarques (Pedido)</p>
                <p className="text-sm">Volume total de embarques ou pedidos únicos transportados dentro das datas de corte.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Ticket Médio (R$/Pedido)</p>
                <p className="text-sm">Cálculo da despesa de frete total dívido pela volume absoluto de embarques gerados.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">SLA (On-Time in Full)</p>
                <p className="text-sm">Percentual de entregas realizadas rigorosamente no prazo e em sua totalidade sistêmica de acordo com a meta da empresa e faturada.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Representatividade (Frete/Mercadoria)</p>
                <p className="text-sm">Percentual de custo que o frete consome relativo ao valor estipulado no documento da mercadoria movimentada.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Custo Operacional (R$/Kg)</p>
                <p className="text-sm">Desdobramento da despesa total de frete rateada em relação ao peso bruto consolidado em quilos (R$ por Kg).</p>
              </div>
               <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Custo em Divergências</p>
                <p className="text-sm">Apanhado de diferenças em reais originadas durantes as auditorias entre os cálculos previstos pela tabela (simulação) contra as cobranças efetivas das transportadoras.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Taxas Extras / Acessórias (%)</p>
                <p className="text-sm">Porcentagem gasta em incrementos ou sobretaxas que formam o montante final do frete (pedágio, emergência, TRT, etc).</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Evolução de Custos Operacionais</p>
                <p className="text-sm">Gráfico linear evidenciando a concentração e saltos da curva da Despesa do Frete por dia/período selecionado.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Share de Transportadoras</p>
                <p className="text-sm">Gráfico estipulando a divisão e fatia da representatividade financeira gasta por parceiro logístico ou transportadora atrelada.</p>
              </div>
            </div>
          </div>

          {/* Aba Operacional */}
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h4 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
              <Activity className="w-5 h-5 text-green-600" />
              Nível de Serviço
            </h4>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Lead Time Médio (Dias)</p>
                <p className="text-sm">Médiana de dias decorridos entre a aprovação do pedido e a chegada física da mercadoria no recebedor logístico.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">SLA de Coleta (Horas Atraso)</p>
                <p className="text-sm">Média de horas em déficit de atendimento de coletas na comparação da data/hora acordada e a apanha real da transportadora.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Volume em Backlog</p>
                <p className="text-sm">Total de embarques e pedidos que estão estagnados fora do processo de expedição aguardando tratativas sistêmicas, indicando carga parada no balcão de CD.</p>
              </div>
               <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Pipeline de Logística (Funil)</p>
                <p className="text-sm">Indicativo da progressão quantitativa de embarques segmentada pelas 7 grandes fases do ciclo de vida: Pedido Realizado, Pedido Faturado, Aguardando Coleta, Coletado pela Transportadora, Em Transporte, Saiu para Entrega, e Entrega Realizada.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Composição de Status</p>
                <p className="text-sm">Detalhamento visual informando em tempo real qual a fatia e o volume quantitativo que preenchem as estapas lógicas listadas na Timeline de Entregas e Macro-Funil.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Top 5 Ocorrências / Motivos de Falha</p>
                <p className="text-sm">Raio-x rankeando e filtrando as cinco métricas causais ou motivos com maior nível de indício dentro da esteira de falhas dos manifestos.</p>
              </div>
            </div>
          </div>

          {/* Aba Mapa de Custos */}
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h4 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
              <Map className="w-5 h-5 text-orange-600" />
              Mapa de Custos
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Mapa de Densidade Financeira</p>
              <p className="text-sm">Apresentação geográfica de calor. Destaca cidades e UFs (Destino) nas quais sua empresa mais aplica Despesa de Frete, projetado diretamente na interface dos servidores do Google Maps.</p>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
