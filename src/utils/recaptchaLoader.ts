declare global {
  interface Window {
    grecaptcha: any;
  }
}

let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export const loadRecaptcha = (): Promise<void> => {
  if (isLoaded && window.grecaptcha) {
    return Promise.resolve();
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  const existingScript = document.querySelector('script[src*="recaptcha"]');
  if (existingScript) {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            isLoaded = true;
            resolve();
          });
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
  }

  isLoading = true;

  loadPromise = new Promise(async (resolve, reject) => {
    try {
      let siteKey: string | null = null;

      try {
        console.log('Tentando carregar reCAPTCHA Site Key do banco de dados...');
        const { apiKeysService } = await import('../services/apiKeysService');
        const config = await apiKeysService.getKeyByType('recaptcha_site', undefined, 'production');

        if (config && config.is_active && config.api_key) {
          siteKey = config.api_key;
          console.log('reCAPTCHA Site Key carregada do banco de dados');
          await apiKeysService.incrementUsage(config.id);
        }
      } catch (error) {
        console.log('Erro ao buscar reCAPTCHA do banco:', error);
      }

      if (!siteKey) {
        siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
        if (siteKey) {
          console.log('reCAPTCHA Site Key carregada do .env');
        }
      }

      if (!siteKey) {
        console.warn('reCAPTCHA Site Key não configurada. Continuando sem reCAPTCHA.');
        isLoading = false;
        isLoaded = false;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            console.log('reCAPTCHA carregado com sucesso');
            isLoaded = true;
            isLoading = false;
            resolve();
          });
        }
      };

      script.onerror = () => {
        console.error('Erro ao carregar reCAPTCHA');
        isLoading = false;
        reject(new Error('Falha ao carregar reCAPTCHA'));
      };

      document.head.appendChild(script);
    } catch (error) {
      isLoading = false;
      reject(error);
    }
  });

  return loadPromise;
};

export const executeRecaptcha = async (action: string): Promise<string> => {
  let siteKey: string | null = null;

  try {
    const { apiKeysService } = await import('../services/apiKeysService');
    const config = await apiKeysService.getKeyByType('recaptcha_site', undefined, 'production');

    if (config && config.is_active && config.api_key) {
      siteKey = config.api_key;
    }
  } catch (error) {
    console.log('Erro ao buscar reCAPTCHA do banco:', error);
  }

  if (!siteKey) {
    siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  }

  if (!siteKey) {
    console.warn('reCAPTCHA não configurado, retornando token vazio');
    return '';
  }

  if (!window.grecaptcha) {
    console.warn('reCAPTCHA não está carregado');
    return '';
  }

  try {
    const token = await window.grecaptcha.execute(siteKey, { action });
    return token;
  } catch (error) {
    console.error('Erro ao executar reCAPTCHA:', error);
    return '';
  }
};

const isRecaptchaLoaded = (): boolean => {
  return isLoaded && !!window.grecaptcha;
};
