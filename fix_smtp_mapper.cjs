const fs = require('fs');
let c1 = fs.readFileSync('src/services/emailOutgoingConfigService.ts', 'utf8');

c1 = c1.replace(
  /smtp_secure: data\.smtp_secure \? 'TLS' : 'NONE'/g,
  "smtp_secure: data.smtp_secure ? (data.smtp_port === 465 ? 'SSL' : 'TLS') : 'NONE'"
);

fs.writeFileSync('src/services/emailOutgoingConfigService.ts', c1, 'utf8');
