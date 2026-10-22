import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { Ticket } from './ticket.entity.js';

@Entity('channels')
export class Channel {
    @PrimaryGeneratedColumn('uuid')
    channel_id: string;

    @Column({ type: 'varchar', length: 50 })
    channel_name: string; // Web Form, Email, Telegram

    @Column({ type: 'varchar', length: 20 })
    channel_type: string;

    @Column({ type: 'text', nullable: true })
    config_json: string | null;

    @OneToMany(() => Ticket, (ticket) => ticket.channel)
    tickets: Relation<Ticket>[];
}
