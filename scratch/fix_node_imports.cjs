const fs = require('fs');
const path = require('path');
const dir = 'tms-erp-proxy/services/auto-import';
const files = fs.readdirSync(dir);
files.forEach(file => {
    if (!file.endsWith('.js')) return;
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    content = content.replace(/npm:/g, '');
    content = content.replace(/\.ts['"]/g, ".js'");
    content = content.replace(/Deno\.env\.get\((['"])(.*?)(['"])\)/g, 'process.env[$1$2$3]');
    fs.writeFileSync(path.join(dir, file), content);
});
