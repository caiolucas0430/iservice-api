import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ProfileMessages } from '../users.messages';

/**
 * Regex de telefone (RN05 - Validação de Telefone).
 * Aceita formatos brasileiros comuns, com ou sem DDI/DDD e máscara:
 *   (84) 99999-9999 | 84999999999 | +55 84 99999-9999 | 84 3211-1234
 */
export const PHONE_REGEX =
  /^(?:\+?55\s?)?(?:\(?\d{2}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}$/;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_REGEX, { message: ProfileMessages.INVALID_PHONE })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
