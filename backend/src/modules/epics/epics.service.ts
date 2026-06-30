import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epic } from '../../entities/epic.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { CreateEpicDto } from './dto/create-epic.dto';
import { UpdateEpicDto } from './dto/update-epic.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class EpicsService {
  constructor(
    @InjectRepository(Epic)
    private readonly epicRepository: Repository<Epic>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
  ) {}

  async create(projectId: string, dto: CreateEpicDto, userId: string) {
    await this.assertProjectMember(projectId, userId);

    const epic = this.epicRepository.create({
      projectId,
      name: dto.name,
      description: dto.description,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    });

    return this.epicRepository.save(epic);
  }

  async findAll(projectId: string, userId: string, paginationDto: PaginationDto) {
    await this.assertProjectMember(projectId, userId);

    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [epics, total] = await this.epicRepository.findAndCount({
      where: { projectId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: epics,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(projectId: string, epicId: string, userId: string) {
    await this.assertProjectMember(projectId, userId);

    const epic = await this.epicRepository.findOne({
      where: { id: epicId, projectId },
      relations: ['tasks'],
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    return epic;
  }

  async update(projectId: string, epicId: string, dto: UpdateEpicDto, userId: string) {
    const epic = await this.findById(projectId, epicId, userId);

    if (dto.name !== undefined) epic.name = dto.name;
    if (dto.description !== undefined) epic.description = dto.description;
    if (dto.startDate !== undefined) epic.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) epic.endDate = dto.endDate ? new Date(dto.endDate) : null;

    return this.epicRepository.save(epic);
  }

  async remove(projectId: string, epicId: string, userId: string) {
    await this.findById(projectId, epicId, userId);
    await this.epicRepository.delete(epicId);
    return { message: 'Epic deleted successfully' };
  }

  private async assertProjectMember(projectId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }
  }
}
