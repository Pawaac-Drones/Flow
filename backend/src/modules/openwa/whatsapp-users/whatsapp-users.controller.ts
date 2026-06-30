import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WhatsappUsersService } from './whatsapp-users.service';
import { LinkWhatsappDto } from './dto/link-whatsapp.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../auth/decorators/current-user.decorator';
import { WhatsappUser } from '../../../entities/whatsapp-user.entity';

interface WhatsappUserView {
  id: string;
  phoneNumber: string;
  isVerified: boolean;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string;
  verificationCode: string | null;
  createdAt: Date;
}

@Controller('openwa/whatsapp-users')
@UseGuards(JwtAuthGuard)
export class WhatsappUsersController {
  constructor(private readonly whatsappUsersService: WhatsappUsersService) {}

  private toView(entity: WhatsappUser): WhatsappUserView {
    return {
      id: entity.id,
      phoneNumber: entity.phoneNumber,
      isVerified: entity.isVerified,
      dailyDigestEnabled: entity.dailyDigestEnabled,
      dailyDigestTime: entity.dailyDigestTime,
      // Only surface the code while the number is still pending verification
      verificationCode: entity.isVerified ? null : entity.verificationCode,
      createdAt: entity.createdAt,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async link(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: LinkWhatsappDto,
  ): Promise<WhatsappUserView> {
    const linked = await this.whatsappUsersService.linkNumber(user.id, dto.phoneNumber);
    return this.toView(linked);
  }

  @Get('me')
  async listMine(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<WhatsappUserView[]> {
    const numbers = await this.whatsappUsersService.findForUser(user.id);
    return numbers.map((n) => this.toView(n));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async unlink(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.whatsappUsersService.unlink(user.id, id);
  }
}
