import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('projects/:projectId/tasks/:taskId/activity')
  async getByTask(
    @Param('taskId') taskId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.activityService.getByTask(taskId, paginationDto);
  }

  @Get('projects/:projectId/activity')
  async getByProject(
    @Param('projectId') projectId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.activityService.getByProject(projectId, paginationDto);
  }

  @Get('users/me/activity')
  async getMyActivity(
    @CurrentUser() user: CurrentUserPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.activityService.getByUser(user.id, paginationDto);
  }
}
