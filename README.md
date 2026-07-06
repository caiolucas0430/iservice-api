# 🚀 iService API

Bem-vindo ao repositório oficial da API do **iService**! Este é o back-end do nosso marketplace de serviços on-demand, responsável por conectar clientes a profissionais locais em tempo real utilizando buscas geográficas avançadas.

## 📚 Documentação do Projeto (Artefatos)
Todos os documentos de engenharia de software elaborados para a disciplina encontram-se na pasta `/docs`:
* [Documento de Visão](./docs/documento_visao.md)
* [Modelo de Dados e Dicionário](./docs/modelo_dados.md)
* [Lista de User Stories](./docs/user_stories.md)
* [Arquitetura do projeto](./docs/arquitetura.md)
* [Ponto de Funcao](./docs/analise_ponto_de_funcao.md)
* [Manual de Execução (Desenvolvimento)](./docs/manual_dev.md)
* [Manual de Execução (Produção)](./docs/manual_producao.md)

## 🛠️ Tecnologias Utilizadas e Tutoriais
* **Framework:** [NestJS](https://nestjs.com/) (TypeScript) - [Acessar Tutorial](https://docs.nestjs.com/)
* **Banco de Dados:** PostgreSQL com a extensão **PostGIS** (para dados espaciais) - [Acessar Tutorial](https://postgis.net/documentation/getting_started/)
* **ORM:** TypeORM - [Acessar Tutorial](https://typeorm.io/)
* **Autenticação:** JWT (JSON Web Tokens) e Google OAuth
* **Infraestrutura Local:** Docker & Docker Compose

---

## ⚙️ Como rodar o projeto localmente

### 1. Pré-requisitos
Antes de começar, certifique-se de ter as seguintes ferramentas instaladas em sua máquina:
* **Node.js** (v20 ou superior)
* **Docker** e **Docker Compose**
* **Git**

### 2. Configurando o Ambiente
Clone o repositório para a sua máquina e instale as dependências do Node:

    git clone [https://github.com/luizfelixdev/iservice-api.git](https://github.com/luizfelixdev/iservice-api.git)
    cd iservice-api
    npm install

### 3. Variáveis de Ambiente (.env)

Nós não commitamos senhas e chaves secretas no GitHub! Para que o projeto funcione na sua máquina, siga estes passos:

- Crie uma cópia do arquivo `.env.example` e renomeie-a para `.env`.
- Solicite as chaves secretas reais (como o `JWT_SECRET` e credenciais do banco) ao Tech Lead do projeto.
- Preencha os valores correspondentes dentro do seu novo arquivo `.env`.

### 4. Subindo o Banco de Dados (Docker)

A nossa API depende do PostgreSQL e do PostGIS para funcionar e salvar as localizações. Já deixamos tudo configurado no Docker para facilitar a sua vida. No terminal, rode o comando abaixo:

    docker-compose up -d

💡 Dica: O `-d` faz o container rodar em segundo plano. O banco estará mapeado na porta `5433` para não conflitar com outras instalações de Postgres.

### 5. Iniciando a API

Com o banco de dados rodando e o arquivo `.env` configurado corretamente, inicie o servidor em modo de desenvolvimento:

    npm run start:dev

A API estará rodando e escutando requisições em:
`http://localhost:8404`

---

## 🛡️ Padrões de Código e CI/CD (IMPORTANTE)

Para mantermos a nossa base de código limpa, legível e livre de bugs, utilizamos o ESLint e o Prettier.

🚨 **Regra de Ouro:** Código fora do padrão não entra na branch principal.

Nós possuímos uma esteira de Integração Contínua (CI) configurada no GitHub Actions. Toda vez que você finalizar uma tarefa e abrir um Pull Request (PR) para as branches `main` ou `dev`, o GitHub criará uma máquina virtual e testará o seu código automaticamente.

O botão de Merge será BLOQUEADO pelo sistema se:

- O código tiver erros de TypeScript e não compilar (Build falhou).
- O código estiver fora das regras de padronização (Lint falhou).
  Ex: Variáveis não utilizadas, falta de ponto e vírgula, imports não utilizados.

### 💡 Como evitar que o seu PR seja reprovado?

Crie o hábito de rodar o fiscal de código na sua própria máquina antes de dar o `git commit` e fazer o push:

    npm run lint
    npm run lint --fix

---

## 📜 Lista de Comandos Úteis

| Comando | O que ele faz |
|--------|--------------|
| `npm run start:dev` | Inicia o servidor com hot-reload |
| `npm run build` | Compila o projeto TypeScript para JavaScript (pasta `/dist`) |
| `npm run lint` | Verifica regras de código |
| `docker-compose up -d` | Sobe o banco de dados |
| `docker-compose down` | Para e remove os containers |

---

Desenvolvido com 💻 e ☕ pela equipe iService.