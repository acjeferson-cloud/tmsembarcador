import React, { useState } from 'react';
import { SpotNegotiationList } from './SpotNegotiationList';
import { SpotNegotiationForm } from './SpotNegotiationForm';

export const SpotNegotiations: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <>
      {view === 'list' && (
        <SpotNegotiationList 
          onNew={() => { setEditId(null); setView('form'); }} 
          onEdit={(id) => { setEditId(id); setView('form'); }}
        />
      )}
      {view === 'form' && (
        <SpotNegotiationForm 
          initialId={editId || undefined} 
          onBack={() => { setEditId(null); setView('list'); }} 
        />
      )}
    </>
  );
};

export default SpotNegotiations;
