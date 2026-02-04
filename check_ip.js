const axios = require('axios');

async function checkIp() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        console.log('Public IP:', response.data.ip);
    } catch (error) {
        console.error('Error fetching IP:', error.message);
    }
}

checkIp();
