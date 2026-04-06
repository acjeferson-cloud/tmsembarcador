import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ReportTableProps {
  fields: string[];
  data: Record<string, any>[];
}

export const ReportTable: React.FC<ReportTableProps> = ({ fields, data }) => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply sorting to data
  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      // Try to parse as numbers if they look like numbers
      if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
        return sortDirection === 'asc' 
          ? parseFloat(aValue) - parseFloat(bValue)
          : parseFloat(bValue) - parseFloat(aValue);
      }
      
      // Handle percentage strings
      if (aValue.endsWith('%') && bValue.endsWith('%')) {
        const aNum = parseFloat(aValue.replace('%', ''));
        const bNum = parseFloat(bValue.replace('%', ''));
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Handle currency strings
      if ((aValue.startsWith('R$') || aValue.includes('$')) && 
          (bValue.startsWith('R$') || bValue.includes('$'))) {
        const aNum = parseFloat(aValue.replace(/[^\d.-]/g, ''));
        const bNum = parseFloat(bValue.replace(/[^\d.-]/g, ''));
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Regular string comparison
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // Default comparison
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Format cell value based on content
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    
    // Convert to string
    const strValue = String(value);
    
    // Return as is for short values
    if (strValue.length <= 50) return strValue;
    
    // Truncate long values
    return strValue.substring(0, 50) + '...';
  };

  // Get cell class based on content
  const getCellClass = (value: any, field: string): string => {
    const strValue = String(value);
    
    // Status fields
    if (field.toLowerCase().includes('status')) {
      if (strValue.toLowerCase().includes('aprovado') || 
          strValue.toLowerCase() === 'ok' ||
          strValue.toLowerCase() === 'entregue') {
        return 'text-green-600 bg-green-50';
      }
      
      if (strValue.toLowerCase().includes('reprovado') || 
          strValue.toLowerCase().includes('divergente') ||
          strValue.toLowerCase().includes('pendente') ||
          strValue.toLowerCase().includes('crítica')) {
        return 'text-red-600 bg-red-50';
      }
      
      if (strValue.toLowerCase().includes('tolerância')) {
        return 'text-yellow-600 bg-yellow-50';
      }
    }
    
    // Percentage fields
    if (strValue.endsWith('%')) {
      const numValue = parseFloat(strValue.replace('%', ''));
      if (numValue > 90) return 'text-green-600';
      if (numValue < 50) return 'text-red-600';
      if (numValue < 80) return 'text-yellow-600';
    }
    
    // Difference fields
    if (field.toLowerCase().includes('diferença')) {
      if (strValue.startsWith('-') || strValue.includes('(')) return 'text-red-600';
      if (strValue === '0' || strValue === '0.00' || strValue === 'R$ 0,00') return 'text-gray-500';
      return 'text-green-600';
    }
    
    return '';
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {fields.map((field, index) => (
                <th 
                  key={index}
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:bg-gray-700"
                  onClick={() => handleSort(field)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{field}</span>
                    {sortField === field ? (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:bg-gray-900">
                {fields.map((field, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={`px-6 py-4 whitespace-nowrap text-sm ${getCellClass(row[field], field)}`}
                  >
                    {formatCellValue(row[field])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * rowsPerPage, data.length)}</span> de <span className="font-medium">{data.length}</span> resultados
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-1 border ${
                    currentPage === pageNumber
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } rounded-md text-sm font-medium`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            {totalPages > 5 && (
              <>
                {currentPage < totalPages - 2 && <span className="text-gray-500 dark:text-gray-400">...</span>}
                {currentPage < totalPages - 1 && (
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-1 border ${
                      currentPage === totalPages
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    } rounded-md text-sm font-medium`}
                  >
                    {totalPages}
                  </button>
                )}
              </>
            )}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
