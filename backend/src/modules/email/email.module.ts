import { Module } from '@nestjs/common';
import { EmailService } from './email.service.js';
import { EmailController } from './email.controller.js';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule],
  providers: [EmailService],
  controllers: [EmailController],
})
export class EmailModule {}
