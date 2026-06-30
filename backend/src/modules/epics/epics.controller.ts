import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EpicsService } from './epics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateEpicDto } from './dto/create-epic.dto';
import { UpdateEpicDto } from './dto/update-epic.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('projects/:projectId/epics')
@UseGuards(JwtAuthGuard)
export class EpicsController {
  constructor(private readonly epicsService: EpicsService) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() createEpicDto: CreateEpicDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.epicsService.create(projectId, createEpicDto, user.id);
  }

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.epicsService.findAll(projectId, user.id, paginationDto);
  }

  @Get(':epicId')
  async findById(
    @Param('projectId') projectId: string,
    @Param('epicId') epicId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.epicsService.findById(projectId, epicId, user.id);
  }

  @Put(':epicId')
  async update(
    @Param('projectId') projectId: string,
    @Param('epicId') epicId: string,
    @Body() updateEpicDto: UpdateEpicDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.epicsService.update(projectId, epicId, updateEpicDto, user.id);
  }

  @Delete(':epicId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('epicId') epicId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.epicsService.remove(projectId, epicId, user.id);
  }
}
