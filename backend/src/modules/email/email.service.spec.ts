import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ImapFlow } from 'imapflow';
import { EmailService } from './email.service.js';
import { TicketsService } from '../tickets/tickets.service.js';
import { EmailProcessedMessage } from './email-processed.entity.js';

vi.mock('imapflow', () => ({
  ImapFlow: vi.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn(),
            getOrThrow: vi.fn((key: string) => {
              const config: Record<string, string> = {
                EMAIL_IMAP_HOST: 'imap.example.com',
                EMAIL_IMAP_PORT: '993',
                EMAIL_USER: 'test@example.com',
                EMAIL_PASSWORD: 'test-password',
              };
              return config[key];
            }),
          },
        },
        {
          provide: TicketsService,
          useValue: {
            createFromWebForm: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(EmailProcessedMessage),
          useValue: {
            findOne: vi.fn(),
            save: vi.fn(),
            update: vi.fn(),
            createQueryBuilder: vi.fn(() => ({
              insert: vi.fn().mockReturnThis(),
              values: vi.fn().mockReturnThis(),
              orIgnore: vi.fn().mockReturnThis(),
              returning: vi.fn().mockReturnThis(),
              execute: vi.fn().mockResolvedValue({
                raw: [{ id: 'test-id' }],
                identifiers: [{ id: 'test-id' }],
              }),
            })),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: vi.fn(async (cb) => {
              const mockManager = {
                getRepository: vi.fn(() => ({
                  createQueryBuilder: vi.fn(() => ({
                    insert: vi.fn().mockReturnThis(),
                    values: vi.fn().mockReturnThis(),
                    orIgnore: vi.fn().mockReturnThis(),
                    returning: vi.fn().mockReturnThis(),
                    execute: vi.fn().mockResolvedValue({
                      raw: [{ id: 'test-id' }],
                      identifiers: [{ id: 'test-id' }],
                    }),
                  })),
                  update: vi.fn(),
                })),
              };
              return cb(mockManager);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each([
    ['2026-01-01T00:00:00.000Z', new Date('2026-01-01T00:00:00.000Z')],
    [
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    ],
    [undefined, null],
    ['invalid-date', null],
  ])('normalizes inbox date %s', async (rawDate, expectedDate) => {
    const release = vi.fn();
    const client = {
      connect: vi.fn().mockResolvedValue(undefined),
      getMailboxLock: vi.fn().mockResolvedValue({ release }),
      mailbox: { exists: 1 },
      fetch: vi.fn(async function* () {
        yield { uid: 1, envelope: { date: rawDate } };
      }),
      usable: true,
      logout: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(ImapFlow).mockImplementation(function () {
      return client as unknown as ImapFlow;
    });

    const emails = await service.readInboxEmails();

    expect(emails).toEqual([
      expect.objectContaining({ uid: 1, date: expectedDate }),
    ]);
    expect(release).toHaveBeenCalledTimes(1);
    expect(client.logout).toHaveBeenCalledTimes(1);
  });
});
