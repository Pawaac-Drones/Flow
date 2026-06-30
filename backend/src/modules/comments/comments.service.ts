import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../entities/comment.entity';
import { Task } from '../../entities/task.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(projectId: string, taskId: string, dto: CreateCommentDto, userId: string) {
    await this.assertProjectWriteAccess(projectId, userId);

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comment = this.commentRepository.create({
      taskId,
      authorId: userId,
      content: dto.content,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Log activity
    await this.activityService.logActivity({
      projectId,
      taskId,
      userId,
      action: 'commented',
      newValue: dto.content.substring(0, 100),
    });

    // Notify task assignee and reporter
    const notifyUserIds = new Set<string>();
    if (task.assigneeId && task.assigneeId !== userId) {
      notifyUserIds.add(task.assigneeId);
    }
    if (task.reporterId !== userId) {
      notifyUserIds.add(task.reporterId);
    }

    for (const notifyUserId of notifyUserIds) {
      await this.notificationsService.createNotification({
        userId: notifyUserId,
        type: 'task_commented',
        title: 'New Comment',
        message: `New comment on ${task.taskKey}: ${dto.content.substring(0, 80)}`,
        taskId,
        projectId,
      });
    }

    return savedComment;
  }

  async findAll(taskId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 50 } = paginationDto;
    const skip = (page - 1) * limit;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { taskId },
      relations: ['author'],
      skip,
      take: limit,
      order: { createdAt: 'ASC' },
    });

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(commentId: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.assertCommentWriteAccess(comment.taskId, userId);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = dto.content;
    return this.commentRepository.save(comment);
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.assertCommentWriteAccess(comment.taskId, userId);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
    return { message: 'Comment deleted successfully' };
  }

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
   * Resolve a comment's project (via its task) and enforce write access.
   */
  private async assertCommentWriteAccess(taskId: string, userId: string) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.assertProjectWriteAccess(task.projectId, userId);
  }
}
