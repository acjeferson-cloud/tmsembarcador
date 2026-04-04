import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';
import { Establishment } from '../data/establishmentsData';
import { establishments } from '../data/establishmentsData';
import { getUserByEmail, updateLastLogin, incrementLoginAttempts, resetLoginAttempts } from '../data/usersData';
import { usersService } from '../services/usersService';

export const useAuth = () => {
  const [user, setUser] = useState<(User & { supabaseUser?: SupabaseUser }) | null>(null);

  const [currentEstablishment, setCurrentEstablishment] = useState<Establishment | null>(() => {
    const savedEstablishment = localStorage.getItem('tms-current-establishment');
    return savedEstablishment ? JSON.parse(savedEstablishment) : null;
  });

  const [showEstablishmentSelector, setShowEstablishmentSelector] = useState(false);
  const [availableEstablishments, setAvailableEstablishments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Novos estados para Organization/Environment selector
  const [showOrgEnvSelector, setShowOrgEnvSelector] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);

  const loadUserFromDatabase = async (email: string, supabaseUser: SupabaseUser): Promise<User & { supabaseUser?: SupabaseUser }> => {
    try {
      const dbUser = await usersService.getByEmail(email);

      if (dbUser) {
        // Buscar estabelecimentos permitidos do banco
        const { data: userWithEstablishments } = await supabase
          .from('users')
          .select('estabelecimentos_permitidos, foto_perfil_url')
          .eq('id', dbUser.id)
          .maybeSingle();

        const estabelecimentosPermitidos = userWithEstablishments?.estabelecimentos_permitidos || [];
        const foto_perfil_url = userWithEstablishments?.foto_perfil_url || dbUser.foto_perfil_url;



        return {
          id: parseInt(dbUser.codigo) || 1,
          name: dbUser.nome,
          email: dbUser.email,
          role: 'admin',
          foto_perfil_url: foto_perfil_url,
          perfil: dbUser.perfil,
          permissoes: dbUser.permissoes || ['all'],
          estabelecimentosPermitidos: estabelecimentosPermitidos,
          force_password_reset: dbUser.force_password_reset || false,
          supabaseUser
        };
      } else {
      }
    } catch (error) {

    }

    return {
      id: 1,
      name: email.split('@')[0] || 'User',
      email: email,
      role: 'admin',
      perfil: 'administrador',
      permissoes: ['all'],
      estabelecimentosPermitidos: [],
      force_password_reset: false,
      supabaseUser
    };
  };

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      try {
        // Verificar se há usuário salvo no localStorage (sessão customizada)
        const savedUser = localStorage.getItem('tms-user');
        const savedSession = localStorage.getItem('tms-session');

        if (savedUser && savedSession) {
          try {
            const userData = JSON.parse(savedUser);
            const sessionData = JSON.parse(savedSession);

            // Verificar se a sessão não expirou
            const sessionAge = Date.now() - sessionData.timestamp;
            // Se tem maxAge salvo, usar ele; senão usar 24 horas por padrão
            const maxAge = sessionData.maxAge || (24 * 60 * 60 * 1000);

            if (sessionAge < maxAge) {
              setUser(userData);

              // CRÍTICO: Restaurar org_id e env_id no localStorage
              if (userData.organization_id && userData.environment_id) {
                localStorage.setItem('tms-selected-organization', userData.organization_id);
                localStorage.setItem('tms-selected-environment', userData.environment_id);

              }

              // Disparar evento para iniciar heartbeat
              window.dispatchEvent(new Event('user-logged-in'));

              // Verificar se tem estabelecimento selecionado
              const savedEstablishment = localStorage.getItem('tms-current-establishment');
              if (!savedEstablishment) {
                // Buscar estabelecimentos e auto-selecionar se houver apenas 1
                try {
                  // Buscar org_id e env_id do banco para usar na função RPC
                  const { data: dbUser } = await supabase
                    .from('users')
                    .select('organization_id, environment_id')
                    .eq('email', userData.email)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle();

                  if (!dbUser) {

                    setShowEstablishmentSelector(true);
                    setIsLoading(false);
                    return;
                  }

                  const { data: dbEstablishments, error: establishmentsError } = await supabase
                    .rpc('get_user_establishments', {
                      p_user_email: userData.email,
                      p_organization_id: dbUser.organization_id,
                      p_environment_id: dbUser.environment_id
                    });

                  const mapEstSess = (rawList: any[]) => rawList.map((est: any) => ({
                      id: parseInt(est.codigo) || 1,
                      codigo: est.codigo,
                      cnpj: est.cnpj,
                      inscricaoEstadual: est.inscricao_estadual || est.inscricaoEstadual,
                      razaoSocial: est.razao_social || est.razaoSocial,
                      fantasia: est.fantasia || est.nome_fantasia || '',
                      endereco: est.endereco || est.logradouro || '',
                      bairro: est.bairro,
                      cep: est.cep,
                      cidade: est.cidade,
                      estado: est.estado,
                      tipo: est.tipo,
                      trackingPrefix: est.tracking_prefix || est.codigo,
                      organizationId: est.organization_id,
                      environmentId: est.environment_id,
                      establishment_id: est.id
                    }));

                  if (dbEstablishments && dbEstablishments.length > 0) {
                    const allowedEstablishments = mapEstSess(dbEstablishments);
                    setAvailableEstablishments(allowedEstablishments);

                    if (allowedEstablishments.length === 1) {
                      const establishment = allowedEstablishments[0];
                      setCurrentEstablishment(establishment);
                      localStorage.setItem('tms-current-establishment', JSON.stringify(establishment));
                      setShowEstablishmentSelector(false);
                    } else {
                      setShowEstablishmentSelector(true);
                    }
                  } else {
                    // FALLBACK: RPC retornou vazio, buscar diretamente

                    const { data: fbEsts } = await supabase
                      .from('establishments')
                      .select('*')
                      .eq('organization_id', dbUser.organization_id)
                      .eq('environment_id', dbUser.environment_id)
                      .order('codigo');

                    if (fbEsts && fbEsts.length > 0) {
                      const allowedEstablishments = mapEstSess(fbEsts);
                      setAvailableEstablishments(allowedEstablishments);
                      if (allowedEstablishments.length === 1) {
                        const establishment = allowedEstablishments[0];
                        setCurrentEstablishment(establishment);
                        localStorage.setItem('tms-current-establishment', JSON.stringify(establishment));
                        setShowEstablishmentSelector(false);

                      } else {
                        setShowEstablishmentSelector(true);
                      }
                    } else {
                      setShowEstablishmentSelector(true);
                    }
                  }
                } catch (error) {

                  setShowEstablishmentSelector(true);
                }
              } else {
                try {
                  const establishment = JSON.parse(savedEstablishment);
                  setCurrentEstablishment(establishment);
                  setShowEstablishmentSelector(false);
                } catch (error) {

                  setCurrentEstablishment(null);
                  setShowEstablishmentSelector(true);
                }
              }
              setIsLoading(false);
              return;
            } else {
              // Sessão expirou - limpar
              localStorage.removeItem('tms-user');
              localStorage.removeItem('tms-session');
              localStorage.removeItem('tms-current-establishment');
            }
          } catch (error) {

            localStorage.removeItem('tms-user');
            localStorage.removeItem('tms-session');
            localStorage.removeItem('tms-current-establishment');
          }
        }

        // Fallback: verificar sessão do Supabase Auth (se existir)
        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (!error && session?.user && session.user.email) {
            const userData = await loadUserFromDatabase(session.user.email, session.user);

            // Disparar evento para iniciar heartbeat
            window.dispatchEvent(new Event('user-logged-in'));

            setUser(userData);
            localStorage.setItem('tms-user', JSON.stringify(userData));
            localStorage.setItem('tms-session', JSON.stringify({ timestamp: Date.now() }));

            // Verificar se tem estabelecimento selecionado
            const savedEstablishment = localStorage.getItem('tms-current-establishment');
            if (!savedEstablishment) {
              // Buscar estabelecimentos e auto-selecionar se houver apenas 1
              try {
                if (!dbUser) {

                  setShowEstablishmentSelector(true);
                  return;
                }

                const { data: dbEstablishments, error: establishmentsError } = await supabase
                  .rpc('get_user_establishments', {
                    p_user_email: session.user.email,
                    p_organization_id: dbUser.organization_id,
                    p_environment_id: dbUser.environment_id
                  });

                if (dbEstablishments && dbEstablishments.length > 0) {
                  // A função RPC já retorna os estabelecimentos filtrados
                  const allowedEstablishments = dbEstablishments;

                  // Se houver apenas 1, selecionar automaticamente
                  if (allowedEstablishments.length === 1) {
                    const est = allowedEstablishments[0];
                    const establishment = {
                      id: parseInt(est.codigo) || 1,
                      codigo: est.codigo,
                      cnpj: est.cnpj,
                      inscricaoEstadual: est.inscricao_estadual,
                      razaoSocial: est.razao_social,
                      fantasia: est.fantasia,
                      endereco: est.endereco,
                      bairro: est.bairro,
                      cep: est.cep,
                      cidade: est.cidade,
                      estado: est.estado,
                      tipo: est.tipo as 'matriz' | 'filial',
                      trackingPrefix: est.tracking_prefix,
                      organizationId: dbUser.organization_id,
                      environmentId: dbUser.environment_id,
                      establishment_id: est.id
                    };

                    setCurrentEstablishment(establishment);
                    localStorage.setItem('tms-current-establishment', JSON.stringify(establishment));
                    setShowEstablishmentSelector(false);
                  } else {
                    // Mais de 1 estabelecimento, mostrar modal
                    setShowEstablishmentSelector(true);
                  }
                } else {
                  setShowEstablishmentSelector(true);
                }
              } catch (error) {

                setShowEstablishmentSelector(true);
              }
            } else {
              try {
                const establishment = JSON.parse(savedEstablishment);
                setCurrentEstablishment(establishment);
                setShowEstablishmentSelector(false);
              } catch (error) {

                setCurrentEstablishment(null);
                setShowEstablishmentSelector(true);
              }
            }
          }
        }
      } catch (error) {

      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes APENAS para Supabase Auth (não usado na autenticação customizada)
    // Este listener é mantido para compatibilidade mas não deve afetar sessões customizadas
    let subscription: any = null;

    if (supabase) {
      const authListener = supabase.auth.onAuthStateChange(
        (event, session) => {
          (async () => {
            // Verificar se há sessão customizada ativa
            const savedSession = localStorage.getItem('tms-session');
            if (savedSession) {
              // Se há sessão customizada, ignorar eventos do Supabase Auth

              return;
            }

            if (event === 'SIGNED_IN' && session?.user && session.user.email) {
              const userData = await loadUserFromDatabase(session.user.email, session.user);
              setUser(userData);
              localStorage.setItem('tms-user', JSON.stringify(userData));
              localStorage.setItem('tms-session', JSON.stringify({
                timestamp: Date.now(),
                email: userData.email
              }));
              setCurrentEstablishment(null);
              localStorage.removeItem('tms-current-establishment');
              setShowEstablishmentSelector(true);
            } else if (event === 'SIGNED_OUT') {
              // Apenas processar SIGNED_OUT se não houver sessão customizada
              if (!savedSession) {
                setUser(null);
                setCurrentEstablishment(null);
                setShowEstablishmentSelector(false);
                localStorage.removeItem('tms-user');
                localStorage.removeItem('tms-session');
                localStorage.removeItem('tms-current-establishment');
              }
            }
            setIsLoading(false);
          })();
        }
      );

      subscription = authListener.data?.subscription;
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    }
  }, []);

  // Nova função para login com dados completos do environment
  const loginWithEnvironmentData = async (loginData: any, rememberMe: boolean = false): Promise<void> => {
    try {
      if (!supabase) {
        throw new Error('Serviço de autenticação não disponível no momento.');
      }



      // Buscar a tag diretamente do banco pois a RPC de login não a retorna atualmente
      const { data: userRecord } = await supabase
        .from('users')
        .select('force_password_reset')
        .eq('email', loginData.email)
        .maybeSingle();

      // Criar objeto do usuário com TODOS os dados
      const userData: User & { supabaseUser?: SupabaseUser } = {
        id: parseInt(loginData.codigo) || 1,
        codigo: loginData.codigo,
        name: loginData.name,
        email: loginData.email,
        role: 'admin',
        foto_perfil_url: loginData.foto_perfil_url || null,
        perfil: loginData.profile || 'usuario',
        permissoes: loginData.permissions || ['all'],
        estabelecimentosPermitidos: [],
        organization_id: loginData.organization_id,
        organization_code: loginData.organization_code,
        organization_name: loginData.organization_name,
        environment_id: loginData.environment_id,
        environment_code: loginData.environment_code,
        environment_name: loginData.environment_name,
        establishment_id: loginData.establishment_id,
        establishment_code: loginData.establishment_code,
        establishment_name: loginData.establishment_name,
        user_id: loginData.user_id,
        force_password_reset: userRecord?.force_password_reset || false,
        supabaseUser: undefined
      };



      setUser(userData);
      localStorage.setItem('tms-user', JSON.stringify(userData));


      // CRÍTICO: Configurar contexto da sessão no banco
      if (userData.organization_id && userData.environment_id) {


        const { error: contextError } = await supabase.rpc('set_session_context', {
          p_organization_id: userData.organization_id,
          p_environment_id: userData.environment_id,
          p_establishment_id: userData.establishment_id || null
        });

        if (contextError) {

        } else {

        }

        // Salvar também no localStorage para uso do wrapper
        localStorage.setItem('tms-selected-organization', userData.organization_id);
        localStorage.setItem('tms-selected-environment', userData.environment_id);
        if (userData.establishment_id) {
          localStorage.setItem('tms-selected-estab-id', userData.establishment_id);
        }
      }

      // Criar sessão customizada com timestamp
      const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      localStorage.setItem('tms-session', JSON.stringify({
        timestamp: Date.now(),
        email: userData.email,
        rememberMe: rememberMe,
        maxAge: sessionDuration
      }));

      // Disparar evento customizado para iniciar heartbeat
      window.dispatchEvent(new Event('user-logged-in'));

      // Buscar estabelecimentos da organização/environment
      if (userData.organization_id && userData.environment_id) {
        try {


          const { data: dbEstablishments, error: establishmentsError } = await supabase
            .rpc('get_user_establishments', {
              p_user_email: userData.email,
              p_organization_id: userData.organization_id,
              p_environment_id: userData.environment_id
            });



          const mapEstablishments = (rawList: any[]) => rawList.map((est: any) => ({
              id: parseInt(est.codigo) || 1,
              codigo: est.codigo,
              cnpj: est.cnpj,
              inscricaoEstadual: est.inscricao_estadual || est.inscricaoEstadual,
              razaoSocial: est.razao_social || est.razaoSocial,
              fantasia: est.fantasia || est.nome_fantasia || '',
              endereco: est.endereco || est.logradouro || '',
              bairro: est.bairro,
              cep: est.cep,
              cidade: est.cidade,
              estado: est.estado,
              tipo: est.tipo,
              trackingPrefix: est.tracking_prefix || est.codigo,
              organizationId: est.organization_id,
              environmentId: est.environment_id,
              establishment_id: est.id
            }));

          if (!establishmentsError && dbEstablishments && dbEstablishments.length > 0) {
            const allowedEstablishments = mapEstablishments(dbEstablishments);

            setAvailableEstablishments(allowedEstablishments);


            // Se houver apenas 1, selecionar automaticamente
            if (allowedEstablishments.length === 1) {
              const establishment = allowedEstablishments[0];
              setCurrentEstablishment(establishment);
              localStorage.setItem('tms-current-establishment', JSON.stringify(establishment));
              setShowEstablishmentSelector(false);

            } else {
              // Mais de 1 estabelecimento, mostrar modal
              setShowEstablishmentSelector(true);

            }
          } else {
            // FALLBACK: RPC falhou ou retornou vazio, buscar diretamente da tabela

            try {
              const { data: fallbackEstablishments, error: fallbackError } = await supabase
                .from('establishments')
                .select('*')
                .eq('organization_id', userData.organization_id)
                .eq('environment_id', userData.environment_id)
                .order('codigo');



              if (!fallbackError && fallbackEstablishments && fallbackEstablishments.length > 0) {
                const allowedEstablishments = mapEstablishments(fallbackEstablishments);
                setAvailableEstablishments(allowedEstablishments);

                if (allowedEstablishments.length === 1) {
                  const establishment = allowedEstablishments[0];
                  setCurrentEstablishment(establishment);
                  localStorage.setItem('tms-current-establishment', JSON.stringify(establishment));
                  setShowEstablishmentSelector(false);

                } else {
                  setShowEstablishmentSelector(true);
                }
              } else {

                setShowEstablishmentSelector(true);
              }
            } catch (fallbackErr) {

              setShowEstablishmentSelector(true);
            }
          }
        } catch (error) {

          setShowEstablishmentSelector(true);
        }
      }


    } catch (error) {

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao fazer login. Tente novamente.');
    }
  };

  // Função antiga de login (mantida para compatibilidade)
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      if (!supabase) {
        throw new Error('Serviço de autenticação não disponível no momento.');
      }



      // Usar tms_login que retorna TUDO que precisamos
      const { data: loginResult, error: loginError } = await supabase
        .rpc('tms_login', {
          p_email: email,
          p_password: password
        });

      if (loginError) {

        throw new Error('Erro ao fazer login. Tente novamente.');
      }

      if (!loginResult || !loginResult.success) {
        const errorMsg = loginResult?.error || 'Email ou senha incorretos';

        throw new Error(errorMsg);
      }



      // Criar objeto do usuário com TODOS os dados
      const userData: User & { supabaseUser?: SupabaseUser } = {
        id: parseInt(loginResult.codigo) || 1,
        codigo: loginResult.codigo,
        name: loginResult.name,
        email: loginResult.email,
        role: 'admin',
        foto_perfil_url: loginResult.foto_perfil_url || null,
        perfil: loginResult.profile || 'usuario',
        permissoes: loginResult.permissions || ['all'],
        estabelecimentosPermitidos: [],
        organization_id: loginResult.organization_id,
        organization_code: loginResult.organization_code,
        organization_name: loginResult.organization_name,
        environment_id: loginResult.environment_id,
        environment_code: loginResult.environment_code,
        environment_name: loginResult.environment_name,
        establishment_id: loginResult.establishment_id,
        establishment_code: loginResult.establishment_code,
        establishment_name: loginResult.establishment_name,
        user_id: loginResult.user_id,
        supabaseUser: undefined
      };



      setUser(userData);
      localStorage.setItem('tms-user', JSON.stringify(userData));


      // CRÍTICO: Configurar contexto da sessão no banco
      if (userData.organization_id && userData.environment_id) {


        const { error: contextError } = await supabase.rpc('set_session_context', {
          p_organization_id: userData.organization_id,
          p_environment_id: userData.environment_id,
          p_establishment_id: userData.establishment_id || null
        });

        if (contextError) {

        } else {

        }

        // Salvar também no localStorage para uso do wrapper
        localStorage.setItem('tms-selected-organization', userData.organization_id);
        localStorage.setItem('tms-selected-environment', userData.environment_id);
        if (userData.establishment_id) {
          localStorage.setItem('tms-selected-estab-id', userData.establishment_id);
        }
      }

      // Criar sessão customizada com timestamp
      const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      localStorage.setItem('tms-session', JSON.stringify({
        timestamp: Date.now(),
        email: userData.email,
        rememberMe: rememberMe,
        maxAge: sessionDuration
      }));

      // Disparar evento customizado para iniciar heartbeat
      window.dispatchEvent(new Event('user-logged-in'));

      // Se tms_login retornou um establishment_id, buscar esse estabelecimento
      if (loginResult.establishment_id) {
        try {
          const { data: establishment, error: estError } = await supabase
            .from('establishments')
            .select('*')
            .eq('id', loginResult.establishment_id)
            .maybeSingle();

          if (!estError && establishment) {
            const mappedEstablishment = {
              id: parseInt(establishment.codigo) || 1,
              codigo: establishment.codigo,
              cnpj: establishment.cnpj || '',
              inscricaoEstadual: establishment.inscricao_estadual || '',
              razaoSocial: establishment.razao_social || establishment.nome_fantasia,
              fantasia: establishment.nome_fantasia,
              endereco: establishment.logradouro || '',
              bairro: establishment.bairro || '',
              cep: establishment.cep || '',
              cidade: establishment.cidade || '',
              estado: establishment.estado || '',
              tipo: establishment.tipo as 'matriz' | 'filial',
              trackingPrefix: establishment.codigo,
              organizationId: establishment.organization_id,
              environmentId: establishment.environment_id,
              establishment_id: establishment.id
            };

            setCurrentEstablishment(mappedEstablishment);
            localStorage.setItem('tms-current-establishment', JSON.stringify(mappedEstablishment));
            setShowEstablishmentSelector(false);

          }
        } catch (error) {

        }
      }


    } catch (error) {

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao fazer login. Tente novamente.');
    }
  };

  const logout = () => {
    // Disparar evento customizado para parar heartbeat
    window.dispatchEvent(new Event('user-logged-out'));

    if (!supabase) {
      setUser(null);
      setCurrentEstablishment(null);
      localStorage.removeItem('tms-user');
      localStorage.removeItem('tms-session');
      localStorage.removeItem('tms-current-establishment');
      window.location.reload();
      return;
    }

    supabase.auth.signOut().then(() => {
      setUser(null);
      setCurrentEstablishment(null);
      localStorage.removeItem('tms-user');
      localStorage.removeItem('tms-session');
      localStorage.removeItem('tms-current-establishment');
      window.location.reload();
    }).catch((error) => {

      setUser(null);
      setCurrentEstablishment(null);
      localStorage.removeItem('tms-user');
      localStorage.removeItem('tms-session');
      localStorage.removeItem('tms-current-establishment');
      window.location.reload();
    });
  };
  
  const selectOrganizationEnvironment = async (orgId: string, envId: string) => {
    try {
      if (!user || !supabase) {

        return;
      }

      // Armazenar org/env selecionados
      setSelectedOrgId(orgId);
      setSelectedEnvId(envId);
      localStorage.setItem('tms-selected-organization', orgId);
      localStorage.setItem('tms-selected-environment', envId);

      // Fechar seletor de org/env
      setShowOrgEnvSelector(false);

      // Buscar estabelecimentos da org/env selecionada
      const { data: dbEstablishments, error: establishmentsError } = await supabase
        .rpc('get_user_establishments', {
          p_user_email: user.email,
          p_organization_id: orgId,
          p_environment_id: envId
        });

      if (!dbEstablishments || dbEstablishments.length === 0) {

        throw new Error('Nenhum estabelecimento encontrado nesta organização/ambiente.');
      }

      // Mapear estabelecimentos
      const allowedEstablishments = dbEstablishments.map((est: any) => ({
        id: parseInt(est.codigo) || 1,
        codigo: est.codigo,
        cnpj: est.cnpj,
        inscricaoEstadual: est.inscricao_estadual,
        razaoSocial: est.razao_social,
        fantasia: est.fantasia || '',
        endereco: est.endereco,
        bairro: est.bairro,
        cep: est.cep,
        cidade: est.cidade,
        estado: est.estado,
        tipo: est.tipo,
        trackingPrefix: est.tracking_prefix,
        organizationId: est.organization_id,
        environmentId: est.environment_id,
        establishment_id: est.id
      }));

      setAvailableEstablishments(allowedEstablishments);

      // Se houver apenas 1 estabelecimento, selecionar automaticamente
      if (allowedEstablishments.length === 1) {
        const establishment = allowedEstablishments[0];
        setCurrentEstablishment(establishment);
        localStorage.setItem('tms-current-establishment', JSON.stringify(establishment));
        if (establishment.establishment_id) {
          localStorage.setItem('tms-selected-estab-id', establishment.establishment_id);
        }
        
        // CRITICAL: Update the session context immediately
        if (user && supabase) {
          await supabase.rpc('set_session_context', {
            p_organization_id: orgId,
            p_environment_id: envId,
            p_establishment_id: establishment.establishment_id || null
          });
        }
        
        setShowEstablishmentSelector(false);
      } else {
        // Mostrar seletor de estabelecimentos
        setShowEstablishmentSelector(true);
      }
    } catch (error) {

      throw error;
    }
  };

  const selectEstablishment = async (establishmentId: number) => {
    try {
      // Buscar o estabelecimento do array de disponíveis (já em camelCase)
      const establishment = availableEstablishments.find(est => est.id === establishmentId);

      if (!establishment) {
        return;
      }

      setCurrentEstablishment(establishment);
      localStorage.setItem('tms-current-establishment', JSON.stringify(establishment));
      if (establishment.establishment_id) {
        localStorage.setItem('tms-selected-estab-id', establishment.establishment_id);
      }
      
      // CRITICAL: Update the session context immediately
      if (user && supabase) {
        await supabase.rpc('set_session_context', {
          p_organization_id: establishment.organizationId || user.organization_id,
          p_environment_id: establishment.environmentId || user.environment_id,
          p_establishment_id: establishment.establishment_id || null
        });
      }

      setShowEstablishmentSelector(false);
      
      // Force reload to apply new context across all services
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
    }
  };
  
  const getUserEstablishments = (): Establishment[] => {
    // This function is deprecated and returns empty array
    // Use getUserEstablishmentsFromDB instead
    return [];
  };

  const getUserEstablishmentsFromDB = async (): Promise<Establishment[]> => {
    if (!user || !supabase) return [];

    try {
      const { data: dbEstablishments } = await supabase
        .from('establishments')
        .select('*')
        .order('codigo');

      if (!dbEstablishments) return [];

      // Convert database establishments to app format
      const formattedEstablishments = dbEstablishments.map(est => ({
        id: parseInt(est.codigo) || 1,
        codigo: est.codigo,
        cnpj: est.cnpj,
        inscricaoEstadual: est.inscricao_estadual,
        razaoSocial: est.razao_social,
        fantasia: est.fantasia,
        endereco: est.endereco,
        bairro: est.bairro,
        cep: est.cep,
        cidade: est.cidade,
        estado: est.estado,
        tipo: est.tipo as 'matriz' | 'filial',
        trackingPrefix: est.tracking_prefix
      }));

      // If user has specific establishment permissions, filter by those (by UUID)
      // Note: estabelecimentosPermitidos now contains UUIDs from database, not codes
      if (user.estabelecimentosPermitidos && user.estabelecimentosPermitidos.length > 0) {
        // Need to map back to find establishments by UUID from database
        const { data: userEstablishments } = await supabase
          .from('establishments')
          .select('*')
          .in('id', user.estabelecimentosPermitidos)
          .order('codigo');

        if (userEstablishments) {
          return userEstablishments.map(est => ({
            id: parseInt(est.codigo) || 1,
            codigo: est.codigo,
            cnpj: est.cnpj,
            inscricaoEstadual: est.inscricao_estadual,
            razaoSocial: est.razao_social,
            fantasia: est.fantasia,
            endereco: est.endereco,
            bairro: est.bairro,
            cep: est.cep,
            cidade: est.cidade,
            estado: est.estado,
            tipo: est.tipo as 'matriz' | 'filial',
            trackingPrefix: est.tracking_prefix
          }));
        }
      }

      // Otherwise, return all establishments (for admin users without restrictions)
      return formattedEstablishments;
    } catch (error) {

      return [];
    }
  };

  return {
    user,
    login,
    loginWithEnvironmentData,
    logout,
    currentEstablishment,
    showEstablishmentSelector,
    selectEstablishment,
    getUserEstablishments,
    getUserEstablishmentsFromDB,
    availableEstablishments,
    isLoading,
    // Novos retornos para Organization/Environment selector
    showOrgEnvSelector,
    selectOrganizationEnvironment,
    selectedOrgId,
    selectedEnvId
  };
};