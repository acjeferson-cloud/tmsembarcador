async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
  let url = 'https://sl-eqnx.datacore.com.br:34154/b1s/v1';
  let loginRes = await fetch(url+'/Login', {method:'POST', body:JSON.stringify({CompanyDB:'B1_TGL', UserName:'manager', Password:'1'}), headers:{'Content-Type':'application/json'}});
  let loginData = await loginRes.json();
  let cookie = 'B1SESSION=' + loginData.SessionId;
  let res = await fetch(url+'/Orders?$orderby=DocEntry desc&$top=1', {headers:{Cookie:cookie}});
  let d = await res.json();
  console.log('Order Carrier fields:', Object.keys(d.value[0]).filter(k=>k.toLowerCase().includes('carrier') || k.toLowerCase().includes('transport')));
  console.log('TaxEx:', d.value[0].TaxExtension);
  let transCode = d.value[0].TransportationCode; // Maybe it's here?
  if (transCode) {
      console.log('TransportationCode is', transCode);
      let bpRes = await fetch(url+'/BusinessPartners(%27' + transCode + '%27)', {headers:{Cookie:cookie}});
      if (bpRes.ok) {
           let bp = await bpRes.json();
           console.log('Found BP from transCode:', bp.CardName, bp.CardCode);
      } else {
           console.log('TransCode BP fetch returned', bpRes.status);
      }
  }
}
run();
