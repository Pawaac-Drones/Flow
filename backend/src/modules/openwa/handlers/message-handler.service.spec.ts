import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageHandlerService } from './message-handler.service';
import { WhatsappUser } from '../../../entities/whatsapp-user.entity';
import { User } from '../../../entities/user.entity';
import { Project } from '../../../entities/project.entity';
import { ProjectMember } from '../../../entities/project-member.entity';
import { OpenWaService } from '../openwa.service';
import { LlmService } from '../llm/llm.service';
import { TasksService } from '../../tasks/tasks.service';

describe('MessageHandlerService', () => {
  let service: MessageHandlerService;

  const whatsappUserRepository = { findOne: jest.fn(), save: jest.fn() };
  const userRepository = { findOne: jest.fn() };
  const projectRepository = { findOne: jest.fn() };
  const memberRepository = { findOne: jest.fn() };
  const openWaService = { sendMessage: jest.fn() };
  const llmService = {
    processMessage: jest.fn(),
    processWithToolResults: jest.fn(),
  };
  const tasksService = {
    create: jest.fn(),
    update: jest.fn(),
    findByKey: jest.fn(),
    findAll: jest.fn(),
    getTasksByAssignee: jest.fn(),
  };

  const PHONE = '+15551234567';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageHandlerService,
        {
          provide: getRepositoryToken(WhatsappUser),
          useValue: whatsappUserRepository,
        },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Project), useValue: projectRepository },
        {
          provide: getRepositoryToken(ProjectMember),
          useValue: memberRepository,
        },
        { provide: OpenWaService, useValue: openWaService },
        { provide: LlmService, useValue: llmService },
        { provide: TasksService, useValue: tasksService },
      ],
    }).compile();

    service = module.get<MessageHandlerService>(MessageHandlerService);
  });

  describe('unregistered numbers', () => {
    it('replies with a registration prompt and does not invoke the LLM', async () => {
      whatsappUserRepository.findOne.mockResolvedValue(null);

      await service.handleIncomingMessage(PHONE, 'show my tasks');

      expect(openWaService.sendMessage).toHaveBeenCalledTimes(1);
      const [, message] = openWaService.sendMessage.mock.calls[0];
      expect(message).toContain('not registered');
      expect(llmService.processMessage).not.toHaveBeenCalled();
      expect(tasksService.create).not.toHaveBeenCalled();
    });
  });

  describe('tool-call mapping', () => {
    const verifiedUser = {
      isVerified: true,
      user: { id: 'user-1', displayName: 'Bob', email: 'bob@example.com' },
    };

    it('maps a create_task tool call to TasksService.create', async () => {
      whatsappUserRepository.findOne.mockResolvedValue(verifiedUser);
      llmService.processMessage.mockResolvedValue({
        toolCalls: [
          {
            id: 'call-1',
            name: 'create_task',
            arguments: { title: 'Fix login bug', projectKey: 'PROJ' },
          },
        ],
        textResponse: null,
        rawToolCalls: [
          {
            id: 'call-1',
            type: 'function',
            function: { name: 'create_task', arguments: '{}' },
          },
        ],
      });
      projectRepository.findOne.mockResolvedValue({
        id: 'project-1',
        key: 'PROJ',
      });
      memberRepository.findOne.mockResolvedValue({
        id: 'm1',
        userId: 'user-1',
      });
      tasksService.create.mockResolvedValue({
        id: 'task-1',
        taskKey: 'PROJ-1',
        title: 'Fix login bug',
      });
      llmService.processWithToolResults.mockResolvedValue({
        toolCalls: [],
        textResponse: 'Created PROJ-1: Fix login bug',
      });

      await service.handleIncomingMessage(
        PHONE,
        'create a task to fix login bug in PROJ',
      );

      expect(tasksService.create).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ title: 'Fix login bug' }),
        'user-1',
      );
      expect(openWaService.sendMessage).toHaveBeenCalledWith(
        PHONE,
        'Created PROJ-1: Fix login bug',
      );
    });

    it('maps an update_task_status tool call to TasksService.update', async () => {
      whatsappUserRepository.findOne.mockResolvedValue(verifiedUser);
      llmService.processMessage.mockResolvedValue({
        toolCalls: [
          {
            id: 'call-2',
            name: 'update_task_status',
            arguments: { taskKey: 'PROJ-1', status: 'done' },
          },
        ],
        textResponse: null,
        rawToolCalls: [
          {
            id: 'call-2',
            type: 'function',
            function: { name: 'update_task_status', arguments: '{}' },
          },
        ],
      });
      tasksService.findByKey.mockResolvedValue({
        id: 'task-1',
        projectId: 'project-1',
        status: 'todo',
      });
      tasksService.update.mockResolvedValue({
        id: 'task-1',
        status: 'done',
        title: 'Fix login bug',
      });
      llmService.processWithToolResults.mockResolvedValue({
        toolCalls: [],
        textResponse: 'PROJ-1 is now done',
      });

      await service.handleIncomingMessage(PHONE, 'mark PROJ-1 as done');

      expect(tasksService.update).toHaveBeenCalledWith(
        'project-1',
        'task-1',
        { status: 'done' },
        'user-1',
      );
    });
  });
});
