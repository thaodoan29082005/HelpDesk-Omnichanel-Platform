import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Ticket } from './ticket.entity.js';
import { User } from './user.entity.js';

@Entity('ticket_messages')
export class TicketMessage {
    @PrimaryGeneratedColumn('uuid')
    message_id: string;

    @Column({ type: 'uuid' })
    ticket_id: string;

    @Column({ type: 'uuid', nullable: true })
    sender_id: string | null;

    @Column({ type: 'varchar', length: 20 })
    sender_type: string; // customer, agent, system, ai

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'text', nullable: true })
    attachments: string | null;

    @Column({ type: 'boolean', default: false })
    is_ai_draft: boolean;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @ManyToOne(() => Ticket, (ticket) => ticket.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticket_id' })
    ticket: Relation<Ticket>;

    @ManyToOne(() => User, (user) => user.messages, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'sender_id' })
    sender: Relation<User> | null;
}
