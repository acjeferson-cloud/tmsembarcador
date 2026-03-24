import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

const xml = `<test><chave>12341234123412341234123412341234123412341234</chave></test>`;
const parsed = xmlParser.parse(xml);
console.log("Parsed chave:", parsed.test.chave);
console.log("Type of chave:", typeof parsed.test.chave);
