const fs = require('fs');
let c1 = fs.readFileSync('src/services/emailOutgoingConfigService.ts', 'utf8');

c1 = c1.replace(
  "userMessage = 'Falha na autenticação. Verifique usuário e senha.';",
  "userMessage = `Falha na autenticação. Verifique usuário e senha. Detalhe do servidor: ${error.message}`; "
);

fs.writeFileSync('src/services/emailOutgoingConfigService.ts', c1, 'utf8');
