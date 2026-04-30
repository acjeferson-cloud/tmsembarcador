import React from 'react';
import { Users, FileText, Phone, Edit2, Trash2 } from 'lucide-react';
import { Driver } from '../../../services/driversService';

interface DriverCardProps {
  driver: Driver;
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export const DriverCard: React.FC<DriverCardProps> = ({ driver, onEdit, onDelete, isAdmin }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'inativo': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      case 'em_viagem': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'inativo': return 'Inativo';
      case 'em_viagem': return 'Em Viagem';
      default: return status;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{driver.nome}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Motorista</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(driver.status)}`}>
            {formatStatus(driver.status)}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <FileText size={16} className="text-gray-400" />
            <div>
              <span className="text-gray-400 text-xs block">CPF / CNH</span>
              <span className="font-medium">{driver.cpf || 'Não informado'} / {driver.cnh || 'Não informada'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <Phone size={16} className="text-gray-400" />
            <div>
              <span className="text-gray-400 text-xs block">Contato</span>
              <span className="font-medium">{driver.telefone || 'Não informado'}</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
            <button
              onClick={() => onEdit(driver)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Editar Motorista"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => onDelete(driver.id)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Excluir Motorista"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
