import React, { useState } from 'react';
import { SpotNegotiationList } from './SpotNegotiationList';
import { SpotNegotiationForm } from './SpotNegotiationForm';

export const SpotNegotiations: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  return (
    <>
      {view === 'list' && (
        <SpotNegotiationList 
          onNew={() => { setEditId(null); setIsReadOnly(false); setView('form'); }} 
          onEdit={(id) => { setEditId(id); setIsReadOnly(false); setView('form'); }}
          onView={(id) => { setEditId(id); setIsReadOnly(true); setView('form'); }}
        />
      )}
      {view === 'form' && (
        <SpotNegotiationForm 
          initialId={editId || undefined} 
          isReadOnly={isReadOnly}
          onBack={() => { setEditId(null); setIsReadOnly(false); setView('list'); }} 
        />
      )}
    </>
  );
};

export default SpotNegotiations;
