import React, { useState } from 'react';
import { Plus, Trash2, Mail, Phone, Info } from 'lucide-react';
import { CarrierContact } from '../../types';

interface CarrierContactsTabProps {
  contacts: CarrierContact[];
  onChange: (contacts: CarrierContact[]) => void;
}

const CONTACT_TYPES = [
  { id: 'pricing', label: 'Comercial / Pricing', tooltip: 'Recebe: Cotações Manuais (Spot) e tabelas.' },
  { id: 'pickup', label: 'Coleta', tooltip: 'Recebe: Solicitação de Coleta.' },
  { id: 'reverse_logistics', label: 'Logística Reversa', tooltip: 'Recebe: Solicitações de Logística Reversa.' },
  { id: 'tracking', label: 'Operacional / SAC / Tracking', tooltip: 'Recebe: Divergências de CT-es, e acompanhamento de entregas.' },
  { id: 'billing', label: 'Financeiro / Faturamento', tooltip: 'Recebe: Divergências de Faturas SAP.' },
  { id: 'integration', label: 'TI / Integração', tooltip: 'Recebe: Avisos de erros em envios EDI (OCOREN/CONEMB/NOTFIS).' },
  { id: 'management', label: 'Diretoria / Gerência', tooltip: 'Recebe: Escalonamentos de problemas graves.' }
];

export const CarrierContactsTab: React.FC<CarrierContactsTabProps> = ({ contacts, onChange }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handleAddContact = () => {
    const newContact: CarrierContact = {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
      role: '',
      contact_types: [],
      is_primary: contacts.length === 0,
    };
    onChange([...contacts, newContact]);
  };

  const handleRemoveContact = (id: string) => {
    const newContacts = contacts.filter(c => c.id !== id);
    if (newContacts.length > 0 && contacts.find(c => c.id === id)?.is_primary) {
      newContacts[0].is_primary = true;
    }
    onChange(newContacts);
  };

  const handleChange = (id: string, field: keyof CarrierContact, value: any) => {
    const newContacts = contacts.map(contact => {
      if (contact.id === id) {
        if (field === 'is_primary' && value === true) {
          return { ...contact, [field]: value };
        }
        return { ...contact, [field]: value };
      }
      if (field === 'is_primary' && value === true) {
        return { ...contact, is_primary: false };
      }
      return contact;
    });
    onChange(newContacts);
  };

  const toggleContactType = (contactId: string, typeId: string) => {
    const newContacts = contacts.map(contact => {
      if (contact.id === contactId) {
        const types = contact.contact_types || [];
        const newTypes = types.includes(typeId) 
          ? types.filter(t => t !== typeId)
          : [...types, typeId];
        return { ...contact, contact_types: newTypes };
      }
      return contact;
    });
    onChange(newContacts);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Pessoas de Contato
            <div className="relative inline-block" 
                 onMouseEnter={() => setShowTooltip(true)} 
                 onMouseLeave={() => setShowTooltip(false)}>
              <button type="button" className="text-gray-400 hover:text-blue-500 transition-colors cursor-help">
                <Info size={18} />
              </button>
              {showTooltip && (
                <div className="absolute z-10 left-full ml-2 top-0 w-80 bg-gray-900 text-white text-xs rounded shadow-lg p-3">
                  <p className="font-bold mb-2">Tipos de Contato:</p>
                  <ul className="space-y-2">
                    {CONTACT_TYPES.map(type => (
                      <li key={type.id}>
                        <span className="font-semibold">{type.label}:</span> {type.tooltip}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-gray-400 italic">Múltiplos e-mails são permitidos separando por ponto e vírgula (;).</p>
                </div>
              )}
            </div>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie as pessoas de contato desta transportadora e suas respectivas áreas de atuação.</p>
        </div>
        <button
          type="button"
          onClick={handleAddContact}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Adicionar Contato</span>
        </button>
      </div>

      <div className="space-y-6">
        {contacts.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Nenhum contato cadastrado.</p>
          </div>
        ) : (
          contacts.map((contact, index) => (
            <div key={contact.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg relative bg-gray-50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => handleRemoveContact(contact.id)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                title="Remover Contato"
              >
                <Trash2 size={18} />
              </button>

              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Contato #{index + 1}</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={e => handleChange(contact.id, 'name', e.target.value)}
                    required
                    placeholder="Digite o nome completo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-mail *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={contact.email}
                      onChange={e => handleChange(contact.id, 'email', e.target.value)}
                      required
                      placeholder="email1@empresa.com; email2@empresa.com"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefone *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={contact.phone}
                      onChange={e => handleChange(contact.id, 'phone', formatPhoneNumber(e.target.value))}
                      required
                      placeholder="(00) 00000-0000"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={contact.role}
                    onChange={e => handleChange(contact.id, 'role', e.target.value)}
                    placeholder="Ex: Gerente Comercial"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Áreas de Atuação (Selecione um ou mais)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {CONTACT_TYPES.map(type => (
                    <label key={type.id} className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={contact.contact_types?.includes(type.id)}
                        onChange={() => toggleContactType(contact.id, type.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contact.is_primary}
                    onChange={e => handleChange(contact.id, 'is_primary', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Definir como contato principal
                  </span>
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
