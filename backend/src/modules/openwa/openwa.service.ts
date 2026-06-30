import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenWaService {
  private readonly logger = new Logger(OpenWaService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('OPENWA_API_URL', 'http://localhost:8080');
    this.apiKey = this.configService.get<string>('OPENWA_API_KEY', '');
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    try {
      const url = `${this.apiUrl}/api/send-text`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({ phone, message }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send message to ${phone}: ${response.status} ${errorText}`);
        return false;
      }

      this.logger.log(`Message sent successfully to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending message to ${phone}:`, error);
      return false;
    }
  }

  async sendBulkMessages(
    messages: Array<{ phone: string; message: string }>
  ): Promise<void> {
    for (const msg of messages) {
      await this.sendMessage(msg.phone, msg.message);
      // Small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
