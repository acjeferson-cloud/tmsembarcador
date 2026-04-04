const fs = require('fs');

let content = fs.readFileSync('src/services/sapService.ts', 'utf8');

// 1. Add import:
content = content.replace("import { ordersService, Order } from './ordersService';", "import { ordersService, Order } from './ordersService';\nimport { establishmentsService } from './establishmentsService';\nimport { generateTrackingCode } from '../utils/trackingCodeGenerator';");

// 2. Destructuring finalBusinessPartnerCity etc:
const search1 = `      let finalBusinessPartnerId = null;
      let finalBusinessPartnerName = sapOrder.customer.name;`;

const replacement1 = `      let finalBusinessPartnerId = null;
      let finalBusinessPartnerName = sapOrder.customer.name;
      let finalBusinessPartnerCity = null;
      let finalBusinessPartnerState = null;
      let finalBusinessPartnerZipCode = null;
      let finalBusinessPartnerStreet = null;
      let finalBusinessPartnerNeighborhood = null;
      let finalBusinessPartnerNumber = null;`;

content = content.replace(search1, replacement1);

// 3. Select existingBP:
const search2 = `.select('id, razao_social')`;
const replacement2 = `.select('id, razao_social, cidade, estado, cep, logradouro, bairro, numero')`;
content = content.replace(search2, replacement2);

// 4. Set existingBP variables:
const search3 = `        if (existingBP) {
          finalBusinessPartnerId = existingBP.id;
          finalBusinessPartnerName = existingBP.razao_social;
        } else if (rawCnpj.length === 14) {`;
const replacement3 = `        if (existingBP) {
          finalBusinessPartnerId = existingBP.id;
          finalBusinessPartnerName = existingBP.razao_social;
          finalBusinessPartnerCity = existingBP.cidade || null;
          finalBusinessPartnerState = existingBP.estado || null;
          finalBusinessPartnerZipCode = existingBP.cep || null;
          finalBusinessPartnerStreet = existingBP.logradouro || null;
          finalBusinessPartnerNeighborhood = existingBP.bairro || null;
          finalBusinessPartnerNumber = existingBP.numero || null;
        } else if (rawCnpj.length === 14) {`;
content = content.replace(search3, replacement3);

// 5. Set fallback Receita variables:
const search4 = `              if (createdPartner.success && createdPartner.id) {
                finalBusinessPartnerId = createdPartner.id;
                finalBusinessPartnerName = newPartnerPayload.name;
              } else {`;
const replacement4 = `              if (createdPartner.success && createdPartner.id) {
                finalBusinessPartnerId = createdPartner.id;
                finalBusinessPartnerName = newPartnerPayload.name;
                finalBusinessPartnerCity = newPartnerPayload.addresses[0].city;
                finalBusinessPartnerState = newPartnerPayload.addresses[0].state;
                finalBusinessPartnerZipCode = newPartnerPayload.addresses[0].zipCode;
                finalBusinessPartnerStreet = newPartnerPayload.addresses[0].street;
                finalBusinessPartnerNeighborhood = newPartnerPayload.addresses[0].neighborhood;
                finalBusinessPartnerNumber = newPartnerPayload.addresses[0].number;
              } else {`;
content = content.replace(search4, replacement4);

// 6. Estab Code logic & TMS Order structural update
const search5 = `      // 5. Structure TMS Order Object`;
const replacement5 = `      // Fetch Establishment Code for Tracking
      let estabCode = '0001';
      let estabPrefix = 'TGL';

      if (context?.establishmentId) {
         try {
           const estab = await establishmentsService.getById(context.establishmentId);
           if (estab) {
              estabCode = estab.codigo || '0001';
              estabPrefix = estab.tracking_prefix || 'TGL';
           }
         } catch(e) {}
      }

      const trackingCode = generateTrackingCode(
         sapOrder.order_number, 
         new Date(sapOrder.issue_date || new Date()),
         estabCode,
         estabPrefix
      );

      // 5. Structure TMS Order Object`;
content = content.replace(search5, replacement5);

// 7. Structure TMS Order object modifications
const search6 = `        entry_date: sapOrder.entry_date,
        expected_delivery: sapOrder.expected_delivery,
        customer_id: finalBusinessPartnerId || undefined,
        customer_name: finalBusinessPartnerName,
        freight_value: 0,
        order_value: sapOrder.order_value,
        weight: sapOrder.weight,
        volume_qty: Math.ceil(sapOrder.volume_qty || 1),
        cubic_meters: sapOrder.cubic_meters,
        destination_zip_code: sapOrder.destination?.zip_code,
        destination_street: sapOrder.destination?.street,
        destination_number: sapOrder.destination?.number,
        destination_neighborhood: sapOrder.destination?.neighborhood,
        destination_city: sapOrder.destination?.city,
        destination_state: sapOrder.destination?.state,
        observations: sapOrder.observations,
        status: 'pending',
        tracking_code: sapOrder.order_number,`;

const replacement6 = `        entry_date: new Date().toISOString().split('T')[0],
        expected_delivery: sapOrder.expected_delivery || null,
        customer_id: finalBusinessPartnerId || undefined,
        customer_name: finalBusinessPartnerName,
        freight_value: 0,
        order_value: sapOrder.order_value,
        weight: sapOrder.weight,
        volume_qty: Math.ceil(sapOrder.volume_qty || 1),
        cubic_meters: sapOrder.cubic_meters,
        destination_zip_code: sapOrder.destination?.zip_code || finalBusinessPartnerZipCode || null,
        destination_street: sapOrder.destination?.street || finalBusinessPartnerStreet || null,
        destination_number: sapOrder.destination?.number || finalBusinessPartnerNumber || null,
        destination_neighborhood: sapOrder.destination?.neighborhood || finalBusinessPartnerNeighborhood || null,
        destination_city: sapOrder.destination?.city || finalBusinessPartnerCity || null,
        destination_state: sapOrder.destination?.state || finalBusinessPartnerState || null,
        observations: sapOrder.observations || null,
        status: 'pending',
        tracking_code: trackingCode,`;

content = content.replace(search6, replacement6);

fs.writeFileSync('src/services/sapService.ts', content);
console.log("sapService updated.");
