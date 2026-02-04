const axios = require('axios');
const https = require('https');

const url = 'https://mpc2cloud.ddns.net/api/coletor/login';
const agent = new https.Agent({ rejectUnauthorized: false });

// Using EXACTLY what user provided
const payload = {
    tenantName: 'PetitaLegado', // User wrote Petita, not Pepita
    codFuncionario: '32',
    password: '123456'
};

async function testDirect() {
    console.log(`Connecting directly to: ${url}`);
    console.log(`Payload:`, JSON.stringify(payload));

    try {
        const response = await axios.post(url, payload, {
            httpsAgent: agent,
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`Status: ${response.status}`);
        console.log(`Data:`, JSON.stringify(response.data));
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Data:`, JSON.stringify(error.response.data));
        }
    }
}

testDirect();
