
export interface NormalizedEmail {
  messageId: string | null;
  subject: string;
  fromEmail: string;
  content: string;
  receivedAt: Date | null;
  imapUid: number;
  channel: 'EMAIL';
}
