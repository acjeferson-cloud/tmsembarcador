import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

type InlineMessageType = 'success' | 'error' | 'warning' | 'info';

interface InlineMessageProps {
  message: string;
  type: InlineMessageType;
  className?: string;
}

export const InlineMessage: React.FC<InlineMessageProps> = ({ message, type, className = '' }) => {
  const config = {
    success: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    error: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    warning: {
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    info: {
      icon: Info,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  };

  const { icon: Icon, color } = config[type];

  return (
    <div className={`flex items-center space-x-2 ${color} ${className}`}>
      <Icon size={16} />
      <span className="text-sm">{message}</span>
    </div>
  );
};

const InlineMessageBox: React.FC<InlineMessageProps> = ({ message, type, className = '' }) => {
  const config = {
    success: {
      icon: CheckCircle,
      textColor: 'text-green-800',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    error: {
      icon: XCircle,
      textColor: 'text-red-800',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    warning: {
      icon: AlertCircle,
      textColor: 'text-yellow-800',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    info: {
      icon: Info,
      textColor: 'text-blue-800',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  };

  const { icon: Icon, textColor, bgColor, iconColor } = config[type];

  return (
    <div className={`p-3 rounded-lg ${bgColor} ${className}`}>
      <div className="flex items-center space-x-2">
        <Icon size={16} className={iconColor} />
        <span className={`${textColor}`}>{message}</span>
      </div>
    </div>
  );
};
