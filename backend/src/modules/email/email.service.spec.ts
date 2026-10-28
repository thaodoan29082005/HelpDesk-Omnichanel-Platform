import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ImapFlow } from 'imapflow';
import { EmailService } from './email.service';

jest.mock('imapflow', () => ({ ImapFlow: jest.fn() }));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
            getOrThrow: jest.fn((key: string) => {
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
    const release = jest.fn();
    const client = {
      connect: jest.fn().mockResolvedValue(undefined),
      getMailboxLock: jest.fn().mockResolvedValue({ release }),
      mailbox: { exists: 1 },
      fetch: jest.fn(async function* () {
        yield { uid: 1, envelope: { date: rawDate } };
      }),
      usable: true,
      logout: jest.fn().mockResolvedValue(undefined),
    };
    jest
      .mocked(ImapFlow)
      .mockImplementation(() => client as unknown as ImapFlow);

    const emails = await service.readInboxEmails();

    expect(emails).toEqual([
      expect.objectContaining({ uid: 1, date: expectedDate }),
    ]);
    expect(release).toHaveBeenCalledTimes(1);
    expect(client.logout).toHaveBeenCalledTimes(1);
  });
});
