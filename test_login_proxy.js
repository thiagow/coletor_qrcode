const axios = require('axios');

const proxyUrl = 'http://localhost:3000';
const tenant = 'PepitaLegado';
const credentials = {
    tenantName: tenant,
    codFuncionario: 'OP001',
    password: '123'
};

const paths = [
    '/coletor/login',
    '/api/coletor/login',
    '/mpc2/api/coletor/login'
];

async function testLoginPaths() {
    console.log('Testing Login Paths via Proxy...');

    for (const path of paths) {
        process.stdout.write(`Testing ${path}... `);
        try {
            const response = await axios.post(`${proxyUrl}${path}`, credentials);
            console.log(`[${response.status}]`);
            console.log('Data:', JSON.stringify(response.data));
            if (response.status === 200) {
                console.log('✅ SUCCESS!');
            }
        } catch (error) {
            const status = error.response ? error.response.status : 'Error';
            console.log(`[${status}]`);
        }
    }
}

testLoginPaths();
