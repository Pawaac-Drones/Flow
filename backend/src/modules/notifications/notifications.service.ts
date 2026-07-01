import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { EmailService } from './email.service';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly emailService: EmailService,
  ) {}

  async createNotification(params: CreateNotificationParams) {
    const notification = this.notificationRepository.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      taskId: params.taskId || null,
      projectId: params.projectId || null,
      isRead: false,
    });

    const saved = await this.notificationRepository.save(notification);

    // Emit real-time notification
    this.realtimeGateway.emitToUser(params.userId, 'notification', saved);

    // Best-effort email delivery (no-op when SMTP is not configured)
    void this.sendEmailNotification(params);

    return saved;
  }

  private async sendEmailNotification(
    params: CreateNotificationParams,
  ): Promise<void> {
    if (!this.emailService.isEnabled) {
      return;
    }

    try {
      const user = await this.userRepository.findOne({
        where: { id: params.userId },
        select: ['id', 'email', 'displayName'],
      });

      if (!user?.email) {
        return;
      }

      await this.emailService.sendEmail({
        to: user.email,
        subject: `[PawaacFlow] ${params.title}`,
        text: `Hi ${user.displayName || ''},\n\n${params.message}\n\n--\nPawaacFlow`,
        html: `<p>Hi ${user.displayName || ''},</p><p>${params.message}</p><hr/><p style="color:#64748b;font-size:12px;">PawaacFlow</p>`,
      });
    } catch {
      // sendEmail already logs failures; never surface email errors to the caller
    }
  }

  async findAllForUser(
    userId: string,
    paginationDto: PaginationDto,
    isRead?: boolean,
  ) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where,
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount: await this.getUnreadCount(userId),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }
}
