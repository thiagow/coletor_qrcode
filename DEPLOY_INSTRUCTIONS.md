
# 📦 Guia de Preparação para APK de Produção

Este documento detalha os problemas de conexão SSL encontrados durante o desenvolvimento e as ações necessárias para gerar um APK funcional para o cliente.

## 🚨 O Problema
O servidor da API (`mpc2cloud.ddns.net`) possui um certificado SSL que, embora tecnicamente válido (aceito por Node.js/Postman), é rejeitado pelo sistema Android nativo (erro `Network request failed`). Isso impede a conexão direta HTTPS no aplicativo final sem configurações adicionais.

## ✅ Solução para Desenvolvimento (Atual)
Utilizamos um **Proxy Local** (`proxy_server.js`) que intermedia a conexão, ignorando erros de SSL e repassando para o App via HTTP.

## 🛠️ Solução para Produção (Gerar APK)
Para que o APK funcione no coletor do cliente sem o proxy, precisamos relaxar a segurança de rede do Android.

### Passo 1: Criar Configuração de Segurança de Rede
Criar um arquivo `network_security_config.xml` em `android/app/src/main/res/xml/` (via Config Plugin do Expo) com o seguinte conteúdo:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Permite tráfego HTTP inseguro (Cleartext) para debugging -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>

    <!-- Configuração específica para o domínio da API -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">mpc2cloud.ddns.net</domain>
        <!-- Opcional: Se necessário, confiar em certificados específicos ou ignorar erros -->
        <trust-anchors>
             <certificates src="system" />
             <certificates src="user" />
        </trust-anchors>
    </domain-config>
</network-security-config>
```

### Passo 2: Config Plugin do Expo
Adicionar um plugin no `app.json` para injetar essa configuração durante o `prebuild`.

1. Instalar `expo-build-properties`:
   ```bash
   npx expo install expo-build-properties
   ```

2. Configurar `app.json` para permitir tráfego HTTP (Cleartext):
   ```json
   "plugins": [
     [
       "expo-build-properties",
       {
         "android": {
           "usesCleartextTraffic": true
         }
       }
     ]
   ]
   ```

3. (Avançado) Se o erro persistir, criar um plugin customizado para modificar o `AndroidManifest.xml` e referenciar o `network_security_config`.

## 🚀 Como Gerar o APK
Quando for entregar:
1. Pare de usar a URL do Proxy (`http://192...`).
2. Configure a URL real (`https://mpc2cloud.ddns.net`).
3. Rode o comando de build (ex: `eas build -p android --profile preview`).

---
**Observação:** O uso do Proxy Local deve ser mantido durante todo o desenvolvimento das telas para evitar bloqueios.
