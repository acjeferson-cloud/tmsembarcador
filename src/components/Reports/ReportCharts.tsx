import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportChartsProps {
  reportId: string;
  data: Record<string, any>[];
}

export const ReportCharts: React.FC<ReportChartsProps> = ({ reportId, data }) => {
  // Process data for charts based on report type
  const getChartData = () => {
    switch (reportId) {
      case 'carrier-efficiency':
        return processCarrierEfficiencyData();
      case 'cte-audit':
        return processCteAuditData();
      case 'deliveries-occurrences':
        return processDeliveriesOccurrencesData();
      case 'rejection-history':
        return processRejectionHistoryData();
      default:
        return { barData: [], pieData: [] };
    }
  };

  // Process data for carrier efficiency report
  const processCarrierEfficiencyData = () => {
    // Group by carrier and calculate averages
    const carrierData: Record<string, any> = {};
    
    data.forEach(row => {
      const carrier = row['Transportador'];
      if (!carrierData[carrier]) {
        carrierData[carrier] = {
          name: carrier,
          aprovados: parseFloat(row['% de CT-es aprovados sem divergência'].replace('%', '')),
          ocorrencias: parseFloat(row['% de entregas com ocorrências críticas'].replace('%', '')),
          prazo: parseFloat(row['% de notas atendidas no prazo (SLA de entrega)'].replace('%', '')),
          rejeicao: parseFloat(row['Taxa de rejeição de faturas'].replace('%', ''))
        };
      }
    });
    
    const barData = Object.values(carrierData);
    
    // Calculate overall performance for pie chart
    const pieData = barData.map(item => ({
      name: item.name,
      value: (item.aprovados + item.prazo - item.ocorrencias - item.rejeicao) / 2 // Simple performance score
    }));
    
    return { barData, pieData };
  };

  // Process data for CT-e audit report
  const processCteAuditData = () => {
    // Count status distribution
    const statusCounts: Record<string, number> = {};
    
    data.forEach(row => {
      const status = row['Status da auditoria'];
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    
    // Group by transportador for bar chart
    const transportadorData: Record<string, any> = {};
    
    data.forEach(row => {
      const transportador = row['Transportador'];
      const status = row['Status da auditoria'];
      
      if (!transportadorData[transportador]) {
        transportadorData[transportador] = {
          name: transportador,
          Aprovado: 0,
          Reprovado: 0,
          'Dentro da Tolerância': 0
        };
      }
      
      transportadorData[transportador][status]++;
    });
    
    const barData = Object.values(transportadorData);
    
    return { barData, pieData };
  };

  // Process data for deliveries occurrences report
  const processDeliveriesOccurrencesData = () => {
    // Count occurrences by type
    const occurrenceCounts: Record<string, number> = {};
    
    data.forEach(row => {
      const description = row['Descrição'];
      occurrenceCounts[description] = (occurrenceCounts[description] || 0) + 1;
    });
    
    // Take top 5 occurrences for pie chart
    const pieData = Object.entries(occurrenceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
    
    // Group by transportador and status for bar chart
    const transportadorData: Record<string, any> = {};
    
    data.forEach(row => {
      const transportador = row['Transportador'];
      const status = row['Status final da entrega'];
      
      if (!transportadorData[transportador]) {
        transportadorData[transportador] = {
          name: transportador,
          Entregue: 0,
          Pendente: 0,
          Devolvido: 0
        };
      }
      
      transportadorData[transportador][status]++;
    });
    
    const barData = Object.values(transportadorData);
    
    return { barData, pieData };
  };

  // Process data for rejection history report
  const processRejectionHistoryData = () => {
    // Count rejections by reason
    const reasonCounts: Record<string, number> = {};
    
    data.forEach(row => {
      const reason = row['Motivo da reprovação'];
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    
    // Take top 5 reasons for pie chart
    const pieData = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
    
    // Group by document type and transportador for bar chart
    const transportadorData: Record<string, any> = {};
    
    data.forEach(row => {
      const transportador = row['Transportador'];
      const docType = row['Tipo de documento'];
      
      if (!transportadorData[transportador]) {
        transportadorData[transportador] = {
          name: transportador,
          'CT-e': 0,
          'Fatura': 0
        };
      }
      
      transportadorData[transportador][docType]++;
    });
    
    const barData = Object.values(transportadorData);
    
    return { barData, pieData };
  };

  const { barData, pieData } = getChartData();
  
  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Get chart title based on report type
  const getChartTitle = () => {
    switch (reportId) {
      case 'carrier-efficiency':
        return {
          bar: 'Indicadores de Performance por Transportador',
          pie: 'Performance Geral dos Transportadores'
        };
      case 'cte-audit':
        return {
          bar: 'Distribuição de Status por Transportador',
          pie: 'Distribuição Geral de Status'
        };
      case 'deliveries-occurrences':
        return {
          bar: 'Status de Entrega por Transportador',
          pie: 'Top 5 Ocorrências'
        };
      case 'rejection-history':
        return {
          bar: 'Rejeições por Transportador',
          pie: 'Top 5 Motivos de Rejeição'
        };
      default:
        return { bar: 'Gráfico de Barras', pie: 'Gráfico de Pizza' };
    }
  };

  const chartTitles = getChartTitle();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{chartTitles.bar}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Legend />
                {reportId === 'carrier-efficiency' && (
                  <>
                    <Bar dataKey="aprovados" name="% Aprovados" fill="#3B82F6" />
                    <Bar dataKey="prazo" name="% No Prazo" fill="#10B981" />
                    <Bar dataKey="ocorrencias" name="% Ocorrências" fill="#F59E0B" />
                    <Bar dataKey="rejeicao" name="% Rejeição" fill="#EF4444" />
                  </>
                )}
                {reportId === 'cte-audit' && (
                  <>
                    <Bar dataKey="Aprovado" fill="#10B981" />
                    <Bar dataKey="Reprovado" fill="#EF4444" />
                    <Bar dataKey="Dentro da Tolerância" fill="#F59E0B" />
                  </>
                )}
                {reportId === 'deliveries-occurrences' && (
                  <>
                    <Bar dataKey="Entregue" fill="#10B981" />
                    <Bar dataKey="Pendente" fill="#F59E0B" />
                    <Bar dataKey="Devolvido" fill="#EF4444" />
                  </>
                )}
                {reportId === 'rejection-history' && (
                  <>
                    <Bar dataKey="CT-e" fill="#3B82F6" />
                    <Bar dataKey="Fatura" fill="#8B5CF6" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{chartTitles.pie}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Valor']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resumo Estatístico</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reportId === 'carrier-efficiency' && (
            <>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">Média de Aprovação</p>
                <p className="text-xl font-bold text-blue-600">
                  {(barData.reduce((sum, item) => sum + item.aprovados, 0) / barData.length).toFixed(2)}%
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="text-sm text-green-800 font-medium">Média de Pontualidade</p>
                <p className="text-xl font-bold text-green-600">
                  {(barData.reduce((sum, item) => sum + item.prazo, 0) / barData.length).toFixed(2)}%
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <p className="text-sm text-yellow-800 font-medium">Média de Ocorrências</p>
                <p className="text-xl font-bold text-yellow-600">
                  {(barData.reduce((sum, item) => sum + item.ocorrencias, 0) / barData.length).toFixed(2)}%
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-sm text-red-800 font-medium">Média de Rejeição</p>
                <p className="text-xl font-bold text-red-600">
                  {(barData.reduce((sum, item) => sum + item.rejeicao, 0) / barData.length).toFixed(2)}%
                </p>
              </div>
            </>
          )}
          
          {reportId === 'cte-audit' && (
            <>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="text-sm text-green-800 font-medium">Total Aprovados</p>
                <p className="text-xl font-bold text-green-600">
                  {pieData.find(item => item.name === 'Aprovado')?.value || 0}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-sm text-red-800 font-medium">Total Reprovados</p>
                <p className="text-xl font-bold text-red-600">
                  {pieData.find(item => item.name === 'Reprovado')?.value || 0}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <p className="text-sm text-yellow-800 font-medium">Dentro da Tolerância</p>
                <p className="text-xl font-bold text-yellow-600">
                  {pieData.find(item => item.name === 'Dentro da Tolerância')?.value || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">Taxa de Aprovação</p>
                <p className="text-xl font-bold text-blue-600">
                  {(((pieData.find(item => item.name === 'Aprovado')?.value || 0) / data.length) * 100).toFixed(2)}%
                </p>
              </div>
            </>
          )}
          
          {reportId === 'deliveries-occurrences' && (
            <>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="text-sm text-green-800 font-medium">Total Entregues</p>
                <p className="text-xl font-bold text-green-600">
                  {data.filter(item => item['Status final da entrega'] === 'Entregue').length}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <p className="text-sm text-yellow-800 font-medium">Total Pendentes</p>
                <p className="text-xl font-bold text-yellow-600">
                  {data.filter(item => item['Status final da entrega'] === 'Pendente').length}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-sm text-red-800 font-medium">Total Devolvidos</p>
                <p className="text-xl font-bold text-red-600">
                  {data.filter(item => item['Status final da entrega'] === 'Devolvido').length}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">Taxa de Sucesso</p>
                <p className="text-xl font-bold text-blue-600">
                  {((data.filter(item => item['Status final da entrega'] === 'Entregue').length / data.length) * 100).toFixed(2)}%
                </p>
              </div>
            </>
          )}

          {reportId === 'rejection-history' && (
            <>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-sm text-red-800 font-medium">Total Rejeições</p>
                <p className="text-xl font-bold text-red-600">
                  {data.length}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">CT-es Rejeitados</p>
                <p className="text-xl font-bold text-blue-600">
                  {data.filter(item => item['Tipo de documento'] === 'CT-e').length}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-800 font-medium">Faturas Rejeitadas</p>
                <p className="text-xl font-bold text-purple-600">
                  {data.filter(item => item['Tipo de documento'] === 'Fatura').length}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <p className="text-sm text-orange-800 font-medium">Valor Total Rejeitado</p>
                <p className="text-xl font-bold text-orange-600">
                  {data.reduce((sum, item) => sum + parseFloat(item['Valor envolvido']), 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};