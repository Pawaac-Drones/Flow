import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenWaController } from './openwa.controller';
import { OpenWaService } from './openwa.service';
import { LlmService } from './llm/llm.service';
import { MessageHandlerService } from './handlers/message-handler.service';
import { DigestService } from './digest/digest.service';
import { DigestController } from './digest/digest.controller';
import { WhatsappUsersService } from './whatsapp-users/whatsapp-users.service';
import { WhatsappUsersController } from './whatsapp-users/whatsapp-users.controller';
import { WhatsappUser } from '../../entities/whatsapp-user.entity';
import { User } from '../../entities/user.entity';
import { Project } from '../../entities/project.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { Task } from '../../entities/task.entity';
import { TasksModule } from '../tasks/tasks.module';

@Module({})
export class OpenWaModule {
  static register(): DynamicModule {
    return {
      module: OpenWaModule,
      imports: [
        ConfigModule,
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([WhatsappUser, User, Project, ProjectMember, Task]),
        TasksModule,
      ],
      controllers: [OpenWaController, DigestController, WhatsappUsersController],
      providers: [OpenWaService, LlmService, MessageHandlerService, DigestService, WhatsappUsersService],
      exports: [OpenWaService],
    };
  }
}
