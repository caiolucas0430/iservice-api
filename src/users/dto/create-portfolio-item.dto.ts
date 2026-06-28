import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePortfolioItemDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
