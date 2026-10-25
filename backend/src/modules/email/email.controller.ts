import { Controller, Get } from '@nestjs/common';
import { EmailService } from './email.service.js';

@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
  ) {}

  @Get('test-connection')
  async testConnection() {
    const connected = await this.emailService.testImapConnection();

    return {
      status: connected ? 'connected' : 'disconnected',
      message: connected
        ? 'Kết nối Gmail IMAP thành công'
        : 'Không thể kết nối Gmail IMAP',
    };
  }
}