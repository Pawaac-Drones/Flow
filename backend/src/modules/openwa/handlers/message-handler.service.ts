import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappUser } from '../../../entities/whatsapp-user.entity';
import { User } from '../../../entities/user.entity';
import { Project } from '../../../entities/project.entity';
import { ProjectMember } from '../../../entities/project-member.entity';
import { OpenWaService } from '../openwa.service';
import { LlmService } from '../llm/llm.service';
import { TasksService } from '../../tasks/tasks.service';
import { TaskStatus } from '../../../common/enums';

@Injectable()
export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);

  constructor(
    @InjectRepository(WhatsappUser)
    private readonly whatsappUserRepository: Repository<WhatsappUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    private readonly openWaService: OpenWaService,
    private readonly llmService: LlmService,
    private readonly tasksService: TasksService,
  ) {}

  async handleIncomingMessage(
    phoneNumber: string,
    messageBody: string,
  ): Promise<void> {
    this.logger.log(`Processing message from ${phoneNumber}: "${messageBody}"`);

    // Lookup user by phone number
    const whatsappUser = await this.whatsappUserRepository.findOne({
      where: { phoneNumber },
      relations: ['user'],
    });

    if (!whatsappUser) {
      this.logger.warn(`Unregistered phone number: ${phoneNumber}`);
      await this.openWaService.sendMessage(
        phoneNumber,
        'Sorry, your phone number is not registered with PawaacFlow. Please link your WhatsApp number in your account settings to use this feature.',
      );
      return;
    }

    if (!whatsappUser.isVerified) {
      // The user links a number in the web app and receives a verification
      // code. Sending that code to the bot confirms ownership of the number.
      const candidate = messageBody.trim().replace(/[^0-9]/g, '');
      if (
        whatsappUser.verificationCode &&
        candidate.length > 0 &&
        candidate === whatsappUser.verificationCode
      ) {
        whatsappUser.isVerified = true;
        whatsappUser.verificationCode = null;
        await this.whatsappUserRepository.save(whatsappUser);
        this.logger.log(`Verified WhatsApp number ${phoneNumber}`);
        await this.openWaService.sendMessage(
          phoneNumber,
          'Your WhatsApp number has been verified! You can now manage your tasks from here. Try "show my pending tasks".',
        );
        return;
      }

      await this.openWaService.sendMessage(
        phoneNumber,
        'Your WhatsApp number is registered but not yet verified. Please send the verification code shown in your PawaacFlow WhatsApp settings to confirm this number.',
      );
      return;
    }

    const user = whatsappUser.user;
    const userName = user.displayName || user.email;

    // Process message through LLM
    const llmResult = await this.llmService.processMessage(
      messageBody,
      userName,
    );

    if (llmResult.toolCalls.length > 0) {
      // Execute tool calls
      const toolResults: Array<{ id: string; result: string }> = [];

      for (const toolCall of llmResult.toolCalls) {
        const result = await this.executeToolCall(
          toolCall.name,
          toolCall.arguments,
          user,
        );
        toolResults.push({ id: toolCall.id, result });
      }

      // Get final response from LLM with tool results
      const assistantMessage = llmResult.rawToolCalls
        ? { tool_calls: llmResult.rawToolCalls }
        : undefined;
      const finalResult = await this.llmService.processWithToolResults(
        messageBody,
        userName,
        toolResults,
        assistantMessage,
      );

      const responseText =
        finalResult.textResponse || this.formatToolResults(toolResults);
      await this.openWaService.sendMessage(phoneNumber, responseText);
    } else if (llmResult.textResponse) {
      // Direct text response (no tool calls needed)
      await this.openWaService.sendMessage(phoneNumber, llmResult.textResponse);
    } else {
      await this.openWaService.sendMessage(
        phoneNumber,
        'I understood your message but could not determine what action to take. Try something like "Create a task called Fix login bug" or "Show my pending tasks".',
      );
    }
  }

  private async executeToolCall(
    toolName: string,
    args: Record<string, unknown>,
    user: User,
  ): Promise<string> {
    try {
      switch (toolName) {
        case 'create_task':
          return await this.handleCreateTask(args, user);
        case 'update_task_status':
          return await this.handleUpdateTaskStatus(args, user);
        case 'assign_task':
          return await this.handleAssignTask(args, user);
        case 'query_tasks':
          return await this.handleQueryTasks(args, user);
        case 'get_my_pending_tasks':
          return await this.handleGetMyPendingTasks(args, user);
        default:
          return JSON.stringify({ error: `Unknown tool: ${toolName}` });
      }
    } catch (error) {
      this.logger.error(`Error executing tool ${toolName}:`, error);
      return JSON.stringify({
        error: `Failed to execute ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  private async handleCreateTask(
    args: Record<string, unknown>,
    user: User,
  ): Promise<string> {
    const title = args.title as string;
    const projectKey = args.projectKey as string | undefined;
    const priority = (args.priority as string) || 'medium';
    const description = args.description as string | undefined;
    const dueDate = args.dueDate as string | undefined;
    const assigneeEmail = args.assigneeEmail as string | undefined;

    // Find the project
    let project: Project | null = null;
    if (projectKey) {
      project = await this.projectRepository.findOne({
        where: { key: projectKey },
      });
    } else {
      // Get user's first project as default (only projects where user is a member)
      const membership = await this.memberRepository.findOne({
        where: { userId: user.id },
        relations: ['project'],
        order: { joinedAt: 'DESC' },
      });
      project = membership?.project || null;
    }

    if (!project) {
      return JSON.stringify({
        error: 'No project found. Please specify a project key.',
      });
    }

    // Check project membership before proceeding
    const isMember = await this.memberRepository.findOne({
      where: { projectId: project.id, userId: user.id },
    });

    if (!isMember) {
      return JSON.stringify({ error: 'You are not a member of this project.' });
    }

    // Resolve assignee
    let assigneeId: string | undefined;
    if (assigneeEmail) {
      const assignee = await this.userRepository.findOne({
        where: { email: assigneeEmail },
      });
      if (assignee) {
        assigneeId = assignee.id;
      }
    }

    // Delegate task creation to TasksService (uses atomic counter increment,
    // activity logging, notifications, and real-time events)
    const savedTask = await this.tasksService.create(
      project.id,
      {
        title,
        description,
        priority,
        assigneeId,
        dueDate,
      },
      user.id,
    );

    return JSON.stringify({
      success: true,
      taskKey: savedTask.taskKey,
      taskId: savedTask.id,
      title: savedTask.title,
      project: project.key,
    });
  }

  private async handleUpdateTaskStatus(
    args: Record<string, unknown>,
    user: User,
  ): Promise<string> {
    const taskKey = args.taskKey as string;
    const status = args.status as string;

    // Find the task by key to get projectId
    const task = await this.tasksService.findByKey(taskKey);

    // Delegate to TasksService (enforces membership check, logs activity, emits events)
    const updatedTask = await this.tasksService.update(
      task.projectId,
      task.id,
      { status },
      user.id,
    );

    return JSON.stringify({
      success: true,
      taskKey,
      oldStatus: task.status,
      newStatus: updatedTask.status,
      title: updatedTask.title,
    });
  }

  private async handleAssignTask(
    args: Record<string, unknown>,
    user: User,
  ): Promise<string> {
    const taskKey = args.taskKey as string;
    const assigneeEmail = args.assigneeEmail as string;

    const assignee = await this.userRepository.findOne({
      where: { email: assigneeEmail },
    });
    if (!assignee) {
      return JSON.stringify({
        error: `User with email ${assigneeEmail} not found.`,
      });
    }

    // Find the task by key to get projectId
    const task = await this.tasksService.findByKey(taskKey);

    // Delegate to TasksService (enforces membership check, logs activity, emits events)
    await this.tasksService.update(
      task.projectId,
      task.id,
      { assigneeId: assignee.id },
      user.id,
    );

    return JSON.stringify({
      success: true,
      taskKey,
      assignedTo: assignee.displayName || assignee.email,
      title: task.title,
    });
  }

  private async handleQueryTasks(
    args: Record<string, unknown>,
    user: User,
  ): Promise<string> {
    const projectKey = args.projectKey as string | undefined;
    const status = args.status as string | undefined;
    const priority = args.priority as string | undefined;
    const assigneeEmail = args.assigneeEmail as string | undefined;
    const search = args.search as string | undefined;
    const limit = parseInt((args.limit as string) || '10', 10);

    if (!projectKey) {
      return JSON.stringify({
        error: 'Please specify a project key to query tasks.',
      });
    }

    const project = await this.projectRepository.findOne({
      where: { key: projectKey },
    });
    if (!project) {
      return JSON.stringify({ error: `Project ${projectKey} not found.` });
    }

    // Resolve assignee ID if email provided
    let assigneeId: string | undefined;
    if (assigneeEmail) {
      const assignee = await this.userRepository.findOne({
        where: { email: assigneeEmail },
      });
      if (assignee) {
        assigneeId = assignee.id;
      }
    }

    // Use TasksService.findAll which enforces membership check
    const result = await this.tasksService.findAll(project.id, user.id, {
      status,
      priority,
      assigneeId,
      search,
      limit,
    });

    return JSON.stringify({
      count: result.data.length,
      tasks: result.data.map((t) => ({
        key: t.taskKey,
        title: t.title,
        status: t.status,
        priority: t.priority,
      })),
    });
  }

  private async handleGetMyPendingTasks(
    args: Record<string, unknown>,
    user: User,
  ): Promise<string> {
    // Use TasksService method to get tasks assigned to user
    const tasks = await this.tasksService.getTasksByAssignee(user.id);

    // Filter out done tasks
    const pendingTasks = tasks.filter((t) => t.status !== TaskStatus.DONE);

    const projectKey = args.projectKey as string | undefined;
    let filteredTasks = pendingTasks;

    if (projectKey) {
      filteredTasks = pendingTasks.filter((t) => t.project?.key === projectKey);
    }

    return JSON.stringify({
      count: filteredTasks.length,
      tasks: filteredTasks.map((t) => ({
        key: t.taskKey,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      })),
    });
  }

  private formatToolResults(
    results: Array<{ id: string; result: string }>,
  ): string {
    const outputs: string[] = [];
    for (const result of results) {
      try {
        const parsed = JSON.parse(result.result);
        if (parsed.error) {
          outputs.push(`Error: ${parsed.error}`);
        } else if (parsed.success) {
          outputs.push(
            `Done! Task ${parsed.taskKey || ''}: ${parsed.title || 'completed'}`,
          );
        } else {
          outputs.push(JSON.stringify(parsed));
        }
      } catch {
        outputs.push(result.result);
      }
    }
    return outputs.join('\n');
  }
}
