import { XMLParser } from "fast-xml-parser";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { config } from "dotenv";

config();

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false
});

async function main() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: establishments } = await supabase
    .from('establishments')
    .select('id, organization_id, environment_id, metadata, razao_social, codigo, cnpj');

  const xmlString = readFileSync("temp/33260549873630000160570010000124751040275757-procCTe.xml", "utf-8");
  const parsedCte = xmlParser.parse(xmlString);
  const cteRoot = parsedCte.cteProc || parsedCte.CTe;
  const infCte = cteRoot?.infCte;
  
  const tomaTag = String(infCte.ide?.toma3?.toma ?? infCte.ide?.toma4?.toma ?? '0');
  let tomadorCnpj = '';
  if (tomaTag === '0') tomadorCnpj = infCte.rem?.CNPJ || infCte.rem?.CPF || '';
  else if (tomaTag === '1') tomadorCnpj = infCte.exped?.CNPJ || infCte.exped?.CPF || '';
  else if (tomaTag === '2') tomadorCnpj = infCte.receb?.CNPJ || infCte.receb?.CPF || '';
  else if (tomaTag === '3') tomadorCnpj = infCte.dest?.CNPJ || infCte.dest?.CPF || '';
  else if (tomaTag === '4') tomadorCnpj = infCte.ide?.toma4?.CNPJ || infCte.ide?.toma4?.CPF || '';
  
  console.log('Toma Tag:', tomaTag);
  console.log('Tomador CNPJ:', tomadorCnpj);
  
  const candidateDocs = [
    tomadorCnpj,
    infCte.rem?.CNPJ || infCte.rem?.CPF || '',
    infCte.dest?.CNPJ || infCte.dest?.CPF || '',
    infCte.exped?.CNPJ || infCte.exped?.CPF || '',
    infCte.receb?.CNPJ || infCte.receb?.CPF || ''
  ].filter(doc => !!doc).map(doc => String(doc).replace(/\D/g, ''));
  
  console.log('Candidate Docs:', candidateDocs);

  // Use Biosys Ltda's organization_id since it is the email owner
  const estab = establishments.find(e => e.codigo === '0003' && e.razao_social === 'Biosys Ltda');
  console.log('Estab (0003):', estab);

  let matchedEstab = null;
  for (const doc of candidateDocs) {
    matchedEstab = establishments.find((e) => e.organization_id === estab.organization_id && e.cnpj && e.cnpj.replace(/\D/g, '') === doc);
    if (matchedEstab) break;
  }

  console.log('Matched Estab:', matchedEstab);
}

main().catch(console.error);
