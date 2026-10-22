import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from './user.entity.js';
import { Ticket } from './ticket.entity.js';

@Entity('teams')
export class Team {
    @PrimaryGeneratedColumn('uuid')
    team_id: string;

    @Column({ type: 'varchar', length: 100 })
    team_name: string;

    @Column({ type: 'uuid', nullable: true })
    manager_id: string | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'manager_id' })
    manager: Relation<User> | null;

    @OneToMany(() => User, (user) => user.team)
    members: Relation<User>[];

    @OneToMany(() => Ticket, (ticket) => ticket.team)
    tickets: Relation<Ticket>[];
}
