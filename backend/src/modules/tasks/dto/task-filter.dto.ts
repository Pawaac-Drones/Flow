import { IsOptional, IsString, IsUUID, IsIn, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class TaskFilterDto {
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
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
