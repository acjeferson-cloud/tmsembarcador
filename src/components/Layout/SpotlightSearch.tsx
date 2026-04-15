import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Home, Package, Truck, FileText, Users, Globe, Calculator, Settings, BarChart3, Activity, Receipt, FileCheck, CreditCard, ShoppingCart, RotateCcw, FileDigit, Database, Building, MapPin, Map, AlertTriangle, XCircle, Key, DollarSign, Clock, Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SpotlightSearchProps {
  onNavigate: (page: string) => void;
}

interface SearchItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  category: string;
  keywords: string[];
}

export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const allItems: SearchItem[] = [
    { id: 'dashboard', label: t('spotlight.items.dashboard'), icon: Home, color: 'text-blue-500', category: t('spotlight.categories.Análise'), keywords: t('spotlight.keywords.dashboard').split(', ') },
    { id: 'control-tower', label: t('spotlight.items.controlTower'), icon: Activity, color: 'text-indigo-500', category: t('spotlight.categories.Análise'), keywords: t('spotlight.keywords.controlTower').split(', ') },
    { id: 'reports', label: t('spotlight.items.reports'), icon: BarChart3, color: 'text-green-500', category: t('spotlight.categories.Análise'), keywords: t('spotlight.keywords.reports').split(', ') },

    { id: 'orders', label: t('spotlight.items.orders'), icon: ShoppingCart, color: 'text-blue-500', category: t('spotlight.categories.Operações'), keywords: t('spotlight.keywords.orders').split(', ') },
    { id: 'invoices', label: t('spotlight.items.invoices'), icon: FileText, color: 'text-green-500', category: t('spotlight.categories.Operações'), keywords: t('spotlight.keywords.invoices').split(', ') },
    { id: 'ctes', label: t('spotlight.items.ctes'), icon: Truck, color: 'text-orange-500', category: t('spotlight.categories.Operações'), keywords: t('spotlight.keywords.ctes').split(', ') },
    { id: 'bills', label: t('spotlight.items.bills'), icon: Receipt, color: 'text-purple-500', category: t('spotlight.categories.Operações'), keywords: t('spotlight.keywords.bills').split(', ') },
    { id: 'pickups', label: t('spotlight.items.pickups'), icon: Package, color: 'text-cyan-500', category: t('spotlight.categories.Operações'), keywords: t('spotlight.keywords.pickups').split(', ') },
    { id: 'delivery-tracking', label: t('spotlight.items.shipments'), icon: Truck, color: 'text-blue-600', category: t('spotlight.categories.Operações'), keywords: t('spotlight.keywords.shipments').split(', ') },
    { id: 'reverse-logistics', label: t('spotlight.items.reverseLogistics'), icon: RotateCcw, color: 'text-red-500', category: t('spotlight.categories.Operações'), keywords: t('spotlight.keywords.reverseLogistics').split(', ') },

    { id: 'business-partners', label: t('spotlight.items.businessPartners'), icon: Users, color: 'text-blue-500', category: t('spotlight.categories.Cadastros'), keywords: t('spotlight.keywords.businessPartners').split(', ') },
    { id: 'carriers', label: t('spotlight.items.carriers'), icon: Truck, color: 'text-orange-500', category: t('spotlight.categories.Cadastros'), keywords: t('spotlight.keywords.carriers').split(', ') },
    { id: 'establishments', label: t('spotlight.items.establishments'), icon: Building, color: 'text-cyan-500', category: t('spotlight.categories.Cadastros'), keywords: t('spotlight.keywords.establishments').split(', ') },
    { id: 'users', label: t('spotlight.items.users'), icon: Users, color: 'text-blue-500', category: t('spotlight.categories.Cadastros'), keywords: t('spotlight.keywords.users').split(', ') },
    { id: 'freight-rates', label: t('spotlight.items.freightRates'), icon: DollarSign, color: 'text-green-500', category: t('spotlight.categories.Cadastros'), keywords: t('spotlight.keywords.freightRates').split(', ') },
    { id: 'occurrences', label: t('spotlight.items.occurrences'), icon: AlertTriangle, color: 'text-yellow-500', category: t('spotlight.categories.Cadastros'), keywords: t('spotlight.keywords.occurrences').split(', ') },
    { id: 'rejection-reasons', label: t('spotlight.items.rejectionReasons'), icon: XCircle, color: 'text-red-500', category: t('spotlight.categories.Cadastros'), keywords: t('spotlight.keywords.rejectionReasons').split(', ') },
    { id: 'countries', label: t('spotlight.items.countries'), icon: Globe, color: 'text-blue-500', category: t('spotlight.categories.Cadastros'), keywords: t('spotlight.keywords.countries').split(', ') },
    { id: 'states', label: t('spotlight.items.states'), icon: Map, color: 'text-green-500', category: t('spotlight.categories.Cadastros'), keywords: t('spotlight.keywords.states').split(', ') },
    { id: 'cities', label: t('spotlight.items.cities'), icon: MapPin, color: 'text-orange-500', category: t('spotlight.categories.Cadastros'), keywords: t('spotlight.keywords.cities').split(', ') },

    { id: 'calculator', label: t('spotlight.items.calculator'), icon: Calculator, color: 'text-blue-500', category: t('spotlight.categories.Ferramentas'), keywords: t('spotlight.keywords.calculator').split(', ') },
    { id: 'edi-input', label: t('spotlight.items.edi'), icon: FileDigit, color: 'text-green-500', category: t('spotlight.categories.Ferramentas'), keywords: t('spotlight.keywords.edi').split(', ') },
    { id: 'electronic-docs', label: t('spotlight.items.documents'), icon: FileCheck, color: 'text-purple-500', category: t('spotlight.categories.Ferramentas'), keywords: t('spotlight.keywords.documents').split(', ') },
    { id: 'logistics-simulator', label: t('spotlight.items.logisticsSimulator'), icon: Activity, color: 'text-cyan-500', category: t('spotlight.categories.Ferramentas'), keywords: t('spotlight.keywords.logisticsSimulator').split(', ') },
    { id: 'implementation-center', label: t('spotlight.items.implementation'), icon: Clock, color: 'text-orange-500', category: t('spotlight.categories.Ferramentas'), keywords: t('spotlight.keywords.implementation').split(', ') },

    { id: 'license-management', label: t('spotlight.items.licenses'), icon: Key, color: 'text-yellow-500', category: t('spotlight.categories.Configurações'), keywords: t('spotlight.keywords.licenses').split(', ') },
    { id: 'whatsapp-config', label: t('spotlight.items.whatsapp'), icon: Settings, color: 'text-green-500', category: t('spotlight.categories.Configurações'), keywords: t('spotlight.keywords.whatsapp').split(', ') },
    { id: 'google-maps-config', label: t('spotlight.items.googleMaps'), icon: MapPin, color: 'text-red-500', category: t('spotlight.categories.Configurações'), keywords: t('spotlight.keywords.googleMaps').split(', ') },
    { id: 'openai-config', label: t('spotlight.items.openai'), icon: Database, color: 'text-purple-500', category: t('spotlight.categories.Configurações'), keywords: t('spotlight.keywords.openai').split(', ') },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(allItems.slice(0, 8));
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = allItems.filter(item =>
        item.label.toLowerCase().includes(term) ||
        item.keywords.some(keyword => keyword.includes(term)) ||
        item.category.toLowerCase().includes(term)
      );
      setFilteredItems(filtered);
    }
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredItems.length > 0) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    }
  };

  const handleSelect = (item: SearchItem) => {
    onNavigate(item.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const highlightMatch = (text: string) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase()
        ? <mark key={i} className="bg-yellow-200 text-gray-900 dark:text-white">{part}</mark>
        : part
    );
  };

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      <div
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('spotlight.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 outline-none text-lg placeholder-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <div className="ml-3 flex items-center space-x-1 text-xs text-gray-400">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300">Esc</kbd>
            <span>{t('spotlight.close')}</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {filteredItems.length > 0 ? (
            <div className="py-2">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="mb-1">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {category}
                  </div>
                  {items.map((item, index) => {
                    const globalIndex = filteredItems.indexOf(item);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`w-full px-4 py-3 flex items-center space-x-3 transition-colors ${
                          globalIndex === selectedIndex
                            ? 'bg-blue-50 border-r-4 border-blue-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${item.color}`} />
                        <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">
                          {highlightMatch(item.label)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">{t('spotlight.noResults')}</p>
              <p className="text-xs text-gray-400 mt-1">
                {t('spotlight.trySearching')}
              </p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300">↑↓</kbd>
              <span>{t('spotlight.navigate')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300">Enter</kbd>
              <span>{t('spotlight.select')}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Command className="w-3 h-3" />
            <span>+</span>
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300">K</kbd>
            <span>{t('spotlight.open')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
