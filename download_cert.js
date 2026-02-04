const fs = require('fs');
const https = require('https');

const options = {
    hostname: 'mpc2cloud.ddns.net',
    port: 443,
    method: 'GET',
    rejectUnauthorized: false,
    agent: false
};

const req = https.request(options, (res) => {
    const cert = res.connection.getPeerCertificate();
    if (!cert || Object.keys(cert).length === 0) {
        console.log('No certificate found');
        return;
    }

    const certPem = '-----BEGIN CERTIFICATE-----\n' + cert.raw.toString('base64').match(/.{1,64}/g).join('\n') + '\n-----END CERTIFICATE-----\n';

    fs.writeFileSync('server.crt', certPem);
    console.log('Certificado salvo com sucesso em: server.crt');
    console.log('Envie este arquivo para o celular e instale-o.');
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
