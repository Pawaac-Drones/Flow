import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from '../../entities/project.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { StatusWorkflow } from '../../entities/status-workflow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMember, StatusWorkflow])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
