import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Package, Weight, CheckCircle, AlertCircle, Truck, FileText, MapPin } from 'lucide-react';
import { pickupSchedulingService, PickupSchedulingWithInvoices } from '../../services/pickupSchedulingService';

export const PublicPickupScheduling: React.FC = () => {
  const [scheduling, setScheduling] = useState<PickupSchedulingWithInvoices | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    carrier_notes: ''
  });

  useEffect(() => {
    loadScheduling();
  }, []);

  const loadScheduling = async () => {
    try {
      const pathParts = window.location.pathname.split('/');
      const token = pathParts[pathParts.length - 1];

      if (!token) {
        setError('Link inválido');
        setIsLoading(false);
        return;
      }

      const result = await pickupSchedulingService.getSchedulingByToken(token);

      if (result.success && result.data) {
        setScheduling(result.data);

        if (result.data.status === 'scheduled') {
          setSuccess(true);
          setFormData({
            scheduled_date: result.data.scheduled_date || '',
            scheduled_time: result.data.scheduled_time || '',
            carrier_notes: result.data.carrier_notes || ''
          });
        }
      } else {
        setError(result.error || 'Agendamento não encontrado');
      }
    } catch (err: any) {
      setError('Erro ao carregar agendamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.scheduled_date || !formData.scheduled_time) {
      setError('Data e hora são obrigatórios');
      return;
    }

    const now = new Date();
    const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);

    if (scheduledDateTime < now) {
      setError('Data e hora não podem ser retroativas');
      return;
    }

    if (!scheduling) return;

    setIsSubmitting(true);

    try {
      const result = await pickupSchedulingService.updateScheduling(scheduling.token, formData);

      if (result.success) {
        setSuccess(true);
        setScheduling({ ...scheduling, status: 'scheduled', ...formData });
      } else {
        setError(result.error || 'Erro ao confirmar agendamento');
      }
    } catch (err: any) {
      setError('Erro ao processar agendamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando agendamento...</p>
        </div>
      </div>
    );
  }

  if (error && !scheduling) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Link Inválido ou Expirado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (success && scheduling) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-2xl w-full">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
            Agendamento Confirmado!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            Obrigado por confirmar o agendamento. O embarcador foi notificado.
          </p>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data da Coleta</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(formData.scheduled_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Horário da Coleta</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formData.scheduled_time}
                </p>
              </div>
            </div>
            {formData.carrier_notes && (
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Observações</p>
                  <p className="text-gray-900 dark:text-white">{formData.carrier_notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Resumo:</strong> {scheduling.invoices?.length || 0} nota(s) fiscal(is) •
              Peso Total: {scheduling.total_weight?.toFixed(2) || 0} kg •
              Volumes: {scheduling.total_volumes || 0}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!scheduling) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center space-x-3">
              <Truck className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Agendamento de Coleta</h1>
                <p className="text-blue-100">Confirme a data e horário para realizar a coleta</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                Resumo do Agendamento
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600">Volumes</p>
                    <p className="text-lg font-bold text-blue-900">
                      {scheduling.total_volumes || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Weight className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600">Peso Total</p>
                    <p className="text-lg font-bold text-blue-900">
                      {scheduling.total_weight?.toFixed(2) || 0} kg
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600">Notas Fiscais</p>
                    <p className="text-lg font-bold text-blue-900">
                      {scheduling.invoices?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notas Fiscais para Coleta</h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        Número NF-e
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        Destinatário
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        Peso (kg)
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        Volumes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {scheduling.invoices?.map((invoice: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50 dark:bg-gray-900">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {invoice.numero_nfe}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {invoice.destinatario_nome}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                          {parseFloat(invoice.peso_bruto || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                          {invoice.quantidade_volumes || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 border-t pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white">Informar Data e Horário da Coleta</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data da Coleta *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Horário da Coleta *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={formData.scheduled_time}
                      onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.carrier_notes}
                  onChange={(e) => setFormData({ ...formData, carrier_notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Informações adicionais sobre a coleta..."
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                <CheckCircle size={24} />
                <span>{isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}</span>
              </button>
            </form>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Link válido até: {new Date(scheduling.expires_at).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
};
