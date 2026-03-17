import { orderPdfService } from './src/services/orderPdfService';

const mockOrder = {
  id: '1',
  order_number: '1234',
  issue_date: '2026-03-16',
  entry_date: '2026-03-16',
  expected_delivery: '2026-03-18',
  freight_value: 100,
  order_value: 500,
  status: 'emitido',
  created_by: 1,
  items: [
    {
      product_code: 'P1',
      product_description: 'Item 1',
      quantity: 1,
      unit_price: 10,
      total_price: 10
    }
  ],
  weight: 2,
  volume_qty: 1,
  cubic_meters: 1
} as any;

try {
  console.log('Generating PDF for download...');
  const result = orderPdfService.generateOrderPDF([mockOrder], 'download');
  console.log('Download result:', result.substring(0, 50));

  console.log('Generating PDF for print...');
  const printUrl = orderPdfService.generateOrderPDF([mockOrder], 'print');
  console.log('Print URL successfully generated length:', printUrl.length);
} catch (e) {
  console.error("PDF generation failed:", e);
}
