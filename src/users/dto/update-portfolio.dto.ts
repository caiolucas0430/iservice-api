import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdatePortfolioDto {
  @IsOptional()
  @IsString()
  roleTitle?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsObject()
  highlights?: {
    yearsOfExperience?: number;
    averageResponseTime?: string;
    completedJobs?: number;
    [key: string]: any;
  };
}
