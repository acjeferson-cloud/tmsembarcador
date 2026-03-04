interface CEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export const cepService = {
  async searchByCEP(cep: string): Promise<CEPResponse | null> {
    try {
      const cleanCEP = cep.replace(/\D/g, '');
      if (cleanCEP.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (data.erro) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  },

  async searchByCity(city: string, state: string): Promise<string | null> {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${state}/${city}/json/`);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        return data[0].cep;
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar cidade:', error);
      return null;
    }
  }
};