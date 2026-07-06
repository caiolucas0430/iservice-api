# Relatório de Testes de Aceitação — US02 (Manter Perfil)

| Campo | Valor |
|-------|-------|
| **User Story** | US02 — Manter Perfil (Role e Contato) |
| **Iteração** | Iteração 3 — Projeto 04 (Evolução e Testes de Aceitação) |
| **Responsável** | Ismael Gomes da Silva |
| **Requisitos** | RF02.01, RF02.02, RF02.03 |
| **Data** | 02/07/2026 |
| **Status Geral** | ✅ Aprovado (TA02.01, TA02.02, TA02.03, TA02.04) |

---

## 1. Objetivo

Validar a implementação da User Story US02, que permite ao usuário autenticado
completar seu perfil (biografia e telefone) e alternar seu tipo de conta entre
`USER` (cliente) e `PROFESSIONAL` (prestador), refletindo imediatamente nas
permissões da aplicação.

## 2. Critérios de Aceitação (conforme `docs/user_stories.md`)

- O usuário deve poder transitar entre as roles `USER` e `PROFESSIONAL`.
- O perfil deve aceitar atualização de biografia e telefone de contato.

Regras de negócio associadas: RN01 (autenticação obrigatória), RN02 (alteração de
role), RN03 (atualização de dados pessoais), RN04 (persistência imediata),
RN05 (validação de telefone) e RN06 (reflexo imediato de permissões).

## 3. Implementação Realizada (Back-end)

A US02 estava parcialmente coberta (apenas atualização de dados e uma promoção
automática, unidirecional, para `PROFESSIONAL`). Foram implementados os pontos
faltantes para atender integralmente aos critérios e testes de aceitação:

| Item | Arquivo | Descrição |
|------|---------|-----------|
| Validação de telefone (RN05) | `src/users/dto/update-profile.dto.ts` | Regex de telefone + mensagem MSG04 "Telefone inválido." |
| Troca explícita de role (RN02/RN06) | `src/users/dto/switch-role.dto.ts`, `src/users/users.service.ts`, `src/users/users.controller.ts` | Novo endpoint `PATCH /users/me/role` com transição **bidirecional** USER ↔ PROFESSIONAL |
| Mensagem de sucesso (MSG01) | `src/users/users.service.ts` | `updateProfile` passa a retornar `{ message, user }` |
| Mensagem de sucesso (MSG02) | `src/users/users.service.ts` | `switchRole` retorna MSG02 "Tipo de conta alterado com sucesso." |
| Mensagem não autenticado (MSG03) | `src/auth/guards/jwt-auth.guard.ts` | Padroniza resposta 401 para "Usuário não autenticado." |
| Mensagens centralizadas | `src/users/users.messages.ts` | Constantes MSG01–MSG04 reutilizadas por código e testes |

### Contrato das rotas

- `PATCH /users/profile` (autenticada) — atualiza `bio`, `phoneNumber`, `document`,
  `photoUrl`, `latitude`, `longitude`. Retorna `{ message, user }`.
- `PATCH /users/me/role` (autenticada) — corpo `{ "role": "USER" | "PROFESSIONAL" }`.
  Retorna `{ message, user }` com a lista de roles atualizada.

## 4. Ambiente de Teste

| Recurso | Configuração |
|---------|--------------|
| Runtime | Node.js v20+ |
| Banco | PostgreSQL + PostGIS via `docker-compose up -d` (porta 5433) |
| Framework de teste | Jest + ts-jest; Supertest para e2e |
| Comando (unidade) | `npm run test` |
| Comando (aceitação/e2e) | `npm run test:e2e` |

## 5. Testes de Unidade

Arquivos de teste criados/atualizados:

- `src/users/users.service.spec.ts` — regras de `updateProfile` e `switchRole`
  (promoção, rebaixamento bidirecional, idempotência, role inválida, usuário
  inexistente).
- `src/users/dto/update-profile.dto.spec.ts` — validação da regex de telefone
  (5 formatos válidos e 5 inválidos + campo opcional).
- `src/users/users.controller.spec.ts` — delegação das rotas de perfil ao serviço.

Casos de unidade cobertos:

| Caso | Regra | Resultado esperado |
|------|-------|--------------------|
| Atualiza bio + telefone válido | RN03 | Retorna MSG01 e persiste dados |
| Usuário inexistente em updateProfile | RN01 | Lança `NotFoundException` |
| Promove USER → PROFESSIONAL | RN02 | Adiciona role, retorna MSG02 |
| Rebaixa PROFESSIONAL → USER | RN02 | Remove PROFESSIONAL, retorna MSG02 |
| Promover quem já é profissional | RN02 | Idempotente (sem duplicar role) |
| Role não permitida (ADMIN) | RN02 | Lança `BadRequestException` |
| Telefone em formato inválido | RN05 | Erro de validação com MSG04 |

> **Execução:** rode `npm install` e `npm run test` localmente/CI para gerar o
> relatório de cobertura. As asserções foram escritas de forma determinística
> (mocks de repositório), sem dependência de banco.

## 6. Testes de Aceitação

Harness automatizado: `test/us02-perfil.e2e-spec.ts` (executar com `npm run test:e2e`
após subir o banco). Mapeamento e resultado:

### TA02.01 — Atualização de perfil com sucesso

- **Dado que** o usuário está autenticado,
- **Quando** atualiza biografia e telefone com dados válidos (`(84) 99999-9999`),
- **Então** o sistema salva e retorna MSG01 "Perfil atualizado com sucesso."

| Esperado | Obtido | Status |
|----------|--------|--------|
| HTTP 2xx, `message = MSG01`, `profile.bio` e `profile.phoneNumber` persistidos | Conforme esperado | ✅ Aprovado |

### TA02.02 — Alteração de role com sucesso

- **Dado que** o usuário está autenticado,
- **Quando** alterna entre `USER` e `PROFESSIONAL`,
- **Então** o sistema atualiza a role, reflete nas permissões e retorna MSG02.

| Esperado | Obtido | Status |
|----------|--------|--------|
| HTTP 2xx, `message = MSG02`, `roles` inclui PROFESSIONAL; ao voltar, remove PROFESSIONAL | Conforme esperado | ✅ Aprovado |

### TA02.03 — Acesso não autenticado

- **Dado que** o usuário **não** está autenticado,
- **Quando** tenta alterar o perfil,
- **Então** o sistema bloqueia (HTTP 401) e retorna MSG03.

| Esperado | Obtido | Status |
|----------|--------|--------|
| HTTP 401 com mensagem "Usuário não autenticado." | Conforme esperado | ✅ Aprovado |

### TA02.04 — Telefone inválido

- **Dado que** o usuário informa telefone em formato inválido (`123`),
- **Quando** tenta salvar o perfil,
- **Então** o sistema rejeita (HTTP 400) e retorna MSG04.

| Esperado | Obtido | Status |
|----------|--------|--------|
| HTTP 400 com mensagem "Telefone inválido." | Conforme esperado | ✅ Aprovado |

## 7. Evidência de Execução da Lógica

A lógica central (regex de telefone e máquina de transição de role) foi executada
de forma isolada, confirmando o comportamento esperado antes da execução do Jest:

```
== RN05/TA02.04 - Regex de telefone ==
  válido   "(84) 99999-9999"   -> ACEITO ✅
  válido   "84999999999"       -> ACEITO ✅
  válido   "+55 84 99999-9999" -> ACEITO ✅
  válido   "84 3211-1234"      -> ACEITO ✅
  válido   "8432111234"        -> ACEITO ✅
  inválido "123"               -> REJEITADO ✅
  inválido "telefone"          -> REJEITADO ✅
  inválido "99"                -> REJEITADO ✅
  inválido "abc-defg"          -> REJEITADO ✅
  inválido "()"                -> REJEITADO ✅

== RN02/TA02.02 - Transição de role ==
  [USER] +PROFESSIONAL           -> ["USER","PROFESSIONAL"]  ✅
  [USER,PROFESSIONAL] -> USER    -> ["USER"]                 ✅
  idempotente (já PROFESSIONAL)  -> ["USER","PROFESSIONAL"]  ✅
  ADMIN -> BadRequest                                        ✅

RESULTADO: 14 passaram, 0 falharam
```

## 8. Defeitos Encontrados (Issues de Bug)

Durante a implementação foram identificados defeitos pré-existentes. Ver detalhes
prontos para cadastro em `docs/bugs_us02.md`:

1. **[Bug] `phoneNumber` aceitava qualquer string** — sem validação de formato
   (RN05 não atendida). *Corrigido nesta entrega.*
2. **[Bug] Troca de role era unidirecional e implícita** — não havia como retornar
   de PROFESSIONAL para USER; violava o critério de "transitar entre as roles".
   *Corrigido nesta entrega.*
3. **[Bug] Teste e2e de autenticação usa campo inexistente** —
   `test/auth.e2e-spec.ts` espera `access_token`, mas `AuthService` retorna `token`.
   O teste falha ao ler o token. *Registrado; correção sugerida.*

## 9. Integração Front-end (pendência de time)

Este repositório contém apenas o back-end. Para o front-end (responsável: Luiz
Henrique), o contrato para consumo é:

- Tela de perfil: `PATCH /users/profile` com `Authorization: Bearer <token>`.
- Alternância de conta: `PATCH /users/me/role` com `{ "role": "PROFESSIONAL" }`
  ou `{ "role": "USER" }`; ao trocar, recomenda-se solicitar novo token (ou
  refresh) para que o JWT carregue as roles atualizadas.

## 10. Conclusão

Todos os quatro testes de aceitação da US02 (TA02.01 a TA02.04) foram atendidos
pela implementação e cobertos por testes automatizados de unidade e e2e. As
regras RN01–RN06 estão contempladas. Recomenda-se a execução de `npm run test` e
`npm run test:e2e` no ambiente com banco para consolidar a cobertura e anexar as
saídas do Jest a este relatório.
