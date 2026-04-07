const fs = require('fs');
let content = fs.readFileSync('c:\\\\desenvolvimento\\\\tmsembarcador\\\\src\\\\services\\\\implementationService.ts', 'utf-8');

const startMarker = 'async processFreightTablesImport(';
const endMarker = 'async processCitiesImport(';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + `async processFreightTablesImport(
    file: File,
    user: any,
    currentEstablishmentId?: string
  ): Promise<{ success: boolean; logId?: string; message: string; recordsProcessed?: number; errors?: string[] }> {
    try {
      const { processFreightRatesFile } = await import('./templateService');
      const { parseBulkFreightRates } = await import('./freightRateParser');
      const { supabase } = await import('../lib/supabase');

      const performedBy = Number(user.id) || 0;

      const logResult = await this.createImportLog({
        import_type: 'freight_tables',
        file_name: file.name,
        records_processed: 0,
        records_success: 0,
        records_error: 0,
        status: 'processing',
        performed_by: performedBy
      });

      if (!logResult.success || !logResult.id) {
        return { success: false, message: 'Erro ao criar log de importação' };
      }

      const flatData = await processFreightRatesFile(file);

      const tenantContext = {
        organization_id: user.organization_id,
        environment_id: user.environment_id,
        establishment_id: currentEstablishmentId || user.establishment_id,
        created_by: String(user.id)
      };

      const parseInfo = await parseBulkFreightRates(flatData, tenantContext);

      if (!parseInfo.success || parseInfo.errors.length > 0) {
        await this.updateImportLog(logResult.id, {
          records_processed: flatData.length,
          records_error: flatData.length,
          status: 'failed',
          errors: parseInfo.errors
        });
        return { success: false, message: 'Erro estrutural na planilha', errors: parseInfo.errors, recordsProcessed: flatData.length };
      }

      // Tudo certo com o parsing, hora do Bulk Insert via Transaction ou individual bulk insert
      let recordsSuccess = 0;
      let tablesCount = 0;
      let ratesCount = 0;
      let detailsCount = 0;
      const errors = [];

      try {
        if (parseInfo.tables && parseInfo.tables.length > 0) {
          const { error: tablesError, data: createdTables } = await supabase.from('freight_rate_tables').insert(parseInfo.tables).select();
          if (tablesError) throw tablesError;
          tablesCount = createdTables?.length || 0;
          
          // Re-mapear rate._tableKey pro novo ID
          if (parseInfo.rates && parseInfo.rates.length > 0 && createdTables) {
            parseInfo.rates.forEach(rate => {
              // _tableKey was table_name + carrier_id
              const tableMatch = createdTables.find(t => t.nome === (rate as any)._tableKey.split('_')[0] && t.transportador_id === (rate as any)._tableKey.split('_')[1]);
              if (tableMatch) rate.freight_rate_table_id = tableMatch.id;
              delete (rate as any)._tableKey;
            });
            
            // Clean up missing foreign keys just in case
            const validRates = parseInfo.rates.filter(r => r.freight_rate_table_id);
            const { error: ratesError, data: createdRates } = await supabase.from('freight_rates').insert(validRates).select();
            if (ratesError) throw ratesError;
            ratesCount = createdRates?.length || 0;

            if (parseInfo.details && parseInfo.details.length > 0 && createdRates) {
               parseInfo.details.forEach(detail => {
                  const rateMatch = createdRates.find(r => (detail as any)._rateKey.includes(r.codigo) && (detail as any)._rateKey.includes((r as any)._origem || ''));
                  if (rateMatch) detail.freight_rate_id = rateMatch.id;
                  delete (detail as any)._rateKey;
               });
               const validDetails = parseInfo.details.filter(d => d.freight_rate_id);
               const { error: detailsError } = await supabase.from('freight_rate_details').insert(validDetails);
               if (detailsError) throw detailsError;
               detailsCount = validDetails.length;
            }

            // We must insert freight_rate_cities!
            if (createdRates) {
               const rateCities = [];
               for (const r of createdRates) {
                  if ((r as any)._destino_cidade) {
                     // Busca a cidade no banco
                     const { data: dbCity } = await supabase.from('cities').select('id').ilike('nome', (r as any)._destino_cidade).limit(1).single();
                     if (dbCity) {
                       rateCities.push({
                         freight_rate_id: r.id,
                         freight_rate_table_id: r.freight_rate_table_id,
                         city_id: dbCity.id,
                         delivery_days: r.prazo_entrega
                       });
                     }
                  }
               }
               if (rateCities.length > 0) {
                 await supabase.from('freight_rate_cities').insert(rateCities);
               }
            }
          }
        }
        
        recordsSuccess = flatData.length;

        // Cleanup injected proxy properties
        // The ones with _ will be ignored by supabase if they aren't part of schema, but we deleted them anyway.

      } catch (insertError: any) {
        errors.push("Falha de persistência no Banco: " + insertError.message);
      }

      await this.updateImportLog(logResult.id, {
        records_processed: flatData.length,
        records_success: recordsSuccess,
        records_error: errors.length > 0 ? Object.keys(flatData).length : 0,
        status: errors.length > 0 ? 'failed' : 'completed',
        errors: errors,
        summary: {
           tabelas_importadas: tablesCount,
           tarifas_geradas: ratesCount,
           faixas_processadas: detailsCount,
        }
      });

      return {
        success: errors.length === 0,
        logId: logResult.id,
        message: errors.length === 0 ? \`Importação efetuada. Tabelas: \${tablesCount}, Rotas: \${ratesCount}, Faixas: \${detailsCount}.\` : 'Falha na persistência',
        recordsProcessed: flatData.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error: any) {
      return { success: false, message: 'Erro interno ao processar: ' + error.message };
    }
  },

  ` + content.substring(endIndex);
  fs.writeFileSync('c:\\\\desenvolvimento\\\\tmsembarcador\\\\src\\\\services\\\\implementationService.ts', newContent);
  console.log("Substituido com sucesso 3!");
} else {
  console.log("Indices nao encontrados", startIndex, endIndex);
}
