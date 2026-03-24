import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const locales = ['pt', 'en', 'es'];

const newKeys = {
  pt: {
    fillOrderData: "Preencha os dados do pedido",
    seriePlaceholder: "Ex: 1",
    orderNumberPlaceholder: "Ex: PED-2024-001",
    trackingCodeGenerated: "Gerado automaticamente",
    statusOptions: {
      issued: "Emitido",
      collected: "Em Coleta",
      inTransit: "Em Trânsito",
      outForDelivery: "Saiu p/Entrega",
      delivered: "Entregue",
      canceled: "Cancelado"
    },
    obsPlaceholder: "Observações adicionais sobre o pedido...",
    addCustomerMsg: "<strong>Selecione um cliente existente</strong> ou preencha os dados manualmente abaixo.",
    customerNamePlaceholder: "Digite o nome do cliente",
    addressPlaceholder: "Rua, Avenida...",
    complementPlaceholder: "Apto, Sala, Bloco...",
    neighborhoodPlaceholder: "Centro",
    cityPlaceholder: "São Paulo",
    selectState: "Selecione o estado",
    emailPlaceholder: "cliente@email.com",
    productCodePlaceholder: "Código",
    productDescPlaceholder: "Descrição do item",
    removeItem: "Remover item",
    volumesQty: "Quantidade de Volumes"
  },
  en: {
    fillOrderData: "Fill in the order details",
    seriePlaceholder: "Ex: 1",
    orderNumberPlaceholder: "Ex: ORD-2024-001",
    trackingCodeGenerated: "Generated automatically",
    statusOptions: {
      issued: "Issued",
      collected: "Collected",
      inTransit: "In Transit",
      outForDelivery: "Out for Delivery",
      delivered: "Delivered",
      canceled: "Canceled"
    },
    obsPlaceholder: "Additional observations about the order...",
    addCustomerMsg: "<strong>Select an existing customer</strong> or fill in the details manually below.",
    customerNamePlaceholder: "Enter customer name",
    addressPlaceholder: "Street, Avenue...",
    complementPlaceholder: "Apt, Suite, Block...",
    neighborhoodPlaceholder: "Downtown",
    cityPlaceholder: "New York",
    selectState: "Select state",
    emailPlaceholder: "customer@email.com",
    productCodePlaceholder: "Code",
    productDescPlaceholder: "Item description",
    removeItem: "Remove item",
    volumesQty: "Volumes Quantity"
  },
  es: {
    fillOrderData: "Llene los datos del pedido",
    seriePlaceholder: "Ej: 1",
    orderNumberPlaceholder: "Ej: PED-2024-001",
    trackingCodeGenerated: "Generado automáticamente",
    statusOptions: {
      issued: "Emitido",
      collected: "Recolectado",
      inTransit: "En Tránsito",
      outForDelivery: "Salió para Entrega",
      delivered: "Entregado",
      canceled: "Cancelado"
    },
    obsPlaceholder: "Observaciones adicionales sobre el pedido...",
    addCustomerMsg: "<strong>Seleccione un cliente existente</strong> o complete los datos manualmente a continuación.",
    customerNamePlaceholder: "Ingrese el nombre del cliente",
    addressPlaceholder: "Calle, Avenida...",
    complementPlaceholder: "Apto, Sala, Bloque...",
    neighborhoodPlaceholder: "Centro",
    cityPlaceholder: "Madrid",
    selectState: "Seleccione el estado",
    emailPlaceholder: "cliente@email.com",
    productCodePlaceholder: "Código",
    productDescPlaceholder: "Descripción del artículo",
    removeItem: "Eliminar artículo",
    volumesQty: "Cantidad de Volúmenes"
  }
};

locales.forEach(lang => {
  const filePath = path.join(__dirname, 'src', 'locales', lang, 'translation.json');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);

  if (!data.orders.statusOptions) {
    data.orders.statusOptions = {};
  }
  
  for (const [key, value] of Object.entries(newKeys[lang].statusOptions)) {
    data.orders.statusOptions[key] = value;
  }
  
  if (!data.orders.form) {
    data.orders.form = {};
  }
  
  for (const [key, value] of Object.entries(newKeys[lang])) {
    if (key !== 'statusOptions') {
      data.orders.form[key] = value;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated ${lang}/translation.json`);
});
