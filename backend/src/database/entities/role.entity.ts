import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from './user.entity.js';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    role_id: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    role_name: string; // admin, manager, agent, customer

    @OneToMany(() => User, (user) => user.role)
    users: Relation<User>[];
}
