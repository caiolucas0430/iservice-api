# Issues de Bug — encontradas durante a US02

Textos prontos para cadastro no GitHub Issues do projeto.

---

## Bug #1 — Campo `phoneNumber` aceita qualquer valor (sem validação de formato)

**Severidade:** Média
**Origem:** US02 / RN05

**Descrição**
O DTO `UpdateProfileDto` validava `phoneNumber` apenas com `@IsString()`, aceitando
valores como `"123"` ou `"telefone"`. A regra RN05 (validação de telefone) e o teste
de aceitação TA02.04 não eram atendidos.

**Passos para reproduzir**
1. Autenticar-se.
2. `PATCH /users/profile` com corpo `{ "phoneNumber": "123" }`.
3. Observar que a atualização é aceita (HTTP 2xx).

**Resultado esperado**
HTTP 400 com a mensagem "Telefone inválido." (MSG04).

**Status:** ✅ Corrigido nesta iteração (regex de telefone em `update-profile.dto.ts`).

---

## Bug #2 — Troca de tipo de conta é unidirecional e implícita

**Severidade:** Alta
**Origem:** US02 / RN02

**Descrição**
A única forma de virar `PROFESSIONAL` era um efeito colateral de `updateProfile`
(quando havia `bio` + `location`). Não existia rota para o usuário alternar
explicitamente entre `USER` e `PROFESSIONAL`, nem forma de **retornar** de
`PROFESSIONAL` para `USER`. O critério "transitar entre as roles USER e
PROFESSIONAL" (TA02.02) não era atendido.

**Resultado esperado**
Endpoint que permita alternar a role nos dois sentidos, com reflexo nas permissões.

**Status:** ✅ Corrigido nesta iteração (`PATCH /users/me/role`, bidirecional).

---

## Bug #3 — Teste e2e de autenticação lê campo inexistente `access_token`

**Severidade:** Baixa (afeta a suíte de testes, não o runtime)
**Origem:** Descoberto durante a análise da US02

**Descrição**
`test/auth.e2e-spec.ts` espera `response.body.access_token`, porém o
`AuthService.generateJwt` retorna `{ token, user }`. A asserção
`expect(response.body).toHaveProperty('access_token')` falha e `jwtToken` fica
`undefined`, comprometendo os cenários subsequentes.

**Passos para reproduzir**
1. `npm run test:e2e`.
2. Observar a falha no teste de login por ausência de `access_token`.

**Resultado esperado**
O teste deve ler `response.body.token` (ou o serviço deve padronizar o nome do
campo em toda a base).

**Status:** ⚠️ Registrado. Sugestão: alinhar o nome do campo (`token` vs
`access_token`) entre `AuthService` e os testes/documentação.
