# 🌐 Manual de Execução (Produção)

Este manual é destinado aos responsáveis pela operação (DevOps / SysAdmin / Backends sêniores) e detalha o processo de **Deploy** ou orquestração do projeto `iservice-api` para um ambiente de Produção.

---

## 1. Visão Geral da Arquitetura de Produção

Em produção, rodamos a infraestrutura inteira dentro de containers (Docker) isolados utilizando o **Docker Compose**.
A estratégia inclui:
- Um serviço de Banco de Dados: `iservice_db_prod` (PostgreSQL com PostGIS)
- Um serviço da API (NestJS): `iservice_api_prod`
- Uma rede bridge interna exclusiva (`iservice_network`) para os containers se comunicarem via DNS.

## 2. Preparando a Máquina Host (Servidor de Produção)

No servidor de hospedagem (ex: AWS EC2, Digital Ocean Droplet, VPS local):
1. Verifique se o **Docker** e o **Docker Compose plugin** estão instalados e ativos.
2. Clone a ramificação apropriada do projeto (ex: `main`):
   ```bash
   git clone https://github.com/luizfelixdev/iservice-api.git
   cd iservice-api
   ```

## 3. Configurando as Credenciais (.env de Produção)

Nunca versione o arquivo de variáveis de ambiente. Você deve criar um arquivo `.env` na raiz do repositório no próprio servidor.
O `.env` precisa estar devidamente preenchido. **Cuidado:** o Host do banco deve apontar para o nome do serviço interno criado pelo docker e a porta tem que ser a porta de uso do container do db:
```env
# Banco de Dados
DB_HOST=db
DB_PORT=5432
DB_USERNAME=usuario_seguro
DB_PASSWORD=senha_ultra_segura
DB_NAME=iservice_prod_db

# Chaves Secretas e Configs da Aplicação
JWT_SECRET=super_secret_production_key_here
NODE_ENV=production
PORT=8404
```

## 4. Orquestrando e Executando (Build & Up)

Nós utilizamos um arquivo docker compose exclusivo para a produção: `docker-compose.prod.yml`.

Para construir a Imagem da API otimizada (Multi-stage) e iniciar ambos os serviços em *background*:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```
> O `--build` garante que uma nova imagem seja gerada lendo as últimas modificações do repositório clonado.

### 4.1. Verificando o Status
```bash
docker-compose -f docker-compose.prod.yml ps
```
Você deverá ver ambos os containers `iservice_db_prod` e `iservice_api_prod` com Status `Up`.

### 4.2. Lendo Logs em Tempo Real
Caso a API não suba ou apresente erros críticos em produção, monitore o serviço `api`:
```bash
docker-compose -f docker-compose.prod.yml logs -f api
```

## 5. Atualizando a Aplicação (Continuous Deployment Manual)

Para lançar uma nova versão da aplicação após os commits na branch principal:
1. Puxe as atualizações do git:
   ```bash
   git pull origin main
   ```
2. Reconstrua a imagem sem cache e recrie os containers afetados sem tempo de inatividade significativo no banco de dados (o banco só será recriado se os parâmetros dele também mudarem):
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
3. Ocasionalmente, remova as imagens antigas que ficaram "órfãs" ("dangling images") para poupar espaço em disco do servidor:
   ```bash
   docker image prune -f
   ```

## 6. Procedimentos de Desastre (Stop / Wipe)

- **Parar o sistema:**
  ```bash
  docker-compose -f docker-compose.prod.yml stop
  ```
- **Remover tudo (Destruir Banco de Dados de Produção - CUIDADO EXTREMO):**
  ```bash
  docker-compose -f docker-compose.prod.yml down -v
  ```
