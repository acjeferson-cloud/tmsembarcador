import { supabase } from '../lib/supabase';


import { BusinessPartner } from '../types';
import { TenantContextHelper } from '../utils/tenantContext';


export const businessPartnersService = {
  async getAll(): Promise<BusinessPartner[]> {
    try {


      const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId || !ctx.environmentId) {
        throw new Error('Sessão inválida ou contexto não selecionado.');
      }
      const userData = {
        organization_id: ctx.organizationId,
        environment_id: ctx.environmentId,
        establishment_id: ctx.establishmentId || null
      };
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
        documentType: item.tipo_pessoa === 'juridica' ? 'cnpj' as const : 'cpf' as const,
        email: item.email || '',
        phone: item.telefone || '',
        type: item.tipo === 'cliente' ? 'customer' as const :
              item.tipo === 'fornecedor' ? 'supplier' as const : 'both' as const,
        status: item.ativo ? 'active' as const : 'inactive' as const,
        observations: item.observacoes || '',
        website: item.website || '',
        taxRegime: item.regime_tributario || '',
        creditLimit: item.limite_credito || 0,
        paymentTerms: item.prazo_pagamento || 30,
        notes: item.notas_adicionais || '',
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        contacts: (item.contacts || []).map((c: any) => ({
          ...c,
          isPrimary: c.is_primary ?? c.isPrimary ?? false,
          receiveEmailNotifications: c.receive_email_notifications ?? c.receiveEmailNotifications ?? true,
          receiveWhatsappNotifications: c.receive_whatsapp_notifications ?? c.receiveWhatsappNotifications ?? true,
          emailNotifyOrderCreated: c.email_notify_order_created ?? c.emailNotifyOrderCreated ?? false,
          emailNotifyOrderInvoiced: c.email_notify_order_invoiced ?? c.emailNotifyOrderInvoiced ?? false,
          emailNotifyAwaitingPickup: c.email_notify_awaiting_pickup ?? c.emailNotifyAwaitingPickup ?? false,
          emailNotifyPickedUp: c.email_notify_picked_up ?? c.emailNotifyPickedUp ?? false,
          emailNotifyInTransit: c.email_notify_in_transit ?? c.emailNotifyInTransit ?? false,
          emailNotifyOutForDelivery: c.email_notify_out_for_delivery ?? c.emailNotifyOutForDelivery ?? false,
          emailNotifyDelivered: c.email_notify_delivered ?? c.emailNotifyDelivered ?? false,
          whatsappNotifyOrderCreated: c.whatsapp_notify_order_created ?? c.whatsappNotifyOrderCreated ?? false,
          whatsappNotifyOrderInvoiced: c.whatsapp_notify_order_invoiced ?? c.whatsappNotifyOrderInvoiced ?? false,
          whatsappNotifyAwaitingPickup: c.whatsapp_notify_awaiting_pickup ?? c.whatsappNotifyAwaitingPickup ?? false,
          whatsappNotifyPickedUp: c.whatsapp_notify_picked_up ?? c.whatsappNotifyPickedUp ?? false,
          whatsappNotifyInTransit: c.whatsapp_notify_in_transit ?? c.whatsappNotifyInTransit ?? false,
          whatsappNotifyOutForDelivery: c.whatsapp_notify_out_for_delivery ?? c.whatsappNotifyOutForDelivery ?? false,
          whatsappNotifyDelivered: c.whatsapp_notify_delivered ?? c.whatsappNotifyDelivered ?? false
        })),
        addresses: (item.addresses || []).map((addr: any) => ({
          ...addr,
          type: addr.address_type || addr.type,
          zipCode: addr.zip_code || addr.zipCode || '',
          isPrimary: addr.is_primary ?? addr.isPrimary ?? false
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
        documentType: data.tipo_pessoa === 'juridica' ? 'cnpj' : 'cpf',
        email: data.email || '',
        phone: data.telefone || '',
        type: data.tipo === 'cliente' ? 'customer' :
              data.tipo === 'fornecedor' ? 'supplier' : 'both',
        status: data.ativo ? 'active' : 'inactive',
        observations: data.observacoes || '',
        website: data.website || '',
        taxRegime: data.regime_tributario || '',
        creditLimit: data.limite_credito || 0,
        paymentTerms: data.prazo_pagamento || 30,
        notes: data.notas_adicionais || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        contacts: (data.contacts || []).map((c: any) => ({
          ...c,
          isPrimary: c.is_primary ?? c.isPrimary ?? false,
          receiveEmailNotifications: c.receive_email_notifications ?? c.receiveEmailNotifications ?? true,
          receiveWhatsappNotifications: c.receive_whatsapp_notifications ?? c.receiveWhatsappNotifications ?? true,
          emailNotifyOrderCreated: c.email_notify_order_created ?? c.emailNotifyOrderCreated ?? false,
          emailNotifyOrderInvoiced: c.email_notify_order_invoiced ?? c.emailNotifyOrderInvoiced ?? false,
          emailNotifyAwaitingPickup: c.email_notify_awaiting_pickup ?? c.emailNotifyAwaitingPickup ?? false,
          emailNotifyPickedUp: c.email_notify_picked_up ?? c.emailNotifyPickedUp ?? false,
          emailNotifyInTransit: c.email_notify_in_transit ?? c.emailNotifyInTransit ?? false,
          emailNotifyOutForDelivery: c.email_notify_out_for_delivery ?? c.emailNotifyOutForDelivery ?? false,
          emailNotifyDelivered: c.email_notify_delivered ?? c.emailNotifyDelivered ?? false,
          whatsappNotifyOrderCreated: c.whatsapp_notify_order_created ?? c.whatsappNotifyOrderCreated ?? false,
          whatsappNotifyOrderInvoiced: c.whatsapp_notify_order_invoiced ?? c.whatsappNotifyOrderInvoiced ?? false,
          whatsappNotifyAwaitingPickup: c.whatsapp_notify_awaiting_pickup ?? c.whatsappNotifyAwaitingPickup ?? false,
          whatsappNotifyPickedUp: c.whatsapp_notify_picked_up ?? c.whatsappNotifyPickedUp ?? false,
          whatsappNotifyInTransit: c.whatsapp_notify_in_transit ?? c.whatsappNotifyInTransit ?? false,
          whatsappNotifyOutForDelivery: c.whatsapp_notify_out_for_delivery ?? c.whatsappNotifyOutForDelivery ?? false,
          whatsappNotifyDelivered: c.whatsapp_notify_delivered ?? c.whatsappNotifyDelivered ?? false
        })),
        addresses: (data.addresses || []).map((addr: any) => ({
          ...addr,
          type: addr.address_type || addr.type,
          zipCode: addr.zip_code || addr.zipCode || '',
          isPrimary: addr.is_primary ?? addr.isPrimary ?? false
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
      const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId || !ctx.environmentId) {
        throw new Error('Sessão inválida ou contexto não selecionado.');
      }
      const userData = {
        organization_id: ctx.organizationId,
        environment_id: ctx.environmentId,
        establishment_id: ctx.establishmentId || null
      };
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
          error: `Já existe um parceiro cadastrado com este ${partnerData.documentType === 'cpf' ? 'CPF' : 'CNPJ'}: ${existingPartner.razao_social}`
        };
      }

      // Mapear campos para o formato do banco (português)
      const partnerDbData = {
        organization_id,
        environment_id,
        codigo: partnerData.document || '', // temporário
        tipo: partnerData.type === 'customer' ? 'cliente' : partnerData.type === 'supplier' ? 'fornecedor' : 'ambos',
        tipo_pessoa: partnerData.documentType === 'cnpj' ? 'juridica' : 'fisica',
        razao_social: partnerData.name,
        cpf_cnpj: partnerData.document,
        email: partnerData.email,
        telefone: partnerData.phone,
        website: partnerData.website || null,
        regime_tributario: partnerData.taxRegime || null,
        prazo_pagamento: partnerData.paymentTerms || 30,
        limite_credito: partnerData.creditLimit || 0,
        observacoes: partnerData.observations || null,
        notas_adicionais: partnerData.notes || null,
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
          const {
            id: _,
            isPrimary,
            receiveEmailNotifications,
            receiveWhatsappNotifications,
            emailNotifyOrderCreated,
            emailNotifyOrderInvoiced,
            emailNotifyAwaitingPickup,
            emailNotifyPickedUp,
            emailNotifyInTransit,
            emailNotifyOutForDelivery,
            emailNotifyDelivered,
            whatsappNotifyOrderCreated,
            whatsappNotifyOrderInvoiced,
            whatsappNotifyAwaitingPickup,
            whatsappNotifyPickedUp,
            whatsappNotifyInTransit,
            whatsappNotifyOutForDelivery,
            whatsappNotifyDelivered,
            ...contactWithoutId
          } = contact;
          return {
            ...contactWithoutId,
            is_primary: isPrimary ?? false,
            receive_email_notifications: receiveEmailNotifications ?? true,
            receive_whatsapp_notifications: receiveWhatsappNotifications ?? true,
            email_notify_order_created: emailNotifyOrderCreated,
            email_notify_order_invoiced: emailNotifyOrderInvoiced,
            email_notify_awaiting_pickup: emailNotifyAwaitingPickup,
            email_notify_picked_up: emailNotifyPickedUp,
            email_notify_in_transit: emailNotifyInTransit,
            email_notify_out_for_delivery: emailNotifyOutForDelivery,
            email_notify_delivered: emailNotifyDelivered,
            whatsapp_notify_order_created: whatsappNotifyOrderCreated,
            whatsapp_notify_order_invoiced: whatsappNotifyOrderInvoiced,
            whatsapp_notify_awaiting_pickup: whatsappNotifyAwaitingPickup,
            whatsapp_notify_picked_up: whatsappNotifyPickedUp,
            whatsapp_notify_in_transit: whatsappNotifyInTransit,
            whatsapp_notify_out_for_delivery: whatsappNotifyOutForDelivery,
            whatsapp_notify_delivered: whatsappNotifyDelivered,
            partner_id: newPartner.id,
            organization_id,
            environment_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        });

        const { error: contactsError } = await (supabase as any)
          .from('business_partner_contacts')
          .insert(contactsToInsert as any);

        if (contactsError) {

        } else {

        }
      }

      if (addresses && addresses.length > 0) {


        for (const address of addresses) {


          // Validar campos obrigatórios antes de inserir
          if (!address.type || !address.street || !address.city || !address.state || !address.zipCode) {

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
          const cleanZipCode = address.zipCode.replace(/\D/g, '');
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
            address_type: addressType as any,
            street: address.street.trim(),
            number: address.number?.trim() || null,
            complement: address.complement?.trim() || null,
            neighborhood: address.neighborhood?.trim() || null,
            city: address.city.trim(),
            state: address.state.trim().toUpperCase(),
            zip_code: cleanZipCode,
            country: address.country?.trim() || 'Brasil',
            is_primary: address.isPrimary || false,
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
      const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId || !ctx.environmentId) {
        throw new Error('Sessão inválida ou contexto não selecionado.');
      }
      const userData = {
        organization_id: ctx.organizationId,
        environment_id: ctx.environmentId,
        establishment_id: ctx.establishmentId || null
      };
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
            error: `Já existe um parceiro cadastrado com este ${partnerData.documentType === 'cpf' ? 'CPF' : 'CNPJ'}: ${existingPartner.razao_social}`
          };
        }
      }

      // Mapear campos para o formato do banco (português)
      const partnerDbData: any = {};
      if (partnerData.name) partnerDbData.razao_social = partnerData.name;
      if (partnerData.document) partnerDbData.cpf_cnpj = partnerData.document;
      if (partnerData.documentType) partnerDbData.tipo_pessoa = partnerData.documentType === 'cnpj' ? 'juridica' : 'fisica';
      if (partnerData.email) partnerDbData.email = partnerData.email;
      if (partnerData.phone) partnerDbData.telefone = partnerData.phone;
      if (partnerData.type) partnerDbData.tipo = partnerData.type === 'customer' ? 'cliente' : partnerData.type === 'supplier' ? 'fornecedor' : 'ambos';
      if (partnerData.status) partnerDbData.ativo = partnerData.status === 'active';
      if (partnerData.observations !== undefined) partnerDbData.observacoes = partnerData.observations;
      if (partnerData.website !== undefined) partnerDbData.website = partnerData.website;
      if (partnerData.taxRegime !== undefined) partnerDbData.regime_tributario = partnerData.taxRegime;
      if (partnerData.paymentTerms !== undefined) partnerDbData.prazo_pagamento = partnerData.paymentTerms;
      if (partnerData.creditLimit !== undefined) partnerDbData.limite_credito = partnerData.creditLimit;
      if (partnerData.notes !== undefined) partnerDbData.notas_adicionais = partnerData.notes;

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
            const {
              id: _,
              isPrimary,
              receiveEmailNotifications,
              receiveWhatsappNotifications,
              emailNotifyOrderCreated,
              emailNotifyOrderInvoiced,
              emailNotifyAwaitingPickup,
              emailNotifyPickedUp,
              emailNotifyInTransit,
              emailNotifyOutForDelivery,
              emailNotifyDelivered,
              whatsappNotifyOrderCreated,
              whatsappNotifyOrderInvoiced,
              whatsappNotifyAwaitingPickup,
              whatsappNotifyPickedUp,
              whatsappNotifyInTransit,
              whatsappNotifyOutForDelivery,
              whatsappNotifyDelivered,
              ...contactWithoutId
            } = contact;
            return {
              ...contactWithoutId,
              is_primary: isPrimary ?? false,
              receive_email_notifications: receiveEmailNotifications ?? true,
              receive_whatsapp_notifications: receiveWhatsappNotifications ?? true,
              email_notify_order_created: emailNotifyOrderCreated,
              email_notify_order_invoiced: emailNotifyOrderInvoiced,
              email_notify_awaiting_pickup: emailNotifyAwaitingPickup,
              email_notify_picked_up: emailNotifyPickedUp,
              email_notify_in_transit: emailNotifyInTransit,
              email_notify_out_for_delivery: emailNotifyOutForDelivery,
              email_notify_delivered: emailNotifyDelivered,
              whatsapp_notify_order_created: whatsappNotifyOrderCreated,
              whatsapp_notify_order_invoiced: whatsappNotifyOrderInvoiced,
              whatsapp_notify_awaiting_pickup: whatsappNotifyAwaitingPickup,
              whatsapp_notify_picked_up: whatsappNotifyPickedUp,
              whatsapp_notify_in_transit: whatsappNotifyInTransit,
              whatsapp_notify_out_for_delivery: whatsappNotifyOutForDelivery,
              whatsapp_notify_delivered: whatsappNotifyDelivered,
              partner_id: id,
              organization_id,
              environment_id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          });



          const { error: contactsError } = await (supabase as any)
            .from('business_partner_contacts')
            .insert(contactsToInsert as any);

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
              address_type: address.type as any,
              street: address.street,
              number: address.number,
              complement: address.complement || null,
              neighborhood: address.neighborhood,
              city: address.city,
              state: address.state,
              zip_code: address.zipCode,
              country: address.country || 'Brasil',
              is_primary: address.isPrimary || false,
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
        if (deleteError.code === '23503') {
          return { success: false, error: 'Não é possível excluir este parceiro pois ele está vinculado a um ou mais pedidos de frete ou cadastros.' };
        }
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
        documentType: item.tipo_pessoa === 'juridica' ? 'cnpj' as const : 'cpf' as const,
        email: item.email || '',
        phone: item.telefone || '',
        type: item.tipo === 'cliente' ? 'customer' as const :
              item.tipo === 'fornecedor' ? 'supplier' as const : 'both' as const,
        status: item.ativo ? 'active' as const : 'inactive' as const,
        observations: item.observacoes || '',
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        contacts: (item.contacts || []).map((c: any) => ({
          ...c,
          isPrimary: c.is_primary ?? c.isPrimary ?? false,
          receiveEmailNotifications: c.receive_email_notifications ?? c.receiveEmailNotifications ?? true,
          receiveWhatsappNotifications: c.receive_whatsapp_notifications ?? c.receiveWhatsappNotifications ?? true,
          emailNotifyOrderCreated: c.email_notify_order_created ?? c.emailNotifyOrderCreated ?? false,
          emailNotifyOrderInvoiced: c.email_notify_order_invoiced ?? c.emailNotifyOrderInvoiced ?? false,
          emailNotifyAwaitingPickup: c.email_notify_awaiting_pickup ?? c.emailNotifyAwaitingPickup ?? false,
          emailNotifyPickedUp: c.email_notify_picked_up ?? c.emailNotifyPickedUp ?? false,
          emailNotifyInTransit: c.email_notify_in_transit ?? c.emailNotifyInTransit ?? false,
          emailNotifyOutForDelivery: c.email_notify_out_for_delivery ?? c.emailNotifyOutForDelivery ?? false,
          emailNotifyDelivered: c.email_notify_delivered ?? c.emailNotifyDelivered ?? false,
          whatsappNotifyOrderCreated: c.whatsapp_notify_order_created ?? c.whatsappNotifyOrderCreated ?? false,
          whatsappNotifyOrderInvoiced: c.whatsapp_notify_order_invoiced ?? c.whatsappNotifyOrderInvoiced ?? false,
          whatsappNotifyAwaitingPickup: c.whatsapp_notify_awaiting_pickup ?? c.whatsappNotifyAwaitingPickup ?? false,
          whatsappNotifyPickedUp: c.whatsapp_notify_picked_up ?? c.whatsappNotifyPickedUp ?? false,
          whatsappNotifyInTransit: c.whatsapp_notify_in_transit ?? c.whatsappNotifyInTransit ?? false,
          whatsappNotifyOutForDelivery: c.whatsapp_notify_out_for_delivery ?? c.whatsappNotifyOutForDelivery ?? false,
          whatsappNotifyDelivered: c.whatsapp_notify_delivered ?? c.whatsappNotifyDelivered ?? false
        })),
        addresses: (item.addresses || []).map((addr: any) => ({
          ...addr,
          type: addr.address_type || addr.type,
          zipCode: addr.zip_code || '',
          isPrimary: addr.is_primary || false
        }))
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
        documentType: item.tipo_pessoa === 'juridica' ? 'cnpj' as const : 'cpf' as const,
        email: item.email || '',
        phone: item.telefone || '',
        type: item.tipo === 'cliente' ? 'customer' as const :
              item.tipo === 'fornecedor' ? 'supplier' as const : 'both' as const,
        status: item.ativo ? 'active' as const : 'inactive' as const,
        observations: item.observacoes || '',
        website: item.website || '',
        taxRegime: item.regime_tributario || '',
        creditLimit: item.limite_credito || 0,
        paymentTerms: item.prazo_pagamento || 30,
        notes: item.notas_adicionais || '',
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        contacts: (item.contacts || []).map((c: any) => ({
          ...c,
          isPrimary: c.is_primary ?? c.isPrimary ?? false,
          receiveEmailNotifications: c.receive_email_notifications ?? c.receiveEmailNotifications ?? true,
          receiveWhatsappNotifications: c.receive_whatsapp_notifications ?? c.receiveWhatsappNotifications ?? true
        })),
        addresses: (item.addresses || []).map((addr: any) => ({
          ...addr,
          type: addr.address_type || addr.type,
          zipCode: addr.zip_code || addr.zipCode || '',
          isPrimary: addr.is_primary ?? addr.isPrimary ?? false
        }))
      }));

      return mapped;
    } catch (error) {

      return [];
    }
  }
};
