/**
 * Utilidades para parseamento de arquivos EDI no layout DOCCOB
 * Layout focado em Faturas (Registros 350, 351, 352, 353 e 354)
 */

export interface DoccobBill {
  customer_name?: string;
  customer_document?: string;
  bill_number: string;
  issue_date: Date;
  due_date?: Date;
  total_value: number;
  ctes_data: { number: string; series: string }[];
}

/**
 * Faz o parseamento do conteúdo original do TXT no layout DOCCOB
 */
export const parseDoccob = (content: string): DoccobBill[] => {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  const bills: DoccobBill[] = [];
  let currentBill: Partial<DoccobBill> | null = null;
  let generalCustomerDoc = '';
  let generalCustomerName = '';

  for (const line of lines) {
    const regType = line.substring(0, 3);
    
    // Registro 350 - Cabecalho do intercâmbio
    if (regType === '350') {
      // Pode conter informações gerais, não sendo obrigatório extrair o recebedor aqui para nosso caso
      continue;
    }
    
    // Registro 351 - Documento/Nome Transportadora
    else if (regType === '351') {
      generalCustomerDoc = line.substring(3, 17).trim(); // CNPJ
      generalCustomerName = line.substring(17, 57).trim(); // Nome
    }
    
    // Registro 352 - Dados da Fatura (Inicia uma nova fatura)
    else if (regType === '352') {
      // Se já tinha uma fatura em andamento, push pro array antes de resetar
      if (currentBill && currentBill.bill_number) {
        bills.push(currentBill as DoccobBill);
      }
      
      // Número da fatura (pos 18-27 => indices 17-27, length 10)
      let billNumber = line.substring(17, 27).trim().replace(/^0+/, '');
      if (billNumber === '') billNumber = '0';
      
      // Datas no formato DDMMAAAA
      // Data de Emissão (pos 28-35 => indices 27-35, length 8)
      const issueDateStr = line.substring(27, 35); 
      let issueDate = new Date();
      if (issueDateStr && issueDateStr.length === 8) {
        const day = parseInt(issueDateStr.substring(0, 2), 10);
        const month = parseInt(issueDateStr.substring(2, 4), 10) - 1;
        const year = parseInt(issueDateStr.substring(4, 8), 10);
        issueDate = new Date(year, month, day);
      }

      // Data de Vencimento (pos 36-43 => indices 35-43, length 8)
      const dueDateStr = line.substring(35, 43);
      let dueDate: Date | undefined;
      if (dueDateStr && dueDateStr.length === 8 && dueDateStr.trim() !== '00000000') {
        const day = parseInt(dueDateStr.substring(0, 2), 10);
        const month = parseInt(dueDateStr.substring(2, 4), 10) - 1;
        const year = parseInt(dueDateStr.substring(4, 8), 10);
        dueDate = new Date(year, month, day);
      }

      // Valor total (pos 44-58 => length 15 => indices 43-58)
      const valueStr = line.substring(43, 58).trim() || '0';
      const totalValue = parseInt(valueStr, 10) / 100;
      
      currentBill = {
        bill_number: billNumber,
        issue_date: issueDate,
        due_date: dueDate,
        total_value: totalValue,
        customer_document: generalCustomerDoc,
        customer_name: generalCustomerName,
        ctes_data: []
      };
    }
    
    // Registro 353 - Documentos do Frete (CTE)
    else if (regType === '353') {
      if (currentBill) {
        // Posição x (O usuário disse 710126 inves de 7101267, quebrando no 15 size 9.
        // Se 14, 5 é a serie, então o CT-e numero é 19...
        // O layout DOCCOB 3.1 diz: Serie pos 13 size 5 (index 12-17). Numero pos 18 size 12 (index 17-29)
        // Corrigindo para os indices reais da fita 353 (Pos 14 = index 13, Pos 19 = index 18)
        const realCteSeries = line.substring(13, 18).trim().replace(/^0+/, '') || '0'; 
        const realCteNumber = line.substring(18, 30).trim().replace(/^0+/, '');
        
        if (realCteNumber) {
          currentBill.ctes_data!.push({
             number: realCteNumber,
             series: realCteSeries
          });
        }
      }
    }
    
    // Registro 354, 355 etc - Totais / outros (Ignorar nesta 1a versão conforme o plano)
  }
  
  // Confirma a ultima fatura parseada
  if (currentBill && currentBill.bill_number) {
    bills.push(currentBill as DoccobBill);
  }

  return bills;
};
