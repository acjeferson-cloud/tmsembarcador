// Serviço para buscar notícias de logística e transporte
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  publishedDate: string;
  imageUrl?: string;
  source: string;
}

// Mock data para demonstração - em produção seria substituído por APIs reais
const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Nova regulamentação para transporte de cargas perigosas entra em vigor',
    summary: 'ANTT publica novas diretrizes que impactam o setor de transporte rodoviário de cargas especiais.',
    link: 'https://www.gov.br/antt/pt-br/assuntos/cargas-perigosas',
    publishedDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
    imageUrl: 'https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    source: 'ANTT'
  },
  {
    id: '2',
    title: 'Setor logístico brasileiro cresce 8,5% no primeiro trimestre',
    summary: 'Dados do IBGE mostram recuperação forte do setor, impulsionada pelo e-commerce e exportações.',
    link: 'https://www.ibge.gov.br/estatisticas/economicas/comercio/9227-pesquisa-mensal-de-comercio.html',
    publishedDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
    imageUrl: '/veio-de-drone-camiao-no-porto-de-embarque-para-transporte-de-carga-e-logistica-empresarial.jpg',
    source: 'IBGE'
  },
  {
    id: '3',
    title: 'Tecnologia blockchain revoluciona rastreamento de cargas',
    summary: 'Empresas adotam soluções baseadas em blockchain para maior transparência na cadeia logística.',
    link: 'https://www.tecnologistica.com.br/blockchain-logistica',
    publishedDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
    imageUrl: 'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    source: 'TecnoLogística'
  },
  {
    id: '4',
    title: 'Combustível: preços estabilizam após alta volatilidade',
    summary: 'ANP registra estabilização nos preços do diesel, principal combustível do transporte rodoviário.',
    link: 'https://www.gov.br/anp/pt-br/centrais-de-conteudo/noticias',
    publishedDate: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 horas atrás
    imageUrl: 'https://images.pexels.com/photos/33688/delicate-arch-night-stars-landscape.jpg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    source: 'ANP'
  },
  {
    id: '5',
    title: 'Investimentos em infraestrutura portuária batem recorde',
    summary: 'Governo anuncia R$ 15 bilhões em investimentos para modernização dos portos brasileiros.',
    link: 'https://www.gov.br/infraestrutura/pt-br/assuntos/noticias',
    publishedDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 horas atrás
    imageUrl: 'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    source: 'Ministério da Infraestrutura'
  },
  {
    id: '6',
    title: 'Sustentabilidade: transportadoras investem em veículos elétricos',
    summary: 'Setor aposta em eletrificação da frota para reduzir emissões e custos operacionais.',
    link: 'https://www.mobilidadeeletrica.com.br/transporte-cargas',
    publishedDate: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 horas atrás
    imageUrl: 'https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    source: 'Mobilidade Elétrica'
  },
  {
    id: '7',
    title: 'eSocial para transportadores: prazo final se aproxima',
    summary: 'Empresas de transporte têm até março para adequação completa às exigências do eSocial.',
    link: 'https://www.gov.br/esocial/pt-br',
    publishedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
    imageUrl: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    source: 'eSocial'
  },
  {
    id: '8',
    title: 'Inteligência artificial otimiza rotas de entrega urbana',
    summary: 'Algoritmos de IA reduzem em até 25% o tempo de entrega em grandes centros urbanos.',
    link: 'https://www.inovacaourbana.com.br/ia-logistica',
    publishedDate: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 1.25 dias atrás
    imageUrl: 'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    source: 'Inovação Urbana'
  },
  {
    id: '9',
    title: 'Cabotagem cresce 15% e ganha espaço no transporte nacional',
    summary: 'Modal aquaviário se consolida como alternativa sustentável para longas distâncias.',
    link: 'https://www.antaq.gov.br/Portal/Anuarios_Portuarios/Anuario_Aquaviario.asp',
    publishedDate: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 dias atrás
    imageUrl: 'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    source: 'ANTAQ'
  },
  {
    id: '10',
    title: 'Acordo comercial facilita transporte entre Brasil e Argentina',
    summary: 'Novo protocolo reduz burocracia e agiliza o transporte internacional de cargas.',
    link: 'https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior',
    publishedDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
    imageUrl: 'https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    source: 'MDIC'
  },
  {
    id: '11',
    title: 'Startups de logística recebem R$ 500 milhões em investimentos',
    summary: 'Venture capital aposta forte em inovação tecnológica para o setor de transportes.',
    link: 'https://www.startuplogistica.com.br/investimentos',
    publishedDate: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(), // 2.5 dias atrás
    imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    source: 'Startup Logística'
  },
  {
    id: '12',
    title: 'Ferrovias brasileiras ampliam capacidade em 20%',
    summary: 'Investimentos em infraestrutura ferroviária prometem reduzir custos de transporte de grãos.',
    link: 'https://www.antt.gov.br/ferrovias',
    publishedDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
    imageUrl: 'https://images.pexels.com/photos/210012/pexels-photo-210012.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    source: 'ANTT'
  }
];

// Classe para gerenciar notícias
export class NewsService {
  private static instance: NewsService;
  private news: NewsItem[] = [];
  private lastUpdate: Date | null = null;
  private readonly UPDATE_INTERVAL = 180 * 60 * 1000; // 180 minutos em millisegundos

  private constructor() {
    this.loadNews();
  }

  public static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  // Carregar notícias (API real + fallback)
  private async loadNews(): Promise<void> {
    try {
      // API Key grátis via rss2json apontando para o feed filtrado de logística do Google News BR
      const rssUrl = encodeURIComponent('https://news.google.com/rss/search?q=logistica+transporte+cargas+rodoviario+fretes+antt&hl=pt-BR&gl=BR&ceid=BR:pt-419');
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
      
      const response = await fetch(apiUrl, { mode: 'cors' });
      
      if (!response.ok) {
        throw new Error(`Erro na API de notícias: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'ok' || !Array.isArray(data.items)) {
        throw new Error('Formato de resposta inválido da API de notícias.');
      }

      // Imagens genéricas para quando a notícia não tiver foto na capa
      const fallbackImages = [
        'https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
        '/veio-de-drone-camiao-no-porto-de-embarque-para-transporte-de-carga-e-logistica-empresarial.jpg',
        'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
        'https://images.pexels.com/photos/210012/pexels-photo-210012.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
        'https://images.pexels.com/photos/590016/pexels-photo-590016.jpg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
        'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
        'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsedNews: NewsItem[] = data.items
        .filter((item: any) => item && item.link && item.link.startsWith('http'))
        .map((item: any, index: number) => {
          
          // Extrai conteúdo do <img src="..."> caso Google News jogue na description HTML
          let imageUrl = item.thumbnail || item.enclosure?.link;
          
          if (!imageUrl && item.description) {
            const match = item.description.match(/<img[^>]+src="([^">]+)"/);
            if (match && match[1]) {
              imageUrl = match[1];
            }
          }

          if (!imageUrl) {
            // Sorteia imagem de fallback
            imageUrl = fallbackImages[index % fallbackImages.length];
          }

          // Trata titulo extraindo da tag HTML se houver falhas, e limpa - Fonte
          let title = item.title;
          const sourceMatch = title.match(/ - ([^-]+)$/);
          const source = sourceMatch ? sourceMatch[1] : 'Portal Especializado';
          
          // Limpa o nome da fonte no título para ficar estético
          if (sourceMatch) {
            title = title.replace(` - ${source}`, '');
          }

          return {
            id: item.guid || `${index}-${Date.now()}`,
            title: title,
            summary: item.description 
                      ? item.description.replace(/(<([^>]+)>)/gi, "").substring(0, 150) // Strip HTML format
                      : 'Nenhuma descrição fornecida pelo portal para esta chamada.',
            link: item.link,
            publishedDate: item.pubDate || new Date().toISOString(),
            imageUrl: imageUrl,
            source: source
          };
        });

      if (parsedNews.length > 0) {
        this.news = parsedNews;
        this.lastUpdate = new Date();
      } else {
        throw new Error('Nenhuma notícia válida parseada.');
      }

    } catch (error) {
      console.error('Falha ao atualizar notícias em tempo real:', error);
      // Fallback seguro: se falhar o request, entregamos o mock, mas tentará atualizar daqui a 3 horas silenciosamente.
      if (this.news.length === 0) {
        this.news = mockNews;
      }
      this.lastUpdate = new Date(); // Reset timer properly
    }
  }

  // Verificar se precisa atualizar as notícias
  private shouldUpdate(): boolean {
    if (!this.lastUpdate) return true;
    
    const now = new Date();
    const timeDiff = now.getTime() - this.lastUpdate.getTime();
    
    return timeDiff >= this.UPDATE_INTERVAL;
  }

  // Obter todas as notícias
  public async getNews(): Promise<NewsItem[]> {
    if (this.shouldUpdate()) {
      await this.loadNews();
    }
    
    return this.news;
  }

  // Obter notícias mais recentes (limitado)
  public async getLatestNews(limit: number = 12): Promise<NewsItem[]> {
    const allNews = await this.getNews();
    
    // Ordenar por data de publicação (mais recente primeiro)
    const sortedNews = allNews.sort((a, b) => 
      new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    );
    
    return sortedNews.slice(0, limit);
  }

  // Forçar atualização das notícias
  public async forceUpdate(): Promise<void> {
    await this.loadNews();
  }

  // Obter data da última atualização
  public getLastUpdateTime(): Date | null {
    return this.lastUpdate;
  }

  // Verificar se as notícias estão sendo atualizadas
  public isUpdating(): boolean {
    return this.lastUpdate === null;
  }
}

// Função utilitária para formatar data relativa
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `${diffInMinutes} min atrás`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
  }
};

// Função para truncar texto
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};