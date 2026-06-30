import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsDateString,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['backlog', 'todo', 'in_progress', 'in_review', 'done'])
  status?: string;

  @IsOptional()
  @IsIn(['lowest', 'low', 'medium', 'high', 'highest'])
  priority?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  epicId?: string;

  @IsOptional()
  @IsUUID()
  parentTaskId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}
