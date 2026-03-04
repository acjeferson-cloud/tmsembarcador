import { useConnection } from '../context/ConnectionContext';

interface OnlineStatusResult {
  isOnline: boolean;
  lastChecked: Date;
  checkConnection: () => Promise<boolean>;
  waitForConnection: (timeout?: number) => Promise<boolean>;
  requireOnline: (action: () => void | Promise<void>, errorMessage?: string) => Promise<void>;
}

export const useOnlineStatus = (): OnlineStatusResult => {
  const { isOnline, status, checkConnection, waitForConnection } = useConnection();

  const requireOnline = async (
    action: () => void | Promise<void>,
    errorMessage: string = 'Esta ação requer conexão com a internet'
  ): Promise<void> => {
    if (!isOnline) {
      throw new Error(errorMessage);
    }

    try {
      await action();
    } catch (error) {
      if (!navigator.onLine) {
        throw new Error('Conexão perdida durante a operação');
      }
      throw error;
    }
  };

  return {
    isOnline,
    lastChecked: status.lastChecked,
    checkConnection,
    waitForConnection,
    requireOnline
  };
};
