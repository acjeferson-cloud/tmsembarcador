import { XMLParser } from "npm:fast-xml-parser";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

const xml = `<test><chave>12341234123412341234123412341234123412341234</chave></test>`;
const parsed = xmlParser.parse(xml);
console.log(parsed.test.chave);
console.log(typeof parsed.test.chave);
