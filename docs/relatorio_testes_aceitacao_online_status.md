# Relatório de Testes de Aceitação - Status Online/Offline

## Objetivo
Validar a funcionalidade de alternar o status (Online/Offline) do profissional na plataforma.

## Cenário 1: Visualização do Status pelo Próprio Profissional
1. **Dado** que estou logado como um usuário com perfil de "Profissional"
2. **E** acesso a tela "Meu Portfólio"
3. **Então** devo ver um componente visual (Badge + Switch) indicando meu status atual (padrão "Offline")
4. **E** posso interagir com o Switch.

## Cenário 2: Atualização do Status
1. **Dado** que estou logado como "Profissional" na tela "Meu Portfólio"
2. **Quando** eu clico no Switch de status para ativar (Online)
3. **Então** o sistema exibe um carregamento e o status é salvo na base de dados
4. **E** a interface passa a exibir "Online agora" com uma cor indicativa (verde)
5. **E** ao recarregar o aplicativo, meu status continua salvo como "Online".

## Cenário 3: Visualização por Clientes (Usuários Comuns)
1. **Dado** que estou logado como "Cliente"
2. **Quando** eu visito o perfil de um Profissional que está "Online"
3. **Então** visualizo uma Badge verde dizendo "Online agora"
4. **Mas** não visualizo o Switch para alternar o status.

## Evidências
- **Testes Unitários Backend**: Todos os testes da camada de `users.service.ts` foram atualizados e passam com sucesso (incluindo tratamento de perfil inexistente).
- A interface mobile reage de forma otimista e exibe os estados corretamente.
