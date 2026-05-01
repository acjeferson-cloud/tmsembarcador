interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodingTask {
  address: string;
  resolve: (coords: Coordinates | null) => void;
}

class NominatimGeocoder {
  private queue: GeocodingTask[] = [];
  private isProcessing = false;
  private pendingAddresses = new Set<string>();
  private readonly delayMs = 1100; // 1.1 segundos de delay para respeitar o rate limit da Nominatim
  private readonly cacheKey = 'nominatim_geocache';

  private getCache(): Record<string, Coordinates> {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  }

  private saveToCache(address: string, coords: Coordinates) {
    try {
      const cache = this.getCache();
      cache[address] = coords;
      localStorage.setItem(this.cacheKey, JSON.stringify(cache));
    } catch (e) {
      console.warn('Falha ao salvar no localStorage cache:', e);
    }
  }

  public async geocode(address: string): Promise<Coordinates | null> {
    // 1. Tenta pegar do Cache local
    const cache = this.getCache();
    if (cache[address]) {
      return cache[address];
    }

    // 2. Coloca na fila se não estiver no cache nem pendente
    return new Promise((resolve) => {
      if (!this.pendingAddresses.has(address)) {
        this.pendingAddresses.add(address);
        this.queue.push({ address, resolve });
        this.processQueue();
      } else {
        // Se já está pendente, agenda uma verificação futura quando sair do pending
        const checkCache = () => {
          const updatedCache = this.getCache();
          if (updatedCache[address]) {
            resolve(updatedCache[address]);
          } else if (!this.pendingAddresses.has(address)) {
             resolve(null);
          } else {
            setTimeout(checkCache, 500);
          }
        };
        setTimeout(checkCache, 500);
      }
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift();

    if (task) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(task.address)}&limit=1`;
        const response = await fetch(url, {
          headers: {
            'Accept-Language': 'pt-BR,pt;q=0.9',
            // Nominatim requests need a User-Agent or it might get blocked, but browsers set it automatically.
          }
        });
        const data = await response.json();

        if (data && data.length > 0) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          this.saveToCache(task.address, coords);
          this.pendingAddresses.delete(task.address);
          task.resolve(coords);
        } else {
          this.pendingAddresses.delete(task.address);
          task.resolve(null);
        }
      } catch (error) {
        console.error('Nominatim geocoding erro:', error);
        this.pendingAddresses.delete(task.address);
        task.resolve(null);
      }
    }

    // Espera o delay antes de processar o próximo
    setTimeout(() => {
      this.isProcessing = false;
      this.processQueue();
    }, this.delayMs);
  }
}

export const nominatimGeocoder = new NominatimGeocoder();
