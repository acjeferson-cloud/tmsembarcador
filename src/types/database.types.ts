/**
 * TMS EMBARCADOR - LOG AXIS
 * Database TypeScript Types
 * Auto-generated from database schema
 */

export interface Database {
  public: {
    Tables: {
      saas_plans: {
        Row: SaasPlan;
        Insert: SaasPlanInsert;
        Update: SaasPlanUpdate;
      };
      saas_organizations: {
        Row: SaasOrganization;
        Insert: SaasOrganizationInsert;
        Update: SaasOrganizationUpdate;
      };
      saas_environments: {
        Row: SaasEnvironment;
        Insert: SaasEnvironmentInsert;
        Update: SaasEnvironmentUpdate;
      };
      saas_admins: {
        Row: SaasAdmin;
        Insert: SaasAdminInsert;
        Update: SaasAdminUpdate;
      };
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      establishments: {
        Row: Establishment;
        Insert: EstablishmentInsert;
        Update: EstablishmentUpdate;
      };
      user_establishments: {
        Row: UserEstablishment;
        Insert: UserEstablishmentInsert;
        Update: UserEstablishmentUpdate;
      };
      carriers: {
        Row: Carrier;
        Insert: CarrierInsert;
        Update: CarrierUpdate;
      };
      business_partners: {
        Row: BusinessPartner;
        Insert: BusinessPartnerInsert;
        Update: BusinessPartnerUpdate;
      };
      rejection_reasons: {
        Row: RejectionReason;
        Insert: RejectionReasonInsert;
        Update: RejectionReasonUpdate;
      };
      occurrences: {
        Row: Occurrence;
        Insert: OccurrenceInsert;
        Update: OccurrenceUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      invoices: {
        Row: Invoice;
        Insert: InvoiceInsert;
        Update: InvoiceUpdate;
      };
      ctes: {
        Row: Cte;
        Insert: CteInsert;
        Update: CteUpdate;
      };
      pickups: {
        Row: Pickup;
        Insert: PickupInsert;
        Update: PickupUpdate;
      };
      pickup_invoices: {
        Row: PickupInvoice;
        Insert: PickupInvoiceInsert;
        Update: PickupInvoiceUpdate;
      };
      freight_rates: {
        Row: FreightRate;
        Insert: FreightRateInsert;
        Update: FreightRateUpdate;
      };
      freight_rate_values: {
        Row: FreightRateValue;
        Insert: FreightRateValueInsert;
        Update: FreightRateValueUpdate;
      };
      freight_rate_cities: {
        Row: FreightRateCity;
        Insert: FreightRateCityInsert;
        Update: FreightRateCityUpdate;
      };
      additional_fees: {
        Row: AdditionalFee;
        Insert: AdditionalFeeInsert;
        Update: AdditionalFeeUpdate;
      };
      restricted_items: {
        Row: RestrictedItem;
        Insert: RestrictedItemInsert;
        Update: RestrictedItemUpdate;
      };
      freight_quotes: {
        Row: FreightQuote;
        Insert: FreightQuoteInsert;
        Update: FreightQuoteUpdate;
      };
      whatsapp_config: {
        Row: WhatsappConfig;
        Insert: WhatsappConfigInsert;
        Update: WhatsappConfigUpdate;
      };
      whatsapp_transactions: {
        Row: WhatsappTransaction;
        Insert: WhatsappTransactionInsert;
        Update: WhatsappTransactionUpdate;
      };
      openai_config: {
        Row: OpenAIConfig;
        Insert: OpenAIConfigInsert;
        Update: OpenAIConfigUpdate;
      };
      openai_transactions: {
        Row: OpenAITransaction;
        Insert: OpenAITransactionInsert;
        Update: OpenAITransactionUpdate;
      };
      google_maps_config: {
        Row: GoogleMapsConfig;
        Insert: GoogleMapsConfigInsert;
        Update: GoogleMapsConfigUpdate;
      };
      google_maps_transactions: {
        Row: GoogleMapsTransaction;
        Insert: GoogleMapsTransactionInsert;
        Update: GoogleMapsTransactionUpdate;
      };
      nps_config: {
        Row: NpsConfig;
        Insert: NpsConfigInsert;
        Update: NpsConfigUpdate;
      };
      nps_surveys: {
        Row: NpsSurvey;
        Insert: NpsSurveyInsert;
        Update: NpsSurveyUpdate;
      };
      nps_responses: {
        Row: NpsResponse;
        Insert: NpsResponseInsert;
        Update: NpsResponseUpdate;
      };
      email_outgoing_config: {
        Row: EmailOutgoingConfig;
        Insert: EmailOutgoingConfigInsert;
        Update: EmailOutgoingConfigUpdate;
      };
      countries: {
        Row: Country;
        Insert: CountryInsert;
        Update: CountryUpdate;
      };
      states: {
        Row: State;
        Insert: StateInsert;
        Update: StateUpdate;
      };
      cities: {
        Row: City;
        Insert: CityInsert;
        Update: CityUpdate;
      };
      holidays: {
        Row: Holiday;
        Insert: HolidayInsert;
        Update: HolidayUpdate;
      };
      change_logs: {
        Row: ChangeLog;
        Insert: ChangeLogInsert;
        Update: ChangeLogUpdate;
      };
      api_keys: {
        Row: ApiKey;
        Insert: ApiKeyInsert;
        Update: ApiKeyUpdate;
      };
      licenses: {
        Row: License;
        Insert: LicenseInsert;
        Update: LicenseUpdate;
      };
      white_label_config: {
        Row: WhiteLabelConfig;
        Insert: WhiteLabelConfigInsert;
        Update: WhiteLabelConfigUpdate;
      };
    };
    Functions: {
      validate_user_credentials: {
        Args: { p_email: string; p_senha: string };
        Returns: Array<{
          user_id: string;
          organization_id: string;
          environment_id: string;
          nome: string;
          tipo: string;
          bloqueado: boolean;
        }>;
      };
      check_user_blocked: {
        Args: { p_email: string };
        Returns: boolean;
      };
      increment_login_attempts: {
        Args: { p_email: string };
        Returns: void;
      };
      reset_login_attempts: {
        Args: { p_email: string; p_ip?: string };
        Returns: void;
      };
      get_user_organizations_environments: {
        Args: { p_email: string };
        Returns: Array<{
          organization_id: string;
          organization_codigo: string;
          organization_nome: string;
          environment_id: string;
          environment_codigo: string;
          environment_nome: string;
          environment_tipo: string;
        }>;
      };
      get_user_establishments: {
        Args: {
          p_user_id: string;
          p_organization_id: string;
          p_environment_id: string;
        };
        Returns: Array<{
          establishment_id: string;
          codigo: string;
          nome_fantasia: string;
          is_default: boolean;
        }>;
      };
    };
  };
}

// ============================================================================
// BASE TYPES
// ============================================================================

export interface SaasPlan {
  id: string;
  nome: string;
  descricao: string | null;
  valor_mensal: number;
  max_users: number;
  max_establishments: number;
  features: Record<string, any>;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type SaasPlanInsert = Omit<SaasPlan, 'id' | 'created_at' | 'updated_at'>;
export type SaasPlanUpdate = Partial<SaasPlanInsert>;

export interface SaasOrganization {
  id: string;
  codigo: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  status: 'ativo' | 'inativo' | 'suspenso' | 'cancelado';
  plan_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type SaasOrganizationInsert = Omit<SaasOrganization, 'id' | 'created_at' | 'updated_at'>;
export type SaasOrganizationUpdate = Partial<SaasOrganizationInsert>;

export interface SaasEnvironment {
  id: string;
  organization_id: string;
  codigo: string;
  nome: string;
  tipo: 'producao' | 'homologacao' | 'teste' | 'desenvolvimento';
  status: 'ativo' | 'inativo';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type SaasEnvironmentInsert = Omit<SaasEnvironment, 'id' | 'created_at' | 'updated_at'>;
export type SaasEnvironmentUpdate = Partial<SaasEnvironmentInsert>;

export interface SaasAdmin {
  id: string;
  email: string;
  senha_hash: string;
  nome: string;
  ativo: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export type SaasAdminInsert = Omit<SaasAdmin, 'id' | 'created_at' | 'updated_at'>;
export type SaasAdminUpdate = Partial<SaasAdminInsert>;

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  email: string;
  senha_hash: string;
  nome: string;
  tipo: 'admin' | 'user' | 'viewer' | 'saas_admin';
  ativo: boolean;
  bloqueado: boolean;
  tentativas_login: number;
  ultimo_login: string | null;
  ultimo_ip: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type UserUpdate = Partial<UserInsert>;

export interface Establishment {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  codigo: string;
  nome_fantasia: string;
  razao_social: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  tipo: 'matriz' | 'filial';
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type EstablishmentInsert = Omit<Establishment, 'id' | 'created_at' | 'updated_at'>;
export type EstablishmentUpdate = Partial<EstablishmentInsert>;

export interface UserEstablishment {
  id: string;
  user_id: string;
  establishment_id: string;
  is_default: boolean;
  created_at: string;
}

export type UserEstablishmentInsert = Omit<UserEstablishment, 'id' | 'created_at'>;
export type UserEstablishmentUpdate = Partial<UserEstablishmentInsert>;

// ============================================================================
// REGISTRATION TYPES
// ============================================================================

export interface Carrier {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  codigo: string;
  nome_fantasia: string;
  razao_social: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string;
  telefone: string | null;
  email: string | null;
  website: string | null;
  tipo_servico: string | null;
  prazo_coleta: number;
  prazo_entrega: number;
  nps_interno: number | null;
  ativo: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type CarrierInsert = Omit<Carrier, 'id' | 'created_at' | 'updated_at'>;
export type CarrierUpdate = Partial<CarrierInsert>;

export interface BusinessPartner {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  codigo: string;
  tipo: 'cliente' | 'fornecedor' | 'ambos';
  tipo_pessoa: 'fisica' | 'juridica';
  nome_fantasia: string | null;
  razao_social: string;
  cpf_cnpj: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string;
  telefone: string | null;
  email: string | null;
  contato_nome: string | null;
  contato_telefone: string | null;
  contato_email: string | null;
  limite_credito: number;
  observacoes: string | null;
  ativo: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type BusinessPartnerInsert = Omit<BusinessPartner, 'id' | 'created_at' | 'updated_at'>;
export type BusinessPartnerUpdate = Partial<BusinessPartnerInsert>;

export interface RejectionReason {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  codigo: string;
  descricao: string;
  tipo: 'fatura' | 'cte' | 'coleta' | 'entrega' | 'geral' | null;
  requer_foto: boolean;
  requer_assinatura: boolean;
  requer_observacao: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type RejectionReasonInsert = Omit<RejectionReason, 'id' | 'created_at' | 'updated_at'>;
export type RejectionReasonUpdate = Partial<RejectionReasonInsert>;

export interface Occurrence {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  codigo: string;
  descricao: string;
  tipo: 'coleta' | 'transporte' | 'entrega' | 'geral' | null;
  impacta_prazo: boolean;
  dias_impacto: number;
  notifica_cliente: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type OccurrenceInsert = Omit<Occurrence, 'id' | 'created_at' | 'updated_at'>;
export type OccurrenceUpdate = Partial<OccurrenceInsert>;

// ============================================================================
// OPERATIONAL TYPES
// ============================================================================

export interface Order {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  establishment_id: string | null;
  numero_pedido: string;
  tipo: 'entrada' | 'saida' | 'transferencia';
  business_partner_id: string | null;
  carrier_id: string | null;
  status: 'pendente' | 'processando' | 'coletado' | 'em_transito' | 'entregue' | 'cancelado';
  data_pedido: string;
  data_prevista_coleta: string | null;
  data_prevista_entrega: string | null;
  data_coleta_realizada: string | null;
  data_entrega_realizada: string | null;
  origem_cep: string | null;
  origem_logradouro: string | null;
  origem_numero: string | null;
  origem_complemento: string | null;
  origem_bairro: string | null;
  origem_cidade: string | null;
  origem_estado: string | null;
  origem_pais: string;
  destino_cep: string | null;
  destino_logradouro: string | null;
  destino_numero: string | null;
  destino_complemento: string | null;
  destino_bairro: string | null;
  destino_cidade: string | null;
  destino_estado: string | null;
  destino_pais: string;
  valor_mercadoria: number;
  valor_frete: number;
  valor_seguro: number;
  valor_outras_despesas: number;
  valor_total: number;
  peso_bruto: number;
  peso_liquido: number;
  quantidade_volumes: number;
  observacoes: string | null;
  codigo_rastreio: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at'>;
export type OrderUpdate = Partial<OrderInsert>;

export interface Invoice {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  establishment_id: string | null;
  order_id: string | null;
  numero: string;
  serie: string | null;
  chave_acesso: string | null;
  tipo: 'entrada' | 'saida';
  modelo: string;
  data_emissao: string;
  data_saida: string | null;
  emitente_cnpj: string | null;
  emitente_nome: string | null;
  emitente_ie: string | null;
  destinatario_cpf_cnpj: string | null;
  destinatario_nome: string | null;
  destinatario_ie: string | null;
  destinatario_logradouro: string | null;
  destinatario_numero: string | null;
  destinatario_complemento: string | null;
  destinatario_bairro: string | null;
  destinatario_cidade: string | null;
  destinatario_estado: string | null;
  destinatario_cep: string | null;
  destinatario_pais: string;
  valor_produtos: number;
  valor_frete: number;
  valor_seguro: number;
  valor_desconto: number;
  valor_outras_despesas: number;
  valor_total: number;
  valor_icms: number;
  valor_ipi: number;
  valor_pis: number;
  valor_cofins: number;
  peso_bruto: number;
  peso_liquido: number;
  quantidade_volumes: number;
  xml_content: string | null;
  xml_processado: boolean;
  status: 'pendente' | 'processada' | 'em_coleta' | 'coletada' | 'em_transito' | 'entregue' | 'cancelada' | 'rejeitada';
  direction: 'outbound' | 'inbound' | 'reverse';
  original_invoice_id: string | null;
  observacoes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;
export type InvoiceUpdate = Partial<InvoiceInsert>;

export interface Cte {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  establishment_id: string | null;
  order_id: string | null;
  invoice_id: string | null;
  carrier_id: string | null;
  numero: string;
  serie: string | null;
  chave_acesso: string | null;
  modelo: string;
  tipo_servico: string;
  data_emissao: string;
  emitente_cnpj: string | null;
  emitente_nome: string | null;
  emitente_ie: string | null;
  remetente_cpf_cnpj: string | null;
  remetente_nome: string | null;
  destinatario_cpf_cnpj: string | null;
  destinatario_nome: string | null;
  valor_servico: number;
  valor_receber: number;
  valor_mercadoria: number;
  peso_bruto: number;
  peso_cubado: number;
  quantidade_volumes: number;
  status: 'pendente' | 'autorizado' | 'cancelado' | 'denegado' | 'rejeitado';
  protocolo_autorizacao: string | null;
  data_autorizacao: string | null;
  xml_content: string | null;
  xml_processado: boolean;
  divergencia_valores: boolean;
  valor_divergencia: number;
  motivo_divergencia: string | null;
  direction: 'outbound' | 'inbound' | 'reverse';
  observacoes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type CteInsert = Omit<Cte, 'id' | 'created_at' | 'updated_at'>;
export type CteUpdate = Partial<CteInsert>;

export interface Pickup {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  establishment_id: string | null;
  carrier_id: string | null;
  numero_coleta: string;
  protocolo_transportadora: string | null;
  data_solicitacao: string;
  data_agendada: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  data_realizada: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string;
  contato_nome: string | null;
  contato_telefone: string | null;
  contato_email: string | null;
  quantidade_volumes: number;
  peso_total: number;
  valor_total: number;
  status: 'solicitada' | 'agendada' | 'em_coleta' | 'coletada' | 'cancelada' | 'rejeitada';
  comprovante_foto: string | null;
  comprovante_assinatura: string | null;
  comprovante_nome: string | null;
  comprovante_documento: string | null;
  comprovante_observacoes: string | null;
  observacoes: string | null;
  rejection_reason_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type PickupInsert = Omit<Pickup, 'id' | 'created_at' | 'updated_at'>;
export type PickupUpdate = Partial<PickupInsert>;

export interface PickupInvoice {
  id: string;
  pickup_id: string;
  invoice_id: string;
  created_at: string;
}

export type PickupInvoiceInsert = Omit<PickupInvoice, 'id' | 'created_at'>;
export type PickupInvoiceUpdate = Partial<PickupInvoiceInsert>;

// ============================================================================
// FREIGHT TYPES
// ============================================================================

export interface FreightRate {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  establishment_id: string | null;
  carrier_id: string | null;
  nome: string;
  codigo: string;
  tipo: 'peso' | 'valor' | 'volume' | 'misto';
  data_inicio: string;
  data_fim: string | null;
  peso_minimo: number;
  peso_maximo: number | null;
  valor_minimo: number;
  cubagem_fator: number;
  aliquota_icms: number;
  aliquota_pedagio: number;
  aliquota_gris: number;
  aliquota_tde: number;
  ativa: boolean;
  observacoes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type FreightRateInsert = Omit<FreightRate, 'id' | 'created_at' | 'updated_at'>;
export type FreightRateUpdate = Partial<FreightRateInsert>;

export interface FreightRateValue {
  id: string;
  freight_rate_id: string;
  peso_inicial: number | null;
  peso_final: number | null;
  valor_inicial: number | null;
  valor_final: number | null;
  valor_fixo: number;
  valor_kg: number;
  valor_percentual: number;
  prazo_dias: number;
  created_at: string;
  updated_at: string;
}

export type FreightRateValueInsert = Omit<FreightRateValue, 'id' | 'created_at' | 'updated_at'>;
export type FreightRateValueUpdate = Partial<FreightRateValueInsert>;

export interface FreightRateCity {
  id: string;
  freight_rate_id: string;
  origem_cidade: string | null;
  origem_estado: string | null;
  origem_cep: string | null;
  destino_cidade: string | null;
  destino_estado: string | null;
  destino_cep: string | null;
  valor_adicional: number;
  percentual_adicional: number;
  prazo_adicional: number;
  created_at: string;
}

export type FreightRateCityInsert = Omit<FreightRateCity, 'id' | 'created_at'>;
export type FreightRateCityUpdate = Partial<FreightRateCityInsert>;

export interface AdditionalFee {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  freight_rate_id: string | null;
  nome: string;
  codigo: string;
  tipo: 'fixo' | 'percentual' | 'por_kg' | 'por_volume';
  valor: number;
  percentual: number;
  aplica_automaticamente: boolean;
  obrigatorio: boolean;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type AdditionalFeeInsert = Omit<AdditionalFee, 'id' | 'created_at' | 'updated_at'>;
export type AdditionalFeeUpdate = Partial<AdditionalFeeInsert>;

export interface RestrictedItem {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  freight_rate_id: string | null;
  descricao: string;
  codigo_ncm: string | null;
  tipo_restricao: 'proibido' | 'condicional' | 'taxa_adicional';
  valor_taxa_adicional: number;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type RestrictedItemInsert = Omit<RestrictedItem, 'id' | 'created_at' | 'updated_at'>;
export type RestrictedItemUpdate = Partial<RestrictedItemInsert>;

export interface FreightQuote {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  establishment_id: string | null;
  numero_cotacao: string;
  origem_cep: string | null;
  origem_cidade: string | null;
  origem_estado: string | null;
  destino_cep: string | null;
  destino_cidade: string | null;
  destino_estado: string | null;
  peso: number;
  valor_mercadoria: number;
  quantidade_volumes: number;
  resultados: Record<string, any>;
  melhor_opcao_id: string | null;
  status: 'processando' | 'concluida' | 'erro';
  created_at: string;
  updated_at: string;
}

export type FreightQuoteInsert = Omit<FreightQuote, 'id' | 'created_at' | 'updated_at'>;
export type FreightQuoteUpdate = Partial<FreightQuoteInsert>;

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface WhatsappConfig {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  establishment_id: string | null;
  api_url: string;
  api_key: string;
  phone_number: string;
  ativo: boolean;
  saldo_disponivel: number;
  limite_mensal: number;
  consumo_mensal: number;
  created_at: string;
  updated_at: string;
}

export type WhatsappConfigInsert = Omit<WhatsappConfig, 'id' | 'created_at' | 'updated_at'>;
export type WhatsappConfigUpdate = Partial<WhatsappConfigInsert>;

export interface WhatsappTransaction {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  whatsapp_config_id: string | null;
  tipo: 'mensagem' | 'midia' | 'template' | null;
  destinatario: string;
  conteudo: string | null;
  status: 'enviando' | 'enviado' | 'entregue' | 'lido' | 'erro';
  erro_mensagem: string | null;
  custo: number;
  created_at: string;
}

export type WhatsappTransactionInsert = Omit<WhatsappTransaction, 'id' | 'created_at'>;
export type WhatsappTransactionUpdate = Partial<WhatsappTransactionInsert>;

export interface OpenAIConfig {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  establishment_id: string | null;
  api_key: string;
  modelo: string;
  temperatura: number;
  max_tokens: number;
  ativo: boolean;
  saldo_disponivel: number;
  limite_mensal: number;
  consumo_mensal: number;
  created_at: string;
  updated_at: string;
}

export type OpenAIConfigInsert = Omit<OpenAIConfig, 'id' | 'created_at' | 'updated_at'>;
export type OpenAIConfigUpdate = Partial<OpenAIConfigInsert>;

export interface OpenAITransaction {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  openai_config_id: string | null;
  tipo: 'completion' | 'chat' | 'embedding' | 'analise' | null;
  prompt: string;
  resposta: string | null;
  tokens_prompt: number;
  tokens_resposta: number;
  tokens_total: number;
  custo: number;
  status: 'processando' | 'concluido' | 'erro';
  erro_mensagem: string | null;
  created_at: string;
}

export type OpenAITransactionInsert = Omit<OpenAITransaction, 'id' | 'created_at'>;
export type OpenAITransactionUpdate = Partial<OpenAITransactionInsert>;

export interface GoogleMapsConfig {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  establishment_id: string | null;
  api_key: string;
  ativo: boolean;
  saldo_disponivel: number;
  limite_mensal: number;
  consumo_mensal: number;
  created_at: string;
  updated_at: string;
}

export type GoogleMapsConfigInsert = Omit<GoogleMapsConfig, 'id' | 'created_at' | 'updated_at'>;
export type GoogleMapsConfigUpdate = Partial<GoogleMapsConfigInsert>;

export interface GoogleMapsTransaction {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  google_maps_config_id: string | null;
  tipo: 'geocoding' | 'distance' | 'directions' | 'places' | null;
  origem: string | null;
  destino: string | null;
  resultado: Record<string, any> | null;
  custo: number;
  status: 'processando' | 'concluido' | 'erro';
  erro_mensagem: string | null;
  created_at: string;
}

export type GoogleMapsTransactionInsert = Omit<GoogleMapsTransaction, 'id' | 'created_at'>;
export type GoogleMapsTransactionUpdate = Partial<GoogleMapsTransactionInsert>;

export interface NpsConfig {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  establishment_id: string | null;
  ativo: boolean;
  enviar_automaticamente: boolean;
  dias_apos_entrega: number;
  pergunta_principal: string;
  pergunta_complementar: string;
  email_assunto: string;
  email_template: string | null;
  whatsapp_template: string | null;
  created_at: string;
  updated_at: string;
}

export type NpsConfigInsert = Omit<NpsConfig, 'id' | 'created_at' | 'updated_at'>;
export type NpsConfigUpdate = Partial<NpsConfigInsert>;

export interface NpsSurvey {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  nps_config_id: string | null;
  order_id: string | null;
  carrier_id: string | null;
  data_envio: string;
  data_resposta: string | null;
  nota: number | null;
  comentario: string | null;
  tipo_cliente: 'detrator' | 'neutro' | 'promotor' | null;
  status: 'enviada' | 'respondida' | 'expirada';
  metadata: Record<string, any>;
  created_at: string;
}

export type NpsSurveyInsert = Omit<NpsSurvey, 'id' | 'created_at'>;
export type NpsSurveyUpdate = Partial<NpsSurveyInsert>;

export interface NpsResponse {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  nps_survey_id: string | null;
  pergunta: string;
  resposta: string | null;
  created_at: string;
}

export type NpsResponseInsert = Omit<NpsResponse, 'id' | 'created_at'>;
export type NpsResponseUpdate = Partial<NpsResponseInsert>;

export interface EmailOutgoingConfig {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  establishment_id: string | null;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  from_email: string;
  from_name: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type EmailOutgoingConfigInsert = Omit<EmailOutgoingConfig, 'id' | 'created_at' | 'updated_at'>;
export type EmailOutgoingConfigUpdate = Partial<EmailOutgoingConfigInsert>;

// ============================================================================
// AUXILIARY TYPES
// ============================================================================

export interface Country {
  id: string;
  codigo: string;
  nome: string;
  nome_oficial: string | null;
  sigla_iso2: string | null;
  sigla_iso3: string | null;
  codigo_telefone: string | null;
  continente: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type CountryInsert = Omit<Country, 'id' | 'created_at' | 'updated_at'>;
export type CountryUpdate = Partial<CountryInsert>;

export interface State {
  id: string;
  country_id: string | null;
  codigo: string;
  nome: string;
  sigla: string;
  regiao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type StateInsert = Omit<State, 'id' | 'created_at' | 'updated_at'>;
export type StateUpdate = Partial<StateInsert>;

export interface City {
  id: string;
  state_id: string | null;
  codigo_ibge: string | null;
  nome: string;
  latitude: number | null;
  longitude: number | null;
  populacao: number | null;
  area_km2: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type CityInsert = Omit<City, 'id' | 'created_at' | 'updated_at'>;
export type CityUpdate = Partial<CityInsert>;

export interface Holiday {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  nome: string;
  data: string;
  tipo: 'nacional' | 'estadual' | 'municipal' | 'opcional';
  country_id: string | null;
  state_id: string | null;
  city_id: string | null;
  recorrente: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type HolidayInsert = Omit<Holiday, 'id' | 'created_at' | 'updated_at'>;
export type HolidayUpdate = Partial<HolidayInsert>;

export interface ChangeLog {
  id: string;
  versao: string;
  data_lancamento: string;
  tipo: 'feature' | 'bugfix' | 'improvement' | 'breaking';
  titulo: string;
  descricao: string;
  impacto: 'baixo' | 'medio' | 'alto' | 'critico' | null;
  publicado: boolean;
  created_at: string;
  updated_at: string;
}

export type ChangeLogInsert = Omit<ChangeLog, 'id' | 'created_at' | 'updated_at'>;
export type ChangeLogUpdate = Partial<ChangeLogInsert>;

export interface ApiKey {
  id: string;
  organization_id: string | null;
  environment_id: string | null;
  nome: string;
  chave: string;
  prefixo: string;
  tipo: 'api' | 'webhook' | 'integracao';
  permissoes: Record<string, any>;
  ativa: boolean;
  expira_em: string | null;
  ultimo_uso: string | null;
  ip_whitelist: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type ApiKeyInsert = Omit<ApiKey, 'id' | 'created_at' | 'updated_at'>;
export type ApiKeyUpdate = Partial<ApiKeyInsert>;

export interface License {
  id: string;
  organization_id: string | null;
  tipo: 'trial' | 'basic' | 'professional' | 'enterprise' | 'custom';
  data_inicio: string;
  data_fim: string | null;
  max_users: number;
  max_establishments: number;
  max_orders_month: number;
  features: Record<string, any>;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export type LicenseInsert = Omit<License, 'id' | 'created_at' | 'updated_at'>;
export type LicenseUpdate = Partial<LicenseInsert>;

export interface WhiteLabelConfig {
  id: string;
  organization_id: string | null;
  nome_aplicacao: string;
  logo_url: string | null;
  favicon_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  cor_destaque: string;
  dominio_customizado: string | null;
  email_contato: string | null;
  telefone_contato: string | null;
  endereco_contato: string | null;
  termos_uso_url: string | null;
  politica_privacidade_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type WhiteLabelConfigInsert = Omit<WhiteLabelConfig, 'id' | 'created_at' | 'updated_at'>;
export type WhiteLabelConfigUpdate = Partial<WhiteLabelConfigInsert>;
