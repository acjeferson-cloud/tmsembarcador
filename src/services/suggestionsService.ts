interface Suggestion {
  id: string;
  user_id: number;
  establishment_id?: number;
  title: string;
  description: string;
  status: 'pending' | 'under_review' | 'approved' | 'implemented' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  attachments: AttachmentMetadata[];
  response?: string;
  responded_by?: number;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

interface AttachmentMetadata {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

interface CreateSuggestionData {
  user_id: number;
  establishment_id?: number;
  title: string;
  description: string;
  category?: string;
  attachments?: File[];
}

const STORAGE_KEY = 'tms_suggestions';

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function processAttachment(file: File): Promise<AttachmentMetadata> {
  const base64 = await fileToBase64(file);
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    name: file.name,
    url: base64,
    type: file.type,
    size: file.size,
    uploaded_at: new Date().toISOString()
  };
}

function getSuggestions(): Suggestion[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading suggestions from localStorage:', error);
    return [];
  }
}

function saveSuggestions(suggestions: Suggestion[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(suggestions));
    console.log('Suggestions saved to localStorage:', suggestions.length);
  } catch (error) {
    console.error('Error saving suggestions to localStorage:', error);
  }
}

export async function createSuggestion(data: CreateSuggestionData): Promise<{ success: boolean; message: string; suggestionId?: string }> {
  try {
    console.log('Creating suggestion in localStorage...');

    const id = `suggestion-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const attachments: AttachmentMetadata[] = [];

    if (data.attachments && data.attachments.length > 0) {
      console.log('Processing', data.attachments.length, 'attachments...');
      for (const file of data.attachments) {
        try {
          const attachment = await processAttachment(file);
          attachments.push(attachment);
          console.log('Processed attachment:', file.name);
        } catch (error) {
          console.warn('Failed to process attachment:', file.name, error);
        }
      }
    }

    const suggestion: Suggestion = {
      id,
      user_id: data.user_id,
      establishment_id: data.establishment_id,
      title: data.title,
      description: data.description,
      category: data.category,
      status: 'pending',
      priority: 'medium',
      attachments,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const suggestions = getSuggestions();
    suggestions.unshift(suggestion);
    saveSuggestions(suggestions);

    console.log('Suggestion created successfully:', id);
    console.log('Total suggestions now:', suggestions.length);

    return {
      success: true,
      message: 'Sugestão enviada com sucesso! Nossa equipe analisará sua solicitação em breve.',
      suggestionId: id
    };
  } catch (error) {
    console.error('Error in createSuggestion:', error);
    return { success: false, message: 'Erro ao enviar sugestão. Tente novamente.' };
  }
}

async function fetchUserSuggestions(userId: number): Promise<Suggestion[]> {
  try {
    const suggestions = getSuggestions();
    return suggestions.filter(s => s.user_id === userId);
  } catch (error) {
    console.error('Error in fetchUserSuggestions:', error);
    return [];
  }
}

async function fetchAllSuggestions(): Promise<Suggestion[]> {
  try {
    return getSuggestions();
  } catch (error) {
    console.error('Error in fetchAllSuggestions:', error);
    return [];
  }
}

async function fetchSuggestionById(id: string): Promise<Suggestion | null> {
  try {
    const suggestions = getSuggestions();
    return suggestions.find(s => s.id === id) || null;
  } catch (error) {
    console.error('Error in fetchSuggestionById:', error);
    return null;
  }
}

async function deleteSuggestion(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const suggestions = getSuggestions();
    const filtered = suggestions.filter(s => s.id !== id);

    if (filtered.length === suggestions.length) {
      return { success: false, message: 'Sugestão não encontrada.' };
    }

    saveSuggestions(filtered);
    return { success: true, message: 'Sugestão excluída com sucesso!' };
  } catch (error) {
    console.error('Error in deleteSuggestion:', error);
    return { success: false, message: 'Erro ao excluir sugestão.' };
  }
}

function getStatusLabel(status: Suggestion['status']): string {
  const labels: Record<Suggestion['status'], string> = {
    pending: 'Pendente',
    under_review: 'Em Análise',
    approved: 'Aprovado',
    implemented: 'Implementado',
    rejected: 'Rejeitado'
  };
  return labels[status];
}

function getStatusColor(status: Suggestion['status']): string {
  const colors: Record<Suggestion['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    implemented: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800'
  };
  return colors[status];
}

function getPriorityLabel(priority: Suggestion['priority']): string {
  const labels: Record<Suggestion['priority'], string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente'
  };
  return labels[priority];
}
