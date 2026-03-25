import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
}

interface AutocompleteSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = isOpen ? searchTerm : (selectedOption ? selectedOption.label : '');

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`relative flex items-center w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : 'focus-within:ring-2 focus-within:ring-blue-500 cursor-pointer'}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            if (!isOpen) setSearchTerm('');
          }
        }}
      >
        <input
          type="text"
          className="w-full bg-transparent outline-none cursor-pointer disabled:cursor-not-allowed placeholder-gray-500 dark:placeholder-gray-400"
          placeholder={selectedOption ? selectedOption.label : placeholder}
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          disabled={disabled}
        />
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors ${opt.value === value ? 'bg-blue-50 dark:bg-gray-600 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
};
