import { freightQuoteService } from './src/services/freightQuoteService';
import { TenantContextHelper } from './src/utils/tenantContext';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await TenantContextHelper.setSessionContext({
    organizationId: 'd4604fee-d479-48fc-b279-068aac20e992', // Replace with real or mock
    environmentId: '28641e7d-f6ec-48b0-aeba-18a5529c1413'  // Replace with real or mock
  });

  try {
    const resultsEmbu = await freightQuoteService.calculateQuote({
      destinationCityId: '3515004', // Embu das Artes
      weight: 10,
      volumeQty: 1,
      cargoValue: 1000
    });
    console.log("Embu calculationDetails.tda:", resultsEmbu[0]?.calculationDetails?.tda);

    const resultsOsasco = await freightQuoteService.calculateQuote({
      destinationCityId: '3534401', // Osasco
      weight: 10,
      volumeQty: 1,
      cargoValue: 1000
    });
    console.log("Osasco calculationDetails.tda:", resultsOsasco[0]?.calculationDetails?.tda);
  } catch(e) {
    console.error(e);
  }
}
run();
