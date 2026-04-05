const fs = require('fs');

let content = fs.readFileSync('tms-erp-proxy/index.js', 'utf8');

// Replace order body params
content = content.replace(
  "const { endpointSystem, port, username, password, companyDb } = req.body;",
  "const { endpointSystem, port, username, password, companyDb, lastSyncTime } = req.body;"
);

// We need to replace ALL occurrences of req.body destructuring since Invoice does it too.
content = content.replace(
  /const \{ endpointSystem, port, username, password, companyDb \} = req\.body;/g,
  "const { endpointSystem, port, username, password, companyDb, lastSyncTime } = req.body;"
);

fs.writeFileSync('tms-erp-proxy/index.js', content, 'utf8');
console.log('Parameters replaced.');
