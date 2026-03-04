export interface ConnectionStatus {
  isOnline: boolean;
  lastChecked: Date;
}

class ConnectionService {
  private listeners: Set<(status: ConnectionStatus) => void> = new Set();
  private lastStatus: ConnectionStatus = {
    isOnline: navigator.onLine,
    lastChecked: new Date()
  };

  constructor() {
    this.initEventListeners();
  }

  private initEventListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private handleOnline() {
    this.updateStatus({
      isOnline: true,
      lastChecked: new Date()
    });
  }

  private handleOffline() {
    this.updateStatus({
      isOnline: false,
      lastChecked: new Date()
    });
  }

  private updateStatus(status: ConnectionStatus) {
    this.lastStatus = status;
    this.listeners.forEach(listener => listener(status));
  }

  async checkServerConnection(): Promise<boolean> {
    const isOnline = navigator.onLine;
    this.updateStatus({
      isOnline,
      lastChecked: new Date()
    });
    return isOnline;
  }

  async validateConnection(): Promise<boolean> {
    return this.checkServerConnection();
  }

  subscribe(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.lastStatus);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getStatus(): ConnectionStatus {
    return this.lastStatus;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();

      const unsubscribe = this.subscribe((status) => {
        if (status.isOnline) {
          unsubscribe();
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          unsubscribe();
          resolve(false);
        }
      });
    });
  }

  destroy() {
    this.listeners.clear();
    window.removeEventListener('online', () => this.handleOnline());
    window.removeEventListener('offline', () => this.handleOffline());
  }
}

export const connectionService = new ConnectionService();
