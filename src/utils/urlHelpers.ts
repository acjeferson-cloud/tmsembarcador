export const getBaseUrl = (): string => {
  // Prioridade 1: Usar VITE_APP_URL se estiver definida
  const envAppUrl = import.meta.env.VITE_APP_URL;
  if (envAppUrl && envAppUrl.trim() !== '') {
    return envAppUrl.trim();
  }

  // Prioridade 2: Usar window.location.origin como fallback
  const origin = window.location.origin;

  // Para localhost real ou ambientes de desenvolvimento
  if (
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('.local-credentialless') ||
    origin.includes('bolt.new') ||
    origin.includes('stackblitz') ||
    origin.includes('webcontainer')
  ) {
    return origin;
  }

  // Para produção, retornar o origin
  return origin;
};
