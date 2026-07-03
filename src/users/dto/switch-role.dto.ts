import { IsEnum, IsNotEmpty } from 'class-validator';
import { RoleName } from '../../roles/enums/role.enum';

/**
 * Perfis de atuação que o usuário pode alternar por conta própria (RN02).
 * ADMIN é deliberadamente omitido: não é auto-atribuível.
 */
export const SWITCHABLE_ROLES: RoleName[] = [
  RoleName.USER,
  RoleName.PROFESSIONAL,
];

export class SwitchRoleDto {
  @IsNotEmpty({ message: 'O tipo de conta é obrigatório' })
  @IsEnum(RoleName, { message: 'Tipo de conta inválido' })
  role: RoleName;
}
