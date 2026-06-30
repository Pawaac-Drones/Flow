import { IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z][A-Z0-9]*$/, {
    message: 'Key must be uppercase letters and numbers, starting with a letter',
  })
  key: string;

  @IsOptional()
  @IsString()
  description?: string;
}
