import {
  Controller,
  Post,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DigestService } from './digest.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('openwa/digest')
@UseGuards(JwtAuthGuard)
export class DigestController {
  constructor(private readonly digestService: DigestService) {}

  @Post('opt-in')
  @HttpCode(HttpStatus.OK)
  async optIn(
    @Request() req: { user: { id: string } },
  ): Promise<{ success: boolean; message: string }> {
    await this.digestService.optIn(req.user.id);
    return {
      success: true,
      message:
        'You have opted in to the daily digest. You will receive a summary of your pending tasks every morning via WhatsApp.',
    };
  }

  @Delete('opt-out')
  @HttpCode(HttpStatus.OK)
  async optOut(
    @Request() req: { user: { id: string } },
  ): Promise<{ success: boolean; message: string }> {
    await this.digestService.optOut(req.user.id);
    return {
      success: true,
      message:
        'You have opted out of the daily digest. You will no longer receive morning summaries.',
    };
  }
}
