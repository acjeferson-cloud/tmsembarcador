import { trackingService } from './src/services/trackingService.ts';

async function test() {
  const data = await trackingService.fetchOrderTrackingData('0001-1-26-AZF0-8', true);
  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);
