import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from '../../entities/comment.entity';
import { Task } from '../../entities/task.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Task, ProjectMember]),
    forwardRef(() => ActivityModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
