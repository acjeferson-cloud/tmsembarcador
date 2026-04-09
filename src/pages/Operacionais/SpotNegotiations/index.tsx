import React, { useState } from 'react';
import { SpotNegotiationList } from './SpotNegotiationList';
import { SpotNegotiationForm } from './SpotNegotiationForm';

export const SpotNegotiations: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');

  return (
    <>
      {view === 'list' && <SpotNegotiationList onNew={() => setView('form')} />}
      {view === 'form' && <SpotNegotiationForm onBack={() => setView('list')} />}
    </>
  );
};

export default SpotNegotiations;
