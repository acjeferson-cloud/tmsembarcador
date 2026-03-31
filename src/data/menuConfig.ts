import {
  Home,
  Package,
  Truck,
  FileText,
  Users,
  Globe,
  Calculator,
  Handshake,
  Settings,
  BarChart3,
  Activity,
  Receipt,
  FileCheck,
  CreditCard,
  ShoppingCart,
  RotateCcw,
  FileDigit,
  Database,
  Building,
  MapPin,
  Map,
  LayoutGrid,
  AlertTriangle,
  XCircle,
  Key,
  DollarSign,
  Clock,
  Download,
  Upload,
  MessageSquare,
  Brain,
  Calendar,
  TrendingUp,
  Shield,
  Search,
  Sparkles,
  Tag
} from 'lucide-react';

interface MenuItem {
  id: string;
  labelKey: string; // Changed from 'label' to 'labelKey' for i18n
  icon: any;
  color?: string;
  categoryKey?: string; // Changed from 'category' to 'categoryKey' for i18n
  hasSubmenu?: boolean;
  submenu?: MenuItem[];
  permission?: string;
  innovationKey?: string;
}

export const menuConfig: MenuItem[] = [
  {
    id: 'fiori',
    labelKey: 'menu.fiori',
    icon: LayoutGrid,
    color: 'bg-gray-600',
    categoryKey: 'menu.categories.principal'
  },
  {
    id: 'dashboard',
    labelKey: 'menu.dashboard',
    icon: Home,
    color: 'bg-blue-500',
    categoryKey: 'menu.categories.principal'
  },
  {
    id: 'control-tower',
    labelKey: 'menu.controlTower',
    icon: Activity,
    color: 'bg-indigo-500',
    categoryKey: 'menu.categories.analise'
  },
  {
    id: 'carriers',
    labelKey: 'menu.carriers',
    icon: Truck,
    color: 'bg-cyan-500',
    categoryKey: 'menu.categories.cadastros'
  },
  {
    id: 'business-partners',
    labelKey: 'menu.businessPartners',
    icon: Handshake,
    color: 'bg-teal-500',
    categoryKey: 'menu.categories.cadastros'
  },
  {
    id: 'freight-quote',
    labelKey: 'menu.freightQuote',
    icon: Calculator,
    color: 'bg-green-500',
    categoryKey: 'menu.categories.operacoes'
  },
  {
    id: 'operational-docs',
    labelKey: 'menu.operationalDocs',
    icon: FileText,
    color: 'bg-orange-500',
    categoryKey: 'menu.categories.documentos',
    hasSubmenu: true,
    submenu: [
      { id: 'orders', labelKey: 'menu.orders', icon: ShoppingCart, color: 'bg-amber-500', categoryKey: 'menu.categories.documentos' },
      { id: 'invoices', labelKey: 'menu.invoices', icon: Receipt, color: 'bg-orange-500', categoryKey: 'menu.categories.documentos' },
      { id: 'pickups', labelKey: 'menu.pickups', icon: Package, color: 'bg-yellow-500', categoryKey: 'menu.categories.documentos' },
      { id: 'ctes', labelKey: 'menu.ctes', icon: FileCheck, color: 'bg-red-500', categoryKey: 'menu.categories.documentos' },
      { id: 'bills', labelKey: 'menu.bills', icon: CreditCard, color: 'bg-rose-500', categoryKey: 'menu.categories.documentos' }
    ]
  },
  {
    id: 'delivery-tracking',
    labelKey: 'menu.deliveryTracking',
    icon: Search,
    color: 'bg-blue-600',
    categoryKey: 'menu.categories.operacoes'
  },
  {
    id: 'reverse-logistics',
    labelKey: 'menu.reverseLogistics',
    icon: RotateCcw,
    color: 'bg-teal-600',
    categoryKey: 'menu.categories.operacoes'
  },
  {
    id: 'electronic-docs',
    labelKey: 'menu.electronicDocs',
    icon: FileDigit,
    color: 'bg-pink-500',
    categoryKey: 'menu.categories.documentos'
  },
  {
    id: 'logistics-simulator',
    labelKey: 'menu.logisticsSimulator',
    icon: Activity,
    color: 'bg-violet-500',
    categoryKey: 'menu.categories.operacoes'
  },
  {
    id: 'edi',
    labelKey: 'menu.edi',
    icon: Database,
    color: 'bg-yellow-500',
    categoryKey: 'menu.categories.edi',
    hasSubmenu: true,
    submenu: [
      { id: 'edi-input', labelKey: 'menu.ediInput', icon: Database, color: 'bg-yellow-500', categoryKey: 'menu.categories.edi' },
      { id: 'edi-output', labelKey: 'menu.ediOutput', icon: Database, color: 'bg-lime-500', categoryKey: 'menu.categories.edi' }
    ]
  },
  {
    id: 'reports',
    labelKey: 'menu.reports',
    icon: BarChart3,
    color: 'bg-purple-500',
    categoryKey: 'menu.categories.relatorios',
    hasSubmenu: true,
    submenu: [
      { id: 'report-cte-audit', labelKey: 'menu.reportCteAudit', icon: FileCheck, color: 'bg-purple-500', categoryKey: 'menu.categories.relatorios' },
      { id: 'report-invoice-reconciliation', labelKey: 'menu.reportInvoiceReconciliation', icon: DollarSign, color: 'bg-green-500', categoryKey: 'menu.categories.relatorios' },
      { id: 'report-deliveries-occurrences', labelKey: 'menu.reportDeliveriesOccurrences', icon: AlertTriangle, color: 'bg-orange-500', categoryKey: 'menu.categories.relatorios' },
      { id: 'report-nfe-without-cte', labelKey: 'menu.reportNfeWithoutCte', icon: Package, color: 'bg-red-500', categoryKey: 'menu.categories.relatorios' },
      { id: 'report-rejection-history', labelKey: 'menu.reportRejectionHistory', icon: XCircle, color: 'bg-pink-500', categoryKey: 'menu.categories.relatorios' },
      { id: 'report-carrier-efficiency', labelKey: 'menu.reportCarrierEfficiency', icon: Truck, color: 'bg-teal-500', categoryKey: 'menu.categories.relatorios' },
      { id: 'report-xml-download-history', labelKey: 'menu.reportXmlDownloadHistory', icon: Download, color: 'bg-cyan-500', categoryKey: 'menu.categories.relatorios' },
      { id: 'report-tolerance-usage', labelKey: 'menu.reportToleranceUsage', icon: Clock, color: 'bg-amber-500', categoryKey: 'menu.categories.relatorios' }
    ]
  },
  {
    id: 'nps',
    labelKey: 'menu.nps',
    icon: TrendingUp,
    color: 'bg-blue-600',
    categoryKey: 'menu.categories.nps',
    hasSubmenu: true,
    innovationKey: 'nps',
    submenu: [
      { id: 'nps-dashboard', labelKey: 'menu.npsDashboard', icon: TrendingUp, color: 'bg-blue-600', categoryKey: 'menu.categories.nps', innovationKey: 'nps' },
      { id: 'nps-config', labelKey: 'menu.npsConfig', icon: Settings, color: 'bg-cyan-600', categoryKey: 'menu.categories.nps', innovationKey: 'nps' }
    ]
  },
  {
    id: 'settings',
    labelKey: 'menu.settings',
    icon: Settings,
    color: 'bg-gray-500',
    categoryKey: 'menu.categories.configuracoes',
    hasSubmenu: true,
    submenu: [
      { id: 'establishments', labelKey: 'menu.establishments', icon: Building, color: 'bg-gray-500', categoryKey: 'menu.categories.configuracoes' },
      { id: 'users', labelKey: 'menu.users', icon: Users, color: 'bg-slate-500', categoryKey: 'menu.categories.configuracoes' },
      { id: 'countries', labelKey: 'menu.countries', icon: Globe, color: 'bg-zinc-500', categoryKey: 'menu.categories.configuracoes' },
      { id: 'states', labelKey: 'menu.states', icon: Map, color: 'bg-stone-500', categoryKey: 'menu.categories.configuracoes' },
      { id: 'cities', labelKey: 'menu.cities', icon: MapPin, color: 'bg-neutral-500', categoryKey: 'menu.categories.configuracoes' },
      { id: 'holidays', labelKey: 'menu.holidays', icon: Calendar, color: 'bg-pink-600', categoryKey: 'menu.categories.configuracoes' },
      { id: 'catalog-items', labelKey: 'menu.catalogItems', icon: Tag, color: 'bg-indigo-600', categoryKey: 'menu.categories.configuracoes' },
      { id: 'occurrences', labelKey: 'menu.occurrences', icon: AlertTriangle, color: 'bg-amber-600', categoryKey: 'menu.categories.configuracoes' },
      { id: 'rejection-reasons', labelKey: 'menu.rejectionReasons', icon: XCircle, color: 'bg-red-600', categoryKey: 'menu.categories.configuracoes' },
      { id: 'implementation-center', labelKey: 'menu.implementationCenter', icon: Upload, color: 'bg-blue-600', categoryKey: 'menu.categories.configuracoes' },
      { id: 'change-log', labelKey: 'menu.changeLog', icon: FileText, color: 'bg-indigo-600', categoryKey: 'menu.categories.configuracoes' },
      { id: 'license-management', labelKey: 'menu.licenseManagement', icon: Key, color: 'bg-purple-600', categoryKey: 'menu.categories.configuracoes' },
      { id: 'api-keys', labelKey: 'menu.apiKeys', icon: Shield, color: 'bg-blue-700', categoryKey: 'menu.categories.configuracoes', permission: 'admin' },
      { id: 'whatsapp-config', labelKey: 'menu.whatsappConfig', icon: MessageSquare, color: 'bg-green-600', categoryKey: 'menu.categories.configuracoes', innovationKey: 'whatsapp' },
      { id: 'google-maps-config', labelKey: 'menu.googleMapsConfig', icon: Map, color: 'bg-red-600', categoryKey: 'menu.categories.configuracoes', innovationKey: 'google-maps' },
      { id: 'openai-config', labelKey: 'menu.openaiConfig', icon: Brain, color: 'bg-violet-600', categoryKey: 'menu.categories.configuracoes', innovationKey: 'openai' }
    ]
  }
];

const getAllMenuItems = (): MenuItem[] => {
  const allItems: MenuItem[] = [];

  menuConfig.forEach(item => {
    if (item.hasSubmenu && item.submenu) {
      allItems.push(...item.submenu);
    } else if (item.id !== 'operational-docs' && item.id !== 'edi' && item.id !== 'reports' && item.id !== 'nps' && item.id !== 'settings') {
      allItems.push(item);
    }
  });

  return allItems;
};

export const getMenuItemsByCategory = (): Record<string, MenuItem[]> => {
  const items = getAllMenuItems();
  const grouped: Record<string, MenuItem[]> = {};

  items.forEach(item => {
    const category = item.categoryKey || 'menu.categories.outros';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });

  return grouped;
};

const filterMenuByPermissions = (items: MenuItem[], userPermissions: string[]): MenuItem[] => {
  return items.filter(item => {
    if (!item.permission) return true;
    return userPermissions.includes(item.permission);
  });
};

const getFilteredMenuByCategory = (userPermissions: string[]): Record<string, MenuItem[]> => {
  const allItems = getAllMenuItems();
  const filtered = filterMenuByPermissions(allItems, userPermissions);
  const grouped: Record<string, MenuItem[]> = {};

  filtered.forEach(item => {
    const category = item.categoryKey || 'menu.categories.outros';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });

  return grouped;
};
