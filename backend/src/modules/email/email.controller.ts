
import { Controller, Get, Post } from '@nestjs/common';
import { EmailService } from './email.service.js';

@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
  ) {}

  @Get('test-connection')
  async testConnection() {
    const connected =
      await this.emailService.testImapConnection();

    return {
      status: connected ? 'connected' : 'disconnected',
      message: connected
        ? 'Kết nối Gmail IMAP thành công'
        : 'Không thể kết nối Gmail IMAP',
    };
  }

  // Chỉ dùng để kiểm thử đồng bộ Email -> Ticket.
  // Phải bảo vệ hoặc gỡ endpoint này trước khi triển khai.
  @Post('sync')
  async syncEmails() {
    await this.emailService.checkNewEmailsAutomatically();

    return {
      message: 'Đã thực hiện yêu cầu đồng bộ Email',
    };
  }
}
