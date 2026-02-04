
const https = require('https');

const options = {
    hostname: 'mpc2cloud.ddns.net',
    port: 443,
    path: '/',
    method: 'GET',
    rejectUnauthorized: true // <--- ISSO É O IMPORTANTE. Se for false, ele ignora erro. Se true, ele valida.
};

console.log('🔍 Iniciando Auditoria SSL para: mpc2cloud.ddns.net ...\n');

const req = https.request(options, (res) => {
    console.log('✅ SUCESSO! O Certificado é VÁLIDO e CONFIÁVEL.');
    console.log(`Status Code: ${res.statusCode}`);
});

req.on('error', (e) => {
    console.log('❌ FALHA DE SSL DETECTADA!');
    console.log(`Erro: ${e.message}`);

    if (e.code === 'CERT_HAS_EXPIRED') {
        console.log('-> Motivo: O certificado expirou.');
    } else if (e.code === 'Unable to verify the first certificate' || e.message.includes('unable to verify')) {
        console.log('-> Motivo: Cadeia de certificação incompleta. (O Android odeia isso).');
        console.log('   Solução: O servidor precisa instalar os "Intermediate Certificates".');
    } else if (e.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        console.log('-> Motivo: O certificado não é para esse domínio (Nome errado).');
    } else if (e.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
        console.log('-> Motivo: Certificado auto-assinado (Não confiável publicamente).');
    }
});

req.end();
