/*
  # Adicionar campos faltantes na tabela business_partner_contacts

  1. Problema
    - A interface TypeScript define muitos campos que não existem na tabela
    - Tentativa de INSERT falha porque campos como position, department, receive_email_notifications, etc. não existem
    - Campo "role" existe mas a interface usa "position"

  2. Solução
    - Adicionar todos os campos de notificação usados pela interface
    - Manter compatibilidade com código existente
    - Todos os campos de notificação são opcionais (nullable)

  3. Campos adicionados
    - position: cargo do contato
    - department: departamento
    - receive_email_notifications: se recebe notificações por email
    - receive_whatsapp_notifications: se recebe notificações por WhatsApp
    - email_notify_* : preferências de notificação por email para cada status
    - whatsapp_notify_*: preferências de notificação por WhatsApp para cada status
*/

-- Adicionar campos de cargo e departamento
ALTER TABLE business_partner_contacts
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS department text;

-- Adicionar campos de preferências gerais de notificação
ALTER TABLE business_partner_contacts
  ADD COLUMN IF NOT EXISTS receive_email_notifications boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS receive_whatsapp_notifications boolean DEFAULT false;

-- Adicionar campos de preferências detalhadas de notificação por EMAIL
ALTER TABLE business_partner_contacts
  ADD COLUMN IF NOT EXISTS email_notify_order_created boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_notify_order_invoiced boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_notify_awaiting_pickup boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_notify_picked_up boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_notify_in_transit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_notify_out_for_delivery boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_notify_delivered boolean DEFAULT false;

-- Adicionar campos de preferências detalhadas de notificação por WHATSAPP
ALTER TABLE business_partner_contacts
  ADD COLUMN IF NOT EXISTS whatsapp_notify_order_created boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_notify_order_invoiced boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_notify_awaiting_pickup boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_notify_picked_up boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_notify_in_transit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_notify_out_for_delivery boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_notify_delivered boolean DEFAULT false;

-- Comentários explicativos
COMMENT ON COLUMN business_partner_contacts.position IS 'Cargo/função do contato na empresa';
COMMENT ON COLUMN business_partner_contacts.department IS 'Departamento onde o contato trabalha';
COMMENT ON COLUMN business_partner_contacts.receive_email_notifications IS 'Se o contato deseja receber notificações por email';
COMMENT ON COLUMN business_partner_contacts.receive_whatsapp_notifications IS 'Se o contato deseja receber notificações por WhatsApp';
