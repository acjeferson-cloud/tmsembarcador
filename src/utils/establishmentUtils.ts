export const getCurrentEstablishmentId = (): string | null => {
  const savedEstablishment = localStorage.getItem('tms-current-establishment');
  if (!savedEstablishment) return null;
  
  try {
    const establishment = JSON.parse(savedEstablishment);
    return establishment.establishment_id || null;
  } catch (error) {
    console.error('Error parsing current establishment:', error);
    return null;
  }
};
