import { IsString, IsNumber, IsOptional, IsBoolean, Matches } from 'class-validator';

export class CreateStatusWorkflowDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Slug must be lowercase letters, numbers, and underscores',
  })
  slug: string;

  @IsNumber()
  order: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
