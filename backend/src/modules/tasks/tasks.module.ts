import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksLookupController } from './tasks-lookup.controller';
import { TasksService } from './tasks.service';
import { Task } from '../../entities/task.entity';
import { Project } from '../../entities/project.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Project, ProjectMember]),
    forwardRef(() => ActivityModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => RealtimeModule),
  ],
  controllers: [TasksController, TasksLookupController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
