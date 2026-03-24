import React, { useState } from 'react';
import { X, Calendar, Clock, Image as ImageIcon, CheckCircle, FileText, User, Truck } from 'lucide-react';

interface ViewOccurrencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export const ViewOccurrencesModal: React.FC<ViewOccurrencesModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const occurrences = invoice?.metadata?.occurrences || [];
  const deliveryProof = invoice?.metadata?.delivery_proof || null;

  const sortedOccurrences = [...occurrences].sort((a, b) => 
    new Date(b.data_ocorrencia).getTime() - new Date(a.data_ocorrencia).getTime()
  );

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ocorrências da Nota</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">NF-e: {invoice?.numero}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors bg-gray-100 dark:bg-gray-700 p-2 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Delivery Proof Section */}
            {deliveryProof && (
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-5 mb-6">
                <h3 className="text-lg font-bold text-green-800 dark:text-green-400 mb-4 flex items-center gap-2">
                  <CheckCircle size={22} />
                  Comprovante de Entrega Vinculado
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <User size={18} className="text-gray-400" />
                    <span className="text-sm">
                      <strong className="text-gray-900 dark:text-white">Recebedor:</strong> {deliveryProof.receiver_name} {deliveryProof.receiver_document ? `(${deliveryProof.receiver_document})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Calendar size={18} className="text-gray-400" />
                    <span className="text-sm">
                      <strong className="text-gray-900 dark:text-white">Data:</strong> {formatDate(deliveryProof.delivered_at)} às {formatTime(deliveryProof.delivered_at)}
                    </span>
                  </div>
                  {(deliveryProof.driver_name || deliveryProof.vehicle_plate) && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 md:col-span-2">
                      <Truck size={18} className="text-gray-400" />
                      <span className="text-sm">
                        <strong className="text-gray-900 dark:text-white">Motorista/Veículo:</strong> {deliveryProof.driver_name || '-'} {deliveryProof.vehicle_plate ? `[${deliveryProof.vehicle_plate}]` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {deliveryProof.observations && (
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    <strong className="block text-gray-900 dark:text-gray-200 mb-1">Observações:</strong>
                    {deliveryProof.observations}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-2">
                  {deliveryProof.signature_url && (
                    <button 
                      onClick={() => setZoomedImage(deliveryProof.signature_url!)}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-green-100 dark:hover:bg-gray-700 transition"
                    >
                      Ver Assinatura
                    </button>
                  )}
                  {deliveryProof.photo_1_url && (
                    <button 
                      onClick={() => setZoomedImage(deliveryProof.photo_1_url!)}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <ImageIcon size={16} /> Foto 1
                    </button>
                  )}
                  {deliveryProof.photo_2_url && (
                    <button 
                      onClick={() => setZoomedImage(deliveryProof.photo_2_url!)}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <ImageIcon size={16} /> Foto 2
                    </button>
                  )}
                  {deliveryProof.photo_3_url && (
                    <button 
                      onClick={() => setZoomedImage(deliveryProof.photo_3_url!)}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <ImageIcon size={16} /> Foto 3
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* List of Occurrences */}
            {sortedOccurrences.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">Nenhuma ocorrência registrada para esta nota fiscal.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Histórico de Lançamentos</h3>
                {sortedOccurrences.map((occ: any, i: number) => (
                  <div key={occ.id || i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="inline-block px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs font-bold rounded-full mb-2">
                          CÓD: {occ.codigo}
                        </span>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{occ.descricao}</h4>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm gap-1">
                          <Calendar size={14} />
                          {formatDate(occ.data_ocorrencia)}
                        </div>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm gap-1 justify-end">
                          <Clock size={14} />
                          {formatTime(occ.data_ocorrencia)}
                        </div>
                      </div>
                    </div>
                    
                    {occ.foto_url && (
                      <div className="mt-3">
                        <button 
                          onClick={() => setZoomedImage(occ.foto_url)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          <ImageIcon size={16} /> Ver Foto Anexa
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end sticky bottom-0">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {zoomedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[90] p-4" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:bg-gray-700"
            >
              <X size={24} />
            </button>
            <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain" />
          </div>
        </div>
      )}
    </>
  );
};
