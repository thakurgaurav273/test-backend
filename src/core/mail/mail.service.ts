import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { Env } from '../../config/env';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export type MailResult = { ok: true } | { ok: false; error: string };

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService<Env, true>) {
    const host = config.get('SMTP_HOST', { infer: true });
    const user = config.get('SMTP_USER', { infer: true });
    this.from = config.get('MAIL_FROM', { infer: true });
    this.transporter = host
      ? createTransport({
          host,
          port: config.get('SMTP_PORT', { infer: true }),
          secure: config.get('SMTP_SECURE', { infer: true }),
          auth: user
            ? { user, pass: config.get('SMTP_PASS', { infer: true }) }
            : undefined,
        })
      : null;

    if (!this.transporter)
      this.logger.warn('SMTP_HOST not set; outgoing email is disabled');
  }

  /** Never throws: callers record whether the email went out. */
  async send(message: MailMessage): Promise<MailResult> {
    if (!this.transporter)
      return { ok: false, error: 'Email is not configured on the server' };
    try {
      await this.transporter.sendMail({ from: this.from, ...message });
      return { ok: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email "${message.subject}": ${reason}`);
      return { ok: false, error: reason };
    }
  }
}
