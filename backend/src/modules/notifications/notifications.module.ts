import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    RealtimeModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
