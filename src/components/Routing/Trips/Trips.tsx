import React from 'react';
import { FileText } from 'lucide-react';

export const Trips = () => {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <FileText className="w-8 h-8 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Romaneios de Carga</h1>
          <p className="text-gray-500 dark:text-gray-400">Em breve...</p>
        </div>
      </div>
    </div>
  );
};
