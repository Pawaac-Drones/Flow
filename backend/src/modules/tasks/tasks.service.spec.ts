import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '../../entities/task.entity';
import { Project } from '../../entities/project.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { StatusWorkflow } from '../../entities/status-workflow.entity';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

describe('TasksService', () => {
  let service: TasksService;

  const taskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const projectRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const memberRepository = {
    findOne: jest.fn(),
  };
  const workflowRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const activityService = { logActivity: jest.fn() };
  const notificationsService = { createNotification: jest.fn() };
  const realtimeGateway = { emitToProject: jest.fn() };

  const PROJECT_ID = 'project-1';
  const USER_ID = 'user-1';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: taskRepository },
        { provide: getRepositoryToken(Project), useValue: projectRepository },
        { provide: getRepositoryToken(ProjectMember), useValue: memberRepository },
        { provide: getRepositoryToken(StatusWorkflow), useValue: workflowRepository },
        { provide: ActivityService, useValue: activityService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: RealtimeGateway, useValue: realtimeGateway },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  const mockCounterQueryBuilder = (counter: number) => {
    const qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ raw: [{ task_counter: counter }] }),
    };
    projectRepository.createQueryBuilder.mockReturnValue(qb);
  };

  describe('create', () => {
    it('generates a task key and accepts a status that exists in the workflow', async () => {
      memberRepository.findOne.mockResolvedValue({ role: 'member' });
      workflowRepository.findOne.mockResolvedValue({ slug: 'todo' });
      projectRepository.findOne.mockResolvedValue({ id: PROJECT_ID, key: 'PROJ' });
      mockCounterQueryBuilder(1);
      taskRepository.create.mockImplementation((data) => data);
      taskRepository.save.mockImplementation(async (data) => ({ id: 'task-1', ...data }));

      const result = await service.create(
        PROJECT_ID,
        { title: 'Fix bug', status: 'todo' },
        USER_ID,
      );

      expect(result.taskKey).toBe('PROJ-1');
      expect(result.status).toBe('todo');
      expect(workflowRepository.findOne).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID, slug: 'todo' },
      });
      expect(realtimeGateway.emitToProject).toHaveBeenCalledWith(
        PROJECT_ID,
        'task-created',
        expect.any(Object),
      );
    });

    it('falls back to the project default status when none is supplied', async () => {
      memberRepository.findOne.mockResolvedValue({ role: 'admin' });
      workflowRepository.find.mockResolvedValue([
        { slug: 'backlog', isDefault: true, order: 0 },
        { slug: 'todo', isDefault: false, order: 1 },
      ]);
      projectRepository.findOne.mockResolvedValue({ id: PROJECT_ID, key: 'PROJ' });
      mockCounterQueryBuilder(2);
      taskRepository.create.mockImplementation((data) => data);
      taskRepository.save.mockImplementation(async (data) => ({ id: 'task-2', ...data }));

      const result = await service.create(PROJECT_ID, { title: 'No status' }, USER_ID);

      expect(result.status).toBe('backlog');
      expect(result.taskKey).toBe('PROJ-2');
    });

    it('rejects an invalid status that is not part of the project workflow', async () => {
      memberRepository.findOne.mockResolvedValue({ role: 'member' });
      workflowRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(PROJECT_ID, { title: 'Bad', status: 'nonexistent' }, USER_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(taskRepository.save).not.toHaveBeenCalled();
    });

    it('rejects a viewer attempting to create a task (read-only)', async () => {
      memberRepository.findOne.mockResolvedValue({ role: 'viewer' });

      await expect(
        service.create(PROJECT_ID, { title: 'Blocked', status: 'todo' }, USER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(taskRepository.save).not.toHaveBeenCalled();
    });

    it('rejects a non-member attempting to create a task', async () => {
      memberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(PROJECT_ID, { title: 'Blocked', status: 'todo' }, USER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('update', () => {
    it('rejects a viewer attempting to update a task', async () => {
      memberRepository.findOne.mockResolvedValue({ role: 'viewer' });

      await expect(
        service.update(PROJECT_ID, 'task-1', { title: 'New' }, USER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
