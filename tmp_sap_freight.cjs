const fs = require('fs');
let content = fs.readFileSync('src/services/sapService.ts', 'utf8');

// 1. Add import
const importSearch = "import { TenantContextHelper } from '../utils/tenantContext';";
const importReplace = "import { TenantContextHelper } from '../utils/tenantContext';\nimport { freightQuoteService } from './freightQuoteService';";

if (content.includes(importSearch)) {
    content = content.replace(importSearch, importReplace);
}

// 2. Add freight calculation
const orderCreationSearch = `      const tmsOrder: Omit<Order, 'id'> = {
        serie: '',
        order_number: sapOrder.order_number,`;

const orderCreationReplace = `      // 6.5. Calcular frete automaticamente antes de inserir
      let freightResults: any[] = [];
      let finalFreightValue = 0;
      let calculatedBestCarrier = finalCarrierId;

      try {
        const destZipCodeStr = sapOrder.destination?.zip_code || finalBusinessPartnerZipCode || '';
        const destZipCode = destZipCodeStr.replace(/\\D/g, '');
        const w = parseFloat(sapOrder.weight || '0');
        const ov = parseFloat(sapOrder.order_value || '0');

        if (destZipCode && w > 0 && ov > 0) {
          const results = await freightQuoteService.calculateQuote(
            {
              destinationZipCode: destZipCode,
              weight: w,
              volumeQty: Math.ceil(sapOrder.volume_qty || 1),
              cubicMeters: sapOrder.cubic_meters || 0,
              cargoValue: ov,
              selectedModals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario']
            },
            'SYSTEM', // Fake user_id since it's automated
            'Integração SAP',
            ''
          );

          if (results && results.length > 0) {
            freightResults = results;
            // Se já tem transportadora do SAP, força usar o valor da tabela dela se existir no resultado
            let carrierResult = finalCarrierId ? results.find(r => r.carrierId === finalCarrierId) : null;
            
            // Senão, usa a mais barata cotada
            if (!carrierResult) {
              carrierResult = results[0];
            }

            if (carrierResult) {
              finalFreightValue = carrierResult.totalValue;
              if (!calculatedBestCarrier) {
                calculatedBestCarrier = carrierResult.carrierId;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Falha ao cotar frete automaticamente na integração do SAP:', err);
      }

      const tmsOrder: Omit<Order, 'id'> = {
        serie: '',
        order_number: sapOrder.order_number,`;

if (content.includes(orderCreationSearch) && !content.includes('Calcular frete automaticamente')) {
    content = content.replace(orderCreationSearch, orderCreationReplace);
}

// 3. Update the tmsOrder object fields for carrier_id and freight_value
const orderObjSearch = `        carrier_id: finalCarrierId,
        carrier_name: '', // Será atualizado futuramente`;

const orderObjReplace = `        carrier_id: calculatedBestCarrier,
        carrier_name: '', // Será atualizado futuramente
        best_carrier_id: calculatedBestCarrier, // Adicionado pra registro do recálculo
        freight_results: freightResults as any,`;

if (content.includes(orderObjSearch)) {
    content = content.replace(orderObjSearch, orderObjReplace);
}

const freightValueSearch = `        order_value: parseFloat(sapOrder.order_value || '0'),
        freight_value: 0,`;

const freightValueReplace = `        order_value: parseFloat(sapOrder.order_value || '0'),
        freight_value: finalFreightValue,`;

if (content.includes(freightValueSearch)) {
    content = content.replace(freightValueSearch, freightValueReplace);
    fs.writeFileSync('src/services/sapService.ts', content);
    console.log("Successfully injected freight calculation into SAP Service");
} else {
    console.log("Failed to inject freight calculation");
}
