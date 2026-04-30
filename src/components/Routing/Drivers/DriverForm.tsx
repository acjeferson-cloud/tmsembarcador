import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { Driver } from '../../../services/driversService';

interface DriverFormProps {
  onBack: () => void;
  onSave: (driver: Partial<Driver>) => void;
  driver: Driver | null;
}

export const DriverForm: React.FC<DriverFormProps> = ({ onBack, onSave, driver }) => {
  const [formData, setFormData] = useState<Partial<Driver>>({
    nome: '',
    cpf: '',
    cnh: '',
    telefone: '',
    status: 'livre'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (driver) {
      setFormData(driver);
    }
  }, [driver]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome || formData.nome.trim().length < 3) {
      newErrors.nome = 'Nome completo é obrigatório';
    }
    
    // Very basic cpf / cnh validation (just check length if provided)
    if (formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF inválido';
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
              {driver ? 'Editar Motorista' : 'Novo Motorista'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {driver ? 'Atualize os dados do motorista' : 'Cadastre um novo motorista para a frota'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6 text-slate-600 dark:text-slate-400 font-medium">
            <Users size={20} />
            <h2>Dados Pessoais e Profissionais</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: João da Silva"
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white ${
                  errors.nome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.nome && <p className="mt-1 text-sm text-red-500">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CPF
              </label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-slate-500 outline-none dark:bg-gray-700 dark:text-white ${
                  errors.cpf ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.cpf && <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CNH
              </label>
              <input
                type="text"
                name="cnh"
                value={formData.cnh}
                onChange={handleChange}
                placeholder="Nº de Registro"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-slate-500 outline-none dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone Celular
              </label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-slate-500 outline-none dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status Inicial *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-slate-500 outline-none dark:bg-gray-700 dark:text-white"
              >
                <option value="livre">Livre</option>
                <option value="em_viagem">Em Viagem</option>
                <option value="inativo">Inativo</option>
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
            className="px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {isSubmitting ? 'Salvando...' : 'Salvar Motorista'}
          </button>
        </div>
      </form>
    </div>
  );
};
