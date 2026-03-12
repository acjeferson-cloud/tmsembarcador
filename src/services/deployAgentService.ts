import { supabase } from '../lib/supabase';
import { openaiService } from './openaiService';
import { TenantContextHelper } from '../utils/tenantContext';
import { carriersService } from './carriersService';

export interface DeployProject {
  id: string;
  user_id: string;
  project_name: string;
  client_name: string;
  status: 'pending' | 'collecting' | 'interpreting' | 'executing' | 'completed' | 'failed';
  current_step: string;
  progress_percentage: number;
  started_at: string;
  completed_at?: string;
  auto_execute: boolean;
  require_approval: boolean;
  created_at: string;
  updated_at: string;
  organization_id?: string;
  environment_id?: string;
}

interface DeployUpload {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  file_content?: string;
  data_category: 'erp_integration' | 'carriers' | 'freight_tables' | 'cities' | 'fees' | 'restricted_zips' | 'table_adjustments';
  status: 'uploaded' | 'processing' | 'interpreted' | 'executed' | 'failed';
  rows_total: number;
  rows_processed: number;
  rows_success: number;
  rows_failed: number;
  uploaded_at: string;
  processed_at?: string;
  created_at: string;
  organization_id?: string;
  environment_id?: string;
}

interface DeployInterpretation {
  id: string;
  upload_id: string;
  project_id: string;
  ai_model: string;
  ai_tokens_used: number;
  detected_structure: any;
  field_mappings: any;
  data_quality_score: number;
  confidence_level: 'low' | 'medium' | 'high';
  issues_found: Array<{
    type: 'error' | 'warning';
    field: string;
    message: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    reason: string;
  }>;
  interpreted_at: string;
  created_at: string;
  organization_id?: string;
  environment_id?: string;
}

interface DeployValidation {
  id: string;
  project_id: string;
  upload_id?: string;
  execution_id?: string;
  validation_type: 'format' | 'required_field' | 'duplicate' | 'relationship' | 'business_rule';
  severity: 'error' | 'warning' | 'info';
  field_name?: string;
  row_number?: number;
  message: string;
  details?: any;
  resolved: boolean;
  resolution_action?: string;
  resolved_at?: string;
  created_at: string;
  organization_id?: string;
  environment_id?: string;
}

interface DeploySuggestion {
  id: string;
  project_id: string;
  category: 'optimization' | 'best_practice' | 'data_quality' | 'configuration' | 'integration';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact_area: string[];
  estimated_effort?: string;
  expected_benefit?: string;
  action_required?: any;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  approved_by?: string;
  approved_at?: string;
  implemented_at?: string;
  created_at: string;
  organization_id?: string;
  environment_id?: string;
}

export const deployAgentService = {
  // ==================== PROJECTS ====================

  async createProject(data: {
    project_name: string;
    client_name: string;
    auto_execute?: boolean;
    require_approval?: boolean;
    user_id?: string;
  }): Promise<DeployProject> {
    try {
      const context = await TenantContextHelper.getCurrentContext();
      const orgId = context?.organizationId || localStorage.getItem('tms-selected-org-id');
      const envId = context?.environmentId || localStorage.getItem('tms-selected-env-id');

      // Se user_id foi fornecido, usar ele. Caso contrário, tentar pegar do Supabase Auth
      let userId = data.user_id;

      if (!userId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          // Para demonstração, usar um user_id padrão se não houver sessão
          userId = '00000000-0000-0000-0000-000000000000';
        } else {
          userId = user.id;
        }
      }

      const { data: project, error } = await supabase
        .from('deploy_projects')
        .insert({
          user_id: userId,
          project_name: data.project_name,
          client_name: data.client_name,
          auto_execute: data.auto_execute || false,
          require_approval: data.require_approval !== false,
          organization_id: orgId || null,
          environment_id: envId || null
        })
        .select()
        .single();

      if (error) {
        throw new Error('Erro ao criar projeto: ' + error.message);
      }

      if (!project) {
        throw new Error('Projeto criado mas não foi retornado do banco');
      }

      return project;
    } catch (error) {
      throw error;
    }
  },

  async getProjects(): Promise<DeployProject[]> {
    const context = await TenantContextHelper.getCurrentContext();
    const orgId = context?.organizationId || localStorage.getItem('tms-selected-org-id');

    let query = (supabase as any).from('deploy_projects').select('*');
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getProject(id: string): Promise<DeployProject> {
    const { data, error } = await (supabase as any)
      .from('deploy_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: Partial<DeployProject>): Promise<void> {
    const { error } = await (supabase as any)
      .from('deploy_projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('deploy_projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('Erro ao excluir projeto: ' + error.message);
    }
  },

  // ==================== UPLOADS ====================

  async createUpload(data: {
    project_id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_content: string;
    data_category: string;
  }): Promise<DeployUpload> {
    const context = await TenantContextHelper.getCurrentContext();
    const orgId = context?.organizationId || localStorage.getItem('tms-selected-org-id');
    const envId = context?.environmentId || localStorage.getItem('tms-selected-env-id');

    const payload = {
        ...data,
        organization_id: orgId || null,
        environment_id: envId || null
    };

    const { data: upload, error } = await (supabase as any)
      .from('deploy_uploads')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return upload;
  },

  async getProjectUploads(projectId: string): Promise<DeployUpload[]> {
    const { data, error } = await (supabase as any)
      .from('deploy_uploads')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ==================== AI INTERPRETATION ====================

  async interpretFile(uploadId: string, fileContent: string, category: string): Promise<DeployInterpretation> {
    const prompt = this.buildInterpretationPrompt(fileContent, category);

    try {
      const { data: upload } = await (supabase as any)
        .from('deploy_uploads')
        .select('project_id')
        .eq('id', uploadId)
        .single();

      if (!upload) {
        throw new Error('Upload não encontrado');
      }

      let interpretation: any;

      try {
        // Try to use OpenAI if configured
        const result = await openaiService.generateChatCompletion(prompt);
        if (!result.success || !result.response) {
            throw new Error(result.error || 'Falha na IA');
        }
        interpretation = JSON.parse(result.response);
      } catch (aiError: any) {
        // Generate mock interpretation for development
        interpretation = this.generateMockInterpretation(fileContent, category);
      }

      const context = await TenantContextHelper.getCurrentContext();
      const orgId = context?.organizationId || localStorage.getItem('tms-selected-org-id');
      const envId = context?.environmentId || localStorage.getItem('tms-selected-env-id');

      const { data: result, error } = await (supabase as any)
        .from('deploy_interpretations')
        .insert({
          upload_id: uploadId,
          project_id: upload.project_id,
          ai_model: interpretation.ai_model || 'mock',
          ai_tokens_used: interpretation.tokens_used || 0,
          detected_structure: interpretation.structure || {},
          field_mappings: interpretation.mappings || {},
          data_quality_score: interpretation.quality_score || 75,
          confidence_level: interpretation.confidence || 'medium',
          issues_found: interpretation.issues || [],
          recommendations: interpretation.recommendations || [],
          organization_id: orgId || null,
          environment_id: envId || null
        })
        .select()
        .single();

      if (error) {
        throw new Error('Erro ao salvar interpretação: ' + error.message);
      }

      return result;
    } catch (error: any) {
      throw new Error('Erro ao interpretar arquivo: ' + (error?.message || 'Erro desconhecido'));
    }
  },

  generateMockInterpretation(content: string, category: string) {
    // Generate a mock interpretation for development/testing
    const mockData: any = {
      ai_model: 'mock-development',
      tokens_used: 0,
      quality_score: 85,
      confidence: 'high',
      issues: [],
      recommendations: []
    };

    switch (category) {
      case 'carriers':
        mockData.structure = {
          columns: ['nome', 'cnpj', 'telefone', 'email', 'endereco'],
          data_types: { cnpj: 'string', telefone: 'string', email: 'string' }
        };
        mockData.mappings = {
          nome: 'name',
          cnpj: 'document',
          telefone: 'phone',
          email: 'email',
          endereco: 'address'
        };
        mockData.issues = [
          { type: 'info', field: 'general', message: 'Usando interpretação mock para desenvolvimento' }
        ];
        mockData.recommendations = [
          { priority: 'low', action: 'Configure OpenAI para análise real', reason: 'Melhor precisão na interpretação' }
        ];
        break;

      case 'freight_tables':
        mockData.structure = {
          columns: ['origem', 'destino', 'peso_min', 'peso_max', 'valor'],
          data_types: { peso_min: 'number', peso_max: 'number', valor: 'currency' }
        };
        mockData.mappings = {
          origem: 'origin',
          destino: 'destination',
          peso_min: 'weight_min',
          peso_max: 'weight_max',
          valor: 'rate'
        };
        break;

      default:
        mockData.structure = { columns: [], data_types: {} };
        mockData.mappings = {};
    }

    return mockData;
  },

  buildInterpretationPrompt(content: string, category: string): string {
    const prompts = {
      carriers: `Analyze this carrier data file and provide a structured JSON response with:
- structure: detected columns and data types
- mappings: map source columns to target fields (name, cnpj, contact, address, etc)
- quality_score: 0-100 rating
- confidence: low/medium/high
- issues: array of problems found
- recommendations: array of improvement suggestions

File content (first 1000 chars):
${content.substring(0, 1000)}`,

      freight_tables: `Analyze this freight table data and provide JSON with:
- structure: columns (origin, destination, weight_ranges, values)
- mappings: field mappings
- quality_score: completeness check
- confidence: accuracy level
- issues: missing data, format errors
- recommendations: optimization tips

Content:
${content.substring(0, 1000)}`,

      cities: `Analyze this cities data and provide JSON with:
- structure: city, state, zip_code patterns
- mappings: standardization mappings
- quality_score: data completeness
- confidence: validation level
- issues: duplicates, invalid codes
- recommendations: cleanup actions

Content:
${content.substring(0, 1000)}`
    };

    return prompts[category as keyof typeof prompts] || prompts.carriers;
  },

  // ==================== VALIDATIONS ====================

  async createValidation(data: {
    project_id: string;
    upload_id?: string;
    validation_type: string;
    severity: string;
    message: string;
    field_name?: string;
    row_number?: number;
    details?: any;
  }): Promise<void> {
    const context = await TenantContextHelper.getCurrentContext();
    const orgId = context?.organizationId || localStorage.getItem('tms-selected-org-id');
    const envId = context?.environmentId || localStorage.getItem('tms-selected-env-id');

    const payload = {
      ...data,
      organization_id: orgId || null,
      environment_id: envId || null
    };

    const { error } = await (supabase as any)
      .from('deploy_validations')
      .insert(payload);

    if (error) throw error;
  },

  async getProjectValidations(projectId: string): Promise<DeployValidation[]> {
    const { data, error } = await (supabase as any)
      .from('deploy_validations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ==================== SUGGESTIONS ====================

  async createSuggestion(data: {
    project_id: string;
    category: string;
    priority: string;
    title: string;
    description: string;
    impact_area?: string[];
    estimated_effort?: string;
    expected_benefit?: string;
  }): Promise<void> {
    const context = await TenantContextHelper.getCurrentContext();
    const orgId = context?.organizationId || localStorage.getItem('tms-selected-org-id');
    const envId = context?.environmentId || localStorage.getItem('tms-selected-env-id');

    const payload = {
      ...data,
      organization_id: orgId || null,
      environment_id: envId || null
    };

    const { error } = await (supabase as any)
      .from('deploy_suggestions')
      .insert(payload);

    if (error) throw error;
  },

  async getProjectSuggestions(projectId: string): Promise<DeploySuggestion[]> {
    const { data, error } = await (supabase as any)
      .from('deploy_suggestions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async approveSuggestion(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await (supabase as any)
      .from('deploy_suggestions')
      .update({
        status: 'approved',
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== DASHBOARD DATA ====================

  async getProjectDashboard(projectId: string) {
    const [project, uploads, validations, suggestions] = await Promise.all([
      this.getProject(projectId),
      this.getProjectUploads(projectId),
      this.getProjectValidations(projectId),
      this.getProjectSuggestions(projectId)
    ]);

    const errors = validations.filter(v => v.severity === 'error' && !v.resolved);
    const warnings = validations.filter(v => v.severity === 'warning' && !v.resolved);

    const completedSteps = uploads.filter(u => u.status === 'executed').length;
    const totalSteps = uploads.length;

    return {
      project,
      uploads,
      validations,
      suggestions,
      stats: {
        completedSteps,
        totalSteps,
        progress: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
        errorsCount: errors.length,
        warningsCount: warnings.length,
        suggestionsCount: suggestions.filter(s => s.status === 'pending').length
      }
    };
  },

  // ==================== FILE PROCESSING ====================

  async processFile(uploadId: string): Promise<void> {
    await (supabase as any)
      .from('deploy_uploads')
      .update({ status: 'processing' })
      .eq('id', uploadId);

    const { data: upload } = await (supabase as any)
      .from('deploy_uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (!upload) throw new Error('Upload not found');

    try {
      // Step 1: Interpret file
      const interpretation = await this.interpretFile(uploadId, upload.file_content, upload.data_category);

      await (supabase as any)
        .from('deploy_uploads')
        .update({ status: 'interpreted' })
        .eq('id', uploadId);

      await this.updateProject(upload.project_id, {
        current_step: 'Interpretação',
        status: 'interpreting'
      } as Partial<DeployProject>);

      // Step 2: Create validations based on interpretation
      await this.createValidationsFromInterpretation(upload.project_id, uploadId, interpretation);

      // Step 3: Create suggestions
      await this.createSuggestionsFromInterpretation(upload.project_id, interpretation);

      // Step 4: Mark as ready for execution
      await (supabase as any)
        .from('deploy_uploads')
        .update({ status: 'validated' })
        .eq('id', uploadId);

      // Step 5: Execute if auto_execute is enabled
      const { data: project } = await (supabase as any)
        .from('deploy_projects')
        .select('auto_execute')
        .eq('id', upload.project_id)
        .single();

      if (project?.auto_execute) {
        await this.executeConfiguration(uploadId);
      } else {
        await this.updateProject(upload.project_id, {
          current_step: 'Execução',
          status: 'executing'
        } as Partial<DeployProject>);
      }

    } catch (error) {
      await (supabase as any)
        .from('deploy_uploads')
        .update({ status: 'failed' })
        .eq('id', uploadId);

      await this.createValidation({
        project_id: upload.project_id,
        upload_id: uploadId,
        validation_type: 'processing_error',
        severity: 'error',
        message: 'Erro ao processar arquivo: ' + (error as Error).message
      });

      throw error;
    }
  },

  async createValidationsFromInterpretation(projectId: string, uploadId: string, interpretation: any): Promise<void> {
    const validations = [];

    // Check data quality
    if (interpretation.data_quality_score < 70) {
      validations.push({
        project_id: projectId,
        upload_id: uploadId,
        validation_type: 'data_quality',
        severity: 'warning',
        message: `Qualidade dos dados abaixo do esperado: ${interpretation.data_quality_score}%`,
        details: interpretation.issues_found
      });
    }

    // Check for issues
    if (interpretation.issues_found && Array.isArray(interpretation.issues_found)) {
      interpretation.issues_found.forEach((issue: any) => {
        validations.push({
          project_id: projectId,
          upload_id: uploadId,
          validation_type: issue.type || 'data_validation',
          severity: issue.severity || 'info',
          message: issue.message || String(issue),
          field_name: issue.field
        });
      });
    }

    // Add success validation if no issues
    if (validations.length === 0) {
      validations.push({
        project_id: projectId,
        upload_id: uploadId,
        validation_type: 'success',
        severity: 'info',
        message: `Arquivo interpretado com sucesso. Qualidade: ${interpretation.data_quality_score}%. Confiança: ${interpretation.confidence_level}.`
      });
    }

    // Insert all validations
    for (const validation of validations) {
      await this.createValidation(validation);
    }
  },

  async createSuggestionsFromInterpretation(projectId: string, interpretation: any): Promise<void> {
    if (!interpretation.recommendations || !Array.isArray(interpretation.recommendations)) {
      return;
    }

    for (const recommendation of interpretation.recommendations) {
      await this.createSuggestion({
        project_id: projectId,
        category: 'optimization',
        priority: recommendation.priority || 'medium',
        title: recommendation.action || 'Melhoria Sugerida',
        description: recommendation.reason || recommendation.action || String(recommendation),
        estimated_effort: 'medium'
      });
    }
  },

  async executeConfiguration(uploadId: string): Promise<void> {
    const { data: upload } = await (supabase as any)
      .from('deploy_uploads')
      .select('*, deploy_interpretations(*)')
      .eq('id', uploadId)
      .single();

    if (!upload) throw new Error('Upload not found');

    try {
      await this.updateProject(upload.project_id, {
        current_step: 'Execução',
        status: 'executing'
      } as Partial<DeployProject>);

      // Here you would call the actual configuration services
      switch (upload.data_category) {
        case 'carriers':
          await this.autoConfigureCarriers(upload);
          break;
        case 'freight_tables':
          await this.autoConfigureFreightTables(upload);
          break;
        // Adicionar outros auto-configuters conforme existam
      }

      await (supabase as any)
        .from('deploy_uploads')
        .update({ status: 'executed' })
        .eq('id', uploadId);

      // Check if all uploads are executed to mark project as completed
      const { data: allUploads } = await (supabase as any)
        .from('deploy_uploads')
        .select('status')
        .eq('project_id', upload.project_id);

      const allExecuted = allUploads?.every(u => u.status === 'executed');

      if (allExecuted) {
        await this.updateProject(upload.project_id, {
          current_step: 'Concluído',
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress_percentage: 100
        } as Partial<DeployProject>);
      } else {
        // Calculate progress
        const executedCount = allUploads?.filter(u => u.status === 'executed').length || 0;
        const totalCount = allUploads?.length || 1;
        const progress = Math.round((executedCount / totalCount) * 100);

        await this.updateProject(upload.project_id, {
          progress_percentage: progress
        } as Partial<DeployProject>);
      }

    } catch (error) {
      await (supabase as any)
        .from('deploy_uploads')
        .update({ status: 'failed' })
        .eq('id', uploadId);

      throw error;
    }
  },

  // ==================== AUTO-CONFIGURATION ====================

  async autoConfigureCarriers(upload: any): Promise<void> {
    if (!upload.file_content) return;
    
    let rows: any[] = [];
    try {
      rows = JSON.parse(upload.file_content);
    } catch (e) {
      throw new Error('Formato de arquivo inválido para execução');
    }

    if (!Array.isArray(rows) || rows.length < 2) return;

    const headers = rows[0].map((h: string) => String(h).toLowerCase().trim());
    const dataRows = rows.slice(1);

    for (const row of dataRows) {
      // Cria um objeto genérico key-value da linha usando os headers
      const rowData: any = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index];
      });

      // Mapeamento dinâmico (Fallback para os campos mais comuns)
      const carrierPayload: any = {
        codigo: rowData['codigo'] || '',
        razao_social: rowData['razao_social'] || rowData['empresa'] || rowData['nome'] || '',
        fantasia: rowData['fantasia'] || rowData['nome_fantasia'] || '',
        cnpj: rowData['cnpj'] || rowData['documento'] || '',
        inscricao_estadual: rowData['inscricao_estadual'] || rowData['ie'] || '',
        logradouro: rowData['logradouro'] || rowData['endereco'] || rowData['rua'] || '',
        numero: rowData['numero'] && rowData['numero'] !== 'S/N' ? rowData['numero'] : null,
        complemento: rowData['complemento'] || '',
        bairro: rowData['bairro'] || '',
        cep: rowData['cep'] || '',
        email: rowData['email'] || '',
        phone: rowData['telefone'] || rowData['celular'] || rowData['contato'] || '',
        status: String(rowData['status'] || 'ativo').toLowerCase() === 'inativo' ? 'inativo' : 'ativo',
        modal_rodoviario: String(rowData['modal_rodoviario'] || rowData['rodoviario'] || 'não').toLowerCase() === 'sim',
        modal_aereo: String(rowData['modal_aereo'] || rowData['aereo'] || 'não').toLowerCase() === 'sim',
        modal_aquaviario: String(rowData['modal_aquaviario'] || rowData['aquaviario'] || 'não').toLowerCase() === 'sim',
        modal_ferroviario: String(rowData['modal_ferroviario'] || rowData['ferroviario'] || 'não').toLowerCase() === 'sim',
        tolerancia_valor_cte: Number(rowData['tolerancia_valor_cte']) || 0,
        tolerancia_percentual_cte: Number(rowData['tolerancia_percentual_cte']) || 0,
        tolerancia_valor_fatura: Number(rowData['tolerancia_valor_fatura']) || 0,
        tolerancia_percentual_fatura: Number(rowData['tolerancia_percentual_fatura']) || 0,
      };

      try {
        await carriersService.create(carrierPayload);
      } catch (err: any) {
         throw new Error(`Falha ao integrar Transportadora ${carrierPayload.codigo}: ${err?.message}`);
      }
    }
  },

  async autoConfigureFreightTables(_upload: any): Promise<void> {
    // Logic to automatically create freight tables
    // This would integrate with freightRatesService
  }
};
