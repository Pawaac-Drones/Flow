import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
