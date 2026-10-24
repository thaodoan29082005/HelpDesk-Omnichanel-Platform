import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    Ticket,
    User,
    Role,
    Channel,
    TicketMessage,
    TicketStatusHistory,
} from '../../database/entities/index.js';
import { TicketsService } from './tickets.service.js';
import { TicketsController } from './tickets.controller.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Ticket,
            User,
            Role,
            Channel,
            TicketMessage,
            TicketStatusHistory,
        ]),
    ],
    controllers: [TicketsController],
    providers: [TicketsService],
    exports: [TicketsService],
})
export class TicketsModule { }
