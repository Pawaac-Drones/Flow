import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../../entities/activity-log.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

interface LogActivityParams {
  projectId: string;
  taskId?: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async logActivity(params: LogActivityParams) {
    const log = this.activityLogRepository.create({
      projectId: params.projectId,
      taskId: params.taskId || null,
      userId: params.userId,
      action: params.action,
      field: params.field || null,
      oldValue: params.oldValue || null,
      newValue: params.newValue || null,
      metadata: params.metadata || null,
    });

    return this.activityLogRepository.save(log);
  }

  async getByTask(taskId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 50 } = paginationDto;
    const skip = (page - 1) * limit;

    const [logs, total] = await this.activityLogRepository.findAndCount({
      where: { taskId },
      relations: ['user'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getByProject(projectId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 50 } = paginationDto;
    const skip = (page - 1) * limit;

    const [logs, total] = await this.activityLogRepository.findAndCount({
      where: { projectId },
      relations: ['user', 'task'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getByUser(userId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 50 } = paginationDto;
    const skip = (page - 1) * limit;

    const [logs, total] = await this.activityLogRepository.findAndCount({
      where: { userId },
      relations: ['task', 'project'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
