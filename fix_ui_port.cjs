const fs = require('fs');
let content = fs.readFileSync('src/components/Establishments/EmailOutgoingConfig.tsx', 'utf8');

content = content.replace(
  "onChange={(e) => setFormData({ ...formData, smtp_secure: e.target.value as 'TLS' | 'SSL' | 'NONE' })}",
  "onChange={(e) => {\n                  const newSecure = e.target.value as 'TLS' | 'SSL' | 'NONE';\n                  const newPort = newSecure === 'SSL' ? 465 : newSecure === 'TLS' ? 587 : formData.smtp_port;\n                  setFormData({ ...formData, smtp_secure: newSecure, smtp_port: newPort });\n                }}"
);

fs.writeFileSync('src/components/Establishments/EmailOutgoingConfig.tsx', content, 'utf8');
