import { supabase } from '../lib/supabase';
import { occurrencesService } from './occurrencesService';
import { carriersService } from './carriersService';
import { trackingService } from './trackingService';
import { deliveryNotificationHandler } from './deliveryNotificationHandler';

export interface OcorenProcessResult {
  recordsProcessed: number;
  occurrencesSaved: number;
  errors: string[];
}

export const ocorenImportService = {
  processFile: async (content: string): Promise<OcorenProcessResult> => {
    const lines = content.split(/\r?\n/);
    let currentCarrierId: string | null = null;
    let blockActive = false;
    
    // Primeiro em cache todas as ocorrências mapeadas e ativas do sistema
    const allOccurrences = await occurrencesService.getAll();
    const occurrenceMap = new Map();
    allOccurrences.forEach(o => occurrenceMap.set(o.codigo, o));

    let processedCount = 0;
    let successCount = 0;
    const errors: string[] = [];
    
    // Cache de transportadores por performance
    const carriers = await carriersService.getAll();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().length === 0) continue;

      // 340 - Identifica Header Ocorrências
      if (line.startsWith('340')) {
        if (line.includes('OCORR')) {
          blockActive = true;
        }
        continue;
      }

      // 341 - Identificação Transportador (Pegando CNPJ substring 3 a 17)
      if (blockActive && line.startsWith('341')) {
        const cnpjStr = line.substring(3, 17);
        const cnpjDigits = cnpjStr.replace(/\D/g, '');
        
        const carrierMatch = carriers.find(c => {
           const cCnpj = c.cnpj?.replace(/\D/g, '');
           return cCnpj && cCnpj === cnpjDigits;
        });
        
        if (carrierMatch) {
           currentCarrierId = carrierMatch.id;
        } else {
           errors.push(`Linha ${i + 1}: Transportador não encontrado para o CNPJ EDI '${cnpjStr}'. Ocorrências vinculadas a este CNPJ serão ignoradas.`);
           currentCarrierId = null;
        }
      }

      // 342 - Detalhe Ocorrência
      if (blockActive && line.startsWith('342')) {
        processedCount++;
        
        if (!currentCarrierId) {
          errors.push(`Linha ${i + 1}: Ignorando ocorrência pois transportador não pôde ser identificado.`);
          continue;
        }

        const serie = line.substring(17, 20).trim(); // Pos 18 a 20 em formato 1-indexado (tamanho 3)
        const numeroRaw = line.substring(20, 28).trim(); // Pos 21 em formato 1-indexado (tamanho 8)
        const numero = parseInt(numeroRaw, 10).toString(); // remove zeros a esquerda
        
        if (!numero || numero === 'NaN') {
           errors.push(`Linha ${i + 1}: Número de NF ausente ou inválido na extração ("${numeroRaw}").`);
           continue;
        }

        let codigo = line.substring(28, 30).trim(); // Pos 29 (tamanho 2)
        codigo = codigo.padStart(2, '0'); // Garante 2 dígitos mapeados no BD

        const occurrenceDesc = occurrenceMap.get(codigo);
        if (!occurrenceDesc) {
           errors.push(`Linha ${i + 1}: O Código de histórico '${codigo}' não está cadastrado no sistema (NF-e ${numero}). Impossível classificar.`);
           continue;
        }

        const { data: matchedNFs, error: nfError } = await (supabase as any)
          .from('invoices_nfe')
          .select('id, numero, serie, metadata')
          .eq('numero', numero)
          .eq('carrier_id', currentCarrierId);
        
        if (nfError || !matchedNFs || matchedNFs.length === 0) {
           errors.push(`Linha ${i + 1}: Nota Fiscal ${numero} não encontrada na base do TMS vinculada ao transportador especificado.`);
           continue;
        }

        // Caso exista mais de 1 (mesmo CNPJ, mesmo Numero), tenta o desempate usando Serie
        let nfMatch: any = matchedNFs[0];
        if (matchedNFs.length > 1 && serie && serie.replace(/^0+/, '') !== '') {
           const cleanedLayoutSerie = serie.replace(/^0+/, '');
           const exactSerieMatch = (matchedNFs as any[]).find(n => {
             const cSerie = n.serie ? n.serie.toString().replace(/^0+/, '') : '';
             return cSerie === cleanedLayoutSerie;
           });
           if (exactSerieMatch) nfMatch = exactSerieMatch;
        }

        let dataOcorrenciaStr = line.length >= 38 ? line.substring(30, 38).trim() : ''; 
        let horaOcorrenciaStr = line.length >= 42 ? line.substring(38, 42).trim() : ''; 
        
        let createdAtDt = new Date().toISOString();
        if (dataOcorrenciaStr.length === 8) {
           const day = dataOcorrenciaStr.substring(0, 2);
           const month = dataOcorrenciaStr.substring(2, 4);
           const year = dataOcorrenciaStr.substring(4, 8);
           let fullDateStr = `${year}-${month}-${day}T`;
           
           if (horaOcorrenciaStr.length === 4) {
             const hour = horaOcorrenciaStr.substring(0, 2);
             const minute = horaOcorrenciaStr.substring(2, 4);
             fullDateStr += `${hour}:${minute}:00-03:00`;
           } else {
             fullDateStr += `00:00:00-03:00`; 
           }
           
           try {
              const parsed = new Date(fullDateStr);
              if (!isNaN(parsed.getTime())) {
                createdAtDt = parsed.toISOString();
              }
           } catch { /* erro silencioso ignorado, caindo p data atual */ }
        }

        const observacao = line.length > 42 ? line.substring(42, Math.min(112, line.length)).trim() : '';
        
        const newOccurrenceEntry = {
           codigo: occurrenceDesc.codigo,
           descricao: occurrenceDesc.descricao,
           created_at: createdAtDt,
           observacao: observacao,
           source: 'EDI_OCOREN'
        };

        const metadata = nfMatch.metadata || {};
        const existingOccurrences = Array.isArray(metadata.occurrences) ? metadata.occurrences : [];
        
        const isDuplicate = existingOccurrences.some((o: any) => 
            o.codigo === newOccurrenceEntry.codigo && 
            Math.abs(new Date(o.created_at).getTime() - new Date(newOccurrenceEntry.created_at).getTime()) < 60000 
        );

        if (!isDuplicate) {
           existingOccurrences.push(newOccurrenceEntry);
           existingOccurrences.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
           
           const newMetadata = { ...metadata, occurrences: existingOccurrences };

           const { error: updateError } = await (supabase as any)
             .from('invoices_nfe')
             .update({ metadata: newMetadata })
             .eq('id', nfMatch.id);

           if (updateError) {
             errors.push(`Linha ${i + 1}: Erro falha fatal de BD ao atualizar o metadata da NF ${numero}.`);
           } else {
             successCount++;
             const nfTrackingNumber = nfMatch.numero || numero;
             await trackingService.syncDocumentTrackingStatus('nfe', nfMatch.id, nfTrackingNumber);
             
             // Dispara notificação via e-mail e whatsapp
             deliveryNotificationHandler.processOccurrenceNotification(
               nfMatch.id,
               newOccurrenceEntry.codigo,
               newOccurrenceEntry.descricao,
               nfTrackingNumber
             ).catch(console.error);
           }
        }
      }
    }

    return {
      recordsProcessed: processedCount,
      occurrencesSaved: successCount,
      errors: errors
    };
  }
};
