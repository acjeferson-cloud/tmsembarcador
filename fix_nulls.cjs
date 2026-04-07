const fs = require('fs');

let content = fs.readFileSync('c:\\\\desenvolvimento\\\\tmsembarcador\\\\src\\\\services\\\\pickupRequestService.ts', 'utf-8');

// 1. Injetar na Interface
const interfaceFind = `  pickup_id: string;\n  request_number: string;`;
const interfaceReplace = `  pickup_id: string;\n  organization_id?: string;\n  environment_id?: string;\n  establishment_id?: string;\n  request_number: string;`;
content = content.replace(interfaceFind, interfaceReplace);

// 2. Injetar na construção do payload 
const loopFind = `      for (const pId of params.pickupIds) {
        const requestData: Partial<PickupRequest> = {
          pickup_id: pId,
          request_number: requestNumber,`;

const loopReplace = `      for (const pId of params.pickupIds) {
        let tenantInfo = { org: null, env: null, est: params.establishmentId };
        try {
           const { data: pkData } = await (supabase as any).from('pickups').select('organization_id, environment_id, establishment_id').eq('id', pId).single();
           if (pkData) {
              tenantInfo.org = pkData.organization_id;
              tenantInfo.env = pkData.environment_id;
              tenantInfo.est = pkData.establishment_id || params.establishmentId;
           }
        } catch(e) {}

        const requestData: Partial<PickupRequest> = {
          pickup_id: pId,
          organization_id: tenantInfo.org,
          environment_id: tenantInfo.env,
          establishment_id: tenantInfo.est,
          request_number: requestNumber,`;

content = content.replace(loopFind, loopReplace);

fs.writeFileSync('c:\\\\desenvolvimento\\\\tmsembarcador\\\\src\\\\services\\\\pickupRequestService.ts', content);
console.log('JS Updated.');
