import React, { useState, useEffect } from 'react';
import { X, Camera, Trash2, ZoomIn, FileText, Info, MessageSquare, Scale, Image as ImageIcon, PenTool, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { SignatureCanvas } from '../common/SignatureCanvas';
import { pickupProofService, PickupProof } from '../../services/pickupProofService';

interface PickupProofModalProps {
  pickup: any;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  userName: string;
}

export const PickupProofModal: React.FC<PickupProofModalProps> = ({
  pickup,
  onClose,
  onSuccess,
  userId,
  userName
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'observations' | 'legal' | 'photos' | 'signature'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [renderKey, setRenderKey] = useState(0);

  const [existingProof, setExistingProof] = useState<PickupProof | null>(null);
  const [collectorName, setCollectorName] = useState('');
  const [collectorDocument, setCollectorDocument] = useState('');
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
  }, [pickup.id]);

  const loadProof = async () => {
    setIsLoading(true);
    try {
      const proof = await pickupProofService.getByPickupId(pickup.id);
      if (proof) {
        console.log('📄 Comprovante existente carregado:', proof);
        setExistingProof(proof);
        setCollectorName(proof.collector_name);
        setCollectorDocument(proof.collector_document || '');
        setDriverName(proof.driver_name || pickup.driver_name || '');
        setVehiclePlate(proof.vehicle_plate || pickup.vehicle_plate || '');
        setObservations(proof.observations || '');
        setPhoto1(proof.photo_1_url || '');
        setPhoto2(proof.photo_2_url || '');
        setPhoto3(proof.photo_3_url || '');
        setSignature(proof.signature_url || '');
        setSignatureDate(proof.signature_date || '');
        setLegalTermsAccepted(proof.legal_terms_accepted);
      } else {
        console.log('📄 Nenhum comprovante existente - novo registro');
        setDriverName(pickup.driver_name || '');
        setVehiclePlate(pickup.vehicle_plate || '');
      }
    } catch (err) {
      console.error('Erro ao carregar comprovante:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (photoNumber: 1 | 2 | 3, file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB');
      return;
    }

    setIsLoading(true);
    setError('');
    console.log(`📤 Iniciando upload da foto ${photoNumber}...`);

    try {
      const result = await pickupProofService.uploadPhoto(pickup.id, file, photoNumber);
      console.log(`📤 Resultado do upload foto ${photoNumber}:`, result);

      if (result.success && result.url) {
        console.log(`✅ URL da foto ${photoNumber}:`, result.url.substring(0, 100));

        // Atualizar o estado imediatamente
        if (photoNumber === 1) {
          setPhoto1(result.url);
          console.log('📷 Photo1 atualizada');
        }
        if (photoNumber === 2) {
          setPhoto2(result.url);
          console.log('📷 Photo2 atualizada');
        }
        if (photoNumber === 3) {
          setPhoto3(result.url);
          console.log('📷 Photo3 atualizada');
        }

        // Forçar re-render
        setRenderKey(prev => prev + 1);

        setSuccess(`Foto ${photoNumber} adicionada com sucesso!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Erro ao fazer upload da foto');
      }
    } catch (err) {
      console.error('❌ Erro ao fazer upload da foto:', err);
      setError('Erro ao fazer upload da foto');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoDelete = async (photoNumber: 1 | 2 | 3, url: string) => {
    if (!confirm('Deseja realmente excluir esta foto?')) return;

    setIsLoading(true);
    try {
      await pickupProofService.deletePhoto(url);

      if (photoNumber === 1) setPhoto1('');
      if (photoNumber === 2) setPhoto2('');
      if (photoNumber === 3) setPhoto3('');

      setSuccess('Foto excluída com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao excluir foto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignatureSave = async (signatureDataURL: string) => {
    setIsLoading(true);
    setError('');

    try {
      const blob = pickupProofService.dataURLtoBlob(signatureDataURL);
      const result = await pickupProofService.uploadSignature(pickup.id, blob);

      if (result.success && result.url) {
        setSignature(result.url);
        setSignatureDate(new Date().toISOString());
        setSuccess('Assinatura salva com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Erro ao salvar assinatura');
      }
    } catch (err) {
      setError('Erro ao salvar assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');

    if (!collectorName) {
      setError('Nome do coletor é obrigatório');
      setActiveTab('legal');
      return;
    }

    if (!legalTermsAccepted) {
      setError('Você deve aceitar os termos legais');
      setActiveTab('legal');
      return;
    }

    setIsSaving(true);

    try {
      const proofData: Partial<PickupProof> = {
        pickup_id: pickup.id,
        collected_at: existingProof?.collected_at || new Date().toISOString(),
        collector_name: collectorName.trim(),
        collector_document: collectorDocument.trim() || undefined,
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

      let result;
      if (existingProof) {
        console.log('✏️ Atualizando comprovante existente:', existingProof.id);
        result = await pickupProofService.update(pickup.id, proofData);
      } else {
        console.log('➕ Criando novo comprovante');
        result = await pickupProofService.create(proofData);
      }

      if (result.success) {
        const action = existingProof ? 'atualizado' : 'salvo';
        setSuccess(`Comprovante ${action} com sucesso!`);

        // Recarregar o comprovante para pegar o ID atualizado
        await loadProof();

        // Chamar onSuccess IMEDIATAMENTE para atualizar a lista pai
        onSuccess();

        // Fechar modal após um delay curto
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Erro ao salvar comprovante');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar comprovante:', err);
      setError('Erro ao salvar comprovante');
    } finally {
      setIsSaving(false);
    }
  };

  const PhotoCard: React.FC<{ photoUrl: string; photoNumber: 1 | 2 | 3 }> = ({ photoUrl, photoNumber }) => {
    if (photoUrl) {
      return (
        <div key={photoUrl} className="relative group">
          <img
            key={`img-${photoUrl}`}
            src={photoUrl}
            alt={`Foto ${photoNumber}`}
            className="w-full h-48 object-cover rounded-lg"
            onLoad={() => console.log(`🖼️ Foto ${photoNumber} carregada com sucesso`)}
            onError={(e) => {
              console.error(`❌ Erro ao carregar foto ${photoNumber}:`, e);
              console.log(`URL que falhou: ${photoUrl.substring(0, 100)}...`);
            }}
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
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhotoUpload(photoNumber, file);
          }}
          className="hidden"
        />
        <Camera className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Adicionar Foto {photoNumber}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 dark:text-gray-400">Câmera ou Upload</p>
      </label>
    );
  };

  if (zoomedImage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4" onClick={() => setZoomedImage(null)}>
        <div className="relative max-w-4xl max-h-full">
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:bg-gray-700"
          >
            <X size={24} />
          </button>
          <img src={zoomedImage} alt="Zoom" className="max-w-full max-h-[90vh] object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Comprovante de Coleta
              </h2>
              {existingProof && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                  Editando
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pickup.pickup_number || pickup.numeroColeta}
            </p>
            {existingProof && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Comprovante já registrado - você pode editar as informações
              </p>
            )}
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
            Informações Legais
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
                Detalhes da Coleta
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Código da Coleta
                  </label>
                  <input
                    type="text"
                    value={pickup.pickup_number || pickup.numeroColeta}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transportador
                  </label>
                  <input
                    type="text"
                    value={pickup.carrier_name || pickup.transportador || '-'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motorista
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Nome do motorista"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Veículo
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="Placa"
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
                Observações da Coleta
              </h3>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Digite observações sobre a coleta, ocorrências ou detalhes importantes..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use este espaço para registrar informações importantes sobre o processo de coleta
              </p>
            </div>
          )}

          {/* Aba: Informações Legais */}
          {activeTab === 'legal' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                Informações Legais
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Coletor *
                </label>
                <input
                  type="text"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  placeholder="Nome completo"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CPF do Coletor
                </label>
                <input
                  type="text"
                  value={collectorDocument}
                  onChange={(e) => setCollectorDocument(e.target.value)}
                  placeholder="000.000.000-00"
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
                      Aceite dos Termos Legais
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Declaro que recebi a mercadoria em perfeitas condições e estou de acordo com os termos e condições da coleta.
                      Esta assinatura tem validade legal e representa meu consentimento formal.
                    </p>
                  </div>
                </label>
              </div>

              {signatureDate && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                    <CheckCircle size={20} />
                    <div>
                      <p className="font-medium">Comprovante assinado</p>
                      <p className="text-sm">
                        {new Date(signatureDate).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aba: Fotos */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                Fotos da Coleta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" key={`photos-grid-${renderKey}`}>
                <PhotoCard key={`photo-1-${renderKey}-${photo1 || 'empty'}`} photoUrl={photo1} photoNumber={1} />
                <PhotoCard key={`photo-2-${renderKey}-${photo2 || 'empty'}`} photoUrl={photo2} photoNumber={2} />
                <PhotoCard key={`photo-3-${renderKey}-${photo3 || 'empty'}`} photoUrl={photo3} photoNumber={3} />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Dicas:</strong> Tire fotos claras da mercadoria, veículo e localização.
                  Máximo de 3 fotos, até 5MB cada. Suporta captura direta da câmera ou upload de arquivo.
                </p>
              </div>
            </div>
          )}

          {/* Aba: Assinatura */}
          {activeTab === 'signature' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                Assinatura Digital
              </h3>

              {signature ? (
                <div className="space-y-4">
                  <div className="border-2 border-green-500 dark:border-green-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <img src={signature} alt="Assinatura" className="w-full h-64 object-contain" />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle size={16} />
                      Assinatura registrada em {signatureDate ? new Date(signatureDate).toLocaleString('pt-BR') : '-'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Deseja refazer a assinatura?')) {
                          setSignature('');
                          setSignatureDate('');
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 underline"
                    >
                      Refazer assinatura
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
                      <strong>Atenção:</strong> A assinatura digital tem validade legal.
                      Assine dentro do campo acima usando mouse ou toque na tela.
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
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {existingProof ? 'Atualizando...' : 'Salvando...'}
              </>
            ) : (
              <>
                <Save size={18} />
                {existingProof ? 'Atualizar Comprovante' : 'Salvar Comprovante'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
