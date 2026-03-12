import { supabase } from '../lib/supabase';
import { BusinessPartnerAddress } from '../types';

interface BusinessPartner {
  id?: string;
  name: string;
  document: string;
  document_type: 'cpf' | 'cnpj';
  email: string;
  phone: string;
  type: 'customer' | 'supplier' | 'both';
  status: 'active' | 'inactive';
  observations?: string;
  website?: string;
  tax_regime?: 'simples' | 'presumido' | 'real' | 'mei';
  credit_limit?: number;
  payment_terms?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  contacts?: BusinessPartnerContact[];
  addresses?: BusinessPartnerAddress[];
}

interface BusinessPartnerContact {
  id?: string;
  partner_id?: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  department?: string;
  is_primary: boolean;
  receive_email_notifications: boolean;
  receive_whatsapp_notifications: boolean;
  // Email notification preferences
  email_notify_order_created?: boolean;
  email_notify_order_invoiced?: boolean;
  email_notify_awaiting_pickup?: boolean;
  email_notify_picked_up?: boolean;
  email_notify_in_transit?: boolean;
  email_notify_out_for_delivery?: boolean;
  email_notify_delivered?: boolean;
  // WhatsApp notification preferences
  whatsapp_notify_order_created?: boolean;
  whatsapp_notify_order_invoiced?: boolean;
  whatsapp_notify_awaiting_pickup?: boolean;
  whatsapp_notify_picked_up?: boolean;
  whatsapp_notify_in_transit?: boolean;
  whatsapp_notify_out_for_delivery?: boolean;
  whatsapp_notify_delivered?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const businessPartnersService = {
  async getAll(): Promise<BusinessPartner[]> {
    try {


      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {

        return [];
      }

      const userData = JSON.parse(savedUser);
      const { organization_id, environment_id } = userData;



      if (!organization_id || !environment_id) {

        return [];
      }

      const { data, error } = await supabase
        .from('business_partners')
        .select(`
          *,
          contacts:business_partner_contacts(*),
          addresses:business_partner_addresses(*)
        `)
        .eq('organization_id', organization_id)
        .eq('environment_id', environment_id)
        .order('razao_social');

      if (error) {

        return [];
      }



      // Mapear campos do banco (português) para interface (inglês)
      const mapped = (data || []).map(item => ({
        id: item.id,
        name: item.razao_social || item.nome_fantasia || '',
        document: item.cpf_cnpj || '',
        document_type: item.tipo_pessoa === 'juridica' ? 'cnpj' as const : 'cpf' as const,
        email: item.email || '',
        phone: item.telefone || '',
        type: item.tipo === 'cliente' ? 'customer' as const :
              item.tipo === 'fornecedor' ? 'supplier' as const : 'both' as const,
        status: item.ativo ? 'active' as const : 'inactive' as const,
        observations: item.observacoes || '',
        website: item.website || '',
        tax_regime: item.regime_tributario || '',
        credit_limit: item.limite_credito || 0,
        payment_terms: item.prazo_pagamento || 30,
        created_at: item.created_at,
        updated_at: item.updated_at,
        contacts: item.contacts || [],
        addresses: (item.addresses || []).map(addr => ({
          ...addr,
          type: addr.address_type || addr.type
        }))
      }));

      return mapped;
    } catch (error) {

      return [];
    }
  },

  async getById(id: string): Promise<BusinessPartner | null> {
    try {
      const { data, error } = await supabase
        .from('business_partners')
        .select(`
          *,
          contacts:business_partner_contacts(*),
          addresses:business_partner_addresses(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {

        return null;
      }

      if (!data) return null;

      // Mapear campos do banco (português) para interface (inglês)
      return {
        id: data.id,
        name: data.razao_social || data.nome_fantasia || '',
        document: data.cpf_cnpj || '',
        document_type: data.tipo_pessoa === 'juridica' ? 'cnpj' : 'cpf',
        email: data.email || '',
        phone: data.telefone || '',
        type: data.tipo === 'cliente' ? 'customer' :
              data.tipo === 'fornecedor' ? 'supplier' : 'both',
        status: data.ativo ? 'active' : 'inactive',
        observations: data.observacoes || '',
        website: data.website || '',
        tax_regime: data.regime_tributario || '',
        credit_limit: data.limite_credito || 0,
        payment_terms: data.prazo_pagamento || 30,
        created_at: data.created_at,
        updated_at: data.updated_at,
        contacts: data.contacts || [],
        addresses: (data.addresses || []).map(addr => ({
          ...addr,
          type: addr.address_type || addr.type
        }))
      };
    } catch (error) {

      return null;
    }
  },

  async create(partner: BusinessPartner, userId: number): Promise<{ success: boolean; id?: string; error?: string }> {
    try {

      const { contacts, addresses, ...partnerData } = partner;

      // Buscar dados do usuário do localStorage
      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      const userData = JSON.parse(savedUser);
      const { organization_id, environment_id } = userData;

      if (!organization_id || !environment_id) {
        return { success: false, error: 'Organização ou ambiente não encontrado' };
      }



      // Verificar se o documento já existe
      const { data: existingPartner } = await supabase
        .from('business_partners')
        .select('id, razao_social, cpf_cnpj')
        .eq('cpf_cnpj', partnerData.document)
        .eq('organization_id', organization_id)
        .eq('environment_id', environment_id)
        .maybeSingle();

      if (existingPartner) {
        return {
          success: false,
          error: `Já existe um parceiro cadastrado com este ${partnerData.document_type === 'cpf' ? 'CPF' : 'CNPJ'}: ${existingPartner.razao_social}`
        };
      }

      // Mapear campos para o formato do banco (português)
      const partnerDbData = {
        organization_id,
        environment_id,
        codigo: partnerData.document || '', // temporário
        tipo: partnerData.type === 'customer' ? 'cliente' : partnerData.type === 'supplier' ? 'fornecedor' : 'ambos',
        tipo_pessoa: partnerData.document_type === 'cnpj' ? 'juridica' : 'fisica',
        razao_social: partnerData.name,
        cpf_cnpj: partnerData.document,
        email: partnerData.email,
        telefone: partnerData.phone,
        website: partnerData.website || null,
        regime_tributario: partnerData.tax_regime || null,
        prazo_pagamento: partnerData.payment_terms || 30,
        limite_credito: partnerData.credit_limit || 0,
        observacoes: partnerData.observations || null,
        ativo: partnerData.status === 'active'
      };



      const { data: newPartner, error: partnerError } = await supabase
        .from('business_partners')
        .insert(partnerDbData)
        .select()
        .single();

      if (partnerError) {

        if (partnerError.code === '23505') {
          return { success: false, error: 'Este documento já está cadastrado no sistema' };
        }
        return { success: false, error: partnerError.message };
      }



      if (contacts && contacts.length > 0) {

        const contactsToInsert = contacts.map(contact => {
          const { id: _, ...contactWithoutId } = contact;
          return {
            ...contactWithoutId,
            partner_id: newPartner.id,
            organization_id,
            environment_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        });

        const { error: contactsError } = await supabase
          .from('business_partner_contacts')
          .insert(contactsToInsert);

        if (contactsError) {

        } else {

        }
      }

      if (addresses && addresses.length > 0) {


        for (const address of addresses) {


          // Validar campos obrigatórios antes de inserir
          if (!address.type || !address.street || !address.city || !address.state || !address.zip_code) {

            return {
              success: false,
              error: 'Endereço incompleto. Verifique se todos os campos obrigatórios estão preenchidos (tipo, logradouro, cidade, estado, CEP).'
            };
          }

          // Garantir que o tipo é válido
          const validTypes = ['billing', 'delivery', 'correspondence', 'commercial'];
          if (!validTypes.includes(address.type)) {

            return {
              success: false,
              error: `Tipo de endereço inválido: ${address.type}. Deve ser um de: ${validTypes.join(', ')}`
            };
          }

          // Buscar city_id se cidade foi informada
          let city_id = null;
          if (address.city && address.state) {

            const { data: cityData } = await supabase
              .from('cities')
              .select('id')
              .ilike('nome', address.city)
              .limit(1)
              .maybeSingle();

            if (cityData) {
              city_id = cityData.id;

            } else {

            }
          }

          // Limpar e validar CEP
          const cleanZipCode = address.zip_code.replace(/\D/g, '');
          if (cleanZipCode.length !== 8) {

            return { success: false, error: 'CEP deve conter exatamente 8 dígitos' };
          }

          // Garantir que address_type nunca seja null ou undefined
          const addressType = address.type || 'commercial';

          const addressToInsert = {
            partner_id: newPartner.id,
            organization_id,
            environment_id,
            city_id,
            address_type: addressType,
            street: address.street.trim(),
            number: address.number?.trim() || null,
            complement: address.complement?.trim() || null,
            neighborhood: address.neighborhood?.trim() || null,
            city: address.city.trim(),
            state: address.state.trim().toUpperCase(),
            zip_code: cleanZipCode,
            country: address.country?.trim() || 'Brasil',
            is_primary: address.is_primary || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };



          const { error: addressError } = await supabase
            .from('business_partner_addresses')
            .insert(addressToInsert);

          if (addressError) {

            let errorMessage = 'Erro ao salvar endereço';

            if (addressError.code === '23502') {
              const match = addressError.message.match(/column "(.+?)"/);
              const columnName = match ? match[1] : 'desconhecido';
              errorMessage = `Campo obrigatório faltando no endereço: ${columnName}`;
            }

            return { success: false, error: errorMessage };
          } else {

          }
        }
      }


      return { success: true, id: newPartner.id };
    } catch (error) {

      return { success: false, error: 'Erro ao criar parceiro' };
    }
  },

  async update(id: string, partner: Partial<BusinessPartner>, userId: number): Promise<{ success: boolean; error?: string }> {
    try {



      const { contacts, addresses, ...partnerData } = partner;

      // Buscar dados do usuário do localStorage
      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      const userData = JSON.parse(savedUser);
      const { organization_id, environment_id } = userData;




      // Se o documento está sendo alterado, verificar se já existe
      if (partnerData.document) {
        const { data: existingPartner } = await supabase
          .from('business_partners')
          .select('id, razao_social, cpf_cnpj')
          .eq('cpf_cnpj', partnerData.document)
          .eq('organization_id', organization_id)
          .eq('environment_id', environment_id)
          .neq('id', id)
          .maybeSingle();

        if (existingPartner) {
          return {
            success: false,
            error: `Já existe um parceiro cadastrado com este ${partnerData.document_type === 'cpf' ? 'CPF' : 'CNPJ'}: ${existingPartner.razao_social}`
          };
        }
      }

      // Mapear campos para o formato do banco (português)
      const partnerDbData: any = {};
      if (partnerData.name) partnerDbData.razao_social = partnerData.name;
      if (partnerData.document) partnerDbData.cpf_cnpj = partnerData.document;
      if (partnerData.document_type) partnerDbData.tipo_pessoa = partnerData.document_type === 'cnpj' ? 'juridica' : 'fisica';
      if (partnerData.email) partnerDbData.email = partnerData.email;
      if (partnerData.phone) partnerDbData.telefone = partnerData.phone;
      if (partnerData.type) partnerDbData.tipo = partnerData.type === 'customer' ? 'cliente' : partnerData.type === 'supplier' ? 'fornecedor' : 'ambos';
      if (partnerData.status) partnerDbData.ativo = partnerData.status === 'active';
      if (partnerData.observations !== undefined) partnerDbData.observacoes = partnerData.observations;
      if (partnerData.website !== undefined) partnerDbData.website = partnerData.website;
      if (partnerData.tax_regime !== undefined) partnerDbData.regime_tributario = partnerData.tax_regime;
      if (partnerData.payment_terms !== undefined) partnerDbData.prazo_pagamento = partnerData.payment_terms;
      if (partnerData.credit_limit !== undefined) partnerDbData.limite_credito = partnerData.credit_limit;

      partnerDbData.updated_at = new Date().toISOString();


      const { error: partnerError } = await supabase
        .from('business_partners')
        .update(partnerDbData)
        .eq('id', id);

      if (partnerError) {

        if (partnerError.code === '23505') {
          return { success: false, error: 'Este documento já está cadastrado no sistema' };
        }
        return { success: false, error: partnerError.message };
      }


      if (contacts !== undefined) {


        const { error: deleteContactsError } = await supabase
          .from('business_partner_contacts')
          .delete()
          .eq('partner_id', id);

        if (deleteContactsError) {

        } else {

        }

        if (contacts.length > 0) {

          const contactsToInsert = contacts.map(contact => {
            const { id: _, ...contactWithoutId } = contact;
            return {
              ...contactWithoutId,
              partner_id: id,
              organization_id,
              environment_id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          });



          const { error: contactsError } = await supabase
            .from('business_partner_contacts')
            .insert(contactsToInsert);

          if (contactsError) {

          } else {

          }
        } else {

        }
      } else {

      }

      if (addresses !== undefined) {


        const { error: deleteAddressesError } = await supabase
          .from('business_partner_addresses')
          .delete()
          .eq('partner_id', id);

        if (deleteAddressesError) {

        } else {

        }

        if (addresses.length > 0) {


          for (const address of addresses) {
            // Buscar city_id se cidade foi informada
            let city_id = null;
            if (address.city && address.state) {

              const { data: cityData } = await supabase
                .from('cities')
                .select('id')
                .ilike('nome', address.city)
                .limit(1)
                .maybeSingle();

              if (cityData) {
                city_id = cityData.id;

              } else {

              }
            }

            const addressToInsert = {
              partner_id: id,
              organization_id,
              environment_id,
              city_id,
              address_type: address.type,
              street: address.street,
              number: address.number,
              complement: address.complement || null,
              neighborhood: address.neighborhood,
              city: address.city,
              state: address.state,
              zip_code: address.zip_code,
              country: address.country || 'Brasil',
              is_primary: address.is_primary || false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };



            const { error: addressError } = await supabase
              .from('business_partner_addresses')
              .insert(addressToInsert);

            if (addressError) {

            } else {

            }
          }
        } else {

        }
      } else {

      }


      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao atualizar parceiro' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {


      if (!id) {

        return { success: false, error: 'ID do parceiro não fornecido' };
      }

      // Verificar se o parceiro existe antes de tentar excluir

      const { data: existingPartner, error: checkError } = await supabase
        .from('business_partners')
        .select('id, razao_social, cpf_cnpj')
        .eq('id', id)
        .maybeSingle();

      if (checkError) {


        return { success: false, error: `Erro ao verificar parceiro: ${checkError.message}` };
      }

      if (!existingPartner) {

        return { success: false, error: 'Parceiro não encontrado no banco de dados' };
      }



      // Executar exclusão FORÇADA


      // Primeiro: deletar contatos relacionados

      const { error: contactsDeleteError } = await supabase
        .from('business_partner_contacts')
        .delete()
        .eq('partner_id', id);

      if (contactsDeleteError) {

      }

      // Segundo: deletar endereços relacionados

      const { error: addressesDeleteError } = await supabase
        .from('business_partner_addresses')
        .delete()
        .eq('partner_id', id);

      if (addressesDeleteError) {

      }

      // Terceiro: deletar o parceiro

      const { error: deleteError, data: deleteData, count } = await supabase
        .from('business_partners')
        .delete()
        .eq('id', id)
        .select();



      if (deleteError) {





        return { success: false, error: `Erro ao excluir: ${deleteError.message}` };
      }



      return { success: true };
    } catch (error) {


      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido ao excluir parceiro' };
    }
  },

  async search(searchTerm: string): Promise<BusinessPartner[]> {
    try {
      const { data, error } = await supabase
        .from('business_partners')
        .select(`
          *,
          contacts:business_partner_contacts(*),
          addresses:business_partner_addresses(*)
        `)
        .or(`razao_social.ilike.%${searchTerm}%,nome_fantasia.ilike.%${searchTerm}%,cpf_cnpj.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('razao_social');

      if (error) {

        return [];
      }

      // Mapear campos do banco (português) para interface (inglês)
      const mapped = (data || []).map(item => ({
        id: item.id,
        name: item.razao_social || item.nome_fantasia || '',
        document: item.cpf_cnpj || '',
        document_type: item.tipo_pessoa === 'juridica' ? 'cnpj' as const : 'cpf' as const,
        email: item.email || '',
        phone: item.telefone || '',
        type: item.tipo === 'cliente' ? 'customer' as const :
              item.tipo === 'fornecedor' ? 'supplier' as const : 'both' as const,
        status: item.ativo ? 'active' as const : 'inactive' as const,
        observations: item.observacoes || '',
        created_at: item.created_at,
        updated_at: item.updated_at,
        contacts: item.contacts || [],
        addresses: item.addresses || []
      }));

      return mapped;
    } catch (error) {

      return [];
    }
  },

  async getByType(type: 'customer' | 'supplier' | 'both'): Promise<BusinessPartner[]> {
    try {
      // Converter tipo inglês para português
      const tipoDb = type === 'customer' ? 'cliente' : type === 'supplier' ? 'fornecedor' : 'both';

      const { data, error } = await supabase
        .from('business_partners')
        .select(`
          *,
          contacts:business_partner_contacts(*),
          addresses:business_partner_addresses(*)
        `)
        .or(`tipo.eq.${tipoDb},tipo.eq.both`)
        .order('razao_social');

      if (error) {

        return [];
      }

      // Mapear campos do banco (português) para interface (inglês)
      const mapped = (data || []).map(item => ({
        id: item.id,
        name: item.razao_social || item.nome_fantasia || '',
        document: item.cpf_cnpj || '',
        document_type: item.tipo_pessoa === 'juridica' ? 'cnpj' as const : 'cpf' as const,
        email: item.email || '',
        phone: item.telefone || '',
        type: item.tipo === 'cliente' ? 'customer' as const :
              item.tipo === 'fornecedor' ? 'supplier' as const : 'both' as const,
        status: item.ativo ? 'active' as const : 'inactive' as const,
        observations: item.observacoes || '',
        created_at: item.created_at,
        updated_at: item.updated_at,
        contacts: item.contacts || [],
        addresses: item.addresses || []
      }));

      return mapped;
    } catch (error) {

      return [];
    }
  }
};
