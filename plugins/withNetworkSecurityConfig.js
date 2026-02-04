const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withNetworkSecurityConfig = (config) => {
    // 1. Modify AndroidManifest.xml to reference network_security_config.xml
    config = withAndroidManifest(config, async (config) => {
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
        mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';
        return config;
    });

    // 2. Write the XML file using withDangerousMod
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            // platformProjectRoot is usually 'android' folder
            const resDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');

            // Ensure directory exists
            await fs.promises.mkdir(resDir, { recursive: true });

            const filePath = path.join(resDir, 'network_security_config.xml');
            const contents = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">mpc2cloud.ddns.net</domain>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </domain-config>
</network-security-config>`;

            await fs.promises.writeFile(filePath, contents);
            return config;
        },
    ]);

    return config;
};

module.exports = withNetworkSecurityConfig;
