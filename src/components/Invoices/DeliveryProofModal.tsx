import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Camera, Trash2, ZoomIn, FileText, Info, MessageSquare, Scale, Image as ImageIcon, PenTool, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { SignatureCanvas } from '../common/SignatureCanvas';
import { deliveryProofService, DeliveryProof } from '../../services/deliveryProofService';

interface DeliveryProofModalProps {
  invoiceId: string;
  invoiceNumber: string;
  carrierName?: string;
  onClose: () => void;
  onSuccess: (proofData?: any) => void;
  userId: number;
}

export const DeliveryProofModal: React.FC<DeliveryProofModalProps> = ({
  invoiceId,
  invoiceNumber,
  carrierName,
  onClose,
  onSuccess,
  userId
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'details' | 'observations' | 'legal' | 'photos' | 'signature'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [existingProof, setExistingProof] = useState<DeliveryProof | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverDocument, setReceiverDocument] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [observations, setObservations] = useState('');
  const [photo1, setPhoto1] = useState<string>('');
  const [photo2, setPhoto2] = useState<string>('');
  const [photo3, setPhoto3] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [signatureDate, setSignatureDate] = useState<string>('');
  const [legalTermsAccepted, setLegalTermsAccepted] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    loadProof();
  }, [invoiceId]);

  const loadProof = async () => {
    setIsLoading(true);
    try {
      const proof = await deliveryProofService.getByInvoiceId(invoiceId);
      if (proof) {
        setExistingProof(proof);
        setReceiverName(proof.receiver_name || '');
        setReceiverDocument(proof.receiver_document || '');
        setDriverName(proof.driver_name || '');
        setVehiclePlate(proof.vehicle_plate || '');
        setObservations(proof.observations || '');
        setPhoto1(proof.photo_1_url || '');
        setPhoto2(proof.photo_2_url || '');
        setPhoto3(proof.photo_3_url || '');
        setSignature(proof.signature_url || '');
        setSignatureDate(proof.signature_date || '');
        setLegalTermsAccepted(proof.legal_terms_accepted || false);
      }
    } catch (err) {
// null
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (photoNumber: 1 | 2 | 3, file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Formato de imagem inválido. Use JPG ou PNG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A foto não pode ter mais que 5MB.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await deliveryProofService.uploadPhoto(invoiceId, file, photoNumber);

      if (result.success && result.url) {
        if (photoNumber === 1) setPhoto1(result.url);
        if (photoNumber === 2) setPhoto2(result.url);
        if (photoNumber === 3) setPhoto3(result.url);

        setSuccess('Foto adicionada com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Erro ao subir a foto.');
      }
    } catch (err) {
// null
      setError('Erro no upload.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoDelete = async (photoNumber: 1 | 2 | 3, url: string) => {
    if (!confirm('Tem certeza que deseja remover esta foto?')) return;

    setIsLoading(true);
    try {
      await deliveryProofService.deletePhoto(url);

      if (photoNumber === 1) setPhoto1('');
      if (photoNumber === 2) setPhoto2('');
      if (photoNumber === 3) setPhoto3('');

      setSuccess('Foto removida!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao remover a foto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignatureSave = async (signatureDataURL: string) => {
    setIsLoading(true);
    setError('');

    try {
      const blob = deliveryProofService.dataURLtoBlob(signatureDataURL);
      const result = await deliveryProofService.uploadSignature(invoiceId, blob);

      if (result.success && result.url) {
        setSignature(result.url);
        setSignatureDate(new Date().toISOString());
        setSuccess('Assinatura gravada com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Erro ao salvar a assinatura.');
      }
    } catch (err) {
      setError('Erro ao salvar assinatura.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');

    if (!receiverName) {
      setError('O nome de quem recebeu a entrega é obrigatório.');
      setActiveTab('legal');
      return;
    }

    if (!legalTermsAccepted) {
      setError('Você deve confirmar que o recebedor declara ser o titular ou porta-voz legal para o recebimento.');
      setActiveTab('legal');
      return;
    }

    setIsSaving(true);

    try {
      const proofData: Partial<DeliveryProof> = {
        invoice_id: invoiceId,
        delivered_at: existingProof?.delivered_at || new Date().toISOString(),
        receiver_name: receiverName.trim(),
        receiver_document: receiverDocument.trim() || undefined,
        driver_name: driverName.trim() || undefined,
        vehicle_plate: vehiclePlate.trim() || undefined,
        observations: observations.trim() || undefined,
        photo_1_url: photo1 || undefined,
        photo_2_url: photo2 || undefined,
        photo_3_url: photo3 || undefined,
        signature_url: signature || undefined,
        signature_date: signatureDate || undefined,
        legal_terms_accepted: legalTermsAccepted,
        created_by: userId
      };

      const result = await deliveryProofService.saveProof(invoiceId, proofData);

      if (result.success) {
        const actionMsg = existingProof ? 'Comprovante atualizado com sucesso!' : 'Comprovante salvo com sucesso!';
        setSuccess(actionMsg);

        onSuccess(proofData);
      } else {
        setError(result.error || 'Erro ao salvar o comprovante.');
      }
    } catch (err) {
// null
      setError('Falha ao salvar o documento de entrega.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPhotoCard = (photoUrl: string, photoNumber: 1 | 2 | 3) => {
    if (photoUrl) {
      return (
        <div key={photoUrl} className="relative group">
          <img
            src={photoUrl}
            alt={`Foto ${photoNumber}`}
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2">
            <button
              onClick={() => setZoomedImage(photoUrl)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:bg-gray-700"
            >
              <ZoomIn size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => handlePhotoDelete(photoNumber, photoUrl)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500 rounded-full hover:bg-red-600"
            >
              <Trash2 size={20} className="text-white" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <label className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhotoUpload(photoNumber, file);
          }}
          className="hidden"
        />
        <Camera className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Adicionar Foto {photoNumber}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Tirar foto ou galeria</p>
      </label>
    );
  };

  if (zoomedImage) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setZoomedImage(null)}>
        <div className="relative max-w-4xl w-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl shadow-2xl p-4 w-full flex items-center justify-center overflow-hidden">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors backdrop-blur-md"
            >
              <X size={24} />
            </button>
            <img 
              src={zoomedImage} 
              alt="Comprovante" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-sm"
              style={{ backgroundColor: 'white' }} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[90] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Comprovante de Entrega
              </h2>
              {existingProof && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                  Preenchido
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Nota Fiscal: {invoiceNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Alerts */}
        {(error || success) && (
          <div className="px-6 pt-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Info size={18} />
            Detalhes
          </button>
          <button
            onClick={() => setActiveTab('observations')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'observations'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <MessageSquare size={18} />
            Observações
          </button>
          <button
            onClick={() => setActiveTab('legal')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'legal'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Scale size={18} />
            Info de Recebimento
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'photos'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <ImageIcon size={18} />
            Fotos ({[photo1, photo2, photo3].filter(p => p).length}/3)
          </button>
          <button
            onClick={() => setActiveTab('signature')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'signature'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <PenTool size={18} />
            Assinatura {signature && '✓'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Aba: Detalhes */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                Detalhes da Entrega
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nota Fiscal
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transportador Logístico
                  </label>
                  <input
                    type="text"
                    value={carrierName || '-'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motorista Entregador
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Nome do motorista que fez a entrega"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Placa do Veículo
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="Ex: ABC-1234"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aba: Observações */}
          {activeTab === 'observations' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                Observações Opcionais
              </h3>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: Mercadoria entregue com caixa levemente rasgada, mas sem danos ao produto interno..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>
          )}

          {/* Aba: Informações Legais */}
          {activeTab === 'legal' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                Recebedor da Mercadoria
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo do Recebedor*
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Nome de quem assinou"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documento (RG/CPF)
                </label>
                <input
                  type="text"
                  value={receiverDocument}
                  onChange={(e) => setReceiverDocument(e.target.value)}
                  placeholder="Documento válido"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={legalTermsAccepted}
                    onChange={(e) => setLegalTermsAccepted(e.target.checked)}
                    className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Declaração de Validade
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Declaro que as informações preenchidas são verdadeiras e que a mercadoria foi entregue em integridade e conformidade.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Aba: Fotos */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                Fotos do Comprovante (Canhoto)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderPhotoCard(photo1, 1)}
                {renderPhotoCard(photo2, 2)}
                {renderPhotoCard(photo3, 3)}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Dica: Tire a foto num local iluminado e enquadre bem o canhoto assinado para facilitar auditorias e faturamento.
                </p>
              </div>
            </div>
          )}

          {/* Aba: Assinatura */}
          {activeTab === 'signature' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                Assinatura Digital (Canvas)
              </h3>

              {signature ? (
                <div className="space-y-4">
                  <div className="border-2 border-green-500 dark:border-green-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <img src={signature} alt="Assinatura" className="w-full h-64 object-contain" />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle size={16} />
                      Feita em: {signatureDate ? new Date(signatureDate).toLocaleString() : '-'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Quer refazer a assinatura?")) {
                          setSignature('');
                          setSignatureDate('');
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 underline"
                    >
                      Refazer
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <SignatureCanvas
                    onSave={handleSignatureSave}
                    existingSignature={signature}
                  />
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      Entregue o celular/tablet ao recebedor para rubricar na tela! Isso tem o mesmo valor de reconhecimento para o TMS.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Concluir Comprovante
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
