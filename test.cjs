const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', parseTagValue: false });
const xml = '<CNPJ>04842199000156</CNPJ>';
console.log(parser.parse(xml).CNPJ, typeof parser.parse(xml).CNPJ);
