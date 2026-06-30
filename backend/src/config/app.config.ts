import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  openwa: {
    apiUrl: process.env.OPENWA_API_URL || 'http://openwa:8080',
    apiKey: process.env.OPENWA_API_KEY || '',
    webhookSecret: process.env.OPENWA_WEBHOOK_SECRET || '',
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'PawaacFlow <noreply@example.com>',
  },
}));
