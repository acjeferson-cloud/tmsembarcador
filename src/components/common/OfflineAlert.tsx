import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineAlert: React.FC = () => {
  const { isOnline, checkConnection } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOnline && hasBeenOffline && !showReconnected) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setHasBeenOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline, showReconnected]);

  const handleRetry = async () => {
    setIsChecking(true);
    await checkConnection();
    setIsChecking(false);
  };

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slideDown">
      {!isOnline ? (
        <div className="bg-red-600 text-white px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <WifiOff className="w-5 h-5" />
              <span className="font-medium">
                Sem conexão com a internet. Verifique sua rede.
              </span>
            </div>
            <button
              onClick={handleRetry}
              disabled={isChecking}
              className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 px-4 py-1.5 rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span className="text-sm">Tentar novamente</span>
            </button>
          </div>
        </div>
      ) : showReconnected ? (
        <div className="bg-green-600 text-white px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center space-x-3">
            <Wifi className="w-5 h-5" />
            <span className="font-medium">
              Conexão restabelecida com sucesso!
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
