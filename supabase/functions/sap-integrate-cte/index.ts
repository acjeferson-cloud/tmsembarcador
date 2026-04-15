import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      endpointSystem, 
      port, 
      username, 
      password, 
      companyDb, 
      cte_data,
      cte_tax_code,
      sap_bpl_id 
    } = await req.json()

    // 1. Login to SAP Service Layer
    const loginUrl = `${endpointSystem}:${port}/b1s/v1/Login`
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      body: JSON.stringify({
        UserName: username,
        Password: password,
        CompanyDB: companyDb
      })
    })

    if (!loginRes.ok) {
      const error = await loginRes.text()
      throw new Error(`SAP Login Failed: ${error}`)
    }

    const { SessionId } = await loginRes.json()
    const cookie = `B1SESSION=${SessionId}`

    // 2. Map CT-e to SAP A/P Invoice (Esboço ou Direto)
    // Usando Invoice (Nota Fiscal de Entrada) para o CT-e de Frete
    const invoicePayload = {
      CardCode: cte_data.carrier_cardcode || 'T001', // Fallback se não vier
      DocDate: cte_data.issue_date,
      DocDueDate: cte_data.issue_date,
      BPL_IDAssignedToInvoice: sap_bpl_id || 1,
      Comments: `Integrado via Log Axis (TMS Embarcador) - CT-e: ${cte_data.number} | Chave: ${cte_data.access_key}`,
      DocumentLines: [
        {
          ItemCode: 'FRETE',
          Quantity: 1,
          Price: cte_data.value,
          TaxCode: cte_tax_code || 'C020', // O Código de Imposto dinâmico resolvendo o erro de produção
          Usage: 2 // Geralmente 2 para Frete/Serviço no SAP Brasil
        }
      ]
    }

    // 3. Post to SAP (Drafts ou Invoices)
    const postUrl = `${endpointSystem}:${port}/b1s/v1/Drafts` // Sempre enviando como rascunho por segurança
    const postRes = await fetch(postUrl, {
      method: 'POST',
      headers: { 
        'Cookie': cookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoicePayload)
    })

    const result = await postRes.json()

    if (!postRes.ok) {
      throw new Error(`SAP Integration Error: ${JSON.stringify(result)}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sap_doc_entry: result.DocEntry,
        sap_doc_num: result.DocNum 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
