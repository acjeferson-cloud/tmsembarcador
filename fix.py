import re
with open('src/components/FreightQuote/FreightQuote.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('lg:grid-cols-7', 'lg:grid-cols-6')

pattern = re.compile(r'<div className="lg:col-span-1">\s*<label.*?\{t\(''freightQuote\.form\.partner''\)\}.*?<\/label>\s*<AutocompleteSelect.*?/>\s*</div>\s*\{/\* CNPJ/CPF Avulso \*/\}\s*<div className="lg:col-span-1">\s*<label.*?>\s*CNPJ / CPF do Destinatário\s*</label>\s*<input.*?/>\s*</div>', re.DOTALL)

new_block = '''<div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 whitespace-nowrap">
                    <Users className="w-4 h-4 inline mr-1 text-gray-500" />
                    {t('freightQuote.form.partner')} / CNPJ
                  </label>
                  <AutocompleteSelect
                    options={businessPartners.map(partner => ({
                      value: partner.id || '',
                      label: partner.metadata?.sap_cardcode ? ${partner.metadata.sap_cardcode} -  -  : ${partner.codigo} - 
                    }))}
                    value={formData.businessPartnerId || formData.recipientDocument || ''}
                    onChange={(val) => {
                      if (val && val.length === 36 && val.includes('-')) {
                        handleBusinessPartnerChange(val);
                        setFormData(prev => ({ ...prev, recipientDocument: '' }));
                      } else {
                        handleBusinessPartnerChange(undefined);
                        setFormData(prev => ({ ...prev, recipientDocument: val.replace(/\D/g, '') }));
                      }
                    }}
                    placeholder="Selecione ou digite CNPJ..."
                    allowCustomValue={true}
                    customValueLabel={(val) => Simular documento: }
                  />
                </div>'''

content = pattern.sub(new_block, content)

with open('src/components/FreightQuote/FreightQuote.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
