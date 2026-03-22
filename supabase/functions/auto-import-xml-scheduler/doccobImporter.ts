import { parseDoccob } from './doccobParser.ts';

export const processDoccobExtracted = async (
  supabaseClient: any, 
  content: string, 
  estab: any, 
  detailsList: any[]
): Promise<void> => {
  try {
    const parsedBills = parseDoccob(content);
    let billsProcessed = 0;
    let ctesLinked = 0;

    for (const parsedBill of parsedBills) {
      try {
        const { data: billData, error: billError } = await supabaseClient
          .from('bills')
          .upsert({
            organization_id: estab.organization_id || null,
            environment_id: estab.environment_id || null,
            establishment_id: estab.id || null,
            bill_number: parsedBill.bill_number,
            issue_date: parsedBill.issue_date.toISOString(),
            due_date: parsedBill.due_date ? parsedBill.due_date.toISOString() : null,
            customer_name: parsedBill.customer_name || null,
            customer_document: parsedBill.customer_document || null,
            total_value: parsedBill.total_value,
            status: 'importado'
          }, { onConflict: 'bill_number' })
          .select('id')
          .maybeSingle();

        if (billError) {
          detailsList.push({ message: `Erro ao salvar fatura DOCCOB ${parsedBill.bill_number}`, error: billError.message });
          continue;
        }

        if (!billData) {
            detailsList.push({ message: `Fatura ${parsedBill.bill_number} lida, mas ID não retornado no RPC.` });
            continue;
        }
        
        billsProcessed++;

        if (parsedBill.ctes_data && parsedBill.ctes_data.length > 0) {
          const numbersList = parsedBill.ctes_data.map(cte => cte.number);

          const { data: matchedCtes, error: searchError } = await supabaseClient
              .from('ctes_complete')
              .select('id, number, series')
              .in('number', numbersList);
              
          if (searchError) {
              detailsList.push({ message: `Erro ao buscar relacionamentos de CT-es na fatura ${parsedBill.bill_number}.`, error: searchError.message });
              continue;
          }

          const ctesMap = new Map((matchedCtes || []).map((cte: any) => [cte.number, cte.id]));

          const linksToInsert = parsedBill.ctes_data.map(cteData => ({
              bill_id: billData.id,
              cte_id: ctesMap.get(cteData.number) || null,
              cte_number: cteData.number,
              cte_series: cteData.series
          }));

          await supabaseClient
              .from('bill_ctes')
              .delete()
              .eq('bill_id', billData.id);

          const { error: linkError } = await supabaseClient
              .from('bill_ctes')
              .insert(linksToInsert);

          if (linkError) {
              detailsList.push({ message: `Falha ao vincular CTe na fatura ${parsedBill.bill_number}`, error: linkError.message });
          } else {
              ctesLinked += ctesMap.size;
          }
        }

      } catch (err: any) {
        detailsList.push({ message: `Exceção inesperada na fatura ${parsedBill.bill_number}`, error: err.message });
      }
    }

    if (billsProcessed > 0) {
      detailsList.push({ message: `Processamento EDI finalizado. ${billsProcessed} fatura(s), ${ctesLinked} CTe(s) linkado(s).` });
    }

  } catch (err: any) {
    detailsList.push({ message: `Falha no motor principal de leitura DOCCOB.`, error: err.message });
  }
};
