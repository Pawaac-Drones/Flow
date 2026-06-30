import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.create(projectId, createTaskDto, user.id);
  }

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() filterDto: TaskFilterDto,
  ) {
    return this.tasksService.findAll(projectId, user.id, filterDto);
  }

  @Get(':taskId')
  async findById(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.findById(projectId, taskId, user.id);
  }

  @Patch(':taskId')
  async update(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.update(projectId, taskId, updateTaskDto, user.id);
  }

  @Delete(':taskId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.remove(projectId, taskId, user.id);
  }

  @Get(':taskId/subtasks')
  async getSubtasks(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.getSubtasks(projectId, taskId, user.id);
  }
}
