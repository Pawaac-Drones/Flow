import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsDateString,
  IsArray,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

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
  assigneeId?: string | null;

  @IsOptional()
  @IsUUID()
  epicId?: string | null;

  @IsOptional()
  @IsUUID()
  parentTaskId?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsNumber()
  order?: number;
}
