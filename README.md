# Projeto Fastify Learning

Este é um projeto de aprendizado prático demonstrando como construir uma API moderna, escalável e bem-estruturada utilizando as tecnologias mais requisitadas no mercado de backend em Node.js.

## 🖥️ Tecnologias Integradas

O projeto inclui integração com as seguintes tecnologias/bibliotecas:

- **Fastify** (Framework web ultrarrápido)
- **Prisma ORM** (Modelagem e manipulação do banco de dados)
- **PostgreSQL** (Banco de dados relacional principal)
- **Redis** (Gerenciamento de cache e otimização de performance)
- **OpenTelemetry / Jaeger** (Monitoramento, Observabilidade e Rastreamento de queries, latência, erros)
- **Swagger / Swagger UI** (Documentação da API)
- **Docker & Docker Compose** (Containerização e orquestração do ambiente de desenvolvimento)

## 🐳 Como rodar a aplicação via Docker

A forma mais simples de subir a infraestrutura completa do projeto é utilizando o Docker Compose.

1. Certifique-se de que você tem o **Docker** e o **Docker Compose** instalados na sua máquina.
2. Clone o repositório.
3. Na raiz do projeto, execute:

```bash
docker compose up -d --build
```

> O comando construirá a imagem do Node.js (`fastify_app`) e fará o deploy automático e gerará a base de tabelas do Prisma no PostgreSQL, também iniciando as instâncias de instâncias do Redis, Jaeger e pgAdmin simultaneamente e sem necessidade de scripts manuais.

**Serviços e Portas Iniciadas:**

- 🟢 **API (Fastify App):** `http://localhost:3000`
- 🟢 **Swagger UI (Documentação da API):** `http://localhost:3000/docs`
- 🟢 **PostgreSQL:** `localhost:5432` (Acesso com: `user_fastify` | Senha: `password_fastify` | Banco: `fastify_db`)
- 🟢 **pgAdmin (Para visualizar o Banco):** `http://localhost:8080` (Acesso com: `admin@admin.com` | Senha: `admin`)
- 🟢 **Redis:** `localhost:6379`
- 🟢 **Jaeger UI (Observabilidade e Tracing):** `http://localhost:16686`

---

## 🛠 Como testar as rotas (Postman)

Todos os endpoints da API estão catalogados em uma Collection do Postman disponibilizada no projeto. A collection está localizada na pasta `/collection` sob o nome `FastifyLearning.postman_collection.json`.

**Para importá-la no Postman:**

1. Abra o **Postman**.
2. Clique no botão **"Import"** (geralmente localizado na área superior da barra lateral esquerda).
3. Na janela modal que abrir, você pode simplesmente **clicar e arrastar** o arquivo `./collection/FastifyLearning.postman_collection.json` para dentro.
4. Alternativamente, você pode clicar em "Files" e selecionar o arquivo navegando pelos diretórios.
5. Após o import, uma nova collection chamada **"Fastify Learning"** aparecerá na sua área de trabalho pronta para uso.

> **Dica:** O Prisma Studio pode ser acessado durante o desenvolvimento pelo comando `npm run prisma:studio` visualizar as tabelas de maneira amigável numa aba web (Geralmente no `http://localhost:5555`).
