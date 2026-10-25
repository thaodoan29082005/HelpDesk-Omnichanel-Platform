
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { readFile, writeFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { NormalizedEmail } from './normalized-email.interface.js';
interface EmailSyncState {
  uidValidity: string | null;
  lastProcessedUid: number | null;
}
@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  // Hàm 1: Lấy cấu hình IMAP từ file .env
  getImapConfig() {
    return {
      host: this.configService.get<string>('EMAIL_IMAP_HOST'),
      port: Number(
        this.configService.get<string>('EMAIL_IMAP_PORT'),
      ),
      secure:
        this.configService.get<string>('EMAIL_IMAP_SECURE') === 'true',
      user: this.configService.get<string>('EMAIL_USER'),
    };
  }

  // Hàm 2: Kiểm tra kết nối Gmail qua IMAP
  async testImapConnection(): Promise<boolean> {
    const client = this.createImapClient();

    try {
      await client.connect();

      console.log('Kết nối Gmail IMAP thành công!');
      return true;
    } catch {
      console.error('Kết nối Gmail IMAP thất bại.');
      return false;
    } finally {
      await this.closeImapClient(client);
    }
  }

  // Hàm 3: Đọc thông tin tối đa 5 email cuối trong INBOX
  async readInboxEmails() {
    const client = this.createImapClient();

    try {
      // Bước 1: Kết nối Gmail
      await client.connect();

      // Bước 2: Mở hộp thư INBOX
      const lock = await client.getMailboxLock('INBOX');

      try {
        const mailbox = client.mailbox;

        if (!mailbox) {
          throw new Error('Không thể mở hộp thư INBOX');
        }

        // Bước 3: Lấy tổng số email
        const total = mailbox.exists;

        if (total === 0) {
          console.log('Hộp thư INBOX hiện không có email.');
          return [];
        }

        // Bước 4: Xác định tối đa 5 email cuối
        const start = Math.max(1, total - 4);

        const emails: {
          uid: number;
          subject: string;
          from: string;
          date: Date | null;
        }[] = [];

        // Bước 5: Đọc thông tin email
        for await (const message of client.fetch(
          `${start}:${total}`,
          {
            envelope: true,
            uid: true,
          },
        )) {
          const rawDate = message.envelope?.date;
          const date = rawDate == null ? null : new Date(rawDate);

          emails.push({
            uid: message.uid,
            subject:
              message.envelope?.subject ?? '(Không có tiêu đề)',
            from:
              message.envelope?.from?.[0]?.address ??
              '(Không rõ người gửi)',
            date: date && !Number.isNaN(date.getTime()) ? date : null,
          });
        }

        return emails;
      } finally {
        // Bước 6: Giải phóng khóa INBOX
        lock.release();
      }
    } finally {
      // Bước 7: Đóng kết nối IMAP
      await this.closeImapClient(client);
    }
  }
  
  // Hàm 4: Đọc nội dung của một email theo UID
  async readEmailContent(uid: number) {
    if (!Number.isSafeInteger(uid) || uid <= 0) {
      throw new Error('UID email không hợp lệ');
    }

    const client = this.createImapClient();

    try {
      // Kết nối Gmail bằng IMAP
      await client.connect();

      // Mở hộp thư INBOX
      const lock = await client.getMailboxLock('INBOX');

      try {
        // Tìm email theo UID và lấy dữ liệu gốc
        const message = await client.fetchOne(
          uid,
          { source: true },
          { uid: true },
        );

        if (!message || !message.source) {
          throw new Error('Không tìm thấy email trong INBOX');
        }

        // Phân tích dữ liệu email bằng mailparser
        const parsed = await simpleParser(message.source);

        // Trả về thông tin cần thiết
        return {
          uid: uid,
          messageId: parsed.messageId ?? null,
          subject: parsed.subject ?? '(Không có tiêu đề)',
          from: parsed.from?.value?.[0]?.address ?? '',
          text: parsed.text ?? '',
          date: parsed.date ?? null,
        };
      } finally {
        // Giải phóng khóa hộp thư
        lock.release();
      }
    } finally {
      // Đóng kết nối Gmail
      await this.closeImapClient(client);
    }
  }
  
  // Chuẩn hóa email thành dữ liệu dùng cho Ticket Service
  async normalizeEmail(uid: number): Promise<NormalizedEmail> {
    // Đọc nội dung email từ Gmail
    const email = await this.readEmailContent(uid);

    // Lấy địa chỉ email người gửi
    const fromEmail = email.from?.trim() ?? '';

    // Không xử lý email thiếu người gửi
    if (!fromEmail) {
      throw new Error(
        `Email UID ${uid} không có thông tin người gửi`,
      );
    }

    return {
      messageId: email.messageId?.trim() || null,
      subject: email.subject?.trim() || '(Không có tiêu đề)',
      fromEmail,
      content: email.text?.trim() || '',
      receivedAt: email.date ?? null,
      imapUid: uid,
      channel: 'EMAIL',
    };
  }

  // Tự động kiểm tra Gmail mỗi 1 phút
  private isCheckingEmail = false;
  

  
  
  //@Cron(CronExpression.EVERY_MINUTE)
  async checkNewEmailsAutomatically(): Promise<void> {
    // Tránh chạy chồng hai lần kiểm tra
    if (this.isCheckingEmail) {
      return;
    }

    this.isCheckingEmail = true;

    try {
      // Đọc trạng thái đã lưu từ JSON
      const state = await this.loadEmailSyncState();

      // Lấy UIDVALIDITY và mốc UID hiện tại từ Gmail
      const inboxInfo = await this.getInboxSyncInfo();

      // Lần chạy đầu tiên: bỏ qua email cũ (phương án A)
      if (
        state.uidValidity === null &&
        state.lastProcessedUid === null
      ) {
        await this.saveEmailSyncState({
          uidValidity: inboxInfo.uidValidity,
          lastProcessedUid: inboxInfo.lastUid,
        });

        console.log(
          `[EMAIL AUTO CHECK] Khởi tạo trạng thái: UID ${inboxInfo.lastUid}`,
        );

        return;
      }

      // Không tự đặt lại trạng thái khi UIDVALIDITY thay đổi
      if (state.uidValidity !== inboxInfo.uidValidity) {
        throw new Error(
          'UIDVALIDITY đã thay đổi. Cần kiểm tra trạng thái đồng bộ.',
        );
      }

      if (state.lastProcessedUid === null) {
        throw new Error('Trạng thái UID chưa hợp lệ');
      }

      // Tìm các email mới
      const newUids = await this.getNewEmailUids(
        state.lastProcessedUid,
      );

      if (newUids.length === 0) {
        console.log('[EMAIL AUTO CHECK] Không có email mới.');
        return;
      }

      console.log(
        `[EMAIL AUTO CHECK] Phát hiện ${newUids.length} email mới.`,
      );

      // Xử lý lần lượt từng email
      for (const uid of newUids) {
        const email = await this.normalizeEmail(uid);

        console.log('[EMAIL NORMALIZED]', {
            imapUid: email.imapUid,
            messageIdPresent: email.messageId !== null,
            subjectPresent: email.subject.length > 0,
            fromEmailPresent: email.fromEmail.length > 0,
            contentLength: email.content.length,
            receivedAt: email.receivedAt,
            channel: email.channel,
     });

        // Chỉ cập nhật UID sau khi đọc email thành công
        await this.saveEmailSyncState({
          uidValidity: state.uidValidity,
          lastProcessedUid: uid,
        });
      }
    } catch (error) {
      console.error(
        '[EMAIL AUTO CHECK] Lỗi đồng bộ:',
        error instanceof Error
          ? error.message
          : 'Lỗi không xác định',
      );
    } finally {
      this.isCheckingEmail = false;
    }
  }

  // Lấy UID của các email có UID lớn hơn lastUid
  async getNewEmailUids(lastUid: number): Promise<number[]> {
    if (!Number.isSafeInteger(lastUid) || lastUid < 0) {
      throw new Error('lastUid không hợp lệ');
    }

    const client = this.createImapClient();

    try {
      await client.connect();

      const lock = await client.getMailboxLock('INBOX');

      try {
        const messages = client.fetch(
          `${lastUid + 1}:*`,
          { uid: true },
          { uid: true },
        );

        const uids: number[] = [];

        for await (const message of messages) {
          if (message.uid > lastUid) {
            uids.push(message.uid);
          }
        }

        return uids.sort((a, b) => a - b);
      } finally {
        lock.release();
      }
    } finally {
      await this.closeImapClient(client);
    }
  }
  
  // Gửi email thông qua Gmail SMTP
  async sendEmail(
    to: string,
    subject: string,
    text: string,
  ): Promise<string> {
    const host = this.configService.get<string>('EMAIL_SMTP_HOST');
    const port = Number(
      this.configService.get<string>('EMAIL_SMTP_PORT'),
    );
    const secure =
      this.configService.get<string>('EMAIL_SMTP_SECURE') === 'true';

    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASSWORD');
    const from = this.configService.get<string>('EMAIL_FROM');

    // Kiểm tra cấu hình SMTP
    if (
      !host ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      !user ||
      !pass ||
      !from
    ) {
      throw new Error('Cấu hình SMTP chưa đầy đủ hoặc không hợp lệ');
    }

    if (!to?.trim() || !subject?.trim()) {
      throw new Error('Thiếu người nhận hoặc tiêu đề email');
    }

    // Tạo kết nối SMTP
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    // Gửi email
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });

    return info.messageId;
  }
  
  // Đọc trạng thái đồng bộ email từ file JSON
  private async loadEmailSyncState(): Promise<EmailSyncState> {
    const filePath = join(
      process.cwd(),
      'data',
      'email-sync-state.json',
    );

    const fileContent = await readFile(filePath, 'utf8');

    const state: unknown = JSON.parse(fileContent);

    // Kiểm tra cấu trúc dữ liệu trước khi sử dụng
    if (
      typeof state !== 'object' ||
      state === null ||
      !('uidValidity' in state) ||
      !('lastProcessedUid' in state)
    ) {
      throw new Error('File trạng thái email không hợp lệ');
    }

    const { uidValidity, lastProcessedUid } = state;

    if (
      !(
        uidValidity === null ||
        typeof uidValidity === 'string'
      ) ||
      !(
        lastProcessedUid === null ||
        (
          typeof lastProcessedUid === 'number' &&
          Number.isSafeInteger(lastProcessedUid) &&
          lastProcessedUid >= 0
        )
      )
    ) {
      throw new Error('Dữ liệu trạng thái email không hợp lệ');
    }

    return {
      uidValidity,
      lastProcessedUid,
    };
  }
  
  // Lưu trạng thái đồng bộ IMAP vào file JSON
  private async saveEmailSyncState(
    state: EmailSyncState,
  ): Promise<void> {
    const filePath = join(
      process.cwd(),
      'data',
      'email-sync-state.json',
    );

    const tempPath = `${filePath}.tmp`;

    const content = JSON.stringify(state, null, 2);

    try {
      // Ghi trạng thái mới vào file tạm
      await writeFile(tempPath, content, 'utf8');

      // Thay thế file chính bằng file tạm
      await rename(tempPath, filePath);
    } catch (error) {
      // Dọn file tạm nếu quá trình ghi thất bại
      await rm(tempPath, { force: true }).catch(() => undefined);

      throw error;
    }
  }
  
  // Lấy thông tin đồng bộ của hộp thư INBOX
  async getInboxSyncInfo(): Promise<{
    uidValidity: string;
    lastUid: number;
  }> {
    const client = this.createImapClient();

    try {
      await client.connect();

      const lock = await client.getMailboxLock('INBOX');

      try {
        const mailbox = client.mailbox;

        if (!mailbox) {
          throw new Error('Không thể mở hộp thư INBOX');
        }

        // UIDVALIDITY của hộp thư
        const uidValidity = String(mailbox.uidValidity);

        // UID tiếp theo mà máy chủ dự kiến cấp
        const uidNext = mailbox.uidNext;

        if (
          !uidValidity ||
          uidValidity === 'undefined' ||
          !Number.isSafeInteger(uidNext) ||
          uidNext < 1
        ) {
          throw new Error('Thông tin đồng bộ INBOX không hợp lệ');
        }

        return {
          uidValidity,
          lastUid: uidNext - 1,
        };
      } finally {
        lock.release();
      }
    } finally {
      await this.closeImapClient(client);
    }
  }

  // Hàm hỗ trợ: Tạo kết nối IMAP
  private createImapClient(): ImapFlow {
    const host =
      this.configService.getOrThrow<string>('EMAIL_IMAP_HOST');

    const port = Number(
      this.configService.getOrThrow<string>('EMAIL_IMAP_PORT'),
    );

    const secure =
      this.configService.get<string>('EMAIL_IMAP_SECURE') === 'true';

    const user =
      this.configService.getOrThrow<string>('EMAIL_USER');

    const pass =
      this.configService.getOrThrow<string>('EMAIL_PASSWORD');

    return new ImapFlow({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      logger: false,
    });
  }

  // Hàm hỗ trợ: Đóng kết nối IMAP
  private async closeImapClient(client: ImapFlow): Promise<void> {
    if (client.usable) {
      await client.logout();
    } else {
      client.close();
    }
  }
}
