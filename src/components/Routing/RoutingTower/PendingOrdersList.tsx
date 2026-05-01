import React from 'react';
import { Package, MapPin, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Order } from '../../../services/ordersService';

interface PendingOrdersListProps {
  orders: Order[];
  isLoading: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, order: Order) => void;
  selectedOrders: string[];
  onToggleOrder: (orderId: string) => void;
}

export const PendingOrdersList: React.FC<PendingOrdersListProps> = ({
  orders,
  isLoading,
  onDragStart,
  selectedOrders,
  onToggleOrder
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse p-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <Package className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-sm font-medium">Nenhuma carga pendente</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-200px)] p-2 -mx-2 hide-scrollbar">
      {orders.map((order) => {
        const isSelected = selectedOrders.includes(order.id!);
        
        return (
          <div
            key={order.id}
            draggable
            onDragStart={(e) => onDragStart(e, order)}
            className={`
              relative p-4 rounded-xl border bg-white dark:bg-gray-800 shadow-sm cursor-grab active:cursor-grabbing transition-all
              hover:border-indigo-400 hover:shadow-md
              ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 dark:border-gray-700'}
            `}
            onClick={() => order.id && onToggleOrder(order.id)}
          >
            {/* Checkbox Overlay (Híbrido) */}
            <div className="absolute top-4 right-4">
              <input 
                type="checkbox" 
                checked={isSelected}
                onChange={() => {}} // Controlled by onClick on parent div
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 mb-3 pr-8">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Package size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {order.order_number}
                </h3>
                <p className="text-xs text-gray-500 truncate max-w-[150px]" title={order.customer_name}>
                  {order.customer_name}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 text-red-500 shrink-0" />
                <span className="line-clamp-2">
                  {order.destination_city}/{order.destination_state} - {order.destination_neighborhood}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {order.weight?.toFixed(1)} kg
                  </span>
                </div>
                <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {order.cubic_meters?.toFixed(2)} m³
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
