
const axios = require('axios');
const https = require('https');

const tenant = 'PepitaLegado';
const token = '226056DDE83865EBB16A72287F56DD863347519A';
const agent = new https.Agent({ rejectUnauthorized: false });

const urlsToTest = [
    `https://mpc2cloud.ddns.net/valida_tenant/by_name/tn=${tenant}/t=${token}`,
    `https://mpc2cloud.ddns.net/api/valida_tenant/by_name/tn=${tenant}/t=${token}`,
    `https://mpc2cloud.ddns.net/mpc2/api/valida_tenant/by_name/tn=${tenant}/t=${token}`, // Ás vezes tem o nome do app
    `https://mpc2apis.ddns.net/api/valida_tenant/by_name/tn=${tenant}/t=${token}` // Testar antigo de novo
];

async function testUrls() {
    console.log('🔍 Iniciando Diagnóstico de URLs...\n');

    for (const url of urlsToTest) {
        process.stdout.write(`Testando: ${url} ... `);
        try {
            const res = await axios.get(url, { httpsAgent: agent, validateStatus: () => true });
            console.log(`[${res.status} ${res.statusText}]`);
            if (res.status === 200) {
                console.log('✅ ACHAMOS UMA URL VÁLIDA!');
                console.log('📄 Conteúdo:', JSON.stringify(res.data).substring(0, 100));
            }
        } catch (error) {
            console.log(`❌ ERRO: ${error.message}`);
        }
    }
}

testUrls();
