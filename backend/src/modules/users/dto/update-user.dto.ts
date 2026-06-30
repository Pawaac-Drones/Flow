import { IsEmail, IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
