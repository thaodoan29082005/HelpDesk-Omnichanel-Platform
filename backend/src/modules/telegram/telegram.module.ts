import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TicketsModule } from '../tickets/tickets.module.js';
import { TelegramController } from './telegram.controller.js';
import { TelegramService } from './telegram.service.js';
import { TelegramProcessedUpdate } from './telegram-processed-update.entity.js';

@Module({
  imports: [
    ConfigModule,
    TicketsModule,
    TypeOrmModule.forFeature([TelegramProcessedUpdate]),
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
