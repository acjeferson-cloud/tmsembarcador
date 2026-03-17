import { ElectronicDocument } from '../data/electronicDocumentsData';

// Helper for formatting XML indentation
const formatXml = (xml: string) => {
  let formatted = '';
  let pad = 0;
  
  // Clean up existing whitespaces between tags
  xml = xml.replace(/(>)\s*(<)/g, '$1$2');
  
  xml.split(/(?=<)|(?<=>)/).forEach(node => {
    let indent = 0;
    if (node.match(/^\/\w/)) {
      pad -= 1;
    } else if (node.match(/^<\/\w/)) {
      if (pad !== 0) pad -= 1;
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }

    const padding = new Array(pad + 1).join('  ');
    formatted += padding + node + '\n';
    pad += indent;
  });

  return formatted.trim();
};

export const generateNfeXml = (doc: ElectronicDocument): string => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe versao="4.00" Id="NFe${doc.chaveAcesso}">
      <ide>
        <cUF>${doc.chaveAcesso?.substring(0, 2) || '42'}</cUF>
        <cNF>${doc.chaveAcesso?.substring(35, 43) || '98846347'}</cNF>
        <natOp>Venda de combustivel ou lubrificante, adquiridos ou recebido</natOp>
        <mod>${doc.modelo || '55'}</mod>
        <serie>${doc.serie || '2'}</serie>
        <nNF>${doc.numeroDocumento || '945679'}</nNF>
        <dhEmi>${doc.dataImportacao || new Date().toISOString()}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>2</idDest>
        <cMunFG>4211306</cMunFG>
        <tpImp>2</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>0</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>0</indFinal>
        <indPres>0</indPres>
        <procEmi>0</procEmi>
        <verProc>1211320287</verProc>
      </ide>
      <emit>
        <CNPJ>82981721000194</CNPJ>
        <xNome>${doc.emitente?.razaoSocial || 'GARTHEN INDUSTRIA E COMERCIO DE MAQUINAS LTDA'}</xNome>
        <xFant>GMEG</xFant>
        <enderEmit>
          <xLgr>${doc.emitente?.endereco || 'RODOVIA: BR 470'}</xLgr>
          <nro>04001</nro>
          <xCpl>KM 04</xCpl>
          <xBairro>MACHADOS</xBairro>
          <cMun>4211306</cMun>
          <xMun>${doc.emitente?.cidade || 'Navegantes'}</xMun>
          <UF>${doc.emitente?.uf || 'SC'}</UF>
          <CEP>${doc.emitente?.cep?.replace(/\D/g, '') || '88371624'}</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
          <fone>04721034150</fone>
        </enderEmit>
        <IE>${doc.emitente?.inscricaoEstadual?.replace(/\D/g, '') || '252198131'}</IE>
        <IEST>0017803850006</IEST>
        <IM>00008545</IM>
        <CNAE>2833000</CNAE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>${doc.destinatario?.cnpjCpf?.replace(/\D/g, '') || '25266685002944'}</CNPJ>
        <xNome>${doc.destinatario?.razaoSocial || 'COOP. DOS CAFEIC. DA ZONA DE TRES PONTAS LTDA'}</xNome>
        <enderDest>
          <xLgr>${doc.destinatario?.endereco || 'AVENIDA IPIRANGA, 1721'}</xLgr>
          <nro>1721</nro>
          <xBairro>SANTA MARGARIDA</xBairro>
          <cMun>3169406</cMun>
          <xMun>${doc.destinatario?.cidade || 'Tres Pontas'}</xMun>
          <UF>${doc.destinatario?.uf || 'MG'}</UF>
          <CEP>${doc.destinatario?.cep?.replace(/\D/g, '') || '37190000'}</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
          <fone>3532668308</fone>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>6940784892501</IE>
        <email>alex-compras@cocatrel.com.br</email>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>00031334.2</cProd>
          <cEAN>7897545331330</cEAN>
          <xProd>OLEO MOTOLUB CX COM 12 LITROS</xProd>
          <NCM>27101932</NCM>
          <CEST>0600700</CEST>
          <cBenef>SC800003</cBenef>
          <CFOP>6655</CFOP>
          <uCom>UN</uCom>
          <qCom>7.0000</qCom>
          <vUnCom>463.0000000000</vUnCom>
          <vProd>${(doc.valorTotal || 3241.00).toFixed(2)}</vProd>
          <cEANTrib>7897545331330</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>7.0000</qTrib>
          <vUnTrib>463.0000000000</vUnTrib>
          <indTot>1</indTot>
          <xPed>4500418069</xPed>
          <comb>
            <cProdANP>620101001</cProdANP>
            <descANP>HIDRAULICO</descANP>
            <UFCons>${doc.destinatario?.uf || 'MG'}</UFCons>
          </comb>
        </prod>
        <imposto>
          <vTotTrib>1447.43</vTotTrib>
          <ICMS>
            <ICMS30>
              <orig>0</orig>
              <CST>30</CST>
              <modBCST>4</modBCST>
              <pMVAST>96.7200</pMVAST>
              <vBCST>6375.70</vBCST>
              <pICMSST>18.0000</pICMSST>
              <vICMSST>1147.63</vICMSST>
            </ICMS30>
          </ICMS>
          <IPI>
            <cEnq>999</cEnq>
            <IPINT>
              <CST>51</CST>
            </IPINT>
          </IPI>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>${(doc.valorTotal || 3241.00).toFixed(2)}</vBC>
              <pPIS>1.6500</pPIS>
              <vPIS>53.48</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>${(doc.valorTotal || 3241.00).toFixed(2)}</vBC>
              <pCOFINS>7.6000</pCOFINS>
              <vCOFINS>246.32</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>6375.70</vBCST>
          <vST>1147.63</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${(doc.valorTotal || 3241.00).toFixed(2)}</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>53.48</vPIS>
          <vCOFINS>246.32</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${(doc.valorTotal || 4388.63).toFixed(2)}</vNF>
          <vTotTrib>1447.43</vTotTrib>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>0</modFrete>
        <transporta>
          <CNPJ>82110818001284</CNPJ>
          <xNome>ALFA TRANSPORTES LTDA</xNome>
          <IE>256101540</IE>
          <xEnder>ROD BR 101 1511  SALSEIROS 88311600</xEnder>
          <xMun>Itajai</xMun>
          <UF>SC</UF>
        </transporta>
        <vol>
          <qVol>7</qVol>
          <pesoL>74.550</pesoL>
          <pesoB>80.850</pesoB>
        </vol>
      </transp>
      <cobr>
        <fat>
          <nFat>${doc.numeroDocumento || '945679'}</nFat>
          <vOrig>${(doc.valorTotal || 4388.63).toFixed(2)}</vOrig>
          <vDesc>0.00</vDesc>
          <vLiq>${(doc.valorTotal || 4388.63).toFixed(2)}</vLiq>
        </fat>
      </cobr>
      <pag>
        <detPag>
          <indPag>1</indPag>
          <tPag>15</tPag>
          <vPag>${(doc.valorTotal || 4388.63).toFixed(2)}</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infCpl>Pedido de Venda: 203989 Pedido de Compra: 4500418069 VU:0.145152 Pecas e maquinas nao destinados ao uso automotivo</infCpl>
      </infAdic>
      <infRespTec>
        <CNPJ>37878691000130</CNPJ>
        <xContato>Diretoria de Tecnologia da Informacao</xContato>
        <email>faleconosco@gruposkill.com.br</email>
        <fone>1155747770</fone>
      </infRespTec>
    </infNFe>
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
      <SignedInfo>
        <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
        <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
        <Reference URI="#NFe42250982981721000194550020009456791988463470">
          <Transforms>
             <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
             <Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
          </Transforms>
          <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
          <DigestValue>gQaGdHrnPTlIlo1X936+FOP5+ag=</DigestValue>
        </Reference>
      </SignedInfo>
      <SignatureValue>JsNXo8/WRpKOS7dyl8h4VP2aNF6lMZ3X4l7oW9jyx2sipRYAFf86um5m2W7PnEy4Ym/qqjfTEyy9f/NJJpGi7yDXJLu3AIpCAq+rCyBffQMOGLnbrSM0Llwv+X2iw1IapZf8PkrAoHpEOV8DHzlizyuzePhpPMMUHsRSFJ5cZe2k2hNvRwBMLeHgbyV7PNrA9Yeq4Z9NXcXYE5qHVAvvY/reP/1BO5KXiLgoPpXqsHSR4RBV/c50imZtX4KvcKJ2zRocAcztURDgQ2MHa/hUfrI06mkls9Fmkx0h62rmqcOV95rHdKLw7KP/IryJSvRsHvANXFR2Qt405Tczk/MZPQ==</SignatureValue>
      <KeyInfo>
        <X509Data>
          <X509Certificate>MIIH8jCCBdqgAwIBAgIIcKbhLI2zhWMwDQYJKoZIhvcNAQELBQAwdjELMAkGA1UEBhMCQlIxEzARBgNVBAoTCklDUC1CcmFzaWwxNjA0BgNVBAsTLVNlY3JldGFyaWEgZGEgUmVjZWl0YSBGZWRlcmFsIGRvIEJyYXNpbCAtIFJGQjEaMBgGA1UEAxMRQUMgU0FGRVdFQiBSRkIgdjUwHhcNMjQwOTI1MTk1MDE2WhcNMjUwOTI1MTk1MDE2WjCCAQ8xCzAJBgNVBAYTAkJSMRMwEQYDVQQKEwpJQ1AtQnJhc2lsMQswCQYDVQQIEwJTQzETMBEGA1UEBxMKTkFWRUdBTlRFUzE2MDQGA1UECxMtU2VjcmV0YXJpYSBkYSBSZWNlaXRhIEZlZGVyYWwgZG8gQnJhc2lsIC0gUkZCMRYwFAYDVQQLEw1SRkIgZS1DTlBKIEExMRcwFQYDVQQLEw4xNzQ1Mjg4MzAwMDE3MzEZMBcGA1UECxMQdmlkZW9jb25mZXJlbmNpYTFFMEMGA1UEAxM8R0FSVEhFTiBJTkRVU1RSSUEgRSBDT01FUkNJTyBERSBNQVFVSU5BUyBMVERBOjgyOTgxNzIxMDAwMTk0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvR5S63slG5gs1G/iOB1cY3SB/JEH+/flKNdl7szXfAPy53u3v1hQ/X+P3hPzB5rhjirSaQhPuJ53C86jVsGcU3075EhqbdMeO5ivnCi4Jupe6OmwYwjzRyu/sqUroOXYipo9CyHBKIQ9zHvExnAg2iB+AteH33CYVzj6HABnDUbQTpswnPnR9P4JnA6Qe6DjoyjDziIxGOaippcnwrqveiezlEnJfNJyaVhDwA7uTOZKIAap6m6lMp/R/txmoejrd4Kcft8mjhcIAZ0J0LLJn/Zf0DPU7RKXzkjOS56MhDC06I4RdHuElyt/uSNdA1aVjEIk4xER6y41yc3xtuH3UQIDAQABo4IC5zCCAuMwHwYDVR0jBBgwFoAUKV5L1UZMu/4Wp2PBHcQm8t3Y8wUwDgYDVR0PAQH/BAQDAgXgMGkGA1UdIARiMGAwXgYGYEwBAgEzMFQwUgYIKwYBBQUHAgEWRmh0dHA6Ly9yZXBvc2l0b3Jpby5hY3NhZmV3ZWIuY29tLmJyL2FjLXNhZmV3ZWJyZmIvZHBjLWFjc2FmZXdlYnJmYi5wZGYwga4GA1UdHwSBpjCBozBPoE2gS4ZJaHR0cDovL3JlcG9zaXRvcmlvLmFjc2FmZXdlYi5jb20uYnIvYWMtc2FmZXdlYnJmYi9sY3ItYWMtc2FmZXdlYnJmYnY1LmNybDBQoE6gTIZKaHR0cDovL3JlcG9zaXRvcmlvMi5hY3NhZmV3ZWIuY29tLmJyL2FjLXNhZmV3ZWJyZmIvbGNyLWFjLXNhZmV3ZWJyZmJ2NS5jcmwwgbcGCCsGAQUFBwEBBIGqMIGnMFEGCCsGAQUFBzAChkVodHRwOi8vcmVwb3NpdG9yaW8uYWNzYWZld2ViLmNvbS5ici9hYy1zYWZld2VicmZiL2FjLXNhZmV3ZWJyZmJ2NS5wN2IwUgYIKwYBBQUHMAKGRmh0dHA6Ly9yZXBvc2l0b3JpbzIuYWNzYWZld2ViLmNvbS5ici9hYy1zYWZld2VicmZiL2FjLXNhZmV3ZWJyZmJ2NS5wN2Iwga8GA1UdEQSBpzCBpIEVTUFSQ09MSU5PQEdNRUcuQ09NLkJSoB0GBWBMAQMCoBQTEk1BUkNPTElOTyBDSVBSSUFOSaAZBgVgTAEDA6AQEw44Mjk4MTcyMTAwMDE5NKA4BgVgTAEDBKAvEy0zMDExMTk1NTI0ODM2NTgzOTM0MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDCgFwYFYEwBAwegDhMMMDAwMDAwMDAwMDAwMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDBDAJBgNVHRMEAjAAMA0GCSqGSIb3DQEBCwUAA4ICAQBhoV41181UfYPp5BwdO8UI+G6nKaioacjuHVEV4VE0X26eJgj4YMg3UDRzLGdt6OOqS+QQTis/EvAp+4C6tvh4FAJpROXoxAYyQyxyT0ui/6SbyiMG/tb8yNQbd9LLLaTGSdRfYUtMXE8zzgDGzxmwAvScOsoUwDkuniM4IwkYnuo2nbCnjgD3npLl+tcE+GQYnsiE6c1aTFQD3L4S/QnS/OqYvZ7ePhbQWFHN1CJYdb5Gq1PpjYmMJhS3ObaawUC8Ey3R8Uh73APCWdAgF0ogfpUHb4oEOvmBVuHEPBJACtx4Cn9oGqeaLCDzeetCGmtFUQmoLZtp6VXZwqM/bCs0/3OIBI9yKVs+rs14aiddkyJ35ZFU5z3o0gYpMIukMoAAH2jFeHTYmApd1wxy+H9Cns3qk7roj6TvySVY4zVUs5uKImJFhmbOsnHZsp85nKQuO0EXf0YnxQ+ga1UPLjQUlFtT4ft77MfYRjTqzK6FfH4ED/PVAxZ4OeO7oHB7ssH/0wO4yN5jWjIlM76pN1pMeldW3HMunB9B9jOcCc3WDEmPOTXGfqQA3+vaN0cx+D3Z6yag9m2nlVYhXV74GRhSGHZJWobZhKPciPP7Kdjn4NfQHJKWp0kcbMi8snGS4nqHcIxcodXngPbZyHB2C4+Z5LuBHKmIEIKmWzeMutp+kQ==</X509Certificate>
        </X509Data>
      </KeyInfo>
    </Signature>
  </NFe>
  <protNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
    <infProt Id="ID242250341242476" xmlns="http://www.portalfiscal.inf.br/nfe">
      <tpAmb>1</tpAmb>
      <verAplic>SVRS2509031206DR</verAplic>
      <chNFe>${doc.chaveAcesso}</chNFe>
      <dhRecbto>${doc.dataImportacao || new Date().toISOString()}</dhRecbto>
      <nProt>${doc.protocoloAutorizacao || '242250341242476'}</nProt>
      <digVal>gQaGdHrnPTlIlo1X936+FOP5+ag=</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

  return formatXml(xml);
};

export const generateCteXml = (doc: ElectronicDocument): string => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<cteProc xmlns="http://www.portalfiscal.inf.br/cte" versao="4.00">
  <CTe xmlns="http://www.portalfiscal.inf.br/cte">
    <infCte versao="4.00" Id="CTe${doc.chaveAcesso}">
      <ide>
        <cUF>${doc.chaveAcesso?.substring(0, 2) || '42'}</cUF>
        <cCT>${doc.chaveAcesso?.substring(35, 43) || '06316616'}</cCT>
        <CFOP>6352</CFOP>
        <natOp>TRANSPORTE RODOVIARIO DE CARGAS</natOp>
        <mod>${doc.modelo || '57'}</mod>
        <serie>${doc.serie || '0'}</serie>
        <nCT>${doc.numeroDocumento || '7101267'}</nCT>
        <dhEmi>${doc.dataImportacao || new Date().toISOString()}</dhEmi>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>8</cDV>
        <tpAmb>1</tpAmb>
        <tpCTe>0</tpCTe>
        <procEmi>0</procEmi>
        <verProc>SNCTE 2.0</verProc>
        <cMunEnv>4203006</cMunEnv>
        <xMunEnv>CACADOR</xMunEnv>
        <UFEnv>SC</UFEnv>
        <modal>01</modal>
        <tpServ>0</tpServ>
        <cMunIni>4211306</cMunIni>
        <xMunIni>${doc.emitente?.cidade || 'NAVEGANTES'}</xMunIni>
        <UFIni>${doc.emitente?.uf || 'SC'}</UFIni>
        <cMunFim>3169406</cMunFim>
        <xMunFim>${doc.destinatario?.cidade || 'TRES PONTAS'}</xMunFim>
        <UFFim>${doc.destinatario?.uf || 'MG'}</UFFim>
        <retira>1</retira>
        <indIEToma>1</indIEToma>
        <toma3>
          <toma>0</toma>
        </toma3>
      </ide>
      <compl>
        <fluxo><xOrig>42</xOrig><xDest>156</xDest></fluxo>
        <Entrega>
          <semData><tpPer>0</tpPer></semData>
          <semHora><tpHor>0</tpHor></semHora>
        </Entrega>
      </compl>
      <emit>
        <CNPJ>82110818000121</CNPJ>
        <IE>251894045</IE>
        <xNome>${doc.emitente?.razaoSocial || 'ALFA TRANSPORTES EIRELI'}</xNome>
        <xFant>ALFA TRANSPORTES</xFant>
        <enderEmit>
          <xLgr>${doc.emitente?.endereco || 'AV. ENG. LOURENCO FAORO'}</xLgr>
          <nro>3300</nro>
          <xBairro>INDUSTRIAL</xBairro>
          <cMun>4203006</cMun>
          <xMun>${doc.emitente?.cidade || 'CACADOR'}</xMun>
          <CEP>${doc.emitente?.cep?.replace(/\D/g, '') || '89511340'}</CEP>
          <UF>${doc.emitente?.uf || 'SC'}</UF>
          <fone>4935615100</fone>
        </enderEmit>
        <CRT>3</CRT>
      </emit>
      <rem>
        <CNPJ>82981721000194</CNPJ>
        <IE>252198131</IE>
        <xNome>GARTHEN INDUSTRIA E COMERCIO DE MAQUINA</xNome>
        <enderReme>
          <xLgr>RODOVIA RODOVIA RODOVIA BR 470 INGO HER</xLgr>
          <nro>S/N</nro>
          <xBairro>MACHADOS</xBairro>
          <cMun>4211306</cMun>
          <xMun>NAVEGANTES</xMun>
          <CEP>88371624</CEP>
          <UF>SC</UF>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
        </enderReme>
      </rem>
      <dest>
        <CNPJ>${doc.destinatario?.cnpjCpf?.replace(/\D/g, '') || '25266685002944'}</CNPJ>
        <IE>6940784892501</IE>
        <xNome>${doc.destinatario?.razaoSocial || 'COOPERATIVA DOS CAFEICULTORES DA ZONA D'}</xNome>
        <enderDest>
          <xLgr>${doc.destinatario?.endereco || 'AVENIDA IPIRANGA'}</xLgr>
          <nro>1721</nro>
          <xBairro>SANTA MARGARIDA</xBairro>
          <cMun>3169406</cMun>
          <xMun>${doc.destinatario?.cidade || 'TRES PONTAS'}</xMun>
          <CEP>${doc.destinatario?.cep?.replace(/\D/g, '') || '37190000'}</CEP>
          <UF>${doc.destinatario?.uf || 'MG'}</UF>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
        </enderDest>
      </dest>
      <vPrest>
        <vTPrest>${(doc.valorTotal || 157.72).toFixed(2)}</vTPrest>
        <vRec>${(doc.valorTotal || 157.72).toFixed(2)}</vRec>
        <Comp>
          <xNome>FRETE PESO</xNome>
          <vComp>${(doc.valorFrete || 108.66).toFixed(2)}</vComp>
        </Comp>
        <Comp>
          <xNome>FRETE VALOR</xNome>
          <vComp>13.17</vComp>
        </Comp>
        <Comp>
          <xNome>OUTROS VALORES</xNome>
          <vComp>18.93</vComp>
        </Comp>
        <Comp>
          <xNome>GRIS</xNome>
          <vComp>6.58</vComp>
        </Comp>
        <Comp>
          <xNome>PEDAGIO</xNome>
          <vComp>6.01</vComp>
        </Comp>
        <Comp>
          <xNome>TX-ADM</xNome>
          <vComp>4.37</vComp>
        </Comp>
      </vPrest>
      <imp>
        <ICMS>
          <ICMS00>
            <CST>00</CST>
            <vBC>${(doc.valorTotal || 157.72).toFixed(2)}</vBC>
            <pICMS>12.00</pICMS>
            <vICMS>${(doc.valorIcms || 18.93).toFixed(2)}</vICMS>
          </ICMS00>
        </ICMS>
        <ICMSUFFim>
          <vBCUFFim>0.00</vBCUFFim>
          <pFCPUFFim>0.00</pFCPUFFim>
          <pICMSUFFim>0.00</pICMSUFFim>
          <pICMSInter>0.00</pICMSInter>
          <vFCPUFFim>0.00</vFCPUFFim>
          <vICMSUFFim>0.00</vICMSUFFim>
          <vICMSUFIni>0.00</vICMSUFIni>
        </ICMSUFFim>
      </imp>
      <infCTeNorm>
        <infCarga>
          <vCarga>4388.63</vCarga>
          <proPred>COM ADITIVOS</proPred>
          <xOutCat>DIVERSOS O</xOutCat>
          <infQ>
            <cUnid>01</cUnid>
            <tpMed>PESO CUBADO</tpMed>
            <qCarga>36.2500</qCarga>
          </infQ>
          <infQ>
            <cUnid>01</cUnid>
            <tpMed>PESO REAL</tpMed>
            <qCarga>${(doc.pesoTotal || 80.8500).toFixed(4)}</qCarga>
          </infQ>
          <infQ>
            <cUnid>00</cUnid>
            <tpMed>VOLUME</tpMed>
            <qCarga>0.1450</qCarga>
          </infQ>
          <infQ>
            <cUnid>03</cUnid>
            <tpMed>VOLUMES</tpMed>
            <qCarga>7.0000</qCarga>
          </infQ>
          <vCargaAverb>4388.63</vCargaAverb>
        </infCarga>
        <infDoc>
          <infNFe>
            <chave>42250982981721000194550020009456791988463470</chave>
          </infNFe>
        </infDoc>
        <infModal versaoModal="4.00">
          <rodo>
            <RNTRC>00042902</RNTRC>
          </rodo>
        </infModal>
      </infCTeNorm>
      <infRespTec>
        <CNPJ>09654178000120</CNPJ>
        <xContato>Wanderley Niehues</xContato>
        <email>wanderley@softnews.com.br</email>
        <fone>41999144100</fone>
      </infRespTec>
    </infCte>
    <infCTeSupl>
      <qrCodCTe>https://dfe-portal.svrs.rs.gov.br/cte/qrCode?chCTe=42250982110818000121570000071012671063166168&amp;tpAmb=1</qrCodCTe>
    </infCTeSupl>
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
      <SignedInfo>
        <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
        <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
        <Reference URI="#CTe42250982110818000121570000071012671063166168">
          <Transforms>
            <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
            <Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
          </Transforms>
          <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
          <DigestValue>4R6aMus4odZAgN1j1ozOOv6w+Kg=</DigestValue>
        </Reference>
      </SignedInfo>
      <SignatureValue>KHhe5/FuEkiVDErdOGr6oolzgmKnrRzgubwLHLOuKHHX9JTYSLYTb8ZzzXTGX/vMcGZVYw5T3Yo45LvU+/FFjlqcwCIbPk3wrMBp6Oi/EZQos/6cndbK5buU60E5qbL2WaeY+ui9LbuX2f8oH2tXObnFo6/0ibA+XH452wY48KBt/s9mMkpNsxrXWXt8/nLRlrAfRbUBx0NasAN/b0K8LOAfjYLK3nY2/bzn7hHYNPrgyg5CZrrRkk+dUidQB5nFJJUbZ9JhqftmmkZR3KC1sWSaSukhUCGBmE4s2iBQ4XZAeNTnpSMoVx19P/ynFv7yOpS+er5GnawPT/En2fbw1Q==</SignatureValue>
      <KeyInfo>
        <X509Data>
           <X509Certificate>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</X509Certificate>
        </X509Data>
      </KeyInfo>
    </Signature>
  </CTe>
  <protCTe versao="4.00" xmlns="http://www.portalfiscal.inf.br/cte">
    <infProt Id="CTe342250353497984">
      <tpAmb>1</tpAmb>
      <verAplic>RS20250903084736</verAplic>
      <chCTe>${doc.chaveAcesso}</chCTe>
      <dhRecbto>${doc.dataImportacao || new Date().toISOString()}</dhRecbto>
      <nProt>${doc.protocoloAutorizacao || '342250353497984'}</nProt>
      <digVal>4R6aMus4odZAgN1j1ozOOv6w+Kg=</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso do CT-e</xMotivo>
    </infProt>
  </protCTe>
</cteProc>`;

  return formatXml(xml);
};
