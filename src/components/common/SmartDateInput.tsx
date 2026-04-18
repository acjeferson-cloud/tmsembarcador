import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface SmartDateInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const SmartDateInput: React.FC<SmartDateInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "DD/MM/AAAA",
  className = "w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
}) => {
  const formatToBR = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return '';
  };

  const [text, setText] = useState(formatToBR(value));

  useEffect(() => {
    setText(formatToBR(value));
  }, [value]);

  const handleBlur = () => {
    let currentText = text.trim();
    if (!currentText) {
      onChange('');
      return;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

    if (/^\d{1,2}$/.test(currentText)) {
      const day = currentText.padStart(2, '0');
      const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
      const validDay = Math.min(parseInt(day, 10), daysInMonth).toString().padStart(2, '0');
      
      currentText = `${validDay}/${currentMonth}/${currentYear}`;
    } 
    else if (/^\d{4}$/.test(currentText)) {
      const d = currentText.slice(0, 2);
      const m = currentText.slice(2, 4);
      currentText = `${d}/${m}/${currentYear}`;
    }
    else if (/^\d{1,2}\/\d{1,2}$/.test(currentText)) {
      const [d, m] = currentText.split('/');
      const paddedD = d.padStart(2, '0');
      const paddedM = m.padStart(2, '0');
      currentText = `${paddedD}/${paddedM}/${currentYear}`;
    }
    else if (/^\d{8}$/.test(currentText)) {
      const d = currentText.slice(0, 2);
      const m = currentText.slice(2, 4);
      const y = currentText.slice(4, 8);
      currentText = `${d}/${m}/${y}`;
    }

    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = currentText.match(dateRegex);
    if (match) {
      const [_, d, m, y] = match;
      const isoStr = `${y}-${m}-${d}`;
      const parsedDate = new Date(`${isoStr}T12:00:00Z`);
      if (!isNaN(parsedDate.getTime())) {
        setText(currentText);
        onChange(isoStr);
        return;
      }
    }
    
    setText(formatToBR(value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  return (
    <div className="relative w-full flex items-center">
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute right-0 top-0 bottom-0 opacity-0 w-10 h-full cursor-pointer"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      />
      <Calendar className="absolute right-3 text-gray-400 pointer-events-none" size={16} />
    </div>
  );
};
