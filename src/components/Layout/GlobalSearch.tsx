import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Package, Receipt, Truck, X } from 'lucide-react';
import { ordersData } from '../../data/mockData';
import { invoicesData } from '../../data/mockData';
import { ctesData } from '../../data/mockData';
import { billsData } from '../../data/mockData';
import { useTranslation } from 'react-i18next';
import { getCurrentSessionContext } from '../../lib/sessionContext';
import { isDemoOrganizationSync } from '../../utils/organizationHelpers';

interface SearchResult {
  id: string;
  type: 'order' | 'invoice' | 'cte' | 'bill';
  title: string;
  subtitle: string;
  status?: string;
  value?: number;
}

interface GlobalSearchProps {
  onNavigate: (type: string, id: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isDemo, setIsDemo] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Verificar se é organization de demonstração
  useEffect(() => {
    const checkDemo = async () => {
      const context = await getCurrentSessionContext();
      setIsDemo(isDemoOrganizationSync(context.organizationId));
    };
    checkDemo();
  }, []);

  // Função para buscar em todos os dados - APENAS para organization de demonstração
  const performSearch = (term: string): SearchResult[] => {
    if (!term || term.length < 2) return [];

    // Se NÃO for demonstração, não buscar em dados mockados
    if (!isDemo) {
      return [];
    }

    const searchResults: SearchResult[] = [];
    const lowerTerm = term.toLowerCase();

    // Buscar em Pedidos
    ordersData.forEach(order => {
      if (
        (order.id && order.id.toLowerCase().includes(lowerTerm)) ||
        (order.customer && order.customer.toLowerCase().includes(lowerTerm)) ||
        (order.origin && order.origin.toLowerCase().includes(lowerTerm)) ||
        (order.destination && order.destination.toLowerCase().includes(lowerTerm))
      ) {
        searchResults.push({
          id: order.id,
          type: 'order',
          title: `Pedido ${order.id}`,
          subtitle: `${order.customer} • ${order.origin} → ${order.destination}`,
          status: order.status,
          value: order.value
        });
      }
    });

    // Buscar em Notas Fiscais
    invoicesData.forEach(invoice => {
      if (
        (invoice.id && invoice.id.toLowerCase().includes(lowerTerm)) ||
        (invoice.number && invoice.number.toString().includes(lowerTerm)) ||
        (invoice.customer && invoice.customer.toLowerCase().includes(lowerTerm)) ||
        (invoice.carrier && invoice.carrier.toLowerCase().includes(lowerTerm))
      ) {
        searchResults.push({
          id: invoice.id,
          type: 'invoice',
          title: `NF ${invoice.number}`,
          subtitle: `${invoice.customer} • ${invoice.carrier}`,
          status: invoice.status,
          value: invoice.value
        });
      }
    });

    // Buscar em CTes
    ctesData.forEach(cte => {
      if (
        (cte.id && cte.id.toLowerCase().includes(lowerTerm)) ||
        (cte.number && cte.number.toString().includes(lowerTerm)) ||
        (cte.sender && cte.sender.toLowerCase().includes(lowerTerm)) ||
        (cte.recipient && cte.recipient.toLowerCase().includes(lowerTerm)) ||
        (cte.carrier && cte.carrier.toLowerCase().includes(lowerTerm))
      ) {
        searchResults.push({
          id: cte.id,
          type: 'cte',
          title: `CTe ${cte.number}`,
          subtitle: `${cte.sender} → ${cte.recipient} • ${cte.carrier}`,
          status: cte.status,
          value: cte.value
        });
      }
    });

    // Buscar em Faturas
    billsData.forEach(bill => {
      if (
        (bill.id && bill.id.toLowerCase().includes(lowerTerm)) ||
        (bill.number && bill.number.toString().includes(lowerTerm)) ||
        (bill.customer && bill.customer.toLowerCase().includes(lowerTerm)) ||
        (bill.carrier && bill.carrier.toLowerCase().includes(lowerTerm))
      ) {
        searchResults.push({
          id: bill.id,
          type: 'bill',
          title: `Fatura ${bill.number}`,
          subtitle: `${bill.customer} • ${bill.carrier}`,
          status: bill.status,
          value: bill.totalValue
        });
      }
    });

    return searchResults.slice(0, 10); // Limitar a 10 resultados
  };

  // Atualizar resultados quando o termo de busca mudar
  useEffect(() => {
    const results = performSearch(searchTerm);
    setResults(results);
    setSelectedIndex(-1);
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente':
        return 'text-yellow-600 bg-yellow-100';
      case 'aprovado':
      case 'autorizado':
      case 'pago':
        return 'text-green-600 bg-green-100';
      case 'rejeitado':
      case 'cancelado':
        return 'text-red-600 bg-red-100';
      case 'em transito':
      case 'processando':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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
          className="w-80 pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          {results.length > 0 ? (
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(result.status)}`}>
                          {result.status}
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