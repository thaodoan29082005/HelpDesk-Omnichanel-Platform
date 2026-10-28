import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTicketDto } from '../tickets/dto/create-ticket.dto.js';
import { WebformService } from './webform.service.js';

@ApiTags('Web Form')
@Controller('webform')
export class WebformController {
  constructor(
    private readonly webformService: WebformService,
  ) {}

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tiếp nhận yêu cầu hỗ trợ từ Web Form',
  })
  async submit(
    @Body(new ValidationPipe({
      whitelist: true,
      transform: true,
    }))
    dto: CreateTicketDto,
  ) {
    return this.webformService.submit(dto);
  }
}
