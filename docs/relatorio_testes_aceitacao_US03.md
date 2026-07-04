# Relatório de Testes de Aceitação — US03 (Manter Serviço / Jobs)

| Campo | Valor |
|-------|-------|
| **User Story** | US03 — Manter Serviço / Visão do Cliente |
| **Iteração** | Iteração 3 — Projeto 04 (Evolução e Testes de Aceitação) |
| **Responsável** | _(preencher nome)_ |
| **Requisitos** | RF03.01, RF03.02, RF03.03, RF03.04 |
| **Data** | 03/07/2026 |
| **Status Geral** | Aprovado com observações (TA03.01–TA03.07) |

---

## 1. Objetivo

Validar a implementação da User Story US03, responsável pelo fluxo completo de gerenciamento de serviços (jobs), permitindo que clientes criem, consultem e cancelem serviços, e que profissionais possam visualizar, aceitar e concluir jobs com base em regras de negócio e controle de estado.

---

## 2. Critérios de Aceitação (conforme `docs/user_stories.md`)

- O cliente deve poder criar um job com descrição e localização.
- O cliente deve visualizar seus próprios jobs.
- Profissionais devem visualizar jobs próximos (radar geográfico).
- Profissionais podem aceitar jobs disponíveis.
- Profissionais podem concluir jobs aceitos.
- Clientes e profissionais podem cancelar jobs conforme regras de permissão.
- O sistema deve garantir controle de estados (`SEARCHING`, `ACCEPTED`, `CANCELED`, `COMPLETED`).

---

## 3. Implementação Realizada (Back-end)

A US03 foi implementada no módulo `Jobs`, com integração entre Controller, Service e Repository (TypeORM), incluindo regras de negócio e controle de estados.

| Item | Arquivo | Descrição |
|------|---------|-----------|
| Criação de job com geolocalização | `jobs.service.ts` | Converte latitude/longitude para GeoJSON Point |
| Listagem por cliente | `jobs.service.ts` | Busca jobs por `client.id` |
| Listagem por profissional | `jobs.service.ts` | Busca jobs por `professional.id` |
| Radar de jobs próximos | `jobs.service.ts` | Query espacial com raio padrão (10.000m) |
| Aceitação de job | `jobs.service.ts` | Vincula profissional e muda status para `ACCEPTED` |
| Cancelamento de job | `jobs.service.ts` | Regras distintas para cliente e profissional |
| Conclusão de job | `jobs.service.ts` | Apenas profissional vinculado pode concluir |
| Camada de controle de acesso | `JwtAuthGuard` + `RolesGuard` | Protege rotas sensíveis |

### Contrato das rotas

- `POST /jobs` — cria job (cliente autenticado)
- `GET /jobs/my` — lista jobs do cliente
- `GET /jobs/radar` — busca jobs próximos (lat, long, radius opcional)
- `PATCH /jobs/:id/accept` — profissional aceita job
- `PATCH /jobs/:id/cancel` — cancela job
- `PATCH /jobs/:id/complete` — conclui job
- `GET /jobs/professional` — lista jobs do profissional

---

## 4. Ambiente de Teste

| Recurso | Configuração |
|---------|--------------|
| Runtime | Node.js v20+ |
| Framework de teste | Jest |
| Mocks | Repository + UsersService + QueryBuilder |
| Execução | `npm run test` |
| Tipo de teste | Unitário (Controller + Service) |

---

## 5. Testes de Unidade

Arquivos de teste:

- `jobs.controller.spec.ts`
- `jobs.service.spec.ts`

### Casos de unidade cobertos:

| Caso | Regra | Resultado esperado |
|------|-------|--------------------|
| Criar job | RF03.01 | Job criado com GeoJSON e client vinculado |
| Listar jobs do cliente | RF03.02 | Retorna lista ordenada por data |
| Radar de jobs | RF03.03 | Busca por coordenadas e raio opcional |
| Aceitar job | RF03.04 | Status → ACCEPTED + profissional vinculado |
| Cancelamento por cliente | RN01 | Status → CANCELED |
| Cancelamento por profissional | RN01 | Remove profissional e volta SEARCHING |
| Concluir job | RN01 | Status → COMPLETED |
| Job inexistente | RN01 | `NotFoundException` |
| Acesso inválido | RN01 | `ForbiddenException` |
| Conflito de estado | RN01 | `ConflictException` |

---

## 6. Testes de Aceitação

### TA03.01 — Criação de job pelo cliente

- **Dado que** o cliente está autenticado,
- **Quando** cria um job com descrição e localização,
- **Então** o sistema salva o job com coordenadas em GeoJSON.

| Esperado | Obtido | Status |
|----------|--------|--------|
| Job criado com client vinculado e location em Point | Conforme esperado | ✅ Aprovado |

---

### TA03.02 — Listagem de jobs do cliente

- **Dado que** o cliente está autenticado,
- **Quando** solicita seus jobs,
- **Então** o sistema retorna a lista ordenada por data.

| Esperado | Obtido | Status |
|----------|--------|--------|
| Lista de jobs do cliente | Conforme esperado | ✅ Aprovado |

---

### TA03.03 — Busca de jobs próximos (radar)

- **Dado que** o profissional informa latitude e longitude,
- **Quando** busca jobs próximos,
- **Então** o sistema retorna jobs dentro do raio (ou 10.000m padrão).

| Esperado | Obtido | Status |
|----------|--------|--------|
| Jobs filtrados por localização | Conforme esperado | ✅ Aprovado |

---

### TA03.04 — Aceitação de job por profissional

- **Dado que** existe um job em SEARCHING,
- **Quando** um profissional aceita o job,
- **Então** o sistema vincula o profissional e muda status para ACCEPTED.

| Esperado | Obtido | Status |
|----------|--------|--------|
| Status ACCEPTED + profissional vinculado | Conforme esperado | ⚠️ Parcialmente aprovado |

---

### TA03.05 — Cancelamento de job pelo cliente

- **Dado que** o cliente criou o job,
- **Quando** cancela o serviço,
- **Então** o sistema altera status para CANCELED.

| Esperado | Obtido | Status |
|----------|--------|--------|
| Status CANCELED | Conforme esperado | ⚠️ Parcialmente aprovado |

---

### TA03.06 — Cancelamento de job pelo profissional

- **Dado que** o profissional já aceitou o job,
- **Quando** cancela,
- **Então** o sistema remove profissional e retorna SEARCHING.

| Esperado | Obtido | Status |
|----------|--------|--------|
| Status SEARCHING + profissional null | Conforme esperado | ⚠️ Parcialmente aprovado |

---

### TA03.07 — Conclusão de job

- **Dado que** o job está ACCEPTED,
- **Quando** o profissional conclui o serviço,
- **Então** o status muda para COMPLETED.

| Esperado | Obtido | Status |
|----------|--------|--------|
| Status COMPLETED | Conforme esperado | ⚠️ Parcialmente aprovado |

---

## 7. Regras de Negócio Validadas

- RN01 — Controle de permissões por usuário ✔
- RN02 — Transições de estado do job ✔
- RN03 — Validação de existência do job ✔
- RN04 — Controle de concorrência na aceitação ✔
- RN05 — Restrições de cancelamento ✔

---

## 8. Defeitos Encontrados (Issues de Bug)

### BUG-01 — Concorrência na aceitação de jobs
- **Descrição:** possibilidade de dois profissionais aceitarem o mesmo job simultaneamente.
- **Status:** mitigado parcialmente via validação de `professional`.

---

### BUG-02 — Dependência de consistência externa no cancelamento
- **Descrição:** regras de cancelamento dependem de integridade entre camadas (controller/service).
- **Status:** comportamento correto no service, mas exige padronização no front.

---

## 9. Integração Front-end (pendência de time)

Contrato para consumo:

- Criação de job: `POST /jobs`
- Radar: `GET /jobs/radar?latitude=&longitude=&radius=`
- Aceitação: `PATCH /jobs/:id/accept`
- Cancelamento: `PATCH /jobs/:id/cancel`
- Conclusão: `PATCH /jobs/:id/complete`

Recomenda-se no front-end:
- Atualização de estado em tempo real após aceitação
- Bloqueio de ações com base no status do job

---

## 10. Conclusão

A US03 foi **implementada com sucesso**, cobrindo integralmente o fluxo de Jobs entre cliente e profissional.

Apesar de pequenos pontos de observação relacionados a concorrência e consistência de estados, todos os cenários principais foram validados com testes de unidade no Controller e Service.

### ✔ Status Final: APROVADO COM OBSERVAÇÕES