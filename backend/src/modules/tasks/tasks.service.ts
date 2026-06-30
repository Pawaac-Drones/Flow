import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Task } from '../../entities/task.entity';
import { Project } from '../../entities/project.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { StatusWorkflow } from '../../entities/status-workflow.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(StatusWorkflow)
    private readonly workflowRepository: Repository<StatusWorkflow>,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(projectId: string, dto: CreateTaskDto, userId: string) {
    await this.assertProjectWriteAccess(projectId, userId);

    // Resolve and validate the status against the project's configurable
    // status workflows. If no status is supplied, fall back to the project's
    // default status.
    const status = dto.status
      ? await this.assertValidStatus(projectId, dto.status)
      : await this.getDefaultStatus(projectId);

    // Generate task key using atomic increment with RETURNING to prevent race conditions
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const result = await this.projectRepository
      .createQueryBuilder()
      .update(Project)
      .set({ taskCounter: () => '"task_counter" + 1' })
      .where('id = :id', { id: projectId })
      .returning('"task_counter"')
      .execute();

    const newCounter = result.raw[0].task_counter;
    const taskKey = `${project.key}-${newCounter}`;

    const task = this.taskRepository.create({
      projectId,
      epicId: dto.epicId || null,
      parentTaskId: dto.parentTaskId || null,
      taskKey,
      title: dto.title,
      description: dto.description || null,
      status,
      priority: dto.priority || 'medium',
      assigneeId: dto.assigneeId || null,
      reporterId: userId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      labels: dto.labels || [],
      order: 0,
    });

    const savedTask = await this.taskRepository.save(task);

    // Log activity
    await this.activityService.logActivity({
      projectId,
      taskId: savedTask.id,
      userId,
      action: 'created',
      newValue: savedTask.title,
    });

    // Notify assignee
    if (savedTask.assigneeId && savedTask.assigneeId !== userId) {
      await this.notificationsService.createNotification({
        userId: savedTask.assigneeId,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `You have been assigned to ${savedTask.taskKey}: ${savedTask.title}`,
        taskId: savedTask.id,
        projectId,
      });
    }

    // Emit real-time event
    this.realtimeGateway.emitToProject(projectId, 'task-created', savedTask);

    return savedTask;
  }

  async findAll(projectId: string, userId: string, filterDto: TaskFilterDto) {
    await this.assertProjectMember(projectId, userId);

    const { page = 1, limit = 50, status, priority, assigneeId, epicId, search, labels } = filterDto;
    const skip = (page - 1) * limit;

    let query: SelectQueryBuilder<Task> = this.taskRepository
      .createQueryBuilder('task')
      .where('task.project_id = :projectId', { projectId })
      .andWhere('task.parent_task_id IS NULL');

    if (status) {
      query = query.andWhere('task.status = :status', { status });
    }

    if (priority) {
      query = query.andWhere('task.priority = :priority', { priority });
    }

    if (assigneeId) {
      query = query.andWhere('task.assignee_id = :assigneeId', { assigneeId });
    }

    if (epicId) {
      query = query.andWhere('task.epic_id = :epicId', { epicId });
    }

    if (search) {
      query = query.andWhere(
        '(task.title ILIKE :search OR task.task_key ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (labels && labels.length > 0) {
      query = query.andWhere('task.labels && :labels', { labels });
    }

    query = query
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.reporter', 'reporter')
      .orderBy('task.order', 'ASC')
      .addOrderBy('task.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [tasks, total] = await query.getManyAndCount();

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(projectId: string, taskId: string, userId: string) {
    await this.assertProjectMember(projectId, userId);

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId },
      relations: ['assignee', 'reporter', 'epic', 'subtasks', 'comments'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async findByKey(taskKey: string) {
    const task = await this.taskRepository.findOne({
      where: { taskKey },
      relations: ['assignee', 'reporter', 'project'],
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskKey} not found`);
    }

    return task;
  }

  async findByIdDirect(taskId: string, userId: string) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignee', 'reporter', 'epic', 'subtasks', 'comments', 'project'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.assertProjectMember(task.projectId, userId);

    return task;
  }

  async update(projectId: string, taskId: string, dto: UpdateTaskDto, userId: string) {
    await this.assertProjectWriteAccess(projectId, userId);
    const task = await this.findById(projectId, taskId, userId);
    const oldStatus = task.status;
    const oldAssigneeId = task.assigneeId;

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) {
      await this.assertValidStatus(projectId, dto.status);
      task.status = dto.status;
    }
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.assigneeId !== undefined) task.assigneeId = dto.assigneeId;
    if (dto.epicId !== undefined) task.epicId = dto.epicId;
    if (dto.parentTaskId !== undefined) task.parentTaskId = dto.parentTaskId;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.labels !== undefined) task.labels = dto.labels;
    if (dto.order !== undefined) task.order = dto.order;

    const updatedTask = await this.taskRepository.save(task);

    // Log status change
    if (dto.status !== undefined && dto.status !== oldStatus) {
      await this.activityService.logActivity({
        projectId,
        taskId,
        userId,
        action: 'status_changed',
        field: 'status',
        oldValue: oldStatus,
        newValue: dto.status,
      });
    }

    // Log assignment change
    if (dto.assigneeId !== undefined && dto.assigneeId !== oldAssigneeId) {
      await this.activityService.logActivity({
        projectId,
        taskId,
        userId,
        action: 'assigned',
        field: 'assignee',
        oldValue: oldAssigneeId || undefined,
        newValue: dto.assigneeId || undefined,
      });

      // Notify new assignee
      if (dto.assigneeId && dto.assigneeId !== userId) {
        await this.notificationsService.createNotification({
          userId: dto.assigneeId,
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `You have been assigned to ${task.taskKey}: ${task.title}`,
          taskId,
          projectId,
        });
      }
    }

    // Emit real-time event
    this.realtimeGateway.emitToProject(projectId, 'task-updated', updatedTask);

    return updatedTask;
  }

  async remove(projectId: string, taskId: string, userId: string) {
    await this.assertProjectWriteAccess(projectId, userId);
    await this.findById(projectId, taskId, userId);

    await this.activityService.logActivity({
      projectId,
      taskId,
      userId,
      action: 'deleted',
    });

    await this.taskRepository.delete(taskId);

    this.realtimeGateway.emitToProject(projectId, 'task-deleted', { taskId });

    return { message: 'Task deleted successfully' };
  }

  async getSubtasks(projectId: string, taskId: string, userId: string) {
    await this.assertProjectMember(projectId, userId);

    return this.taskRepository.find({
      where: { parentTaskId: taskId, projectId },
      relations: ['assignee'],
      order: { order: 'ASC' },
    });
  }

  async getTasksByAssignee(userId: string) {
    return this.taskRepository.find({
      where: { assigneeId: userId },
      relations: ['project'],
      order: { updatedAt: 'DESC' },
    });
  }

  private async assertProjectMember(projectId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }
  }

  /**
   * Ensure the user can perform write (mutating) operations on the project.
   * Members and admins may write; viewers have read-only access.
   */
  private async assertProjectWriteAccess(projectId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (member.role === 'viewer') {
      throw new ForbiddenException(
        'Viewers have read-only access to this project',
      );
    }
  }

  /**
   * Ensure the given status slug exists in the project's configurable status
   * workflows. Returns the slug when valid, throws BadRequestException when not.
   */
  private async assertValidStatus(
    projectId: string,
    status: string,
  ): Promise<string> {
    const workflow = await this.workflowRepository.findOne({
      where: { projectId, slug: status },
    });

    if (!workflow) {
      throw new BadRequestException(
        `Invalid status "${status}" for this project`,
      );
    }

    return status;
  }

  /**
   * Resolve the default status slug for a project: the workflow flagged as
   * default, otherwise the first by order. Falls back to 'backlog' when a
   * project has no configured workflows.
   */
  private async getDefaultStatus(projectId: string): Promise<string> {
    const workflows = await this.workflowRepository.find({
      where: { projectId },
      order: { order: 'ASC' },
    });

    if (workflows.length === 0) {
      return 'backlog';
    }

    const defaultWorkflow =
      workflows.find((workflow) => workflow.isDefault) || workflows[0];
    return defaultWorkflow.slug;
  }
}
