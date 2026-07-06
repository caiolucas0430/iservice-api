/**
 * Mensagens do Sistema referentes à User Story US02 - Manter Perfil.
 * Centralizadas para reutilização entre serviço, controller e testes.
 */
export const ProfileMessages = {
  /** MSG01 - Sucesso na atualização de biografia/telefone. */
  UPDATE_SUCCESS: 'Perfil atualizado com sucesso.',
  /** MSG02 - Sucesso na alteração do tipo de conta (role). */
  ROLE_SWITCH_SUCCESS: 'Tipo de conta alterado com sucesso.',
  /** MSG03 - Tentativa de acesso sem autenticação. */
  UNAUTHENTICATED: 'Usuário não autenticado.',
  /** MSG04 - Telefone em formato inválido. */
  INVALID_PHONE: 'Telefone inválido.',
} as const;
