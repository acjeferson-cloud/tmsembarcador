const fs = require('fs');
let content = fs.readFileSync('tms-erp-proxy/index.js', 'utf8');

// Find the block of app.post('/api/fetch-sap-order'
const startToken = "app.post('/api/fetch-sap-order', async (req, res) => {";
const endToken = "  } catch (globalError) {\n    return res.status(200).json({ success: false, error: `Erro no servidor Node Proxy: ${globalError.message}` });\n  }\n});";

const startIndex = content.indexOf(startToken);
const endIndex = content.indexOf(endToken) + endToken.length;

if (startIndex !== -1 && content.indexOf(endToken) !== -1) {
    let orderBlock = content.substring(startIndex, endIndex);
    
    // Duplicate for invoice
    let invoiceBlock = orderBlock.replace("/api/fetch-sap-order", "/api/fetch-sap-invoice")
        .replace("/Orders?$orderby", "/Invoices?$orderby")
        .replace("Nenhum Pedido de Venda", "Nenhuma Nota Fiscal")
        .replace(/Pedido/g, "Nota")
        .replace(/Order/g, "Invoice")
        .replace(/order/g, "invoice");

    content = content.replace(endToken, endToken + '\n\n// Endpoint 3: Fetch SAP Invoice\n' + invoiceBlock);
    
    fs.writeFileSync('tms-erp-proxy/index.js', content);
    console.log("Successfully duplicated proxy block for invoices");
} else {
    console.log("Could not find the bounds of the order proxy block");
}
