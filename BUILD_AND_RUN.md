# Guia de Execução e Build - DataCollectorApp

Este documento descreve os passos necessários para executar o aplicativo em ambiente de desenvolvimento e como gerar versões de produção (builds).

## 1. Pré-requisitos

Certifique-se de ter instalado em seu ambiente:
*   **Node.js** e **NPM**
*   **Expo Go** (no seu dispositivo móvel, se for testar fisicamente)
*   **EAS CLI** (para gerar builds):
    ```powershell
    npm install -g eas-cli
    ```

## 2. Executar Localmente (Desenvolvimento)

Para iniciar o servidor de desenvolvimento e testar o app:

### Iniciar o Metro Bundler
Este comando inicia o servidor e permite escolher onde rodar (Android, iOS, Web).
```powershell
npm start
```

### Comandos Específicos
*   **Android**: `npm run android` (Requer Android Studio/Emulador ou dispositivo USB)
*   **iOS**: `npm run ios` (Requer macOS e Xcode ou dispositivo USB)
*   **Web**: `npm run web`

**Dica:** Com o comando `npm start`, você pode ler o QR Code exibido no terminal usando o app **Expo Go** no seu celular para testar instantaneamente.

## 3. Gerando Builds (EAS Build)

O projeto utiliza o EAS (Expo Application Services) para gerar executáveis.

### Passo 1: Login no Expo
Caso ainda não esteja logado:
```powershell
eas login
```

### Passo 2: Configuração Inicial
Se for a primeira vez gerando build, configure o projeto (isso cria/verifica o arquivo `eas.json`):
```powershell
eas build:configure
```

### Passo 3: Gerar Build Android (APK para Testes)
Para gerar um arquivo `.apk` que pode ser instalado diretamente no dispositivo (sem Play Store):

1. Verifique se o seu `eas.json` possui um perfil `preview` configurado para APK (exemplo abaixo):
   ```json
   "build": {
     "preview": {
       "android": {
         "buildType": "apk"
       }
     }
   }
   ```
2. Execute o comando:
   ```powershell
   eas build -p android --profile preview
   ```

### Passo 4: Gerar Build de Produção (AAB para Loja)
Para gerar o arquivo `.aab` otimizado para a Google Play Store:
```powershell
eas build -p android --profile production
```

---
*Este arquivo foi gerado automaticamente para auxiliar no ciclo de desenvolvimento do projeto.*
