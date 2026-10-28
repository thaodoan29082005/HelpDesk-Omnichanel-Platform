import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_processed_messages')
@Index(
  'UQ_email_mailbox_uid',
  ['mailbox', 'uidValidity', 'imapUid'],
  { unique: true },
)
export class EmailProcessedMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mailbox', type: 'varchar', length: 255 })
  mailbox: string;

  @Column({ name: 'uid_validity', type: 'varchar', length: 100 })
  uidValidity: string;

  @Column({ name: 'imap_uid', type: 'integer' })
  imapUid: number;

  @Column({ name: 'message_id', type: 'varchar', length: 500, nullable: true })
  messageId: string | null;

  @Column({ name: 'ticket_id', type: 'uuid', nullable: true })
  ticketId: string | null;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'processing' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
