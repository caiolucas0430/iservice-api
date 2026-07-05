import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}
