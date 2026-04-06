import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Clock, RefreshCw, ChevronLeft, ChevronRight, Newspaper } from 'lucide-react';
import { NewsService, NewsItem, formatRelativeDate, truncateText } from '../../services/newsService';

export const NewsCarousel: React.FC = () => {
  const { t } = useTranslation();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const newsService = NewsService.getInstance();
  const itemsPerPage = 4;
  const autoPlayInterval = 30000; // 30 segundos

  // Carregar notícias
  useEffect(() => {
    loadNews();
  }, []);

  // Auto-play do carrossel
  useEffect(() => {
    if (!isAutoPlaying || news.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const maxIndex = Math.ceil(news.length / itemsPerPage) - 1;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, news.length, itemsPerPage]);

  // Atualização automática das notícias a cada 180 minutos
  useEffect(() => {
    const updateInterval = setInterval(() => {
      loadNews();
    }, 180 * 60 * 1000); // 180 minutos

    return () => clearInterval(updateInterval);
  }, []);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      const latestNews = await newsService.getLatestNews(12);
      setNews(latestNews);
      setLastUpdate(newsService.getLastUpdateTime());
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      await newsService.forceUpdate();
      const latestNews = await newsService.getLatestNews(12);
      setNews(latestNews);
      setLastUpdate(newsService.getLastUpdateTime());
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => {
      const maxIndex = Math.ceil(news.length / itemsPerPage) - 1;
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  const goToNext = () => {
    setCurrentIndex(prev => {
      const maxIndex = Math.ceil(news.length / itemsPerPage) - 1;
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const getCurrentPageNews = (): NewsItem[] => {
    const startIndex = currentIndex * itemsPerPage;
    return news.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(news.length / itemsPerPage);

  if (isLoading && news.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <RefreshCw size={32} className="text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('controlTower.news.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Newspaper size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('controlTower.news.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('controlTower.news.subtitle')}
              {lastUpdate && (
                <span className="ml-2">• {t('controlTower.news.updated', { date: formatRelativeDate(lastUpdate.toISOString()) })}</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Auto-play toggle */}
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`p-2 rounded-lg transition-colors ${
              isAutoPlaying 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600'
            }`}
            title={isAutoPlaying ? t('controlTower.news.pauseAutoplay') : t('controlTower.news.startAutoplay')}
          >
            {isAutoPlaying ? '⏸️' : '▶️'}
          </button>
          
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors disabled:opacity-50"
            title={t('controlTower.news.refresh')}
          >
            <RefreshCw size={16} className={`text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Carousel Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevious}
            className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
            title={t('controlTower.news.prevPage')}
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={goToNext}
            className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
            title={t('controlTower.news.nextPage')}
          >
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}

      {/* News Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getCurrentPageNews().map((item) => (
          <div
            key={item.id}
            className="group bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 hover:border-blue-300"
          >
            {/* Image */}
            <div className="relative h-32 overflow-hidden">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback para imagem padrão em caso de erro
                    (e.target as HTMLImageElement).src = '/veio-de-drone-camiao-no-porto-de-embarque-para-transporte-de-carga-e-logistica-empresarial.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <Newspaper size={32} className="text-blue-600" />
                </div>
              )}
              
              {/* Source badge */}
              <div className="absolute top-2 left-2">
                <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {item.source}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock size={12} className="text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatRelativeDate(item.publishedDate)}
                </span>
              </div>
              
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {truncateText(item.title, 60)}
              </h4>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {truncateText(item.summary, 80)}
              </p>
              
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>{t('controlTower.news.readMore')}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Auto-play indicator */}
      {isAutoPlaying && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>{t('controlTower.news.autoplayActive')}</span>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {t('controlTower.news.footerInfo', { count: news.length })}
        </span>
        {lastUpdate && (
          <span>
            {t('controlTower.news.lastUpdate', { 
              time: lastUpdate.toLocaleTimeString(undefined, { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) 
            })}
          </span>
        )}
      </div>
    </div>
  );
};
