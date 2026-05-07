const fs = require('fs');
let lines = fs.readFileSync('src/components/FreightQuote/FreightQuote.tsx', 'utf8').split('\n');

const newBlock = [
  '              {/* Parametros da Carga em Grid Line */}',
  '              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">',
  '                ',
  '                {/* Parceiro ou CNPJ */}',
  '                <div className="lg:col-span-1">',
  '                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 whitespace-nowrap">',
  '                    <Users className="w-4 h-4 inline mr-1 text-gray-500" />',
  '                    {t(\'freightQuote.form.partner\')} / CNPJ',
  '                  </label>',
  '                  <AutocompleteSelect',
  '                    options={businessPartners.map(partner => ({',
  '                      value: partner.id || \'\',',
  '                      label: partner.metadata?.sap_cardcode ? `${partner.metadata.sap_cardcode} - ${partner.codigo} - ${partner.name}` : `${partner.codigo} - ${partner.name}`',
  '                    }))}',
  '                    value={formData.businessPartnerId || formData.recipientDocument || \'\'}',
  '                    onChange={(val) => {',
  '                      if (val && val.length === 36 && val.includes(\'-\')) {',
  '                        handleBusinessPartnerChange(val);',
  '                        setFormData(prev => ({ ...prev, recipientDocument: \'\' }));',
  '                      } else {',
  '                        handleBusinessPartnerChange(undefined);',
  '                        setFormData(prev => ({ ...prev, recipientDocument: val.replace(/\\D/g, \'\') }));',
  '                      }',
  '                    }}',
  '                    placeholder="Selecione ou digite CNPJ..."',
  '                    allowCustomValue={true}',
  '                    customValueLabel={(val) => `Simular Grupo: ${val}`}',
  '                  />',
  '                </div>',
  '                {/* Valor NF */}'
];

lines.splice(690, 40, ...newBlock);
fs.writeFileSync('src/components/FreightQuote/FreightQuote.tsx', lines.join('\n'));
console.log('Done replacing lines');
