import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { WhatsappUser } from '../../../entities/whatsapp-user.entity';
import { Task } from '../../../entities/task.entity';
import { User } from '../../../entities/user.entity';
import { OpenWaService } from '../openwa.service';
import { TaskStatus, Priority } from '../../../../../shared/src/types/enums';

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    @InjectRepository(WhatsappUser)
    private readonly whatsappUserRepository: Repository<WhatsappUser>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly openWaService: OpenWaService,
  ) {}

  @Cron('0 8 * * *', { name: 'daily-digest', timeZone: 'UTC' })
  async sendDailyDigest(): Promise<void> {
    this.logger.log('Starting daily digest distribution');

    const optedInUsers = await this.whatsappUserRepository.find({
      where: { dailyDigestEnabled: true, isVerified: true },
      relations: ['user'],
    });

    this.logger.log(
      `Found ${optedInUsers.length} users opted in for daily digest`,
    );

    for (const waUser of optedInUsers) {
      try {
        const digest = await this.buildDigestForUser(waUser.user);
        if (digest) {
          await this.openWaService.sendMessage(waUser.phoneNumber, digest);
          this.logger.debug(`Digest sent to ${waUser.phoneNumber}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to send digest to ${waUser.phoneNumber}:`,
          error,
        );
      }
    }

    this.logger.log('Daily digest distribution complete');
  }

  async optIn(userId: string): Promise<void> {
    const waUser = await this.whatsappUserRepository.findOne({
      where: { userId },
    });

    if (!waUser) {
      throw new Error(
        'No WhatsApp number linked to your account. Please link your number first.',
      );
    }

    waUser.dailyDigestEnabled = true;
    await this.whatsappUserRepository.save(waUser);
  }

  async optOut(userId: string): Promise<void> {
    const waUser = await this.whatsappUserRepository.findOne({
      where: { userId },
    });

    if (!waUser) {
      throw new Error('No WhatsApp number linked to your account.');
    }

    waUser.dailyDigestEnabled = false;
    await this.whatsappUserRepository.save(waUser);
  }

  private async buildDigestForUser(user: User): Promise<string | null> {
    const pendingTasks = await this.taskRepository.find({
      where: {
        assigneeId: user.id,
        status: Not(TaskStatus.DONE),
      },
      order: {
        priority: 'DESC',
        dueDate: 'ASC',
      },
      take: 20,
    });

    if (pendingTasks.length === 0) {
      return null;
    }

    const overdueTasks = pendingTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date(),
    );
    const highPriorityTasks = pendingTasks.filter(
      (t) => t.priority === Priority.HIGH || t.priority === Priority.HIGHEST,
    );
    const inProgressTasks = pendingTasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    );

    let message = `Good morning, ${user.displayName}! Here is your daily digest:\n\n`;
    message += `You have *${pendingTasks.length}* pending tasks.\n`;

    if (overdueTasks.length > 0) {
      message += `\n*Overdue (${overdueTasks.length}):*\n`;
      for (const task of overdueTasks.slice(0, 5)) {
        message += `- ${task.taskKey}: ${task.title}\n`;
      }
    }

    if (highPriorityTasks.length > 0) {
      message += `\n*High Priority (${highPriorityTasks.length}):*\n`;
      for (const task of highPriorityTasks.slice(0, 5)) {
        message += `- ${task.taskKey}: ${task.title} [${task.status}]\n`;
      }
    }

    if (inProgressTasks.length > 0) {
      message += `\n*In Progress (${inProgressTasks.length}):*\n`;
      for (const task of inProgressTasks.slice(0, 5)) {
        message += `- ${task.taskKey}: ${task.title}\n`;
      }
    }

    message += `\nReply with any task command to manage your tasks!`;

    return message;
  }
}
