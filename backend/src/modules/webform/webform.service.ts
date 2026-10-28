
import { Injectable, Logger } from '@nestjs/common';
import { TicketsService } from '../tickets/tickets.service.js';
import { CreateTicketDto } from '../tickets/dto/create-ticket.dto.js';
import { EmailService } from '../email/email.service.js';
import { WEBFORM_CONFIG } from './webform.config.js';
import { buildWebformConfirmationEmail } from './webform-email.template.js';

@Injectable()
export class WebformService {
  private readonly logger = new Logger(WebformService.name);

  constructor(
    private readonly ticketsService: TicketsService,
    private readonly emailService: EmailService,
  ) {}

  async submit(dto: CreateTicketDto) {
    // Web Form luôn thuộc kênh web,
    // không lấy channel_type từ người gửi.
    const ticket = await this.ticketsService.createFromWebForm({
      ...dto,
      channel_type: WEBFORM_CONFIG.channelType,
    });

    let confirmationEmailSent = false;

    if (WEBFORM_CONFIG.confirmationEmail.enabled) {
      const html = buildWebformConfirmationEmail(
        dto.customer_name,
        ticket.ticket_code,
      );

      const text = [
        `Xin chào ${dto.customer_name},`,
        '',
        'Chúng tôi đã tiếp nhận yêu cầu hỗ trợ của bạn.',
        `Mã yêu cầu: ${ticket.ticket_code}`,
        'Đội ngũ hỗ trợ sẽ phản hồi trong thời gian sớm nhất.',
        '',
        'Trân trọng,',
        'Đội ngũ HelpDesk',
      ].join('\n');

      try {
        await this.emailService.sendEmail(
          dto.customer_email,
          WEBFORM_CONFIG.confirmationEmail.subject,
          text,
          html,
        );

        confirmationEmailSent = true;
      } catch (error) {
        // Ticket đã được tạo, không báo lỗi tạo Ticket
        // chỉ vì gửi email xác nhận thất bại.
        this.logger.error(
          `Không gửi được email xác nhận cho Ticket ${ticket.ticket_code}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return {
      success: true,
      message: 'Yêu cầu hỗ trợ đã được tiếp nhận',
      ticketId: ticket.ticket_id,
      ticketCode: ticket.ticket_code,
      confirmationEmailSent,
    };
  }
}
