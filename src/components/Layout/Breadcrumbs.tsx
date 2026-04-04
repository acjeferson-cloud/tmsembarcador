import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const { t } = useTranslation();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
      <Home className="w-4 h-4" />
      <span className="hover:text-blue-600 cursor-pointer">{t('common.home')}</span>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.current ? (
            <span className="text-gray-900 dark:text-white font-medium">{item.label}</span>
          ) : (
            <span 
              className="hover:text-blue-600 cursor-pointer"
              onClick={() => item.href && /*log_removed*/
};
export default Breadcrumbs;