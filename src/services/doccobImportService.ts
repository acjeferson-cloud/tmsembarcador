import { supabase } from '../lib/supabase';
import { parseDoccob } from '../utils/edi/doccobParser';

export const doccobImportService = {
  /**
   * Lê o arquivo de EDI DOCCOB, grava as Faturas e cria relacionamentos com os CTes no banco
   */
  async processFile(content: string, organizationId?: string, environmentId?: string, establishmentId?: string): Promise<{ success: boolean; billsProcessed: number; ctesLinked: number; errors: string[] }> {
    try {
      const parsedBills = parseDoccob(content);
      let billsProcessed = 0;
      let ctesLinked = 0;
      const errors: string[] = [];

      // Context check (defaults to what is available or requires passing them down depending on app flow)
      // Usually you fetch the current user context or session if they aren't provided.
      // Assuming they will be inserted with or without Context if RLS permits.

      for (const parsedBill of parsedBills) {
        try {
          // 1. Insert the Bill
          const { data: billData, error: billError } = await (supabase as any)
            .from('bills')
            .upsert({
              organization_id: organizationId || null,
              environment_id: environmentId || null,
              establishment_id: establishmentId || null,
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
            errors.push(`Erro ao salvar a fatura ${parsedBill.bill_number}: ${billError.message}`);
            continue;
          }

          if (!billData) {
              errors.push(`Fatura ${parsedBill.bill_number} inserida mas não retornou ID.`);
              continue; // If RLS prevents reading it back
          }
          
          billsProcessed++;

          // 2. Link the CT-es
          if (parsedBill.ctes_data && parsedBill.ctes_data.length > 0) {
            
            // Extract just the numbers for the IN query
            const numbersList = parsedBill.ctes_data.map(cte => cte.number);

            // Search internally for these CTEs using the 'ctes_complete' table
            const { data: matchedCtes, error: searchError } = await (supabase as any)
                .from('ctes_complete')
                .select('id, number, series')
                .in('number', numbersList);
                
            if (searchError) {
                errors.push(`Erro ao buscar CT-es para a fatura ${parsedBill.bill_number}: ${searchError.message}`);
                continue;
            }

            // Improve matching by number+series if both present, but typically number is enough
            const ctesMap = new Map((matchedCtes || []).map((cte: any) => [cte.number, cte.id]));

            const linksToInsert = parsedBill.ctes_data.map(cteData => ({
                bill_id: billData.id,
                cte_id: ctesMap.get(cteData.number) || null,
                cte_number: cteData.number,
                cte_series: cteData.series,
                organization_id: organizationId || null,
                environment_id: environmentId || null,
                establishment_id: establishmentId || null
            }));

            // Insert links sequentially to avoid duplicates since we 'upsert' bills, 
            // but for bill_ctes we might just insert new ones if we aren't careful, 
            // so let's delete existing links for this bill first (simplest approach for 'upserting' relations)
            await (supabase as any)
                .from('bill_ctes')
                .delete()
                .eq('bill_id', billData.id);

            const { error: linkError } = await (supabase as any)
                .from('bill_ctes')
                .insert(linksToInsert);

            if (linkError) {
                errors.push(`Erro ao linkar os CT-es da fatura ${parsedBill.bill_number}: ${linkError.message}`);
            } else {
                ctesLinked += ctesMap.size;
            }
          }

        } catch (err: any) {
          errors.push(`Erro inesperado na fatura ${parsedBill.bill_number}: ${err.message}`);
        }
      }

      return {
        success: errors.length === 0 || billsProcessed > 0,
        billsProcessed,
        ctesLinked,
        errors
      };

    } catch (err: any) {
      return { success: false, billsProcessed: 0, ctesLinked: 0, errors: [err.message] };
    }
  }
};
