import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

export interface DivergenceReportData {
  cteId: string;
  cteNumber: string;
  serie: string;
  chave: string;
  carrierId: string;
  carrierName: string;
  carrierCnpj: string;
  carrierEmail?: string;
  carrierPhone?: string;
  emissionDate: string;
  totalValue: number;
  status: string;
  comparisonData: {
    taxName: string;
    tmsValue: number;
    cteValue: number;
    difference: number;
    percentDifference: number;
    status: 'correct' | 'divergent';
    calculation?: {
      formula: string;
      baseValue: number;
      rate: number;
      result: number;
    };
  }[];
}

export const cteDivergenceReportService = {
  async generatePDF(data: DivergenceReportData, establishmentName: string): Promise<Blob> {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Divergência - CT-e', pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Dados do CT-e', 14, yPosition);

      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Número: ${data.cteNumber}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Série: ${data.serie}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Chave: ${data.chave}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Data de Emissão: ${new Date(data.emissionDate).toLocaleDateString('pt-BR')}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Valor Total: R$ ${data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Status: ${data.status}`, 14, yPosition);

      yPosition += 12;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Transportador', 14, yPosition);

      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${data.carrierName}`, 14, yPosition);
      yPosition += 6;
      doc.text(`CNPJ: ${data.carrierCnpj}`, 14, yPosition);
      if (data.carrierEmail) {
        yPosition += 6;
        doc.text(`Email: ${data.carrierEmail}`, 14, yPosition);
      }
      if (data.carrierPhone) {
        yPosition += 6;
        doc.text(`Telefone: ${data.carrierPhone}`, 14, yPosition);
      }

      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Comparação de Valores', 14, yPosition);

      yPosition += 10;

      const correctTaxes = data.comparisonData.filter(item => item.status === 'correct');
      const divergentTaxes = data.comparisonData.filter(item => item.status === 'divergent');

      if (correctTaxes.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(0, 128, 0);
        doc.text('✓ Taxas Corretas', 14, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 8;

        correctTaxes.forEach(tax => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(tax.taxName, 20, yPosition);
          yPosition += 6;
          doc.setFont('helvetica', 'normal');
          doc.text(`Valor TMS: R$ ${tax.tmsValue.toFixed(2)} | Valor CT-e: R$ ${tax.cteValue.toFixed(2)}`, 20, yPosition);
          yPosition += 8;
        });
      }

        if (divergentTaxes.length > 0) {
        yPosition += 5;
        doc.setFontSize(11);
        doc.setTextColor(255, 0, 0);
        doc.text('✗ Taxas Divergentes', 14, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 8;

        divergentTaxes.forEach(tax => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(tax.taxName, 20, yPosition);
          yPosition += 6;

          doc.setFont('helvetica', 'normal');
          doc.text(`Valor TMS: R$ ${tax.tmsValue.toFixed(2)}`, 20, yPosition);
          yPosition += 5;
          doc.text(`Valor CT-e: R$ ${tax.cteValue.toFixed(2)}`, 20, yPosition);
          yPosition += 5;
          doc.setTextColor(255, 0, 0);
          doc.text(`Diferença: R$ ${Math.abs(tax.difference).toFixed(2)} (${Math.abs(tax.percentDifference).toFixed(2)}%)`, 20, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += 5;

          if (tax.calculation) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`Cálculo TMS: ${tax.calculation.formula}`, 20, yPosition);
            yPosition += 4;
            doc.text(`Base: R$ ${tax.calculation.baseValue.toFixed(2)} × Taxa: ${tax.calculation.rate} = R$ ${tax.calculation.result.toFixed(2)}`, 20, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 6;
          }

          yPosition += 3;
        });
      }

      yPosition += 10;
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Este relatório foi gerado automaticamente pelo TMS ' + establishmentName, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      doc.text('Para dúvidas ou correções, entre em contato com o embarcador.', pageWidth / 2, yPosition, { align: 'center' });

      return doc.output('blob');
    } catch (error: any) {

      throw new Error(`Falha ao gerar PDF: ${error?.message || 'Erro desconhecido'}`);
    }
  },

  async saveReport(data: DivergenceReportData, userId: string, establishmentId: string): Promise<string> {
    const { data: report, error } = await supabase
      .from('cte_divergence_reports')
      .insert({
        cte_id: data.cteId,
        user_id: userId,
        establishment_id: establishmentId,
        carrier_id: data.carrierId,
        cte_number: data.cteNumber,
        carrier_name: data.carrierName,
        report_data: data
      })
      .select()
      .single();

    if (error) throw error;
    return report.id;
  },

  async markAsSentByEmail(reportId: string, emailTo: string): Promise<void> {
    const { error } = await supabase
      .from('cte_divergence_reports')
      .update({
        sent_by_email: true,
        email_sent_to: emailTo,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) throw error;
  },

  async markAsSentByWhatsApp(reportId: string, phoneTo: string): Promise<void> {
    const { error } = await supabase
      .from('cte_divergence_reports')
      .update({
        sent_by_whatsapp: true,
        whatsapp_sent_to: phoneTo,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) throw error;
  },

  async getReportHistory(cteId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cte_divergence_reports')
      .select(`
        *,
        user:users(name, email)
      `)
      .eq('cte_id', cteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
