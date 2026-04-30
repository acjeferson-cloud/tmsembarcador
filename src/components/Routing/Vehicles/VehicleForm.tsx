import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Truck } from 'lucide-react';
import { Vehicle } from '../../../services/vehiclesService';

interface VehicleFormProps {
  onBack: () => void;
  onSave: (vehicle: Partial<Vehicle>) => void;
  vehicle: Vehicle | null;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ onBack, onSave, vehicle }) => {
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    placa: '',
    tipo: 'Fiorino',
    capacidade_kg: 0,
    cubagem_m3: 0,
    status: 'ativo'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
    }
  }, [vehicle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    if (type === 'number') {
      parsedValue = value === '' ? 0 : parseFloat(value);
    }
    
    // Auto-uppercase placa
    if (name === 'placa') {
      parsedValue = String(parsedValue).toUpperCase();
    }

    setFormData(prev => ({ ...prev, [name]: parsedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.placa) newErrors.placa = 'A placa é obrigatória';
    if (!formData.tipo) newErrors.tipo = 'O tipo de veículo é obrigatório';
    if (formData.capacidade_kg === undefined || formData.capacidade_kg < 0) newErrors.capacidade_kg = 'Capacidade inválida';
    if (formData.cubagem_m3 === undefined || formData.cubagem_m3 < 0) newErrors.cubagem_m3 = 'Cubagem inválida';
    
    // Basic placa format validation (ABC-1234 or ABC1D23)
    const placaRegex = /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/;
    if (formData.placa && !placaRegex.test(formData.placa)) {
      newErrors.placa = 'Formato de placa inválido (ABC-1234 ou ABC1D23)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-300"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {vehicle ? 'Editar Veículo' : 'Novo Veículo'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {vehicle ? 'Atualize os dados do veículo' : 'Cadastre um novo veículo na frota'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6 text-cyan-600 dark:text-cyan-400 font-medium">
            <Truck size={20} />
            <h2>Dados do Veículo</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Placa *
              </label>
              <input
                type="text"
                name="placa"
                value={formData.placa}
                onChange={handleChange}
                placeholder="ABC-1234"
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white uppercase ${
                  errors.placa ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.placa && <p className="mt-1 text-sm text-red-500">{errors.placa}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Veículo *
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none dark:bg-gray-700 dark:text-white"
              >
                <option value="Moto">Moto</option>
                <option value="Fiorino">Fiorino / Van Pequena</option>
                <option value="Van">Van Grande / VUC</option>
                <option value="Toco">Caminhão Toco</option>
                <option value="Truck">Caminhão Truck</option>
                <option value="Carreta">Carreta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Capacidade (kg) *
              </label>
              <input
                type="number"
                name="capacidade_kg"
                value={formData.capacidade_kg}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-cyan-500 outline-none dark:bg-gray-700 dark:text-white ${
                  errors.capacidade_kg ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.capacidade_kg && <p className="mt-1 text-sm text-red-500">{errors.capacidade_kg}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cubagem (m³) *
              </label>
              <input
                type="number"
                name="cubagem_m3"
                value={formData.cubagem_m3}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-cyan-500 outline-none dark:bg-gray-700 dark:text-white ${
                  errors.cubagem_m3 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.cubagem_m3 && <p className="mt-1 text-sm text-red-500">{errors.cubagem_m3}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none dark:bg-gray-700 dark:text-white"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="manutencao">Em Manutenção</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {isSubmitting ? 'Salvando...' : 'Salvar Veículo'}
          </button>
        </div>
      </form>
    </div>
  );
};
