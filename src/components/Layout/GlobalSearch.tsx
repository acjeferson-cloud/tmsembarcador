import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Package, Receipt, Truck, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { globalSearchService, SearchResult } from '../../services/globalSearchService';

interface GlobalSearchProps {
  onNavigate: (type: string, id: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualizar resultados com debounce e chamada ao backend real
  useEffect(() => {
    setSelectedIndex(-1);
    
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const fetchTimer = setTimeout(async () => {
      try {
        const data = await globalSearchService.search(searchTerm);
        setResults(data);
      } catch (error) {

        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(fetchTimer);
  }, [searchTerm]);

  // Fechar busca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const result = results[selectedIndex];
      handleResultClick(result);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onNavigate(result.type, result.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'invoice':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'cte':
        return <Truck className="w-4 h-4 text-orange-500" />;
      case 'bill':
        return <Receipt className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusBadge = (type: string, status: string | undefined) => {
    if (!status) return { label: 'Desconhecido', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    const st = status.toLowerCase();

    if (type === 'order') {
      switch (st) {
        case 'emitido': return { label: 'Emitido', className: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' };
        case 'coletado': return { label: 'Em Coleta', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100' };
        case 'em_transito': return { label: 'Em Trânsito', className: 'bg-blue-600 text-white dark:bg-blue-700 dark:text-blue-50' };
        case 'saiu_entrega': return { label: 'Saiu p/Entrega', className: 'bg-orange-600 text-white dark:bg-orange-700 dark:text-orange-50' };
        case 'entregue': return { label: 'Entregue', className: 'bg-green-600 text-white dark:bg-green-700 dark:text-green-50' };
        case 'cancelado': return { label: 'Cancelado', className: 'bg-red-600 text-white dark:bg-red-700 dark:text-red-50' };
        default: return { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
      }
    }
    
    if (type === 'invoice') {
      switch (st) {
        case 'emitida': case 'nfe_emitida': return { label: 'Emitida', className: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' };
        case 'coletada': case 'coletado_transportadora': case 'coleta_realizada': return { label: 'Em Coleta', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100' };
        case 'em trânsito': case 'em_transito': case 'em_transito_origem': case 'em_transito_rota': return { label: 'Em trânsito', className: 'bg-blue-600 text-white dark:bg-blue-700 dark:text-blue-50' };
        case 'saiu p/ entrega': case 'saiu_entrega': return { label: 'Saiu p/ Entrega', className: 'bg-orange-600 text-white dark:bg-orange-700 dark:text-orange-50' };
        case 'entregue': case 'chegada_destino': return { label: 'Entregue', className: 'bg-green-600 text-white dark:bg-green-700 dark:text-green-50' };
        case 'cancelada': return { label: 'Cancelada', className: 'bg-red-600 text-white dark:bg-red-700 dark:text-red-50' };
        default: return { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
      }
    }
    
    if (type === 'cte') {
      switch (st) {
        case 'importado': return { label: 'Importado', className: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' };
        case 'auditado e aprovado': return { label: 'Auditado e Aprovado', className: 'bg-green-600 text-white dark:bg-green-700 dark:text-green-50' };
        case 'auditado e reprovado': return { label: 'Auditado e Reprovado', className: 'bg-orange-600 text-white dark:bg-orange-700 dark:text-orange-50' };
        case 'com nf-e referenciada': return { label: 'Com NF-e Referenciada', className: 'bg-indigo-600 text-white dark:bg-indigo-700 dark:text-indigo-50' };
        case 'cancelado': return { label: 'Cancelado', className: 'bg-red-600 text-white dark:bg-red-700 dark:text-red-50' };
        default: return { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
      }
    }
    
    if (type === 'bill') {
      switch (st) {
        case 'importada': return { label: 'Importada', className: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' };
        case 'auditada e aprovada': return { label: 'Auditada e Aprovada', className: 'bg-green-600 text-white dark:bg-green-700 dark:text-green-50' };
        case 'auditada e reprovada': return { label: 'Auditada e Reprovada', className: 'bg-orange-600 text-white dark:bg-orange-700 dark:text-orange-50' };
        case 'com nf-e referenciada': return { label: 'Com NF-e Referenciada', className: 'bg-indigo-600 text-white dark:bg-indigo-700 dark:text-indigo-50' };
        case 'cancelada': return { label: 'Cancelada', className: 'bg-red-600 text-white dark:bg-red-700 dark:text-red-50' };
        default: return { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
      }
    }
    
    if (type === 'pickup') {
      switch (st) {
        case 'emitida': return { label: 'Emitida', className: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' };
        case 'solicitada': return { label: 'Solicitada', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100' };
        case 'realizada': case 'coleta_realizada': return { label: 'Realizada', className: 'bg-green-600 text-white dark:bg-green-700 dark:text-green-50' };
        case 'cancelada': case 'coleta_cancelada': return { label: 'Cancelada', className: 'bg-red-600 text-white dark:bg-red-700 dark:text-red-50' };
        default: return { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
      }
    }
    
    return { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
  };

  const formatValue = (value?: number) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder={t('globalSearch.placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full md:w-96 lg:w-[32rem] pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (searchTerm.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
              <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-spin" />
              <p className="text-sm">Buscando resultados...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b">
                {t('globalSearch.searchResults')} ({results.length})
              </div>
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={`w-full px-3 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                    index === selectedIndex ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  {getResultIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </p>
                      {result.value && (
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatValue(result.value)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {result.subtitle}
                      </p>
                      {result.status && (
                        <span className={`px-2 py-0.5 flex items-center justify-center text-[10px] font-semibold rounded-full whitespace-nowrap min-w-[70px] ${getStatusBadge(result.type, result.status).className}`}>
                          {getStatusBadge(result.type, result.status).label}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum resultado encontrado</p>
              <p className="text-xs text-gray-400 mt-1">
                Tente buscar por ID, nome do cliente ou transportadora
              </p>
            </div>
          ) : (
            <div className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Digite pelo menos 2 caracteres para buscar</p>
              <div className="mt-3 text-xs text-gray-400 space-y-1">
                <p>• Pedidos • Notas Fiscais</p>
                <p>• CTes • Faturas</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};