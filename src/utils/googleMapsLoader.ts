// Utility to load Google Maps API only once
let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsAPI = (): Promise<void> => {
  // Check if Google Maps is already available
  if (typeof window !== 'undefined' &&
      typeof window.google !== 'undefined' &&
      typeof window.google.maps !== 'undefined') {
    isLoaded = true;
    return Promise.resolve();
  }

  // If already loaded, return resolved promise
  if (isLoaded) {
    return Promise.resolve();
  }

  // If currently loading, return existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // If script is already in DOM but not fully loaded, wait for it
  if (isScriptAlreadyLoaded()) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100;
      const checkLoaded = () => {
        attempts++;
        if (typeof window.google !== 'undefined' && window.google.maps) {
          isLoaded = true;
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Timeout ao aguardar carregamento do Google Maps'));
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
  }

  // Start loading
  isLoading = true;

  loadPromise = new Promise<void>(async (resolve, reject) => {
    // Adicionar callback global ANTES de criar o script
    (window as any).initMap = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };

    // Get API key from database configuration
    let apiKey: string | null = null;
    let configSource = 'none';

    try {
      const { apiKeysService } = await import('../services/apiKeysService');
      const config = await apiKeysService.getKeyByType('google_maps', undefined, 'production');

      if (config && config.is_active && config.api_key) {
        apiKey = config.api_key;
        configSource = 'database_unified';
        await apiKeysService.incrementUsage(config.id);
      } else {
        try {
          const { googleMapsService } = await import('../services/googleMapsService');
          const oldConfig = await googleMapsService.getActiveConfig();

          if (oldConfig && oldConfig.is_active && oldConfig.api_key) {
            apiKey = oldConfig.api_key;
            configSource = 'database_legacy';
          }
        } catch (legacyError) {
        }
      }
    } catch (error) {
    }

    // Fallback to environment variable if no database config
    if (!apiKey) {
      apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        configSource = 'env';
      }
    }

    if (!apiKey) {
      const error = new Error('Google Maps API Key não configurada. Acesse Configurações > Google Maps para configurar ou adicione VITE_GOOGLE_MAPS_API_KEY no arquivo .env');
      isLoading = false;
      loadPromise = null;
      reject(error);
      return;
    }
    // Create and append script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    script.onerror = (error) => {
      isLoading = false;
      loadPromise = null;

      // Remove o script que falhou
      const failedScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (failedScript) {
        failedScript.remove();
      }

      delete (window as any).initMap;
      reject(new Error('Erro ao carregar Google Maps API. Verifique: 1) Conexão com internet, 2) API Key válida, 3) APIs habilitadas no Google Cloud Console (Maps JavaScript API, Geocoding API, Places API).'));
    };

    // Adicionar listener para erros de autenticação do Google Maps
    (window as any).gm_authFailure = () => {
      isLoading = false;
      loadPromise = null;

      const failedScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (failedScript) {
        failedScript.remove();
      }

      delete (window as any).initMap;
      reject(new Error('API Key inválida ou expirada. Verifique a configuração em Configurações > Google Maps ou no console do Google Cloud.'));
    };

    // Timeout de segurança reduzido (10 segundos)
    const timeoutId = setTimeout(() => {
      if (!isLoaded) {
        isLoading = false;
        loadPromise = null;

        // Remove script if it failed
        const failedScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (failedScript) {
          failedScript.remove();
        }

        delete (window as any).initMap;
        reject(new Error('Google Maps não pôde ser carregado. Verifique sua conexão com a internet ou a validade da API Key.'));
      }
    }, 10000);

    // Limpar timeout quando carregar com sucesso
    const originalCallback = (window as any).initMap;
    (window as any).initMap = () => {
      clearTimeout(timeoutId);
      originalCallback();
    };
    document.head.appendChild(script);
  });

  return loadPromise;
};

const isGoogleMapsAvailable = (): boolean => {
  return !!(window.google && window.google.maps && window.google.maps.Map);
};

export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' &&
         typeof window.google !== 'undefined' &&
         typeof window.google.maps !== 'undefined' &&
         typeof window.google.maps.Map !== 'undefined';
};

const isScriptAlreadyLoaded = (): boolean => {
  return !!document.querySelector('script[src*="maps.googleapis.com"]');
};

const loadGoogleMaps = loadGoogleMapsAPI;