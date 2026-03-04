import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (base64: string) => void;
  previewClassName?: string;
  acceptedFormats?: string;
  maxSizeMB?: number;
  description?: string;
  darkPreview?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value,
  onChange,
  previewClassName = 'h-16',
  acceptedFormats = 'image/png, image/jpeg, image/jpg, image/svg+xml',
  maxSizeMB = 2,
  description,
  darkPreview = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const compressImage = (file: File, maxWidth: number = 300, maxHeight: number = 300, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Erro ao criar contexto canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsLoading(true);

    try {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setError(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
        setIsLoading(false);
        return;
      }

      const acceptedTypes = acceptedFormats.split(',').map(f => f.trim());
      if (!acceptedTypes.includes(file.type)) {
        setError('Formato de arquivo não suportado');
        setIsLoading(false);
        return;
      }

      const compressedBase64 = await compressImage(file, 500, 200, 0.85);

      const sizeInKB = Math.round((compressedBase64.length * 3) / 4 / 1024);
      console.log(`Imagem comprimida: ${sizeInKB}KB (500x200px, qualidade 85%)`);

      onChange(compressedBase64);
      setIsLoading(false);
    } catch (err) {
      setError('Erro ao processar imagem');
      setIsLoading(false);
      console.error('Erro ao comprimir imagem:', err);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
    setError('');
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!value ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          className="w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center space-y-2">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Processando...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Clique para fazer upload
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500 dark:text-gray-400">
                  PNG, JPG ou SVG (máx. {maxSizeMB}MB)
                </span>
              </>
            )}
          </div>
        </button>
      ) : (
        <div className={`relative p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 ${
          darkPreview ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'
        }`}>
          <div className="flex items-center justify-center">
            <img
              src={value}
              alt="Preview"
              className={`${previewClassName} w-auto object-contain max-w-full`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                setError('Erro ao carregar imagem');
              }}
            />
          </div>
          <div className="mt-3 flex justify-center space-x-2">
            <button
              type="button"
              onClick={handleClick}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1"
            >
              <Upload size={14} />
              <span>Alterar</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1"
            >
              <X size={14} />
              <span>Remover</span>
            </button>
          </div>
        </div>
      )}

      {description && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {description}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center space-x-1">
          <X size={12} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
