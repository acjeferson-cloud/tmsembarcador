import { XMLParser } from "npm:fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', parseTagValue: false }); 
const xml = `<cte><infCte><ide><toma3><toma>3</toma></toma3></ide><dest><CNPJ>12345678901234</CNPJ></dest></infCte></cte>`; 
const res = parser.parse(xml); 
console.log(JSON.stringify(res.cte.infCte.ide)); 
console.log(res.cte.infCte.ide.toma3.toma); 
console.log(typeof res.cte.infCte.ide.toma3.toma);
