const fs = require('fs');
let c1 = fs.readFileSync('src/components/Establishments/EmailOutgoingConfig.tsx', 'utf8');

c1 = c1.replace(
  "      if (!config) {\r\n        setToast({ message: t('establishments.form.emailOutgoing.messages.saveBeforeTest')",
  "      if (config && (config.smtp_host !== formData.smtp_host || config.smtp_port !== formData.smtp_port || config.smtp_secure !== formData.smtp_secure || config.smtp_user !== formData.smtp_user || config.smtp_password !== formData.smtp_password)) {\n        setToast({ message: 'Você possui alterações não salvas. Por favor, clique em Salvar Configuração antes de testar.', type: 'warning' });\n        return;\n      }\n\n      if (!config) {\r\n        setToast({ message: t('establishments.form.emailOutgoing.messages.saveBeforeTest')"
);

c1 = c1.replace(
  "      if (!config) {\n        setToast({ message: t('establishments.form.emailOutgoing.messages.saveBeforeTest')",
  "      if (config && (config.smtp_host !== formData.smtp_host || config.smtp_port !== formData.smtp_port || config.smtp_secure !== formData.smtp_secure || config.smtp_user !== formData.smtp_user || config.smtp_password !== (formData.smtp_password || config.smtp_password))) {\n        setToast({ message: 'Você possui alterações não salvas. Por favor, clique em Salvar Configuração antes de testar.', type: 'warning' });\n        return;\n      }\n\n      if (!config) {\n        setToast({ message: t('establishments.form.emailOutgoing.messages.saveBeforeTest')"
);

fs.writeFileSync('src/components/Establishments/EmailOutgoingConfig.tsx', c1, 'utf8');
