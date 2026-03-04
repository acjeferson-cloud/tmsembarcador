import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { connectionService, ConnectionStatus } from '../services/connectionService';

interface ConnectionContextValue {
  isOnline: boolean;
  status: ConnectionStatus;
  checkConnection: () => Promise<boolean>;
  waitForConnection: (timeout?: number) => Promise<boolean>;
}

const ConnectionContext = createContext<ConnectionContextValue | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatus>(connectionService.getStatus());

  useEffect(() => {
    const unsubscribe = connectionService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkConnection = async () => {
    return await connectionService.validateConnection();
  };

  const waitForConnection = async (timeout?: number) => {
    return await connectionService.waitForConnection(timeout);
  };

  const value: ConnectionContextValue = {
    isOnline: status.isOnline,
    status,
    checkConnection,
    waitForConnection
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = (): ConnectionContextValue => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};
