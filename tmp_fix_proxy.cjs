const fs = require('fs');
let content = fs.readFileSync('tms-erp-proxy/index.js', 'utf8');

const search = "        const bpEndpoint = `${serviceLayerUrl}/BusinessPartners('${latestOrder.CardCode}')?$select=LicTradNum,FederalTaxID,TaxIdNum,AdditionalID,BPFiscalTaxIDCollection`;";
const replacement = "        const bpEndpoint = `${serviceLayerUrl}/BusinessPartners('${latestOrder.CardCode}')`;";

if(content.includes(search)) {
    content = content.replace(search, replacement);
    fs.writeFileSync('tms-erp-proxy/index.js', content);
    console.log("Success");
} else {
    console.log("Could not find search string in index.js");
}
