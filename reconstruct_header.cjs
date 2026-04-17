const fs = require('fs');
let c1 = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

const replacement = `export const cteDivergenceReportService = {
  async generatePDF(data: DivergenceReportData, context?: { establishmentId?: string; establishmentName?: string; user?: any; logoBase64?: string }): Promise<Blob> {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      let estId = context?.establishmentId;
      let razaoSocial = context?.establishmentName || 'EMPRESA Nǟ'O INFORMADA';
      let fantasia = razaoSocial;
      let cnpj = '';
      let endereco = '';
      let logoBase64: string | undefined = context?.logoBase64;
      
      console.log("[PDF_LOGO] Iniciando PDF. Contexto Logo fornecido:", logoBase64 ? logoBase64.substring(0, 50) + "..." : "undefined");
      
      if (estId && !logoBase64) {
         console.log("[PDF_LOGO] Logo ausente. Disparando DB Query com estId:", estId);
         try {
             const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(estId);
             let query = (supabase as any).from('establishments').select('*');
             if (isUuid) {
                 query = query.eq('id', estId);
             } else {
                 query = query.eq('codigo', parseInt(estId) || 0);
             }
      
             const { data: dbEst, error: dbErr } = await query.maybeSingle();
             console.log("[PDF_LOGO] DB Query -> Resultado:", !!dbEst, "Erro:", dbErr);
             
             if (dbEst) {
                 fantasia = dbEst.fantasia || dbEst.nome_fantasia || fantasia;
                 razaoSocial = dbEst.razao_social || razaoSocial;
                 cnpj = dbEst.cnpj || '';
                 endereco = dbEst.endereco ? \`\$\{dbEst.endereco\}, \$\{dbEst.bairro || ''\} - \$\{dbEst.cidade || ''\}/\$\{dbEst.estado || ''\}\` : '';
                 
                 logoBase64 = dbEst.metadata?.logo_light_base64 || dbEst.metadata?.logo_dark_base64 || dbEst.logo_light_base64 || dbEst.logo_url || dbEst.metadata?.logo_url;
                 console.log("[PDF_LOGO] Logo resgatado DB:", logoBase64 ? logoBase64.substring(0, 50) + "..." : "NULO NO BANCO");
             }
         } catch(e) { console.log("[PDF_LOGO] Erro no fallback DB:", e); }
      }
      
      if (logoBase64 && logoBase64.startsWith('http')) {
         console.log("[PDF_LOGO] URL externa HTTP. Iniciando parse Supabase.");
         try {
             let path = logoBase64;
             if (path.includes('/public/logos/')) path = path.split('/public/logos/')[1];
             else if (path.includes('/public/')) path = path.split('/public/')[1].replace('logos/', '');
             
             console.log("[PDF_LOGO] Storage Path Mapeado:", path);
             // CRITICAL FIX: Decoded the URI Component so names like 'Matriz Logo' don't crash
             const { data: blob, error: dnErr } = await (supabase as any).storage.from('logos').download(decodeURIComponent(path));
             
             if (blob) {
                 console.log("[PDF_LOGO] Blob baixado com sucesso, tamanho:", blob.size);
                 logoBase64 = await new Promise((resolve) => {
                     const reader = new FileReader();
                     reader.onloadend = () => {
                         let res = reader.result as string;
                         if (res.startsWith('data:application/octet-stream;')) res = res.replace('data:application/octet-stream;', 'data:image/png;');
                         resolve(res);
                     };
                     reader.readAsDataURL(blob);
                 });
                 console.log("[PDF_LOGO] Blob transformado em Base64 Data URL (sucesso)");
             } else {
                 console.log("[PDF_LOGO] Erro download blob:", dnErr);
                 logoBase64 = undefined;
             }
         } catch(e) { 
             console.log("[PDF_LOGO] Erro captura URL via Storage:", e);
             logoBase64 = undefined; 
         }
      }

      const drawHeader = () => {
        let currentX = margin;

        if (logoBase64) {
          try {
            console.log("[PDF_LOGO] Disparando doc.addImage");
            if (!logoBase64.startsWith('http') && !logoBase64.startsWith('data:')) {
              logoBase64 = \`data:image/png;base64,\$\{logoBase64\}\`;
            }
            // Removed strict PDF format constraint
            doc.addImage(logoBase64, margin, margin, 40, 15);
            currentX = margin + 45;
            console.log("[PDF_LOGO] M\\u00E9todo doc.addImage finalizado sem crashes");
          } catch(e) {
            console.error("[PDF_LOGO] ERRO FATAL AO INJETAR NO JSPDF: ", e);
          }
        }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(fantasia, currentX, margin + 5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');`;

const endOfHeaderRegex = /export const cteDivergenceReportService = \{\s*async generatePDF\([^)]*\):\s*Promise<Blob>\s*\{\s*try\s*\{.*?doc\.setFont\('helvetica',\s*'normal'\);/s;

if(endOfHeaderRegex.test(c1)){
    const newContent = c1.replace(endOfHeaderRegex, replacement);
    fs.writeFileSync('src/services/cteDivergenceReportService.ts', newContent, 'utf8');
    console.log("Replaced full header logic successfully!");
} else {
    console.log("Regex to replace entire method didn't match.");
}
