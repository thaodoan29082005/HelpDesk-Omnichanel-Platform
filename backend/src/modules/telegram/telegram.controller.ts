
import {Body,Controller,Headers,HttpCode,Post,UnauthorizedException,} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { TelegramService } from './telegram.service.js';
@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-telegram-bot-api-secret-token')
    receivedToken: string | undefined,
    @Body() update: unknown,
  ) {
    const secretToken =
      this.configService.getOrThrow<string>(
        'TELEGRAM_WEBHOOK_SECRET',
      );

    const expected = Buffer.from(secretToken);
    const received = Buffer.from(receivedToken ?? '');

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      throw new UnauthorizedException(
        'Telegram webhook secret không hợp lệ',
      );
    }
    await this.telegramService.handleUpdate( // 
      update as Parameters<TelegramService['handleUpdate']>[0],
    );
    
    return { ok: true };
  }
}
