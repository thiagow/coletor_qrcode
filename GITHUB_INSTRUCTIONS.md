# Subindo o Projeto para o GitHub

Como eu não tenho acesso direto às suas credenciais do GitHub para criar repositórios, segui os passos para preparar tudo localmente. O projeto já está "commitado" no git local.

Siga os passos abaixo para enviá-lo para o GitHub:

1.  **Crie um novo repositório no GitHub**:
    *   Acesse [https://github.com/new](https://github.com/new).
    *   Dê um nome ao repositório (ex: `coletor_qrcode`).
    *   Não precisa marcar "Initialize with README", .gitignore ou license (já temos isso localmente).
    *   Clique em "Create repository".

2.  **Conecte o repositório local ao remoto**:
    *   Na tela seguinte do GitHub, copie a URL do repositório (`https://github.com/thiagow/coletor_qrcode.git`).
    *   Abra o terminal na pasta do projeto e rode:
        ```bash
        git remote add origin <COLE_A_URL_AQUI>
        git branch -M main
        git push -u origin main
        ```

Se o comando `git push` pedir autenticação, use suas credenciais do GitHub (ou Personal Access Token).
