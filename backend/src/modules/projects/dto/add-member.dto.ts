import { IsString, IsUUID, IsIn } from 'class-validator';

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsIn(['admin', 'member', 'viewer'])
  role: string;
}
