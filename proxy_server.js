const express = require('express');
const axios = require('axios');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Agente HTTPS que ignora erros de certificado (SSL)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Middleware genérico para capturar qualquer requisição
app.use(async (req, res) => {
    console.log(`\n---------------------------------------------------`);
    console.log(`📥 RECEBIDO: ${req.method} ${req.url}`);

    // Modificação inteligente da URL
    let targetPath = req.url;
    // Se não começar com /api e for uma rota conhecida, adicionamos /api
    if (!targetPath.startsWith('/api') && (targetPath.startsWith('/coletor') || targetPath.startsWith('/valida_tenant'))) {
        targetPath = '/api' + targetPath;
        console.log(`🔀 URL REESCRITA: ${req.url} -> ${targetPath}`);
    }

    // Constrói a URL de destino
    const targetUrl = `https://mpc2cloud.ddns.net${targetPath}`;

    console.log(`👉 ALVO:     ${targetUrl}`);

    try {
        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            params: req.query,
            headers: {
                // Removemos o host original para evitar confusão no servidor destino
                ...req.headers,
                host: 'mpc2cloud.ddns.net'
            },
            httpsAgent: httpsAgent, // Ignora SSL
            validateStatus: () => true // Não lança erro se der 404/500, apenas repassa
        });

        console.log(`✅ RESPOSTA: ${response.status} ${response.statusText}`);

        // Repassa cabeçalhos e corpo
        res.status(response.status).send(response.data);

    } catch (error) {
        console.error(`❌ ERRO NO PROXY:`, error.message);
        if (error.response) {
            console.error(`   Status do Servidor: ${error.response.status}`);
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send({ error: 'Falha interna no Proxy', details: error.message });
        }
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 PROXY MANUAL (AXIOS) RODANDO NA PORTA ${PORT}`);
    console.log(`   Redirecionando tudo para: https://mpc2cloud.ddns.net (Sem /api)`);
});
