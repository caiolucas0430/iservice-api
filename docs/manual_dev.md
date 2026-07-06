# 🚀 Manual de Execução (Desenvolvimento)

Este manual detalha o passo a passo para colocar a API do **iService** para rodar localmente no seu ambiente de desenvolvimento.

---

## 1. Pré-requisitos

Para trabalhar no projeto, você deve ter as seguintes ferramentas devidamente instaladas:
- **Node.js** (versão 20 ou superior) e NPM.
- **Docker** e **Docker Compose** (Essenciais para rodar o PostgreSQL com a extensão PostGIS).
- **Git**.
- Recomendado: Um editor de código moderno como o **VS Code**.

## 2. Preparando o Repositório

Faça o clone do projeto e entre na pasta:
```bash
git clone https://github.com/luizfelixdev/iservice-api.git
cd iservice-api
```

Instale as dependências da aplicação:
```bash
npm install
```

## 3. Configurando as Variáveis de Ambiente

O banco de dados e a aplicação precisam de credenciais e chaves para funcionar.
- Crie uma cópia do arquivo `.env.example` e renomeie-a para `.env`.
- Solicite a chave do JWT (`JWT_SECRET`) e demais chaves de serviços externos ao Tech Lead ou arquiteto responsável.
- Preencha o `.env` com as configurações locais de banco:
  ```env
  DB_HOST=localhost
  DB_PORT=5433
  DB_USERNAME=postgres
  DB_PASSWORD=suasenha
  DB_NAME=iservice_db
  PORT=8404
  ```
  *(Nota: A porta local do banco está mapeada no docker-compose para `5433`)*.

## 4. Subindo a Infraestrutura de Banco de Dados

Nós utilizamos o Docker apenas para provisionar o banco PostgreSQL com PostGIS no ambiente Dev, permitindo que a API rode diretamente no seu host para que recursos como o *Hot Reload* do NestJS funcionem com máxima velocidade.

Inicie o banco executando:
```bash
docker-compose up -d
```
Isso fará o container `iservice_db` rodar em segundo plano, escutando a porta local `5433`.

## 5. Rodando a Aplicação NestJS

Agora basta iniciar o servidor da API em modo de observação (watch), assim qualquer arquivo salvo irá reiniciar automaticamente o servidor:

```bash
npm run start:dev
```

A API estará rodando no endereço `http://localhost:8404`.

## 6. Dicas Úteis de Dev

### 6.1. Como verificar problemas de padronização (Linting)?
Seu código não vai passar no Pull Request se não estiver no padrão estabelecido pela equipe:
```bash
npm run lint --fix
```

### 6.2. Como derrubar o banco de dados?
Se precisar parar os containers:
```bash
docker-compose down
```
Se precisar excluir inclusive os volumes criados (cuidado, vai apagar seus dados de teste):
```bash
docker-compose down -v
```

### 6.3 Como limpar o Build cache?
Às vezes, o NestJS pode acusar erros de tipos estranhos, o que pode ser cache. Apague a pasta `dist` e rode o projeto novamente.
```bash
rm -rf dist/
npm run start:dev
```
