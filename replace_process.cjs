const fs = require('fs');
let content = fs.readFileSync('c:\\\\desenvolvimento\\\\tmsembarcador\\\\src\\\\services\\\\templateService.ts', 'utf-8');
const startMarker = 'export const processFreightRatesFile = (file: File): Promise<{';
const endMarker = 'reader.readAsArrayBuffer(file);\n  });\n};';
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);
if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + `export const processFreightRatesFile = (file: File): Promise<FlatFreightRateTemplate[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          throw new Error('Aba principal nao encontrada na planilha.');
        }

        const flatData = XLSX.utils.sheet_to_json(worksheet) as FlatFreightRateTemplate[];
        resolve(flatData);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    ` + content.substring(endIndex);
  fs.writeFileSync('c:\\\\desenvolvimento\\\\tmsembarcador\\\\src\\\\services\\\\templateService.ts', newContent);
  console.log("Substituido com sucesso!");
} else {
  console.log("Indices nao encontrados", startIndex, endIndex);
}
