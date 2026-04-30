import React from 'react';
import { Activity } from 'lucide-react';

export const RoutingTower = () => {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Activity className="w-8 h-8 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Torre de Roteirização</h1>
          <p className="text-gray-500 dark:text-gray-400">Em breve...</p>
        </div>
      </div>
    </div>
  );
};
