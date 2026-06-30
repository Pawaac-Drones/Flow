import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EpicsController } from './epics.controller';
import { EpicsService } from './epics.service';
import { Epic } from '../../entities/epic.entity';
import { ProjectMember } from '../../entities/project-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Epic, ProjectMember])],
  controllers: [EpicsController],
  providers: [EpicsService],
  exports: [EpicsService],
})
export class EpicsModule {}
