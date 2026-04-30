import React from 'react';
import { Truck, Weight, Box, Edit2, Trash2 } from 'lucide-react';
import { Vehicle } from '../../../services/vehiclesService';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onEdit, onDelete, isAdmin }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'inativo': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      case 'manutencao': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'inativo': return 'Inativo';
      case 'manutencao': return 'Manutenção';
      default: return status;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase">{vehicle.placa}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.tipo}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(vehicle.status)}`}>
            {formatStatus(vehicle.status)}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <Weight size={16} className="text-gray-400" />
            <div>
              <span className="text-gray-400 text-xs block">Capacidade</span>
              <span className="font-medium">{vehicle.capacidade_kg.toLocaleString('pt-BR')} kg</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <Box size={16} className="text-gray-400" />
            <div>
              <span className="text-gray-400 text-xs block">Cubagem</span>
              <span className="font-medium">{vehicle.cubagem_m3.toLocaleString('pt-BR')} m³</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
            <button
              onClick={() => onEdit(vehicle)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Editar Veículo"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => onDelete(vehicle.id)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Excluir Veículo"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
