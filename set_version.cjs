const fs = require('fs');

function updateVersion(filepath) {
    if (fs.existsSync(filepath)) {
        let content = fs.readFileSync(filepath, 'utf8');
        content = content.replace(/V1\.[0-9]+/g, 'V1.25');
        fs.writeFileSync(filepath, content, 'utf8');
    }
}

updateVersion('src/components/Auth/Login.tsx');
updateVersion('src/components/Layout/Header.tsx');
updateVersion('src/components/SaasAdmin/SaasAdminLogin.tsx');
