
const https = require('https');

const agent = new https.Agent({
    rejectUnauthorized: false
});

const token = '226056DDE83865EBB16A72287F56DD863347519A';
const tenant = 'PepitaLegado';

// URL 1: Com /api
const url1 = `https://mpc2cloud.ddns.net/api/valida_tenant/by_name/tn=${tenant}/t=${token}`;
// URL 2: Sem /api
const url2 = `https://mpc2cloud.ddns.net/valida_tenant/by_name/tn=${tenant}/t=${token}`;

const checkUrl = (url) => {
    console.log(`Checking: ${url}`);
    const req = https.get(url, { agent }, (res) => {
        console.log(`Status: ${res.statusCode}`);
        res.on('data', () => { }); // Consume
    });
    req.on('error', (e) => console.error(`Error: ${e.message}`));
};

checkUrl(url1);
checkUrl(url2);
