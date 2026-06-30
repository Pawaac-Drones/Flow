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
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('projects/:projectId/tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.create(projectId, taskId, createCommentDto, user.id);
  }

  @Get()
  async findAll(
    @Param('taskId') taskId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.commentsService.findAll(taskId, paginationDto);
  }

  @Put(':commentId')
  async update(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.update(commentId, updateCommentDto, user.id);
  }

  @Delete(':commentId')
  async remove(
    @Param('commentId') commentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.remove(commentId, user.id);
  }
}
