import { Module } from '@nestjs/common';
import { TicketsModule } from '../tickets/tickets.module.js';
import { EmailModule } from '../email/email.module.js';
import { WebformController } from './webform.controller.js';
import { WebformService } from './webform.service.js';

@Module({
  imports: [
    TicketsModule,
    EmailModule,
  ],
  controllers: [WebformController],
  providers: [WebformService],
})
export class WebformModule {}
