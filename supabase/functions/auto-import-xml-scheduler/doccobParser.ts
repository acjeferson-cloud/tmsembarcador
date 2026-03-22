export interface DoccobBill {
  customer_name?: string;
  customer_document?: string;
  bill_number: string;
  issue_date: Date;
  due_date?: Date;
  total_value: number;
  ctes_data: { number: string; series: string }[];
}

export const parseDoccob = (content: string): DoccobBill[] => {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  const bills: DoccobBill[] = [];
  let currentBill: Partial<DoccobBill> | null = null;
  let generalCustomerDoc = '';
  let generalCustomerName = '';

  for (const line of lines) {
    const regType = line.substring(0, 3);
    
    if (regType === '350') {
      continue;
    }
    else if (regType === '351') {
      generalCustomerDoc = line.substring(3, 17).trim(); // CNPJ
      generalCustomerName = line.substring(17, 57).trim(); // Nome
    }
    else if (regType === '352') {
      if (currentBill && currentBill.bill_number) {
        bills.push(currentBill as DoccobBill);
      }
      
      let billNumber = line.substring(17, 27).trim().replace(/^0+/, '');
      if (billNumber === '') billNumber = '0';
      
      const issueDateStr = line.substring(27, 35); 
      let issueDate = new Date();
      if (issueDateStr && issueDateStr.length === 8) {
        const day = parseInt(issueDateStr.substring(0, 2), 10);
        const month = parseInt(issueDateStr.substring(2, 4), 10) - 1;
        const year = parseInt(issueDateStr.substring(4, 8), 10);
        issueDate = new Date(year, month, day);
      }

      const dueDateStr = line.substring(35, 43);
      let dueDate: Date | undefined;
      if (dueDateStr && dueDateStr.length === 8 && dueDateStr.trim() !== '00000000') {
        const day = parseInt(dueDateStr.substring(0, 2), 10);
        const month = parseInt(dueDateStr.substring(2, 4), 10) - 1;
        const year = parseInt(dueDateStr.substring(4, 8), 10);
        dueDate = new Date(year, month, day);
      }

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
    else if (regType === '353') {
      if (currentBill) {
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
  }
  
  if (currentBill && currentBill.bill_number) {
    bills.push(currentBill as DoccobBill);
  }

  return bills;
};
