import { XMLParser } from 'fast-xml-parser';

const xml = `
<infCte>
  <infCTeNorm>
    <infDoc>
      <infNFe>
        <chave>35220612345678901234550010001234561000000001</chave>
      </infNFe>
      <infNFe>
        <chave>12345678901234567890123456789012345678901234</chave>
      </infNFe>
    </infDoc>
  </infCTeNorm>
</infCte>
`;

const parser = new XMLParser({
   ignoreAttributes: false,
   attributeNamePrefix: "@_",
   textNodeName: "#text",
   parseTagValue: false
});

const parsed = parser.parse(xml);
console.log(JSON.stringify(parsed, null, 2));

const infCte = parsed.infCte;
const infDoc = infCte.infCTeNorm?.infDoc;
const infNFeNodes = infDoc?.infNFe || infDoc?.infNF;
if (infNFeNodes) {
  const nfeArray = Array.isArray(infNFeNodes) ? infNFeNodes : [infNFeNodes];
  const nfeKeys = nfeArray.map((n) => String(n.chave || '')).filter((k) => k.length === 44);
  console.log("nfeKeys:", nfeKeys);
}
