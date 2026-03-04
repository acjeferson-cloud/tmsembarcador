import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

export type SupportedLanguage = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: SupportedLanguage;
  availableLanguages: SupportedLanguage[];
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  userConfiguredLanguages: SupportedLanguage[];
  isLanguageAvailable: (lang: SupportedLanguage) => boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<SupportedLanguage>('pt');
  const [userConfiguredLanguages, setUserConfiguredLanguages] = useState<SupportedLanguage[]>(['pt']);
  const availableLanguages: SupportedLanguage[] = ['pt', 'en', 'es'];

  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          const loginLanguage = localStorage.getItem('tms-login-language') as SupportedLanguage | null;

          let defaultLang: SupportedLanguage = 'pt';

          if (loginLanguage && availableLanguages.includes(loginLanguage)) {
            defaultLang = loginLanguage;
            console.log('🌐 Usando idioma selecionado no login:', defaultLang);
          } else {
            const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
            defaultLang = availableLanguages.includes(browserLang) ? browserLang : 'pt';
            console.log('🌐 Usando idioma do navegador:', defaultLang);
          }

          setLanguageState(defaultLang);
          setUserConfiguredLanguages(['pt']);
          i18n.changeLanguage(defaultLang);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('preferred_language, estabelecimento_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userError) throw userError;

        let targetLanguage: SupportedLanguage = 'pt';

        if (userData?.preferred_language) {
          targetLanguage = userData.preferred_language as SupportedLanguage;
          setUserConfiguredLanguages([userData.preferred_language as SupportedLanguage]);
        } else if (userData?.estabelecimento_id) {
          const { data: tenantData } = await supabase
            .from('saas_tenants')
            .select('default_language')
            .eq('id', userData.estabelecimento_id)
            .maybeSingle();

          if (tenantData?.default_language) {
            targetLanguage = tenantData.default_language as SupportedLanguage;
          } else {
            const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
            targetLanguage = availableLanguages.includes(browserLang) ? browserLang : 'pt';
          }
        } else {
          const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
          targetLanguage = availableLanguages.includes(browserLang) ? browserLang : 'pt';
        }

        setLanguageState(targetLanguage);
        i18n.changeLanguage(targetLanguage);

      } catch (error) {
        console.error('Error loading language preference:', error);
        const fallbackLang: SupportedLanguage = 'pt';
        setLanguageState(fallbackLang);
        i18n.changeLanguage(fallbackLang);
      }
    };

    loadLanguagePreference();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadLanguagePreference();
      } else if (event === 'SIGNED_OUT') {
        const loginLanguage = localStorage.getItem('tms-login-language') as SupportedLanguage | null;

        let defaultLang: SupportedLanguage = 'pt';

        if (loginLanguage && availableLanguages.includes(loginLanguage)) {
          defaultLang = loginLanguage;
          console.log('🌐 Mantendo idioma selecionado após logout:', defaultLang);
        } else {
          const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
          defaultLang = availableLanguages.includes(browserLang) ? browserLang : 'pt';
        }

        setLanguageState(defaultLang);
        setUserConfiguredLanguages(['pt']);
        i18n.changeLanguage(defaultLang);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [i18n]);

  const setLanguage = async (lang: SupportedLanguage) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        console.warn('Cannot change language without a logged-in user');
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ preferred_language: lang })
        .eq('id', session.user.id);

      if (error) throw error;

      setLanguageState(lang);
      setUserConfiguredLanguages([lang]);
      i18n.changeLanguage(lang);
    } catch (error) {
      console.error('Error updating language preference:', error);
      throw error;
    }
  };

  const isLanguageAvailable = (lang: SupportedLanguage): boolean => {
    return userConfiguredLanguages.includes(lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        availableLanguages,
        setLanguage,
        userConfiguredLanguages,
        isLanguageAvailable
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
