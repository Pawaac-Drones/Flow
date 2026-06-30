import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Headers,
  UnauthorizedException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { MessageHandlerService } from './handlers/message-handler.service';

interface OpenWaWebhookPayload {
  event: string;
  data: {
    from: string;
    body: string;
    id?: string;
    timestamp?: number;
  };
}

@Controller('openwa')
export class OpenWaController {
  private readonly logger = new Logger(OpenWaController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly messageHandler: MessageHandlerService,
    private readonly configService: ConfigService,
  ) {
    this.webhookSecret = this.configService.get<string>('OPENWA_WEBHOOK_SECRET', '');
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: OpenWaWebhookPayload,
    @Headers('x-webhook-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ status: string }> {
    // Verify webhook signature using HMAC
    if (!this.webhookSecret) {
      this.logger.error('OPENWA_WEBHOOK_SECRET is not configured - rejecting webhook');
      throw new UnauthorizedException('Webhook secret not configured');
    }

    if (!signature) {
      this.logger.warn('Webhook request missing x-webhook-signature header');
      throw new UnauthorizedException('Missing webhook signature');
    }

    const rawBody = req.rawBody || Buffer.from(JSON.stringify(payload));
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      this.logger.warn('Webhook signature verification failed: length mismatch');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
      this.logger.warn('Webhook signature verification failed');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(`Received webhook event: ${payload.event}`);

    if (payload.event !== 'message.received') {
      this.logger.debug(`Ignoring non-message event: ${payload.event}`);
      return { status: 'ignored' };
    }

    const { from, body } = payload.data;

    if (!from || !body) {
      this.logger.warn('Received message with missing from or body');
      return { status: 'invalid' };
    }

    // Extract phone number from WhatsApp ID (e.g., '919876543210@c.us' -> '919876543210')
    const phoneNumber = from.replace('@c.us', '').replace('@s.whatsapp.net', '');

    await this.messageHandler.handleIncomingMessage(phoneNumber, body.trim());

    return { status: 'processed' };
  }
}
