import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info' | 'error';
  errorMode?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning',
  errorMode = false,
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      confirmBg: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
    },
    error: {
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      confirmBg: 'bg-red-600 hover:bg-red-700',
    },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-slideUp">
        <div className="flex items-start space-x-4 mb-6">
          <div className={`${config.iconColor} ${config.bgColor} p-3 rounded-full flex-shrink-0`}>
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          {!errorMode && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={errorMode ? onCancel : onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white ${config.confirmBg} rounded-lg transition-colors`}
          >
            {errorMode ? 'OK' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
