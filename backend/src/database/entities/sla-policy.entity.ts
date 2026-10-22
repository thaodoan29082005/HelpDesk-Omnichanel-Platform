import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { Ticket } from './ticket.entity.js';

@Entity('sla_policies')
export class SlaPolicy {
    @PrimaryGeneratedColumn('uuid')
    sla_id: string;

    @Column({ type: 'varchar', length: 20 })
    priority: string; // urgent, high, medium, low

    @Column({ type: 'int', default: 0 })
    response_minutes: number;

    @Column({ type: 'int', default: 0 })
    resolution_minutes: number;

    @OneToMany(() => Ticket, (ticket) => ticket.sla)
    tickets: Relation<Ticket>[];
}
