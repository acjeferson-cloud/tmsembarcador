import { useContext } from 'react';
import { InnovationsContext } from '../contexts/InnovationsContext';

export const useInnovations = () => {
  const context = useContext(InnovationsContext);
  if (context === undefined) {
    throw new Error('useInnovations must be used within an InnovationsProvider');
  }
  return context;
};
