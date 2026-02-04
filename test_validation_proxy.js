const axios = require('axios');

const proxyUrl = 'http://localhost:3000';
const tenant = 'PepitaLegado';
const token = '226056DDE83865EBB16A72287F56DD863347519A'; // From previous file

const paths = [
    `/valida_tenant/by_name/tn=${tenant}/t=${token}`,
    `/api/valida_tenant/by_name/tn=${tenant}/t=${token}`
];

async function testValidationPaths() {
    console.log('Testing Validation Paths via Proxy...');

    for (const path of paths) {
        process.stdout.write(`Testing ${path.substring(0, 30)}... `);
        try {
            const response = await axios.get(`${proxyUrl}${path}`);
            console.log(`[${response.status}]`);
            if (response.status === 200) {
                console.log('✅ SUCCESS!');
            }
        } catch (error) {
            const status = error.response ? error.response.status : 'Error';
            console.log(`[${status}]`);
            // console.log(error.message);
        }
    }
}

testValidationPaths();
