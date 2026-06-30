import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { UpdateTaskDto } from './dto/update-task.dto';

/**
 * Convenience controller that allows task operations by task ID
 * without requiring projectId in the URL path.
 * Delegates to TasksService which still enforces membership checks.
 */
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksLookupController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(':taskId')
  async findById(
    @Param('taskId') taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.findByIdDirect(taskId, user.id);
  }

  @Patch(':taskId')
  async update(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const task = await this.tasksService.findByIdDirect(taskId, user.id);
    return this.tasksService.update(task.projectId, taskId, updateTaskDto, user.id);
  }

  @Delete(':taskId')
  async remove(
    @Param('taskId') taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const task = await this.tasksService.findByIdDirect(taskId, user.id);
    return this.tasksService.remove(task.projectId, taskId, user.id);
  }

  @Get(':taskId/subtasks')
  async getSubtasks(
    @Param('taskId') taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const task = await this.tasksService.findByIdDirect(taskId, user.id);
    return this.tasksService.getSubtasks(task.projectId, taskId, user.id);
  }
}
