import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Ticket } from './ticket.entity.js';
import { User } from './user.entity.js';

@Entity('ticket_status_history')
export class TicketStatusHistory {
    @PrimaryGeneratedColumn('uuid')
    history_id: string;

    @Column({ type: 'uuid' })
    ticket_id: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    old_status: string | null;

    @Column({ type: 'varchar', length: 20 })
    new_status: string;

    @Column({ type: 'uuid', nullable: true })
    changed_by: string | null;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    changed_at: Date;

    @ManyToOne(() => Ticket, (ticket) => ticket.status_history, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticket_id' })
    ticket: Relation<Ticket>;

    @ManyToOne(() => User, (user) => user.status_changes, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'changed_by' })
    changer: Relation<User> | null;
}
