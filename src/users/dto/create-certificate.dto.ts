import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCertificateDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
