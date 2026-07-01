import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Delivers notification emails via SMTP using nodemailer.
 *
 * The service is intentionally resilient: if SMTP is not configured (no
 * SMTP_HOST), it logs a warning once and becomes a no-op so that core
 * notification creation never fails because of missing mail configuration.
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;
  private enabled = false;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.get<string>(
      'SMTP_FROM',
      'PawaacFlow <noreply@pawaacflow.local>',
    );
  }

  onModuleInit(): void {
    const host = this.configService.get<string>('SMTP_HOST');

    if (!host) {
      this.logger.warn(
        'SMTP_HOST is not configured - email notifications are disabled (in-app + WebSocket only).',
      );
      return;
    }

    const port = parseInt(
      this.configService.get<string>('SMTP_PORT', '587'),
      10,
    );
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
      this.enabled = true;
      this.logger.log(
        `Email notifications enabled via SMTP host ${host}:${port}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to initialize SMTP transporter',
        error as Error,
      );
      this.transporter = null;
      this.enabled = false;
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Send an email. Returns true if dispatched, false if skipped or failed.
   * Never throws - failures are logged so the caller's flow is unaffected.
   */
  async sendEmail(params: SendEmailParams): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      this.logger.debug(
        `Skipping email to ${params.to} ("${params.subject}") - SMTP not configured`,
      );
      return false;
    }

    if (!params.to) {
      this.logger.warn('Skipping email - no recipient address provided');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      this.logger.debug(`Email sent to ${params.to}: ${params.subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${params.to}`, error as Error);
      return false;
    }
  }
}
