import { IsOptional, IsString } from 'class-validator';

export class UpdateWorkerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  role?: string;
}
