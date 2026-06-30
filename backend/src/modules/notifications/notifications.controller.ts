import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() paginationDto: PaginationDto,
    @Query('isRead') isRead?: string,
  ) {
    const readFilter = isRead !== undefined ? isRead === 'true' : undefined;
    return this.notificationsService.findAllForUser(user.id, paginationDto, readFilter);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
