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

  // Extrai a imagem real do portal da reportagem via proxy CORS
  private async fetchRealArticleImage(url: string, fallbackUrl: string): Promise<string> {
    try {
      // Usamos um proxy genérico público para conseguir ler o HTML do portal (bypass CORS bloqueante)
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, { mode: 'cors' });
      const data = await response.json();
      
      if (data && data.contents) {
        const html = data.contents;
        // Tenta capturar imagens de preview (OpenGraph ou Twitter Card) exclusivas da matéria
        const match = html.match(/<meta[^>]*property=['"]og:image['"][^>]*content=['"]([^'"]+)['"]/i) ||
                      html.match(/<meta[^>]*content=['"]([^'"]+)['"][^>]*property=['"]og:image['"]/i) ||
                      html.match(/<meta[^>]*name=['"]twitter:image['"][^>]*content=['"]([^'"]+)['"]/i);
        
        if (match && match[1] && match[1].startsWith('http')) {
          // Decodifica possíveis codificações HTML na URL da imagem
          return match[1].replace(/&amp;/g, '&');
        }
      }
    } catch (e) {
      console.warn('Falha silenciosa ao obter imagem real da reportagem (fallback ativado):', e);
    }
    return fallbackUrl;
  }

  // Carregar notícias (API real + fallback)
  private async loadNews(): Promise<void> {
    try {
      // API Key grátis via rss2json apontando para o feed filtrado de logística do Google News BR (restringido para apenas 15 dias usando keyword when:15d)
      const rssUrl = encodeURIComponent('https://news.google.com/rss/search?q=logistica+transporte+cargas+rodoviario+fretes+antt+when:15d&hl=pt-BR&gl=BR&ceid=BR:pt-419');
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
      
      const response = await fetch(apiUrl, { mode: 'cors' });
      
      if (!response.ok) {
        throw new Error(`Erro na API de notícias: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'ok' || !Array.isArray(data.items)) {
        throw new Error('Formato de resposta inválido da API de notícias.');
      }

      // Imagens 100% blindadas focadas em Logística (sem flores, sem praias) via Unsplash
      const fallbackImages = [
        'https://images.unsplash.com/photo-1580674294071-8bcca3622416?q=80&w=600&auto=format&fit=crop', // Truck Highway
        'https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=600&auto=format&fit=crop', // Port
        'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=600&auto=format&fit=crop', // Warehouse
        'https://images.unsplash.com/photo-1586528116311-ad8ed7c50800?q=80&w=600&auto=format&fit=crop', // Highway Trucks Motion
        'https://images.unsplash.com/photo-1591741511977-1deef7d37dc1?q=80&w=600&auto=format&fit=crop', // Truck Side
        'https://images.unsplash.com/photo-1577223625816-7546f13df4be?q=80&w=600&auto=format&fit=crop', // Packages Freight
        'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=600&auto=format&fit=crop', // Highway logistics
        'https://images.unsplash.com/photo-1517429128955-67ff5c1e29f4?q=80&w=600&auto=format&fit=crop', // Cargo train
        '/veio-de-drone-camiao-no-porto-de-embarque-para-transporte-de-carga-e-logistica-empresarial.jpg' // Local asset
      ];

      // Índice sequencial para garantir que não haja imagens repetidas num mesmo ciclo de tela nas fallbacks
      let fallbackIndex = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let initialNews: NewsItem[] = data.items
        .filter((item: any) => {
          // Validação anti quebra de link
          if (!item || !item.link || !item.link.startsWith('http')) return false;
          
          // Validação estrita de data (máximo 15 dias)
          if (item.pubDate) {
            const pubDate = new Date(item.pubDate);
            const now = new Date();
            const diffInDays = Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffInDays > 15) return false;
          }
          return true;
        })
        .slice(0, 12)
        .map((item: any, index: number) => {
          // Trata titulo extraindo da tag HTML se houver falhas, e limpa - Fonte
          let title = item.title;
          const sourceMatch = title.match(/ - ([^-]+)$/);
          const source = sourceMatch ? sourceMatch[1] : 'Portal Especializado';
          
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
            imageUrl: '', // Será preenchido dinamicamente abaixo
            source: source
          };
        });

      // Extrai async a imagem REAL de cada matéria processada
      initialNews = await Promise.all(initialNews.map(async (item) => {
        const fallImg = fallbackImages[fallbackIndex % fallbackImages.length];
        fallbackIndex++;
        const realImage = await this.fetchRealArticleImage(item.link, fallImg);
        return { ...item, imageUrl: realImage };
      }));

      if (initialNews.length > 0) {
        // Assegura carrossel completo de 3 páginas (12 notícias)
        if (initialNews.length < 12) {
          const needed = 12 - initialNews.length;
          // Preenche com as notícias embutidas do mock base para nunca deixar o carrossel vazio
          const padding = mockNews.slice(0, needed).map((item, i) => {
            const padImg = fallbackImages[fallbackIndex % fallbackImages.length];
            fallbackIndex++;
            return {
              ...item,
              id: `fallback-${i}-${Date.now()}`,
              imageUrl: padImg, // Sobrescreve com imagem exclusiva anti-repetição
              publishedDate: new Date(Date.now() - (i + 1) * 60 * 60 * 1000).toISOString() // Força datas nas últimas horas
            };
          });
          initialNews.push(...padding);
        }

        this.news = initialNews;
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