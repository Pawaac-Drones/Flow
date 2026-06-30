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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateStatusWorkflowDto } from './dto/create-status-workflow.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.projectsService.findAll(user.id, paginationDto);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.projectsService.findById(id, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.update(id, updateProjectDto, user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.projectsService.remove(id, user.id);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.addMember(id, addMemberDto, user.id);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.removeMember(id, userId, user.id);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.projectsService.getMembers(id);
  }

  @Post(':id/workflows')
  async createStatusWorkflow(
    @Param('id') id: string,
    @Body() dto: CreateStatusWorkflowDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.createStatusWorkflow(id, dto, user.id);
  }

  @Get(':id/workflows')
  async getStatusWorkflows(@Param('id') id: string) {
    return this.projectsService.getStatusWorkflows(id);
  }

  @Delete(':id/workflows/:workflowId')
  async deleteStatusWorkflow(
    @Param('id') id: string,
    @Param('workflowId') workflowId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.deleteStatusWorkflow(id, workflowId, user.id);
  }
}
