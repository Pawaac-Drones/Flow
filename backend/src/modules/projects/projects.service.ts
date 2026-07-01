import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { StatusWorkflow } from '../../entities/status-workflow.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateStatusWorkflowDto } from './dto/create-status-workflow.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(StatusWorkflow)
    private readonly workflowRepository: Repository<StatusWorkflow>,
  ) {}

  async create(dto: CreateProjectDto, userId: string) {
    const existing = await this.projectRepository.findOne({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException('Project key already exists');
    }

    const project = this.projectRepository.create({
      name: dto.name,
      key: dto.key,
      description: dto.description,
      ownerId: userId,
      taskCounter: 0,
    });

    const savedProject = await this.projectRepository.save(project);

    // Add creator as admin member
    const member = this.memberRepository.create({
      projectId: savedProject.id,
      userId,
      role: 'admin',
    });
    await this.memberRepository.save(member);

    // Create default status workflows
    const defaultStatuses = [
      {
        name: 'Backlog',
        slug: 'backlog',
        order: 0,
        color: '#6b7280',
        isDefault: true,
      },
      {
        name: 'To Do',
        slug: 'todo',
        order: 1,
        color: '#3b82f6',
        isDefault: false,
      },
      {
        name: 'In Progress',
        slug: 'in_progress',
        order: 2,
        color: '#f59e0b',
        isDefault: false,
      },
      {
        name: 'In Review',
        slug: 'in_review',
        order: 3,
        color: '#8b5cf6',
        isDefault: false,
      },
      {
        name: 'Done',
        slug: 'done',
        order: 4,
        color: '#10b981',
        isDefault: false,
      },
    ];

    for (const status of defaultStatuses) {
      const workflow = this.workflowRepository.create({
        projectId: savedProject.id,
        ...status,
      });
      await this.workflowRepository.save(workflow);
    }

    return savedProject;
  }

  async findAll(userId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = this.projectRepository
      .createQueryBuilder('project')
      .innerJoin('project.members', 'member', 'member.userId = :userId', {
        userId,
      })
      .leftJoinAndSelect('project.owner', 'owner')
      .select([
        'project.id',
        'project.name',
        'project.key',
        'project.description',
        'project.taskCounter',
        'project.createdAt',
        'owner.id',
        'owner.displayName',
        'owner.email',
      ])
      .skip(skip)
      .take(limit)
      .orderBy('project.createdAt', 'DESC');

    const [projects, total] = await query.getManyAndCount();

    return {
      data: projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['owner', 'members', 'statusWorkflows'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    const project = await this.findById(id, userId);
    await this.assertAdminRole(id, userId);

    Object.assign(project, dto);
    return this.projectRepository.save(project);
  }

  async remove(id: string, userId: string) {
    await this.findById(id, userId);
    await this.assertAdminRole(id, userId);
    await this.projectRepository.delete(id);
    return { message: 'Project deleted successfully' };
  }

  async addMember(projectId: string, dto: AddMemberDto, requesterId: string) {
    await this.findById(projectId, requesterId);
    await this.assertAdminRole(projectId, requesterId);

    const existing = await this.memberRepository.findOne({
      where: { projectId, userId: dto.userId },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    const member = this.memberRepository.create({
      projectId,
      userId: dto.userId,
      role: dto.role,
    });

    return this.memberRepository.save(member);
  }

  async removeMember(projectId: string, userId: string, requesterId: string) {
    await this.findById(projectId, requesterId);
    await this.assertAdminRole(projectId, requesterId);

    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    await this.memberRepository.remove(member);
    return { message: 'Member removed successfully' };
  }

  async getMembers(projectId: string) {
    return this.memberRepository.find({
      where: { projectId },
      relations: ['user'],
    });
  }

  async createStatusWorkflow(
    projectId: string,
    dto: CreateStatusWorkflowDto,
    userId: string,
  ) {
    await this.findById(projectId, userId);
    await this.assertAdminRole(projectId, userId);

    const workflow = this.workflowRepository.create({
      projectId,
      ...dto,
    });

    return this.workflowRepository.save(workflow);
  }

  async getStatusWorkflows(projectId: string) {
    return this.workflowRepository.find({
      where: { projectId },
      order: { order: 'ASC' },
    });
  }

  async deleteStatusWorkflow(
    projectId: string,
    workflowId: string,
    userId: string,
  ) {
    await this.findById(projectId, userId);
    await this.assertAdminRole(projectId, userId);

    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, projectId },
    });

    if (!workflow) {
      throw new NotFoundException('Status workflow not found');
    }

    await this.workflowRepository.remove(workflow);
    return { message: 'Status workflow deleted successfully' };
  }

  async incrementTaskCounter(projectId: string): Promise<number> {
    await this.projectRepository.increment({ id: projectId }, 'taskCounter', 1);
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    return project!.taskCounter;
  }

  private async assertAdminRole(projectId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });

    if (!member || member.role !== 'admin') {
      throw new ForbiddenException(
        'Only project admins can perform this action',
      );
    }
  }
}
